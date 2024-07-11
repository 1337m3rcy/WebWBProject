# Используем официальный образ Python для версии 3.10
FROM python:3.10-slim

# Установка необходимых пакетов для компиляции зависимостей Python
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# Установка pip и управление зависимостями Python
RUN pip install --upgrade pip

# Копирование файла зависимостей и установка зависимостей
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Копирование серверной части в контейнер
COPY server/app /app

# Копирование клиентской части в контейнер
COPY client /client

WORKDIR /app

# Команда для запуска FastAPI сервера с uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

