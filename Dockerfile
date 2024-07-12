# Используем официальный образ Python для версии 3.10
FROM python:3.10-slim

# Установка необходимых пакетов для компиляции зависимостей Python
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# Установка pip и управление зависимостями Python
RUN pip install --upgrade pip

# Установите рабочую директорию
WORKDIR /app

# Копирование файла зависимостей и установка зависимостей
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt gunicorn

# Скопируйте файлы проекта в контейнер
COPY . .

# Команда для запуска FastAPI сервера с gunicorn
#CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "server.app.main:app", "--bind", "0.0.0.0:8080"]
CMD gunicorn server.app.main:app --workers 3 --worker-class uvicorn.workers.UvicornWorker --bind=0.0.0.0:8080

