import pandas as pd

from fastapi import FastAPI, Depends, Request, Query
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import func, asc, desc, and_
from sqlalchemy.orm import Session
from sqlalchemy.future import select
from starlette.responses import StreamingResponse

from typing import Union, Optional
from io import TextIOBase, BytesIO
import os

import logging
from server.app import models, database, schemas

# Импортируем необходимые модули для статических файлов
from fastapi.staticfiles import StaticFiles
from starlette.staticfiles import StaticFiles as StarletteStaticFiles

app = FastAPI(
    title='База данных ключевых запросов'
)

# Настройка статических файлов
static_directory = os.path.join(os.path.dirname(__file__), '..', '..', 'client')
app.mount("/static", StaticFiles(directory=static_directory), name="static")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

origins = [
    "http://localhost",
    "http://127.0.0.1:5500",  # Пример для локального разработчика
    "http://245409.fornex.cloud",  # Добавленный домен и порт
    "http://245409.fornex.cloud:81",
    "http://31.172.66.180",  # Добавленный IP-адрес и порт
    "http://31.172.66.180:81"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["*"],
)


# Получение общего количества данных с учетом фильтров
async def get_count_data(db: Session, name: str = None, pool: int = None, pool_type: str = None,
                         competitors_count: int = None, competitors_type: str = None,
                         growth_percent: int = None, growth_type: str = None, filter: str = None) -> int:
    query = select(func.count(models.MyTable.name))

    if not (name or pool or competitors_count or growth_percent) or filter is None or filter == "":
        query = query.filter(models.MyTable.pool > 200)

    logger.info()

    query = apply_filters(query, pool, pool_type, competitors_count, competitors_type, growth_percent, growth_type)

    logger.info(f"Count query: {query}")  # Логирование запроса на получение общего количества данных

    total_count = await db.execute(query)
    return total_count.scalar()


def generate_csv(data):
    # Создаем DataFrame из данных
    df = pd.DataFrame([{
        "Name": row.name,
        "Category": row.categories,
        "Pool": row.pool,
        "Competitors Count": row.competitors_count,
        "Growth Percent": row.growth_percent
    } for row in data])

    # Создаем текстовый файлоподобный объект для записи CSV данных
    output: Union[TextIOBase, BytesIO] = BytesIO()

    # Записываем данные DataFrame в текстовый файлоподобный объект с кодировкой UTF-8 с BOM
    df.to_csv(output, sep=";", encoding='utf-8-sig', index=False)

    # Возвращаем содержимое текстового файла в виде байтового объекта
    output.seek(0)
    return output


# Функция для применения фильтров
def apply_filters(query, pool: Optional[int] = None, poolFilterType: Optional[str] = None,
                  competitorsCount: Optional[int] = None, competitorsFilterType: Optional[str] = None, growthPercent: Optional[int] = None,
                  growthFilterType: Optional[str] = None, filter: Optional[str] = None):
    filters = []
    if filter is not None:
        filters.append(models.MyTable.name.like(f"%{filter}%"))

    if pool is not None and poolFilterType:
        if poolFilterType == "greater":
            filters.append(models.MyTable.pool > pool)
        elif poolFilterType == "less":
            filters.append(models.MyTable.pool < pool)

    if competitorsCount is not None and competitorsFilterType:
        if competitorsFilterType == "greater":
            filters.append(models.MyTable.competitors_count > competitorsCount)
        elif competitorsFilterType == "less":
            filters.append(models.MyTable.competitors_count < competitorsCount)

    if growthFilterType and growthPercent is not None:
        if growthFilterType == "greater":
            filters.append(models.MyTable.growth_percent > growthPercent)
        elif growthFilterType == "less":
            filters.append(models.MyTable.growth_percent < growthPercent)

    if filters:
        query = query.filter(and_(*filters))
    logger.info(f"Applied filters: {filters}")  # Проверяем SQL запрос с фильтрами

    return query


@app.on_event("startup")
async def startup():
    await database.connect()


@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()


@app.get("/data", response_model=schemas.DataResponse)
async def get_data(
        request: Request,
        pool: int = Query(None, alias="pool"),
        poolFilterType: str = Query(None, alias="poolFilterType"),
        competitorsCount: int = Query(None, alias="competitorsCount"),
        competitorsFilterType: str = Query(None, alias="competitorsFilterType"),
        growthPercent: int = Query(None, alias="growthPercent"),
        growthFilterType: str = Query(None, alias="growthFilterType"),
        skip: int = 0,
        limit: int = 300,
        db: Session = Depends(database.get_db),
        queryFunction: str = Query(None, alias="queryFunction"),
        filter: str = Query(None, alias="name")
):
    logger.info(f"IN GET_DATA Received request: {request.url}")
    query = select(models.MyTable)

    logger.info(f"PARAMETERS HERE - {filter}\n FUNCTION HERE {queryFunction}")

    if filter is None or filter == "":
        query = query.filter(models.MyTable.pool > 200)

    if queryFunction == "filterFormSubmit":
        if filter is not None and filter != "":
            query = apply_filters(query, pool, poolFilterType, competitorsCount, competitorsFilterType, growthPercent, growthFilterType, filter)

    query = query.order_by(desc(models.MyTable.name)).offset(skip).limit(limit)
    result = await db.execute(query)
    data = result.scalars().all()

    logger.info(f"Query: {query}\nFilters: pool={pool}, poolFilterType={poolFilterType}, competitorsCount={competitorsCount}, competitorsFilterType={competitorsFilterType}, growthFilterType={growthFilterType}")

    result_data = {"data": [schemas.DataRow.from_orm(row) for row in data]}
    return result_data


@app.get("/total_count", response_model=int)
async def get_total_count_endpoint(
        request: Request,
        pool: int = Query(None, alias="pool"),
        poolFilterType: str = Query(None, alias="poolFilterType"),
        competitorsCount: int = Query(None, alias="competitorsCount"),
        competitorsFilterType: str = Query(None, alias="competitorsFilterType"),
        growthPercent: int = Query(None, alias="growthPercent"),
        growthFilterType: str = Query(None, alias="growthFilterType"),
        db: Session = Depends(database.get_db),
        filter: str = Query(None, alias="name"),
        queryFunction: str = Query(None, alias="queryFunction")
):
    logger.info(f"IN TOTAL COUNT Received request: {request.url}")
    query = select(func.count(models.MyTable.name))

    logger.info(f"FILTER HERE HERE HERE - {filter}\nFUNCTION HERE {queryFunction}")

    if filter is None or filter == "":
        query = query.filter(models.MyTable.pool > 200)

    if queryFunction == "filterFormSubmit":
        if filter is not None and filter != "":
            query = apply_filters(query, pool, poolFilterType, competitorsCount, competitorsFilterType, growthPercent, growthFilterType, filter)

    total_count = await db.execute(query)
    return total_count.scalar()


@app.get("/export_csv")
async def export_csv(
        request: Request,
        pool: int = Query(None, alias="pool"),
        poolFilterType: str = Query(None, alias="poolFilterType"),
        competitorsCount: int = Query(None, alias="competitorsCount"),
        competitorsFilterType: str = Query(None, alias="competitorsFilterType"),
        growthPercent: int = Query(None, alias="growthPercent"),
        growthFilterType: str = Query(None, alias="growthFilterType"),
        db: Session = Depends(database.get_db),
        queryFunction: str = Query(None, alias="queryFunction"),
        filter: str = Query(None, alias="name")
):
    logger.info(f"Received request: {request.url}\n FILTER HERE {filter}\nQUERYFUNCTION HERE {queryFunction}")
    query = select(models.MyTable)

    if queryFunction == "downloadCSV":
        if filter is not None and filter != "":
            query = apply_filters(query, pool, poolFilterType, competitorsCount, competitorsFilterType, growthPercent, growthFilterType, filter)
    else:
        query = query.filter(models.MyTable.pool > 200)

    result = await db.execute(query)
    data = result.scalars().all()

    logger.info(
        f"Query: {query}\nFilters: pool={pool}, poolFilterType={poolFilterType}, competitorsCount={competitorsCount}, competitorsFilterType={competitorsFilterType}, growthFilterType={growthFilterType}")

    csv_content = generate_csv(data)

    return StreamingResponse(csv_content, media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=export.csv"})
