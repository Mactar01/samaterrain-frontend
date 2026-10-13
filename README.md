# myTerrain — Tableau de Bord Web 🏢 (Angular 17+)

Application Web d'administration et de gestion de terrains pour les propriétaires et administrateurs, construite avec **Angular 17+ (TypeScript)**, **TailwindCSS**, et **Chart.js**.

---

## 🌍 Environnements

| Environnement | Cible & Hébergement | Fichier | URL API Backend |
| :--- | :--- | :--- | :--- |
| **develop** | Machine locale Dev | `src/environments/environment.develop.ts` | `http://localhost:8000/api/v1` |
| **preprod** | **DigitalOcean** (Nginx / App) | `src/environments/environment.preprod.ts` | `https://staging-api.myterrain.sn/api/v1` |
| **prod** | **Serveur Dédié Réel** | `src/environments/environment.prod.ts` | `https://api.myterrain.sn/api/v1` |

---

## 🚀 Démarrage Rapide (Local)

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement (mode develop)
npm start
# ou
npm run start:develop

# Le dashboard sera accessible sur http://localhost:4200
```

---

## 🔨 Commandes de Build

```bash
# Build pour DigitalOcean (Preprod) :
npm run build:preprod

# Build pour le serveur réel (Prod) :
npm run build:prod
```
Les fichiers compilés sont générés dans `dist/frontend/browser/`.

---

## 🐳 Déploiement Docker & Nginx (DigitalOcean)

Un `Dockerfile` optimisé multi-stage et une configuration `nginx.conf` sont inclus :
```bash
docker build -t myterrain-frontend .
docker run -p 80:80 myterrain-frontend
```

---

## 🔄 Git Workflow
- `develop` : Développement local
- `preprod` : Déploiement automatique sur DigitalOcean via Pull Request
- `main` : Production réelle via Pull Request
