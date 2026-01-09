#!/bin/bash

cd auth-service && python app.py &
sleep 1
cd inventory-service && python app.py &
sleep 1
cd transaction-service && python app.py &
sleep 1
cd hospital-mock && python app.py &
sleep 2
cd frontend && python server.py
