FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Prisma setup
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application source
COPY . .

# Runtime port is controlled by SERVER_PORT
EXPOSE 3000

CMD ["node", "src/index.js"]
