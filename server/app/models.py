from sqlalchemy import Column, Integer, String, Index
from server.app.database import Base


class MyTable(Base):
    __tablename__ = "key_query"

    name = Column(String, primary_key=True, index=True)
    categories = Column(String, index=True)
    pool = Column(Integer, index=True)
    competitors_count = Column(Integer, index=True)
    growth_percent = Column(Integer, index=True)

