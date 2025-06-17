FROM node:20-alpine

WORKDIR /app
COPY . .

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Mount the source code
CMD ["npm", "run", "dev"]
