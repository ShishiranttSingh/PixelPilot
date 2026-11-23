.PHONY: help build up down logs shell test lint format

help:
	@echo "PixelPilot Development Commands"
	@echo "build   - Build docker containers"
	@echo "up      - Start containers"
	@echo "down    - Stop containers"
	@echo "logs    - View logs"
	@echo "lint    - Run ruff and mypy"
	@echo "format  - Run black and ruff fix"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

lint:
	docker exec -it pixelpilot_backend ruff check .
	docker exec -it pixelpilot_backend mypy .

format:
	docker exec -it pixelpilot_backend black .
	docker exec -it pixelpilot_backend ruff check . --fix