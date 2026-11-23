import cloudinary
from app.core.config import settings

def setup_cloudinary():
    if all([settings.cloudinary.CLOUD_NAME, settings.cloudinary.API_KEY, settings.cloudinary.API_SECRET]):
        cloudinary.config(
        cloud_name=settings.cloudinary.CLOUD_NAME,
        api_key=settings.cloudinary.API_KEY,
        api_secret=settings.cloudinary.API_SECRET,
        secure=True,
    )