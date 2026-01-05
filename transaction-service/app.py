import strawberry
import httpx
import sqlite3
import os
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

# Konfigurasi URL Service (Mendukung Docker & Localhost)
INVENTORY_URL = os.getenv("INVENTORY_URL", "http://localhost:8002/graphql")
HOSPITAL_URL = os.getenv("HOSPITAL_URL", "http://localhost:8004/graphql")

def init_db():
    conn = sqlite3.connect("transaction_db.sqlite")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prescription_id TEXT,
            total_price REAL,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

@strawberry.type
class ItemDetail:
    id: str
    name: str
    qty: int
    price: float
    subtotal: float

@strawberry.type
class PreviewResult:
    isSuccess: bool
    message: str
    patientName: Optional[str] = None
    items: Optional[List[ItemDetail]] = None
    totalPrice: Optional[float] = None

@strawberry.type
class ChartDataPoint:
    date: str
    value: float

@strawberry.type
class DashboardStats:
    totalTransactions: int
    totalRevenue: float
    revenueChart: List[ChartDataPoint]

@strawberry.type
class Transaction:
    id: strawberry.ID
    prescriptionId: str
    totalPrice: float
    status: str

@strawberry.type
class Query:
    @strawberry.field
    def health(self) -> str:
        return "OK"
    
    @strawberry.field
    def dashboard_stats(self) -> DashboardStats:
        conn = sqlite3.connect("transaction_db.sqlite")
        cursor = conn.cursor()
        
        # 1. Total Transaksi
        cursor.execute("SELECT COUNT(*), SUM(total_price) FROM transactions WHERE status='PAID'")
        row = cursor.fetchone()
        total_count = row[0] if row[0] else 0
        total_revenue = row[1] if row[1] else 0.0
        
        # 2. Chart Data (Pendapatan 7 Hari Terakhir)
        chart_data = []
        for i in range(6, -1, -1):
            date_val = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            # Query untuk hari spesifik (SQLite syntax for date comparison varies, using string matching for simplicity)
            cursor.execute("SELECT SUM(total_price) FROM transactions WHERE date(created_at) = ?", (date_val,))
            res = cursor.fetchone()
            val = res[0] if res[0] else 0.0
            chart_data.append(ChartDataPoint(date=date_val, value=val))
            
        conn.close()
        return DashboardStats(
            totalTransactions=total_count,
            totalRevenue=total_revenue,
            revenueChart=chart_data
        )

    @strawberry.field
    async def preview_transaction(self, prescription_id: str) -> PreviewResult:
        # 1. Ambil Data Resep
        prescription_items = []
        patient_name = "Unknown"
        async with httpx.AsyncClient() as client:
            try:
                hp_query = {"query": f"query {{ validatePrescription(id: \"{prescription_id}\") {{ isValid patientName list_medicines: medicines {{ id name qty }} }} }}"}
                hp_res = await client.post(HOSPITAL_URL, json=hp_query)
                hp_data = hp_res.json()['data']['validatePrescription']
                
                if not hp_data['isValid']:
                    return PreviewResult(isSuccess=False, message="Resep Tidak Valid")
                
                prescription_items = hp_data['list_medicines']
                patient_name = hp_data.get('patientName', 'Unknown')
                if not prescription_items:
                    return PreviewResult(isSuccess=False, message="Resep kosong")

            except Exception as e:
                return PreviewResult(isSuccess=False, message=f"Gagal koneksi ke Hospital Service: {str(e)}")

        # 2. Ambil Harga dari Inventory
        items_detail = []
        total_price = 0.0
        
        async with httpx.AsyncClient() as client:
            try:
                inv_query = {"query": "query { medicines { id price stock name } }"}
                inv_res = await client.post(INVENTORY_URL, json=inv_query)
                inventory_medicines = inv_res.json()['data']['medicines']
                
                for item in prescription_items:
                    inv_item = next((m for m in inventory_medicines if m['id'] == item['id']), None)
                    
                    if not inv_item:
                        return PreviewResult(isSuccess=False, message=f"Obat ID {item['id']} tidak ditemukan")
                    
                    if inv_item['stock'] < item['qty']:
                        return PreviewResult(isSuccess=False, message=f"Stok {inv_item['name']} kurang")
                    
                    subtotal = inv_item['price'] * item['qty']
                    total_price += subtotal
                    
                    items_detail.append(ItemDetail(
                        id=item['id'],
                        name=inv_item['name'],
                        qty=item['qty'],
                        price=inv_item['price'],
                        subtotal=subtotal
                    ))
                    
            except Exception as e:
                return PreviewResult(isSuccess=False, message=f"Gagal koneksi ke Inventory: {str(e)}")

        return PreviewResult(
            isSuccess=True,
            message="OK",
            patientName=patient_name,
            items=items_detail,
            totalPrice=total_price
        )

@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_transaction(
        self, 
        payment_amount: float, 
        prescription_id: str
    ) -> str:
        
        # 1. Validasi Resep
        prescription_items = []
        async with httpx.AsyncClient() as client:
            try:
                hp_query = {"query": f"query {{ validatePrescription(id: \"{prescription_id}\") {{ isValid list_medicines: medicines {{ id name qty }} }} }}"}
                hp_res = await client.post(HOSPITAL_URL, json=hp_query)
                hp_data = hp_res.json()['data']['validatePrescription']
                
                if not hp_data['isValid']: return "Error: Resep Tidak Valid"
                prescription_items = hp_data['list_medicines']
                if not prescription_items: return "Error: Resep kosong"

            except Exception as e: return f"Error: {str(e)}"

        # 2. Cek Stok & Hitung Total
        total_price = 0
        items_summary = []
        async with httpx.AsyncClient() as client:
            try:
                inv_query = {"query": "query { medicines { id price stock name } }"}
                inv_res = await client.post(INVENTORY_URL, json=inv_query)
                inventory_medicines = inv_res.json()['data']['medicines']
                
                for item in prescription_items:
                    inv_item = next((m for m in inventory_medicines if m['id'] == item['id']), None)
                    if not inv_item: return f"Error: {item['name']} not found"
                    if inv_item['stock'] < item['qty']: return f"Error: Low stock for {inv_item['name']}"
                    
                    total_price += inv_item['price'] * item['qty']
                    items_summary.append(f"{item['qty']}x {inv_item['name']}")
            except Exception as e: return f"Error: Inventory check failed {str(e)}"

        # 3. Validasi Pembayaran
        if payment_amount < total_price:
            return f"Error: Pembayaran Kurang. Total: Rp {total_price:,.0f}"

        # 4. Potong Stok
        async with httpx.AsyncClient() as client:
            try:
                for item in prescription_items:
                    qty = -1 * item['qty']
                    mutation = f"mutation {{ updateStock(id: \"{item['id']}\", amount: {qty}) }}"
                    await client.post(INVENTORY_URL, json={"query": mutation})
            except Exception: return "Error: Stock update failed"

        # 5. Simpan Transaksi
        try:
            conn = sqlite3.connect("transaction_db.sqlite")
            conn.execute("INSERT INTO transactions (prescription_id, total_price, status) VALUES (?, ?, ?)", (prescription_id, total_price, "PAID"))
            conn.commit()
            conn.close()
            return f"Sukses! {', '.join(items_summary)}. Total: Rp {total_price:,.0f}"
        except Exception as e: return f"Error Database: {str(e)}"

schema = strawberry.Schema(query=Query, mutation=Mutation)
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(GraphQLRouter(schema), prefix="/graphql")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)