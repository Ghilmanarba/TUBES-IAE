import strawberry
from typing import List, Optional
from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter

# Mock Data - Data Resep untuk Testing
MOCK_PRESCRIPTIONS = {
    "RS-1001": {
        "patient": "Budi Santoso",
        "doctor": "Dr. Arief",
        "medicines": [{"id": "1", "name": "Paracetamol", "qty": 2}]
    },
    "RS-1002": {
        "patient": "Siti Aminah",
        "doctor": "Dr. Bunga",
        "medicines": [{"id": "2", "name": "Amoxicillin", "qty": 1}]
    },
    "RS-1003": {
        "patient": "Andi Pratama",
        "doctor": "Dr. Citra",
        "medicines": [{"id": "1", "name": "Paracetamol", "qty": 1}, {"id": "2", "name": "Amoxicillin", "qty": 1}]
    },
    "RS-1004": {
        "patient": "Dewi Lestari",
        "doctor": "Dr. Dedi",
        "medicines": [{"id": "1", "name": "Paracetamol", "qty": 5}]
    },
    "RS-1005": {
        "patient": "Eko Kurniawan",
        "doctor": "Dr. Eka",
        "medicines": [] 
    }
}

@strawberry.type
class MedicineItem:
    id: str
    name: str
    qty: int

@strawberry.type
class PrescriptionResult:
    isValid: bool
    patientName: Optional[str] = None
    medicines: Optional[List[MedicineItem]] = None

@strawberry.type
class Prescription:
    id: str
    patientName: str
    doctorName: str
    medicines: List[MedicineItem]

@strawberry.type
class Query:
    @strawberry.field
    def validatePrescription(self, id: str) -> PrescriptionResult:
        if id in MOCK_PRESCRIPTIONS:
            data = MOCK_PRESCRIPTIONS[id]
            meds = [MedicineItem(id=m["id"], name=m["name"], qty=m["qty"]) for m in data["medicines"]]
            return PrescriptionResult(isValid=True, patientName=data["patient"], medicines=meds)
        return PrescriptionResult(isValid=False, patientName=None, medicines=None)

    @strawberry.field
    def allPrescriptions(self) -> List[Prescription]:
        return [
            Prescription(
                id=k, 
                patientName=v["patient"], 
                doctorName=v["doctor"],
                medicines=[MedicineItem(id=m["id"], name=m["name"], qty=m["qty"]) for m in v["medicines"]]
            ) 
            for k, v in MOCK_PRESCRIPTIONS.items()
        ]

schema = strawberry.Schema(query=Query)
app = FastAPI()
app.include_router(GraphQLRouter(schema), prefix="/graphql")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)