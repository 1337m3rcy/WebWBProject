from typing import List, Optional
from pydantic import BaseModel, validator
from datetime import datetime


class DataRow(BaseModel):
    name: str
    categories: Optional[str] = None
    pool: int
    competitors_count: int
    growth_percent: Optional[float] = None
    timestamp: Optional[datetime]

    @validator('growth_percent', pre=True, always=True)
    def round_growth_percent(cls, v):
        return round(v, 0) if v is not None else v  # Округление до 2 знаков после запятой

    class Config:
        orm_mode = True
        from_attributes = True


class DataResponse(BaseModel):
    data: List[DataRow]

