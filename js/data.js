/* ==========================================================================
   Bass'Style — Générateur de la base de données produits (100 articles)
   Cette "base de données" est simulée côté client via localStorage.
   Au premier chargement, ce fichier sème 100 articles (50 chaussures,
   50 perruques). Ensuite, toutes les modifications faites depuis le mode
   administrateur sont écrites dans localStorage et deviennent la nouvelle
   source de vérité — ce fichier n'est plus relu tant que le cache n'est
   pas vidé.
   ========================================================================== */

(function (global) {
  "use strict";

  const STORAGE_KEY = "bassstyle_products";
  const STORAGE_VERSION_KEY = "bassstyle_db_version";
  const DB_VERSION = "1.0.0";

  const shoeModels = [
    "Sneaker Urbaine", "Bottine Chelsea", "Mocassin Cuir", "Sandale Tressée",
    "Basket Montante", "Escarpin Talon", "Derby Classique", "Slip-On Toile",
    "Bottine Western", "Sandale Plateforme"
  ];
  const shoeMaterials = [
    "Cuir Nubuck", "Suède", "Toile Recyclée", "Cuir Pleine Fleur",
    "Cuir Verni", "Tissu Tressé"
  ];
  const shoeColors = [
    "Noir", "Camel", "Bordeaux", "Beige Sable", "Vert Olive",
    "Blanc Cassé", "Marron Chocolat", "Or Antique"
  ];
  const shoeBrands = ["Bass'Style Original", "Urban Step", "ClassicWear", "StreetLuxe"];

  const wigModels = [
    "Lace Front", "Full Lace", "Closure 5x5", "Frontal 13x4", "Bob Wig",
    "U-Part Wig", "Wig Bouclée", "Wig Lisse Soyeuse", "Wig Ondulée", "Wig Afro Curl"
  ];
  const wigTextures = ["Lisse", "Bouclée", "Ondulée", "Crépue Naturelle", "Kinky Straight"];
  const wigLengths = ["30cm", "35cm", "40cm", "45cm", "50cm", "60cm"];
  const wigColors = ["Noir Naturel", "Brun Chocolat", "Blond Miel", "Ombré Caramel", "Auburn"];
  const wigBrands = ["Bass'Style Hair", "Royal Tresses", "SoftCurl", "GlamLine"];

  function seededPrice(base, i, span) {
    // Variation déterministe (pas de Math.random) pour une base stable.
    return base + ((i * 37) % span);
  }

  function buildShoes() {
    const items = [];
    for (let i = 0; i < 50; i++) {
      const model = shoeModels[i % shoeModels.length];
      const material = shoeMaterials[i % shoeMaterials.length];
      const color = shoeColors[i % shoeColors.length];
      const brand = shoeBrands[i % shoeBrands.length];
      const price = seededPrice(15000, i, 30000);
      const stock = 3 + ((i * 7) % 25);
      items.push({
        id: "chx-" + String(i + 1).padStart(3, "0"),
        name: `${model} ${material} ${color}`,
        category: "chaussures",
        subCategory: model,
        brand,
        price,
        stock,
        rating: 3.5 + ((i % 4) * 0.5) > 5 ? 5 : 3.5 + ((i % 4) * 0.5),
        description: `${model} en ${material.toLowerCase()}, coloris ${color.toLowerCase()}. Confort quotidien et finitions soignées, pensée pour un style qui ne passe pas inaperçu.`,
        image: `https://picsum.photos/seed/bassstyle-shoe-${i + 1}/600/750`,
        createdAt: new Date(Date.now() - i * 86400000).toISOString()
      });
    }
    return items;
  }

  function buildWigs() {
    const items = [];
    for (let i = 0; i < 50; i++) {
      const model = wigModels[i % wigModels.length];
      const texture = wigTextures[i % wigTextures.length];
      const length = wigLengths[i % wigLengths.length];
      const color = wigColors[i % wigColors.length];
      const brand = wigBrands[i % wigBrands.length];
      const price = seededPrice(20000, i, 55000);
      const stock = 2 + ((i * 5) % 20);
      items.push({
        id: "prq-" + String(i + 1).padStart(3, "0"),
        name: `${model} ${texture} ${length}`,
        category: "perruques",
        subCategory: model,
        brand,
        price,
        stock,
        rating: 3.5 + ((i % 4) * 0.5) > 5 ? 5 : 3.5 + ((i % 4) * 0.5),
        description: `${model}, texture ${texture.toLowerCase()}, longueur ${length}, coloris ${color.toLowerCase()}. Cheveux de qualité premium, pose naturelle, tenue longue durée.`,
        image: `https://picsum.photos/seed/bassstyle-wig-${i + 1}/600/750`,
        createdAt: new Date(Date.now() - i * 86400000).toISOString()
      });
    }
    return items;
  }

  function seedDatabase() {
    return [...buildShoes(), ...buildWigs()];
  }

  const DB = {
    STORAGE_KEY,

    getAll() {
      const raw = localStorage.getItem(STORAGE_KEY);
      const version = localStorage.getItem(STORAGE_VERSION_KEY);
      if (!raw || version !== DB_VERSION) {
        const seeded = seedDatabase();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        localStorage.setItem(STORAGE_VERSION_KEY, DB_VERSION);
        return seeded;
      }
      try {
        return JSON.parse(raw);
      } catch (e) {
        const seeded = seedDatabase();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
    },

    saveAll(products) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    },

    add(product) {
      const products = DB.getAll();
      const id = product.category === "perruques"
        ? "prq-" + Date.now().toString(36)
        : "chx-" + Date.now().toString(36);
      const newProduct = {
        id,
        rating: 4,
        createdAt: new Date().toISOString(),
        ...product
      };
      products.unshift(newProduct);
      DB.saveAll(products);
      return newProduct;
    },

    update(id, changes) {
      const products = DB.getAll();
      const idx = products.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      products[idx] = { ...products[idx], ...changes };
      DB.saveAll(products);
      return products[idx];
    },

    remove(id) {
      const products = DB.getAll().filter((p) => p.id !== id);
      DB.saveAll(products);
    },

    resetToSeed() {
      const seeded = seedDatabase();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      localStorage.setItem(STORAGE_VERSION_KEY, DB_VERSION);
      return seeded;
    }
  };

  global.BassStyleDB = DB;
})(window);
