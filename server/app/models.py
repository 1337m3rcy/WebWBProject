from sqlalchemy import Column, Integer, String, Float, DateTime, func
from server.app.database import Base


class Stat4Market(Base):
    __tablename__ = "key_words"

    name = Column(String, primary_key=True, index=True)
    categories = Column(String, index=True)
    pool = Column(Integer, index=True)
    competitors_count = Column(Integer, index=True)
    growth_percent = Column(Integer, index=True)
    timestamp = Column(DateTime, index=True)


class WbMyTop(Base):
    __tablename__ = "wbmytop"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    categories = Column(String, index=True)
    pool = Column(Integer, index=True)
    competitors_count = Column(Integer, index=True)
    growth_percent = Column(Float, index=True, default=func.round(0, 2))
    timestamp = Column(DateTime, index=True)
