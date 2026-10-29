* [ ] 

# Planning Tracker

Tracker de progression par jours et tâches, réutilisable pour n'importe quel projet.
Aucune installation : ouvre `index.html` dans le navigateur.

## Créer un planning

Bouton **+ Nouveau planning** : titre, date de début, puis pour chaque jour un titre
et une liste de tâches (une par ligne). Les jours peuvent être réordonnés (↑ ↓) ou supprimés.
Les dates sont calculées depuis la date de début en sautant les week-ends
(case à cocher pour les compter).

Bouton **Modifier** pour changer un planning existant (la progression est conservée).
Les plannings fournis dans `plannings/` se modifient en les dupliquant.

## Sauvegarde

Tout est stocké dans le navigateur (localStorage). **Exporter** produit un fichier JSON
avec le planning ET la progression ; **Importer** le restaure, sur cet appareil ou un autre.
Vider les données du navigateur efface les plannings : exporte régulièrement.

## Structure

- `index.html` — la page
- `css/style.css` — le design
- `js/app.js` — le moteur (suivi + éditeur)
- `plannings/herdtech.js` — planning fourni (optionnel, supprimable avec sa ligne `<script>` dans `index.html`)

## Rythme et replanification

Le widget **Rythme** compare tes tâches terminées à celles prévues sur les jours déjà passés
(en retard / dans les temps / en avance). Si tu es en retard, **Replanifier** décale les jours
non terminés à partir d'aujourd'hui ; **Calendrier d'origine** annule ce décalage.

## Notes

Chaque journée a une zone **Notes du jour** ; chaque tâche a un bouton 📝 pour une note
dédiée (il reste en surbrillance quand une note existe). Les notes sont enregistrées en tapant
et incluses dans l'export / import.

## Application installable (hors-ligne)

Le projet est une PWA : une fois hébergé en https, il s'installe sur l'écran d'accueil
et fonctionne sans connexion. Un simple fichier ouvert depuis le disque ne peut pas s'installer.

**Héberger gratuitement avec GitHub Pages**

1. Mets le contenu du dossier (avec `index.html` à la racine) dans un dépôt GitHub.
2. Dépôt → Settings → Pages → Source : branche `main`, dossier `/ (root)`.
3. Ouvre l'adresse `https://<ton-compte>.github.io/<depot>/`.

**Installer**

- Android / Chrome / Edge : bouton **Installer l'application** (ou menu du navigateur).
- iPhone (Safari) : Partager → Sur l'écran d'accueil.

Important : les données sont propres à chaque adresse. Pour reprendre tes plannings sur
l'adresse hébergée, fais **Exporter** ici puis **Importer** là-bas.
Quand tu modifies les fichiers, change `CACHE` dans `sw.js` (ex. `v2`) pour forcer la mise à jour.

## Modèles

Dans **+ Nouveau planning**, des modèles (site web, migration React, application mobile, rapport,
apprentissage) pré-remplissent les jours et les tâches ; il reste à choisir la date de début.
**Enregistrer comme modèle** transforme le planning affiché en modèle personnel (supprimable avec ✕).
Les modèles intégrés se modifient dans `js/templates.js`.

## Sauvegarde et rappel

**Tout sauvegarder** exporte un seul fichier avec tous les plannings, la progression, les dates,
les notes et tes modèles ; **Importer** le restaure. Si tu as modifié des données et que la dernière
sauvegarde complète date de plus de 7 jours (ou n'existe pas), un bandeau te le rappelle
(« Plus tard » le repousse de 2 jours).
