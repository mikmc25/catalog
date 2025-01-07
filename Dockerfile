# Use the Node.js 18 slim image as the base
FROM node:18-slim

# Set the environment to production
ENV NODE_ENV=production

# Create the necessary directories
RUN mkdir -p /usr/src/app/log /usr/src/app/db

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of your application files
COPY . .

# Expose the port used by the application
EXPOSE 7000

# Set the default environment variable for Spaces
ENV PORT=7000

# Command to run your application
CMD ["node", "index.js"]
