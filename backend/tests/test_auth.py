import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.core.security import verify_password, get_password_hash
from app.models.user import User
from app.repositories.user_repository import UserRepository

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_registration.db"

@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="module")
async def engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture(scope="module")
async def session_factory(engine):
    return async_sessionmaker(engine, expire_on_commit=False)


@pytest.fixture
async def db_session(session_factory):
    async with session_factory() as session:
        yield session


@pytest.fixture
async def client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.mark.anyio
async def test_successful_registration(client: AsyncClient, db_session: AsyncSession):
    payload = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "StrongP@ss1word",
        "confirm_password": "StrongP@ss1word",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["success"] is True
    user_data = body["data"]["user"]
    assert user_data["username"] == "testuser"
    assert user_data["email"] == "test@example.com"
    assert user_data["is_verified"] is False
    assert "id" in user_data
    assert "password" not in user_data
    assert "password_hash" not in body["data"]

    repo = UserRepository(db_session)
    user = await repo.get_by_email("test@example.com")
    assert user is not None
    assert verify_password("StrongP@ss1word", user.password_hash) is True


@pytest.mark.anyio
async def test_duplicate_email(client: AsyncClient, db_session: AsyncSession):
    repo = UserRepository(db_session)
    existing = await repo.get_by_email("dup@example.com")
    if not existing:
        hashed = get_password_hash("SomeP@ss1word")
        user = User(
            email="dup@example.com",
            username="dupuser",
            password_hash=hashed,
        )
        await repo.create(user)
        await db_session.commit()

    payload = {
        "username": "anotheruser",
        "email": "dup@example.com",
        "password": "Str0ng!Pass1",
        "confirm_password": "Str0ng!Pass1",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409
    assert "already exists" in resp.json()["error"]["message"]


@pytest.mark.anyio
async def test_duplicate_username(client: AsyncClient, db_session: AsyncSession):
    repo = UserRepository(db_session)
    existing = await repo.get_by_username("dupuser2")
    if not existing:
        hashed = get_password_hash("SomeP@ss1word")
        user = User(
            email="unique@example.com",
            username="dupuser2",
            password_hash=hashed,
        )
        await repo.create(user)
        await db_session.commit()

    payload = {
        "username": "dupuser2",
        "email": "unique2@example.com",
        "password": "Str0ng!Pass1",
        "confirm_password": "Str0ng!Pass1",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409
    assert "already taken" in resp.json()["error"]["message"]


@pytest.mark.anyio
async def test_weak_password_rejection(client: AsyncClient):
    payload = {
        "username": "weakuser",
        "email": "weak@example.com",
        "password": "short",
        "confirm_password": "short",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 422


@pytest.mark.anyio
async def test_weak_password_no_uppercase(client: AsyncClient):
    payload = {
        "username": "noupuser",
        "email": "noup@example.com",
        "password": "lowercaseonly1!",
        "confirm_password": "lowercaseonly1!",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 422


@pytest.mark.anyio
async def test_weak_password_no_special(client: AsyncClient):
    payload = {
        "username": "nospecial",
        "email": "nospecial@example.com",
        "password": "NoSpecialChar1",
        "confirm_password": "NoSpecialChar1",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 422


@pytest.mark.anyio
async def test_invalid_email(client: AsyncClient):
    payload = {
        "username": "bademail",
        "email": "not-an-email",
        "password": "StrongP@ss1word",
        "confirm_password": "StrongP@ss1word",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 422


@pytest.mark.anyio
async def test_password_mismatch(client: AsyncClient):
    payload = {
        "username": "mismatchuser",
        "email": "mismatch@example.com",
        "password": "StrongP@ss1word",
        "confirm_password": "DifferentP@ss1word",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 422
    assert "do not match" in resp.text.lower()


@pytest.mark.anyio
async def test_invalid_username_characters(client: AsyncClient):
    payload = {
        "username": "user name!",
        "email": "baduser@example.com",
        "password": "StrongP@ss1word",
        "confirm_password": "StrongP@ss1word",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 422


@pytest.mark.anyio
async def test_login_compatibility(client: AsyncClient, db_session: AsyncSession):
    repo = UserRepository(db_session)
    existing = await repo.get_by_email("login-compat@example.com")
    if not existing:
        user = User(
            email="login-compat@example.com",
            username="logincompat",
            password_hash=get_password_hash("Str0ng!Pass1"),
        )
        await repo.create(user)
        await db_session.commit()

    resp = await client.post("/api/v1/auth/login", json={
        "email": "login-compat@example.com",
        "password": "Str0ng!Pass1",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert "access_token" in body["data"]


@pytest.mark.anyio
async def test_login_with_registered_user(client: AsyncClient, db_session: AsyncSession):
    payload = {
        "username": "registerlogin",
        "email": "registerlogin@example.com",
        "password": "Str0ng!Pass1",
        "confirm_password": "Str0ng!Pass1",
    }
    reg_resp = await client.post("/api/v1/auth/register", json=payload)
    assert reg_resp.status_code == 201

    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "registerlogin@example.com",
        "password": "Str0ng!Pass1",
    })
    assert login_resp.status_code == 200
    assert login_resp.json()["success"] is True
