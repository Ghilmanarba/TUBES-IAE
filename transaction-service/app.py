import strawberry
import httpx
import sqlite3
from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter

@strawberry.type
class Transaction:
    id: strawberry.ID
    userId: strawberry.ID
    prescriptionId: str
    totalPrice: float
    status: str

@strawberry.type
class Query:
    @strawberry.field
    def health(self) -> str:
        return "OK"

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_transaction(
        self, 
        medicine_id: str, 
        payment_amount: float, 
        prescription_id: str = None
    ) -> str:
        
        # 1. Validasi Resep ke Hospital Service (Integrasi Lintas Kelompok)
        if prescription_id:
            async with httpx.AsyncClient() as client:
                try:
                    hp_query = {"query": f"query {{ validatePrescription(id: \"{prescription_id}\") {{ isValid }} }}"}
                    hp_res = await client.post("http://hospital-mock:8004/graphql", json=hp_query)
                    if not hp_res.json()['data']['validatePrescription']['isValid']:
                        return "Error: Resep Tidak Valid"
                except Exception:
                    return "Error: Gagal terhubung ke Hospital Service"

        # 2. Cek Harga ke Inventory Service (Internal)
        async with httpx.AsyncClient() as client:
            try:
                inv_query = {"query": "query { medicines { id price } }"}
                inv_res = await client.post("http://inventory-service:8002/graphql", json=inv_query)
                medicines = inv_res.json()['data']['medicines']
                target = next((m for m in medicines if m['id'] == medicine_id), None)
                if not target: 
                    return "Error: Obat tidak ditemukan"
                total_price = target['price']
            except Exception:
                return "Error: Gagal mengambil data dari Inventory"

        # 3. Logika Pembayaran (Internal)
        if payment_amount < total_price:
            return f"Error: Pembayaran Kurang. Total: {total_price}"

        # 4. Simpan Transaksi (Status: PAID)
        try:
            conn = sqlite3.connect("transaction_db.sqlite")
            conn.execute(
                "INSERT INTO transactions (prescription_id, total_price, status) VALUES (?, ?, ?)",
                (prescription_id, total_price, "PAID")
            )
            conn.commit()
            conn.close()
            return f"Transaksi Berhasil! Kembalian: {payment_amount - total_price}"
        except Exception as e:
            return f"Error Database: {str(e)}"

schema = strawberry.Schema(query=Query, mutation=Mutation)
app = FastAPI()
app.include_router(GraphQLRouter(schema), prefix="/graphql")

if __name__ == "__main__":
    import uvicorn
    # Port 8002 di sini akan di-map ke 8003 di komputer Anda lewat docker-compose
    uvicorn.run(app, host="0.0.0.0", port=8002)