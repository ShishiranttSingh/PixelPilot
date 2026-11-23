# Authentication schemas app/schemas/auth.py


from pydantic import BaseModel, EmailStr, Field, model_validator
from uuid import UUID
from datetime import datetime
from app.models.user import UserRole
from app.core.security import validate_password_strength, validate_username


class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=30)
    password: str = Field(..., min_length=12)
    confirm_password: str = Field(..., min_length=12)

    @model_validator(mode="after")
    def validate_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self

    @model_validator(mode="after")
    def validate_password_complexity(self):
        errors = validate_password_strength(self.password)
        if errors:
            raise ValueError("; ".join(errors))
        return self

    @model_validator(mode="after")
    def validate_username_format(self):
        errors = validate_username(self.username)
        if errors:
            raise ValueError("; ".join(errors))
        return self

    @model_validator(mode="after")
    def normalize_email(self):
        self.email = self.email.lower().strip()
        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    username: str
    role: UserRole
    is_verified: bool
    credits_remaining: int
    created_at: datetime

    class Config:
        from_attributes = True


class RegisterResponse(BaseModel):
    id: UUID
    username: str
    email: str
    is_verified: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
