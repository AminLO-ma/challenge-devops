# Build stage
FROM node:16-alpine as build

# Set environment variables
ARG NODE_ENV=production
ARG CI=false
ENV NODE_ENV=${NODE_ENV}
ENV CI=${CI}

WORKDIR /app

# Copy package.json
COPY package.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# List the directory contents for debugging
RUN ls -la && ls -la public/

# Build the application with CI=false to prevent treating warnings as errors
RUN CI=${CI} npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage to nginx serve directory
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom nginx config if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Command to run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
