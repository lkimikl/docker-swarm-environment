FROM node:18-alpine

WORKDIR /app

COPY web-app/package*.json ./

RUN npm install --production

COPY web-app/ ./

EXPOSE 3000

CMD ["node", "index.js"]