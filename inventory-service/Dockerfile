FROM python:3.9-slim

WORKDIR /app

# Salin requirements dari root (jika ada) atau gunakan inline
RUN pip install --no-cache-dir fastapi uvicorn strawberry-graphql[fastapi] pyjwt bcrypt httpx

COPY . .

# Pastikan port sesuai dengan service (8001, 8002, dst)
# Kita bisa mengandalkan command di docker-compose jika perlu port dinamis,
# tapi untuk kesederhanaan, kita panggil app.py langsung
CMD ["python", "app.py"]