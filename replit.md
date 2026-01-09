# AmplePharma - Pharmacy Management System

## Overview
A microservices-based pharmacy management system with a vanilla HTML/JS frontend and multiple Python (FastAPI/GraphQL) backend services.

## Project Structure
- `frontend/` - Vanilla HTML/JS/Tailwind CSS application with Python server
  - `server.py` - FastAPI server serving static files and proxying API requests
  - `src/js/` - JavaScript modules (api, auth, dashboard, etc.)
  - `*.html` - HTML pages (login, index, inventory, transaction)
- `auth-service/` - Authentication service (GraphQL, port 8001)
- `inventory-service/` - Medicine inventory management (GraphQL, port 8002)
- `transaction-service/` - Transaction processing (GraphQL, port 8003)
- `hospital-mock/` - Mock hospital service for prescription validation (GraphQL, port 8004)

## Running the Application
All services are started via `bash start_services.sh` which:
1. Starts all 4 Python backend services on ports 8001-8004
2. Starts the frontend server on port 5000

The frontend server proxies API requests to the appropriate backend services.

## API Endpoints (via frontend proxy)
- `POST /api/auth` -> Auth service (port 8001)
- `POST /api/inventory` -> Inventory service (port 8002)
- `POST /api/transaction` -> Transaction service (port 8003)
- `POST /api/hospital` -> Hospital mock service (port 8004)

## Default Credentials
- Username: `admin_naufal`
- Password: `apotek123`

## Tech Stack
- **Frontend**: HTML, JavaScript (ES6 modules), Tailwind CSS
- **Backend**: Python, FastAPI, Strawberry GraphQL
- **Database**: SQLite (per-service)
