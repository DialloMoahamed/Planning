(window.PLANNINGS = window.PLANNINGS || []).push({
  id: "herdtech",
  legacyKey: "herdtech-planning-v1", // reprend la progression de l'ancien fichier HTML
  title: "HerdTech — Mon suivi",
  eyebrow: "Planning de projet",
  startDate: "2026-11-02",
  days: [
    { title: "Audit du projet", tasks: ["Examiner les 9 pages HTML","Analyser les fichiers CSS et JavaScript","Recenser les ressources et les icônes","Identifier les fonctionnalités à conserver"] },
    { title: "Configuration de React", tasks: ["Vérifier Node.js et npm","Configurer React et les dépendances","Organiser les dossiers et composants","Lancer l'application"] },
    { title: "Connexion et inscription", tasks: ["Convertir Login.html en JSX","Convertir Signin.html en JSX","Adapter les styles et interactions","Tester les deux pages"] },
    { title: "Tableau de bord", tasks: ["Convertir index.html en composant React","Reproduire la mise en page","Adapter les éléments interactifs","Vérifier le rendu"] },
    { title: "Gestion du cheptel", tasks: ["Convertir Cheptel.html","Adapter les tableaux et éléments visuels","Reprendre les interactions existantes","Tester la page"] },
    { title: "Suivi et RFID", tasks: ["Convertir Suivi.html","Adapter les éléments de suivi","Reprendre les interactions RFID","Tester la page"] },
    { title: "Tâches et notifications", tasks: ["Convertir Taches.html","Convertir Notifications.html","Adapter les interactions","Tester les deux pages"] },
    { title: "Stockage et navigation", tasks: ["Convertir Stockage.html","Mettre en place la navigation React","Vérifier les liens entre les pages","Tester les routes"] },
    { title: "Carte React Leaflet", tasks: ["Installer et configurer Leaflet","Centrer la carte sur la ferme","Lire le fichier JSON des coordonnées","Afficher les marqueurs aux bonnes positions"] },
    { title: "Icônes et filtres de la carte", tasks: ["Intégrer les icônes fournies","Afficher les catégories d'éléments","Créer les filtres d'affichage","Tester les coordonnées et les filtres"] },
    { title: "Tests complets", tasks: ["Tester les neuf pages","Vérifier les liens et interactions","Corriger les erreurs de console","Comparer le rendu avec le projet original"] },
    { title: "Finalisation et livraison", tasks: ["Nettoyer le code","Vérifier le fonctionnement général","Mettre à jour le README","Vérifier Git et préparer la démonstration"] }
  ]
});
