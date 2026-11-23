"""
Pytest bootstrap.

* Its presence at the backend root makes pytest put this directory on
  ``sys.path`` so ``import app`` works no matter how pytest is launched.
* ``Settings()`` is built at import time and requires DATABASE_URL / REDIS_URL.
  Inside Docker these come from ``.env``; ``setdefault`` leaves them untouched
  there and only fills them in for a bare local run. Nothing connects to either
  during import.
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
