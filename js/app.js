/* ==========================================================================
   Bass'Style — Boutique (storefront)
   ========================================================================== */
(function () {
  "use strict";

  const WHATSAPP_NUMBER = "+237696420152"; // à remplacer par le vrai numéro Bass'Style

  const state = {
    products: [],
    filtered: [],
    category: "tous",
    query: "",
    sort: "recent",
    visibleCount: 12,
    cart: JSON.parse(localStorage.getItem("bassstyle_cart") || "[]"),
  };

  const el = {
    grid: document.getElementById("productGrid"),
    count: document.getElementById("catalogCount"),
    filters: document.getElementById("filterPills"),
    search: document.getElementById("searchInput"),
    sort: document.getElementById("sortSelect"),
    loadMore: document.getElementById("loadMoreBtn"),
    cartBtn: document.getElementById("cartBtn"),
    cartCount: document.getElementById("cartCount"),
    cartDrawer: document.getElementById("cartDrawer"),
    cartItems: document.getElementById("cartItems"),
    cartTotal: document.getElementById("cartTotal"),
    cartClose: document.getElementById("cartClose"),
    checkoutBtn: document.getElementById("checkoutBtn"),
    scrim: document.getElementById("scrim"),
    modal: document.getElementById("productModal"),
    modalClose: document.getElementById("modalClose"),
    toast: document.getElementById("toast"),
  };

  function formatFCFA(n) {
    return n.toLocaleString("fr-FR").replace(/,/g, " ") + " FCFA";
  }

  function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.toast.classList.remove("show"), 2200);
  }

  function saveCart() {
    localStorage.setItem("bassstyle_cart", JSON.stringify(state.cart));
    renderCart();
  }

  /* ---------- Chargement + filtrage ---------- */
  function loadProducts() {
    state.products = window.BassStyleDB.getAll();
    applyFilters();
  }

  function applyFilters() {
    let list = [...state.products];
    if (state.category !== "tous") {
      list = list.filter((p) => p.category === state.category);
    }
    if (state.query.trim()) {
      const q = state.query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.subCategory.toLowerCase().includes(q)
      );
    }
    switch (state.sort) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    state.filtered = list;
    state.visibleCount = 12;
    renderGrid();
  }

  function renderGrid() {
    el.count.textContent = `${state.filtered.length} article${state.filtered.length > 1 ? "s" : ""}`;
    const visible = state.filtered.slice(0, state.visibleCount);

    if (visible.length === 0) {
      el.grid.innerHTML = `<div class="empty-state">Aucun article ne correspond à votre recherche.</div>`;
      el.loadMore.style.display = "none";
      return;
    }

    el.grid.innerHTML = visible.map(cardTemplate).join("");
    el.loadMore.style.display = state.visibleCount < state.filtered.length ? "inline-flex" : "none";

    el.grid.querySelectorAll("[data-quickview]").forEach((c) =>
      c.addEventListener("click", () => openModal(c.getAttribute("data-quickview")))
    );
    el.grid.querySelectorAll("[data-add]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        addToCart(btn.getAttribute("data-add"), 1);
      })
    );
  }

  function cardTemplate(p) {
    const low = p.stock <= 5;
    return `
      <article class="product-card" data-quickview="${p.id}">
        <div class="product-media">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          <span class="product-tag ${p.category}">${p.category === "chaussures" ? "Chaussures" : "Perruques"}</span>
          <span class="stock-tag ${low ? "low" : ""}">${p.stock > 0 ? (low ? `${p.stock} restants` : "En stock") : "Épuisé"}</span>
        </div>
        <div class="product-body">
          <span class="product-brand">${p.brand}</span>
          <h3 class="product-name">${p.name}</h3>
          <div class="product-foot">
            <span class="product-price">${formatFCFA(p.price)}</span>
            <button class="add-btn" data-add="${p.id}" aria-label="Ajouter au panier" ${p.stock === 0 ? "disabled" : ""}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6h15l-1.5 9h-12z"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M6 6L4 2H2"/></svg>
            </button>
          </div>
        </div>
      </article>`;
  }

  /* ---------- Modal quickview ---------- */
  let currentModalId = null;
  let modalQty = 1;

  function openModal(id) {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;
    currentModalId = id;
    modalQty = 1;
    el.modal.innerHTML = `
      <div class="modal">
        <div class="modal-media"><img src="${p.image}" alt="${p.name}"></div>
        <div class="modal-body">
          <button class="modal-close" id="modalCloseX">✕</button>
          <span class="product-tag ${p.category}" style="position:static;display:inline-block;">${p.category === "chaussures" ? "Chaussures" : "Perruques"}</span>
          <h3>${p.name}</h3>
          <span class="product-brand">${p.brand}</span>
          <p class="modal-desc">${p.description}</p>
          <div class="modal-price">${formatFCFA(p.price)}</div>
          <div class="qty-row">
            <button class="qty-btn" id="qtyMinus">−</button>
            <span class="qty-value" id="qtyValue">1</span>
            <button class="qty-btn" id="qtyPlus">+</button>
            <span style="margin-left:auto;font-family:var(--font-mono);font-size:12px;color:var(--ivory-faint)">${p.stock} en stock</span>
          </div>
          <button class="btn-primary" id="modalAddBtn" ${p.stock === 0 ? "disabled" : ""}>${p.stock === 0 ? "Épuisé" : "Ajouter au panier"}</button>
        </div>
      </div>`;
    el.modal.classList.add("open");
    el.scrim.classList.add("open");
    document.body.classList.add("no-scroll");

    document.getElementById("modalCloseX").addEventListener("click", closeModal);
    document.getElementById("qtyMinus").addEventListener("click", () => updateModalQty(-1, p.stock));
    document.getElementById("qtyPlus").addEventListener("click", () => updateModalQty(1, p.stock));
    document.getElementById("modalAddBtn").addEventListener("click", () => {
      addToCart(currentModalId, modalQty);
      closeModal();
    });
  }

  function updateModalQty(delta, stock) {
    modalQty = Math.min(stock, Math.max(1, modalQty + delta));
    document.getElementById("qtyValue").textContent = modalQty;
  }

  function closeModal() {
    el.modal.classList.remove("open");
    el.scrim.classList.remove("open");
    if (!el.cartDrawer.classList.contains("open")) document.body.classList.remove("no-scroll");
  }

  /* ---------- Panier ---------- */
  function addToCart(id, qty) {
    const p = state.products.find((x) => x.id === id);
    if (!p) return;
    const existing = state.cart.find((c) => c.id === id);
    if (existing) {
      existing.qty = Math.min(p.stock, existing.qty + qty);
    } else {
      state.cart.push({ id, qty: Math.min(p.stock, qty) });
    }
    saveCart();
    showToast(`${p.name} ajouté au panier`);
  }

  function renderCart() {
    const items = state.cart
      .map((c) => ({ ...c, product: state.products.find((p) => p.id === c.id) }))
      .filter((c) => c.product);

    el.cartCount.textContent = items.reduce((s, c) => s + c.qty, 0);

    if (items.length === 0) {
      el.cartItems.innerHTML = `<div class="cart-empty">Votre panier est vide.<br>Explorez le catalogue pour commencer.</div>`;
      el.cartTotal.innerHTML = `<span>Total</span><strong>0 FCFA</strong>`;
      return;
    }

    el.cartItems.innerHTML = items
      .map(
        (c) => `
      <div class="cart-item">
        <img src="${c.product.image}" alt="${c.product.name}">
        <div class="cart-item-info">
          <div class="name">${c.product.name}</div>
          <div class="price">${formatFCFA(c.product.price)}</div>
          <div class="cart-item-actions">
            <button data-dec="${c.id}">−</button>
            <span style="font-family:var(--font-mono);font-size:12px">${c.qty}</span>
            <button data-inc="${c.id}">+</button>
            <span class="remove-item" data-remove="${c.id}">Retirer</span>
          </div>
        </div>
      </div>`
      )
      .join("");

    const total = items.reduce((s, c) => s + c.qty * c.product.price, 0);
    el.cartTotal.innerHTML = `<span>Total</span><strong>${formatFCFA(total)}</strong>`;

    el.cartItems.querySelectorAll("[data-inc]").forEach((b) =>
      b.addEventListener("click", () => changeQty(b.getAttribute("data-inc"), 1))
    );
    el.cartItems.querySelectorAll("[data-dec]").forEach((b) =>
      b.addEventListener("click", () => changeQty(b.getAttribute("data-dec"), -1))
    );
    el.cartItems.querySelectorAll("[data-remove]").forEach((b) =>
      b.addEventListener("click", () => {
        state.cart = state.cart.filter((c) => c.id !== b.getAttribute("data-remove"));
        saveCart();
      })
    );
  }

  function changeQty(id, delta) {
    const item = state.cart.find((c) => c.id === id);
    const product = state.products.find((p) => p.id === id);
    if (!item || !product) return;
    item.qty = Math.min(product.stock, Math.max(1, item.qty + delta));
    saveCart();
  }

  function openCart() {
    el.cartDrawer.classList.add("open");
    el.scrim.classList.add("open");
    document.body.classList.add("no-scroll");
  }
  function closeCart() {
    el.cartDrawer.classList.remove("open");
    el.scrim.classList.remove("open");
    document.body.classList.remove("no-scroll");
  }

  function checkoutWhatsApp() {
    const items = state.cart
      .map((c) => ({ ...c, product: state.products.find((p) => p.id === c.id) }))
      .filter((c) => c.product);
    if (items.length === 0) {
      showToast("Votre panier est vide");
      return;
    }
    const lines = items.map(
      (c) => `• ${c.product.name} ×${c.qty} — ${formatFCFA(c.product.price * c.qty)}`
    );
    const total = items.reduce((s, c) => s + c.qty * c.product.price, 0);
    const message = [
      "Bonjour Bass'Style, je souhaite commander :",
      "",
      ...lines,
      "",
      `Total : ${formatFCFA(total)}`,
    ].join("\n");
    const url = `https://wa.me/${+237696420152}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  /* ---------- Événements ---------- */
  function bindEvents() {
    el.filters.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-pill");
      if (!btn) return;
      el.filters.querySelectorAll(".filter-pill").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.category = btn.getAttribute("data-cat");
      applyFilters();
    });

    el.search.addEventListener("input", (e) => {
      state.query = e.target.value;
      applyFilters();
    });

    el.sort.addEventListener("change", (e) => {
      state.sort = e.target.value;
      applyFilters();
    });

    el.loadMore.addEventListener("click", () => {
      state.visibleCount += 12;
      renderGrid();
    });

    el.cartBtn.addEventListener("click", openCart);
    el.cartClose.addEventListener("click", closeCart);
    el.checkoutBtn.addEventListener("click", checkoutWhatsApp);

    el.scrim.addEventListener("click", () => {
      closeCart();
      closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeCart();
        closeModal();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    bindEvents();
    renderCart();
  });
})();
