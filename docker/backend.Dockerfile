FROM node:24.4.1-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
