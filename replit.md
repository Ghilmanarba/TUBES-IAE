# AmplePharmacy - Pharmacy Management System

## Overview
A microservices-based pharmacy management system with a React frontend and multiple Python (FastAPI/GraphQL) backend services.

## Project Structure
- `frontend/` - React + Vite + TypeScript + Tailwind CSS application
- `auth-service/` - Authentication service (GraphQL, port 8001)
- `inventory-service/` - Medicine inventory management (GraphQL, port 8002)
- `transaction-service/` - Transaction processing (GraphQL, port 8003)
- `hospital-mock/` - Mock hospital service for prescription validation (GraphQL, port 8004)

## Running the Application
All services are started via `bash start_services.sh` which:
1. Starts all 4 Python backend services
2. Starts the Vite development server on port 5000

The frontend proxies API requests to the appropriate backend services via Vite's proxy configuration.

## API Endpoints (via frontend proxy)
- `/api/auth` -> Auth service (port 8001)
- `/api/inventory` -> Inventory service (port 8002)
- `/api/transaction` -> Transaction service (port 8003)
- `/api/hospital` -> Hospital mock service (port 8004)

## Default Credentials
- Username: `admin_naufal`
- Password: `apotek123`

## Tech Stack
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, React Router
- **Backend**: Python, FastAPI, Strawberry GraphQL
- **Database**: SQLite (per-service)
