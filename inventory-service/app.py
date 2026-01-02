import sqlite3
from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import strawberry
from strawberry.fastapi import GraphQLRouter

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
    def updateStock(self, id: strawberry.ID, amount: int) -> str:
        conn = sqlite3.connect("inventory_db.sqlite")
        conn.execute("UPDATE medicines SET stock = stock + ? WHERE id = ?", (amount, id))
        conn.commit()
        conn.close()
        return "Stok berhasil diperbarui"

schema = strawberry.Schema(query=Query, mutation=Mutation)
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(GraphQLRouter(schema), prefix="/graphql")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)