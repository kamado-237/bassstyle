# Bass'Style 👞💇🏾‍♀️

Site e-commerce pour **Bass'Style**, boutique camerounaise de **chaussures** et **perruques**.
Front-end pur (HTML / CSS / JS, sans framework, sans build), avec un **mode administrateur**
permettant d'ajouter, modifier et supprimer des articles du catalogue.

---

## 1. Structure du projet

```
bassstyle/
├── index.html          → Page boutique (catalogue public)
├── admin.html           → Page d'administration (CRUD catalogue)
├── css/
│   └── style.css        → Design system complet (boutique + admin)
├── js/
│   ├── data.js           → "Base de données" produits (seed de 100 articles + API CRUD)
│   ├── app.js             → Logique de la boutique (filtres, panier, checkout WhatsApp)
│   └── admin.js            → Logique de l'espace admin (authentification + CRUD)
└── README.md
```

## 2. Lancer le site en local

Aucune installation n'est nécessaire — c'est un site 100% statique.

**Option la plus simple :** double-cliquez sur `index.html` pour l'ouvrir dans votre navigateur.

**Option recommandée (évite les soucis de CORS sur certains navigateurs) :**

```bash
cd bassstyle
python3 -m http.server 8000
# puis ouvrez http://localhost:8000
```

ou avec Node.js :

```bash
npx serve .
```

## 3. La "base de données" — comment ça marche

Le projet n'a pas de serveur ni de vraie base de données : il utilise le
**`localStorage`** du navigateur comme entrepôt de données, ce qui est idéal
pour une démo, un prototype ou un déploiement rapide sans backend.

- Au tout premier chargement, `js/data.js` génère **100 articles** (50 chaussures + 50
  perruques) et les enregistre dans `localStorage` sous la clé `bassstyle_products`.
- Toute action faite dans l'espace admin (ajout, modification, suppression) réécrit
  directement ce `localStorage`.
- La boutique (`index.html`) et l'admin (`admin.html`) lisent **les mêmes données** :
  une modification faite dans l'admin apparaît immédiatement dans la boutique
  (au rechargement de la page boutique).
- Le panier client est stocké séparément sous la clé `bassstyle_cart`.

⚠️ **Important : le `localStorage` est propre à chaque navigateur/appareil.**
Si vous ouvrez le site sur un autre ordinateur ou en navigation privée, vous
repartez avec le catalogue d'origine (100 articles). Pour un catalogue **partagé
entre tous les visiteurs et administrateurs**, il faut migrer vers un vrai
backend — voir la section 6 "Aller plus loin".

Un bouton **"Réinitialiser (100 articles)"** dans l'admin permet de tout remettre
à zéro à tout moment si vous voulez repartir du catalogue de démonstration.

## 4. Mode administrateur

Accès : ouvrez `admin.html` (ou cliquez sur "Admin" en haut à droite de la boutique).

- **Mot de passe par défaut :** `bassstyle2026`
  → à changer dans `js/admin.js`, ligne `const ADMIN_PASSWORD = "bassstyle2026";`
  avant toute mise en ligne publique.
- La session admin est stockée dans `sessionStorage` (elle se termine à la
  fermeture de l'onglet).

Fonctionnalités disponibles :

| Action | Où |
|---|---|
| Voir les statistiques (total, par catégorie, stock faible) | Tableau de bord admin |
| Rechercher / filtrer les articles | Barre d'outils admin |
| **Ajouter** un article | Bouton "+ Ajouter un article" |
| **Modifier** un article | Icône crayon sur chaque ligne |
| **Supprimer** un article | Icône corbeille sur chaque ligne (avec confirmation) |
| Réinitialiser le catalogue aux 100 articles d'origine | Bouton "Réinitialiser" |

⚠️ Cette authentification est volontairement simple (mot de passe unique côté
client) pour une démonstration ou un usage interne restreint. Elle **n'est pas
suffisante pour protéger un vrai backend en production** — voir section 6.

## 5. Fonctionnalités côté boutique

- Catalogue de 100 articles avec filtres **Tous / Chaussures / Perruques**
- Recherche en temps réel (nom, marque, sous-catégorie)
- Tri (récents, prix croissant/décroissant, alphabétique)
- Fiche produit en aperçu rapide (modal) avec sélection de quantité
- Panier persistant (localStorage), avec ajustement des quantités
- **Commande via WhatsApp** : le bouton "Commander" ouvre WhatsApp avec un
  message pré-rempli listant les articles, quantités et le total.
  → Pensez à remplacer le numéro dans `js/app.js` :
  `const WHATSAPP_NUMBER = "237600000000";`
- Design responsive (mobile, tablette, desktop)

## 6. Aller plus loin (passage en production réelle)

Ce projet est pensé comme un front-end complet, prêt à être connecté à un
vrai backend. Pistes concrètes, dans la continuité de ce que vous maîtrisez déjà :

1. **Backend + base de données réelle**
   Node.js/Express + MongoDB (ou MySQL) pour remplacer `js/data.js` par de
   vraies routes API (`GET/POST/PUT/DELETE /api/products`). C'est la même
   logique que vos projets EduFlow ou PhytoScrape : remplacer le stockage
   local par des appels `fetch()` vers une API.
2. **Authentification admin sécurisée**
   Remplacer le mot de passe en clair par un vrai système de comptes
   (hash de mot de passe, sessions ou JWT côté serveur).
3. **Hébergement des images**
   Les images utilisent actuellement des placeholders (`picsum.photos`).
   En production, prévoir un vrai stockage (Cloudinary, S3, ou upload
   côté serveur) pour les photos de chaussures et perruques.
4. **Paiement en ligne**
   Le checkout WhatsApp est un excellent point de départ pour le marché
   camerounais. Il est possible d'ajouter plus tard un paiement Mobile
   Money (Orange Money / MTN MoMo) via une passerelle comme CinetPay ou
   Notch Pay.
5. **Déploiement**
   Le site est statique : il peut être déployé tel quel sur **Vercel**,
   **Netlify** ou **GitHub Pages** dès maintenant (comme votre projet
   B-inov). Le passage à un backend nécessitera un hébergeur supportant
   Node.js (Render, Railway, ou un VPS).

## 7. Personnalisation rapide

- **Couleurs / typographies** : toutes les variables de design sont centralisées
  en haut de `css/style.css` (`:root { ... }`).
- **Contenu des 100 articles** : modifiable dans `js/data.js` (listes de modèles,
  matières, couleurs, marques, fourchettes de prix).
- **Numéro WhatsApp** : `js/app.js`, constante `WHATSAPP_NUMBER`.
- **Mot de passe admin** : `js/admin.js`, constante `ADMIN_PASSWORD`.

---

Fait avec soin pour Bass'Style 🇨🇲
