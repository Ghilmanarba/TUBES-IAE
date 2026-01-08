import strawberry
import httpx
import sqlite3
import os
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

# Konfigurasi URL Service
INVENTORY_URL = os.getenv("INVENTORY_URL", "http://localhost:8002/graphql")
# Default ke local docker mock jika tidak ada env, tapi tetap support env var
HOSPITAL_URL = os.getenv("HOSPITAL_URL", "https://5769410a-241d-4a71-8a11-f0e2e799d250-00-zotjui8bg0f8.janeway.replit.dev/records/graphql")

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
    instructions: str

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
class Query:
    @strawberry.field
    def health(self) -> str:
        return "OK"
    
    @strawberry.field
    def dashboard_stats(self) -> DashboardStats:
        conn = sqlite3.connect("transaction_db.sqlite")
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*), SUM(total_price) FROM transactions WHERE status='PAID'")
        row = cursor.fetchone()
        total_count = row[0] if row[0] else 0
        total_revenue = row[1] if row[1] else 0.0
        
        chart_data = []
        for i in range(6, -1, -1):
            date_val = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
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
        # 1. Ambil Data Resep dari External GraphQL API (Hospital)
        prescription_medicines = []
        patient_name = "Unknown"
        
        async with httpx.AsyncClient() as client:
            try:
                # Query GraphQL ke Hospital
                query = """
                query validate($id: String!) {
                    validatePrescription(id: $id) {
                        isValid
                        patientName
                        medicines {
                            name
                            qty
                        }
                    }
                }
                """
                resp = await client.post(
                    HOSPITAL_URL, 
                    json={"query": query, "variables": {"id": prescription_id}},
                    timeout=10.0
                )
                
                if resp.status_code != 200:
                    return PreviewResult(isSuccess=False, message=f"Hospital Service Error ({resp.status_code})")

                payload = resp.json()
                data = payload.get("data", {}).get("validatePrescription")
                
                if not data or not data.get("isValid"):
                    return PreviewResult(isSuccess=False, message=f"Resep ID {prescription_id} tidak valid atau tidak ditemukan.")

                patient_name = data.get('patientName', 'Unknown')
                prescription_medicines = data.get('medicines', [])
                
                if not prescription_medicines:
                    return PreviewResult(isSuccess=False, message="Resep kosong (tidak ada obat).")

            except Exception as e:
                return PreviewResult(isSuccess=False, message=f"Gagal koneksi ke Hospital Service: {str(e)}")

        # 2. Cocokkan dengan Inventory Lokal (berdasarkan Nama Obat)
        items_detail = []
        total_price = 0.0
        
        async with httpx.AsyncClient() as client:
            try:
                # Ambil semua obat dari inventory kita
                inv_query = {"query": "query { medicines { id price stock name } }"}
                inv_res = await client.post(INVENTORY_URL, json=inv_query)
                inventory_medicines = inv_res.json()['data']['medicines']
                
                for item in prescription_medicines:
                    # Hospital GraphQL returns 'qty', Inventory loop expects matching Logic
                    needed_qty = item.get('qty', 0)
                    med_name = item.get('name', '')
                    
                    # Cari obat di inventory kita yang namanya mirip (case-insensitive)
                    inv_item = next((m for m in inventory_medicines if m['name'].lower() == med_name.lower()), None)
                    
                    if not med_name:
                        return PreviewResult(isSuccess=False, message=f"Data obat dari RS tidak lengkap: {str(item)}")
                    
                    if not inv_item:
                        return PreviewResult(isSuccess=False, message=f"Obat '{med_name}' tidak tersedia di apotek kami.")
                    
                    if inv_item['stock'] < needed_qty:
                        return PreviewResult(isSuccess=False, message=f"Stok '{med_name}' kurang (Sisa: {inv_item['stock']}).")
                    
                    subtotal = inv_item['price'] * needed_qty
                    total_price += subtotal
                    
                    # Instructions removed from Hospital Mock GraphQL, setting default
                    instructions = "Sesuai resep dokter"

                    items_detail.append(ItemDetail(
                        id=inv_item['id'],
                        name=inv_item['name'],
                        qty=needed_qty,
                        price=inv_item['price'],
                        subtotal=subtotal,
                        instructions=instructions
                    ))
                    
            except Exception as e:
                return PreviewResult(isSuccess=False, message=f"Gagal cek inventory: {str(e)}")

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
        
        # 1. Validasi & Ambil Resep (GraphQL API)
        prescription_medicines = []
        async with httpx.AsyncClient() as client:
            try:
                query = """
                query validate($id: String!) {
                    validatePrescription(id: $id) {
                        isValid
                        medicines {
                            name
                            qty
                        }
                    }
                }
                """
                resp = await client.post(
                    HOSPITAL_URL, 
                    json={"query": query, "variables": {"id": prescription_id}},
                    timeout=10.0
                )
                if resp.status_code != 200: return "Error: Gagal koneksi ke Hospital Service"
                
                payload = resp.json()
                data = payload.get("data", {}).get("validatePrescription")
                
                if not data or not data.get("isValid"):
                    return "Error: Resep tidak valid"
                    
                prescription_medicines = data.get('medicines', [])
            except Exception as e: return f"Error: {str(e)}"

        # 2. Cek Inventory, Hitung Total & Siapkan Update Stok
        total_price = 0
        items_to_deduct = [] # List of tuples (id, qty)
        
        async with httpx.AsyncClient() as client:
            try:
                inv_query = {"query": "query { medicines { id price stock name } }"}
                inv_res = await client.post(INVENTORY_URL, json=inv_query)
                inventory_medicines = inv_res.json()['data']['medicines']
                
                for item in prescription_medicines:
                    name = item.get('name', '')
                    qty = item.get('qty', 0)
                    
                    inv_item = next((m for m in inventory_medicines if m['name'].lower() == name.lower()), None)
                    
                    if not inv_item: return f"Error: Obat '{name}' tidak ada di katalog"
                    if inv_item['stock'] < qty: return f"Error: Stok '{name}' tidak cukup"
                    
                    total_price += inv_item['price'] * qty
                    items_to_deduct.append({
                        "id": inv_item['id'],
                        "qty": qty,
                        "name": inv_item['name']
                    })
                    
            except Exception as e: return f"Error Inventory: {str(e)}"

        # 3. Validasi Pembayaran
        if payment_amount < total_price:
            return f"Error: Pembayaran Kurang. Total: Rp {total_price:,.0f}"

        # 4. Eksekusi Potong Stok
        async with httpx.AsyncClient() as client:
            try:
                for item in items_to_deduct:
                    # Mutation updateStock expects amount to add, so we send negative
                    deduct_amount = -1 * item['qty']
                    mutation = f"mutation {{ updateStock(id: \"{item['id']}\", amount: {deduct_amount}) }}"
                    await client.post(INVENTORY_URL, json={"query": mutation})
            except Exception: return "Error: Gagal update stok"

        # 5. Simpan Transaksi
        success_msg = ""
        try:
            conn = sqlite3.connect("transaction_db.sqlite")
            conn.execute("INSERT INTO transactions (prescription_id, total_price, status) VALUES (?, ?, ?)", (prescription_id, total_price, "PAID"))
            conn.commit()
            conn.close()
            
            item_summary = ", ".join([f"{x['qty']}x {x['name']}" for x in items_to_deduct])
            success_msg = f"Sukses! {item_summary}. Kembalian: Rp {payment_amount - total_price:,.0f}"
        except Exception as e: return f"Error Database: {str(e)}"
        
        # 6. (Optional) Webhook / Notify RS - Not implemented in simple GraphQL query
        # Bisa dibuat mutation terpisah di RS jika ada

        return success_msg

schema = strawberry.Schema(query=Query, mutation=Mutation)
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(GraphQLRouter(schema), prefix="/graphql")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)