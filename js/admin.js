/* ==========================================================================
   Bass'Style — Mode administrateur
   Authentification simple côté client (démonstration).
   ⚠️ Pour une mise en production réelle, l'authentification et le stockage
   des produits doivent être déplacés vers un vrai backend sécurisé
   (voir README.md, section "Aller plus loin").
   ========================================================================== */
(function () {
  "use strict";

  const ADMIN_PASSWORD = "bassstyle2026"; // à changer avant toute mise en ligne
  const SESSION_KEY = "bassstyle_admin_session";

  const state = {
    products: [],
    filtered: [],
    query: "",
    category: "tous",
    editingId: null,
    uploadedImageData: null,
  };

  const el = {
    loginWrap: document.getElementById("adminLoginWrap"),
    shell: document.getElementById("adminShell"),
    loginForm: document.getElementById("loginForm"),
    loginInput: document.getElementById("loginPassword"),
    loginError: document.getElementById("loginError"),
    logoutBtn: document.getElementById("logoutBtn"),
    statTotal: document.getElementById("statTotal"),
    statShoes: document.getElementById("statShoes"),
    statWigs: document.getElementById("statWigs"),
    statLow: document.getElementById("statLow"),
    tableBody: document.getElementById("adminTableBody"),
    search: document.getElementById("adminSearch"),
    categoryFilter: document.getElementById("adminCategoryFilter"),
    addBtn: document.getElementById("addProductBtn"),
    resetBtn: document.getElementById("resetDbBtn"),
    formOverlay: document.getElementById("formOverlay"),
    scrim: document.getElementById("adminScrim"),
    toast: document.getElementById("adminToast"),
  };

  function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.toast.classList.remove("show"), 2200);
  }

  function formatFCFA(n) {
    return n.toLocaleString("fr-FR").replace(/,/g, " ") + " FCFA";
  }

  /* ---------- Authentification ---------- */
  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  }

  function showApp() {
    el.loginWrap.style.display = "none";
    el.shell.style.display = "flex";
    init();
  }

  function showLogin() {
    el.loginWrap.style.display = "flex";
    el.shell.style.display = "none";
  }

  el.loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (el.loginInput.value === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      el.loginError.style.display = "none";
      showApp();
    } else {
      el.loginError.style.display = "block";
    }
  });

  el.logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
  });

  /* ---------- Chargement + stats ---------- */
  function loadProducts() {
    state.products = window.BassStyleDB.getAll();
    applyFilters();
    renderStats();
  }

  function renderStats() {
    const shoes = state.products.filter((p) => p.category === "chaussures").length;
    const wigs = state.products.filter((p) => p.category === "perruques").length;
    const low = state.products.filter((p) => p.stock <= 5).length;
    el.statTotal.textContent = state.products.length;
    el.statShoes.textContent = shoes;
    el.statWigs.textContent = wigs;
    el.statLow.textContent = low;
  }

  function applyFilters() {
    let list = [...state.products];
    if (state.category !== "tous") list = list.filter((p) => p.category === state.category);
    if (state.query.trim()) {
      const q = state.query.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.id.includes(q));
    }
    state.filtered = list;
    renderTable();
  }

  function renderTable() {
    if (state.filtered.length === 0) {
      el.tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--ivory-faint);font-family:var(--font-mono);font-size:13px;">Aucun article trouvé.</td></tr>`;
      return;
    }
    el.tableBody.innerHTML = state.filtered
      .map(
        (p) => `
      <tr>
        <td><img class="row-thumb" src="${p.image}" alt=""></td>
        <td>
          <div class="row-name">${p.name}</div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--ivory-faint)">${p.id} · ${p.brand}</div>
        </td>
        <td><span class="row-cat ${p.category}">${p.category === "chaussures" ? "Chaussures" : "Perruques"}</span></td>
        <td style="font-family:var(--font-mono)">${formatFCFA(p.price)}</td>
        <td class="${p.stock <= 5 ? "stock-low" : ""}" style="font-family:var(--font-mono)">${p.stock}</td>
        <td style="font-family:var(--font-mono)">${p.rating ? p.rating.toFixed(1) : "—"}</td>
        <td>
          <div class="row-actions">
            <button class="row-btn edit" data-edit="${p.id}" aria-label="Modifier">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button class="row-btn del" data-del="${p.id}" aria-label="Supprimer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            </button>
          </div>
        </td>
      </tr>`
      )
      .join("");

    el.tableBody.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => openForm(b.getAttribute("data-edit")))
    );
    el.tableBody.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => deleteProduct(b.getAttribute("data-del")))
    );
  }

  /* ---------- CRUD ---------- */
  function deleteProduct(id) {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;
    if (!confirm(`Supprimer « ${p.name} » du catalogue ?`)) return;
    window.BassStyleDB.remove(id);
    loadProducts();
    showToast("Article supprimé");
  }

  function openForm(id) {
    state.editingId = id || null;
    const p = id ? state.products.find((x) => x.id === id) : null;

    el.formOverlay.innerHTML = `
      <div class="modal admin-modal">
        <form class="admin-form" id="productForm">
          <button type="button" class="modal-close" id="formClose">✕</button>
          <h3>${p ? "Modifier l'article" : "Ajouter un article"}</h3>

          <div class="form-row">
            <label>Nom de l'article</label>
            <input type="text" name="name" required value="${p ? p.name.replace(/"/g, "&quot;") : ""}">
          </div>

          <div class="form-grid-2">
            <div class="form-row">
              <label>Catégorie</label>
              <select name="category" required>
                <option value="chaussures" ${p && p.category === "chaussures" ? "selected" : ""}>Chaussures</option>
                <option value="perruques" ${p && p.category === "perruques" ? "selected" : ""}>Perruques</option>
              </select>
            </div>
            <div class="form-row">
              <label>Sous-catégorie</label>
              <input type="text" name="subCategory" required value="${p ? p.subCategory : ""}" placeholder="Ex: Sneaker Urbaine">
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-row">
              <label>Marque</label>
              <input type="text" name="brand" required value="${p ? p.brand : "Bass'Style Original"}">
            </div>
            <div class="form-row">
              <label>Prix (FCFA)</label>
              <input type="number" name="price" min="0" step="500" required value="${p ? p.price : ""}">
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-row">
              <label>Stock</label>
              <input type="number" name="stock" min="0" required value="${p ? p.stock : 10}">
            </div>
            <div class="form-row">
              <label>Note (/5)</label>
              <input type="number" name="rating" min="0" max="5" step="0.1" value="${p ? p.rating : 4}">
            </div>
          </div>

          <div class="form-row">
            <label>Photo de l'article</label>
            <div class="image-upload">
              <img id="imagePreview" class="image-preview" alt="Aperçu" src="${p ? p.image : ""}" style="${p ? "" : "display:none;"}">
              <label class="upload-btn" for="imageFileInput">📷 Choisir une photo dans la galerie</label>
              <input type="file" id="imageFileInput" accept="image/*" style="display:none;">
              <p class="upload-hint" id="uploadHint">Formats JPG/PNG/WebP. L'image est automatiquement redimensionnée.</p>
            </div>
          </div>

          <div class="form-row">
            <label>Ou URL de l'image (optionnel si une photo est importée)</label>
            <input type="url" name="image" id="imageUrlInput" value="${p && !p.image.startsWith("data:") ? p.image : ""}" placeholder="https://...">
          </div>

          <div class="form-row">
            <label>Description</label>
            <textarea name="description" required>${p ? p.description : ""}</textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn-ghost" id="formCancel">Annuler</button>
            <button type="submit" class="btn-primary" style="flex:1">${p ? "Enregistrer" : "Ajouter au catalogue"}</button>
          </div>
        </form>
      </div>`;

    state.uploadedImageData = p && p.image.startsWith("data:") ? p.image : null;

    el.formOverlay.classList.add("open");
    el.scrim.classList.add("open");
    document.body.classList.add("no-scroll");

    document.getElementById("formClose").addEventListener("click", closeForm);
    document.getElementById("formCancel").addEventListener("click", closeForm);
    document.getElementById("productForm").addEventListener("submit", handleSubmit);
    document.getElementById("imageFileInput").addEventListener("change", handleImageFile);
  }

  /* Lecture + redimensionnement de la photo choisie dans la galerie,
     pour garder des fichiers légers en localStorage. */
  function resizeImageFile(file, maxWidth, quality) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => reject(new Error("Image illisible"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
      reader.readAsDataURL(file);
    });
  }

  async function handleImageFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const hint = document.getElementById("uploadHint");
    const preview = document.getElementById("imagePreview");
    hint.textContent = "Importation en cours...";
    try {
      const dataUrl = await resizeImageFile(file, 700, 0.82);
      state.uploadedImageData = dataUrl;
      preview.src = dataUrl;
      preview.style.display = "block";
      document.getElementById("imageUrlInput").value = "";
      hint.textContent = "Photo importée ✓ — elle remplace l'URL ci-dessous.";
    } catch (err) {
      hint.textContent = "Impossible de lire cette image, réessayez.";
    }
  }

  function closeForm() {
    el.formOverlay.classList.remove("open");
    el.scrim.classList.remove("open");
    document.body.classList.remove("no-scroll");
    state.editingId = null;
    state.uploadedImageData = null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);

    const existing = state.editingId ? state.products.find((x) => x.id === state.editingId) : null;
    const urlValue = fd.get("image").trim();
    const finalImage = state.uploadedImageData || urlValue || (existing ? existing.image : "");

    if (!finalImage) {
      alert("Choisissez une photo dans la galerie ou renseignez une URL d'image.");
      return;
    }

    const data = {
      name: fd.get("name").trim(),
      category: fd.get("category"),
      subCategory: fd.get("subCategory").trim(),
      brand: fd.get("brand").trim(),
      price: Number(fd.get("price")),
      stock: Number(fd.get("stock")),
      rating: Number(fd.get("rating")) || 4,
      image: finalImage,
      description: fd.get("description").trim(),
    };

    if (state.editingId) {
      window.BassStyleDB.update(state.editingId, data);
      showToast("Article mis à jour");
    } else {
      window.BassStyleDB.add(data);
      showToast("Article ajouté au catalogue");
    }

    closeForm();
    loadProducts();
  }

  /* ---------- Événements globaux ---------- */
  function bindEvents() {
    el.search.addEventListener("input", (e) => {
      state.query = e.target.value;
      applyFilters();
    });
    el.categoryFilter.addEventListener("change", (e) => {
      state.category = e.target.value;
      applyFilters();
    });
    el.addBtn.addEventListener("click", () => openForm(null));
    el.resetBtn.addEventListener("click", () => {
      if (!confirm("Réinitialiser le catalogue aux 100 articles d'origine ? Toutes les modifications seront perdues.")) return;
      window.BassStyleDB.resetToSeed();
      loadProducts();
      showToast("Catalogue réinitialisé");
    });
    el.scrim.addEventListener("click", closeForm);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeForm();
    });
  }

  function init() {
    loadProducts();
    bindEvents();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (isLoggedIn()) showApp();
    else showLogin();
  });
})();
