/* Modèles de planning proposés dans « Nouveau planning ».
   Ajoute ou modifie les tiens ici : ["Titre du jour", "tâche 1", "tâche 2", ...] */
const mk = rows => rows.map(([title, ...tasks]) => ({ title, tasks }));
window.TEMPLATES = [
  { id: "site-web", name: "Site web vitrine", description: "Du cadrage à la mise en ligne", days: mk([
    ["Cadrage", "Définir les objectifs et le public", "Lister les pages et les contenus", "Choisir les outils et l'hébergement"],
    ["Maquettes", "Dessiner la structure des pages", "Choisir couleurs et typographies", "Valider les maquettes"],
    ["Intégration (accueil)", "Créer la structure HTML", "Mettre en place le CSS", "Rendre la page responsive"],
    ["Intégration (autres pages)", "Créer les pages restantes", "Ajouter la navigation", "Optimiser les images"],
    ["Fonctionnalités", "Formulaire de contact", "Interactions JavaScript", "Tester sur mobile et ordinateur"],
    ["Mise en ligne", "Vérifier le référencement de base", "Déployer le site", "Tester la version en ligne"]]) },
  { id: "migration-react", name: "Migration vers React", description: "Convertir un site statique en application React", days: mk([
    ["Audit du projet", "Recenser les pages et les composants", "Identifier les fonctionnalités à conserver", "Lister les ressources et icônes"],
    ["Configuration", "Installer Node.js et créer le projet", "Organiser les dossiers", "Lancer l'application"],
    ["Composants communs", "Créer le menu et le pied de page", "Reprendre les styles", "Tester le rendu"],
    ["Pages principales", "Convertir les pages en composants", "Adapter les interactions", "Tester chaque page"],
    ["Navigation", "Installer le routeur", "Vérifier les liens", "Tester les routes"],
    ["Tests et livraison", "Corriger les erreurs de console", "Comparer avec l'original", "Mettre à jour le README"]]) },
  { id: "appli-mobile", name: "Application mobile (MVP)", description: "Une première version utilisable", days: mk([
    ["Idée et besoins", "Définir le problème à résoudre", "Lister les fonctionnalités essentielles", "Écarter ce qui n'est pas indispensable"],
    ["Conception", "Dessiner les écrans principaux", "Définir le parcours utilisateur", "Choisir la technologie"],
    ["Mise en place", "Créer le projet", "Configurer la navigation", "Préparer les données"],
    ["Fonctionnalité 1", "Développer l'écran principal", "Relier aux données", "Tester"],
    ["Fonctionnalité 2", "Développer le second écran", "Gérer les erreurs", "Tester"],
    ["Finitions", "Soigner le design", "Corriger les bugs", "Faire tester par un proche"],
    ["Publication", "Préparer l'icône et la description", "Générer la version finale", "Publier ou partager"]]) },
  { id: "rapport", name: "Rapport ou mémoire", description: "De la recherche à la relecture", days: mk([
    ["Sujet et plan", "Préciser la problématique", "Établir un plan détaillé", "Lister les sources"],
    ["Recherche", "Lire et noter les sources", "Rassembler les données", "Classer les idées par partie"],
    ["Rédaction : introduction", "Rédiger l'introduction", "Annoncer le plan", "Relire"],
    ["Rédaction : développement", "Rédiger la première partie", "Rédiger la deuxième partie", "Ajouter schémas et tableaux"],
    ["Rédaction : conclusion", "Rédiger la conclusion", "Compléter la bibliographie", "Ajouter les annexes"],
    ["Relecture et rendu", "Corriger orthographe et mise en forme", "Faire relire par quelqu'un", "Exporter et rendre le document"]]) },
  { id: "apprendre", name: "Apprendre une technologie", description: "Une semaine pour passer de zéro à un mini-projet", days: mk([
    ["Les bases", "Lire la documentation d'introduction", "Installer l'environnement", "Faire le tutoriel officiel"],
    ["Pratiquer", "Reproduire 3 exemples sans copier", "Noter ce qui bloque", "Chercher les réponses"],
    ["Mini-projet : début", "Définir un petit projet", "Créer la structure", "Réaliser la première fonctionnalité"],
    ["Mini-projet : suite", "Ajouter deux fonctionnalités", "Corriger les erreurs", "Refactoriser le code"],
    ["Bilan", "Mettre le projet en ligne", "Écrire ce que j'ai appris", "Planifier la suite"]]) }
];
