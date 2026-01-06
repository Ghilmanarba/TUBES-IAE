import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SERVICES = {
    "auth": "http://localhost:8001/graphql",
    "inventory": "http://localhost:8002/graphql",
    "transaction": "http://localhost:8003/graphql",
    "hospital": "http://localhost:8004/graphql"
}

@app.post("/api/{service}")
async def proxy(service: str, request: Request):
    target_url = SERVICES.get(service)
    if not target_url:
        return Response("Service not found", status_code=404)
    
    body = await request.body()
    headers = dict(request.headers)
    
    # Remove host header to avoid issues
    headers.pop("host", None)
    headers.pop("content-length", None)

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                target_url, 
                content=body, 
                headers=headers,
                timeout=30.0
            )
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                headers=dict(resp.headers)
            )
        except Exception as e:
            return Response(f"Proxy Error: {str(e)}", status_code=502)

# Mount static files
app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    print("Frontend server running on http://0.0.0.0:5000")
    uvicorn.run(app, host="0.0.0.0", port=5000)
