# PixelPilot Architecture Overview

## 1. Modular Monolith
The backend is structured into domain modules (`auth`, `images`, `workflows`) sharing a `core` infrastructure. This balances development speed with separation of concerns.

## 2. The Plugin Registry
AI operations are encapsulated as `ImagePlugin` instances. Adding a new AI model (e.g., Face Restoration) only requires:
1. Creating a new class implementing `ImagePlugin`.
2. Placing an ONNX model in `app/ai/models`.
3. Registering the class in `app/plugins/__init__.py`.

## 3. Workflow Engine
The engine orchestrates sequential execution of plugins within a single Celery worker.
- **Rule Engine**: Analyzes image heuristics to recommend stages.
- **Pipeline Executor**: Manages memory, image buffers, and status reporting via Redis/SSE.

## 4. Production Stack
- **Inference**: ONNX Runtime (CPU/GPU agnostic).
- **Blob Storage**: Cloudinary (handles transformations and CDN).
- **Cache/Queue**: Redis.
- **Database**: PostgreSQL (SQLAlchemy 2.0 Async).