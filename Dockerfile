# React Admin Dockerfile
FROM node:20-alpine

# Install necessary packages for Next.js
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Configure npm for better network handling
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Copy package files
COPY package*.json ./

# Install dependencies with increased timeout and retries
RUN npm ci --prefer-offline --no-audit || \
    (npm cache clean --force && npm ci --prefer-offline --no-audit)

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["npm", "start"]
