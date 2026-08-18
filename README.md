# À table

Intégration custom Home Assistant pour planifier les repas de la semaine, générer des
idées de recettes par IA (Google Gemini, gratuit), gérer une liste de courses, un
historique, une bibliothèque de recettes personnelles, et composer des repas complets
pour recevoir des invités — le tout piloté depuis une carte Lovelace dédiée.

## Fonctionnalités

- **Planification hebdomadaire** : cartes-repas glissées entre "À cuisiner" et les jours
  de la semaine, marquage "cuisiné" avec note (aimé/pas aimé) et bascule favori.
- **Génération de propositions par IA** (jusqu'à 7 idées par génération), en respectant
  régimes, allergies, goûts, équipements disponibles, budget, objectifs nutritionnels
  (kcal, répartition protéines/glucides/lipides), quotas de diversité et aliments à
  utiliser en priorité.
- **Dialogue avec l'IA** pour ajuster une recette existante ou une proposition en cours
  de validation (ex. "remplace le poulet par du tofu") sans tout régénérer.
- **Import de recette** par texte collé ou photo (analysée par l'IA), ou saisie 100%
  manuelle sans appel IA.
- **Liste de courses** agrégée à partir des repas planifiés, quantités ajustées aux
  portions réelles et à l'appétit du foyer, transférable vers une liste de tâches HA.
- **Module Invité** : compose un repas complet (apéritif/entrée/plat/dessert, ou un
  sous-ensemble de ton choix, avec possibilité d'assortiments à plusieurs variantes —
  ex. plusieurs sortes de sushis) avec des suggestions d'accord mets-vins.
- **Analyse des habitudes** : suggestions de goûts aimés/à éviter à partir de
  l'historique récent, sur demande.
- **Capteur `sensor.a_table_repas_du_jour`** pour tes automatisations/notifications.
- **Illustrations de plats** (facultatif) via l'API Google Custom Search.

**Toutes les fonctionnalités IA sont déclenchées manuellement, jamais en arrière-plan** —
pensé pour rester dans les limites du palier gratuit de Gemini.

## Installation via HACS

1. Dans HACS → menu (⋮) → **Dépôts personnalisés**, ajoute
   `https://github.com/XeIaCraft/A-table` en catégorie **Intégration**.
2. Installe "À table" depuis la liste HACS.
3. Redémarre complètement Home Assistant (Paramètres → Système → Redémarrer — **pas**
   juste "Recharger" l'intégration : Home Assistant garde le code Python d'une
   intégration custom en mémoire tant que le cœur n'est pas redémarré, donc toute mise à
   jour du backend nécessite ce redémarrage complet, à chaque fois).
4. Ajoute l'intégration "À table" depuis Paramètres → Appareils et services.
5. Ajoute la carte `a-table-card` à ton tableau de bord (type de carte personnalisée).

## Configuration de l'IA — Gemini gratuit

À table s'appuie sur le service `ai_task.generate_data` de Home Assistant, qui a besoin
d'une entité `ai_task` configurée :

1. Crée une clé API gratuite sur [Google AI Studio](https://aistudio.google.com/apikey).
2. Dans Home Assistant, ajoute l'intégration **Google Generative AI** (Paramètres →
   Appareils et services → Ajouter une intégration → "Google Generative AI"), colle ta
   clé API.
3. Une entité `ai_task.xxx` est créée automatiquement — renseigne-la dans
   Paramètres de À table → Intégrations → "Entité IA utilisée pour les générations".
4. Le palier gratuit de Gemini a un quota de requêtes limité (variable selon le modèle) —
   c'est pourquoi aucune génération n'est automatique dans cette intégration : chaque
   appel IA (génération hebdomadaire, dialogue, import de recette, menu invité, analyse
   des goûts) part d'un clic explicite.

## Illustrations de plats (facultatif)

Pour activer la recherche automatique d'image par titre de plat :

1. Crée une clé API sur la [console Google Cloud](https://console.cloud.google.com/apis/credentials),
   avec l'API **Custom Search API** activée (gratuite jusqu'à 100 requêtes/jour).
2. Crée un moteur de recherche personnalisé sur
   [programmablesearchengine.google.com](https://programmablesearchengine.google.com/),
   configuré pour rechercher sur tout le Web, avec la recherche d'images activée. Note
   son identifiant (« cx »).
3. Renseigne la clé API et l'identifiant dans Paramètres de À table → Intégrations →
   "Illustrations de plats".
4. Un bouton "Illustrer" apparaît dans la fiche détail de chaque recette.

Sans configuration, cette fonctionnalité reste simplement inactive — tout le reste de
l'application fonctionne normalement.

## Mise à jour

Après chaque mise à jour (HACS ou manuelle), **redémarre complètement Home Assistant**.
Un simple "Recharger" l'intégration ne suffit pas à prendre en compte les changements du
backend Python (limitation de Home Assistant, pas de l'intégration).
