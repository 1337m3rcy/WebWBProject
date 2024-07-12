# Используем официальный образ Python для версии 3.10
FROM python:3.10-slim

# Установка необходимых пакетов для компиляции зависимостей Python
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Установка pip и управление зависимостями Python
RUN pip install --upgrade pip

# Установите рабочую директорию
WORKDIR /app

# Копирование файла зависимостей и установка зависимостей
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Скопируйте файлы проекта в контейнер
COPY . .

# Установить переменную окружения для настройки порта
ENV PORT 8080

# Команда для запуска FastAPI сервера с gunicorn и uvicorn worker
CMD ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8080", "server.app.main:app"]

