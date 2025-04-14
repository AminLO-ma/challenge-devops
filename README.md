# Quiz Web Application

A full-stack web application for creating and responding to online quizzes with multiple-choice questions.

## Project Structure

- **Frontend**: ReactJS (Create React App)
- **Backend**: ExpressJS (Node.js)
- **Database**: MySQL

## Dockerized Setup

This project is containerized using Docker and Docker Compose for easy development and deployment.

### Prerequisites

- Docker and Docker Compose installed on your machine
- Git for version control

### Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/AminLO-ma/challenge-devops.git
   cd challenge-devops
   ```

2. Create a `.env` file from the example:
   ```
   cp .env.example .env
   ```

3. Start the application:
   ```
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: http://localhost (or configured port)
   - Backend API: http://localhost:5000/api

### Development

To start the development servers:

```
docker-compose up
```

To rebuild containers after making changes:

```
docker-compose up --build
```

## Docker Images

The application consists of three services:

- **Frontend**: React application served via Nginx
- **Backend**: Express API server
- **MySQL**: Database server

### Building Docker Images Manually

Build the images:

```bash
# Build backend image
docker build -t mydockerhubuser/quiz-backend:latest ./backend

# Build frontend image
docker build -t mydockerhubuser/quiz-frontend:latest ./frontend
```

### Pushing to Docker Hub

```bash
# Login to Docker Hub
docker login

# Push backend image
docker push mydockerhubuser/quiz-backend:latest

# Push frontend image
docker push mydockerhubuser/quiz-frontend:latest
```

## CI/CD Pipeline

The project uses GitHub Actions for Continuous Integration and Deployment:

1. On push to `main` or `dev` branches, tests are run
2. If tests pass, Docker images are built and pushed to Docker Hub
3. Tags are created based on the branch name

### Required GitHub Secrets

- `DOCKER_HUB_USERNAME`: Your Docker Hub username
- `DOCKER_HUB_TOKEN`: Your Docker Hub password or access token
