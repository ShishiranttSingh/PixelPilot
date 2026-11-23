import re
from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    deprecated="auto",
)


def create_access_token(subject: Union[str, Any]) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.auth.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(
        to_encode, settings.app.SECRET_KEY, algorithm=settings.auth.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(subject: Union[str, Any]) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.auth.REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(
        to_encode, settings.app.SECRET_KEY, algorithm=settings.auth.ALGORITHM
    )
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(
        token, settings.app.SECRET_KEY, algorithms=[settings.auth.ALGORITHM]
    )


PASSWORD_MIN_LENGTH = 12
PASSWORD_PATTERNS = [
    (r"[A-Z]", "uppercase letter"),
    (r"[a-z]", "lowercase letter"),
    (r"\d", "digit"),
    (r"[!@#$%^&*(),.?\"':;{}|<>_\-+=\[\]\\/`~]", "special character"),
]

USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]+$")


def validate_password_strength(password: str) -> list[str]:
    errors: list[str] = []
    if len(password) < PASSWORD_MIN_LENGTH:
        errors.append(f"Password must be at least {PASSWORD_MIN_LENGTH} characters")
    for pattern, name in PASSWORD_PATTERNS:
        if not re.search(pattern, password):
            errors.append(f"Password must contain at least one {name}")
    return errors


def validate_username(username: str) -> list[str]:
    errors: list[str] = []
    if len(username) < 3 or len(username) > 30:
        errors.append("Username must be between 3 and 30 characters")
    if not USERNAME_PATTERN.match(username):
        errors.append("Username can only contain letters, numbers, and underscores")
    return errors
