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

# Установите рабочую директорию
WORKDIR /app

# Скопируйте файлы проекта в контейнер
COPY . .

# Команда для запуска FastAPI сервера с uvicorn
#CMD ["uvicorn", "server.app.main:app", "--host", "0.0.0.0", "--port", "8080"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]

