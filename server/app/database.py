from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql+asyncpg://mercy:1337@31.172.66.180:5432/wbWordsStatMarket"

engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

Base = declarative_base()


async def get_db():
    async with SessionLocal() as session:
        yield session


async def connect():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def disconnect():
    await engine.dispose()
