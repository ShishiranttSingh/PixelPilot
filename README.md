# PixelPilot

Production-grade AI Image Enhancement SaaS.

## Architecture
- **Backend**: FastAPI (Python 3.11), SQLAlchemy 2.0, Celery, Redis.
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS.
- **Database**: PostgreSQL.
- **Storage**: Cloudinary.

## Getting Started

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in the values.
3. Run `docker-compose up --build`.
4. Access the API at `http://localhost:8000/api/v1/docs`.
5. Access the Frontend at `http://localhost:3000`.

## License
MIT