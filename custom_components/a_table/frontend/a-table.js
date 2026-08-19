const ATABLE_DAYS = [
  ["monday", "Lundi"], ["tuesday", "Mardi"], ["wednesday", "Mercredi"],
  ["thursday", "Jeudi"], ["friday", "Vendredi"], ["saturday", "Samedi"], ["sunday", "Dimanche"],
];

const DIET_OPTIONS = [
  { value: "everything", label: "Je mange de tout" },
  { value: "vegetarian", label: "Végétarien" },
  { value: "vegan", label: "Végétalien / vegan" },
  { value: "pescatarian", label: "Pesco-végétarien" },
  { value: "no_pork", label: "Sans porc" },
  { value: "no_lactose", label: "Sans lactose" },
  { value: "no_gluten", label: "Sans gluten" },
  { value: "paleo", label: "Paléo" },
  { value: "keto", label: "Cétogène" },
  { value: "other", label: "Autre régime / restriction" },
];

const ALLERGY_OPTIONS = [
  { value: "gluten", label: "Gluten" },
  { value: "lactose", label: "Lactose" },
  { value: "crustaceans", label: "Crustacés" },
  { value: "eggs", label: "Œufs" },
  { value: "fish", label: "Poissons" },
  { value: "soy", label: "Soja" },
  { value: "peanuts", label: "Arachides" },
  { value: "tree_nuts", label: "Fruits à coque" },
  { value: "celery", label: "Céleri" },
  { value: "mustard", label: "Moutarde" },
  { value: "molluscs", label: "Mollusques" },
  { value: "sesame", label: "Sésame" },
  { value: "other", label: "Autres allergies" },
];

const EQUIPMENT_OPTIONS = [
  { value: "microwave", label: "Micro-ondes" },
  { value: "oven", label: "Four" },
  { value: "stovetop", label: "Plaques de cuisson" },
  { value: "deep_fryer", label: "Friteuse" },
  { value: "air_fryer", label: "Air fryer" },
  { value: "blender", label: "Mixeur" },
  { value: "food_processor", label: "Robot cuiseur" },
  { value: "steamer", label: "Cuiseur vapeur" },
  { value: "rice_cooker", label: "Rice cooker" },
  { value: "pressure_cooker", label: "Autocuiseur / cocotte-minute" },
  { value: "grill", label: "Gril" },
  { value: "griddle", label: "Plancha" },
  { value: "waffle_iron", label: "Gaufrier" },
  { value: "sandwich_maker", label: "Appareil à croque-monsieur" },
  { value: "raclette_maker", label: "Appareil à raclette" },
  { value: "bread_machine", label: "Machine à pain" },
];

const OBJECTIVE_OPTIONS = [
  { value: "reduce_mental_load", label: "Diminuer la charge mentale" },
  { value: "eat_balanced", label: "Manger plus équilibré" },
  { value: "eat_seasonal", label: "Manger de saison" },
  { value: "discover_new_recipes", label: "Découvrir de nouvelles recettes" },
  { value: "eat_less_meat", label: "Manger moins de viande" },
  { value: "reduce_grocery_budget", label: "Réduire le budget des courses" },
  { value: "reduce_food_waste", label: "Réduire le gaspillage alimentaire" },
  { value: "quick_meals", label: "Préparer des repas rapides" },
  { value: "reduce_ultra_processed", label: "Réduire les aliments ultra-transformés" },
];

function wineSearchUrl(style, producers, groceryStore) {
  const query = encodeURIComponent(`${style || ""} ${(producers || []).join(" ")} ${groceryStore || ""}`.trim());
  return `https://www.google.com/search?q=${query}`;
}

const ATABLE_GUEST_COURSES = [
  ["aperitif", "Apéritif"],
  ["entree", "Entrée"],
  ["plat", "Plat"],
  ["dessert", "Dessert"],
];

const SHOPPING_CATEGORIES = [
  { key: "produce", label: "Fruits et légumes", keywords: ["tomate", "courgette", "salade", "carotte", "oignon", "ail", "poivron", "pomme", "banane", "citron", "épinard", "brocoli", "champignon", "poireau", "concombre", "avocat", "herbe", "persil", "basilic", "coriandre", "fruit", "légume", "patate", "pomme de terre"] },
  { key: "protein", label: "Protéines", keywords: ["poulet", "boeuf", "bœuf", "porc", "viande", "poisson", "saumon", "thon", "crevette", "oeuf", "œuf", "tofu", "lentille", "pois chiche", "haricot", "jambon", "steak", "dinde", "légumineuse"] },
  { key: "starch", label: "Féculents et céréales", keywords: ["pâtes", "riz", "quinoa", "pain", "farine", "semoule", "boulgour", "avoine", "pomme de terre", "patate"] },
  { key: "dairy", label: "Produits laitiers et alternatives", keywords: ["lait", "fromage", "yaourt", "crème", "beurre", "mozzarella", "parmesan", "feta"] },
  { key: "pantry", label: "Épicerie, conserves et condiments", keywords: ["huile", "vinaigre", "sauce", "conserve", "bouillon", "sucre", "miel", "moutarde", "tomate concassée", "coulis"] },
  { key: "spices", label: "Épices et aromates", keywords: ["sel", "poivre", "épice", "cumin", "paprika", "curry", "gingembre", "cannelle", "laurier", "thym", "romarin"] },
  { key: "frozen", label: "Surgelés", keywords: ["surgelé", "glace"] },
];

function categorizeIngredient(name) {
  const lower = String(name || "").toLowerCase();
  const match = SHOPPING_CATEGORIES.find((cat) => cat.keywords.some((kw) => lower.includes(kw)));
  return match ? match.key : "other";
}

const MAX_OBJECTIVES = 3;

// Miroir exact de APPETITE_MULTIPLIERS dans coordinator.py — garder synchronisé.
const APPETITE_MULTIPLIERS = { low: 0.8, normal: 1.0, high: 1.25 };

const WEEKDAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function todayKey() {
  return WEEKDAY_KEYS[new Date().getDay()];
}

function timeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "midday";
  return "evening";
}

function cloneValue(value) {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch (err) {
      /* fall through to JSON clone */
    }
  }
  return JSON.parse(JSON.stringify(value));
}

const ICONS = {
  grip: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true"><circle cx="6" cy="4.5" r="1.4"/><circle cx="14" cy="4.5" r="1.4"/><circle cx="6" cy="10" r="1.4"/><circle cx="14" cy="10" r="1.4"/><circle cx="6" cy="15.5" r="1.4"/><circle cx="14" cy="15.5" r="1.4"/></svg>',
  check: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5l4 4L16 6"/></svg>',
  settings: '<svg viewBox="0 0 24 24" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3.4"/><circle cx="12" cy="12" r="7.6" stroke-dasharray="2.4 2.8"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8" stroke-dasharray="38 12"/><path d="M12 4l3 3-3 3"/></svg>',
  close: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>',
  edit: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12.7 3.6l3.7 3.7-9 9-4.2.9.9-4.2 8.6-9.4z"/><path d="M11 5.3l3.7 3.7"/></svg>',
  trash: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 6h11M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m-6.5 0 .7 9.4A1.5 1.5 0 0 0 7.7 17h4.6a1.5 1.5 0 0 0 1.5-1.6L14.5 6"/></svg>',
  star: '<svg viewBox="0 0 20 20" class="icon icon-star" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M10 2.6l2.24 4.66 5.06.75-3.66 3.6.87 5.1L10 14.4l-4.51 2.31.87-5.1-3.66-3.6 5.06-.75L10 2.6z"/></svg>',
  library: '<svg viewBox="0 0 24 24" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18.5V5a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v13"/><path d="M6.3 17H19a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H6.3A2.3 2.3 0 0 1 4 17.7a1 1 0 0 1 1-1h1.3"/></svg>',
  history: '<svg viewBox="0 0 24 24" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3"/><path d="M3.3 3.8v4.4h4.4"/><path d="M12 7.5V12l3 2"/></svg>',
  thumbUp: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8.5" width="3" height="8" rx="1"/><path d="M8.5 8.5l2.7-5.2a1.3 1.3 0 0 1 2.4.8l-.9 3.9h3.1a1.6 1.6 0 0 1 1.55 2l-1.3 5.2A1.6 1.6 0 0 1 14.5 16.5H8.5v-8z"/></svg>',
  thumbDown: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3.5" width="3" height="8" rx="1"/><path d="M8.5 11.5l2.7 5.2a1.3 1.3 0 0 0 2.4-.8l-.9-3.9h3.1a1.6 1.6 0 0 0 1.55-2l-1.3-5.2A1.6 1.6 0 0 0 14.5 3.5H8.5v8z"/></svg>',
  search: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="8.5" cy="8.5" r="5"/><path d="M16.5 16.5l-4-4"/></svg>',
  plate: '<svg viewBox="0 0 24 24" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4.6"/></svg>',
  eye: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 10S4.5 4 10 4s8.5 6 8.5 6-3 6-8.5 6-8.5-6-8.5-6z"/><circle cx="10" cy="10" r="2.3"/></svg>',
  plus: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 4v12M4 10h12"/></svg>',
  basket: '<svg viewBox="0 0 24 24" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16l-1.4 8.4a1.5 1.5 0 0 1-1.48 1.25H6.88A1.5 1.5 0 0 1 5.4 18.4L4 10z"/><path d="M8 10 9.5 5M16 10 14.5 5M9.5 13.5v3M14.5 13.5v3"/></svg>',
  leaf: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16c-.6-6.5 3-11 12-12 1 9-3.5 12.6-12 12z"/><path d="M5 15 13 5"/></svg>',
  bolt: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2 4 12h5l-1 6 8-11h-5l1-5z"/></svg>',
  flame: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3c2.2 2.6 4 4.8 4 7.5a4 4 0 0 1-8 0c0-1.6.7-2.7 1.3-3.8.4.9.9 1.2 1.4.9-.5-1.6-.2-3.1 1.3-4.6z"/></svg>',
  snow: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M10 2v16M4 6l12 8M16 6 4 14M4.5 10h11"/></svg>',
  dish: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="6.6"/><path d="M6 10a4 4 0 0 1 8 0"/></svg>',
  sparkles: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3c.4 2 1.4 3 3.4 3.4-2 .4-3 1.4-3.4 3.4-.4-2-1.4-3-3.4-3.4C7.6 6 8.6 5 9 3z"/><path d="M15.5 10.5c.3 1.4.9 2 2.3 2.3-1.4.3-2 .9-2.3 2.3-.3-1.4-.9-2-2.3-2.3 1.4-.3 2-.9 2.3-2.3z"/><path d="M5 12c.3 1.4.9 2 2.3 2.3-1.4.3-2 .9-2.3 2.3-.3-1.4-.9-2-2.3-2.3C4.1 14 4.7 13.4 5 12z"/></svg>',
  chart: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17V9M9 17V3M15 17v-6"/></svg>',
  meal: '<svg viewBox="0 0 44 32" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="10.5"/><circle cx="16" cy="16" r="5.5"/><path d="M32 5v10M35 5v10M32 15c0 2 1.5 2 1.5 4v8M38.5 5c0 4-2 5-2 8v13"/></svg>',
  glass: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2.5h10l-1.4 8a3.6 3.6 0 0 1-7.2 0L5 2.5z"/><path d="M10 10.5v7M6.5 17.5h7"/></svg>',
  pause: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="currentColor"><rect x="5" y="4" width="3.5" height="12" rx="1"/><rect x="11.5" y="4" width="3.5" height="12" rx="1"/></svg>',
  play: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="currentColor"><path d="M6 4.5v11l9-5.5-9-5.5z"/></svg>',
  message: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5h14v9H8.5L5 16.5v-3H3v-9z"/></svg>',
  arrowDown: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3v13M4.5 10.5 10 16l5.5-5.5"/></svg>',
  filter: '<svg viewBox="0 0 20 20" class="icon" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5h14L11.5 11v5L8.5 17.5V11L3 4.5z"/></svg>',
};

function icon(name, extraClass) {
  const svg = ICONS[name];
  if (!svg) return "";
  return extraClass ? svg.replace('class="icon', `class="icon ${extraClass}`) : svg;
}

const CATEGORY_PALETTE = {
  leaf: { name: "sauge", from: "#7c9b7a", to: "#4f6b4d" },
  bolt: { name: "ambre", from: "#e0a850", to: "#a9702a" },
  flame: { name: "terracotta", from: "#d17756", to: "#9a4a2e" },
  snow: { name: "glace", from: "#8fb9c9", to: "#4d7a8c" },
  dish: { name: "sable", from: "#c9b48a", to: "#93764f" },
};

function categoryPalette(tags) {
  return CATEGORY_PALETTE[categoryIcon(tags)] || CATEGORY_PALETTE.dish;
}

const CATEGORY_ICON_RULES = [
  { icon: "leaf", test: (tags) => tags.some((t) => /(v[ée]g[ée]tarien|v[ée]g[ée]talien|vegan)/.test(t)) },
  { icon: "bolt", test: (tags) => tags.some((t) => /(rapide|express|quick)/.test(t)) },
  { icon: "flame", test: (tags) => tags.some((t) => /(four|grill|four|r[ôo]ti|braise)/.test(t)) },
  { icon: "snow", test: (tags) => tags.some((t) => /(froid|surgel|glac)/.test(t)) },
];

function categoryIcon(tags) {
  const lower = (tags || []).map((t) => String(t).toLowerCase());
  const rule = CATEGORY_ICON_RULES.find((r) => r.test(lower));
  return rule ? rule.icon : "dish";
}

class ATableCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._data = null;
    this._loading = false;
    this._weekScroll = 0;
    this._backlogScroll = 0;
    this._modal = null;
    this._mouseDrag = null;
    this._touchDrag = null;
    this._touchTimer = null;
    this._ghost = null;
    this._settingsDraft = null;
    this._timers = new Map();
    this._timerInterval = null;
    this._cookSession = null;
    this._selectMode = false;
    this._selectedCardIds = new Set();
    this._restored = false;
    this._loadedHeroPhotos = new Set();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._restored) {
      this._restored = true;
      this._restoreSession();
    }
    if (!this._data && !this._loading) this._load();
  }

  // ---- Persistance locale (session de cuisson + chronos) -----------------

  _persistSession() {
    try {
      const key = "a_table_session_v1";
      if (!this._cookSession && !this._timers.size) {
        localStorage.removeItem(key);
        return;
      }
      const payload = {
        cookSession: this._cookSession,
        timers: Array.from(this._timers.entries()),
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (error) {
      /* localStorage indisponible (ex. navigation privée) — pas de persistance, tant pis. */
    }
  }

  _restoreSession() {
    let raw;
    try {
      raw = localStorage.getItem("a_table_session_v1");
    } catch (error) {
      return;
    }
    if (!raw) return;
    let data;
    try {
      data = JSON.parse(raw);
    } catch (error) {
      return;
    }
    if (data?.cookSession) {
      this._cookSession = data.cookSession;
    }
    if (Array.isArray(data?.timers) && data.timers.length) {
      const now = Date.now();
      this._timers = new Map(
        data.timers.map(([id, timer]) => {
          const restored = { ...timer };
          if (restored.running && !restored.done) {
            restored.remaining = Math.max(0, Math.round((restored.endTimestamp - now) / 1000));
            if (restored.remaining <= 0) {
              restored.remaining = 0;
              restored.running = false;
              restored.done = true;
            }
          }
          return [id, restored];
        })
      );
      const stillRunning = [...this._timers.values()].some((t) => t.running && !t.done);
      if (stillRunning) this._startTimerInterval();
    }
  }

  setConfig() {
    this._render();
  }

  getCardSize() { return 12; }

  async _ws(message) {
    if (!this._hass) throw new Error("Home Assistant indisponible");
    return this._hass.callWS(message);
  }

  _saveScroll() {
    const week = this.shadowRoot.querySelector(".week-scroll");
    const backlog = this.shadowRoot.querySelector(".backlog-scroll");
    if (week) this._weekScroll = week.scrollLeft;
    if (backlog) this._backlogScroll = backlog.scrollLeft;
  }

  _restoreScroll() {
    requestAnimationFrame(() => {
      const week = this.shadowRoot.querySelector(".week-scroll");
      const backlog = this.shadowRoot.querySelector(".backlog-scroll");
      if (week) week.scrollLeft = this._weekScroll;
      if (backlog) backlog.scrollLeft = this._backlogScroll;
    });
  }

  async _load() {
    if (this._loading || !this._hass) return;
    this._saveScroll();
    this._loading = true;
    this._render();
    try {
      this._data = await this._ws({ type: "a_table/get_data" });
    } catch (err) {
      this._data = { error: err?.message || "Impossible de charger À table." };
    }
    this._loading = false;
    this._render();
  }

  _cards(placement) {
    return Object.values(this._data?.meal_cards || {})
      .filter((card) => card.status === "active" && card.placement === placement)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  }

  _recipe(card) {
    return this._data?.recipes?.[card.recipe_id] || { title: "Recette introuvable", tags: [] };
  }

  _esc(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  _mealHTML(card) {
    const recipe = this._recipe(card);
    const cooking = Number.isInteger(recipe.cooking_minutes) ? `${recipe.cooking_minutes} min` : "Cuisson à préciser";
    const tags = (recipe.tags || []).slice(0, 3);
    const favoriteMark = recipe.is_favorite ? `<span class="meal-fav">${icon("star", "is-active")}</span>` : "";
    const pal = categoryPalette(recipe.tags);
    const swatchStyle = `--sw-from:${pal.from};--sw-to:${pal.to}`;
    const hasPhoto = recipe.image_status === "found" && recipe.image_url;
    const swatch = hasPhoto
      ? `<button class="meal-swatch meal-swatch-photo at-img-wrap" type="button" data-detail="${this._esc(card.id)}" aria-label="Détails de ${this._esc(recipe.title)}"><img src="${this._esc(recipe.image_url)}" alt="" loading="lazy" onload="this.closest('.at-img-wrap').classList.add('loaded')"></button>`
      : `<button class="meal-swatch" type="button" style="${swatchStyle}" data-detail="${this._esc(card.id)}" aria-label="Détails de ${this._esc(recipe.title)}">${icon(categoryIcon(recipe.tags))}</button>`;
    const selected = this._selectMode && this._selectedCardIds.has(card.id);
    const selectMark = this._selectMode ? `<span class="meal-select-mark ${selected ? "is-checked" : ""}">${selected ? icon("check") : ""}</span>` : "";
    return `<article class="meal enter ${hasPhoto ? "has-photo" : ""} ${selected ? "is-selected" : ""}" data-card-id="${this._esc(card.id)}">
      ${swatch}
      ${selectMark}
      <div class="meal-row">
        <button class="grip" type="button" data-grip="${this._esc(card.id)}" aria-label="Déplacer ${this._esc(recipe.title)}" title="Maintenir puis déplacer">${icon("grip")}</button>
        <button class="meal-main" type="button" data-detail="${this._esc(card.id)}">
          <strong class="at-dish-title">${favoriteMark}${this._esc(recipe.title)}</strong>
          <span class="meta">${this._esc(cooking)} · ${this._esc(card.servings || recipe.servings || 2)} pers.</span>
          ${tags.length ? `<span class="tags">${tags.map((tag) => `<i>${this._esc(tag)}</i>`).join("")}</span>` : ""}
        </button>
        <div class="meal-actions">
          <button class="cook" type="button" data-cook="${this._esc(card.id)}" aria-label="Marquer comme cuisiné" title="Cuisiné">${icon("check")}</button>
          <button class="meal-delete" type="button" data-delete-card="${this._esc(card.id)}" aria-label="Supprimer cette carte" title="Supprimer">${icon("trash")}</button>
        </div>
      </div>
    </article>`;
  }

  _selectionBarHTML() {
    const n = this._selectedCardIds.size;
    return `<div class="selection-bar">
      <span>${n} sélectionné${n > 1 ? "s" : ""}</span>
      <div class="selection-bar-actions">
        <button class="save" type="button" data-selection-cook>${icon("play")} Mode recette</button>
        <button class="icon-btn" type="button" data-selection-exit aria-label="Annuler la sélection">${icon("close")}</button>
      </div>
    </div>`;
  }

  _toggleSelectMode() {
    this._selectMode = !this._selectMode;
    this._selectedCardIds.clear();
    this._render();
  }

  _toggleCardSelection(id) {
    if (this._selectedCardIds.has(id)) {
      this._selectedCardIds.delete(id);
    } else {
      this._selectedCardIds.add(id);
    }
    this._render();
  }

  _startCookModeFromSelection() {
    const recipes = [...this._selectedCardIds]
      .map((id) => this._data?.meal_cards?.[id])
      .filter(Boolean)
      .map((card) => this._recipe(card));
    if (!recipes.length) return;
    this._selectMode = false;
    this._selectedCardIds.clear();
    this._openCookMode(recipes);
  }

  _emptyHTML(text, iconName = "meal") {
    return `<div class="empty">${icon(iconName)}<span>${text}</span></div>`;
  }

  _emptyStateHTML(iconName, text, ctaHTML = "") {
    return `<div class="empty-state">${icon(iconName, "empty-state-icon")}<p class="empty-state-text">${text}</p>${ctaHTML ? `<div class="empty-state-cta">${ctaHTML}</div>` : ""}</div>`;
  }

  _todayHeroHTML() {
    const key = todayKey();
    const cards = this._cards(key);
    const card = cards[0];
    if (!card) {
      return `<section class="hero hero-empty">
        <h2 class="at-section-title">Aujourd'hui</h2>
        <div class="hero-fallback">
          <span>Rien de prévu pour aujourd'hui</span>
          <button class="link-cta hero-generate" type="button" data-hero-generate>${icon("arrowDown")} Générer des idées</button>
        </div>
      </section>`;
    }
    const recipe = this._recipe(card);
    const hasPhoto = recipe.image_status === "found" && recipe.image_url;
    const pal = categoryPalette(recipe.tags);
    const placeholderStyle = `background-image:linear-gradient(150deg,${pal.from},${pal.to})`;
    const todClass = `hero-card--${timeOfDay()}`;
    return `<section class="hero enter">
      <h2 class="at-section-title">Aujourd'hui</h2>
      <div class="hero-card ${todClass}" style="${placeholderStyle}" ${hasPhoto ? `data-hero-photo-url="${this._esc(recipe.image_url)}"` : ""}>
        <div class="hero-scrim">
          <h3 class="at-dish-title">${this._esc(recipe.title)}</h3>
          <div class="hero-actions">
            <button class="pill pill-ok hero-cook" type="button" data-cook="${this._esc(card.id)}" aria-label="Cuisiné">${icon("check")}<span>Cuisiné</span></button>
            <button class="pill pill-neutral hero-detail" type="button" data-detail="${this._esc(card.id)}" aria-label="Détail">${icon("eye")}<span>Détail</span></button>
          </div>
        </div>
      </div>
    </section>`;
  }

  _bindHeroPhoto(root) {
    const heroCard = root.querySelector(".hero-card[data-hero-photo-url]");
    if (!heroCard) return;
    const url = heroCard.dataset.heroPhotoUrl;
    if (!url) return;
    if (!this._loadedHeroPhotos) this._loadedHeroPhotos = new Set();
    if (this._loadedHeroPhotos.has(url)) {
      heroCard.style.backgroundImage = `url('${url}')`;
      heroCard.classList.add("loaded");
      return;
    }
    const preload = new Image();
    preload.onload = () => {
      this._loadedHeroPhotos.add(url);
      // Le rendu a pu se relancer entre-temps : ne touche que si la carte du DOM cherche toujours cette URL.
      if (heroCard.isConnected && heroCard.dataset.heroPhotoUrl === url) {
        heroCard.style.backgroundImage = `url('${url}')`;
        heroCard.classList.add("loaded");
      }
    };
    preload.src = url;
  }

  _bindWeekDots(root) {
    const scroller = root.querySelector(".week-scroll");
    const dots = root.querySelectorAll(".week-dots .dot");
    if (!scroller || !dots.length) return;
    const days = root.querySelectorAll(".day");
    const update = () => {
      let closest = 0;
      let best = Infinity;
      days.forEach((day, i) => {
        const d = Math.abs(day.offsetLeft - scroller.scrollLeft);
        if (d < best) { best = d; closest = i; }
      });
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === closest));
    };
    scroller.addEventListener("scroll", update, { passive: true });
  }

  _dayHTML(key, label) {
    const cards = this._cards(key);
    const isToday = key === todayKey();
    return `<section class="day ${isToday ? "is-today" : ""}"><header><span>${label}${isToday ? '<i class="today-dot"></i>' : ""}</span><b>${cards.length}</b></header><div class="zone" data-zone="${key}">${cards.length ? cards.map((card) => this._mealHTML(card)).join("") : this._emptyStateHTML("meal", "Rien de prévu ce jour-là.", `<button type="button" class="link-cta" data-hero-generate>${icon("arrowDown")} Générer des idées</button>`)}</div></section>`;
  }

  _tempIngredientHTML(ing) {
    const date = ing.date_limit ? ` · à utiliser avant ${ing.date_limit}` : "";
    const note = ing.note ? ` (${ing.note})` : "";
    return `<div class="temp-ing" data-ing-id="${this._esc(ing.id)}">
      <span class="temp-ing-name">${this._esc(ing.quantity || "")} ${this._esc(ing.unit || "")} ${this._esc(ing.name || "")}${note}${date}</span>
      <button class="temp-ing-edit" type="button" data-edit="${this._esc(ing.id)}" aria-label="Modifier">${icon("edit")}</button>
      <button class="temp-ing-remove" type="button" data-remove="${this._esc(ing.id)}" aria-label="Supprimer">${icon("trash")}</button>
    </div>`;
  }

  _skeletonHTML(rows = 3, height = 90) {
    const block = (h) => `<div class="skeleton" style="height:${h}px"></div>`;
    if (rows <= 1) {
      return `<div class="skeleton-wrap">${block(height)}</div>`;
    }
    return `<div class="skeleton-wrap">
      ${block(64)}
      ${block(52)}
      ${block(120)}
      <div class="skeleton-row">${Array.from({ length: rows }, () => block(height)).join("")}</div>
    </div>`;
  }

  _activeMealCards() {
    return Object.values(this._data?.meal_cards || {}).filter((card) => card.status === "active");
  }

  _render() {
    const prefs = this._data?.preferences || {};
    const count = prefs.default_recipe_count ?? 6;
    const backlog = this._cards("backlog");
    const tempIngs = this._data?.temporary_ingredients || [];
    const error = this._data?.error;

    this.shadowRoot.innerHTML = `<style>
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&display=swap');
      :host{
        display:block;width:100%;
        font-family:var(--primary-font-family,system-ui,sans-serif);
        color:var(--primary-text-color,#f4f6fa);
        --at-space-1:4px; --at-space-2:8px; --at-space-3:12px; --at-space-4:16px; --at-space-5:24px;
        --at-radius-sm:9px; --at-radius-md:13px; --at-radius-lg:19px; --at-radius-xl:22px;
        --at-border:color-mix(in srgb,var(--primary-text-color,#fff) 12%,transparent);
        --at-glass-1:color-mix(in srgb,var(--primary-text-color,#fff) 8%,transparent);
        --at-glass-2:color-mix(in srgb,var(--primary-text-color,#fff) 12%,transparent);
        --at-glass-3:color-mix(in srgb,var(--primary-text-color,#fff) 18%,transparent);
        --at-surface-1:var(--at-glass-1);
        --at-surface-2:var(--at-glass-2);
        --at-font-display:"Fraunces",var(--primary-font-family,serif);
        --at-accent-ok:#34d399; --at-accent-warn:#fbbf24; --at-accent-alert:#f87171; --at-accent-info:#38bdf8;
        --at-ease:cubic-bezier(.32,.72,.35,1);
        accent-color:var(--primary-color,#4f98a3);
      }
      *{box-sizing:border-box}
      @media (prefers-reduced-motion: reduce){
        *{transition-duration:.001ms !important;animation-duration:.001ms !important}
      }
      .app{width:100%;background:color-mix(in srgb,var(--card-background-color,#171a20) 55%,transparent);backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%);border:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 12%,transparent);border-radius:var(--at-radius-xl);padding:clamp(14px,2vw,24px);overflow:hidden}
      .at-label{color:var(--secondary-text-color,#aeb7c5);font-size:12px;text-align:center;display:block}
      .at-label::before{content:"- "}
      .at-section-title{text-align:center;font-weight:800;letter-spacing:-.01em}
      .top{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px 16px;row-gap:12px;margin-bottom:var(--at-space-5)}
      .eyebrow{margin:0 0 4px;color:var(--secondary-text-color,#aeb7c5);font-size:12px;font-weight:750;letter-spacing:.1em;text-transform:uppercase}
      h1{margin:0;font-size:clamp(24px,2.5vw,31px);line-height:1.1;font-weight:800;letter-spacing:-.01em}
      .sub{margin:6px 0 0;color:var(--secondary-text-color,#aeb7c5);font-size:14px}
      .icon{width:18px;height:18px;display:block;flex-shrink:0}
      .icon-star{fill:none}
      .icon-star.is-active{fill:currentColor}
      button{font-family:inherit}
      .refresh,.counter button,.generate,.add,.grip,.meal-main,.cook,.close,.cancel,.save,.settings,.temp-ing-edit,.temp-ing-remove,.icon-btn{font:inherit;cursor:pointer;transition:transform 150ms var(--at-ease),background-color 150ms var(--at-ease),color 150ms var(--at-ease),opacity 150ms var(--at-ease)}
      button:active{transform:scale(.96)}
      :host(*) button:focus-visible,:host(*) input:focus-visible,:host(*) select:focus-visible,:host(*) textarea:focus-visible,:host(*) [tabindex]:focus-visible{
        outline:2px solid var(--primary-color,#4f98a3);outline-offset:2px;border-radius:6px;
      }
      .icon-btn{width:44px;height:44px;border:0;border-radius:var(--at-radius-md);background:var(--at-glass-2);color:inherit;display:grid;place-items:center}
      .icon-btn:hover{background:color-mix(in srgb,var(--primary-color,#4f98a3) 16%,var(--at-glass-2))}
      .icon-btn.is-active,.icon-btn .icon-star.is-active{color:var(--primary-color,#4f98a3)}
      .fav-btn.is-active{color:#e3b341}
      .top-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
      .pill{width:auto;height:auto;padding:9px 14px;border-radius:99px;display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:700;border:1px solid transparent}
      .pill span{white-space:nowrap}
      .pill .icon{width:16px;height:16px}
      .pill-info{background:color-mix(in srgb,var(--at-accent-info) 16%,transparent);border-color:color-mix(in srgb,var(--at-accent-info) 40%,transparent);color:var(--at-accent-info)}
      .pill-ok{background:color-mix(in srgb,var(--at-accent-ok) 16%,transparent);border-color:color-mix(in srgb,var(--at-accent-ok) 40%,transparent);color:var(--at-accent-ok)}
      .pill-warn{background:color-mix(in srgb,var(--at-accent-warn) 16%,transparent);border-color:color-mix(in srgb,var(--at-accent-warn) 40%,transparent);color:var(--at-accent-warn)}
      .pill-neutral{background:var(--at-glass-1);border-color:var(--at-border);color:var(--secondary-text-color,#aeb7c5)}
      .pill:hover{filter:brightness(1.15)}
      @media (max-width:680px){
        .pill{padding:0;width:40px;height:40px;justify-content:center}
        .pill span{display:none}
      }
      .hero-actions .pill{padding:0;width:40px;height:40px;justify-content:center}
      .hero-actions .pill span{display:none}
      .link-cta{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;border:0;background:none;padding:0;font-size:13px;font-weight:700;color:var(--at-accent-ok);text-decoration:underline;text-decoration-color:color-mix(in srgb,var(--at-accent-ok) 40%,transparent);text-underline-offset:3px}
      .link-cta .icon{width:15px;height:15px;color:inherit;flex-shrink:0}
      .link-cta:hover{color:color-mix(in srgb,var(--at-accent-ok) 80%,var(--primary-text-color,#fff))}
      .generator{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:var(--at-space-4);border:1px solid var(--at-border);border-radius:var(--at-radius-md);background:var(--at-surface-1);margin-bottom:var(--at-space-4)}
      .generator.pulse{animation:at-generator-pulse 1500ms var(--at-ease) 2}
      @keyframes at-generator-pulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--primary-color,#4f98a3) 55%,transparent);border-color:var(--at-border)}50%{box-shadow:0 0 0 8px color-mix(in srgb,var(--primary-color,#4f98a3) 0%,transparent);border-color:var(--primary-color,#4f98a3)}}
      @media (prefers-reduced-motion: reduce){.generator.pulse{animation:none}}
      .generator strong{font-size:14px;font-weight:750}
      .generator-actions,.counter{display:flex;align-items:center;gap:8px}
      .counter button{width:38px;height:38px;border:1px solid var(--at-border);border-radius:var(--at-radius-sm);background:transparent;color:inherit;font-size:19px}
      .counter button:hover{background:color-mix(in srgb,var(--primary-color,#4f98a3) 12%,transparent);border-color:var(--primary-color,#4f98a3)}
      .counter span{width:28px;text-align:center;font-weight:750;font-variant-numeric:tabular-nums}
      .generate,.add,.save{min-height:40px;border:0;border-radius:var(--at-radius-sm);padding:0 14px;background:var(--primary-color,#4f98a3);color:var(--text-primary-color,#fff);font-weight:750;box-shadow:0 2px 10px color-mix(in srgb,var(--primary-color,#4f98a3) 35%,transparent);display:inline-flex;align-items:center;justify-content:center;gap:7px}
      .cancel{display:inline-flex;align-items:center;justify-content:center;gap:7px}
      .generate .icon,.add .icon,.save .icon,.cancel .icon{width:15px;height:15px}
      .generate:hover,.add:hover,.save:hover{filter:brightness(1.08)}
      .save:disabled{opacity:.5;cursor:not-allowed;filter:none;box-shadow:none}
      .temp-section{margin-bottom:var(--at-space-4);padding:var(--at-space-4);border:1px solid var(--at-border);border-radius:var(--at-radius-md);background:var(--at-glass-1)}
      .temp-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;font-size:14px;font-weight:750}
      .temp-list{display:flex;flex-wrap:wrap;gap:8px}
      .temp-ing{display:flex;align-items:center;gap:6px;padding:6px 6px 6px 10px;border-radius:var(--at-radius-sm);background:color-mix(in srgb,var(--primary-text-color,#fff) 8%,transparent);font-size:12px}
      .temp-ing-name{color:var(--secondary-text-color,#aeb7c5)}
      .temp-ing-edit,.temp-ing-remove{width:26px;height:26px;border:0;border-radius:7px;background:transparent;color:var(--secondary-text-color,#aeb7c5);display:grid;place-items:center}
      .temp-ing-edit:hover,.temp-ing-remove:hover{background:color-mix(in srgb,var(--primary-text-color,#fff) 12%,transparent);color:var(--primary-text-color,#f4f6fa)}
      .temp-ing-edit .icon,.temp-ing-remove .icon{width:14px;height:14px}
      .add-temp{margin-top:8px;font-size:12px;color:var(--primary-color,#4f98a3);background:none;border:0;padding:0;font-weight:700}
      .hero{margin-bottom:var(--at-space-4)}
      .hero .at-section-title{margin:0 0 12px;font-size:16px}
      .hero-card{position:relative;border-radius:var(--at-radius-xl);overflow:hidden;min-height:190px;background-size:cover;background-position:center;display:flex;align-items:flex-end;border:1px solid var(--at-border)}
      .hero-card::before{content:"";position:absolute;inset:0;pointer-events:none;mix-blend-mode:soft-light;opacity:.85;z-index:0}
      .hero-card--morning::before{background:linear-gradient(150deg,#ffb066,#ff8a5c)}
      .hero-card--midday::before{background:linear-gradient(150deg,#d9dde6,#c7ccda);opacity:.25}
      .hero-card--evening::before{background:linear-gradient(150deg,#2c2a6b,#5b3a9e)}
      .hero-scrim{position:relative;z-index:1;width:100%;padding:18px;background:linear-gradient(to top,rgba(0,0,0,.72),rgba(0,0,0,.1) 70%,transparent);color:#fff}
      .hero-scrim h3{margin:0 0 12px;font-size:clamp(20px,2.4vw,28px);font-weight:600;text-shadow:0 1px 6px rgba(0,0,0,.5)}
      .hero-actions{display:flex;gap:10px;flex-wrap:wrap}
      .hero-actions .pill{background:color-mix(in srgb,var(--card-background-color,#171a20) 78%,transparent)!important;border-color:color-mix(in srgb,var(--primary-text-color,#fff) 18%,transparent)!important;color:var(--primary-text-color,#f4f6fa)!important;text-shadow:0 1px 3px rgba(0,0,0,.6);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .hero-actions .pill .icon{color:inherit}
      .hero-actions .pill.pill-ok .icon{color:var(--at-accent-ok)}
      .hero-actions .pill.pill-neutral .icon{color:var(--secondary-text-color,#aeb7c5)}
      .hero-empty .hero-fallback{display:flex;flex-direction:column;align-items:center;gap:12px;padding:26px;border-radius:var(--at-radius-xl);border:1px dashed var(--at-border);background:var(--at-glass-1);color:var(--secondary-text-color,#aeb7c5);text-align:center}
      .backlog{padding:var(--at-space-3);border:1px solid var(--at-border);border-radius:var(--at-radius-md);margin-bottom:var(--at-space-4);background:var(--at-glass-1)}
      .section-head,.day header{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;font-weight:750;text-transform:uppercase;letter-spacing:.03em;color:var(--secondary-text-color,#aeb7c5)}
      .section-head b,.day header b{min-width:23px;padding:2px 7px;border-radius:99px;text-align:center;font-size:12px;color:var(--secondary-text-color,#aeb7c5);background:color-mix(in srgb,var(--primary-text-color,#fff) 10%,transparent);text-transform:none;letter-spacing:normal}
      .backlog-scroll{overflow-x:auto;overflow-y:hidden;padding:10px 1px 4px;scroll-behavior:auto}
      .backlog-zone{display:flex;gap:10px;min-width:max-content;min-height:102px}
      .backlog-zone .meal{flex:0 0 250px;width:250px}
      .week-scroll{width:100%;overflow-x:auto;overflow-y:hidden;padding:0 0 9px;scroll-behavior:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory}
      .week{display:grid;grid-auto-flow:column;grid-auto-columns:86%;gap:10px}
      .day{scroll-snap-align:start}
      .week-dots{display:flex;justify-content:center;gap:6px;margin-top:8px}
      .week-dots .dot{width:7px;height:7px;border-radius:99px;background:var(--at-glass-3);transition:background-color 150ms var(--at-ease),transform 150ms var(--at-ease)}
      .week-dots .dot.is-active{background:var(--primary-color,#4f98a3);transform:scale(1.3)}
      @media (min-width:680px) and (max-width:960px){
        .week-scroll{overflow:visible;scroll-snap-type:none}
        .week{grid-auto-flow:row;grid-template-columns:repeat(2,1fr)}
        .day{scroll-snap-align:none}
        .week-dots{display:none}
      }
      @media (min-width:961px){
        .week-scroll{overflow:visible;scroll-snap-type:none}
        .week{grid-auto-flow:row;grid-template-columns:repeat(7,minmax(0,1fr))}
        .day{scroll-snap-align:none}
        .week-dots{display:none}
      }
      .day{min-height:280px;padding:10px;border:1px solid var(--at-border);border-radius:var(--at-radius-md);background:var(--at-surface-1);transition:border-color 150ms var(--at-ease)}
      .day.is-today{border-color:color-mix(in srgb,var(--primary-color,#4f98a3) 55%,var(--at-border))}
      .day.is-today header{color:var(--primary-color,#4f98a3)}
      .today-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--primary-color,#4f98a3);margin-left:6px;vertical-align:middle}
      .zone{min-height:210px;display:flex;flex-direction:column;gap:8px;padding-top:10px;border-radius:10px;transition:background-color 150ms var(--at-ease)}
      .zone.over,.backlog-zone.over{outline:2px dashed var(--primary-color,#4f98a3);outline-offset:2px;background:color-mix(in srgb,var(--primary-color,#4f98a3) 7%,transparent)}
      .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:22px 8px;color:var(--secondary-text-color,#aeb7c5);font-size:12px;text-align:center}
      .empty .icon{width:34px;height:auto;opacity:.4}
      .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:36px 16px;text-align:center;color:var(--secondary-text-color,#aeb7c5)}
      .empty-state-icon{width:40px;height:auto;opacity:.35}
      .empty-state-text{margin:0;font-size:13px;max-width:280px}
      .empty-state-cta{margin-top:4px}
      .meal{position:relative;height:172px;min-height:0;flex:0 0 172px;border:1px solid var(--at-border);border-radius:var(--at-radius-md);background:var(--at-glass-2);box-shadow:0 1px 2px rgba(0,0,0,.06);overflow:hidden;transition:transform 160ms var(--at-ease),box-shadow 160ms var(--at-ease),opacity 160ms var(--at-ease)}
      .meal:hover{transform:translateY(-3px) scale(1.012);box-shadow:0 14px 30px rgba(0,0,0,.24),0 0 0 1px color-mix(in srgb,var(--primary-color,#4f98a3) 35%,transparent)}
      .meal.dragging{opacity:.35}
      .meal.is-selected{outline:3px solid var(--primary-color,#4f98a3);outline-offset:-3px}
      .meal-select-mark{position:absolute;top:8px;left:8px;z-index:3;width:24px;height:24px;border-radius:50%;border:2px solid rgba(255,255,255,.85);background:rgba(20,24,32,.45);display:grid;place-items:center;color:#fff}
      .meal-select-mark.is-checked{background:var(--primary-color,#4f98a3);border-color:var(--primary-color,#4f98a3)}
      .meal-select-mark .icon{width:14px;height:14px}
      .selection-bar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:10003;display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:99px;background:var(--card-background-color,#171a20);color:var(--primary-text-color,#f4f6fa);box-shadow:0 12px 30px rgba(0,0,0,.35);font-size:14px;font-weight:700}
      .selection-bar-actions{display:flex;align-items:center;gap:8px}
      .selection-bar .icon-btn{width:32px;height:32px}
      .meal.enter,.hero.enter{animation:at-enter 160ms var(--at-ease)}
      @keyframes at-enter{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
      .meal.exit{animation:at-exit 160ms var(--at-ease)}
      @keyframes at-exit{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.96)}}
      @media (prefers-reduced-motion: reduce){.meal.enter,.hero.enter,.meal.exit{animation:none}}
      .drop-indicator{position:absolute;height:3px;border-radius:99px;background:var(--primary-color,#4f98a3);box-shadow:0 0 8px color-mix(in srgb,var(--primary-color,#4f98a3) 70%,transparent);pointer-events:none;z-index:10000}
      .day:hover{box-shadow:0 4px 18px rgba(0,0,0,.12)}
      .meal-swatch{position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:flex-end;padding:8px;background:linear-gradient(150deg,var(--sw-from,#93764f),var(--sw-to,#5b452c));color:rgba(255,255,255,.85);border:0;width:100%;font:inherit;cursor:pointer}
      .meal-swatch-photo{padding:0;overflow:hidden}
      .meal-swatch-photo img{width:100%;height:100%;object-fit:cover;display:block}
      .meal-swatch .icon{width:20px;height:20px;opacity:.85}
      .meal-row{position:absolute;left:0;right:0;bottom:0;z-index:1;display:grid;grid-template-columns:28px minmax(0,1fr);align-items:end;gap:5px;padding:7px 8px 8px;background:linear-gradient(to top,rgba(0,0,0,.8) 0%,rgba(0,0,0,.55) 60%,rgba(0,0,0,0) 100%);color:#fff}
      .meal-fav{display:inline-flex;vertical-align:-2px;margin-right:4px;color:#e3b341}
      .meal-fav .icon{width:13px;height:13px}
      .grip{width:28px;height:32px;border:0;border-radius:8px;background:rgba(255,255,255,.14);color:rgba(255,255,255,.85);line-height:1;touch-action:none;display:grid;place-items:center;cursor:grab}
      .grip .icon{width:14px;height:14px}
      .grip:hover{color:#fff;background:rgba(255,255,255,.24)}
      .meal-main{min-width:0;padding:0;border:0;text-align:left;background:transparent;color:inherit;display:grid;gap:4px}
      .meal-main strong{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;font-size:13px;line-height:1.25;font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,.5)}
      .meta{display:block;color:rgba(255,255,255,.82);font-size:11px}
      .tags{display:flex;flex-wrap:wrap;gap:4px;overflow:hidden;max-height:19px}
      .tags i{padding:2px 6px;border-radius:99px;background:rgba(255,255,255,.16);color:#fff;font-size:10px;font-style:normal}
      .meal .tags{display:none}
      .meal-actions{position:absolute;top:8px;right:8px;z-index:2;display:flex;gap:6px}
      .cook{width:29px;height:29px;border:1px solid rgba(255,255,255,.35);border-radius:99px;background:rgba(20,24,32,.45);backdrop-filter:blur(6px);color:var(--at-accent-ok);display:grid;place-items:center}
      .cook:hover{background:color-mix(in srgb,var(--at-accent-ok) 25%,rgba(20,24,32,.45));border-color:var(--at-accent-ok)}
      .meal-delete{width:29px;height:29px;border:1px solid rgba(255,255,255,.35);border-radius:99px;background:rgba(20,24,32,.45);backdrop-filter:blur(6px);color:rgba(255,255,255,.85);display:grid;place-items:center}
      .meal-delete:hover{background:color-mix(in srgb,var(--at-accent-alert) 30%,rgba(20,24,32,.45));border-color:var(--at-accent-alert);color:var(--at-accent-alert)}
      .meal-delete .icon{width:14px;height:14px}
      .backlog-zone .meal{aspect-ratio:auto;height:170px}
      .skeleton-wrap{display:grid;gap:12px}
      .skeleton{border-radius:var(--at-radius-md);background:linear-gradient(100deg,var(--at-surface-1) 30%,var(--at-surface-2) 50%,var(--at-surface-1) 70%);background-size:200% 100%;animation:at-shimmer 1.4s ease-in-out infinite}
      .at-img-wrap{position:relative;background:linear-gradient(100deg,var(--at-surface-1) 30%,var(--at-surface-2) 50%,var(--at-surface-1) 70%);background-size:200% 100%;animation:at-shimmer 1.4s ease-in-out infinite}
      .at-img-wrap img{opacity:0;transition:opacity .25s ease}
      .at-img-wrap.loaded{animation:none;background:none}
      .at-img-wrap.loaded img{opacity:1}
      .skeleton-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
      @keyframes at-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      .add-row{display:flex;justify-content:flex-end;margin-top:var(--at-space-4)}
      .overlay{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:16px;background:rgba(0,0,0,.48);animation:at-fade 180ms var(--at-ease)}
      .dialog{width:min(720px,100%);max-height:calc(100dvh - 32px);overflow:auto;border:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 14%,transparent);border-radius:var(--at-radius-xl);padding:20px;background:color-mix(in srgb,var(--card-background-color,#171a20) 85%,transparent);backdrop-filter:blur(26px) saturate(150%);-webkit-backdrop-filter:blur(26px) saturate(150%);box-shadow:0 22px 56px rgba(0,0,0,.38);animation:at-pop 200ms var(--at-ease)}
      .dialog h2{text-align:center;font-weight:800;letter-spacing:-.01em}
      .at-dish-title{font-family:var(--at-font-display);font-weight:600}
      .dialog-sm{width:min(420px,100%)}
      .dialog-lg{width:min(900px,100%)}
      .dialog-cook{position:fixed;inset:0;width:100%;height:100%;max-height:100%;border-radius:0;margin:0;display:flex;flex-direction:column}
      .overlay:has(.dialog-cook){padding:0}
      .cook-progress{margin-top:12px;font-size:14px;font-weight:700;color:var(--secondary-text-color,#aeb7c5);text-align:center}
      .cook-dish-badge{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:6px;font-size:13px;font-weight:600}
      .cook-dot{display:inline-block;width:10px;height:10px;border-radius:50%}
      .cook-step{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;padding:24px 12px}
      .cook-step p{font-size:clamp(20px,4vw,32px);line-height:1.4;font-family:var(--at-font-display);max-width:640px}
      .cook-level-badge{display:inline-block;padding:6px 14px;border-radius:99px;background:var(--primary-color,#4f98a3);color:#fff;font-weight:700;font-size:13px}
      .cook-nav{justify-content:center;gap:16px}
      .cook-nav-btn{min-height:52px;padding:0 24px;font-size:16px;font-weight:700}
      .cook-prep{flex:1;overflow:auto;padding:12px 4px}
      .cook-prep-dish{margin-bottom:18px}
      .cook-prep-dish-title{font-family:var(--at-font-display);font-size:18px;margin:0 0 8px}
      .cook-prep ul{margin:0;padding-left:20px;line-height:1.7}
      .cook-lyrics{flex:1;overflow:hidden;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:0;padding:12px}
      .cook-lyric{position:absolute;left:0;right:0;top:50%;text-align:center;padding:0 16px;transform:translateY(-50%);transition:transform 200ms var(--at-ease),opacity 200ms var(--at-ease),font-size 200ms var(--at-ease)}
      .cook-lyric p{font-family:var(--at-font-display);margin:0;line-height:1.4}
      .cook-lyric.step-current{position:relative;top:auto;opacity:1;font-size:clamp(20px,4vw,32px);transform:translateY(0) scale(1)}
      .cook-lyric.step-current p{font-size:1em}
      .cook-lyric.step-prev-1,.cook-lyric.step-next-1,.cook-lyric.step-prev-2,.cook-lyric.step-next-2,.cook-lyric.step-prev-3plus,.cook-lyric.step-next-3plus{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .cook-lyric.step-prev-1,.cook-lyric.step-next-1{opacity:.55;font-size:16px}
      .cook-lyric.step-prev-1{transform:translateY(calc(-50% - var(--cook-current-half-height, 72px) - 24px)) scale(.92)}
      .cook-lyric.step-next-1{transform:translateY(calc(-50% + var(--cook-current-half-height, 72px) + 24px)) scale(.92)}
      .cook-lyric.step-prev-2,.cook-lyric.step-next-2{opacity:.3;font-size:13px}
      .cook-lyric.step-prev-2{transform:translateY(calc(-50% - var(--cook-current-half-height, 72px) - 72px)) scale(.85)}
      .cook-lyric.step-next-2{transform:translateY(calc(-50% + var(--cook-current-half-height, 72px) + 72px)) scale(.85)}
      .cook-lyric.step-prev-3plus,.cook-lyric.step-next-3plus{opacity:0;font-size:12px;pointer-events:none}
      .cook-lyric.step-prev-3plus{transform:translateY(calc(-50% - var(--cook-current-half-height, 72px) - 120px)) scale(.8)}
      .cook-lyric.step-next-3plus{transform:translateY(calc(-50% + var(--cook-current-half-height, 72px) + 120px)) scale(.8)}
      @media (prefers-reduced-motion: reduce){.cook-lyric{transition:none}}
      @keyframes at-fade{from{opacity:0}to{opacity:1}}
      @keyframes at-pop{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:none}}
      .dialog-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:var(--at-space-4)}
      .dialog-top-actions{display:flex;align-items:center;gap:6px}
      .dialog h2{margin:0;font-size:19px;font-weight:800;letter-spacing:-.01em}
      .close{border:0;background:transparent;color:var(--secondary-text-color,#aeb7c5);width:36px;height:36px;border-radius:var(--at-radius-sm);display:grid;place-items:center}
      .close:hover{background:color-mix(in srgb,var(--primary-text-color,#fff) 10%,transparent);color:var(--primary-text-color,#f4f6fa)}
      .dialog label{display:grid;gap:6px;margin-top:11px;font-size:13px;font-weight:700}
      .dialog input,.dialog select,.dialog textarea{min-height:42px;width:100%;padding:8px 10px;border:1px solid var(--at-border);border-radius:var(--at-radius-sm);background:var(--at-surface-1);color:inherit;font:inherit;transition:border-color 150ms var(--at-ease)}
      .dialog input:hover,.dialog select:hover,.dialog textarea:hover{border-color:color-mix(in srgb,var(--primary-text-color,#fff) 28%,transparent)}
      .dialog textarea{min-height:80px;resize:vertical}
      .actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-top:var(--at-space-4)}
      .cancel{min-height:40px;padding:0 13px;border:1px solid var(--at-border);border-radius:var(--at-radius-sm);background:transparent;color:inherit}
      .cancel:hover{background:color-mix(in srgb,var(--primary-text-color,#fff) 8%,transparent)}
      .facts{display:grid;gap:12px;color:var(--secondary-text-color,#aeb7c5);font-size:14px}
      .facts strong{color:var(--primary-text-color,#f4f6fa)}
      .ghost{position:fixed;z-index:10001;width:230px;pointer-events:none;opacity:.94;transform:rotate(2deg);box-shadow:0 20px 45px rgba(0,0,0,.35)}
      .toast{position:fixed;right:18px;bottom:18px;z-index:10002;max-width:340px;display:flex;align-items:center;gap:9px;padding:12px 14px;border-radius:var(--at-radius-sm);background:var(--primary-text-color,#fff);color:var(--card-background-color,#111);box-shadow:0 10px 26px rgba(0,0,0,.25);font-size:14px;animation:at-pop 200ms var(--at-ease)}
      .toast-icon{display:flex;flex-shrink:0}
      .toast-icon .icon{width:16px;height:16px}
      .toast-success .toast-icon{color:#2f9e57}
      .toast-error .toast-icon{color:#c94c4c}
      .toast-info .toast-icon{color:var(--primary-color,#4f98a3)}
      .toast-undo{margin-left:auto;flex-shrink:0;background:none;border:none;font-weight:600;color:var(--primary-color,#4f98a3);cursor:pointer;padding:2px 4px}
      .state{padding:48px 12px;text-align:center;color:var(--secondary-text-color,#aeb7c5)}
      .state.error{color:var(--error-color,#e57373)}
      .proposal{padding:var(--at-space-4);border:1px solid var(--at-border);border-radius:var(--at-radius-md);background:var(--at-surface-1);margin-bottom:10px}
      .proposal-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}
      .proposal-head .proposal-title{flex:1}
      .proposal-replace{width:32px;height:32px;flex-shrink:0}
      .proposal-replace .icon{width:15px;height:15px}
      .proposal.is-loading{opacity:.5;pointer-events:none}
      .proposal-head input[type="checkbox"]{width:20px;height:20px}
      .toggle-bar{display:flex;gap:8px;margin-bottom:12px}
      .toggle-bar-btn{flex:1;padding:8px 10px;border-radius:8px;border:1px solid var(--divider-color,rgba(255,255,255,.15));background:none;color:inherit;cursor:pointer;font-size:13px}
      .toggle-bar-btn.is-active{background:var(--primary-color,#4c8dff);border-color:var(--primary-color,#4c8dff);color:#fff}
      .macro-sliders{display:flex;gap:14px;flex-wrap:nowrap}
      .macro-sliders label{flex:1;min-width:0}
      .macro-label-row{white-space:nowrap;font-size:13px}
      .macro-sliders input[type="range"]{width:100%}
      .macro-total{margin-top:6px;font-size:12px;color:var(--secondary-text-color,#aeb7c5);text-align:right}
      .macro-total.is-warning{color:#e5484d}
      .refine-details{margin-top:10px}
      .refine-details summary{cursor:pointer;font-size:13px;color:var(--secondary-text-color,#aeb7c5)}
      .refine-section{margin-top:16px;border-top:1px solid var(--divider-color,rgba(255,255,255,.08));padding-top:12px}
      .refine-box{margin-top:8px;display:flex;flex-direction:column;gap:8px}
      .refine-box.is-loading{opacity:.6;pointer-events:none}
      .refine-log{display:flex;flex-direction:column;gap:4px;font-size:12px}
      .refine-entry{display:flex;justify-content:space-between;gap:8px;color:var(--secondary-text-color,#aeb7c5)}
      .refine-input{width:100%;resize:vertical}
      .refine-send{display:inline-flex;align-items:center;gap:6px;align-self:flex-end;background:none;border:1px solid var(--divider-color,rgba(255,255,255,.15));border-radius:8px;padding:6px 12px;color:inherit;cursor:pointer}
      .refine-send .icon{width:15px;height:15px}
      .wine-pairing{display:flex;flex-direction:column;gap:2px;margin-top:8px;padding:8px 10px;border-radius:8px;background:var(--secondary-background-color,rgba(255,255,255,.04))}
      .wine-producers{font-size:11px;font-style:italic;color:var(--secondary-text-color,#aeb7c5)}
      .wine-search-link{color:var(--primary-color,#4f98a3);font-size:12px;margin-top:4px;text-decoration:none}
      .wine-search-link:hover{text-decoration:underline}
      .recipe-image{margin:10px 0;border-radius:var(--at-radius-sm);overflow:hidden}
      .guest-course-image{height:140px}
      .guest-course-image img{width:100%;height:100%;object-fit:cover;display:block}
      .guest-course-image-fallback{display:grid;place-items:center;color:rgba(255,255,255,.85)}
      .guest-course-image-fallback .icon{width:30px;height:30px}
      .recipe-image img{width:100%;max-height:260px;object-fit:cover;display:block}
      .proposal-image{margin:-1px -1px 10px;border-radius:var(--at-radius-md) var(--at-radius-md) 0 0;overflow:hidden}
      .proposal-image img{width:100%;height:120px;object-fit:cover;display:block}
      .step-timer-btn{display:block;margin-top:4px;font-size:11px;padding:3px 8px;border-radius:99px;border:1px solid var(--at-border);background:none;color:var(--primary-color,#4f98a3);cursor:pointer}
      .timers-sticky{display:none;flex-direction:column;gap:6px;position:sticky;top:0;z-index:4;margin:0 -20px 10px;padding:8px 20px;background:var(--card-background-color,#171a20);box-shadow:0 6px 10px -6px rgba(0,0,0,.4)}
      .timers-sticky.has-timers{display:flex}
      .timer-row{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:8px;background:var(--at-surface-1);font-size:13px}
      .timer-row.is-done{background:color-mix(in srgb,#2f9e57 18%,transparent)}
      .timer-name{flex:1;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .timer-remaining{font-variant-numeric:tabular-nums;color:var(--secondary-text-color,#aeb7c5)}
      .timer-add-row{gap:8px}
      .proposal-title{font-weight:700;font-size:14px}
      .proposal-meta{display:flex;flex-wrap:wrap;gap:8px;color:var(--secondary-text-color,#aeb7c5);font-size:11px}
      .proposal-section{margin-top:8px;font-size:12px}
      .proposal-section strong{display:block;margin-bottom:4px;color:var(--secondary-text-color,#aeb7c5);font-size:11px;text-transform:uppercase}
      .proposal-nutrition{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:6px}
      .nutrition-item{padding:6px;border-radius:8px;background:color-mix(in srgb,var(--primary-text-color,#fff) 8%,transparent);text-align:center}
      .nutrition-item b{display:block;font-size:12px;color:var(--primary-text-color,#f4f6fa)}
      .nutrition-item span{font-size:10px;color:var(--secondary-text-color,#aeb7c5)}
      .settings-section{margin-top:var(--at-space-4);border:1px solid var(--at-border);border-radius:var(--at-radius-lg);padding:18px;background:var(--at-glass-1)}
      .settings-section h3{margin:0 0 4px;font-size:15px;font-weight:800;color:var(--primary-text-color,#f4f6fa);letter-spacing:-.01em;text-align:center}
      .settings-section .at-label{margin-bottom:10px}
      .checkbox-group,.chip-group{display:flex;flex-wrap:wrap;gap:8px}
      .checkbox-item{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--secondary-text-color,#aeb7c5);transition:opacity 150ms var(--at-ease)}
      .checkbox-item.disabled{opacity:.4}
      .chip{display:inline-flex;align-items:center;gap:6px;padding:5px 6px 5px 10px;border-radius:99px;background:color-mix(in srgb,var(--primary-text-color,#fff) 8%,transparent);font-size:12px;color:var(--secondary-text-color,#aeb7c5);transition:background-color 150ms var(--at-ease)}
      .chip button{border:0;background:transparent;color:inherit;font-size:14px;cursor:pointer;width:18px;height:18px;border-radius:50%;display:grid;place-items:center;line-height:1}
      .chip button:hover{background:color-mix(in srgb,var(--primary-text-color,#fff) 18%,transparent);color:var(--primary-text-color,#f4f6fa)}
      .filter-chip{border:1px solid var(--at-border);cursor:pointer}
      .filter-chip.is-active{background:var(--primary-color,#4f98a3);color:var(--text-primary-color,#fff);border-color:transparent}
      .row{display:flex;gap:10px;align-items:center}
      .row > *{flex:1}
      .tabs{display:flex;gap:6px;margin-bottom:var(--at-space-4);border-bottom:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 10%,transparent);padding-bottom:8px;flex-wrap:wrap}
      .tab{padding:7px 11px;border-radius:99px;background:transparent;border:0;color:var(--secondary-text-color,#aeb7c5);font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;text-align:left}
      .tab:hover{background:color-mix(in srgb,var(--primary-text-color,#fff) 7%,transparent)}
      .tab.active{background:var(--primary-color,#4f98a3);color:var(--text-primary-color,#fff)}
      @media (min-width:680px){
        #settings-form{display:grid;grid-template-columns:180px 1fr;gap:20px;align-items:start}
        #settings-form .dialog-top{grid-column:1/-1}
        #settings-form .tabs{grid-column:1;flex-direction:column;border-bottom:0;border-right:1px solid var(--at-border);padding:0 12px 0 0;gap:2px;align-self:start;position:sticky;top:0}
        #settings-form .tab{width:100%}
        #settings-form .tab-content{grid-column:2}
      }
      .tab-content{display:none;animation:at-fade 160ms var(--at-ease)}
      .tab-content.active{display:block}
      .readonly-input{pointer-events:none;opacity:0.7}
      .hidden{display:none !important}
      .dialog input[type="range"]{-webkit-appearance:none;appearance:none;height:28px;background:transparent;padding:0;min-height:auto;border:0}
      input[type="range"]::-webkit-slider-runnable-track{height:5px;border-radius:99px;background:color-mix(in srgb,var(--primary-text-color,#fff) 16%,transparent)}
      input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;margin-top:-6.5px;border-radius:50%;background:var(--primary-color,#4f98a3);border:3px solid var(--card-background-color,#171a20);box-shadow:0 1px 4px rgba(0,0,0,.35);cursor:pointer}
      input[type="range"]::-moz-range-track{height:5px;border-radius:99px;background:color-mix(in srgb,var(--primary-text-color,#fff) 16%,transparent)}
      input[type="range"]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:var(--primary-color,#4f98a3);border:3px solid var(--card-background-color,#171a20);box-shadow:0 1px 4px rgba(0,0,0,.35);cursor:pointer}
      .dialog input[type="checkbox"],.dialog input[type="radio"]{width:16px;min-height:16px;height:16px;flex-shrink:0;padding:0}
      .toggle-group{display:flex;flex-wrap:wrap;gap:8px}
      .guest-course-picker{margin-bottom:14px;display:flex;flex-direction:column;gap:8px}
      .guest-course-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .toggle-chip-sm{padding:5px 10px;font-size:11px;margin-right:10px}
      .toggle-chip-sm:has(input:disabled){opacity:.4;cursor:not-allowed}
      .guest-item{padding:10px 0;border-top:1px solid var(--divider-color,rgba(255,255,255,.08))}
      .guest-item.is-loading{opacity:.5;pointer-events:none}
      .guest-item-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
      .guest-item-head .proposal-replace{width:26px;height:26px}
      .guest-item-head .proposal-replace .icon{width:13px;height:13px}
      .guest-item .refine-details{margin-top:6px}
      .composed-count{width:56px;margin-left:6px}
      .composed-stepper{display:inline-flex;align-items:center;gap:6px;margin-left:6px}
      .composed-stepper[hidden]{display:none}
      .stepper-btn{width:26px;height:26px;border-radius:7px;border:1px solid var(--at-border);background:transparent;color:inherit;font-size:15px;line-height:1;display:grid;place-items:center}
      .stepper-btn:hover{background:color-mix(in srgb,var(--primary-text-color,#fff) 10%,transparent)}
      .stepper-output{min-width:18px;text-align:center;font-weight:700}
      .guest-item .proposal-nutrition{margin-top:8px}
      .guest-course-card{padding:16px}
      .guest-course-card .proposal-section{margin-top:12px;font-size:13px}
      .guest-course-card .proposal-head{margin-bottom:10px}
      .guest-item:first-child{border-top:none}
      .toggle-chip{position:relative;display:inline-flex;align-items:center;padding:8px 15px;border-radius:99px;border:1px solid var(--at-border);background:var(--at-surface-1);font-size:13px;font-weight:600;color:var(--secondary-text-color,#aeb7c5);cursor:pointer;transition:background-color 150ms var(--at-ease),border-color 150ms var(--at-ease),color 150ms var(--at-ease)}
      .toggle-chip input{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}
      .toggle-chip:hover{border-color:color-mix(in srgb,var(--primary-color,#4f98a3) 45%,var(--at-border))}
      .toggle-chip:has(input:checked){background:var(--primary-color,#4f98a3);border-color:transparent;color:var(--text-primary-color,#fff)}
      .toggle-chip:has(input:disabled){opacity:.4;cursor:not-allowed}
      .toggle-chip:has(input:focus-visible){outline:2px solid var(--primary-color,#4f98a3);outline-offset:2px}
      .library-search{display:flex;align-items:center;gap:8px;padding:0 12px;border:1px solid var(--at-border);border-radius:var(--at-radius-sm);background:var(--at-surface-1);margin-top:var(--at-space-3)}
      .library-search .icon{color:var(--secondary-text-color,#aeb7c5)}
      .library-search input{border:0;background:transparent;padding-left:0}
      .library-tags{margin-top:var(--at-space-3);position:relative}
      .library-filters-anchor{position:relative;display:inline-flex}
      .library-filters-panel{position:absolute;top:calc(100% + 8px);left:0;z-index:20;min-width:240px;max-width:min(360px,80vw);max-height:280px;overflow:auto;padding:12px;border:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 14%,transparent);border-radius:var(--at-radius-md);background:color-mix(in srgb,var(--card-background-color,#171a20) 96%,transparent);box-shadow:0 16px 40px rgba(0,0,0,.4);animation:at-pop 150ms var(--at-ease)}
      @media (max-width:680px){
        .library-filters-panel{position:fixed;top:auto;bottom:0;left:0;right:0;width:100%;max-width:100%;max-height:60vh;border-radius:var(--at-radius-xl) var(--at-radius-xl) 0 0;box-shadow:0 -16px 40px rgba(0,0,0,.45)}
      }
      .library-fav-filter{flex-direction:row;margin-top:var(--at-space-3);align-items:center}
      .library-results{margin-top:var(--at-space-3);max-height:48vh;overflow:auto}
      .library-list{display:grid;gap:8px}
      .library-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid var(--at-border);border-radius:var(--at-radius-sm);background:var(--at-surface-1)}
      .library-item-main{display:grid;gap:3px;min-width:0}
      .library-item-main strong{font-size:13px;font-weight:700}
      .library-item-actions{display:flex;gap:6px;flex-shrink:0}
      .library-item-actions .icon-btn{width:36px;height:36px}
      .history-list{margin-top:var(--at-space-3);max-height:52vh;overflow:auto}
      .history-items{display:grid;gap:6px}
      .history-item{display:grid;grid-template-columns:52px 1fr auto auto;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--at-radius-sm);background:var(--at-surface-1);font-size:13px}
      .history-date{color:var(--secondary-text-color,#aeb7c5);font-size:11px;font-weight:700;text-transform:uppercase}
      .history-title{font-weight:600}
      .history-meta{display:flex;align-items:center;gap:6px;color:var(--secondary-text-color,#aeb7c5);font-size:11px}
      .history-delete{width:28px;height:28px}
      .history-delete .icon{width:14px;height:14px}
      .history-rating-icon{width:14px;height:14px}
      .rate-title{margin:6px 0 0;font-weight:700;font-size:15px}
      .rate-choice{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:var(--at-space-3)}
      .rate-btn{display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 8px;border:1px solid var(--at-border);border-radius:var(--at-radius-md);background:var(--at-surface-1);color:inherit}
      .rate-btn .icon{width:26px;height:26px}
      .rate-btn:hover{border-color:var(--primary-color,#4f98a3)}
      .rate-btn.is-active{border-color:var(--primary-color,#4f98a3);background:color-mix(in srgb,var(--primary-color,#4f98a3) 14%,var(--at-surface-1));color:var(--primary-color,#4f98a3)}
      .shopping-list{margin-top:var(--at-space-3);max-height:56vh;overflow:auto;display:grid;gap:var(--at-space-4)}
      .shopping-category h4{margin:0 0 8px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--secondary-text-color,#aeb7c5)}
      .shopping-items{display:grid;gap:6px}
      .shopping-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:var(--at-radius-sm);background:var(--at-surface-1);cursor:pointer;transition:opacity 150ms var(--at-ease)}
      .shopping-item input{width:16px;height:16px;flex-shrink:0;min-height:auto}
      .shopping-item-name{flex:1;font-weight:600;font-size:13px}
      .shopping-item-qty{font-size:12px;color:var(--secondary-text-color,#aeb7c5)}
      .shopping-item.is-checked{opacity:.45}
      .shopping-item.is-checked .shopping-item-name{text-decoration:line-through}
      .shopping-stocked{margin-top:14px}
      .shopping-stocked summary{cursor:pointer;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--secondary-text-color,#aeb7c5)}
      .shopping-stocked .shopping-items{margin-top:8px}
      .taste-hint{margin:6px 0 10px;font-size:12px;color:var(--secondary-text-color,#aeb7c5);line-height:1.4}
      [data-analyze-tastes]{display:inline-flex;align-items:center;gap:6px}
      [data-analyze-tastes] .icon{width:14px;height:14px}
      .taste-suggestion-group{margin-top:10px}
      .taste-suggestion-label{display:block;font-size:11px;font-weight:700;color:var(--secondary-text-color,#aeb7c5);margin-bottom:6px;text-transform:uppercase;letter-spacing:.03em}
      .suggestion-chip{border:1px dashed var(--at-border);background:transparent;cursor:pointer}
      .suggestion-chip .icon{width:11px;height:11px}
      .suggestion-chip:hover{border-color:var(--primary-color,#4f98a3);color:var(--primary-color,#4f98a3)}
      @media(max-width:680px){
        .app{padding:14px;border-radius:14px}
        .generator{flex-wrap:wrap}
        .generator-actions{width:100%;justify-content:space-between}
        .day{min-height:305px}
        .zone{min-height:230px}
        .backlog-zone .meal{flex-basis:260px;width:260px}
        .rate-choice{grid-template-columns:1fr}
        .dialog-lg,.dialog-sm{width:100%}
      }
      @media(max-width:480px){
        .actions{flex-direction:column}
        .actions > *{flex:1 1 100%}
      }
    </style><section class="app">
      <header class="top">
        <div>
          <h1>À table</h1>
        </div>
        <div class="top-actions">
          <button class="icon-btn pill pill-info" type="button" data-open-shopping aria-label="Liste de courses" title="Liste de courses">${icon("basket")}<span>Courses</span></button>
          <button class="icon-btn pill pill-ok" type="button" data-open-library aria-label="Mes recettes" title="Mes recettes">${icon("library")}<span>Mes recettes</span></button>
          <button class="icon-btn pill pill-neutral" type="button" data-open-history aria-label="Historique" title="Historique">${icon("history")}<span>Historique</span></button>
          <button class="icon-btn pill pill-warn" type="button" data-open-guest aria-label="Repas spécial" title="Repas spécial">${icon("glass")}<span>Repas spécial</span></button>
          <button class="icon-btn pill ${this._selectMode ? "pill-ok" : "pill-neutral"}" type="button" data-select-mode aria-label="Sélectionner plusieurs repas" title="Sélectionner">${icon("check")}<span>Sélectionner</span></button>
          <button class="icon-btn pill pill-neutral settings" type="button" aria-label="Paramètres" title="Paramètres">${icon("settings")}<span>Paramètres</span></button>
          <button class="icon-btn pill pill-neutral refresh" type="button" aria-label="Actualiser" title="Actualiser">${icon("refresh")}<span>Actualiser</span></button>
        </div>
      </header>
      ${!this._modal && this._timers.size ? this._stickyTimersBarHTML() : ""}
      ${this._loading
        ? this._skeletonHTML()
        : error
          ? `<p class="state error">${this._esc(error)}</p>`
          : `
            ${this._todayHeroHTML()}
            <section class="temp-section">
              <header class="temp-head">
                <span>Aliments à utiliser rapidement</span>
                <button class="add-temp" type="button" data-add-temp>＋ Ajouter un aliment</button>
              </header>
              <div class="temp-list">
                ${tempIngs.length ? tempIngs.map((ing) => this._tempIngredientHTML(ing)).join("") : this._emptyHTML("Aucun aliment.")}
              </div>
            </section>
            <section class="generator">
              <strong>Proposer des repas</strong>
              <div class="generator-actions">
                <div class="counter">
                  <button type="button" data-count="minus" aria-label="Moins">−</button>
                  <span>${count}</span>
                  <button type="button" data-count="plus" aria-label="Plus">+</button>
                </div>
                <button class="generate" type="button"><span data-generate-label>Générer</span></button>
              </div>
            </section>
            <section class="backlog">
              <header class="section-head">
                <span>À cuisiner</span>
                <b>${backlog.length}</b>
              </header>
              <div class="backlog-scroll">
                <div class="backlog-zone" data-zone="backlog">
                  ${backlog.length ? backlog.map((card) => this._mealHTML(card)).join("") : this._emptyHTML("Les recettes validées apparaîtront ici.")}
                </div>
              </div>
            </section>
            <div class="week-scroll">
              <section class="week">
                ${ATABLE_DAYS.map(([key, label]) => this._dayHTML(key, label)).join("")}
              </section>
            </div>
            <div class="week-dots">
              ${ATABLE_DAYS.map((_, i) => `<i class="dot ${i === 0 ? "is-active" : ""}"></i>`).join("")}
            </div>
            <div class="add-row">
              <button class="add" type="button">＋ Ajouter une recette</button>
            </div>
          `
      }
    </section>
    ${this._selectMode && this._selectedCardIds.size ? this._selectionBarHTML() : ""}`;

    this._bind();
    this._restoreScroll();
    if (this._modal) this._mountModal();
  }

  _bind() {
    const root = this.shadowRoot;
    root.querySelector(".refresh")?.addEventListener("click", () => this._load());
    root.querySelector(".settings")?.addEventListener("click", () => this._openSettings());
    root.querySelector("[data-open-library]")?.addEventListener("click", () => this._openLibrary());
    root.querySelector("[data-open-history]")?.addEventListener("click", () => this._openHistory());
    root.querySelector("[data-open-shopping]")?.addEventListener("click", () => this._openShopping());
    root.querySelector("[data-open-guest]")?.addEventListener("click", () => this._openGuest());
    root.querySelector(".add")?.addEventListener("click", () => this._openAdd());
    root.querySelector(".generate")?.addEventListener("click", (event) => this._generate(event.currentTarget));
    root.querySelectorAll("[data-hero-generate]").forEach((btn) => btn.addEventListener("click", () => this._scrollToGenerator()));
    this._bindWeekDots(root);
    this._bindHeroPhoto(root);
    this._cleanupEnterAnimations(root);
    root.querySelectorAll("[data-count]").forEach((button) =>
      button.addEventListener("click", () => {
        const current = Number(this._data.preferences?.default_recipe_count || 6);
        this._data.preferences.default_recipe_count = Math.max(1, Math.min(8, current + (button.dataset.count === "plus" ? 1 : -1)));
        this._render();
      })
    );
    root.querySelectorAll("[data-detail]").forEach((button) =>
      button.addEventListener("click", () => {
        if (this._selectMode) {
          this._toggleCardSelection(button.dataset.detail);
          return;
        }
        this._openDetail(button.dataset.detail);
      })
    );
    root.querySelector("[data-select-mode]")?.addEventListener("click", () => this._toggleSelectMode());
    root.querySelector("[data-selection-cook]")?.addEventListener("click", () => this._startCookModeFromSelection());
    root.querySelector("[data-selection-exit]")?.addEventListener("click", () => this._toggleSelectMode());
    root.querySelectorAll("[data-cook]").forEach((button) =>
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        this._cook(button.dataset.cook);
      })
    );
    root.querySelectorAll("[data-delete-card]").forEach((button) =>
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        this._deleteCard(button.dataset.deleteCard);
      })
    );
    root.querySelectorAll("[data-grip]").forEach((grip) => this._bindGrip(grip));
    root.querySelectorAll("[data-zone]").forEach((zone) => this._bindZone(zone));
    root.querySelectorAll("[data-add-temp]").forEach((btn) =>
      btn.addEventListener("click", () => this._openAddTemp())
    );
    root.querySelectorAll("[data-edit]").forEach((btn) =>
      btn.addEventListener("click", () => this._openEditTemp(btn.dataset.edit))
    );
    root.querySelectorAll("[data-remove]").forEach((btn) =>
      btn.addEventListener("click", () => this._removeTemp(btn.dataset.remove))
    );
    this._bindTimerRowActions();
  }

  _cleanupEnterAnimations(root) {
    const els = root.querySelectorAll(".enter");
    if (!els.length) return;
    const clear = () => els.forEach((el) => el.classList.remove("enter"));
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      clear();
      return;
    }
    els.forEach((el) => {
      const done = () => { el.classList.remove("enter"); el.removeEventListener("transitionend", done); el.removeEventListener("animationend", done); };
      el.addEventListener("animationend", done, { once: true });
    });
    setTimeout(clear, 220);
  }

  _bindGrip(grip) {
    grip.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      const meal = grip.closest(".meal");
      const state = {
        id: grip.dataset.grip,
        meal,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        started: false,
        touch: event.pointerType === "touch",
      };
      if (state.touch) {
        this._touchDrag = state;
        this._touchTimer = setTimeout(() => this._startDrag(state), 360);
      } else {
        this._mouseDrag = state;
        this._startDrag(state);
      }
      grip.setPointerCapture?.(event.pointerId);
    });
    grip.addEventListener("pointermove", (event) => this._dragMove(event));
    grip.addEventListener("pointerup", (event) => this._dragEnd(event));
    grip.addEventListener("pointercancel", (event) => this._dragEnd(event));
  }

  _bindZone(zone) {
    zone.addEventListener("dragover", (event) => event.preventDefault());
  }

  _startDrag(state) {
    if (!state || state.started) return;
    state.started = true;
    state.meal.classList.add("dragging");
    const ghost = state.meal.cloneNode(true);
    ghost.classList.add("ghost");
    this._ghost = ghost;
    this.shadowRoot.append(ghost);
    this._placeGhost(state.x, state.y);
    if (state.touch) navigator.vibrate?.(10);
  }

  _dragMove(event) {
    const state =
      this._touchDrag?.pointerId === event.pointerId
        ? this._touchDrag
        : this._mouseDrag?.pointerId === event.pointerId
          ? this._mouseDrag
          : null;
    if (!state) return;
    const moved = Math.hypot(event.clientX - state.x, event.clientY - state.y);
    if (!state.started && state.touch && moved > 9) {
      clearTimeout(this._touchTimer);
      this._touchDrag = null;
      return;
    }
    if (!state.started) return;
    event.preventDefault();
    this._placeGhost(event.clientX, event.clientY);
    const target = this.shadowRoot.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-zone]");
    this.shadowRoot.querySelectorAll("[data-zone]").forEach((zone) =>
      zone.classList.toggle("over", zone === target)
    );
    state.target = target;
    this._updateDropIndicator(target, event.clientY, state.meal);
  }

  _updateDropIndicator(target, clientY, dragMeal) {
    if (!this._dropIndicator) {
      this._dropIndicator = document.createElement("div");
      this._dropIndicator.className = "drop-indicator";
      this._dropIndicator.style.display = "none";
      this.shadowRoot.append(this._dropIndicator);
    }
    if (!target) {
      this._dropIndicator.style.display = "none";
      return;
    }
    const siblings = [...target.querySelectorAll(".meal")].filter((m) => m !== dragMeal);
    let before = null;
    for (const sib of siblings) {
      const rect = sib.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (clientY < mid) { before = sib; break; }
    }
    const hostRect = this.getBoundingClientRect();
    const refRect = before ? before.getBoundingClientRect() : (siblings.length ? siblings[siblings.length - 1].getBoundingClientRect() : target.getBoundingClientRect());
    const top = (before ? refRect.top : refRect.bottom) - hostRect.top;
    this._dropIndicator.style.display = "block";
    this._dropIndicator.style.top = `${top}px`;
    this._dropIndicator.style.left = `${refRect.left - hostRect.left}px`;
    this._dropIndicator.style.width = `${refRect.width}px`;
  }

  _dragEnd(event) {
    const state =
      this._touchDrag?.pointerId === event.pointerId
        ? this._touchDrag
        : this._mouseDrag?.pointerId === event.pointerId
          ? this._mouseDrag
          : null;
    if (!state) return;
    clearTimeout(this._touchTimer);
    this._ghost?.remove();
    this._ghost = null;
    this._dropIndicator?.remove();
    this._dropIndicator = null;
    state.meal.classList.remove("dragging");
    this.shadowRoot.querySelectorAll("[data-zone]").forEach((zone) => zone.classList.remove("over"));
    if (state.started && state.target?.dataset.zone) {
      this._move(state.id, state.target.dataset.zone);
    }
    if (this._touchDrag === state) this._touchDrag = null;
    if (this._mouseDrag === state) this._mouseDrag = null;
  }

  _placeGhost(x, y) {
    if (this._ghost) {
      this._ghost.style.left = `${x - 112}px`;
      this._ghost.style.top = `${y - 32}px`;
    }
  }

  async _move(id, placement) {
    this._saveScroll();
    try {
      await this._ws({ type: "a_table/move_meal_card", meal_card_id: id, placement });
      await this._load();
    } catch (error) {
      this._toast(error?.message || "Déplacement impossible.", "error");
    }
  }

  async _animateCardExit(id) {
    const el = this.shadowRoot.querySelector(`.meal[data-card-id="${CSS.escape(id)}"]`);
    if (!el) return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    el.classList.add("exit");
    await new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        el.removeEventListener("animationend", finish);
        clearTimeout(timer);
        resolve();
      };
      el.addEventListener("animationend", finish, { once: true });
      const timer = setTimeout(finish, 220);
    });
  }

  async _deleteCard(id) {
    const card = this._data?.meal_cards?.[id];
    if (!card) return;
    if (!confirm("Supprimer cette carte ?")) return;
    this._saveScroll();
    await this._animateCardExit(id);
    try {
      await this._ws({ type: "a_table/remove_meal_card", meal_card_id: id });
      await this._load();
      this._toast("Carte supprimée.", "success", async () => {
        await this._ws({ type: "a_table/add_recipe_to_backlog", recipe_id: card.recipe_id, servings: card.servings });
        await this._load();
        this._toast("Carte restaurée dans À cuisiner.", "success");
      });
    } catch (error) {
      this._toast(error?.message || "Suppression impossible.", "error");
    }
  }

  async _cook(id) {
    this._saveScroll();
    const card = this._data?.meal_cards?.[id];
    const recipeId = card?.recipe_id;
    try {
      await this._ws({ type: "a_table/cook_meal_card", meal_card_id: id });
      await this._load();
      if (recipeId) {
        this._modal = { type: "rate", recipe_id: recipeId };
        this._mountModal();
      }
    } catch (error) {
      this._toast(error?.message || "Impossible de marquer cette recette comme cuisinée.", "error");
    }
  }

  _scrollToGenerator() {
    const generator = this.shadowRoot.querySelector(".generator");
    if (!generator) return;
    generator.scrollIntoView({ behavior: "smooth", block: "center" });
    generator.classList.remove("pulse");
    // Force reflow so re-adding the class restarts the animation even if it's already present.
    void generator.offsetWidth;
    generator.classList.add("pulse");
    const clear = () => generator.classList.remove("pulse");
    generator.addEventListener("animationend", clear, { once: true });
    setTimeout(clear, 1600);
  }

  async _generate(btn) {
    const count = Number(this._data.preferences?.default_recipe_count || 6);
    const label = btn?.querySelector("[data-generate-label]");
    if (btn) btn.disabled = true;
    // 4 must match coordinator.py's _DRAFT_BATCH_SIZE constant server-side.
    const totalBatches = Math.ceil(count / 4);
    let progressInterval = null;
    if (label) {
      if (totalBatches > 1) {
        let batch = 1;
        label.textContent = `Génération en cours… (lot ${batch}/${totalBatches})`;
        progressInterval = setInterval(() => {
          if (batch >= totalBatches) return;
          batch += 1;
          label.textContent = `Génération en cours… (lot ${batch}/${totalBatches})`;
        }, 4500);
      } else {
        label.textContent = "Génération en cours…";
      }
    }
    try {
      const result = await this._ws({ type: "a_table/generate_draft", count });
      if (progressInterval) clearInterval(progressInterval);
      await this._load();
      this._modal = { type: "validate", draft_id: result.draft_id };
      this._mountModal();
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      this._toast(error?.message || "Génération impossible.", "error");
      if (btn) btn.disabled = false;
      if (label) label.textContent = "Générer";
    }
  }

  _openDetail(id) {
    this._modal = { type: "detail", id };
    this._mountModal();
  }

  _openAdd() {
    this._modal = { type: "add", addMode: "ai" };
    this._mountModal();
  }

  _openAddTemp() {
    this._modal = { type: "add_temp" };
    this._mountModal();
  }

  _openEditTemp(id) {
    this._modal = { type: "edit_temp", id };
    this._mountModal();
  }

  async _removeTemp(id) {
    try {
      await this._ws({ type: "a_table/remove_temporary_ingredient", ingredient_id: id });
      await this._load();
    } catch (error) {
      this._toast(error?.message || "Suppression impossible.", "error");
    }
  }

  _openLibrary() {
    this._modal = { type: "library", search: "", tag: null, onlyFavorites: false, filtersOpen: false };
    this._mountModal();
  }

  _openHistory() {
    this._modal = { type: "history", days: this._data?.preferences?.history_days_for_display ?? 20 };
    this._mountModal();
  }

  _openShopping() {
    this._modal = { type: "shopping" };
    this._mountModal();
  }

  _openGuest() {
    this._modal = { type: "guest", guests: 6, notes: "", refineLog: {} };
    this._mountModal();
  }

  _renderRefineBox(kind, key) {
    const logKey = `${kind}:${key}`;
    const log = (this._modal.refineLog && this._modal.refineLog[logKey]) || [];
    const logHtml = log
      .map((entry) => `<div class="refine-entry"><span class="refine-you">Vous : ${this._esc(entry.text)}</span><span class="refine-status">${this._esc(entry.status)}</span></div>`)
      .join("");
    return `<div class="refine-box" data-refine-kind="${this._esc(kind)}" data-refine-key="${this._esc(String(key))}">
      ${logHtml ? `<div class="refine-log">${logHtml}</div>` : ""}
      <textarea class="refine-input" data-refine-message placeholder="Ex. Remplace le poulet par du tofu, ou un conseil de cuisson…" rows="2"></textarea>
      <button class="refine-send" type="button" data-refine-send>${icon("message")}<span>Envoyer</span></button>
    </div>`;
  }

  _bindRefineBoxes(overlay) {
    overlay.querySelectorAll("[data-refine-send]").forEach((btn) => {
      const box = btn.closest(".refine-box");
      if (!box) return;
      btn.addEventListener("click", async () => {
        const kind = box.dataset.refineKind;
        const key = box.dataset.refineKey;
        const textarea = box.querySelector("[data-refine-message]");
        const message = textarea?.value.trim();
        if (!message) return;
        btn.disabled = true;
        box.classList.add("is-loading");
        try {
          let updated;
          if (kind === "recipe") {
            updated = await this._ws({ type: "a_table/refine_recipe", recipe_id: key, message });
            this._data.recipes[key] = updated;
          } else if (kind === "proposal") {
            const index = Number(key);
            updated = await this._ws({ type: "a_table/refine_proposal", draft_id: this._modal.draft_id, index, message });
            this._data.drafts[this._modal.draft_id].proposals[index] = updated;
          } else if (kind === "guest_course") {
            const [courseKey, itemIndexStr] = key.split(":");
            const payload = { type: "a_table/refine_guest_course", menu_id: this._modal.menu_id, course_key: courseKey, message };
            if (itemIndexStr !== undefined) payload.item_index = Number(itemIndexStr);
            updated = await this._ws(payload);
            this._data.guest_menus[this._modal.menu_id] = updated;
          }
          const logKey = `${kind}:${key}`;
          this._modal.refineLog = this._modal.refineLog || {};
          this._modal.refineLog[logKey] = [...(this._modal.refineLog[logKey] || []), { text: message, status: "Mis à jour" }];
          this._mountModal();
        } catch (error) {
          this._toast(error?.message || "Modification impossible.", "error");
          btn.disabled = false;
          box.classList.remove("is-loading");
        }
      });
    });
  }

  async _toggleFavorite(recipeId) {
    try {
      const recipe = await this._ws({ type: "a_table/toggle_favorite", recipe_id: recipeId });
      if (this._data?.recipes?.[recipeId]) {
        this._data.recipes[recipeId] = recipe;
      }
      this._mountModal();
    } catch (error) {
      this._toast(error?.message || "Impossible de mettre à jour le favori.", "error");
    }
  }

  async _addRecipeToBacklog(recipeId) {
    try {
      await this._ws({ type: "a_table/add_recipe_to_backlog", recipe_id: recipeId });
      await this._load();
      this._toast("Recette ajoutée à À cuisiner.", "success");
    } catch (error) {
      this._toast(error?.message || "Ajout impossible.", "error");
    }
  }

  _openSettings() {
    this._settingsDraft = {
      preferences: cloneValue(this._data.preferences || {}),
      generation_rules: cloneValue(this._data.generation_rules || {}),
    };
    this._modal = { type: "settings", tab: "general" };
    this._mountModal();
  }

  async _discardDraft(draftId) {
    if (!draftId) return;
    try {
      await this._ws({ type: "a_table/validate_draft", draft_id: draftId, discard: true });
    } catch (err) {
      /* draft may already be gone; nothing else to do */
    }
  }

  _closeModal() {
    if (this._modal?.type === "cook") this._releaseWakeLock();
    this._modal = null;
    this._settingsDraft = null;
    this.shadowRoot.querySelector(".overlay")?.remove();
    this._render();
  }

  _clearTimers() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
    this._timers.clear();
  }

  // ---- Chronos de cuisson --------------------------------------------

  _stepLabelFor(recipe, stepText) {
    const labels = recipe?.step_labels;
    const steps = recipe?.steps;
    if (Array.isArray(labels) && Array.isArray(steps) && labels.length === steps.length) {
      const index = steps.indexOf(stepText);
      if (index !== -1 && labels[index]) return labels[index];
    }
    return this._stepShortLabel(stepText);
  }

  _stripLeadingFiller(str) {
    const fillers = [
      /^pendant la cuisson des? /i,
      /^pendant que /i,
      /^pendant ce temps,? /i,
      /^une fois que /i,
      /^une fois /i,
      /^ensuite,? /i,
      /^puis,? /i,
      /^après avoir /i,
      /^dès que /i,
    ];
    for (const re of fillers) {
      if (re.test(str)) {
        const remainder = str.replace(re, "").trim();
        if (remainder) {
          return remainder.charAt(0).toUpperCase() + remainder.slice(1);
        }
      }
    }
    return str;
  }

  _stepShortLabel(text) {
    const str = this._stripLeadingFiller(String(text || "").trim());
    if (!str) return "Étape";
    const punctMatch = str.slice(0, 40).match(/^(.*?)[,;.]/);
    if (punctMatch && punctMatch[1].trim().length) {
      return punctMatch[1].trim();
    }
    if (str.length <= 30) return str;
    const cut = str.slice(0, 30);
    const lastSpace = cut.lastIndexOf(" ");
    const trimmed = (lastSpace > 10 ? cut.slice(0, lastSpace) : cut).trim();
    return `${trimmed}…`;
  }

  _stepTimerMinutes(step) {
    const match = String(step || "").match(/(\d+)\s*(h(?:eure)?s?|min(?:ute)?s?)/i);
    if (!match) return null;
    const value = Number(match[1]);
    return /^h/i.test(match[2]) ? value * 60 : value;
  }

  _startTimerInterval() {
    if (!this._timerInterval) {
      this._timerInterval = setInterval(() => this._tickTimers(), 1000);
    }
  }

  _addTimer(name, minutes) {
    if (!minutes || minutes <= 0) return;
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const id = `timer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();
    this._timers.set(id, {
      name: name || "Chrono",
      totalSeconds: minutes * 60,
      endTimestamp: now + minutes * 60000,
      remaining: minutes * 60,
      running: true,
      done: false,
    });
    this._startTimerInterval();
    this._renderTimersList();
    this._persistSession();
  }

  _notifyTimerDone(name) {
    this._toast(`${name} : chrono terminé !`, "success");
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification("À table", { body: `${name} : chrono terminé !`, tag: `atable-timer-${name}` });
      } catch (error) {
        /* Notification indisponible (ex. certains navigateurs mobiles) — le toast suffit. */
      }
    }
  }

  _tickTimers() {
    let changed = false;
    const now = Date.now();
    this._timers.forEach((timer) => {
      if (timer.running && !timer.done) {
        timer.remaining = Math.max(0, Math.round((timer.endTimestamp - now) / 1000));
        changed = true;
        if (timer.remaining <= 0) {
          timer.remaining = 0;
          timer.running = false;
          timer.done = true;
          this._notifyTimerDone(timer.name);
        }
      }
    });
    if (changed) {
      this._renderTimersList();
      this._persistSession();
    }
  }

  _formatTimer(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  _timersListHTML() {
    if (!this._timers.size) return "";
    return [...this._timers.entries()]
      .map(
        ([id, t]) => `<div class="timer-row ${t.done ? "is-done" : ""}">
          <span class="timer-name">${this._esc(t.name)}</span>
          <span class="timer-remaining">${this._formatTimer(t.remaining)}</span>
          <button class="icon-btn" type="button" data-timer-toggle="${id}" aria-label="${t.running ? "Mettre en pause" : "Reprendre"}">${icon(t.running ? "pause" : "play")}</button>
          <button class="icon-btn" type="button" data-timer-remove="${id}" aria-label="Supprimer">${icon("trash")}</button>
        </div>`
      )
      .join("");
  }

  _stickyTimersBarHTML() {
    if (!this._timers.size) return `<div class="timers-sticky" data-timers-list></div>`;
    return `<div class="timers-sticky has-timers" data-timers-list>${this._timersListHTML()}</div>`;
  }

  _renderTimersList() {
    // Update every timer bar that's actually visible (the main view's is hidden — and emptied —
    // while a modal is mounted, so it must not be repopulated behind the modal's own bar).
    this.shadowRoot.querySelectorAll("[data-timers-list]").forEach((bar) => {
      if (bar.style.display === "none") return;
      bar.innerHTML = this._timersListHTML();
      bar.classList.toggle("has-timers", this._timers.size > 0);
    });
    this._bindTimerRowActions();
  }

  _bindTimerRowActions() {
    const root = this.shadowRoot;
    root.querySelectorAll("[data-timer-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const timer = this._timers.get(btn.dataset.timerToggle);
        if (timer && !timer.done) {
          timer.running = !timer.running;
          if (timer.running) timer.endTimestamp = Date.now() + timer.remaining * 1000;
          this._renderTimersList();
          this._persistSession();
        }
      });
    });
    root.querySelectorAll("[data-timer-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this._timers.delete(btn.dataset.timerRemove);
        this._renderTimersList();
        this._persistSession();
      });
    });
  }

  _bindTimers(overlay) {
    this._bindTimerRowActions();
    overlay.querySelectorAll("[data-start-step-timer]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const minutes = Number(btn.dataset.startStepTimer);
        const name = btn.dataset.stepLabel || "Étape";
        this._addTimer(name, minutes);
      });
    });
    overlay.querySelector("[data-add-timer]")?.addEventListener("click", () => {
      const nameInput = overlay.querySelector("[data-timer-name]");
      const minutesInput = overlay.querySelector("[data-timer-minutes]");
      const minutes = Number(minutesInput?.value);
      if (!minutes || minutes <= 0) {
        this._toast("Indique une durée valide.", "error");
        return;
      }
      this._addTimer(nameInput?.value.trim() || "Chrono", minutes);
      if (nameInput) nameInput.value = "";
      if (minutesInput) minutesInput.value = "";
    });
  }

  // ---- Mode recette (cuisson guidée) --------------------------------------

  _flatCookPlan(recipes) {
    const plan = [];
    recipes.forEach((recipe, idx) => {
      (recipe.steps || []).forEach((stepText) => plan.push({ recipe_index: idx, step_text: stepText }));
    });
    return plan;
  }

  async _requestWakeLock() {
    if (!("wakeLock" in navigator)) return;
    try {
      this._wakeLock = await navigator.wakeLock.request("screen");
    } catch (error) {
      /* échec silencieux (ex. onglet non visible) */
    }
  }

  _releaseWakeLock() {
    try {
      this._wakeLock?.release?.();
    } catch (error) {
      /* rien à faire */
    }
    this._wakeLock = null;
  }

  _cookRecipeSetKey(recipes) {
    return (recipes || []).map((r) => r.id || r.title || "").join("|");
  }

  async _openCookMode(recipes) {
    if (!recipes?.length) return;
    const sameSet = this._cookSession && this._cookRecipeSetKey(this._cookSession.recipes) === this._cookRecipeSetKey(recipes);
    if (sameSet) {
      // Reprend la session existante telle quelle, sans nouvel appel réseau.
      this._modal = { type: "cook" };
      this._mountModal();
      this._requestWakeLock();
      return;
    }
    this._cookSession = { recipes, plan: null, stepIndex: 0, phase: "prep", loading: recipes.length > 1 };
    this._persistSession();
    this._modal = { type: "cook" };
    this._mountModal();
    this._requestWakeLock();
    if (recipes.length > 1) {
      try {
        const result = await this._ws({
          type: "a_table/generate_cook_plan",
          recipes: recipes.map((r) => ({ name: r.title, steps: r.steps || [] })),
        });
        this._cookSession.plan = Array.isArray(result?.plan) && result.plan.length ? result.plan : this._flatCookPlan(recipes);
      } catch (error) {
        this._cookSession.plan = this._flatCookPlan(recipes);
      }
      this._cookSession.loading = false;
      this._persistSession();
      if (this._modal?.type === "cook") this._mountModal();
    }
  }

  _finishCookSession() {
    this._cookSession = null;
    this._persistSession();
    this._closeModal();
  }

  _cookModeSteps() {
    const state = this._cookSession;
    if (!state) return [];
    if (state.recipes.length === 1) {
      return (state.recipes[0].steps || []).map((step_text) => ({ recipe_index: 0, step_text }));
    }
    return state.plan || [];
  }

  _cookStepLevelBadgeHTML(text) {
    const match = String(text || "").match(/niveau\s*(\d+)\s*\/\s*(\d+)/i);
    if (!match) return "";
    return `<span class="cook-level-badge">Niveau ${this._esc(match[1])}/${this._esc(match[2])}</span>`;
  }

  _cookPrepHTML() {
    const state = this._cookSession;
    const multi = state.recipes.length > 1;
    const blocks = state.recipes.map((recipe) => {
      const ingredients = recipe.ingredients?.length
        ? this._scaledIngredients(recipe, recipe.servings)
        : [];
      const list = ingredients.length
        ? `<ul>${ingredients.map((item) => `<li>${this._esc(item.quantity != null ? Math.round(item.quantity * 100) / 100 : "")} ${this._esc(item.unit || "")} ${this._esc(item.name || "")}</li>`).join("")}</ul>`
        : `<p class="taste-hint">Aucun ingrédient détaillé pour ce plat.</p>`;
      return `<div class="cook-prep-dish">
        ${multi ? `<h3 class="cook-prep-dish-title">${this._esc(recipe.title || "")}</h3>` : ""}
        ${list}
      </div>`;
    }).join("");
    return `<section class="dialog dialog-cook">
      <header class="dialog-top">
        <h2>Mise en place</h2>
        <button class="close" type="button" data-close-cook>${icon("close")}</button>
      </header>
      <div class="cook-prep">
        ${blocks}
      </div>
      <footer class="actions cook-nav">
        <button class="save cook-nav-btn" type="button" data-cook-start>Commencer</button>
      </footer>
    </section>`;
  }

  _cookStepClass(distance) {
    if (distance === 0) return "step-current";
    const tier = Math.abs(distance) >= 3 ? "3plus" : String(Math.abs(distance));
    return distance < 0 ? `step-prev-${tier}` : `step-next-${tier}`;
  }

  _cookModeHTML() {
    const state = this._cookSession;
    if (!state) return "";
    const multi = state.recipes.length > 1;
    if (multi && state.loading) {
      return `<section class="dialog dialog-cook">
        <header class="dialog-top">
          <h2>Mode recette</h2>
          <button class="close" type="button" data-close-cook>${icon("close")}</button>
        </header>
        <p class="taste-hint">Préparation d'un plan de cuisson entrelacé…</p>
        ${this._skeletonHTML(3, 60)}
      </section>`;
    }
    if (state.phase === "prep") {
      return this._cookPrepHTML();
    }
    const steps = this._cookModeSteps();
    if (!steps.length) {
      return `<section class="dialog dialog-cook">
        <header class="dialog-top">
          <h2>Mode recette</h2>
          <button class="close" type="button" data-close-cook>${icon("close")}</button>
        </header>
        ${this._emptyStateHTML("meal", "Aucune étape disponible pour cette recette.")}
      </section>`;
    }
    const idx = Math.max(0, Math.min(state.stepIndex, steps.length - 1));
    state.stepIndex = idx;
    const progress = `Étape ${idx + 1}/${steps.length}`;
    const VISIBLE_RANGE = 3;
    const stepsHTML = steps.map((step, i) => {
      const distance = i - idx;
      if (Math.abs(distance) > VISIBLE_RANGE) return "";
      const recipe = state.recipes[step.recipe_index] || {};
      const pal = categoryPalette(recipe.tags);
      const isCurrent = distance === 0;
      const dishBadge = multi && isCurrent
        ? `<span class="cook-dish-badge"><i class="cook-dot" style="background:${pal.from}"></i>${this._esc(recipe.title || "")}</span>`
        : "";
      const levelBadge = isCurrent ? this._cookStepLevelBadgeHTML(step.step_text) : "";
      const minutes = isCurrent ? this._stepTimerMinutes(step.step_text) : null;
      const timerBtn = minutes
        ? `<button class="step-timer-btn" type="button" data-start-step-timer="${minutes}" data-step-label="${this._esc(this._stepLabelFor(recipe, step.step_text))}">⏱ Lancer (${minutes} min)</button>`
        : "";
      return `<div class="cook-lyric ${this._cookStepClass(distance)}" data-step-index="${i}">
        ${dishBadge}
        <p>${this._esc(step.step_text)}</p>
        ${levelBadge}
        ${timerBtn}
      </div>`;
    }).join("");
    return `<section class="dialog dialog-cook">
      <header class="dialog-top">
        <h2>Mode recette</h2>
        <div class="dialog-top-actions">
          <button class="cancel" type="button" data-cook-finish>Terminer</button>
          <button class="close" type="button" data-close-cook>${icon("close")}</button>
        </div>
      </header>
      ${this._stickyTimersBarHTML()}
      <div class="cook-progress">${this._esc(progress)}</div>
      <div class="cook-lyrics">${stepsHTML}</div>
      <footer class="actions cook-nav">
        <button class="cancel cook-nav-btn" type="button" data-cook-prev ${idx === 0 ? "disabled" : ""}>← Précédent</button>
        <button class="save cook-nav-btn" type="button" data-cook-next ${idx === steps.length - 1 ? "disabled" : ""}>Suivant →</button>
      </footer>
    </section>`;
  }

  _bindCookModal(overlay) {
    overlay.querySelector("[data-close-cook]")?.addEventListener("click", () => this._closeModal());
    overlay.querySelector("[data-cook-finish]")?.addEventListener("click", () => this._finishCookSession());
    overlay.querySelector("[data-cook-start]")?.addEventListener("click", () => {
      if (this._cookSession) this._cookSession.phase = "steps";
      this._persistSession();
      this._mountModal();
    });
    overlay.querySelector("[data-cook-prev]")?.addEventListener("click", () => {
      if (!this._cookSession) return;
      this._cookSession.stepIndex = Math.max(0, this._cookSession.stepIndex - 1);
      this._persistSession();
      this._mountModal();
    });
    overlay.querySelector("[data-cook-next]")?.addEventListener("click", () => {
      if (!this._cookSession) return;
      const steps = this._cookModeSteps();
      this._cookSession.stepIndex = Math.min(steps.length - 1, this._cookSession.stepIndex + 1);
      this._persistSession();
      this._mountModal();
    });
    this._bindTimers(overlay);
    requestAnimationFrame(() => {
      const current = overlay.querySelector(".cook-lyric.step-current");
      const container = overlay.querySelector(".cook-lyrics");
      if (current && container) {
        const height = current.getBoundingClientRect().height;
        container.style.setProperty("--cook-current-half-height", `${height / 2}px`);
      }
    });
  }

  _mountModal() {
    this.shadowRoot.querySelector(".overlay")?.remove();
    // The main view's own sticky timer bar (rendered by _render()) must not double up
    // with the one a modal renders inside itself — hide it while a modal is mounted.
    const mainBar = this.shadowRoot.querySelector(".app > [data-timers-list]");
    if (!this._modal) {
      if (mainBar) mainBar.style.display = "";
      return;
    }
    if (mainBar) {
      mainBar.style.display = "none";
      mainBar.innerHTML = "";
    }
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    if (this._modal.type === "detail") {
      const card = this._data?.meal_cards?.[this._modal.id];
      const recipe = card && this._recipe(card);
      if (!card || !recipe) return;
      const scaleFactor = this._scaleFactor(recipe, card.servings);
      const scaleNote = Math.abs(scaleFactor - 1) > 0.01
        ? `<p class="taste-hint">Quantités ajustées à ${this._esc(card.servings || recipe.servings)} pers., appétit ${this._esc(this._data?.preferences?.appetite || "normal")}.</p>`
        : "";
      const ingredients = recipe.ingredients?.length
        ? `<ul>${this._scaledIngredients(recipe, card.servings).map((item) => `<li>${this._esc(item.quantity != null ? Math.round(item.quantity * 100) / 100 : "")} ${this._esc(item.unit || "")} ${this._esc(item.name || "")}</li>`).join("")}</ul>`
        : "Aucun ingrédient détaillé pour le moment.";
      const steps = recipe.steps?.length
        ? `<ol>${recipe.steps
            .map((s) => {
              const minutes = this._stepTimerMinutes(s);
              const timerBtn = minutes
                ? `<button class="step-timer-btn" type="button" data-start-step-timer="${minutes}" data-step-label="${this._esc(this._stepLabelFor(recipe, s))}">⏱ Lancer (${minutes} min)</button>`
                : "";
              return `<li>${this._esc(s)}${timerBtn}</li>`;
            })
            .join("")}</ol>`
        : "Aucune étape détaillée pour le moment.";
      const nutrition = recipe.nutrition || {};
      const price = recipe.price_per_serving != null
        ? `<div><strong>Prix par portion</strong><br>${this._esc(recipe.price_per_serving)} €</div>`
        : "";
      const imageBlock = recipe.image_status === "found" && recipe.image_url
        ? `<div class="recipe-image at-img-wrap"><img src="${this._esc(recipe.image_url)}" alt="${this._esc(recipe.title)}" loading="lazy" onload="this.closest('.at-img-wrap').classList.add('loaded')"></div>`
        : "";
      overlay.innerHTML = `<section class="dialog">
        <header class="dialog-top">
          <h2 class="at-dish-title">${this._esc(recipe.title)}</h2>
          <div class="dialog-top-actions">
            <button class="icon-btn" type="button" data-fetch-image="${this._esc(card.recipe_id)}" aria-label="Illustrer" title="Chercher une image">${icon("eye")}</button>
            <button class="icon-btn fav-btn ${recipe.is_favorite ? "is-active" : ""}" type="button" data-toggle-favorite="${this._esc(card.recipe_id)}" aria-label="Basculer favori" title="Favori">${icon("star", recipe.is_favorite ? "is-active" : "")}</button>
            <button class="close" type="button">${icon("close")}</button>
          </div>
        </header>
        ${this._stickyTimersBarHTML()}
        ${imageBlock}
        <div class="facts">
          <div><strong>Temps total</strong><br>${this._esc(recipe.cooking_minutes ?? "À préciser")} min</div>
          <div><strong>Portions</strong><br>${this._esc(card.servings || recipe.servings || 2)}</div>
          <div><strong>Ingrédients</strong>${scaleNote}<br>${ingredients}</div>
          <div><strong>Étapes</strong><br>${steps}</div>
          <div>
            <strong>Nutrition (par portion)</strong><br>
            <div class="proposal-nutrition">
              <div class="nutrition-item"><b>${this._esc(nutrition.kcal ?? "–")}</b><span>kcal</span></div>
              <div class="nutrition-item"><b>${this._esc(nutrition.protein_g ?? "–")}</b><span>protéines</span></div>
              <div class="nutrition-item"><b>${this._esc(nutrition.carb_g ?? "–")}</b><span>glucides</span></div>
              <div class="nutrition-item"><b>${this._esc(nutrition.fat_g ?? "–")}</b><span>lipides</span></div>
              <div class="nutrition-item"><b>${this._esc(nutrition.fiber_g ?? "–")}</b><span>fibres</span></div>
            </div>
          </div>
          ${price}
        </div>
        <div class="refine-section">
          <h3>Chronos</h3>
          <div class="row timer-add-row">
            <input type="text" placeholder="Nom (facultatif)" data-timer-name>
            <input type="number" min="1" placeholder="Min." data-timer-minutes style="max-width:80px">
            <button class="cancel" type="button" data-add-timer>+ Chrono</button>
          </div>
        </div>
        <div class="refine-section">
          <h3>Discuter avec l'IA</h3>
          <p class="taste-hint">Ex. "remplace le poulet par du tofu" ou "un conseil de cuisson pour ne pas le dessécher".</p>
          ${this._renderRefineBox("recipe", card.recipe_id)}
        </div>
        <footer class="actions">
          <button class="cancel" type="button">Fermer</button>
          <button class="cancel" type="button" data-open-cook-mode>${icon("play")} Mode recette</button>
          <button class="save" type="button" data-modal-cook="${this._esc(card.id)}">Cuisiné</button>
        </footer>
      </section>`;
    } else if (this._modal.type === "cook") {
      overlay.innerHTML = this._cookModeHTML();
    } else if (this._modal.type === "validate") {
      const draft = this._data?.drafts?.[this._modal.draft_id];
      const proposals = draft?.proposals || [];
      if (!proposals.length) {
        overlay.innerHTML = `<section class="dialog">
          <header class="dialog-top">
            <h2>Aucune proposition</h2>
            <button class="close" type="button" data-close-draft>${icon("close")}</button>
          </header>
          <p class="state">Le brouillon est vide ou invalide.</p>
          <footer class="actions">
            <button class="cancel" type="button" data-close-draft>Fermer</button>
          </footer>
        </section>`;
      } else {
        overlay.innerHTML = `<section class="dialog">
          <header class="dialog-top">
            <h2>Valider les propositions</h2>
            <button class="close" type="button" data-close-draft>${icon("close")}</button>
          </header>
          <div class="facts">
            ${proposals
              .map((p, i) => {
                const nutr = p.nutrition || {};
                const ingredients = (p.ingredients || [])
                  .map((ing) => `${ing.quantity || ""} ${ing.unit || ""} ${ing.name || ""}`)
                  .join(", ");
                const price = p.price_per_serving != null
                  ? `<div class="proposal-meta"><span>${this._esc(p.price_per_serving)} € / portion</span></div>`
                  : "";
                const proposalImage = p.image_status === "found" && p.image_url
                  ? `<div class="proposal-image at-img-wrap"><img src="${this._esc(p.image_url)}" alt="" loading="lazy" onload="this.closest('.at-img-wrap').classList.add('loaded')"></div>`
                  : "";
                return `<div class="proposal" data-proposal-index="${i}">
                  ${proposalImage}
                  <div class="proposal-head">
                    <input type="checkbox" data-proposal-check="${i}" checked>
                    <strong class="proposal-title">${this._esc(p.title || "Recette sans titre")}</strong>
                    <button class="icon-btn proposal-replace" type="button" data-replace-proposal="${i}" aria-label="Remplacer cette proposition" title="Remplacer cette proposition">${icon("refresh")}</button>
                  </div>
                  <div class="proposal-meta">
                    <span>${this._esc(p.cooking_minutes || "–")} min</span>
                    <span>${this._esc(p.servings || 2)} pers.</span>
                  </div>
                  ${price}
                  <div class="proposal-section">
                    <strong>Ingrédients</strong>
                    <span>${this._esc(ingredients || "Aucun")}</span>
                  </div>
                  <div class="proposal-section">
                    <strong>Nutrition (par portion)</strong>
                    <div class="proposal-nutrition">
                      <div class="nutrition-item"><b>${this._esc(nutr.kcal ?? "–")}</b><span>kcal</span></div>
                      <div class="nutrition-item"><b>${this._esc(nutr.protein_g ?? "–")}</b><span>protéines</span></div>
                      <div class="nutrition-item"><b>${this._esc(nutr.carb_g ?? "–")}</b><span>glucides</span></div>
                      <div class="nutrition-item"><b>${this._esc(nutr.fat_g ?? "–")}</b><span>lipides</span></div>
                      <div class="nutrition-item"><b>${this._esc(nutr.fiber_g ?? "–")}</b><span>fibres</span></div>
                    </div>
                  </div>
                  <details class="refine-details">
                    <summary>Ajuster avec l'IA</summary>
                    ${this._renderRefineBox("proposal", i)}
                  </details>
                </div>`;
              })
              .join("")}
          </div>
          <footer class="actions">
            <button class="cancel" type="button" data-close-draft>Annuler</button>
            <button class="save" type="button" data-validate-draft="${this._esc(this._modal.draft_id)}">Valider</button>
          </footer>
        </section>`;
      }
    } else if (this._modal.type === "add") {
      const mode = this._modal.addMode || "ai";
      overlay.innerHTML = `<form class="dialog" novalidate>
        <header class="dialog-top">
          <h2>Ajouter une recette</h2>
          <button class="close" type="button">${icon("close")}</button>
        </header>
        <div class="toggle-bar">
          <button type="button" class="toggle-bar-btn ${mode === "ai" ? "is-active" : ""}" data-add-mode="ai">Importer avec l'IA</button>
          <button type="button" class="toggle-bar-btn ${mode === "manual" ? "is-active" : ""}" data-add-mode="manual">Saisie manuelle</button>
        </div>
        <div class="${mode === "ai" ? "" : "hidden"}" data-add-mode-panel="ai">
          <p class="taste-hint">Colle le texte d'une recette et/ou ajoute une photo. L'IA la met au format À table (ingrédients, étapes, nutrition estimée).</p>
          <label>Texte de la recette (facultatif si tu ajoutes une photo)
            <textarea name="recipe_text" placeholder="Colle ici le texte d'une recette, par exemple copié depuis un site." rows="6"></textarea>
          </label>
          <label>Photo (facultatif)
            <input name="recipe_photo" type="file" accept="image/*">
          </label>
        </div>
        <div class="${mode === "manual" ? "" : "hidden"}" data-add-mode-panel="manual">
          <label>Titre
            <input name="manual_title" placeholder="Ex. Curry de pois chiches">
          </label>
          <div class="row">
            <label>Portions
              <input name="manual_servings" type="number" min="1" value="2">
            </label>
            <label>Temps de cuisson (min)
              <input name="manual_cooking_minutes" type="number" min="0">
            </label>
          </div>
          <label>Ingrédients (un par ligne — quantité, unité, nom)
            <textarea name="manual_ingredients" rows="4" placeholder="200, g, pâtes&#10;1, boîte, thon"></textarea>
          </label>
          <label>Étapes (une par ligne)
            <textarea name="manual_steps" rows="4" placeholder="Faire bouillir l'eau salée.&#10;Cuire les pâtes 10 minutes."></textarea>
          </label>
          <label>Notes (facultatif)
            <textarea name="manual_notes" rows="2"></textarea>
          </label>
          <label>Tags (séparés par des virgules)
            <input name="manual_tags" placeholder="Ex. rapide, végétarien">
          </label>
          <details>
            <summary>Nutrition (facultatif)</summary>
            <div class="row">
              <label>Kcal <input name="manual_kcal" type="number" min="0"></label>
              <label>Protéines (g) <input name="manual_protein" type="number" min="0"></label>
            </div>
            <div class="row">
              <label>Glucides (g) <input name="manual_carb" type="number" min="0"></label>
              <label>Lipides (g) <input name="manual_fat" type="number" min="0"></label>
            </div>
          </details>
          <label>Prix par portion (€, facultatif)
            <input name="manual_price" type="number" min="0" step="0.1">
          </label>
        </div>
        <footer class="actions">
          <button class="cancel" type="button">Annuler</button>
          <button class="save" type="submit"><span data-import-label>${mode === "ai" ? "Importer avec l'IA" : "Ajouter"}</span></button>
        </footer>
      </form>`;
    } else if (this._modal.type === "add_temp") {
      overlay.innerHTML = `<form class="dialog" novalidate>
        <header class="dialog-top">
          <h2>Ajouter un aliment à utiliser rapidement</h2>
          <button class="close" type="button">${icon("close")}</button>
        </header>
        <label>Nom de l'aliment
          <input name="name" required autofocus placeholder="Ex. Tomates">
        </label>
        <div class="row">
          <label>Quantité
            <input name="quantity" type="number" step="0.1" placeholder="Ex. 3">
          </label>
          <label>Unité
            <input name="unit" placeholder="Ex. pièces">
          </label>
        </div>
        <label>Note (facultatif)
          <input name="note" placeholder="Ex. À utiliser rapidement">
        </label>
        <label>Date limite (facultatif)
          <input name="date_limit" type="date">
        </label>
        <footer class="actions">
          <button class="cancel" type="button">Annuler</button>
          <button class="save" type="submit">Ajouter</button>
        </footer>
      </form>`;
    } else if (this._modal.type === "edit_temp") {
      const ing = (this._data.temporary_ingredients || []).find((x) => x.id === this._modal.id);
      if (!ing) return;
      overlay.innerHTML = `<form class="dialog" novalidate>
        <header class="dialog-top">
          <h2>Modifier l'aliment</h2>
          <button class="close" type="button">${icon("close")}</button>
        </header>
        <label>Nom de l'aliment
          <input name="name" required value="${this._esc(ing.name || "")}">
        </label>
        <div class="row">
          <label>Quantité
            <input name="quantity" type="number" step="0.1" value="${this._esc(ing.quantity ?? "")}">
          </label>
          <label>Unité
            <input name="unit" value="${this._esc(ing.unit || "")}">
          </label>
        </div>
        <label>Note (facultatif)
          <input name="note" value="${this._esc(ing.note || "")}">
        </label>
        <label>Date limite (facultatif)
          <input name="date_limit" type="date" value="${this._esc((ing.date_limit || "").slice(0, 10))}">
        </label>
        <footer class="actions">
          <button class="cancel" type="button">Annuler</button>
          <button class="save" type="submit">Enregistrer</button>
        </footer>
      </form>`;
    } else if (this._modal.type === "settings") {
      overlay.innerHTML = this._settingsModalHTML();
    } else if (this._modal.type === "library") {
      overlay.innerHTML = this._libraryModalHTML();
    } else if (this._modal.type === "rate") {
      const recipe = this._data?.recipes?.[this._modal.recipe_id];
      if (!recipe) return;
      overlay.innerHTML = `<section class="dialog dialog-sm">
        <header class="dialog-top">
          <h2>Comment était ce repas ?</h2>
          <div class="dialog-top-actions">
            <button class="icon-btn fav-btn ${recipe.is_favorite ? "is-active" : ""}" type="button" data-toggle-favorite="${this._esc(recipe.id)}" aria-label="Basculer favori" title="Favori">${icon("star", recipe.is_favorite ? "is-active" : "")}</button>
            <button class="close" type="button" data-skip-rating>${icon("close")}</button>
          </div>
        </header>
        <p class="rate-title">${this._esc(recipe.title)}</p>
        <div class="rate-choice">
          <button class="rate-btn" type="button" data-rate="up" aria-label="J'ai aimé">${icon("thumbUp")}<span>J'ai aimé</span></button>
          <button class="rate-btn" type="button" data-rate="down" aria-label="Je n'ai pas aimé">${icon("thumbDown")}<span>Je n'ai pas aimé</span></button>
        </div>
        <label>Commentaire (facultatif)
          <textarea data-rate-comment placeholder="Ex. Un peu trop épicé pour les enfants"></textarea>
        </label>
        <footer class="actions">
          <button class="cancel" type="button" data-skip-rating>Passer</button>
          <button class="save" type="button" data-save-rating disabled>Enregistrer</button>
        </footer>
      </section>`;
    } else if (this._modal.type === "history") {
      overlay.innerHTML = this._historyModalHTML();
    } else if (this._modal.type === "shopping") {
      overlay.innerHTML = this._shoppingModalHTML();
    } else if (this._modal.type === "guest") {
      overlay.innerHTML = this._guestModalHTML();
    }

    this.shadowRoot.append(overlay);

    // Auto-bind plain close/cancel buttons only — any button carrying a data-* attribute
    // is assumed to have its own specific handler registered below (e.g. discard-on-close),
    // so it must not also get this generic no-op close (that would run first and clobber state).
    overlay.querySelectorAll(".close, .cancel").forEach((btn) => {
      const hasCustomAction = Array.from(btn.attributes).some((attr) => attr.name.startsWith("data-"));
      if (!hasCustomAction) {
        btn.addEventListener("click", () => this._closeModal());
      }
    });

    this._bindRefineBoxes(overlay);

    if (this._modal.type === "detail") {
      overlay.querySelector("[data-modal-cook]")?.addEventListener("click", async (event) => {
        const id = event.currentTarget.dataset.modalCook;
        this._closeModal();
        await this._cook(id);
      });
      overlay.querySelector("[data-toggle-favorite]")?.addEventListener("click", (event) => {
        this._toggleFavorite(event.currentTarget.dataset.toggleFavorite);
      });
      overlay.querySelector("[data-fetch-image]")?.addEventListener("click", async (event) => {
        const btn = event.currentTarget;
        const recipeId = btn.dataset.fetchImage;
        btn.disabled = true;
        try {
          const recipe = await this._ws({ type: "a_table/fetch_recipe_image", recipe_id: recipeId });
          this._data.recipes[recipeId] = recipe;
          this._mountModal();
        } catch (error) {
          this._toast(error?.message || "Recherche d'image impossible.", "error");
          btn.disabled = false;
        }
      });
      overlay.querySelector("[data-open-cook-mode]")?.addEventListener("click", () => {
        const card = this._data?.meal_cards?.[this._modal.id];
        const recipe = card && this._recipe(card);
        if (!recipe) return;
        this._openCookMode([recipe]);
      });
      this._bindTimers(overlay);
    } else if (this._modal.type === "cook") {
      this._bindCookModal(overlay);
    } else if (this._modal.type === "validate") {
      overlay.querySelectorAll("[data-close-draft]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const draftId = this._modal?.draft_id;
          this._closeModal();
          await this._discardDraft(draftId);
          await this._load();
        });
      });
      overlay.querySelector("[data-validate-draft]")?.addEventListener("click", async (event) => {
        const draft_id = event.currentTarget.dataset.validateDraft;
        const checks = overlay.querySelectorAll("[data-proposal-check]");
        const selected_indices = [];
        checks.forEach((c, i) => {
          if (c.checked) selected_indices.push(i);
        });
        if (!selected_indices.length) {
          this._toast("Aucune recette sélectionnée.");
          return;
        }
        try {
          this._toast("Validation en cours…");
          await this._ws({ type: "a_table/validate_draft", draft_id, selected_indices });
          this._closeModal();
          await this._load();
          this._toast(`${selected_indices.length} recette(s) ajoutée(s).`, "success");
        } catch (error) {
          this._toast(error?.message || "Validation impossible.", "error");
        }
      });
      overlay.querySelectorAll("[data-replace-proposal]").forEach((btn) => {
        btn.addEventListener("click", async (event) => {
          const index = Number(event.currentTarget.dataset.replaceProposal);
          const draftId = this._modal?.draft_id;
          const proposalEl = overlay.querySelector(`[data-proposal-index="${index}"]`);
          proposalEl?.classList.add("is-loading");
          btn.disabled = true;
          try {
            await this._ws({ type: "a_table/regenerate_proposal", draft_id: draftId, index });
            await this._load();
          } catch (error) {
            this._toast(error?.message || "Remplacement impossible.", "error");
            proposalEl?.classList.remove("is-loading");
            btn.disabled = false;
          }
        });
      });
    } else if (this._modal.type === "add") {
      overlay.querySelectorAll("[data-add-mode]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this._modal.addMode = btn.dataset.addMode;
          this._mountModal();
        });
      });

      const mode = this._modal.addMode || "ai";
      overlay.querySelector("form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const submitBtn = overlay.querySelector('button[type="submit"]');
        const label = overlay.querySelector("[data-import-label]");

        if (mode === "manual") {
          const title = String(data.get("manual_title") || "").trim();
          if (!title) {
            this._toast("Ajoute un titre.", "error");
            return;
          }
          const ingredients = String(data.get("manual_ingredients") || "")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const parts = line.split(",").map((p) => p.trim());
              return { quantity: parts[0] ? Number(parts[0]) || parts[0] : null, unit: parts[1] || "", name: parts[2] || parts[0] || "" };
            });
          const steps = String(data.get("manual_steps") || "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean);
          const tags = String(data.get("manual_tags") || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
          const nutrition = {};
          if (data.get("manual_kcal")) nutrition.kcal = Number(data.get("manual_kcal"));
          if (data.get("manual_protein")) nutrition.protein_g = Number(data.get("manual_protein"));
          if (data.get("manual_carb")) nutrition.carb_g = Number(data.get("manual_carb"));
          if (data.get("manual_fat")) nutrition.fat_g = Number(data.get("manual_fat"));

          if (submitBtn) submitBtn.disabled = true;
          try {
            await this._ws({
              type: "a_table/add_recipe",
              title,
              servings: Number(data.get("manual_servings") || 2),
              cooking_minutes: data.get("manual_cooking_minutes") ? Number(data.get("manual_cooking_minutes")) : undefined,
              tags,
              ingredients,
              steps,
              notes: String(data.get("manual_notes") || ""),
              nutrition,
              price_per_serving: data.get("manual_price") ? Number(data.get("manual_price")) : undefined,
            });
            this._closeModal();
            await this._load();
            this._toast("Recette ajoutée à À cuisiner.", "success");
          } catch (error) {
            this._toast(error?.message || "Ajout impossible.", "error");
            if (submitBtn) submitBtn.disabled = false;
          }
          return;
        }

        const text = String(data.get("recipe_text") || "").trim();
        const file = data.get("recipe_photo");
        const hasFile = file && file.size > 0;
        if (!text && !hasFile) {
          this._toast("Ajoute un texte ou une photo de recette.", "error");
          return;
        }

        if (submitBtn) submitBtn.disabled = true;

        try {
          let media_content_id = null;
          let media_content_type = null;
          if (hasFile) {
            if (label) label.textContent = "Envoi de la photo…";
            const uploadData = new FormData();
            uploadData.append("media_content_id", "media-source://media_source/local");
            uploadData.append("file", file);
            const resp = await this._hass.fetchWithAuth("/api/media_source/local_source/upload", {
              method: "POST",
              body: uploadData,
            });
            if (!resp.ok) {
              throw new Error("Envoi de la photo impossible (" + resp.status + ").");
            }
            const uploadResult = await resp.json();
            media_content_id = uploadResult.media_content_id;
            media_content_type = file.type || "image/jpeg";
          }

          if (label) label.textContent = "Analyse en cours…";
          await this._ws({
            type: "a_table/import_recipe",
            ...(text ? { text } : {}),
            ...(media_content_id ? { media_content_id, media_content_type } : {}),
          });
          this._closeModal();
          await this._load();
          this._toast("Recette importée et ajoutée à À cuisiner.", "success");
        } catch (error) {
          this._toast(error?.message || "Import impossible.", "error");
          if (submitBtn) submitBtn.disabled = false;
          if (label) label.textContent = "Importer avec l'IA";
        }
      });
    } else if (this._modal.type === "add_temp") {
      overlay.querySelector("form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const name = String(data.get("name") || "").trim();
        if (!name) return;
        const ingredient = {
          name,
          quantity: data.get("quantity") ? Number(data.get("quantity")) : null,
          unit: String(data.get("unit") || ""),
          note: String(data.get("note") || ""),
          date_limit: String(data.get("date_limit") || ""),
        };
        try {
          await this._ws({ type: "a_table/add_temporary_ingredient", ingredient });
          this._closeModal();
          await this._load();
        } catch (error) {
          this._toast(error?.message || "Ajout impossible.", "error");
        }
      });
    } else if (this._modal.type === "edit_temp") {
      overlay.querySelector("form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const updates = {
          name: String(data.get("name") || "").trim(),
          quantity: data.get("quantity") ? Number(data.get("quantity")) : null,
          unit: String(data.get("unit") || ""),
          note: String(data.get("note") || ""),
          date_limit: String(data.get("date_limit") || ""),
        };
        try {
          await this._ws({ type: "a_table/update_temporary_ingredient", ingredient_id: this._modal.id, updates });
          this._closeModal();
          await this._load();
        } catch (error) {
          this._toast(error?.message || "Modification impossible.", "error");
        }
      });
    } else if (this._modal.type === "settings") {
      this._bindSettingsModal(overlay);
    } else if (this._modal.type === "library") {
      this._bindLibraryModal(overlay);
    } else if (this._modal.type === "rate") {
      this._bindRateModal(overlay);
    } else if (this._modal.type === "history") {
      this._bindHistoryModal(overlay);
    } else if (this._modal.type === "shopping") {
      this._bindShoppingModal(overlay);
    } else if (this._modal.type === "guest") {
      this._bindGuestModal(overlay);
    }
  }

  // ---- Rating modal -------------------------------------------------------

  _bindRateModal(overlay) {
    let liked = null;
    overlay.querySelector("[data-toggle-favorite]")?.addEventListener("click", async (event) => {
      const btn = event.currentTarget;
      const recipeId = btn.dataset.toggleFavorite;
      try {
        const recipe = await this._ws({ type: "a_table/toggle_favorite", recipe_id: recipeId });
        if (this._data?.recipes?.[recipeId]) this._data.recipes[recipeId] = recipe;
        btn.classList.toggle("is-active", recipe.is_favorite);
        btn.querySelector("svg")?.classList.toggle("is-active", recipe.is_favorite);
      } catch (error) {
        this._toast(error?.message || "Impossible de mettre à jour le favori.", "error");
      }
    });
    const saveBtn = overlay.querySelector("[data-save-rating]");
    overlay.querySelectorAll("[data-rate]").forEach((btn) => {
      btn.addEventListener("click", () => {
        liked = btn.dataset.rate === "up";
        overlay.querySelectorAll("[data-rate]").forEach((b) => b.classList.toggle("is-active", b === btn));
        if (saveBtn) saveBtn.disabled = false;
      });
    });
    overlay.querySelectorAll("[data-skip-rating]").forEach((btn) => {
      btn.addEventListener("click", () => this._closeModal());
    });
    saveBtn?.addEventListener("click", async () => {
      if (liked === null) return;
      const comment = overlay.querySelector("[data-rate-comment]")?.value.trim() || "";
      try {
        await this._ws({ type: "a_table/rate_recipe", recipe_id: this._modal.recipe_id, liked, comment });
        this._closeModal();
        await this._load();
        this._toast("Merci pour ton retour !", "success");
      } catch (error) {
        this._toast(error?.message || "Impossible d'enregistrer ce retour.", "error");
      }
    });
  }

  // ---- Library modal (Mes recettes) ---------------------------------------

  _libraryEligibleRecipes() {
    return Object.values(this._data?.recipes || {}).filter(
      (r) => !r.is_archived && (r.is_favorite || r.source?.kind === "personal_manual")
    );
  }

  _libraryRecipes() {
    const state = this._modal;
    const all = this._libraryEligibleRecipes();
    const search = (state.search || "").trim().toLowerCase();
    return all
      .filter((r) => !search || (r.title || "").toLowerCase().includes(search))
      .filter((r) => !state.tag || (r.tags || []).includes(state.tag))
      .filter((r) => !state.onlyFavorites || r.is_favorite)
      .sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  }

  _libraryTagCounts() {
    const counts = new Map();
    this._libraryEligibleRecipes().forEach((r) => {
      (r.tags || []).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    return counts;
  }

  _libraryModalHTML() {
    const state = this._modal;
    const tagCounts = this._libraryTagCounts();
    const sortedTags = Array.from(tagCounts.keys()).sort((a, b) => (tagCounts.get(b) - tagCounts.get(a)) || a.localeCompare(b));
    const QUICK_TAG_CAP = 3;
    const quickTags = sortedTags.slice(0, QUICK_TAG_CAP);
    const results = this._libraryRecipes();

    const tagChip = (tag) => `<button type="button" class="chip filter-chip ${state.tag === tag ? "is-active" : ""}" data-library-tag="${this._esc(tag)}">${this._esc(tag)}</button>`;

    return `<section class="dialog dialog-lg">
      <header class="dialog-top">
        <h2>Mes recettes</h2>
        <button class="close" type="button">${icon("close")}</button>
      </header>
      <div class="library-search">
        ${icon("search")}
        <input type="search" data-library-search placeholder="Rechercher par titre" value="${this._esc(state.search || "")}">
      </div>
      <div class="chip-group library-tags">
        <button type="button" class="chip filter-chip ${!state.tag ? "is-active" : ""}" data-library-tag="">Tous</button>
        <button type="button" class="chip filter-chip ${state.onlyFavorites ? "is-active" : ""}" data-library-fav>${icon("star", state.onlyFavorites ? "is-active" : "")} Favoris</button>
        ${quickTags.map(tagChip).join("")}
        ${sortedTags.length ? `<span class="library-filters-anchor">
          <button type="button" class="chip filter-chip ${state.filtersOpen ? "is-active" : ""}" data-library-filters-open>${icon("filter")} Filtres${state.tag && !quickTags.includes(state.tag) ? " · 1" : ""}</button>
          ${state.filtersOpen ? `<div class="library-filters-panel" data-library-filters-panel>
            <div class="chip-group">
              ${sortedTags.map(tagChip).join("")}
            </div>
          </div>` : ""}
        </span>` : ""}
      </div>
      <div class="library-results" data-library-results>
        ${this._libraryResultsHTML(results)}
      </div>
      <footer class="actions">
        <button class="cancel" type="button">Fermer</button>
      </footer>
    </section>`;
  }

  _libraryResultsHTML(results) {
    if (!results.length) return this._emptyStateHTML("search", "Aucune recette ne correspond à ce filtre.");
    return `<div class="library-list">${results
      .map((r) => {
        const cooking = Number.isInteger(r.cooking_minutes) ? `${r.cooking_minutes} min` : "Cuisson à préciser";
        const tags = (r.tags || []).slice(0, 3);
        return `<article class="library-item">
          <div class="library-item-main">
            <strong>${r.is_favorite ? icon("star", "is-active") : ""}${this._esc(r.title)}</strong>
            <span class="meta">${this._esc(cooking)} · cuisinée ${this._esc(r.times_cooked || 0)} fois${tags.length ? " · " + tags.map((t) => this._esc(t)).join(", ") : ""}</span>
          </div>
          <div class="library-item-actions">
            <button class="icon-btn" type="button" data-library-detail="${this._esc(r.id)}" aria-label="Détails" title="Détails">${icon("eye")}</button>
            <button class="icon-btn" type="button" data-library-add="${this._esc(r.id)}" aria-label="Ajouter au backlog" title="Ajouter à À cuisiner">${icon("plus")}</button>
            <button class="icon-btn" type="button" data-library-archive="${this._esc(r.id)}" aria-label="Supprimer de mes recettes" title="Supprimer">${icon("trash")}</button>
          </div>
        </article>`;
      })
      .join("")}</div>`;
  }

  _bindLibraryModal(overlay) {
    const refreshResults = () => {
      const container = overlay.querySelector("[data-library-results]");
      if (container) container.innerHTML = this._libraryResultsHTML(this._libraryRecipes());
      bindResultActions();
    };

    const bindResultActions = () => {
      overlay.querySelectorAll("[data-library-detail]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const recipeId = btn.dataset.libraryDetail;
          const card = Object.values(this._data.meal_cards || {}).find((c) => c.recipe_id === recipeId);
          if (card) {
            this._openDetail(card.id);
          } else {
            this._toast("Ouvre les détails depuis À cuisiner ou la semaine une fois la recette ajoutée.");
          }
        });
      });
      overlay.querySelectorAll("[data-library-add]").forEach((btn) => {
        btn.addEventListener("click", () => this._addRecipeToBacklog(btn.dataset.libraryAdd));
      });
      overlay.querySelectorAll("[data-library-archive]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const recipeId = btn.dataset.libraryArchive;
          if (!confirm("Supprimer cette recette de « Mes recettes » ?")) return;
          try {
            await this._ws({ type: "a_table/archive_recipe", recipe_id: recipeId });
            await this._load();
            refreshResults();
            this._toast("Recette supprimée.", "success", async () => {
              await this._ws({ type: "a_table/unarchive_recipe", recipe_id: recipeId });
              await this._load();
              refreshResults();
              this._toast("Recette restaurée.", "success");
            });
          } catch (error) {
            this._toast(error?.message || "Suppression impossible.", "error");
          }
        });
      });
    };

    overlay.querySelector("[data-library-search]")?.addEventListener("input", (event) => {
      this._modal.search = event.currentTarget.value;
      const container = overlay.querySelector("[data-library-results]");
      if (container) container.innerHTML = this._skeletonHTML(4, 64);
      clearTimeout(this._librarySearchDebounce);
      this._librarySearchDebounce = setTimeout(refreshResults, 150);
    });
    overlay.querySelectorAll("[data-library-tag]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this._modal.tag = btn.dataset.libraryTag || null;
        this._mountModal();
      });
    });
    overlay.querySelector("[data-library-fav]")?.addEventListener("click", () => {
      this._modal.onlyFavorites = !this._modal.onlyFavorites;
      this._mountModal();
    });
    overlay.querySelector("[data-library-filters-open]")?.addEventListener("click", (event) => {
      event.stopPropagation();
      this._modal.filtersOpen = !this._modal.filtersOpen;
      this._mountModal();
    });
    if (this._modal.filtersOpen) {
      const onOutsideClick = (event) => {
        const anchor = overlay.querySelector(".library-filters-anchor");
        if (anchor && !anchor.contains(event.target)) {
          this._modal.filtersOpen = false;
          this._mountModal();
        }
      };
      // Différé pour ne pas capter le clic qui vient d'ouvrir le panneau.
      setTimeout(() => overlay.addEventListener("click", onOutsideClick, { once: true, capture: true }), 0);
    }

    bindResultActions();
  }

  // ---- History modal --------------------------------------------------

  _historyEntries(days) {
    const history = this._data?.history || [];
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return history
      .filter((h) => new Date(h.cooked_at || 0).getTime() >= cutoff)
      .sort((a, b) => new Date(b.cooked_at || 0) - new Date(a.cooked_at || 0));
  }

  _historyModalHTML() {
    const days = this._modal.days ?? 20;
    const entries = this._historyEntries(days);
    return `<section class="dialog">
      <header class="dialog-top">
        <h2>Historique</h2>
        <button class="close" type="button">${icon("close")}</button>
      </header>
      <label>Historique affiché
        <input type="range" min="5" max="30" value="${days}" data-history-range style="width:100%">
        <div data-history-range-display style="text-align:right;font-size:12px;color:var(--secondary-text-color,#aeb7c5)">${days} derniers jours</div>
      </label>
      <div class="history-list" data-history-list>
        ${this._historyListHTML(entries)}
      </div>
      <footer class="actions">
        <button class="cancel" type="button">Fermer</button>
      </footer>
    </section>`;
  }

  _historyListHTML(entries) {
    if (!entries.length) return this._emptyStateHTML("history", "Aucun repas cuisiné sur cette période.");
    return `<div class="history-items">${entries
      .map((h) => {
        const recipe = this._data?.recipes?.[h.recipe_id] || {};
        const date = h.cooked_at ? new Date(h.cooked_at).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "–";
        const ratings = recipe.ratings || [];
        const closest = ratings.length ? ratings[ratings.length - 1] : null;
        const ratingIcon = closest ? icon(closest.liked ? "thumbUp" : "thumbDown", "history-rating-icon") : "";
        return `<div class="history-item">
          <span class="history-date">${date}</span>
          <span class="history-title">${this._esc(recipe.title || "Recette inconnue")}</span>
          <span class="history-meta">${this._esc(h.servings || recipe.servings || 2)} pers. ${ratingIcon}</span>
          <button class="icon-btn history-delete" type="button" data-history-delete="${this._esc(h.id)}" aria-label="Supprimer cette entrée" title="Supprimer">${icon("trash")}</button>
        </div>`;
      })
      .join("")}</div>`;
  }

  _bindHistoryModal(overlay) {
    const range = overlay.querySelector("[data-history-range]");
    const display = overlay.querySelector("[data-history-range-display]");
    const list = overlay.querySelector("[data-history-list]");
    const bindDeletes = () => {
      overlay.querySelectorAll("[data-history-delete]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const entryId = btn.dataset.historyDelete;
          const entry = (this._data?.history || []).find((h) => h.id === entryId);
          if (!entry) return;
          try {
            await this._ws({ type: "a_table/remove_history_entry", history_id: entryId });
            await this._load();
            if (list) list.innerHTML = this._historyListHTML(this._historyEntries(this._modal.days ?? 20));
            bindDeletes();
            this._toast("Entrée supprimée.", "success", async () => {
              await this._ws({ type: "a_table/restore_history_entry", entry });
              await this._load();
              if (list) list.innerHTML = this._historyListHTML(this._historyEntries(this._modal.days ?? 20));
              bindDeletes();
              this._toast("Entrée restaurée.", "success");
            });
          } catch (error) {
            this._toast(error?.message || "Suppression impossible.", "error");
          }
        });
      });
    };
    bindDeletes();
    range?.addEventListener("input", () => {
      const days = Number(range.value);
      this._modal.days = days;
      if (display) display.textContent = `${days} derniers jours`;
      if (list) list.innerHTML = this._historyListHTML(this._historyEntries(days));
      bindDeletes();
    });
  }

  // ---- Shopping list modal -------------------------------------------

  _shoppingRecipeIds() {
    const exported = new Set(this._data?.shopping_list_exported_recipe_ids || []);
    return this._activeMealCards()
      .map((card) => card.recipe_id)
      .filter((recipeId) => recipeId && this._data?.recipes?.[recipeId] && !exported.has(recipeId));
  }

  _scaleFactor(recipe, servings) {
    const appetite = this._data?.preferences?.appetite || "normal";
    const multiplier = APPETITE_MULTIPLIERS[appetite] ?? 1;
    const baseServings = recipe?.servings || servings || 1;
    const targetServings = servings || baseServings;
    return (targetServings / baseServings) * multiplier;
  }

  _scaledIngredients(recipe, servings) {
    const factor = this._scaleFactor(recipe, servings);
    return (recipe.ingredients || []).map((ing) => {
      const quantity = Number(ing.quantity);
      return {
        ...ing,
        quantity: Number.isFinite(quantity) ? quantity * factor : ing.quantity,
      };
    });
  }

  _mergeIngredientsIntoShoppingMap(byKey, ingredients) {
    (ingredients || []).forEach((ing) => {
      const name = String(ing.name || "").trim();
      if (!name) return;
      const unit = String(ing.unit || "").trim();
      const key = `${name.toLowerCase()}|${unit.toLowerCase()}`;
      const quantity = Number(ing.quantity);
      if (!byKey.has(key)) {
        byKey.set(key, { key, name, unit, quantity: Number.isFinite(quantity) ? quantity : null, uncertain: !Number.isFinite(quantity), category: categorizeIngredient(name) });
      } else {
        const entry = byKey.get(key);
        if (Number.isFinite(quantity) && !entry.uncertain) {
          entry.quantity += quantity;
        } else {
          entry.uncertain = true;
        }
      }
    });
  }

  _shoppingItems() {
    const exported = new Set(this._data?.shopping_list_exported_recipe_ids || []);
    const cards = this._activeMealCards().filter(
      (card) => card.recipe_id && this._data?.recipes?.[card.recipe_id] && !exported.has(card.recipe_id)
    );
    const byKey = new Map();

    cards.forEach((card) => {
      const recipe = this._data?.recipes?.[card.recipe_id];
      if (!recipe) return;
      const scaled = this._scaledIngredients(recipe, card.servings || recipe.servings);
      this._mergeIngredientsIntoShoppingMap(byKey, scaled);
    });

    Object.values(this._data?.guest_menus || {}).forEach((menu) => {
      Object.values(menu.courses || {}).forEach((course) => {
        if (Array.isArray(course.items)) {
          course.items.forEach((item) => this._mergeIngredientsIntoShoppingMap(byKey, item.ingredients));
        } else {
          this._mergeIngredientsIntoShoppingMap(byKey, course.ingredients);
        }
      });
    });

    return Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  _shoppingItemHTML(item, isChecked) {
    const qty = item.uncertain || item.quantity == null ? "quantité à ajuster" : `${item.quantity} ${item.unit}`.trim();
    return `<label class="shopping-item ${isChecked ? "is-checked" : ""}">
      <input type="checkbox" data-shopping-toggle="${this._esc(item.key)}" ${isChecked ? "checked" : ""}>
      <span class="shopping-item-name">${this._esc(item.name)}</span>
      <span class="shopping-item-qty">${this._esc(qty)}</span>
    </label>`;
  }

  _shoppingModalHTML() {
    const items = this._shoppingItems();
    const checked = this._data?.shopping_list_checked || {};
    const activeItems = items.filter((item) => !checked[item.key]);
    const stockedItems = items.filter((item) => checked[item.key]);
    const byCategory = new Map();
    activeItems.forEach((item) => {
      if (!byCategory.has(item.category)) byCategory.set(item.category, []);
      byCategory.get(item.category).push(item);
    });
    const order = [...SHOPPING_CATEGORIES.map((c) => c.key), "other"];
    const labels = Object.fromEntries([...SHOPPING_CATEGORIES.map((c) => [c.key, c.label]), ["other", "Autres"]]);

    const activeBody = activeItems.length
      ? order
          .filter((key) => byCategory.has(key))
          .map((key) => `<div class="shopping-category">
            <h4>${labels[key]}</h4>
            <div class="shopping-items">
              ${byCategory.get(key).map((item) => this._shoppingItemHTML(item, false)).join("")}
            </div>
          </div>`)
          .join("")
      : "";

    const stockedBody = stockedItems.length
      ? `<details class="shopping-stocked">
          <summary>En stock (${stockedItems.length})</summary>
          <div class="shopping-items">
            ${stockedItems.map((item) => this._shoppingItemHTML(item, true)).join("")}
          </div>
        </details>`
      : "";

    const body = items.length
      ? `${activeBody}${stockedBody}`
      : this._emptyStateHTML("basket", "Rien à acheter : planifie ou ajoute des repas à cuisiner.");

    const todoEntityId = this._data?.preferences?.todo_entity_id;
    const transferHint = todoEntityId
      ? ""
      : `<p class="taste-hint">Configure une liste de tâches dans Paramètres → Intégrations pour activer le transfert.</p>`;

    return `<section class="dialog">
      <header class="dialog-top">
        <h2>Liste de courses</h2>
        <button class="close" type="button">${icon("close")}</button>
      </header>
      <p class="taste-hint">Coche un article si tu l'as déjà en stock : il ne sera pas transféré vers la liste de tâches.</p>
      <div class="shopping-list" data-shopping-list>${body}</div>
      ${transferHint}
      <footer class="actions">
        ${items.length ? `<button class="cancel" type="button" data-clear-shopping>Recommencer la liste</button>` : ""}
        <button class="save" type="button" data-transfer-shopping ${todoEntityId && items.length ? "" : "disabled"}>${icon("basket")}Transférer vers la liste de tâches</button>
        <button class="cancel" type="button" data-close-shopping>Fermer</button>
      </footer>
    </section>`;
  }

  async _transferShoppingList(overlay) {
    const todoEntityId = this._data?.preferences?.todo_entity_id;
    if (!todoEntityId) return;

    const checked = this._data?.shopping_list_checked || {};
    const items = this._shoppingItems().filter((item) => !checked[item.key]);
    if (!items.length) {
      this._toast("Aucun article à transférer (tout est déjà en stock).");
      return;
    }

    const btn = overlay.querySelector("[data-transfer-shopping]");
    if (btn) btn.disabled = true;

    try {
      for (const item of items) {
        const qty = item.uncertain || item.quantity == null ? "" : `${item.quantity} ${item.unit}`.trim();
        const label = [qty, item.name].filter(Boolean).join(" ").trim();
        await this._hass.callService("todo", "add_item", { entity_id: todoEntityId, item: label });
      }
      await this._ws({ type: "a_table/export_shopping_list", recipe_ids: this._shoppingRecipeIds() });
      await this._load();
      this._toast(`${items.length} article(s) transféré(s).`, "success");
    } catch (error) {
      this._toast(error?.message || "Transfert impossible.", "error");
      if (btn) btn.disabled = false;
    }
  }

  _bindShoppingModal(overlay) {
    overlay.querySelector("[data-transfer-shopping]")?.addEventListener("click", () => this._transferShoppingList(overlay));
    overlay.querySelectorAll("[data-shopping-toggle]").forEach((input) => {
      input.addEventListener("change", async (event) => {
        const key = event.currentTarget.dataset.shoppingToggle;
        const label = event.currentTarget.closest(".shopping-item");
        label?.classList.toggle("is-checked", event.currentTarget.checked);
        this._data.shopping_list_checked = this._data.shopping_list_checked || {};
        this._data.shopping_list_checked[key] = event.currentTarget.checked;
        try {
          await this._ws({ type: "a_table/toggle_shopping_item", key });
        } catch (error) {
          this._toast(error?.message || "Impossible d'enregistrer cette case.", "error");
        }
      });
    });
    overlay.querySelector("[data-clear-shopping]")?.addEventListener("click", async () => {
      if (!confirm("Recommencer la liste : décocher les articles \"déjà en stock\" et faire réapparaître les recettes déjà transférées ?")) return;
      try {
        await this._ws({ type: "a_table/clear_shopping_checked" });
        this._data.shopping_list_checked = {};
        this._mountModal();
      } catch (error) {
        this._toast(error?.message || "Impossible de vider la liste.", "error");
      }
    });
    overlay.querySelector("[data-close-shopping]")?.addEventListener("click", () => this._closeModal());
  }

  // ---- Module Invité -------------------------------------------------------

  _nutritionGridHTML(nutrition) {
    const n = nutrition || {};
    if (n.kcal == null && n.protein_g == null && n.carb_g == null && n.fat_g == null && n.fiber_g == null) return "";
    return `<div class="proposal-nutrition">
      <div class="nutrition-item"><b>${this._esc(n.kcal ?? "–")}</b><span>kcal</span></div>
      <div class="nutrition-item"><b>${this._esc(n.protein_g ?? "–")}</b><span>protéines</span></div>
      <div class="nutrition-item"><b>${this._esc(n.carb_g ?? "–")}</b><span>glucides</span></div>
      <div class="nutrition-item"><b>${this._esc(n.fat_g ?? "–")}</b><span>lipides</span></div>
      <div class="nutrition-item"><b>${this._esc(n.fiber_g ?? "–")}</b><span>fibres</span></div>
    </div>`;
  }

  _stepsWithTimersHTML(steps, stepLabels) {
    if (!steps?.length) return "";
    const labelsMatch = Array.isArray(stepLabels) && stepLabels.length === steps.length;
    return `<ol>${steps
      .map((s, i) => {
        const minutes = this._stepTimerMinutes(s);
        const label = labelsMatch && stepLabels[i] ? stepLabels[i] : this._stepShortLabel(s);
        const timerBtn = minutes
          ? `<button class="step-timer-btn" type="button" data-start-step-timer="${minutes}" data-step-label="${this._esc(label)}">⏱ Lancer (${minutes} min)</button>`
          : "";
        return `<li>${this._esc(s)}${timerBtn}</li>`;
      })
      .join("")}</ol>`;
  }

  _guestPhotoBlockHTML(item) {
    const hasPhoto = item?.image_status === "found" && item?.image_url;
    if (hasPhoto) {
      return `<div class="recipe-image guest-course-image at-img-wrap"><img src="${this._esc(item.image_url)}" alt="${this._esc(item.title || "")}" loading="lazy" onload="this.closest('.at-img-wrap').classList.add('loaded')"></div>`;
    }
    const pal = categoryPalette(item?.tags);
    return `<div class="recipe-image guest-course-image guest-course-image-fallback" style="background:linear-gradient(150deg,${pal.from},${pal.to})">${icon(categoryIcon(item?.tags))}</div>`;
  }

  _guestCourseCardHTML(key, label, course) {
    if (!course || !course.title) return "";
    const isComposed = Array.isArray(course.items);
    let body;
    if (isComposed) {
      body = course.items
        .map((item, idx) => {
          const ingredients = (item.ingredients || [])
            .map((ing) => `${ing.quantity || ""} ${ing.unit || ""} ${ing.name || ""}`)
            .join(", ");
          return `<div class="guest-item">
            <div class="guest-item-head">
              <strong>${this._esc(item.title || "")}</strong>
              <button class="icon-btn proposal-replace" type="button" data-regenerate-item="${key}:${idx}" aria-label="Remplacer cette variante" title="Remplacer cette variante">${icon("refresh")}</button>
            </div>
            ${this._guestPhotoBlockHTML(item)}
            <span>${this._esc(ingredients || "Aucun ingrédient")}</span>
            ${this._stepsWithTimersHTML(item.steps, item.step_labels)}
            ${this._nutritionGridHTML(item.nutrition)}
            <details class="refine-details">
              <summary>Ajuster cette variante</summary>
              ${this._renderRefineBox("guest_course", `${key}:${idx}`)}
            </details>
          </div>`;
        })
        .join("");
    } else {
      const ingredients = (course.ingredients || [])
        .map((ing) => `${ing.quantity || ""} ${ing.unit || ""} ${ing.name || ""}`)
        .join(", ");
      body = `${this._guestPhotoBlockHTML(course)}
      <div class="proposal-section">
        <strong>Ingrédients</strong>
        <span>${this._esc(ingredients || "Aucun")}</span>
      </div>
      ${course.steps?.length ? `<div class="proposal-section"><strong>Étapes</strong>${this._stepsWithTimersHTML(course.steps, course.step_labels)}</div>` : ""}
      ${this._nutritionGridHTML(course.nutrition) ? `<div class="proposal-section"><strong>Nutrition</strong>${this._nutritionGridHTML(course.nutrition)}</div>` : ""}`;
    }
    return `<div class="proposal guest-course-card" data-guest-course="${key}">
      <div class="proposal-head">
        <strong class="proposal-title">${label} — ${this._esc(course.title)}</strong>
        <button class="icon-btn proposal-replace" type="button" data-regenerate-course="${key}" aria-label="${isComposed ? "Remplacer tout l'assortiment" : "Remplacer ce plat"}" title="${isComposed ? "Remplacer tout l'assortiment" : "Remplacer ce plat"}">${icon("refresh")}</button>
      </div>
      ${body}
      ${course.notes ? `<div class="proposal-section"><strong>Notes</strong><span>${this._esc(course.notes)}</span></div>` : ""}
      <details class="refine-details">
        <summary>${isComposed ? "Ajuster tout l'assortiment" : "Ajuster avec l'IA"}</summary>
        ${this._renderRefineBox("guest_course", key)}
      </details>
    </div>`;
  }

  _guestModalHTML() {
    const menus = Object.values(this._data?.guest_menus || {});
    const menu = this._modal.menu_id ? this._data?.guest_menus?.[this._modal.menu_id] : menus[menus.length - 1];

    if (!menu) {
      const selected = this._modal.courseKeys || ATABLE_GUEST_COURSES.map(([key]) => key);
      const composed = this._modal.composedKeys || [];
      const counts = this._modal.composedCounts || {};
      const courseChoices = ATABLE_GUEST_COURSES.map(
        ([key, label]) => `
        <div class="guest-course-row">
          <label class="toggle-chip">
            <input type="checkbox" name="course_keys" value="${key}" data-guest-course-toggle ${selected.includes(key) ? "checked" : ""}>
            <span>${label}</span>
          </label>
          <label class="toggle-chip toggle-chip-sm">
            <input type="checkbox" name="composed_keys" value="${key}" data-composed-toggle ${composed.includes(key) ? "checked" : ""} ${selected.includes(key) ? "" : "disabled"}>
            <span>Assortiment</span>
          </label>
          <div class="composed-stepper" data-composed-stepper="${key}" ${composed.includes(key) ? "" : "hidden"}>
            <button type="button" class="stepper-btn" data-composed-minus="${key}" aria-label="Moins de variantes">−</button>
            <input type="hidden" name="composed_count_${key}" value="${counts[key] || 3}">
            <output class="stepper-output" data-composed-output="${key}">${counts[key] || 3}</output>
            <button type="button" class="stepper-btn" data-composed-plus="${key}" aria-label="Plus de variantes">+</button>
          </div>
        </div>`
      ).join("");
      return `<section class="dialog">
        <header class="dialog-top">
          <h2>Repas spécial</h2>
          <button class="close" type="button">${icon("close")}</button>
        </header>
        <div data-guest-form>
          <p class="taste-hint">Compose un repas complet avec des suggestions d'accord mets-vins, via l'IA. Choisis les services souhaités ; coche "Assortiment" pour un service qui propose plusieurs variantes (ex. plusieurs sortes de sushis).</p>
          <div class="toggle-group guest-course-picker">${courseChoices}</div>
          <label>Nombre d'invités
            <input name="guests" type="number" min="1" max="30" value="${this._modal.guests || 6}">
          </label>
          <label>Occasion, contraintes (facultatif)
            <textarea name="notes" rows="3" placeholder="Ex. Anniversaire, un invité sans gluten…">${this._esc(this._modal.notes || "")}</textarea>
          </label>
          <footer class="actions">
            <button class="cancel" type="button">Annuler</button>
            <button class="save" type="button" data-generate-guest><span data-generate-guest-label>Générer le menu</span></button>
          </footer>
        </div>
        <div data-guest-generating-slot></div>
      </section>`;
    }

    this._modal.menu_id = menu.id;
    const menuCourseKeys = menu.course_keys || ATABLE_GUEST_COURSES.map(([key]) => key);
    const courseCards = ATABLE_GUEST_COURSES.filter(([key]) => menuCourseKeys.includes(key))
      .map(([key, label]) => this._guestCourseCardHTML(key, label, menu.courses?.[key]))
      .join("");
    const groceryStore = this._data?.preferences?.grocery_store || "";
    const wineCards = (menu.wine_pairings || [])
      .map((p) => {
        const searchLabel = groceryStore ? `Chercher chez ${this._esc(groceryStore)}` : "Chercher en magasin";
        const producers = (p.producers || []).filter(Boolean);
        return `<div class="wine-pairing">
          <strong>${this._esc(p.style || "")}</strong>
          <span>${this._esc(p.description || "")}</span>
          ${producers.length ? `<span class="wine-producers">Ex. ${this._esc(producers.join(", "))}</span>` : ""}
          <a href="${wineSearchUrl(p.style, producers, groceryStore)}" target="_blank" rel="noopener" class="wine-search-link">${searchLabel} ↗</a>
        </div>`;
      })
      .join("");

    return `<section class="dialog">
      <header class="dialog-top">
        <h2>Repas spécial — ${this._esc(menu.guests)} convives</h2>
        <button class="close" type="button">${icon("close")}</button>
      </header>
      ${this._stickyTimersBarHTML()}
      <div class="facts">
        ${courseCards}
        <div class="proposal-section">
          <h3>Accords mets-vins</h3>
          <button class="icon-btn" type="button" data-regenerate-wine aria-label="Régénérer les suggestions" title="Régénérer les suggestions">${icon("refresh")}</button>
          ${wineCards || "<span>Aucune suggestion.</span>"}
        </div>
      </div>
      <div class="refine-section">
        <h3>Chronos</h3>
        <div class="row timer-add-row">
          <input type="text" placeholder="Nom (facultatif)" data-timer-name>
          <input type="number" min="1" placeholder="Min." data-timer-minutes style="max-width:80px">
          <button class="cancel" type="button" data-add-timer>+ Chrono</button>
        </div>
      </div>
      <footer class="actions">
        <button class="cancel" type="button" data-dismiss-guest>Supprimer ce menu</button>
        <button class="cancel" type="button" data-open-cook-mode-guest>${icon("play")} Mode recette</button>
        <button class="save" type="button" data-close-guest>Fermer</button>
      </footer>
    </section>`;
  }

  _guestMenuAsCookRecipes(menu) {
    const keys = menu.course_keys || ATABLE_GUEST_COURSES.map(([key]) => key);
    const recipes = [];
    keys.forEach((key) => {
      const course = menu.courses?.[key];
      if (!course) return;
      if (Array.isArray(course.items)) {
        course.items.forEach((item) => {
          if (item?.title) {
            recipes.push({
              title: item.title,
              steps: item.steps || [],
              step_labels: item.step_labels || [],
              ingredients: item.ingredients || [],
              servings: menu.guests || null,
            });
          }
        });
      } else if (course.title) {
        recipes.push({
          title: course.title,
          steps: course.steps || [],
          step_labels: course.step_labels || [],
          ingredients: course.ingredients || [],
          servings: menu.guests || null,
        });
      }
    });
    return recipes;
  }

  _bindGuestModal(overlay) {
    overlay.querySelector("[data-close-guest]")?.addEventListener("click", () => this._closeModal());
    overlay.querySelector("[data-open-cook-mode-guest]")?.addEventListener("click", () => {
      const menu = this._data?.guest_menus?.[this._modal.menu_id];
      if (!menu) return;
      const recipes = this._guestMenuAsCookRecipes(menu);
      if (!recipes.length) {
        this._toast("Aucune étape à cuisiner dans ce menu.", "error");
        return;
      }
      this._openCookMode(recipes);
    });
    if (this._modal.menu_id) this._bindTimers(overlay);
    overlay.querySelectorAll('[name="course_keys"]').forEach((cb) => {
      cb.addEventListener("change", () => {
        const composedCb = overlay.querySelector(`[name="composed_keys"][value="${cb.value}"]`);
        const stepper = overlay.querySelector(`[data-composed-stepper="${cb.value}"]`);
        if (composedCb) {
          composedCb.disabled = !cb.checked;
          if (!cb.checked) composedCb.checked = false;
        }
        if (stepper) stepper.hidden = !cb.checked || !composedCb?.checked;
      });
    });
    overlay.querySelectorAll("[data-composed-toggle]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const stepper = overlay.querySelector(`[data-composed-stepper="${cb.value}"]`);
        if (stepper) stepper.hidden = !cb.checked;
      });
    });
    overlay.querySelectorAll("[data-composed-minus],[data-composed-plus]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.composedMinus || btn.dataset.composedPlus;
        const input = overlay.querySelector(`[name="composed_count_${key}"]`);
        const output = overlay.querySelector(`[data-composed-output="${key}"]`);
        if (!input) return;
        const delta = btn.dataset.composedPlus ? 1 : -1;
        const next = Math.max(2, Math.min(6, Number(input.value || 3) + delta));
        input.value = next;
        if (output) output.textContent = next;
      });
    });
    overlay.querySelector("[data-generate-guest]")?.addEventListener("click", async (event) => {
      const btn = event.currentTarget;
      const guests = Number(overlay.querySelector('[name="guests"]')?.value || 6);
      const notes = overlay.querySelector('[name="notes"]')?.value.trim() || "";
      const course_keys = [...overlay.querySelectorAll('[name="course_keys"]:checked')].map((cb) => cb.value);
      const composed_keys = [...overlay.querySelectorAll('[name="composed_keys"]:checked')].map((cb) => cb.value);
      const composed_counts = {};
      composed_keys.forEach((key) => {
        const countInput = overlay.querySelector(`[name="composed_count_${key}"]`);
        composed_counts[key] = Number(countInput?.value) || 3;
      });
      if (!course_keys.length) {
        this._toast("Choisis au moins un service.", "error");
        return;
      }
      this._modal.courseKeys = course_keys;
      this._modal.composedKeys = composed_keys;
      this._modal.composedCounts = composed_counts;
      const label = overlay.querySelector("[data-generate-guest-label]");
      btn.disabled = true;
      if (label) label.textContent = "Génération en cours…";
      const form = overlay.querySelector("[data-guest-form]");
      const slot = overlay.querySelector("[data-guest-generating-slot]");
      if (form) {
        form.hidden = true;
        form.querySelectorAll("input, textarea, button").forEach((el) => { el.disabled = true; });
      }
      if (slot) slot.innerHTML = this._skeletonHTML(3, 90);
      try {
        const menu = await this._ws({ type: "a_table/generate_guest_menu", guests, notes, course_keys, composed_keys, composed_counts });
        this._data.guest_menus = this._data.guest_menus || {};
        this._data.guest_menus[menu.id] = menu;
        this._modal.menu_id = menu.id;
        this._mountModal();
      } catch (error) {
        this._toast(error?.message || "Génération impossible.", "error");
        if (slot) slot.innerHTML = "";
        if (form) {
          form.hidden = false;
          form.querySelectorAll("input, textarea, button").forEach((el) => { el.disabled = false; });
        }
        btn.disabled = false;
        if (label) label.textContent = "Générer le menu";
      }
    });

    overlay.querySelectorAll("[data-regenerate-course]").forEach((btn) => {
      btn.addEventListener("click", async (event) => {
        const courseKey = event.currentTarget.dataset.regenerateCourse;
        const card = overlay.querySelector(`[data-guest-course="${courseKey}"]`);
        card?.classList.add("is-loading");
        try {
          const menu = await this._ws({ type: "a_table/regenerate_guest_course", menu_id: this._modal.menu_id, course_key: courseKey });
          this._data.guest_menus[menu.id] = menu;
          this._mountModal();
        } catch (error) {
          this._toast(error?.message || "Remplacement impossible.", "error");
          card?.classList.remove("is-loading");
        }
      });
    });

    overlay.querySelectorAll("[data-regenerate-item]").forEach((btn) => {
      btn.addEventListener("click", async (event) => {
        const [courseKey, itemIndexStr] = event.currentTarget.dataset.regenerateItem.split(":");
        const itemBox = event.currentTarget.closest(".guest-item");
        itemBox?.classList.add("is-loading");
        try {
          const menu = await this._ws({
            type: "a_table/regenerate_guest_course",
            menu_id: this._modal.menu_id,
            course_key: courseKey,
            item_index: Number(itemIndexStr),
          });
          this._data.guest_menus[menu.id] = menu;
          this._mountModal();
        } catch (error) {
          this._toast(error?.message || "Remplacement impossible.", "error");
          itemBox?.classList.remove("is-loading");
        }
      });
    });

    overlay.querySelector("[data-regenerate-wine]")?.addEventListener("click", async (event) => {
      const btn = event.currentTarget;
      btn.disabled = true;
      try {
        const menu = await this._ws({ type: "a_table/regenerate_wine_pairings", menu_id: this._modal.menu_id });
        this._data.guest_menus[menu.id] = menu;
        this._mountModal();
      } catch (error) {
        this._toast(error?.message || "Régénération impossible.", "error");
        btn.disabled = false;
      }
    });

    overlay.querySelector("[data-dismiss-guest]")?.addEventListener("click", async () => {
      if (!confirm("Supprimer ce menu ?")) return;
      try {
        await this._ws({ type: "a_table/dismiss_guest_menu", menu_id: this._modal.menu_id });
        if (this._data.guest_menus) delete this._data.guest_menus[this._modal.menu_id];
        this._closeModal();
      } catch (error) {
        this._toast(error?.message || "Suppression impossible.", "error");
      }
    });
  }

  // ---- Settings modal ----------------------------------------------------

  _tasteSuggestionsHTML() {
    const suggestions = this._modal?.tasteSuggestions;
    if (!suggestions) return "";
    const { liked_suggestions = [], disliked_suggestions = [] } = suggestions;
    if (!liked_suggestions.length && !disliked_suggestions.length) {
      return `<p class="taste-hint">Pas de tendance claire dans l'historique récent pour l'instant.</p>`;
    }
    const chips = (list, kind) => list.map((item) => `<button type="button" class="chip suggestion-chip" data-suggestion="${kind}" data-suggestion-value="${this._esc(item)}">${icon("plus")}${this._esc(item)}</button>`).join("");
    return `
      ${liked_suggestions.length ? `<div class="taste-suggestion-group"><span class="taste-suggestion-label">Suggestions J'adore</span><div class="chip-group">${chips(liked_suggestions, "liked")}</div></div>` : ""}
      ${disliked_suggestions.length ? `<div class="taste-suggestion-group"><span class="taste-suggestion-label">Suggestions Je n'aime pas</span><div class="chip-group">${chips(disliked_suggestions, "disliked")}</div></div>` : ""}
    `;
  }

  _entityOptionsHTML(prefix, selected) {
    const states = this._hass?.states || {};
    const ids = Object.keys(states).filter((id) => id.startsWith(prefix)).sort();
    if (!ids.length) {
      return `<option value="${this._esc(selected || "")}" selected>${this._esc(selected || "Aucune entité trouvée")}</option>`;
    }
    return ids
      .map((id) => {
        const label = states[id]?.attributes?.friendly_name || id;
        return `<option value="${this._esc(id)}" ${id === selected ? "selected" : ""}>${this._esc(label)}</option>`;
      })
      .join("");
  }

  _settingsModalHTML() {
    const draft = this._settingsDraft;
    const prefs = draft.preferences;
    const rules = draft.generation_rules;

    const diets = prefs.diets || [];
    const allergies = prefs.allergies || [];
    const liked = prefs.liked_ingredients || [];
    const disliked = prefs.disliked_ingredients || [];
    const availableEq = prefs.available_equipment || [];
    const objectives = prefs.objectives || [];
    const sources = prefs.recipe_sources || {};
    const macros = prefs.macro_ratios || { protein_pct: 30, carb_pct: 45, fat_pct: 25 };
    const domains = sources.allowed_domains || [];

    const showOtherDiet = diets.includes("other");
    const showOtherAllergy = allergies.includes("other");
    const objectivesLocked = objectives.length >= MAX_OBJECTIVES;

    const tab = this._modal.tab;

    return `<form id="settings-form" class="dialog" novalidate>
      <header class="dialog-top">
        <h2>Paramètres</h2>
        <button class="close" type="button">${icon("close")}</button>
      </header>
      <div class="tabs">
        <button type="button" class="tab ${tab === "general" ? "active" : ""}" data-tab="general">Général</button>
        <button type="button" class="tab ${tab === "diet" ? "active" : ""}" data-tab="diet">Régimes & allergies</button>
        <button type="button" class="tab ${tab === "tastes" ? "active" : ""}" data-tab="tastes">Goûts</button>
        <button type="button" class="tab ${tab === "equipment" ? "active" : ""}" data-tab="equipment">Équipements</button>
        <button type="button" class="tab ${tab === "objectives" ? "active" : ""}" data-tab="objectives">Objectifs</button>
        <button type="button" class="tab ${tab === "integrations" ? "active" : ""}" data-tab="integrations">Intégrations</button>
        <button type="button" class="tab ${tab === "advanced" ? "active" : ""}" data-tab="advanced">Avancé</button>
      </div>

      <div class="tab-content ${tab === "general" ? "active" : ""}" data-tab-content="general">
        <div class="settings-section">
          <h3>Foyer & portions</h3>
          <div class="row">
            <label>Nombre de personnes
              <div style="display:flex;align-items:center;gap:8px">
                <button type="button" data-servings-minus style="width:36px;height:36px;border-radius:8px;border:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 14%,transparent);background:transparent;color:inherit;font-size:18px">−</button>
                <output name="default_servings_output" style="width:50px;text-align:center;font-weight:750">${prefs.default_servings ?? 2}</output>
                <button type="button" data-servings-plus style="width:36px;height:36px;border-radius:8px;border:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 14%,transparent);background:transparent;color:inherit;font-size:18px">+</button>
              </div>
            </label>
            <label>Appétit
              <select name="appetite">
                <option value="low" ${prefs.appetite === "low" ? "selected" : ""}>Faible</option>
                <option value="normal" ${!prefs.appetite || prefs.appetite === "normal" ? "selected" : ""}>Normal</option>
                <option value="high" ${prefs.appetite === "high" ? "selected" : ""}>Fort</option>
              </select>
            </label>
          </div>
        </div>

        <div class="settings-section">
          <h3>Budget & temps</h3>
          <label>Où fais-tu tes courses ?
            <input name="grocery_store" value="${this._esc(prefs.grocery_store || "")}" placeholder="Ex. Delhaize, Colruyt, etc.">
          </label>
          <div class="row">
            <label>Budget par portion (€)
              <input name="budget_per_serving" type="number" step="0.5" value="${prefs.budget_per_serving ?? ""}">
            </label>
            <label>Temps de cuisson
              <select name="time_profile">
                <option value="quick" ${prefs.time_profile === "quick" ? "selected" : ""}>Rapide (≤ 20 min)</option>
                <option value="normal" ${prefs.time_profile === "normal" || !prefs.time_profile ? "selected" : ""}>Normal (≤ 60 min)</option>
                <option value="chill" ${prefs.time_profile === "chill" ? "selected" : ""}>Chill (> 60 min)</option>
              </select>
            </label>
          </div>
          <label>Complexité
            <select name="complexity">
              <option value="simple" ${prefs.complexity === "simple" ? "selected" : ""}>Simple</option>
              <option value="medium" ${prefs.complexity === "medium" ? "selected" : ""}>Moyen</option>
              <option value="free" ${!prefs.complexity || prefs.complexity === "free" ? "selected" : ""}>Libre</option>
            </select>
          </label>
        </div>

        <div class="settings-section">
          <h3>Historique</h3>
          <label>Historique pris en compte pour l'IA
            <input name="history_days_for_generation" type="range" min="5" max="30" value="${prefs.history_days_for_generation ?? 20}" style="width:100%">
            <div data-history-display style="text-align:right;font-size:12px;color:var(--secondary-text-color,#aeb7c5)">Historique pris en compte : ${prefs.history_days_for_generation ?? 20} jours</div>
          </label>
          <label>Historique affiché par défaut
            <input name="history_days_for_display" type="range" min="5" max="30" value="${prefs.history_days_for_display ?? 20}" style="width:100%">
            <div data-history-display-value style="text-align:right;font-size:12px;color:var(--secondary-text-color,#aeb7c5)">Historique affiché : ${prefs.history_days_for_display ?? 20} jours</div>
          </label>
          <label>
            <input type="checkbox" name="include_personal_recipes_in_context" ${prefs.include_personal_recipes_in_context ? "checked" : ""}>
            Inclure mes recettes personnelles dans le contexte
          </label>
        </div>

        <div class="settings-section">
          <h3>Autre consigne</h3>
          <label>Texte libre
            <textarea name="custom_context">${this._esc(prefs.custom_context || "")}</textarea>
          </label>
        </div>

        <div class="settings-section">
          <h3>Données</h3>
          <button class="save" type="button" data-clear-data style="width:100%">Vider cartes & historique</button>
        </div>
      </div>

      <div class="tab-content ${tab === "diet" ? "active" : ""}" data-tab-content="diet">
        <div class="settings-section">
          <h3>Régimes</h3>
          <div class="toggle-group">
            ${DIET_OPTIONS.map((opt) => `
              <label class="toggle-chip">
                <input type="checkbox" name="diets" value="${opt.value}" ${diets.includes(opt.value) ? "checked" : ""} ${opt.value === "everything" ? "data-diet-main" : ""}>
                <span>${opt.label}</span>
              </label>
            `).join("")}
          </div>
          <label class="${showOtherDiet ? "" : "hidden"}" data-diet-other-field>Autre régime / restriction (texte libre)
            <input name="diet_other_text" value="${this._esc(prefs.diet_other_text || "")}">
          </label>
        </div>

        <div class="settings-section">
          <h3>Allergies & intolérances</h3>
          <div class="toggle-group">
            ${ALLERGY_OPTIONS.map((opt) => `
              <label class="toggle-chip">
                <input type="checkbox" name="allergies" value="${opt.value}" ${allergies.includes(opt.value) ? "checked" : ""}>
                <span>${opt.label}</span>
              </label>
            `).join("")}
          </div>
          <label class="${showOtherAllergy ? "" : "hidden"}" data-allergy-other-field>Autres allergies (texte libre)
            <input name="allergies_other_text" value="${this._esc(prefs.allergies_other_text || "")}">
          </label>
        </div>
      </div>

      <div class="tab-content ${tab === "tastes" ? "active" : ""}" data-tab-content="tastes">
        <div class="settings-section">
          <h3>Goûts</h3>
          <label>J'adore
            <div class="chip-group" id="liked-chips">
              ${liked.map((item, i) => `<span class="chip">${this._esc(item)}<button type="button" data-remove-liked="${i}">×</button></span>`).join("")}
            </div>
            <div style="display:flex;gap:8px;margin-top:6px">
              <input name="new-liked" placeholder="Ajouter un ingrédient / cuisine">
              <button class="save" type="button" data-add-liked style="width:auto">Ajouter</button>
            </div>
          </label>
          <label>Je n'aime pas
            <div class="chip-group" id="disliked-chips">
              ${disliked.map((item, i) => `<span class="chip">${this._esc(item)}<button type="button" data-remove-disliked="${i}">×</button></span>`).join("")}
            </div>
            <div style="display:flex;gap:8px;margin-top:6px">
              <input name="new-disliked" placeholder="Ajouter un ingrédient / cuisine">
              <button class="save" type="button" data-add-disliked style="width:auto">Ajouter</button>
            </div>
          </label>
        </div>
        <div class="settings-section">
          <h3>${icon("sparkles")}Analyse IA de mes habitudes</h3>
          <p class="taste-hint">Un seul appel à l'IA, à la demande : elle relit ton historique récent et propose des goûts à ajouter. Rien n'est enregistré avant que tu ne cliques sur une suggestion, puis sur Enregistrer.</p>
          <button class="analyze-btn" type="button" data-analyze-tastes>${icon("sparkles")}<span data-analyze-label>Analyser mes habitudes</span></button>
          <div data-taste-suggestions>${this._tasteSuggestionsHTML()}</div>
        </div>
      </div>

      <div class="tab-content ${tab === "equipment" ? "active" : ""}" data-tab-content="equipment">
        <div class="settings-section">
          <h3>Équipements disponibles</h3>
          <div class="toggle-group">
            ${EQUIPMENT_OPTIONS.map((opt) => `
              <label class="toggle-chip">
                <input type="checkbox" name="available_equipment" value="${opt.value}" ${availableEq.includes(opt.value) ? "checked" : ""}>
                <span>${opt.label}</span>
              </label>
            `).join("")}
          </div>
          <label>Nombre de niveaux de votre plaque de cuisson
            <input type="number" name="stove_levels" min="1" max="20" placeholder="6" value="${prefs.stove_levels ?? ""}">
          </label>
        </div>
      </div>

      <div class="tab-content ${tab === "objectives" ? "active" : ""}" data-tab-content="objectives">
        <div class="settings-section">
          <h3>Objectifs (max ${MAX_OBJECTIVES})</h3>
          <div class="toggle-group" data-objectives-group>
            ${OBJECTIVE_OPTIONS.map((opt) => {
              const checked = objectives.includes(opt.value);
              const disabled = !checked && objectivesLocked;
              return `<label class="toggle-chip">
                <input type="checkbox" name="objectives" value="${opt.value}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
                <span>${opt.label}</span>
              </label>`;
            }).join("")}
          </div>
          <div data-objectives-hint style="font-size:12px;color:var(--secondary-text-color,#aeb7c5);margin-top:8px">${objectivesLocked ? "Maximum " + MAX_OBJECTIVES + " objectifs." : ""}</div>
        </div>
      </div>

      <div class="tab-content ${tab === "integrations" ? "active" : ""}" data-tab-content="integrations">
        <div class="settings-section">
          <h3>Intelligence artificielle</h3>
          <label>Entité IA utilisée pour les générations
            <select name="ai_task_entity_id" data-ai-entity-select>
              ${this._entityOptionsHTML("ai_task.", prefs.ai_task_entity_id)}
            </select>
          </label>
        </div>
        <div class="settings-section">
          <h3>Liste de courses</h3>
          <label>Liste de tâches pour le transfert des courses
            <select name="todo_entity_id" data-todo-entity-select>
              <option value="">Aucune</option>
              ${this._entityOptionsHTML("todo.", prefs.todo_entity_id)}
            </select>
          </label>
        </div>
        <div class="settings-section">
          <h3>Illustrations de plats (facultatif)</h3>
          <p class="taste-hint">Recherche d'image via l'API Pexels — voir le README pour la procédure de création de la clé (gratuite, sans carte bancaire).</p>
          <label>Clé API Pexels
            <input name="pexels_api_key" value="${this._esc(prefs.pexels_api_key || "")}" type="password" autocomplete="off">
          </label>
        </div>
      </div>

      <div class="tab-content ${tab === "advanced" ? "active" : ""}" data-tab-content="advanced">
        <div class="settings-section">
          <h3>Quotas & macros</h3>
          <div class="row">
            <label>Max recettes favorites / très appréciées
              <input name="max_favorites" type="number" min="0" value="${rules.max_favorites ?? 2}">
            </label>
            <label>Max récurrence (plats similaires)
              <input name="max_recurrence" type="number" min="0" value="${rules.max_recurrence ?? 1}">
            </label>
          </div>
          <label>Min nouvelles recettes (%)
            <input name="min_new_recipes_pct" type="number" min="0" max="100" value="${rules.min_new_recipes_pct ?? 90}">
          </label>
          <div class="row">
            <label>Max répétition protéine principale
              <input name="max_repeat_protein" type="number" min="0" value="${rules.max_repeat_protein ?? 2}">
            </label>
            <label>Max répétition féculent principal
              <input name="max_repeat_starch" type="number" min="0" value="${rules.max_repeat_starch ?? 2}">
            </label>
            <label>Max répétition légume principal
              <input name="max_repeat_vegetable" type="number" min="0" value="${rules.max_repeat_vegetable ?? 2}">
            </label>
          </div>
          <h3 style="margin-top:16px">Objectifs nutritionnels</h3>
          <label>Objectif calorique par portion (facultatif)
            <input name="target_kcal_per_serving" type="number" min="0" placeholder="Ex. 650" value="${prefs.target_kcal_per_serving ?? ""}">
          </label>
          <div class="macro-sliders" data-macro-sliders>
            <label><span class="macro-label-row">Protéines <span data-macro-value="protein_pct">${macros.protein_pct ?? 30}</span>%</span>
              <input name="protein_pct" type="range" min="0" max="100" step="5" value="${macros.protein_pct ?? 30}" data-macro-slider>
            </label>
            <label><span class="macro-label-row">Glucides <span data-macro-value="carb_pct">${macros.carb_pct ?? 45}</span>%</span>
              <input name="carb_pct" type="range" min="0" max="100" step="5" value="${macros.carb_pct ?? 45}" data-macro-slider>
            </label>
            <label><span class="macro-label-row">Lipides <span data-macro-value="fat_pct">${macros.fat_pct ?? 25}</span>%</span>
              <input name="fat_pct" type="range" min="0" max="100" step="5" value="${macros.fat_pct ?? 25}" data-macro-slider>
            </label>
          </div>
          <div class="macro-total" data-macro-total></div>
        </div>

        <div class="settings-section">
          <h3>Sources culinaires</h3>
          <label>
            <input type="checkbox" name="sources_enabled" ${sources.enabled ? "checked" : ""}>
            Activer les sources culinaires
          </label>
          <label>Domaines autorisés
            <div class="chip-group" id="domains-chips">
              ${domains.map((item, i) => `<span class="chip">${this._esc(item)}<button type="button" data-remove-domain="${i}">×</button></span>`).join("")}
            </div>
            <div style="display:flex;gap:8px;margin-top:6px">
              <input name="new-domain" placeholder="Ex. marmiton.org">
              <button class="save" type="button" data-add-domain style="width:auto">Ajouter</button>
            </div>
          </label>
          <label>
            <input type="checkbox" name="use_as_inspiration" ${sources.use_as_inspiration ? "checked" : ""}>
            Utiliser comme inspiration
          </label>
        </div>
      </div>

      <footer class="actions">
        <button class="cancel" type="button" data-settings-cancel>Annuler</button>
        <button class="save" type="submit">Enregistrer</button>
      </footer>
    </form>`;
  }

  _bindSettingsModal(overlay) {
    const draft = this._settingsDraft;
    const prefs = draft.preferences;

    overlay.querySelector("[data-settings-cancel]")?.addEventListener("click", () => this._closeModal());

    const updateMacroTotal = () => {
      const sliders = overlay.querySelectorAll("[data-macro-slider]");
      let total = 0;
      sliders.forEach((s) => {
        total += Number(s.value) || 0;
        overlay.querySelector(`[data-macro-value="${s.name}"]`).textContent = s.value;
      });
      const totalEl = overlay.querySelector("[data-macro-total]");
      if (totalEl) {
        totalEl.textContent = `Total : ${total}%`;
        totalEl.classList.toggle("is-warning", total !== 100);
      }
    };
    overlay.querySelectorAll("[data-macro-slider]").forEach((slider) => {
      slider.addEventListener("input", updateMacroTotal);
    });
    updateMacroTotal();

    // Tabs: capture current form state before switching, so edits persist.
    overlay.querySelectorAll("[data-tab]").forEach((tab) => {
      tab.addEventListener("click", () => {
        this._captureSettingsForm(overlay);
        this._modal.tab = tab.dataset.tab;
        this._mountModal();
      });
    });

    // Servings +/-
    const updateServings = (delta) => {
      const current = Number(prefs.default_servings ?? 2);
      prefs.default_servings = Math.max(1, Math.min(20, current + delta));
      const output = overlay.querySelector("output[name='default_servings_output']");
      if (output) output.textContent = prefs.default_servings;
    };
    overlay.querySelector("[data-servings-minus]")?.addEventListener("click", () => updateServings(-1));
    overlay.querySelector("[data-servings-plus]")?.addEventListener("click", () => updateServings(1));

    // Chips: liked
    overlay.querySelectorAll("[data-remove-liked]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.removeLiked);
        prefs.liked_ingredients.splice(idx, 1);
        this._mountModal();
      });
    });
    overlay.querySelector("[data-add-liked]")?.addEventListener("click", () => {
      const input = overlay.querySelector("[name='new-liked']");
      const val = input.value.trim();
      if (!val) return;
      prefs.liked_ingredients = prefs.liked_ingredients || [];
      if (!prefs.liked_ingredients.includes(val)) prefs.liked_ingredients.push(val);
      this._mountModal();
    });

    // Chips: disliked
    overlay.querySelectorAll("[data-remove-disliked]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.removeDisliked);
        prefs.disliked_ingredients.splice(idx, 1);
        this._mountModal();
      });
    });
    overlay.querySelector("[data-add-disliked]")?.addEventListener("click", () => {
      const input = overlay.querySelector("[name='new-disliked']");
      const val = input.value.trim();
      if (!val) return;
      prefs.disliked_ingredients = prefs.disliked_ingredients || [];
      if (!prefs.disliked_ingredients.includes(val)) prefs.disliked_ingredients.push(val);
      this._mountModal();
    });

    // Analyse IA des goûts (manuelle, un seul appel par clic)
    overlay.querySelector("[data-analyze-tastes]")?.addEventListener("click", async (event) => {
      const btn = event.currentTarget;
      const label = overlay.querySelector("[data-analyze-label]");
      btn.disabled = true;
      if (label) label.textContent = "Analyse en cours…";
      try {
        const result = await this._ws({ type: "a_table/analyze_tastes" });
        this._modal.tasteSuggestions = result;
        this._mountModal();
      } catch (error) {
        this._toast(error?.message || "Analyse impossible.", "error");
        btn.disabled = false;
        if (label) label.textContent = "Analyser mes habitudes";
      }
    });
    overlay.querySelectorAll("[data-suggestion]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const kind = btn.dataset.suggestion;
        const value = btn.dataset.suggestionValue;
        const listKey = kind === "liked" ? "liked_ingredients" : "disliked_ingredients";
        prefs[listKey] = prefs[listKey] || [];
        if (!prefs[listKey].includes(value)) prefs[listKey].push(value);
        if (this._modal.tasteSuggestions) {
          const suggestionKey = kind === "liked" ? "liked_suggestions" : "disliked_suggestions";
          this._modal.tasteSuggestions[suggestionKey] = this._modal.tasteSuggestions[suggestionKey].filter((v) => v !== value);
        }
        this._mountModal();
      });
    });

    // Chips: domains
    overlay.querySelectorAll("[data-remove-domain]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.dataset.removeDomain);
        prefs.recipe_sources.allowed_domains.splice(idx, 1);
        this._mountModal();
      });
    });
    overlay.querySelector("[data-add-domain]")?.addEventListener("click", () => {
      const input = overlay.querySelector("[name='new-domain']");
      let val = input.value.trim();
      if (!val) return;
      val = val.replace(/^https?:\/\//i, "").replace(/\/$/, "");
      prefs.recipe_sources = prefs.recipe_sources || { allowed_domains: [] };
      prefs.recipe_sources.allowed_domains = prefs.recipe_sources.allowed_domains || [];
      if (!prefs.recipe_sources.allowed_domains.includes(val)) prefs.recipe_sources.allowed_domains.push(val);
      this._mountModal();
    });

    // Diet / allergy "other" field visibility + "everything" exclusivity
    const dietCheckboxes = overlay.querySelectorAll("[name='diets']");
    const allergyCheckboxes = overlay.querySelectorAll("[name='allergies']");
    const otherDietField = overlay.querySelector("[data-diet-other-field]");
    const otherAllergyField = overlay.querySelector("[data-allergy-other-field]");

    const toggleOtherDiet = () => {
      const checked = Array.from(dietCheckboxes).some((cb) => cb.checked && cb.value === "other");
      otherDietField?.classList.toggle("hidden", !checked);
    };
    const toggleOtherAllergy = () => {
      const checked = Array.from(allergyCheckboxes).some((cb) => cb.checked && cb.value === "other");
      otherAllergyField?.classList.toggle("hidden", !checked);
    };

    dietCheckboxes.forEach((cb) => {
      cb.addEventListener("change", () => {
        if (cb.value === "everything" && cb.checked) {
          dietCheckboxes.forEach((c) => {
            if (c !== cb) c.checked = false;
          });
        } else if (cb.value !== "everything" && cb.checked) {
          dietCheckboxes.forEach((c) => {
            if (c.value === "everything") c.checked = false;
          });
        }
        toggleOtherDiet();
      });
    });
    allergyCheckboxes.forEach((cb) => cb.addEventListener("change", toggleOtherAllergy));

    toggleOtherDiet();
    toggleOtherAllergy();

    // History sliders live display
    const historySlider = overlay.querySelector("[name='history_days_for_generation']");
    const historyDisplay = overlay.querySelector("[data-history-display]");
    if (historySlider && historyDisplay) {
      historySlider.addEventListener("input", () => {
        historyDisplay.textContent = `Historique pris en compte : ${historySlider.value} jours`;
      });
    }
    const historyDisplaySlider = overlay.querySelector("[name='history_days_for_display']");
    const historyDisplayValue = overlay.querySelector("[data-history-display-value]");
    if (historyDisplaySlider && historyDisplayValue) {
      historyDisplaySlider.addEventListener("input", () => {
        historyDisplayValue.textContent = `Historique affiché : ${historyDisplaySlider.value} jours`;
      });
    }

    // Objectives: max 3
    const objectivesCheckboxes = overlay.querySelectorAll("[name='objectives']");
    const objectivesHint = overlay.querySelector("[data-objectives-hint]");
    const enforceObjectivesLimit = () => {
      const checkedCount = Array.from(objectivesCheckboxes).filter((cb) => cb.checked).length;
      objectivesCheckboxes.forEach((cb) => {
        cb.disabled = !cb.checked && checkedCount >= MAX_OBJECTIVES;
      });
      if (objectivesHint) {
        objectivesHint.textContent = checkedCount >= MAX_OBJECTIVES ? `Maximum ${MAX_OBJECTIVES} objectifs.` : "";
      }
    };
    objectivesCheckboxes.forEach((cb) => {
      cb.addEventListener("change", () => {
        const checkedCount = Array.from(objectivesCheckboxes).filter((c) => c.checked).length;
        if (checkedCount > MAX_OBJECTIVES) {
          cb.checked = false;
          this._toast(`Maximum ${MAX_OBJECTIVES} objectifs.`);
        }
        enforceObjectivesLimit();
      });
    });
    enforceObjectivesLimit();

    // Clear data (independent of the settings draft)
    overlay.querySelector("[data-clear-data]")?.addEventListener("click", async () => {
      if (!confirm("Vider les recettes, cartes, brouillons et historique ? Les préférences et aliments temporaires seront conservés.")) return;
      try {
        await this._ws({ type: "a_table/clear_cards_and_history" });
        this._closeModal();
        await this._load();
        this._toast("Cartes et historique vidés.", "success");
      } catch (error) {
        this._toast(error?.message || "Impossible de vider les données.", "error");
      }
    });

    // Form submit
    overlay.querySelector("#settings-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const result = this._collectSettingsForm(overlay);
      if (result.error) {
        this._toast(result.error, "error");
        return;
      }

      this._settingsDraft.preferences = result.preferences;
      this._settingsDraft.generation_rules = result.rules;

      try {
        await this._ws({ type: "a_table/update_preferences", preferences: this._settingsDraft.preferences });
        await this._ws({ type: "a_table/update_generation_rules", rules: this._settingsDraft.generation_rules });
        this._closeModal();
        await this._load();
        this._toast("Paramètres enregistrés.", "success");
      } catch (error) {
        this._toast(error?.message || "Enregistrement impossible.", "error");
      }
    });
  }

  _captureSettingsForm(overlay) {
    const result = this._collectSettingsForm(overlay, { skipValidation: true });
    this._settingsDraft.preferences = result.preferences;
    this._settingsDraft.generation_rules = result.rules;
  }

  _collectSettingsForm(overlay, options = {}) {
    const form = overlay.querySelector("#settings-form");
    const data = new FormData(form);
    const prefs = this._settingsDraft.preferences;

    const diets = data.getAll("diets");
    if (!options.skipValidation && diets.includes("other") && !String(data.get("diet_other_text") || "").trim()) {
      return { error: "Merci de remplir le champ « Autre régime / restriction »." };
    }

    const allergies = data.getAll("allergies");
    if (!options.skipValidation && allergies.includes("other") && !String(data.get("allergies_other_text") || "").trim()) {
      return { error: "Merci de remplir le champ « Autres allergies »." };
    }

    const objectives = data.getAll("objectives");
    if (!options.skipValidation && objectives.length > MAX_OBJECTIVES) {
      return { error: `Maximum ${MAX_OBJECTIVES} objectifs.` };
    }

    const availableEquipment = data.getAll("available_equipment");

    const macros = {
      protein_pct: Number(data.get("protein_pct") || 30),
      carb_pct: Number(data.get("carb_pct") || 45),
      fat_pct: Number(data.get("fat_pct") || 25),
    };

    const preferences = {
      ...prefs,
      default_servings: Number(prefs.default_servings ?? 2),
      appetite: String(data.get("appetite") || "normal"),
      diets,
      diet_other_text: String(data.get("diet_other_text") || ""),
      allergies,
      allergies_other_text: String(data.get("allergies_other_text") || ""),
      liked_ingredients: prefs.liked_ingredients || [],
      disliked_ingredients: prefs.disliked_ingredients || [],
      available_equipment: availableEquipment,
      stove_levels: data.get("stove_levels") ? Number(data.get("stove_levels")) : null,
      objectives,
      ai_task_entity_id: String(data.get("ai_task_entity_id") || "") || prefs.ai_task_entity_id,
      todo_entity_id: String(data.get("todo_entity_id") || "") || null,
      pexels_api_key: String(data.get("pexels_api_key") || "") || null,
      budget_per_serving: data.get("budget_per_serving") ? Number(data.get("budget_per_serving")) : null,
      target_kcal_per_serving: data.get("target_kcal_per_serving") ? Number(data.get("target_kcal_per_serving")) : null,
      grocery_store: String(data.get("grocery_store") || ""),
      time_profile: String(data.get("time_profile") || "normal"),
      complexity: String(data.get("complexity") || "free"),
      history_days_for_generation: Number(data.get("history_days_for_generation") || 20),
      history_days_for_display: Number(data.get("history_days_for_display") || 20),
      include_personal_recipes_in_context: !!data.get("include_personal_recipes_in_context"),
      custom_context: String(data.get("custom_context") || ""),
      macro_ratios: macros,
      recipe_sources: {
        ...(prefs.recipe_sources || {}),
        enabled: !!data.get("sources_enabled"),
        allowed_domains: prefs.recipe_sources?.allowed_domains || [],
        use_as_inspiration: !!data.get("use_as_inspiration"),
      },
    };

    const rules = {
      max_favorites: Number(data.get("max_favorites") || 2),
      max_recurrence: Number(data.get("max_recurrence") || 1),
      min_new_recipes_pct: Number(data.get("min_new_recipes_pct") || 90),
      max_repeat_protein: Number(data.get("max_repeat_protein") || 2),
      max_repeat_starch: Number(data.get("max_repeat_starch") || 2),
      max_repeat_vegetable: Number(data.get("max_repeat_vegetable") || 2),
    };

    return { preferences, rules };
  }

  _toast(message, kind = "info", undo) {
    this.shadowRoot.querySelector(".toast")?.remove();
    const toast = document.createElement("div");
    toast.className = `toast toast-${kind}`;
    const iconWrap = document.createElement("span");
    iconWrap.className = "toast-icon";
    iconWrap.innerHTML = icon(kind === "error" ? "close" : kind === "success" ? "check" : "sparkles");
    const text = document.createElement("span");
    text.textContent = message;
    toast.append(iconWrap, text);
    if (undo) {
      const undoBtn = document.createElement("button");
      undoBtn.type = "button";
      undoBtn.className = "toast-undo";
      undoBtn.textContent = "Annuler";
      undoBtn.addEventListener("click", async () => {
        toast.remove();
        try {
          await undo();
        } catch (error) {
          this._toast(error?.message || "Impossible d'annuler.", "error");
        }
      });
      toast.append(undoBtn);
    }
    this.shadowRoot.append(toast);
    setTimeout(() => toast.remove(), undo ? 6000 : 3600);
  }
}

if (!customElements.get("a-table-card")) {
  customElements.define("a-table-card", ATableCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "a-table-card",
    name: "À table",
    description: "Planification flexible des repas",
  });
}
