import sqlite3
from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import strawberry
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import strawberry
from strawberry.fastapi import GraphQLRouter
import jwt

SECRET_KEY = "apotek-iae-secret-key-2025"
ALGORITHM = "HS256"

def init_db():
    conn = sqlite3.connect("inventory_db.sqlite")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS medicines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            stock INTEGER,
            price REAL,
            category TEXT
        )
    """)
    conn.execute("INSERT OR IGNORE INTO medicines (id, name, stock, price, category) VALUES (1, 'Paracetamol', 100, 5000, 'Bebas')")
    conn.execute("INSERT OR IGNORE INTO medicines (id, name, stock, price, category) VALUES (2, 'Amoxicillin', 20, 15000, 'Keras')")
    conn.commit()
    conn.close()

init_db()

@strawberry.type
class Medicine:
    id: strawberry.ID
    name: str
    stock: int
    price: float
    category: str

    @strawberry.field
    def isAvailable(self) -> bool:
        return self.stock > 0

@strawberry.type
class Query:
    @strawberry.field
    def medicines(self, category: Optional[str] = None) -> List[Medicine]:
        conn = sqlite3.connect("inventory_db.sqlite")
        conn.row_factory = sqlite3.Row
        if category:
            rows = conn.execute("SELECT * FROM medicines WHERE category = ?", (category,)).fetchall()
        else:
            rows = conn.execute("SELECT * FROM medicines").fetchall()
        conn.close()
        return [Medicine(id=str(r["id"]), name=r["name"], stock=r["stock"], price=r["price"], category=r["category"]) for r in rows]

    @strawberry.field
    def checkStock(self, medicineName: str) -> Optional[Medicine]:
        conn = sqlite3.connect("inventory_db.sqlite")
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM medicines WHERE name LIKE ?", (f"%{medicineName}%",)).fetchone()
        conn.close()
        if row:
            return Medicine(id=str(row["id"]), name=row["name"], stock=row["stock"], price=row["price"], category=row["category"])
        return None

@strawberry.type
class Mutation:
    @strawberry.mutation
    def createMedicine(self, info, name: str, stock: int, price: float, category: str) -> Optional[Medicine]:
        user = info.context.get("user")
        if not user or user["role"] not in ["admin", "apoteker"]:
            raise Exception("Unauthorized: Hanya Admin/Apoteker yang boleh akses")
            
        conn = sqlite3.connect("inventory_db.sqlite")
        cursor = conn.cursor()
        cursor.execute("INSERT INTO medicines (name, stock, price, category) VALUES (?, ?, ?, ?)", (name, stock, price, category))
        new_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return Medicine(id=str(new_id), name=name, stock=stock, price=price, category=category)

    @strawberry.mutation
    def updateMedicine(self, info, id: strawberry.ID, name: Optional[str] = None, stock: Optional[int] = None, price: Optional[float] = None, category: Optional[str] = None) -> str:
        user = info.context.get("user")
        if not user or user["role"] not in ["admin", "apoteker"]:
            raise Exception("Unauthorized: Hanya Admin/Apoteker yang boleh akses")

        conn = sqlite3.connect("inventory_db.sqlite")
        queries = []
        params = []
        if name:
            queries.append("name = ?")
            params.append(name)
        if stock is not None:
            queries.append("stock = ?")
            params.append(stock)
        if price is not None:
            queries.append("price = ?")
            params.append(price)
        if category:
            queries.append("category = ?")
            params.append(category)
        
        if not queries:
            conn.close()
            return "Tidak ada perubahan"

        params.append(id)
        cursor = conn.execute(f"UPDATE medicines SET {', '.join(queries)} WHERE id = ?", params)
        conn.commit()
        updated = cursor.rowcount > 0
        conn.close()
        return "Berhasil diperbarui" if updated else "ID tidak ditemukan"

    @strawberry.mutation
    def deleteMedicine(self, info, id: strawberry.ID) -> str:
        user = info.context.get("user")
        if not user or user["role"] not in ["admin", "apoteker"]:
            raise Exception("Unauthorized: Hanya Admin/Apoteker yang boleh akses")

        conn = sqlite3.connect("inventory_db.sqlite")
        cursor = conn.execute("DELETE FROM medicines WHERE id = ?", (id,))
        conn.commit()
        deleted = cursor.rowcount > 0
        conn.close()
        return "Berhasil dihapus" if deleted else "ID tidak ditemukan"

    @strawberry.mutation
    def updateStock(self, info, id: strawberry.ID, amount: int) -> str:
        user = info.context.get("user")
        # Catatan: Transaction Service akan forward token Admin saat penjualan
        if not user or user["role"] not in ["admin", "apoteker"]:
            raise Exception("Unauthorized: Hanya Admin/Apoteker yang boleh akses")

        conn = sqlite3.connect("inventory_db.sqlite")
        conn.execute("UPDATE medicines SET stock = stock + ? WHERE id = ?", (amount, id))
        conn.commit()
        conn.close()
        return "Stok berhasil diperbarui"

schema = strawberry.Schema(query=Query, mutation=Mutation)
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
async def get_context(request: Request):
    auth = request.headers.get("Authorization")
    if auth:
        try:
            payload = jwt.decode(auth.replace("Bearer ", ""), SECRET_KEY, algorithms=[ALGORITHM])
            return {"user": payload}
        except: pass
    return {"user": None}

app.include_router(GraphQLRouter(schema, context_getter=get_context), prefix="/graphql")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)