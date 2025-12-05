FROM node:18-alpine

WORKDIR /app

# Копируем зависимости
COPY web-app/package*.json ./

# Устанавливаем зависимости
RUN npm install --production

# Копируем исходный код
COPY web-app/ ./

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["node", "index.js"]