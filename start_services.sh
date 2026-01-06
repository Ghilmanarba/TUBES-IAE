#!/bin/bash

cd auth-service && python app.py &
cd inventory-service && python app.py &
cd transaction-service && python app.py &
cd hospital-mock && python app.py &
cd frontend && python server.py
