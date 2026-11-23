"""
Workflow lifecycle tests: status transitions, the status/cancel API and the
Celery pipeline's handling of progress, failure and cancel/complete races.

They use an in-memory SQLite database (like tests/test_auth.py), so they need
``aiosqlite``. SQLite cannot render PostgreSQL's JSONB, so it is compiled as
plain JSON for the duration of these tests.

Race conditions are exercised deterministically: each test fixes the order in
which "worker completes" and "user cancels" reach the database, and asserts
that whichever got there first wins and the other cannot overwrite it. The
guarantee itself comes from the single-statement conditional UPDATEs in
app.services.workflow_transitions.
"""

import uuid
from types import SimpleNamespace

import pytest
from fastapi import FastAPI, HTTPException
from httpx import ASGITransport, AsyncClient
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.pool import StaticPool

from app.api.v1.endpoints import workflows as workflows_endpoint
from app.core.database import Base
from app.core.deps import get_current_user, get_db
from app.core.exceptions import http_exception_handler
from app.models.image import Image, Workflow
from app.models.user import User
from app.services import workflow_transitions as transitions
from app.workers import pipeline

pytestmark = pytest.mark.anyio


@compiles(JSONB, "sqlite")
def _jsonb_as_json_on_sqlite(element, compiler, **kw):
    return "JSON"


@pytest.fixture
def anyio_backend():
    return "asyncio"


# --------------------------------------------------------------------------- #
# Fixtures / helpers
# --------------------------------------------------------------------------- #

@pytest.fixture
async def session_factory():
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(
            lambda sync_conn: Base.metadata.create_all(
                sync_conn,
                tables=[User.__table__, Image.__table__, Workflow.__table__],
            )
        )
    yield async_sessionmaker(engine, expire_on_commit=False)
    await engine.dispose()


async def make_workflow(factory, *, status="pending", user=None, config=None, **columns):
    """Insert user (unless given) + image + workflow; return (user, workflow_id)."""
    async with factory() as session:
        if user is None:
            suffix = uuid.uuid4().hex[:8]
            user = User(
                email=f"{suffix}@example.com",
                username=f"user_{suffix}",
                password_hash="x",
                credits_remaining=10,
            )
            session.add(user)
            await session.flush()
        image = Image(
            user_id=user.id,
            filename="photo.png",
            original_url="https://res.cloudinary.com/test/original/photo.png",
            width=8,
            height=8,
            format="png",
            size_bytes=1,
        )
        session.add(image)
        await session.flush()
        workflow = Workflow(
            image_id=image.id,
            config=config or [{"plugin": "denoise", "params": {}}],
            status=status,
            total_credits=3,
            **columns,
        )
        session.add(workflow)
        await session.commit()
        return user, workflow.id


async def load(factory, workflow_id):
    async with factory() as session:
        return await session.get(Workflow, workflow_id)


class FakeControl:
    def __init__(self):
        self.revoked = []

    def revoke(self, task_id, **kwargs):
        self.revoked.append((task_id, kwargs))


@pytest.fixture
def celery_control(monkeypatch):
    control = FakeControl()
    monkeypatch.setattr(
        workflows_endpoint, "celery_app", SimpleNamespace(control=control)
    )
    return control


def build_app(factory, user):
    app = FastAPI()
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.include_router(workflows_endpoint.router, prefix="/api/v1/workflows")

    async def override_db():
        async with factory() as session:
            yield session

    async def override_user():
        return user

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    return app


@pytest.fixture
async def api(session_factory, celery_control):
    """Factory: api(user) -> AsyncClient authenticated as that user."""
    clients = []

    async def make(user):
        client = AsyncClient(
            transport=ASGITransport(app=build_app(session_factory, user)),
            base_url="http://test",
        )
        clients.append(client)
        return client

    yield make
    for client in clients:
        await client.aclose()


# --------------------------------------------------------------------------- #
# Successful completion is visible through the API
# --------------------------------------------------------------------------- #

async def test_completed_workflow_exposes_status_output_and_100_percent(session_factory, api):
    user, wf_id = await make_workflow(session_factory)
    client = await api(user)

    async with session_factory() as db:
        assert await transitions.claim_for_processing(db, wf_id) is True
        assert await transitions.record_progress(
            db, wf_id, progress=0, current_stage=0, stages=[]
        ) is True
        assert await transitions.mark_completed(
            db, wf_id,
            output_url="https://res.cloudinary.com/test/processed/out.png",
            meta={"progress": 100, "current_stage": 0, "stages": [], "total_duration": 1.5},
        ) is True

    resp = await client.get(f"/api/v1/workflows/{wf_id}")
    body = resp.json()["data"]

    assert resp.status_code == 200
    assert resp.headers["cache-control"] == "no-store"
    assert body["status"] == "completed"
    assert body["progress"] == 100
    assert body["output_url"] == "https://res.cloudinary.com/test/processed/out.png"
    assert body["error"] is None
    assert body["completed_at"] is not None


async def test_already_completed_workflow_is_reported_on_first_request(session_factory, api):
    # A client that only asks after the fact must immediately see the result.
    user, wf_id = await make_workflow(
        session_factory,
        status="completed",
        output_url="https://res.cloudinary.com/test/processed/done.png",
    )
    client = await api(user)

    body = (await client.get(f"/api/v1/workflows/{wf_id}")).json()["data"]

    assert body["status"] == "completed"
    assert body["progress"] == 100
    assert body["output_url"].endswith("done.png")


async def test_processing_workflow_reports_persisted_progress_and_stage(session_factory, api):
    user, wf_id = await make_workflow(
        session_factory,
        config=[{"plugin": "denoise", "params": {}}, {"plugin": "sharpen", "params": {}}],
    )
    client = await api(user)

    async with session_factory() as db:
        await transitions.claim_for_processing(db, wf_id)
        await transitions.record_progress(
            db, wf_id, progress=50, current_stage=1,
            stages=[{"plugin": "denoise", "status": "success", "duration": 0.4}],
        )

    body = (await client.get(f"/api/v1/workflows/{wf_id}")).json()["data"]

    assert body["status"] == "processing"
    assert body["progress"] == 50
    assert body["current_stage"] == 1
    assert body["output_url"] is None
    assert body["meta"]["stages"][0]["plugin"] == "denoise"


async def test_queued_workflow_reports_zero_progress(session_factory, api):
    user, wf_id = await make_workflow(session_factory)
    client = await api(user)

    body = (await client.get(f"/api/v1/workflows/{wf_id}")).json()["data"]

    assert body["status"] == "pending"
    assert body["progress"] == 0


async def test_progress_never_reaches_100_before_completion(session_factory, api):
    user, wf_id = await make_workflow(session_factory)
    client = await api(user)

    async with session_factory() as db:
        await transitions.claim_for_processing(db, wf_id)
        await transitions.record_progress(db, wf_id, progress=100, current_stage=0, stages=[])

    body = (await client.get(f"/api/v1/workflows/{wf_id}")).json()["data"]

    assert body["status"] == "processing"
    assert body["progress"] == 99


# --------------------------------------------------------------------------- #
# Failure
# --------------------------------------------------------------------------- #

async def test_failed_workflow_exposes_a_meaningful_error(session_factory, api):
    user, wf_id = await make_workflow(session_factory)
    client = await api(user)

    async with session_factory() as db:
        await transitions.claim_for_processing(db, wf_id)
        assert await transitions.mark_failed(
            db, wf_id, error="HTTPError: image download failed (404)", stages=[]
        ) is True

    body = (await client.get(f"/api/v1/workflows/{wf_id}")).json()["data"]

    assert body["status"] == "failed"
    assert body["error"] == "HTTPError: image download failed (404)"
    assert body["output_url"] is None


async def test_requeue_for_retry_is_not_reported_as_failed(session_factory, api):
    user, wf_id = await make_workflow(session_factory)
    client = await api(user)

    async with session_factory() as db:
        await transitions.claim_for_processing(db, wf_id)
        assert await transitions.requeue_for_retry(db, wf_id, error="RuntimeError: blip") is True

    body = (await client.get(f"/api/v1/workflows/{wf_id}")).json()["data"]

    assert body["status"] == "pending"
    assert body["progress"] == 0
    assert body["error"] is None


# --------------------------------------------------------------------------- #
# Ownership is unchanged
# --------------------------------------------------------------------------- #

async def test_other_users_cannot_read_or_cancel_a_workflow(session_factory, api):
    _owner, wf_id = await make_workflow(session_factory, status="processing")
    intruder, _ = await make_workflow(session_factory)
    client = await api(intruder)

    assert (await client.get(f"/api/v1/workflows/{wf_id}")).status_code == 404
    assert (await client.post(f"/api/v1/workflows/{wf_id}/cancel")).status_code == 404
    assert (await load(session_factory, wf_id)).status == "processing"


# --------------------------------------------------------------------------- #
# Cancellation API
# --------------------------------------------------------------------------- #

@pytest.mark.parametrize("status", ["pending", "processing"])
async def test_active_workflow_can_be_cancelled(session_factory, api, celery_control, status):
    user, wf_id = await make_workflow(session_factory, status=status)
    client = await api(user)

    resp = await client.post(f"/api/v1/workflows/{wf_id}/cancel")

    assert resp.status_code == 200
    assert resp.json()["data"] == {"id": str(wf_id), "status": "cancelled"}
    assert (await load(session_factory, wf_id)).status == "cancelled"
    # Revoked by the real task id (== workflow id) and never with terminate=True.
    assert celery_control.revoked == [(str(wf_id), {})]


async def test_cancelling_a_completed_workflow_is_a_clear_409_and_changes_nothing(
    session_factory, api, celery_control
):
    user, wf_id = await make_workflow(
        session_factory,
        status="completed",
        output_url="https://res.cloudinary.com/test/processed/done.png",
    )
    client = await api(user)

    resp = await client.post(f"/api/v1/workflows/{wf_id}/cancel")
    error = resp.json()["error"]

    assert resp.status_code == 409
    assert error["code"] == "HTTP_409"
    assert "completed" in error["message"]
    assert "cancel" in error["message"].lower()
    stored = await load(session_factory, wf_id)
    assert stored.status == "completed"
    assert stored.output_url.endswith("done.png")
    assert celery_control.revoked == []


async def test_cancelling_a_failed_workflow_is_a_409(session_factory, api):
    user, wf_id = await make_workflow(session_factory, status="failed")
    client = await api(user)

    resp = await client.post(f"/api/v1/workflows/{wf_id}/cancel")

    assert resp.status_code == 409
    assert "failed" in resp.json()["error"]["message"]


async def test_cancel_is_idempotent(session_factory, api):
    user, wf_id = await make_workflow(session_factory, status="processing")
    client = await api(user)

    first = await client.post(f"/api/v1/workflows/{wf_id}/cancel")
    second = await client.post(f"/api/v1/workflows/{wf_id}/cancel")

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["data"]["status"] == "cancelled"


async def test_cancelled_workflow_reports_its_real_state(session_factory, api):
    user, wf_id = await make_workflow(session_factory, status="processing")
    client = await api(user)
    await client.post(f"/api/v1/workflows/{wf_id}/cancel")

    body = (await client.get(f"/api/v1/workflows/{wf_id}")).json()["data"]

    assert body["status"] == "cancelled"
    assert body["output_url"] is None
    assert body["progress"] < 100


# --------------------------------------------------------------------------- #
# Race conditions at the transition layer
# --------------------------------------------------------------------------- #

async def test_completion_after_cancel_does_not_overwrite_cancelled(session_factory):
    _user, wf_id = await make_workflow(session_factory)

    async with session_factory() as worker_db, session_factory() as api_db:
        assert await transitions.claim_for_processing(worker_db, wf_id) is True
        assert await transitions.mark_cancelled(api_db, wf_id) is True  # cancel wins
        completed = await transitions.mark_completed(
            worker_db, wf_id, output_url="https://x/out.png", meta={"progress": 100}
        )

    stored = await load(session_factory, wf_id)
    assert completed is False
    assert stored.status == "cancelled"
    assert stored.output_url is None


async def test_cancel_after_completion_does_not_overwrite_completed(session_factory):
    _user, wf_id = await make_workflow(session_factory)

    async with session_factory() as worker_db, session_factory() as api_db:
        await transitions.claim_for_processing(worker_db, wf_id)
        assert await transitions.mark_completed(
            worker_db, wf_id, output_url="https://x/out.png", meta={"progress": 100}
        ) is True  # completion wins
        cancelled = await transitions.mark_cancelled(api_db, wf_id)

    stored = await load(session_factory, wf_id)
    assert cancelled is False
    assert stored.status == "completed"
    assert stored.output_url == "https://x/out.png"


async def test_worker_progress_write_after_cancel_signals_stop(session_factory):
    _user, wf_id = await make_workflow(session_factory)

    async with session_factory() as db:
        await transitions.claim_for_processing(db, wf_id)
        await transitions.mark_cancelled(db, wf_id)
        keep_going = await transitions.record_progress(
            db, wf_id, progress=50, current_stage=1, stages=[]
        )

    assert keep_going is False
    assert (await load(session_factory, wf_id)).status == "cancelled"


async def test_worker_starting_after_cancel_does_not_claim(session_factory):
    _user, wf_id = await make_workflow(session_factory, status="cancelled")

    async with session_factory() as db:
        assert await transitions.claim_for_processing(db, wf_id) is False

    assert (await load(session_factory, wf_id)).status == "cancelled"


@pytest.mark.parametrize("terminal", ["completed", "failed", "cancelled"])
async def test_terminal_states_are_immutable(session_factory, terminal):
    _user, wf_id = await make_workflow(session_factory, status=terminal)

    async with session_factory() as db:
        assert await transitions.claim_for_processing(db, wf_id) is False
        assert await transitions.record_progress(
            db, wf_id, progress=10, current_stage=0, stages=[]
        ) is False
        assert await transitions.mark_completed(db, wf_id, output_url="u", meta={}) is False
        assert await transitions.mark_failed(db, wf_id, error="e", stages=[]) is False
        assert await transitions.requeue_for_retry(db, wf_id, error="e") is False
        assert await transitions.mark_cancelled(db, wf_id) is False

    assert (await load(session_factory, wf_id)).status == terminal


# --------------------------------------------------------------------------- #
# The Celery pipeline itself (storage, plugins, notifications and Redis faked)
# --------------------------------------------------------------------------- #

class RetryScheduled(Exception):
    """Stands in for celery.exceptions.Retry."""


def make_task(retries=0, max_retries=3):
    return SimpleNamespace(
        request=SimpleNamespace(retries=retries),
        max_retries=max_retries,
        retry=lambda exc=None, **kw: RetryScheduled(str(exc)),
    )


class FakePlugin:
    def __init__(self, on_execute=None):
        self.calls = 0
        self._on_execute = on_execute

    async def execute(self, image, params):
        self.calls += 1
        if self._on_execute:
            await self._on_execute()
        return image


class FakeRegistry:
    def __init__(self, plugins):
        self._plugins = plugins

    def get(self, identifier):
        return self._plugins.get(identifier)


@pytest.fixture
def worker(monkeypatch, session_factory):
    env = SimpleNamespace(
        published=[], uploads=[], notifications=[], downloads=[],
        real_publish=pipeline.publish_status,
        plugins={},
        download_error=None,
        before_upload=None,
    )

    async def fake_download(url):
        env.downloads.append(url)
        if env.download_error:
            raise env.download_error
        return "image-pixels"

    async def fake_upload(image, folder="processed"):
        if env.before_upload:
            await env.before_upload()
        env.uploads.append(folder)
        return {"url": "https://res.cloudinary.com/test/processed/out.png"}

    async def fake_publish(workflow_id, status, progress, output_url=None):
        env.published.append((status, progress))

    async def fake_notify_completed(db, user_id, workflow_id):
        env.notifications.append(("completed", user_id))

    async def fake_notify_failed(db, user_id, workflow_id):
        env.notifications.append(("failed", user_id))

    monkeypatch.setattr(pipeline, "AsyncSessionLocal", session_factory)
    monkeypatch.setattr(pipeline.StorageService, "download_to_numpy", fake_download)
    monkeypatch.setattr(pipeline.StorageService, "upload_numpy", fake_upload)
    monkeypatch.setattr(pipeline, "publish_status", fake_publish)
    monkeypatch.setattr(pipeline, "notify_workflow_completed", fake_notify_completed)
    monkeypatch.setattr(pipeline, "notify_workflow_failed", fake_notify_failed)
    monkeypatch.setattr(pipeline, "registry", SimpleNamespace(get=lambda pid: env.plugins.get(pid)))
    return env


TWO_STAGES = [{"plugin": "denoise", "params": {}}, {"plugin": "sharpen", "params": {}}]


async def test_worker_completes_workflow_and_reports_real_progress(session_factory, api, worker):
    user, wf_id = await make_workflow(session_factory, config=TWO_STAGES)
    worker.plugins = {"denoise": FakePlugin(), "sharpen": FakePlugin()}

    await pipeline.run_hardened_pipeline(str(wf_id), make_task())

    stored = await load(session_factory, wf_id)
    assert stored.status == "completed"
    assert stored.output_url == "https://res.cloudinary.com/test/processed/out.png"
    assert stored.completed_at is not None
    assert stored.meta["progress"] == 100
    assert [s["plugin"] for s in stored.meta["stages"]] == ["denoise", "sharpen"]
    # Progress = stages actually finished when each stage starts: 0%, 50%, then done.
    assert worker.published == [("processing", 0), ("processing", 50), ("completed", 100)]
    assert worker.uploads == ["processed"]
    assert worker.notifications == [("completed", user.id)]

    client = await api(user)
    body = (await client.get(f"/api/v1/workflows/{wf_id}")).json()["data"]
    assert body["status"] == "completed" and body["progress"] == 100
    assert body["output_url"].endswith("out.png")


async def test_worker_does_nothing_for_a_workflow_cancelled_before_it_started(session_factory, worker):
    _user, wf_id = await make_workflow(session_factory, status="cancelled")
    worker.plugins = {"denoise": FakePlugin()}

    await pipeline.run_hardened_pipeline(str(wf_id), make_task())

    assert worker.downloads == []
    assert worker.uploads == []
    assert (await load(session_factory, wf_id)).status == "cancelled"


async def test_worker_stops_when_cancelled_mid_run(session_factory, worker):
    user, wf_id = await make_workflow(session_factory, config=TWO_STAGES)

    async def cancel_during_first_stage():
        async with session_factory() as other_session:
            assert await transitions.mark_cancelled(other_session, wf_id) is True

    second = FakePlugin()
    worker.plugins = {"denoise": FakePlugin(on_execute=cancel_during_first_stage), "sharpen": second}

    await pipeline.run_hardened_pipeline(str(wf_id), make_task())

    stored = await load(session_factory, wf_id)
    assert stored.status == "cancelled"
    assert stored.output_url is None
    assert second.calls == 0
    assert worker.uploads == []
    assert ("completed", 100) not in worker.published
    assert worker.notifications == []


async def test_completion_that_loses_the_race_to_cancel_during_upload_stays_cancelled(
    session_factory, worker
):
    _user, wf_id = await make_workflow(session_factory)
    worker.plugins = {"denoise": FakePlugin()}

    async def cancel_while_uploading():
        async with session_factory() as other_session:
            await transitions.mark_cancelled(other_session, wf_id)

    worker.before_upload = cancel_while_uploading

    await pipeline.run_hardened_pipeline(str(wf_id), make_task())

    stored = await load(session_factory, wf_id)
    assert stored.status == "cancelled"
    assert stored.output_url is None
    assert ("completed", 100) not in worker.published
    assert worker.notifications == []


async def test_transient_worker_error_requeues_instead_of_reporting_failure(session_factory, worker):
    _user, wf_id = await make_workflow(session_factory)
    worker.plugins = {"denoise": FakePlugin()}
    worker.download_error = RuntimeError("cloudinary hiccup")

    with pytest.raises(RetryScheduled):
        await pipeline.run_hardened_pipeline(str(wf_id), make_task(retries=0))

    stored = await load(session_factory, wf_id)
    assert stored.status == "pending"  # not terminal, so clients keep waiting
    assert "cloudinary hiccup" in stored.meta["last_error"]
    assert worker.notifications == []


async def test_permanent_worker_error_marks_failed_with_the_reason(session_factory, worker):
    user, wf_id = await make_workflow(session_factory)
    worker.plugins = {"denoise": FakePlugin()}
    worker.download_error = RuntimeError("cloudinary hiccup")

    with pytest.raises(RetryScheduled):
        await pipeline.run_hardened_pipeline(str(wf_id), make_task(retries=3, max_retries=3))

    stored = await load(session_factory, wf_id)
    assert stored.status == "failed"
    assert "cloudinary hiccup" in stored.meta["error"]
    assert ("failed", 0) in worker.published
    assert worker.notifications == [("failed", user.id)]


async def test_redis_outage_cannot_turn_a_finished_workflow_into_a_failure(
    session_factory, worker, monkeypatch
):
    _user, wf_id = await make_workflow(session_factory)
    worker.plugins = {"denoise": FakePlugin()}

    async def broken_redis():
        raise ConnectionError("redis is down")

    monkeypatch.setattr("app.core.redis_pool.get_redis_client", broken_redis)
    monkeypatch.setattr(pipeline, "publish_status", worker.real_publish)

    await pipeline.run_hardened_pipeline(str(wf_id), make_task())

    stored = await load(session_factory, wf_id)
    assert stored.status == "completed"
    assert stored.output_url is not None
