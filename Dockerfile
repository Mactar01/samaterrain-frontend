# Étape 1 : Build de l'application Angular
FROM node:18-alpine AS build

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier tout le code source
COPY . .

# Construire l'application (preprod par défaut, prod configurable via --build-arg CONFIGURATION=prod)
ARG CONFIGURATION=preprod
RUN npm run build:${CONFIGURATION}

# Étape 2 : Serveur Nginx pour distribuer les fichiers statiques
FROM nginx:alpine

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis l'étape 1
# Le chemin de build dépend de Angular 17+ (esbuild), généralement dist/frontend/browser
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
