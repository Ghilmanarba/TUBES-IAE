import sqlite3
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import strawberry
from strawberry.fastapi import GraphQLRouter

# Konfigurasi Keamanan
SECRET_KEY = "apotek-iae-secret-key-2025"
ALGORITHM = "HS256"

# Inisialisasi Database
def init_db():
    conn = sqlite3.connect("auth_db.sqlite")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password_hash TEXT,
            full_name TEXT,
            nim TEXT,
            role TEXT
        )
    """)
    # Akun default: admin_naufal / apotek123
    hashed = bcrypt.hashpw("apotek123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    conn.execute("INSERT OR IGNORE INTO users (username, password_hash, full_name, nim, role) VALUES (?,?,?,?,?)",
                 ("admin_naufal", hashed, "Naufal Admin", "102022300001", "admin"))
    conn.commit()
    conn.close()

init_db()

@strawberry.type
class User:
    id: strawberry.ID
    username: str
    fullName: str
    nim: str
    role: str

@strawberry.type
class AuthPayload:
    token: str
    user: User

@strawberry.type
class Query:
    @strawberry.field
    def me(self, info) -> Optional[User]:
        user_data = info.context.get("user")
        if not user_data: return None
        return User(id=user_data["sub"], username=user_data["username"], fullName="Identitas Terverifikasi", nim=user_data["nim"], role=user_data["role"])

    @strawberry.field
    def userById(self, id: strawberry.ID) -> Optional[User]:
        conn = sqlite3.connect("auth_db.sqlite")
        conn.row_factory = sqlite3.Row
        u = conn.execute("SELECT * FROM users WHERE id = ?", (id,)).fetchone()
        conn.close()
        if u: return User(id=str(u["id"]), username=u["username"], fullName=u["full_name"], nim=u["nim"], role=u["role"])
        return None

@strawberry.type
class Mutation:
    @strawberry.mutation
    def login(self, username: str, password: str) -> Optional[AuthPayload]:
        conn = sqlite3.connect("auth_db.sqlite")
        conn.row_factory = sqlite3.Row
        u = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        conn.close()
        
        if u and bcrypt.checkpw(password.encode('utf-8'), u["password_hash"].encode('utf-8')):
            payload = {
                "sub": str(u["id"]),
                "username": u["username"],
                "nim": u["nim"],
                "role": u["role"],
                "exp": datetime.utcnow() + timedelta(hours=8)
            }
            token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
            return AuthPayload(
                token=token,
                user=User(id=str(u["id"]), username=u["username"], fullName=u["full_name"], nim=u["nim"], role=u["role"])
            )
        return None

schema = strawberry.Schema(query=Query, mutation=Mutation)

async def get_context(request: Request):
    auth = request.headers.get("Authorization")
    if auth:
        try:
            payload = jwt.decode(auth.replace("Bearer ", ""), SECRET_KEY, algorithms=[ALGORITHM])
            return {"user": payload}
        except: pass
    return {"user": None}

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(GraphQLRouter(schema, context_getter=get_context), prefix="/graphql")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)