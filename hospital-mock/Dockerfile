FROM python:3.9-slim

WORKDIR /app

# Install dependencies minimal untuk mock service
RUN pip install --no-cache-dir fastapi uvicorn strawberry-graphql[fastapi]

COPY . .

# Hospital mock berjalan di port 8004 sesuai rencana integrasi
CMD ["python", "app.py"]