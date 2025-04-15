# Quiz Web Application

Une application web de quiz en ligne permettant de créer et répondre à des quiz à choix unique.

## Table des matières

- [Structure du projet](#structure-du-projet)
- [Questions Théoriques – DevOps](#questions-théoriques-devops)
- [Configuration Docker](#configuration-docker)
  - [Dockerfile Backend](#dockerfile-backend)
  - [Dockerfile Frontend](#dockerfile-frontend)
  - [Docker Compose](#docker-compose)
- [CI/CD avec GitHub Actions](#cicd-avec-github-actions)
- [Instructions d'exécution](#instructions-dexécution)

# Questions Théoriques – DevOps

##  Comment définiriez-vous le DevOps ?

Le DevOps est une démarche / philosophie, qui peut être définie et réalisée de plusieurs manières selon le contexte, les projets et les technologies de l'entreprise.  
Cette démarche peut être très bénéfique dans le processus de développement et de déploiement, car elle permet aux développeurs de ne plus se soucier des erreurs liées au code, d'avoir une meilleure clarté dans *"qui a fait quoi"*.  
Du côté des personnes chargées de l’infrastructure, elles peuvent collaborer de manière beaucoup plus directe avec les développeurs.  
Cela leur permet une rapidité de mise en production, et ça simplifie leur travail de configuration, notamment avec Docker et Docker Compose.

---

##  Qu’impose le DevOps ?

Le DevOps impose trois choses principales :  

- L’utilisation d’**outils pertinents** pour le bon fonctionnement de la démarche, à la fois dans le projet et à l’échelle de l’entreprise.  
  Par exemple, **Docker** est l’un des outils principaux pour la mise en production, grâce à la **containerisation**.

- Pour tout ce qui touche au **versioning**, des outils comme **GitHub** ou **GitLab** sont largement utilisés.  
  GitHub Actions permet notamment d’automatiser la mise en production avec des pipelines **CI/CD**.

- Enfin, ce qui me semble le plus important : **les tests**.  
  Qu’il s’agisse de tests unitaires, fonctionnels, ou d’intégration, ils sont imposés dans une démarche DevOps car ils permettent de valider la qualité du code.  
  Ça permet de **pousser son code sereinement**, à condition de bien couvrir les différents cas, y compris ceux censés échouer.  
  Bien sûr, cela dépend toujours du contexte du projet.

---

##  Quels sont les inconvénients ou les faiblesses du DevOps ?

Il y a certaines limitations du DevOps, notamment selon le type d’application développée.  
Par exemple, les **applications desktop** n’ont pas forcément besoin d’une mise à jour régulière, donc l’intérêt du DevOps est plus limité.  
En revanche, pour les **applications web**, c’est clairement plus avantageux.

Pour les **applications mobiles**, j’ai déjà vu des cas où les mises à jour sont automatiques, et d’autres où elles sont manuelles — donc je ne connais pas encore toutes les contraintes spécifiques dans ce domaine.

Par ailleurs, avec **Docker** comme outil principal de mise en prod, une entreprise peut être limitée si elle doit gérer une orchestration de conteneurs avec **Kubernetes**.  
Cela demande des ressources matérielles, mais aussi humaines — il faut maîtriser les outils d’orchestration.

Enfin, Docker ne permet pas une **scalabilité optimale du stockage**, donc certaines **bases de données ne peuvent pas être containerisées** efficacement à grande échelle.

---

##  Quel est votre avis sur le DevOps ?

Je trouve que le DevOps est quelque chose d’essentiel, qui **fluidifie le processus de développement** et **assure une bonne qualité de code**, un bon suivi, et une certaine **sérénité dans le travail d’équipe**.  
Mais cela reste vrai **à condition que ce soit bien utilisé** et qu’on ne le détourne pas de son objectif principal.  
Cela dit, il y a encore certaines limites aujourd’hui.

---

##  Quels sont les tests primordiaux pour toute application ?

Les **tests unitaires**, les **tests d’intégration**, les **tests fonctionnels** et les **tests de sécurités** sont, pour moi, les plus importants.

---
---

### Remarque sur l’état d’avancement

Je me suis arrêté au **point 4 de la feuille de route**, c’est-à-dire à la **mise en production sur DockerHub**, afin de consacrer le temps nécessaire à bien structurer le projet et à mettre en place une démarche **DevOps cohérente et de qualité** dès les premières étapes.

L’objectif était de garantir une base technique **propre**, **automatisée** et **facilement maintenable**, avant de passer aux étapes suivantes comme la gestion des utilisateurs ou l’interface frontend.

Cela m’a permis d’appliquer les bonnes pratiques DevOps :
- Conteneurisation avec **Docker**,
- Configuration de **Docker Compose**,
- Automatisation **CI/CD** avec **GitHub Actions**,
- Et les **premiers tests backend**.

Cette rigueur initiale facilitera grandement les évolutions futures du projet.

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

---

## Déploiement en production avec Docker Hub

Grâce à la CI/CD (GitHub Actions), les images Docker du backend et du frontend sont automatiquement construites et poussées sur Docker Hub à chaque push sur `main` ou `dev`.

- **Backend** : [`aminloma/quiz-backend`](https://hub.docker.com/r/aminloma/quiz-backend)
- **Frontend** : [`aminloma/quiz-frontend`](https://hub.docker.com/r/aminloma/quiz-frontend)

### Récupérer et lancer les images en production

Sur votre serveur de production, vous pouvez directement utiliser les images publiées sur Docker Hub :

```bash
# Backend
sudo docker pull aminloma/quiz-backend:latest
sudo docker run -d --name quiz-backend -p 5000:5000 \
  --env-file /chemin/vers/.env \
  aminloma/quiz-backend:latest

# Frontend
sudo docker pull aminloma/quiz-frontend:latest
sudo docker run -d --name quiz-frontend -p 80:80 \
  aminloma/quiz-frontend:latest
```

> **Remarque :** Adaptez les variables d'environnement et les ports selon vos besoins. Pour une stack complète (avec base de données, etc.), privilégiez `docker-compose` ou un orchestrateur.

### Mise à jour

Pour mettre à jour votre application en production :
```bash
sudo docker pull aminloma/quiz-backend:latest
sudo docker pull aminloma/quiz-frontend:latest
sudo docker restart quiz-backend
sudo docker restart quiz-frontend
```

---
