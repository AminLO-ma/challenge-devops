# Quiz Web Application

Une application web de quiz en ligne permettant de créer et répondre à des quiz à choix unique.

## Table des matières

- [Structure du projet](#structure-du-projet)
- [Configuration Docker](#configuration-docker)
  - [Dockerfile Backend](#dockerfile-backend)
  - [Dockerfile Frontend](#dockerfile-frontend)
  - [Docker Compose](#docker-compose)
- [CI/CD avec GitHub Actions](#cicd-avec-github-actions)
- [Instructions d'exécution](#instructions-dexécution)

## Structure du projet

L'application est organisée selon l'architecture suivante :

```
challenge-devops/
├── .github/
│   └── workflows/         # Fichiers de configuration GitHub Actions
│       └── deploy.yml     # Pipeline CI/CD
├── backend/
│   ├── src/
│   │   ├── config/       # Configuration de la base de données
│   │   ├── controllers/  # Logique métier
│   │   ├── models/       # Modèles de données
│   │   └── routes/       # Routes API
│   ├── tests/            # Tests unitaires
│   └── Dockerfile        # Configuration Docker pour le backend
├── frontend/
│   ├── public/           # Fichiers statiques
│   ├── src/              # Code source React
│   └── Dockerfile        # Configuration Docker pour le frontend
├── .env.example          # Variables d'environnement (exemple)
├── docker-compose.yml    # Configuration Docker Compose
└── README.md             # Documentation du projet
```

## Configuration Docker

### Dockerfile Backend

Le backend Express.js est conteneurisé avec la configuration suivante :

```dockerfile
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
```

### Dockerfile Frontend

Le frontend React est conteneurisé avec une approche multi-stage :

```dockerfile
# Build stage
FROM node:16-alpine as build

WORKDIR /app

# Copy package.json
COPY package.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from build stage to nginx serve directory
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Command to run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

L'orchestration des services est gérée via Docker Compose :

```yaml
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: quiz-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-quiz_app}
      MYSQL_USER: ${MYSQL_USER:-quizuser}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-quizpassword}
    ports:
      - "${MYSQL_PORT:-3306}:3306"
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - quiz-network

  # Backend Express API
  backend:
    build: ./backend
    container_name: quiz-backend
    restart: unless-stopped
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - PORT=5000
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=${MYSQL_DATABASE:-quiz_app}
      - DB_USER=${MYSQL_USER:-quizuser}
      - DB_PASSWORD=${MYSQL_PASSWORD:-quizpassword}
    ports:
      - "${BACKEND_PORT:-5000}:5000"
    networks:
      - quiz-network

  # Frontend React App
  frontend:
    build: ./frontend
    container_name: quiz-frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "${FRONTEND_PORT:-80}:80"
    environment:
      - REACT_APP_API_URL=http://localhost:${BACKEND_PORT:-5000}/api
    networks:
      - quiz-network

networks:
  quiz-network:
    driver: bridge

volumes:
  mysql-data:
    driver: local
```

## CI/CD avec GitHub Actions

Le projet utilise GitHub Actions pour l'intégration et le déploiement continus :

```yaml
name: Build and Deploy Quiz App

on:
  push:
    branches: [ main, dev ]
  pull_request:
    branches: [ main, dev ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 16.x
      
      - name: Install backend dependencies
        working-directory: ./backend
        run: npm install
      
      - name: Run backend tests
        working-directory: ./backend
        run: npm test
  
  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/dev')
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_TOKEN }}
      
      - name: Build and push backend image
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: |
            aminloma/quiz-backend:latest
            aminloma/quiz-backend:${{ github.ref_name }}
      
      - name: Build and push frontend image
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: |
            aminloma/quiz-frontend:latest
            aminloma/quiz-frontend:${{ github.ref_name }}
```

Cette pipeline effectue les opérations suivantes :
1. Exécute les tests unitaires du backend
2. Si les tests réussissent et qu'il s'agit d'un push sur `main` ou `dev` :
   - Construit les images Docker pour le frontend et le backend
   - Pousse ces images sur Docker Hub avec les tags appropriés

## Instructions d'exécution

Pour exécuter l'application localement avec Docker Compose :

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/AminLO-ma/challenge-devops.git
   cd challenge-devops
   ```

2. Créez un fichier `.env` à partir de l'exemple :
   ```bash
   cp .env.example .env
   ```

3. Démarrez l'application :
   ```bash
   docker-compose up -d
   ```

4. Accédez à l'application :
   - Frontend : http://localhost (ou le port configuré)
   - API Backend : http://localhost:5000/api

5. Pour arrêter l'application :
   ```bash
   docker-compose down
   ```

Pour reconstruire les images après des modifications :
   ```bash
   docker-compose up --build -d
   ```
