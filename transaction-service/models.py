from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False) # ID Pasien dari Auth Service [cite: 161]
    prescription_id = Column(String, nullable=True) # ID dari Hospital Service [cite: 161, 162]
    total_price = Column(Float, nullable=False)
    payment_amount = Column(Float, nullable=False)
    change_amount = Column(Float, nullable=False) # Kembalian [cite: 85]
    status = Column(String, default="PAID") # Status: PAID atau COMPLETED [cite: 57, 148]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)