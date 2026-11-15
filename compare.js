const DEMO_PRODUCTS = [
  {
    id: "sony-wh1000xm5",
    name: "Sony WH-1000XM5",
    category: "tecnologia",
    icon: "◖◗",
    descriptor: "Auriculares inalámbricos con cancelación de ruido",
    match: "Mismo modelo · color negro · versión europea",
    tags: ["auriculares", "sony", "cancelación", "viajes"],
    alternatives: ["Bose QuietComfort", "Sennheiser Momentum 4"],
    offers: [
      { store: "Amazon España", price: 279.99, shipping: 0, delivery: "1–2 días", returns: "30 días", seller: "Vendido por Amazon" },
      { store: "PcComponentes", price: 289.0, shipping: 0, delivery: "2–3 días", returns: "30 días", seller: "Vendido por PcComponentes" },
      { store: "MediaMarkt", price: 299.0, shipping: 3.99, delivery: "2–4 días", returns: "14 días", seller: "Vendido por MediaMarkt" },
    ],
  },
  {
    id: "logitech-mx-keys-s",
    name: "Logitech MX Keys S",
    category: "tecnologia",
    icon: "⌨",
    descriptor: "Teclado inalámbrico retroiluminado para escritorio",
    match: "Mismo modelo · distribución española · color grafito",
    tags: ["teclado", "logitech", "oficina", "escritorio"],
    alternatives: ["Keychron K10", "Logitech Wave Keys"],
    offers: [
      { store: "Amazon España", price: 104.99, shipping: 0, delivery: "1–2 días", returns: "30 días", seller: "Vendido por Amazon" },
      { store: "PcComponentes", price: 99.99, shipping: 3.95, delivery: "1–3 días", returns: "30 días", seller: "Vendido por PcComponentes" },
      { store: "El Corte Inglés", price: 119.0, shipping: 0, delivery: "2–5 días", returns: "30 días", seller: "Vendido por El Corte Inglés" },
    ],
  },
  {
    id: "nike-pegasus-41",
    name: "Nike Pegasus 41",
    category: "deporte",
    icon: "↗",
    descriptor: "Zapatillas de running para entrenamientos diarios",
    match: "Mismo modelo · talla y color deben coincidir antes de comparar",
    tags: ["zapatillas", "nike", "running", "deporte"],
    alternatives: ["ASICS Gel-Cumulus 26", "Adidas Supernova Rise"],
    offers: [
      { store: "Amazon España", price: 112.0, shipping: 0, delivery: "1–3 días", returns: "30 días", seller: "Vendido por Amazon" },
      { store: "Decathlon", price: 119.99, shipping: 0, delivery: "2–4 días", returns: "60 días", seller: "Vendido por Decathlon" },
      { store: "El Corte Inglés", price: 125.0, shipping: 0, delivery: "2–5 días", returns: "30 días", seller: "Vendido por El Corte Inglés" },
    ],
  },
  {
    id: "cosori-dual-blaze",
    name: "Cosori Dual Blaze 6,4 L",
    category: "hogar",
    icon: "◌",
    descriptor: "Freidora de aire de doble resistencia",
    match: "Mismo modelo · capacidad 6,4 L · enchufe europeo",
    tags: ["freidora", "cocina", "cosori", "hogar"],
    alternatives: ["Ninja Foodi MAX", "Xiaomi Smart Air Fryer"],
    offers: [
      { store: "Amazon España", price: 159.99, shipping: 0, delivery: "1–2 días", returns: "30 días", seller: "Vendido por Amazon" },
      { store: "MediaMarkt", price: 164.0, shipping: 0, delivery: "2–4 días", returns: "14 días", seller: "Vendido por MediaMarkt" },
      { store: "El Corte Inglés", price: 169.0, shipping: 0, delivery: "2–5 días", returns: "30 días", seller: "Vendido por El Corte Inglés" },
    ],
  },
];

const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const productGrid = document.querySelector("#productGrid");
const productDetail = document.querySelector("#productDetail");
const searchInput = document.querySelector("#catalogSearch");
const storeFilter = document.querySelector("#storeFilter");
const emptyCatalog = document.querySelector("#emptyCatalog");
let selectedCategory = "all";
let selectedProductId = DEMO_PRODUCTS[0].id;

function total(offer) {
  return offer.price + offer.shipping;
}

function filteredProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase("es");
  return DEMO_PRODUCTS.filter((product) => {
    const content = [product.name, product.descriptor, ...product.tags].join(" ").toLocaleLowerCase("es");
    const categoryMatches = selectedCategory === "all" || product.category === selectedCategory;
    const storeMatches = storeFilter.value === "all" || product.offers.some((offer) => offer.store === storeFilter.value);
    return categoryMatches && storeMatches && content.includes(query);
  });
}

function renderProducts() {
  const products = filteredProducts();
  productGrid.innerHTML = "";
  emptyCatalog.hidden = products.length > 0;
  if (!products.some((product) => product.id === selectedProductId) && products[0]) selectedProductId = products[0].id;

  products.forEach((product) => {
    const offers = [...product.offers].sort((a, b) => total(a) - total(b));
    const card = document.createElement("button");
    card.type = "button";
    card.className = `catalog-card${product.id === selectedProductId ? " is-selected" : ""}`;
    card.innerHTML = `
      <span class="product-icon">${product.icon}</span>
      <span class="catalog-card-copy"><small>${product.category}</small><strong>${product.name}</strong><span>${product.descriptor}</span></span>
      <span class="catalog-price">desde <b>${money.format(total(offers[0]))}</b><small>${offers.length} tiendas demo</small></span>
    `;
    card.addEventListener("click", () => {
      selectedProductId = product.id;
      renderProducts();
      renderDetail();
    });
    productGrid.appendChild(card);
  });
  renderDetail();
}

function renderDetail() {
  const product = DEMO_PRODUCTS.find((item) => item.id === selectedProductId);
  if (!product) {
    productDetail.innerHTML = "";
    return;
  }
  const offers = [...product.offers].sort((a, b) => total(a) - total(b));
  const cheapest = total(offers[0]);
  productDetail.innerHTML = `
    <div class="detail-heading">
      <div><p class="section-number">COINCIDENCIA EXACTA / DEMO</p><h2>${product.name}</h2><p>${product.descriptor}</p></div>
      <div class="match-label"><span>✓</span>${product.match}</div>
    </div>
    <div class="buying-context">
      <strong>Cómo leer esta comparativa</strong>
      <p>Solo compara ofertas del mismo modelo. Precio final = producto + envío. Comprueba siempre talla, color, versión, vendedor y condiciones antes de pagar.</p>
    </div>
    <div class="offer-list">
      ${offers.map((offer, index) => offerRow(product, offer, index === 0, cheapest)).join("")}
    </div>
    <div class="similar-alternatives"><span>Alternativas similares, no idénticas</span>${product.alternatives.map((item) => `<b>${item}</b>`).join("")}</div>
  `;
  productDetail.querySelectorAll("[data-offer-store]").forEach((button) => {
    button.addEventListener("click", () => {
      const offer = product.offers.find((item) => item.store === button.dataset.offerStore);
      const query = new URLSearchParams({ product: `${product.name} · ${offer.store}`, price: total(offer).toFixed(2), category: product.category, source: offer.store });
      window.location.href = `index.html?${query.toString()}#analizar`;
    });
  });
}

function offerRow(product, offer, isBest, cheapest) {
  const difference = total(offer) - cheapest;
  const storeTheme = {
    "Amazon España": "amazon",
    PcComponentes: "pccomponentes",
    MediaMarkt: "mediamarkt",
    "El Corte Inglés": "elcorteingles",
    Decathlon: "decathlon",
  }[offer.store] || "default";
  return `
    <article class="offer-row${isBest ? " is-best" : ""}" data-store-theme="${storeTheme}">
      <div class="offer-store"><span>${offer.store.slice(0, 1)}</span><div><strong>${offer.store}</strong><small>${offer.seller}</small></div></div>
      <div class="offer-total"><span>Precio final</span><strong>${money.format(total(offer))}</strong>${offer.shipping ? `<small>${money.format(offer.shipping)} de envío</small>` : "<small>Envío incluido</small>"}</div>
      <div class="offer-info"><span>${offer.delivery}</span><small>Devolución: ${offer.returns}</small></div>
      <div class="offer-action">${isBest ? "<em>Mejor precio demo</em>" : `<small>+${money.format(difference)}</small>`}<button type="button" data-offer-store="${offer.store}">Analizar con WorthIt <b>→</b></button></div>
    </article>
  `;
}

document.querySelector("#catalogSearchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  renderProducts();
});
searchInput.addEventListener("input", renderProducts);
storeFilter.addEventListener("change", renderProducts);
document.querySelectorAll(".filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    selectedCategory = button.dataset.category;
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("is-active", chip === button));
    renderProducts();
  });
});

renderProducts();
