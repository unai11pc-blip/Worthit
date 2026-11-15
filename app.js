const STORAGE_KEY = "worthit-wishlist-v1";

const CATEGORY_CONFIG = {
  general: { label: "General", hint: "Piensa en usos reales: cada vez que lo lleves, uses o disfrutes cuenta.", good: 1.5, reasonable: 4, wait: 9, minFrequency: 4 },
  ropa: { label: "Ropa", hint: "Cuenta cada puesta real, no solo los planes para los que imaginas estrenarla.", good: 2.5, reasonable: 6, wait: 12, minFrequency: 2 },
  tecnologia: { label: "Tecnología", hint: "Incluye solo las veces que lo usarías de verdad y comprueba que sea compatible con lo que ya tienes.", good: 4, reasonable: 10, wait: 20, minFrequency: 3 },
  deporte: { label: "Deporte", hint: "Cuenta entrenamientos reales. Una rutina que ya existe vale más que una rutina imaginada.", good: 2, reasonable: 5, wait: 10, minFrequency: 3 },
  hogar: { label: "Hogar", hint: "Piensa en una tarea concreta que hará más fácil, no en una mejora genérica de la casa.", good: 3, reasonable: 7, wait: 14, minFrequency: 2 },
  herramientas: { label: "Herramientas", hint: "Aunque se use poco, valora si evita alquileres, reparaciones o depender de otra persona.", good: 4, reasonable: 10, wait: 20, minFrequency: 1 },
};

const ACTIONS = {
  buy: { short: "Comprar", title: "Puedes comprarlo con intención.", copy: "La estimación es coherente. Guárdalo para revisar después si el uso real estuvo a la altura.", reviewDays: 30 },
  wait: { short: "Esperar 48 h", title: "Dale 48 horas de aire.", copy: "La urgencia suele cambiar cuando desaparece el descuento, el anuncio o el impulso del momento.", reviewDays: 2 },
  alternative: { short: "Buscar alternativa", title: "Busca una opción mejor.", copy: "No es un no definitivo: compara una alternativa, repara lo que tienes o espera a que el precio tenga sentido.", reviewDays: 7 },
};

const form = document.querySelector("#purchaseForm");
const durationInput = document.querySelector("#duration");
const durationOutput = document.querySelector("#durationOutput");
const categoryInput = document.querySelector("#category");
const categoryHint = document.querySelector("#categoryHint");
const result = document.querySelector("#result");
const emptyResult = document.querySelector("#emptyResult");
const resultContent = document.querySelector("#resultContent");
const saveButton = document.querySelector("#saveButton");
const wishlistGrid = document.querySelector("#wishlistGrid");
const wishlistEmpty = document.querySelector("#wishlistEmpty");
const savedCount = document.querySelector("#savedCount");
const cardTemplate = document.querySelector("#wishlistItemTemplate");
const comparisonControls = document.querySelector("#comparisonControls");
const comparisonCount = document.querySelector("#comparisonCount");
const compareButton = document.querySelector("#compareButton");
const comparisonPanel = document.querySelector("#comparisonPanel");
const comparisonTable = document.querySelector("#comparisonTable");
const insightsCopy = document.querySelector("#insightsCopy");

let currentAnalysis = null;
let comparisonIds = new Set();

const currency = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const integer = new Intl.NumberFormat("es-ES");
const shortDate = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });

function numberOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatDuration(months) {
  if (months === 1) return "1 mes";
  if (months < 12) return `${months} meses`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const yearText = years === 1 ? "1 año" : `${years} años`;
  return remainingMonths ? `${yearText} y ${remainingMonths} mes${remainingMonths === 1 ? "" : "es"}` : yearText;
}

function formatDate(date) {
  return shortDate.format(new Date(date));
}

function uniqueId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function updateDuration() {
  const months = Number(durationInput.value);
  durationOutput.textContent = formatDuration(months);
  const fill = ((months - Number(durationInput.min)) / (Number(durationInput.max) - Number(durationInput.min))) * 100;
  durationInput.style.background = `linear-gradient(to right, var(--lime) 0%, var(--lime) ${fill}%, rgba(244,242,234,.15) ${fill}%, rgba(244,242,234,.15) 100%)`;
}

function updateCategoryHint() {
  categoryHint.textContent = CATEGORY_CONFIG[categoryInput.value].hint;
}

function getReviewDate(action, from = new Date()) {
  const date = new Date(from);
  date.setDate(date.getDate() + ACTIONS[action].reviewDays);
  return date.toISOString();
}

function reviewLabel(reviewAt) {
  const date = new Date(reviewAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const difference = Math.round((date - today) / 86400000);
  if (difference === 0) return "Revisar hoy";
  if (difference === 1) return "Revisar mañana";
  if (difference === -1) return "Revisión pendiente desde ayer";
  if (difference < 0) return `Revisión pendiente desde el ${formatDate(reviewAt)}`;
  return `Revisar el ${formatDate(reviewAt)}`;
}

function getWishlist() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data.map(normalizeItem) : [];
  } catch {
    return [];
  }
}

function setWishlist(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

function normalizeItem(item) {
  const category = CATEGORY_CONFIG[item.category] ? item.category : "general";
  const action = ACTIONS[item.decisionAction] ? item.decisionAction : item.verdict?.label === "Buena compra" ? "buy" : "wait";
  const savedAt = item.savedAt || new Date().toISOString();
  const values = {
    ...item,
    id: item.id || uniqueId(),
    name: typeof item.name === "string" && item.name.trim() ? item.name.trim() : "Compra sin nombre",
    price: Math.max(0.01, numberOr(item.price, 1)),
    frequency: Math.max(1, numberOr(item.frequency, 1)),
    duration: Math.max(1, numberOr(item.duration, 12)),
    budget: Math.max(0, numberOr(item.budget, 0)),
    category,
    hasSimilar: ["no", "si", "reemplaza"].includes(item.hasSimilar) ? item.hasSimilar : "no",
    urgency: ["no", "media", "alta"].includes(item.urgency) ? item.urgency : "no",
    need: typeof item.need === "string" ? item.need : "",
    replacement: typeof item.replacement === "string" ? item.replacement : "",
    savedAt,
    decisionAction: action,
    reviewAt: item.reviewAt || getReviewDate(action, new Date(savedAt)),
    actualUses: Math.max(0, numberOr(item.actualUses, 0)),
    purchasedAt: item.purchasedAt || null,
  };
  values.signature = item.signature || `${values.name.toLowerCase()}-${values.price}-${values.frequency}-${values.duration}`;
  return analyze(values);
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach((element) => { element.textContent = ""; });
}

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Escribe qué estás valorando.";
  if (!Number.isFinite(values.price) || values.price <= 0) errors.price = "Introduce un precio mayor que 0.";
  if (!Number.isFinite(values.frequency) || values.frequency < 1) errors.frequency = "Indica al menos un uso al mes.";
  return errors;
}

function getVerdict(values, costPerUse) {
  const config = CATEGORY_CONFIG[values.category];
  const hasWorkingAlternative = values.hasSimilar === "si";
  const hasClearNeed = values.need.trim().length >= 12;
  if (hasWorkingAlternative && values.urgency !== "alta") {
    return { label: "Compara primero", className: "badge-wait", action: "alternative", copy: "Ya tienes algo que funciona. Antes de duplicar la compra, compáralo con una alternativa o espera a que deje de cubrir esa necesidad." };
  }
  if (costPerUse <= config.good && values.frequency >= config.minFrequency && values.duration >= 6) {
    return {
      label: "Buena compra",
      className: "badge-go",
      action: "buy",
      copy: hasClearNeed ? "El precio se reparte bien en el uso y has identificado una necesidad concreta. La decisión tiene una base sólida." : "El precio se reparte bien en el uso. Antes de pagar, intenta nombrar el problema concreto que te resuelve.",
    };
  }
  if (costPerUse <= config.reasonable && values.frequency >= 2) {
    return { label: "Tiene sentido", className: "badge-consider", action: values.urgency === "alta" && hasClearNeed ? "buy" : "wait", copy: "La relación entre precio y uso es razonable, pero no hay mucha distancia entre una buena compra y una compra que se queda guardada." };
  }
  if (costPerUse <= config.wait || values.frequency < config.minFrequency) {
    return { label: "Espera 48 h", className: "badge-wait", action: "wait", copy: "La compra depende demasiado de que cumplas una previsión optimista. Guarda la idea y vuelve cuando el impulso haya bajado." };
  }
  return { label: "Busca alternativa", className: "badge-pause", action: "alternative", copy: "Con el uso que prevés, pagarías bastante por cada ocasión. Busca segunda mano, alquiler, reparación o una opción más simple." };
}

function analyze(values) {
  const totalUses = values.frequency * values.duration;
  const costPerUse = values.price / totalUses;
  const monthlyCost = values.price / values.duration;
  const annualCost = monthlyCost * 12;
  const verdict = getVerdict(values, costPerUse);
  const reducedUses = Math.max(1, Math.floor(totalUses * 0.75));
  let realityCheck = `Si lo usas un 25% menos de lo previsto, cada uso costaría ${currency.format(values.price / reducedUses)}.`;
  if (values.hasSimilar === "si") realityCheck = "Tienes una alternativa que aún funciona: esa es la comparación más importante antes de decidir.";
  if (!values.need.trim()) realityCheck = "Escribe qué problema resuelve antes de decidir: un producto concreto no siempre equivale a una necesidad concreta.";
  return { ...values, totalUses, costPerUse, monthlyCost, annualCost, verdict, realityCheck };
}

function updateBudgetImpact(analysis) {
  const budgetImpact = document.querySelector("#budgetImpact");
  if (!analysis.budget) {
    budgetImpact.hidden = true;
    return;
  }
  const percentage = (analysis.monthlyCost / analysis.budget) * 100;
  document.querySelector("#budgetPercentage").textContent = `${Math.round(percentage)} %`;
  document.querySelector("#budgetProgress").style.width = `${Math.min(percentage, 100)}%`;
  document.querySelector("#budgetDescription").textContent = percentage > 100
    ? `Su coste mensual supera tu presupuesto libre en ${currency.format(analysis.monthlyCost - analysis.budget)}.`
    : `Dejaría ${currency.format(analysis.budget - analysis.monthlyCost)} de tu presupuesto libre este mes.`;
  budgetImpact.hidden = false;
}

function setDecisionAction(action) {
  if (!currentAnalysis || !ACTIONS[action]) return;
  currentAnalysis.decisionAction = action;
  document.querySelectorAll(".decision-option").forEach((button) => {
    const selected = button.dataset.action === action;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  document.querySelector("#actionTitle").textContent = ACTIONS[action].title;
  document.querySelector("#actionCopy").textContent = ACTIONS[action].copy;
  document.querySelector("#reviewPreview").textContent = `Si la guardas, la revisarás el ${formatDate(getReviewDate(action))}.`;
  const alreadySaved = getWishlist().some((item) => item.signature === currentAnalysis.signature);
  saveButton.disabled = alreadySaved;
  saveButton.innerHTML = alreadySaved ? "Ya está en tu lista <span>✓</span>" : "Guardar decisión <span>+</span>";
}

function showResult(analysis) {
  currentAnalysis = { ...analysis };
  result.classList.remove("is-empty");
  emptyResult.hidden = true;
  resultContent.hidden = false;
  document.querySelector("#resultTitle").textContent = analysis.name;
  const badge = document.querySelector("#verdictBadge");
  badge.textContent = analysis.verdict.label;
  badge.className = `verdict-badge ${analysis.verdict.className}`;
  document.querySelector("#verdictCopy").textContent = analysis.verdict.copy;
  document.querySelector("#costPerUse").textContent = currency.format(analysis.costPerUse);
  document.querySelector("#lifetimeUses").textContent = `${integer.format(analysis.totalUses)} usos estimados en ${formatDuration(analysis.duration)}`;
  document.querySelector("#monthlyCost").textContent = currency.format(analysis.monthlyCost);
  document.querySelector("#annualCost").textContent = currency.format(analysis.annualCost);
  document.querySelector("#durationCost").textContent = formatDuration(analysis.duration);
  document.querySelector("#realityCheck").textContent = analysis.realityCheck;
  updateBudgetImpact(analysis);
  setDecisionAction(analysis.decisionAction || analysis.verdict.action);
}

function actionLabel(action) {
  return ACTIONS[action]?.short || ACTIONS.wait.short;
}

function renderWishlist() {
  const items = getWishlist();
  comparisonIds = new Set([...comparisonIds].filter((id) => items.some((item) => item.id === id)));
  wishlistGrid.innerHTML = "";
  savedCount.textContent = items.length;
  wishlistEmpty.hidden = items.length > 0;
  comparisonControls.hidden = items.length < 2;
  items.forEach((item) => {
    const fragment = cardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".wishlist-card");
    const badge = fragment.querySelector(".wishlist-verdict");
    const compareCardButton = fragment.querySelector(".compare-card-button");
    const purchaseButton = fragment.querySelector(".purchase-button");
    const useButton = fragment.querySelector(".use-button");
    const actualUsage = fragment.querySelector(".actual-usage");
    const selected = comparisonIds.has(item.id);
    badge.textContent = item.verdict.label;
    badge.classList.add(item.verdict.className);
    fragment.querySelector(".wishlist-action").textContent = actionLabel(item.decisionAction);
    fragment.querySelector("h3").textContent = item.name;
    fragment.querySelector(".wishlist-date").textContent = `${CATEGORY_CONFIG[item.category].label} · guardado el ${formatDate(item.savedAt)}`;
    fragment.querySelector(".wishlist-card-cost strong").textContent = currency.format(item.costPerUse);
    fragment.querySelector(".wishlist-meta").textContent = `${currency.format(item.price)} · ${item.frequency} usos/mes · ${formatDuration(item.duration)}`;
    fragment.querySelector(".review-date").textContent = item.purchasedAt ? `Comprada el ${formatDate(item.purchasedAt)}` : reviewLabel(item.reviewAt);
    card.classList.toggle("is-comparing", selected);
    compareCardButton.classList.toggle("is-active", selected);
    compareCardButton.textContent = selected ? "Seleccionada" : "Comparar";
    compareCardButton.disabled = !selected && comparisonIds.size >= 3;
    compareCardButton.addEventListener("click", () => toggleComparison(item.id));
    fragment.querySelector(".delete-button").addEventListener("click", () => removeFromWishlist(item.id));
    if (item.purchasedAt) {
      purchaseButton.textContent = "Comprada ✓";
      purchaseButton.disabled = true;
      useButton.hidden = false;
      actualUsage.hidden = false;
      actualUsage.textContent = `${integer.format(item.actualUses)} ${item.actualUses === 1 ? "uso real registrado" : "usos reales registrados"}`;
      useButton.addEventListener("click", () => registerUse(item.id));
    } else {
      purchaseButton.addEventListener("click", () => markPurchased(item.id));
    }
    card.dataset.id = item.id;
    wishlistGrid.appendChild(fragment);
  });
  updateComparisonControls(items);
  renderInsights(items);
}

function updateComparisonControls(items) {
  const selectedCount = comparisonIds.size;
  comparisonCount.textContent = selectedCount ? `${selectedCount} de 3 seleccionadas` : "Selecciona hasta 3 compras";
  compareButton.disabled = selectedCount < 2;
  if (comparisonPanel.hidden === false) renderComparison(items);
}

function toggleComparison(id) {
  if (comparisonIds.has(id)) comparisonIds.delete(id);
  else if (comparisonIds.size < 3) comparisonIds.add(id);
  renderWishlist();
}

function renderComparison(items = getWishlist()) {
  const selected = items.filter((item) => comparisonIds.has(item.id));
  comparisonTable.innerHTML = "";
  const rows = [
    ["Producto", (item) => item.name],
    ["Categoría", (item) => CATEGORY_CONFIG[item.category].label],
    ["Precio", (item) => currency.format(item.price)],
    ["Uso previsto", (item) => `${item.frequency} al mes · ${formatDuration(item.duration)}`],
    ["Coste por uso", (item) => currency.format(item.costPerUse)],
    ["Coste mensual", (item) => currency.format(item.monthlyCost)],
    ["Decisión", (item) => actionLabel(item.decisionAction)],
  ];
  const body = document.createElement("tbody");
  rows.forEach(([label, value]) => {
    const row = document.createElement("tr");
    const heading = document.createElement("th");
    heading.scope = "row";
    heading.textContent = label;
    row.appendChild(heading);
    selected.forEach((item) => {
      const cell = document.createElement("td");
      cell.textContent = value(item);
      row.appendChild(cell);
    });
    body.appendChild(row);
  });
  comparisonTable.appendChild(body);
}

function renderInsights(items) {
  const boughtItems = items.filter((item) => item.purchasedAt);
  if (!boughtItems.length) {
    insightsCopy.textContent = "Cuando compres algo de la lista, registra sus usos reales. Con el tiempo podrás contrastar intención y realidad.";
    return;
  }
  const realUses = boughtItems.reduce((total, item) => total + item.actualUses, 0);
  const datedItems = boughtItems.filter((item) => (Date.now() - new Date(item.purchasedAt).getTime()) / 86400000 >= 7);
  if (!datedItems.length) {
    insightsCopy.textContent = `Has empezado a seguir ${boughtItems.length} ${boughtItems.length === 1 ? "compra" : "compras"} y ya llevas ${realUses} usos registrados. Vuelve dentro de una semana para comparar con tu previsión.`;
    return;
  }
  const expectedUses = datedItems.reduce((total, item) => total + (item.frequency / 30) * Math.max(1, (Date.now() - new Date(item.purchasedAt).getTime()) / 86400000), 0);
  const recordedUses = datedItems.reduce((total, item) => total + item.actualUses, 0);
  const ratio = expectedUses ? Math.round((recordedUses / expectedUses) * 100) : 0;
  const category = CATEGORY_CONFIG[datedItems[0].category].label.toLowerCase();
  insightsCopy.textContent = ratio >= 80
    ? `Tus usos registrados van al ${ratio}% de lo que calculaste. De momento, tu estimación en ${category} parece bastante realista.`
    : `Tus usos registrados van al ${ratio}% de lo previsto. Aún es pronto, pero puede ayudarte a ser más conservador en futuras compras.`;
}

function updateWishlistItem(id, update) {
  const items = getWishlist().map((item) => (item.id === id ? normalizeItem(update({ ...item })) : item));
  setWishlist(items);
  renderWishlist();
}

function markPurchased(id) {
  updateWishlistItem(id, (item) => ({ ...item, purchasedAt: new Date().toISOString(), actualUses: 0 }));
}

function registerUse(id) {
  updateWishlistItem(id, (item) => ({ ...item, actualUses: item.actualUses + 1 }));
}

function removeFromWishlist(id) {
  setWishlist(getWishlist().filter((item) => item.id !== id));
  comparisonIds.delete(id);
  comparisonPanel.hidden = true;
  renderWishlist();
  if (currentAnalysis) showResult(currentAnalysis);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  clearErrors();
  const values = {
    name: document.querySelector("#productName").value.trim(),
    category: categoryInput.value,
    hasSimilar: document.querySelector("#hasSimilar").value,
    price: Number(document.querySelector("#price").value),
    frequency: Number(document.querySelector("#frequency").value),
    duration: Number(durationInput.value),
    need: document.querySelector("#need").value.trim(),
    replacement: document.querySelector("#replacement").value.trim(),
    urgency: document.querySelector("#urgency").value,
    budget: Math.max(0, numberOr(document.querySelector("#budget").value, 0)),
  };
  const errors = validate(values);
  if (Object.keys(errors).length) {
    Object.entries(errors).forEach(([field, message]) => { document.querySelector(`#${field}Error`).textContent = message; });
    return;
  }
  values.signature = `${values.name.toLowerCase()}-${values.price}-${values.frequency}-${values.duration}`;
  showResult(analyze(values));
  result.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

saveButton.addEventListener("click", () => {
  if (!currentAnalysis) return;
  const items = getWishlist();
  if (items.some((item) => item.signature === currentAnalysis.signature)) return;
  const now = new Date();
  const item = normalizeItem({ ...currentAnalysis, id: uniqueId(), savedAt: now.toISOString(), reviewAt: getReviewDate(currentAnalysis.decisionAction, now), actualUses: 0, purchasedAt: null });
  if (setWishlist([item, ...items])) {
    renderWishlist();
    showResult(currentAnalysis);
  }
});

document.querySelectorAll(".decision-option").forEach((button) => {
  button.addEventListener("click", () => setDecisionAction(button.dataset.action));
});

compareButton.addEventListener("click", () => {
  if (comparisonIds.size < 2) return;
  renderComparison();
  comparisonPanel.hidden = false;
  comparisonPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

document.querySelector("#closeComparison").addEventListener("click", () => { comparisonPanel.hidden = true; });
durationInput.addEventListener("input", updateDuration);
categoryInput.addEventListener("change", updateCategoryHint);
updateDuration();
updateCategoryHint();
renderWishlist();
