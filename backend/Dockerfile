FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package.json
COPY package.json ./

# Install dependencies
RUN npm install --only=production

# Copy application files
COPY . .

# Create .env file if it doesn't exist
RUN touch .env

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["node", "src/index.js"]
