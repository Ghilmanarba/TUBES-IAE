import strawberry
from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter

@strawberry.type
class PrescriptionResult:
    isValid: bool

@strawberry.type
class Query:
    @strawberry.field
    def validatePrescription(self, id: str) -> PrescriptionResult:
        # Simulasi validasi resep [cite: 176]
        return PrescriptionResult(isValid=True if id.startswith("RS") else False)

schema = strawberry.Schema(query=Query)
app = FastAPI()
app.include_router(GraphQLRouter(schema), prefix="/graphql")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)