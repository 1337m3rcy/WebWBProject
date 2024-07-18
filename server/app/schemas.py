from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime


class DataRow(BaseModel):
    name: str
    categories: Optional[str] = None
    pool: int
    competitors_count: int
    growth_percent: Optional[int] = None
    timestamp: Optional[datetime]

    class Config:
        orm_mode = True
        from_attributes = True


class DataResponse(BaseModel):
    data: List[DataRow]

