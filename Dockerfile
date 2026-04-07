# Use Node.js image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the frontend
RUN npm run build

# Expose the port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start the server
CMD ["npx", "tsx", "server.ts"]
