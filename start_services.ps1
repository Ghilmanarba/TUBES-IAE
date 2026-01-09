.\start_services.psWrite-Host "Starting Auth Service on port 8001..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'auth-service'; ..\venv\Scripts\python -m uvicorn app:app --port 8001"

Write-Host "Starting Inventory Service on port 8002..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'inventory-service'; ..\venv\Scripts\python -m uvicorn app:app --port 8002"

Write-Host "Starting Transaction Service on port 8003..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'transaction-service'; ..\venv\Scripts\python -m uvicorn app:app --port 8003"

Write-Host "Starting Hospital Mock on port 8004..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'hospital-mock'; ..\venv\Scripts\python -m uvicorn app:app --port 8004"

Write-Host "All services started. You can close them by closing the new PowerShell windows."
