from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True) # Kode Obat [cite: 70]
    name = Column(String, nullable=False)
    stock = Column(Integer, default=0)
    price = Column(Float, nullable=False)
    category = Column(String) # Umum atau Obat Keras [cite: 70, 146]
    description = Column(String)