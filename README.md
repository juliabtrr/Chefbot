# ChefBot — Next.js

Petit projet propre pour générer une recette à partir d'ingrédients via l'API d'IA.

## Installation

1. Cloner le dossier ou dézipper.
2. Copier `.env.example` en `.env.local` et mettre votre clé.

```
OPENAI_API_KEY=sk-...
```

3. Installer et lancer :

```bash
npm install
npm run dev
```

## Démo locale

- Ouvrir http://localhost:3000
- Entrer les ingrédients
- Cliquer "Générer la recette"
- Vous arrivez sur la page résultat avec image + bouton "Lire la recette".

## Notes
- L'image utilise `gpt-image-1` en 1024x1024. Si ça coince, l'app renvoie quand même la recette.
- Le TTS utilise l'API Web Speech du navigateur (pas de clé externe).