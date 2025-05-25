# Utiliser Node.js 18 comme image de base
FROM node:18-slim

# Créer le répertoire de l'application
WORKDIR /app

# Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du code
COPY . .

# Créer le répertoire pour les données
RUN mkdir -p /data

# Exposer le port
EXPOSE 8080

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=8080

# Commande de démarrage
CMD ["npm", "start"] 