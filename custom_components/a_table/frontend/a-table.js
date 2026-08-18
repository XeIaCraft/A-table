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

const MAX_OBJECTIVES = 3;

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
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._data && !this._loading) this._load();
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
    return `<article class="meal" data-card-id="${this._esc(card.id)}">
      <button class="grip" type="button" data-grip="${this._esc(card.id)}" aria-label="Déplacer ${this._esc(recipe.title)}" title="Maintenir puis déplacer">⠿</button>
      <button class="meal-main" type="button" data-detail="${this._esc(card.id)}">
        <strong>${this._esc(recipe.title)}</strong>
        <span class="meta">${this._esc(cooking)} · ${this._esc(card.servings || recipe.servings || 2)} pers.</span>
        ${tags.length ? `<span class="tags">${tags.map((tag) => `<i>${this._esc(tag)}</i>`).join("")}</span>` : ""}
      </button>
      <button class="cook" type="button" data-cook="${this._esc(card.id)}" aria-label="Marquer comme cuisiné" title="Cuisiné">✓</button>
    </article>`;
  }

  _dayHTML(key, label) {
    const cards = this._cards(key);
    return `<section class="day"><header><span>${label}</span><b>${cards.length}</b></header><div class="zone" data-zone="${key}">${cards.length ? cards.map((card) => this._mealHTML(card)).join("") : `<span class="empty">Dépose ici</span>`}</div></section>`;
  }

  _tempIngredientHTML(ing) {
    const date = ing.date_limit ? ` · à utiliser avant ${ing.date_limit}` : "";
    const note = ing.note ? ` (${ing.note})` : "";
    return `<div class="temp-ing" data-ing-id="${this._esc(ing.id)}">
      <span class="temp-ing-name">${this._esc(ing.quantity || "")} ${this._esc(ing.unit || "")} ${this._esc(ing.name || "")}${note}${date}</span>
      <button class="temp-ing-edit" type="button" data-edit="${this._esc(ing.id)}">✏️</button>
      <button class="temp-ing-remove" type="button" data-remove="${this._esc(ing.id)}">🗑️</button>
    </div>`;
  }

  _render() {
    const prefs = this._data?.preferences || {};
    const count = prefs.default_recipe_count ?? 6;
    const backlog = this._cards("backlog");
    const tempIngs = this._data?.temporary_ingredients || [];
    const error = this._data?.error;

    this.shadowRoot.innerHTML = `<style>
      :host{display:block;width:100%;font-family:var(--primary-font-family,system-ui,sans-serif);color:var(--primary-text-color,#f4f6fa)}
      *{box-sizing:border-box}
      .app{width:100%;background:var(--card-background-color,#171a20);border-radius:18px;padding:clamp(14px,2vw,24px);overflow:hidden}
      .top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px}
      .eyebrow{margin:0 0 4px;color:var(--secondary-text-color,#aeb7c5);font-size:12px;font-weight:750;letter-spacing:.1em;text-transform:uppercase}
      h1{margin:0;font-size:clamp(23px,2.4vw,30px);line-height:1.1}
      .sub{margin:6px 0 0;color:var(--secondary-text-color,#aeb7c5);font-size:14px}
      .refresh,.counter button,.generate,.add,.grip,.meal-main,.cook,.close,.cancel,.save,.settings,.temp-ing-edit,.temp-ing-remove{font:inherit;cursor:pointer}
      .refresh,.settings{width:44px;height:44px;border:0;border-radius:12px;background:color-mix(in srgb,var(--card-background-color,#171a20) 88%,var(--primary-text-color,#fff));color:inherit;font-size:20px}
      .top-actions{display:flex;gap:8px}
      .generator{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px;border:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 12%,transparent);border-radius:14px;background:color-mix(in srgb,var(--card-background-color,#171a20) 94%,var(--primary-text-color,#fff));margin-bottom:16px}
      .generator strong{font-size:14px}
      .generator-actions,.counter{display:flex;align-items:center;gap:8px}
      .counter button{width:38px;height:38px;border:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 14%,transparent);border-radius:10px;background:transparent;color:inherit;font-size:20px}
      .counter span{width:28px;text-align:center;font-weight:750;font-variant-numeric:tabular-nums}
      .generate,.add,.save{min-height:40px;border:0;border-radius:10px;padding:0 14px;background:var(--primary-color,#4f98a3);color:var(--text-primary-color,#fff);font-weight:750}
      .temp-section{margin-bottom:16px;padding:14px;border:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 12%,transparent);border-radius:14px;background:color-mix(in srgb,var(--card-background-color,#171a20) 92%,var(--primary-text-color,#fff))}
      .temp-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;font-size:14px;font-weight:700}
      .temp-list{display:flex;flex-wrap:wrap;gap:8px}
      .temp-ing{display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:10px;background:color-mix(in srgb,var(--primary-text-color,#fff) 8%,transparent);font-size:12px}
      .temp-ing-name{color:var(--secondary-text-color,#aeb7c5)}
      .temp-ing-edit,.temp-ing-remove{width:24px;height:24px;border:0;border-radius:6px;background:transparent;color:inherit;font-size:14px}
      .add-temp{margin-top:8px;font-size:12px;color:var(--primary-color,#4f98a3);background:none;border:0;padding:0}
      .backlog{padding:12px;border:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 12%,transparent);border-radius:14px;margin-bottom:16px;background:color-mix(in srgb,var(--card-background-color,#171a20) 92%,var(--primary-text-color,#fff))}
      .section-head,.day header{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:14px;font-weight:750}
      .section-head b,.day header b{min-width:23px;padding:2px 7px;border-radius:99px;text-align:center;font-size:12px;color:var(--secondary-text-color,#aeb7c5);background:color-mix(in srgb,var(--primary-text-color,#fff) 10%,transparent)}
      .backlog-scroll{overflow-x:auto;overflow-y:hidden;padding:10px 1px 4px;scroll-behavior:auto}
      .backlog-zone{display:flex;gap:10px;min-width:max-content;min-height:102px}
      .backlog-zone .meal{flex:0 0 250px;width:250px}
      .week-scroll{width:100%;overflow-x:auto;overflow-y:hidden;padding:0 0 9px;scroll-behavior:auto;overscroll-behavior-x:contain}
      .week{display:grid;grid-template-columns:repeat(7,230px);gap:10px;min-width:max-content}
      .day{min-height:280px;padding:10px;border:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 12%,transparent);border-radius:14px;background:color-mix(in srgb,var(--card-background-color,#171a20) 94%,var(--primary-text-color,#fff))}
      .zone{min-height:210px;display:flex;flex-direction:column;gap:8px;padding-top:10px;border-radius:10px}
      .zone.over,.backlog-zone.over{outline:2px dashed var(--primary-color,#4f98a3);outline-offset:2px;background:color-mix(in srgb,var(--primary-color,#4f98a3) 7%,transparent)}
      .empty{padding:12px 4px;color:var(--secondary-text-color,#aeb7c5);font-size:12px}
      .meal{display:grid;grid-template-columns:27px minmax(0,1fr) 31px;align-items:start;gap:7px;padding:9px;border:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 12%,transparent);border-radius:12px;background:color-mix(in srgb,var(--card-background-color,#171a20) 88%,var(--primary-text-color,#fff));box-shadow:0 2px 8px rgba(0,0,0,.08)}
      .meal.dragging{opacity:.35}
      .grip{width:27px;height:31px;border:0;background:transparent;color:var(--secondary-text-color,#aeb7c5);font-size:17px;line-height:1;touch-action:none}
      .meal-main{min-width:0;padding:0;border:0;text-align:left;background:transparent;color:inherit;display:grid;gap:4px}
      .meal-main strong{display:block;font-size:14px;line-height:1.25}
      .meta{display:block;color:var(--secondary-text-color,#aeb7c5);font-size:11px}
      .tags{display:flex;flex-wrap:wrap;gap:4px}
      .tags i{padding:2px 6px;border-radius:99px;background:color-mix(in srgb,var(--primary-text-color,#fff) 9%,transparent);color:var(--secondary-text-color,#aeb7c5);font-size:10px;font-style:normal}
      .cook{width:31px;height:31px;border:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 14%,transparent);border-radius:9px;background:transparent;color:var(--primary-color,#4f98a3);font-weight:800;font-size:17px}
      .add-row{display:flex;justify-content:flex-end;margin-top:16px}
      .overlay{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:16px;background:rgba(0,0,0,.48)}
      .dialog{width:min(720px,100%);max-height:calc(100dvh - 32px);overflow:auto;border:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 14%,transparent);border-radius:16px;padding:18px;background:var(--card-background-color,#171a20);box-shadow:0 22px 56px rgba(0,0,0,.38)}
      .dialog-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
      .dialog h2{margin:0;font-size:20px}
      .close{border:0;background:transparent;color:var(--secondary-text-color,#aeb7c5);font-size:25px}
      .dialog label{display:grid;gap:6px;margin-top:11px;font-size:13px;font-weight:700}
      .dialog input,.dialog select,.dialog textarea{min-height:42px;width:100%;padding:8px 10px;border:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 14%,transparent);border-radius:10px;background:color-mix(in srgb,var(--card-background-color,#171a20) 94%,var(--primary-text-color,#fff));color:inherit;font:inherit}
      .dialog textarea{min-height:80px;resize:vertical}
      .actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
      .cancel{min-height:40px;padding:0 13px;border:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 14%,transparent);border-radius:10px;background:transparent;color:inherit}
      .facts{display:grid;gap:12px;color:var(--secondary-text-color,#aeb7c5);font-size:14px}
      .facts strong{color:var(--primary-text-color,#f4f6fa)}
      .ghost{position:fixed;z-index:10001;width:230px;pointer-events:none;opacity:.94;transform:rotate(2deg);box-shadow:0 20px 45px rgba(0,0,0,.35)}
      .toast{position:fixed;right:18px;bottom:18px;z-index:10002;max-width:340px;padding:12px 14px;border-radius:12px;background:var(--primary-text-color,#fff);color:var(--card-background-color,#111);box-shadow:0 10px 26px rgba(0,0,0,.25);font-size:14px}
      .state{padding:48px 12px;text-align:center;color:var(--secondary-text-color,#aeb7c5)}
      .state.error{color:var(--error-color,#e57373)}
      .proposal{padding:12px;border:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 12%,transparent);border-radius:12px;background:color-mix(in srgb,var(--card-background-color,#171a20) 94%,var(--primary-text-color,#fff));margin-bottom:10px}
      .proposal-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
      .proposal-head input[type="checkbox"]{width:20px;height:20px}
      .proposal-title{font-weight:700;font-size:14px}
      .proposal-meta{display:flex;flex-wrap:wrap;gap:8px;color:var(--secondary-text-color,#aeb7c5);font-size:11px}
      .proposal-section{margin-top:8px;font-size:12px}
      .proposal-section strong{display:block;margin-bottom:4px;color:var(--secondary-text-color,#aeb7c5);font-size:11px;text-transform:uppercase}
      .proposal-nutrition{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:6px}
      .nutrition-item{padding:6px;border-radius:8px;background:color-mix(in srgb,var(--primary-text-color,#fff) 8%,transparent);text-align:center}
      .nutrition-item b{display:block;font-size:12px;color:var(--primary-text-color,#f4f6fa)}
      .nutrition-item span{font-size:10px;color:var(--secondary-text-color,#aeb7c5)}
      .settings-section{margin-top:16px;border-top:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 10%,transparent);padding-top:14px}
      .settings-section h3{margin:0 0 10px;font-size:15px;color:var(--primary-text-color,#f4f6fa)}
      .checkbox-group,.chip-group{display:flex;flex-wrap:wrap;gap:8px}
      .checkbox-item{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--secondary-text-color,#aeb7c5)}
      .checkbox-item.disabled{opacity:.45}
      .chip{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:99px;background:color-mix(in srgb,var(--primary-text-color,#fff) 8%,transparent);font-size:12px;color:var(--secondary-text-color,#aeb7c5)}
      .chip button{border:0;background:transparent;color:inherit;font-size:14px;cursor:pointer}
      .row{display:flex;gap:10px;align-items:center}
      .row > *{flex:1}
      .tabs{display:flex;gap:8px;margin-bottom:14px;border-bottom:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 10%,transparent);padding-bottom:8px;flex-wrap:wrap}
      .tab{padding:6px 10px;border-radius:8px;background:transparent;border:0;color:var(--secondary-text-color,#aeb7c5);font-size:13px;font-weight:700;cursor:pointer;font-family:inherit}
      .tab.active{background:color-mix(in srgb,var(--primary-text-color,#fff) 10%,transparent);color:var(--primary-text-color,#f4f6fa)}
      .tab-content{display:none}
      .tab-content.active{display:block}
      .readonly-input{pointer-events:none;opacity:0.7}
      .hidden{display:none}
      .equipment-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;font-size:13px}
      .equipment-grid-head{font-weight:750;color:var(--secondary-text-color,#aeb7c5);font-size:11px;text-transform:uppercase;padding:0 0 8px}
      .equipment-row{display:contents}
      .equipment-cell{display:flex;align-items:center;gap:6px;padding:6px 4px;border-bottom:1px solid color-mix(in srgb,var(--primary-text-color,#fff) 6%,transparent)}
      @media(max-width:680px){
        .app{padding:14px;border-radius:14px}
        .generator{flex-wrap:wrap}
        .generator-actions{width:100%;justify-content:space-between}
        .week{grid-template-columns:repeat(7,255px)}
        .day{min-height:305px}
        .zone{min-height:230px}
        .backlog-zone .meal{flex-basis:260px;width:260px}
      }
    </style><section class="app">
      <header class="top">
        <div>
          <h1>À table</h1>
        </div>
        <div class="top-actions">
          <button class="settings" type="button" aria-label="Paramètres">⚙️</button>
          <button class="refresh" type="button" aria-label="Actualiser">↻</button>
        </div>
      </header>
      ${this._loading
        ? `<p class="state">Chargement…</p>`
        : error
          ? `<p class="state error">${this._esc(error)}</p>`
          : `
            <section class="temp-section">
              <header class="temp-head">
                <span>Aliments à utiliser rapidement</span>
                <button class="add-temp" type="button" data-add-temp>＋ Ajouter un aliment</button>
              </header>
              <div class="temp-list">
                ${tempIngs.length ? tempIngs.map((ing) => this._tempIngredientHTML(ing)).join("") : `<span class="empty">Aucun aliment temporaire.</span>`}
              </div>
            </section>
            <section class="generator">
              <strong>Proposer des repas</strong>
              <div class="generator-actions">
                <div class="counter">
                  <button type="button" data-count="minus">−</button>
                  <span>${count}</span>
                  <button type="button" data-count="plus">+</button>
                </div>
                <button class="generate" type="button">Générer</button>
              </div>
            </section>
            <section class="backlog">
              <header class="section-head">
                <span>À cuisiner</span>
                <b>${backlog.length}</b>
              </header>
              <div class="backlog-scroll">
                <div class="backlog-zone" data-zone="backlog">
                  ${backlog.length ? backlog.map((card) => this._mealHTML(card)).join("") : `<span class="empty">Les recettes validées apparaîtront ici.</span>`}
                </div>
              </div>
            </section>
            <div class="week-scroll">
              <section class="week">
                ${ATABLE_DAYS.map(([key, label]) => this._dayHTML(key, label)).join("")}
              </section>
            </div>
            <div class="add-row">
              <button class="add" type="button">＋ Ajouter une recette</button>
            </div>
          `
      }
    </section>`;

    this._bind();
    this._restoreScroll();
    if (this._modal) this._mountModal();
  }

  _bind() {
    const root = this.shadowRoot;
    root.querySelector(".refresh")?.addEventListener("click", () => this._load());
    root.querySelector(".settings")?.addEventListener("click", () => this._openSettings());
    root.querySelector(".add")?.addEventListener("click", () => this._openAdd());
    root.querySelector(".generate")?.addEventListener("click", () => this._generate());
    root.querySelectorAll("[data-count]").forEach((button) =>
      button.addEventListener("click", () => {
        const current = Number(this._data.preferences?.default_recipe_count || 6);
        this._data.preferences.default_recipe_count = Math.max(1, Math.min(10, current + (button.dataset.count === "plus" ? 1 : -1)));
        this._render();
      })
    );
    root.querySelectorAll("[data-detail]").forEach((button) =>
      button.addEventListener("click", () => this._openDetail(button.dataset.detail))
    );
    root.querySelectorAll("[data-cook]").forEach((button) =>
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        this._cook(button.dataset.cook);
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
      this._toast(error?.message || "Déplacement impossible.");
    }
  }

  async _cook(id) {
    this._saveScroll();
    try {
      await this._ws({ type: "a_table/cook_meal_card", meal_card_id: id });
      await this._load();
    } catch (error) {
      this._toast(error?.message || "Impossible de marquer cette recette comme cuisinée.");
    }
  }

  async _generate() {
    const count = Number(this._data.preferences?.default_recipe_count || 6);
    try {
      this._toast("Génération en cours…");
      const result = await this._ws({ type: "a_table/generate_draft", count });
      await this._load();
      this._modal = { type: "validate", draft_id: result.draft_id };
      this._mountModal();
    } catch (error) {
      this._toast(error?.message || "Génération impossible.");
    }
  }

  _openDetail(id) {
    this._modal = { type: "detail", id };
    this._mountModal();
  }

  _openAdd() {
    this._modal = { type: "add" };
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
      this._toast(error?.message || "Suppression impossible.");
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
    this._modal = null;
    this._settingsDraft = null;
    this.shadowRoot.querySelector(".overlay")?.remove();
  }

  _mountModal() {
    this.shadowRoot.querySelector(".overlay")?.remove();
    if (!this._modal) return;
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    if (this._modal.type === "detail") {
      const card = this._data?.meal_cards?.[this._modal.id];
      const recipe = card && this._recipe(card);
      if (!card || !recipe) return;
      const ingredients = recipe.ingredients?.length
        ? `<ul>${recipe.ingredients.map((item) => `<li>${this._esc(item.quantity || "")} ${this._esc(item.unit || "")} ${this._esc(item.name || "")}</li>`).join("")}</ul>`
        : "Aucun ingrédient détaillé pour le moment.";
      const steps = recipe.steps?.length
        ? `<ol>${recipe.steps.map((s) => `<li>${this._esc(s)}</li>`).join("")}</ol>`
        : "Aucune étape détaillée pour le moment.";
      const nutrition = recipe.nutrition || {};
      const price = recipe.price_per_serving != null
        ? `<div><strong>Prix par portion</strong><br>${this._esc(recipe.price_per_serving)} €</div>`
        : "";
      overlay.innerHTML = `<section class="dialog">
        <header class="dialog-top">
          <h2>${this._esc(recipe.title)}</h2>
          <button class="close" type="button">×</button>
        </header>
        <div class="facts">
          <div><strong>Temps total</strong><br>${this._esc(recipe.cooking_minutes ?? "À préciser")} min</div>
          <div><strong>Portions</strong><br>${this._esc(card.servings || recipe.servings || 2)}</div>
          <div><strong>Ingrédients</strong><br>${ingredients}</div>
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
        <footer class="actions">
          <button class="cancel" type="button">Fermer</button>
          <button class="save" type="button" data-modal-cook="${this._esc(card.id)}">Cuisiné</button>
        </footer>
      </section>`;
    } else if (this._modal.type === "validate") {
      const draft = this._data?.drafts?.[this._modal.draft_id];
      const proposals = draft?.proposals || [];
      if (!proposals.length) {
        overlay.innerHTML = `<section class="dialog">
          <header class="dialog-top">
            <h2>Aucune proposition</h2>
            <button class="close" type="button" data-close-draft>×</button>
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
            <button class="close" type="button" data-close-draft>×</button>
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
                return `<div class="proposal">
                  <div class="proposal-head">
                    <input type="checkbox" data-proposal-check="${i}" checked>
                    <strong class="proposal-title">${this._esc(p.title || "Recette sans titre")}</strong>
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
      overlay.innerHTML = `<form class="dialog" novalidate>
        <header class="dialog-top">
          <h2>Ajouter une recette <span style="font-size:12px;color:var(--secondary-text-color,#aeb7c5);font-weight:normal">(Work in progress)</span></h2>
          <button class="close" type="button">×</button>
        </header>
        <label>Nom de la recette
          <input name="title" required autofocus placeholder="Ex. Curry de courgettes">
        </label>
        <label>Portions
          <input name="servings" type="number" min="1" max="20" value="2">
        </label>
        <label>Temps total (minutes)
          <input name="cooking_minutes" type="number" min="0" max="1440" placeholder="Ex. 25">
        </label>
        <footer class="actions">
          <button class="cancel" type="button">Annuler</button>
          <button class="save" type="submit">Ajouter</button>
        </footer>
      </form>`;
    } else if (this._modal.type === "add_temp") {
      overlay.innerHTML = `<form class="dialog" novalidate>
        <header class="dialog-top">
          <h2>Ajouter un aliment à utiliser rapidement</h2>
          <button class="close" type="button">×</button>
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
          <button class="close" type="button">×</button>
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
    }

    this.shadowRoot.append(overlay);

    overlay.querySelector(".close")?.addEventListener("click", () => this._closeModal());
    overlay.querySelector(".cancel")?.addEventListener("click", () => this._closeModal());

    if (this._modal.type === "detail") {
      overlay.querySelector("[data-modal-cook]")?.addEventListener("click", async (event) => {
        const id = event.currentTarget.dataset.modalCook;
        this._closeModal();
        await this._cook(id);
      });
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
          this._toast(`${selected_indices.length} recette(s) ajoutée(s).`);
        } catch (error) {
          this._toast(error?.message || "Validation impossible.");
        }
      });
    } else if (this._modal.type === "add") {
      overlay.querySelector("form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const title = String(data.get("title") || "").trim();
        if (!title) return;
        const minutes = String(data.get("cooking_minutes") || "").trim();
        try {
          await this._ws({
            type: "a_table/add_recipe",
            title,
            servings: Number(data.get("servings") || 2),
            ...(minutes ? { cooking_minutes: Number(minutes) } : {}),
          });
          this._closeModal();
          await this._load();
        } catch (error) {
          this._toast(error?.message || "Ajout impossible.");
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
          this._toast(error?.message || "Ajout impossible.");
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
          this._toast(error?.message || "Modification impossible.");
        }
      });
    } else if (this._modal.type === "settings") {
      this._bindSettingsModal(overlay);
    }
  }

  // ---- Settings modal ----------------------------------------------------

  _settingsModalHTML() {
    const draft = this._settingsDraft;
    const prefs = draft.preferences;
    const rules = draft.generation_rules;

    const diets = prefs.diets || [];
    const allergies = prefs.allergies || [];
    const liked = prefs.liked_ingredients || [];
    const disliked = prefs.disliked_ingredients || [];
    const availableEq = prefs.available_equipment || [];
    const preferredEq = prefs.preferred_equipment || "";
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
        <button class="close" type="button">×</button>
      </header>
      <div class="tabs">
        <button type="button" class="tab ${tab === "general" ? "active" : ""}" data-tab="general">Général</button>
        <button type="button" class="tab ${tab === "diet" ? "active" : ""}" data-tab="diet">Régimes & allergies</button>
        <button type="button" class="tab ${tab === "tastes" ? "active" : ""}" data-tab="tastes">Goûts</button>
        <button type="button" class="tab ${tab === "equipment" ? "active" : ""}" data-tab="equipment">Équipements</button>
        <button type="button" class="tab ${tab === "objectives" ? "active" : ""}" data-tab="objectives">Objectifs</button>
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
          <label>Historique pris en compte
            <input name="history_days_for_generation" type="range" min="5" max="30" value="${prefs.history_days_for_generation ?? 20}" style="width:100%">
            <div data-history-display style="text-align:right;font-size:12px;color:var(--secondary-text-color,#aeb7c5)">Historique pris en compte : ${prefs.history_days_for_generation ?? 20} jours</div>
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
          <div class="checkbox-group">
            ${DIET_OPTIONS.map((opt) => `
              <label class="checkbox-item">
                <input type="checkbox" name="diets" value="${opt.value}" ${diets.includes(opt.value) ? "checked" : ""} ${opt.value === "everything" ? "data-diet-main" : ""}>
                ${opt.label}
              </label>
            `).join("")}
          </div>
          <label class="${showOtherDiet ? "" : "hidden"}" data-diet-other-field>Autre régime / restriction (texte libre)
            <input name="diet_other_text" value="${this._esc(prefs.diet_other_text || "")}">
          </label>
        </div>

        <div class="settings-section">
          <h3>Allergies & intolérances</h3>
          <div class="checkbox-group">
            ${ALLERGY_OPTIONS.map((opt) => `
              <label class="checkbox-item">
                <input type="checkbox" name="allergies" value="${opt.value}" ${allergies.includes(opt.value) ? "checked" : ""}>
                ${opt.label}
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
      </div>

      <div class="tab-content ${tab === "equipment" ? "active" : ""}" data-tab-content="equipment">
        <div class="settings-section">
          <h3>Équipements</h3>
          <div class="equipment-grid">
            <div class="equipment-grid-head">J'ai</div>
            <div class="equipment-grid-head">À privilégier</div>
            ${EQUIPMENT_OPTIONS.map((opt) => {
              const has = availableEq.includes(opt.value);
              const isPreferred = preferredEq === opt.value;
              return `<div class="equipment-row">
                <div class="equipment-cell">
                  <label class="checkbox-item">
                    <input type="checkbox" name="available_equipment" value="${opt.value}" data-equip-available="${opt.value}" ${has ? "checked" : ""}>
                    ${opt.label}
                  </label>
                </div>
                <div class="equipment-cell">
                  <label class="checkbox-item ${has ? "" : "disabled"}">
                    <input type="radio" name="preferred_equipment_radio" value="${opt.value}" data-equip-preferred="${opt.value}" ${isPreferred ? "checked" : ""} ${has ? "" : "disabled"}>
                    Oui
                  </label>
                </div>
              </div>`;
            }).join("")}
          </div>
        </div>
      </div>

      <div class="tab-content ${tab === "objectives" ? "active" : ""}" data-tab-content="objectives">
        <div class="settings-section">
          <h3>Objectifs (max ${MAX_OBJECTIVES})</h3>
          <div class="checkbox-group" data-objectives-group>
            ${OBJECTIVE_OPTIONS.map((opt) => {
              const checked = objectives.includes(opt.value);
              const disabled = !checked && objectivesLocked;
              return `<label class="checkbox-item ${disabled ? "disabled" : ""}">
                <input type="checkbox" name="objectives" value="${opt.value}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}>
                ${opt.label}
              </label>`;
            }).join("")}
          </div>
          <div data-objectives-hint style="font-size:12px;color:var(--secondary-text-color,#aeb7c5);margin-top:8px">${objectivesLocked ? "Maximum " + MAX_OBJECTIVES + " objectifs." : ""}</div>
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
          <h3 style="margin-top:16px">Répartition cible (G/L/P)</h3>
          <div class="row">
            <label>Protéines (%)
              <input name="protein_pct" type="number" min="0" max="100" value="${macros.protein_pct ?? 30}">
            </label>
            <label>Glucides (%)
              <input name="carb_pct" type="number" min="0" max="100" value="${macros.carb_pct ?? 45}">
            </label>
            <label>Lipides (%)
              <input name="fat_pct" type="number" min="0" max="100" value="${macros.fat_pct ?? 25}">
            </label>
          </div>
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

    // Equipment: two-column grid, preferred only if available, at most one preferred
    overlay.querySelectorAll("[data-equip-available]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const value = cb.dataset.equipAvailable;
        const radio = overlay.querySelector(`[data-equip-preferred="${value}"]`);
        const radioLabel = radio?.closest("label");
        if (radio) {
          radio.disabled = !cb.checked;
          radioLabel?.classList.toggle("disabled", !cb.checked);
          if (!cb.checked && radio.checked) {
            radio.checked = false;
          }
        }
      });
    });

    // History slider live display
    const historySlider = overlay.querySelector("[name='history_days_for_generation']");
    const historyDisplay = overlay.querySelector("[data-history-display]");
    if (historySlider && historyDisplay) {
      historySlider.addEventListener("input", () => {
        historyDisplay.textContent = `Historique pris en compte : ${historySlider.value} jours`;
      });
    }

    // Objectives: max 3
    const objectivesCheckboxes = overlay.querySelectorAll("[name='objectives']");
    const objectivesHint = overlay.querySelector("[data-objectives-hint]");
    const enforceObjectivesLimit = () => {
      const checkedCount = Array.from(objectivesCheckboxes).filter((cb) => cb.checked).length;
      objectivesCheckboxes.forEach((cb) => {
        const disable = !cb.checked && checkedCount >= MAX_OBJECTIVES;
        cb.disabled = disable;
        cb.closest("label")?.classList.toggle("disabled", disable);
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
        this._toast("Cartes et historique vidés.");
      } catch (error) {
        this._toast(error?.message || "Impossible de vider les données.");
      }
    });

    // Form submit
    overlay.querySelector("#settings-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const result = this._collectSettingsForm(overlay);
      if (result.error) {
        this._toast(result.error);
        return;
      }

      this._settingsDraft.preferences = result.preferences;
      this._settingsDraft.generation_rules = result.rules;

      try {
        await this._ws({ type: "a_table/update_preferences", preferences: this._settingsDraft.preferences });
        await this._ws({ type: "a_table/update_generation_rules", rules: this._settingsDraft.generation_rules });
        this._closeModal();
        await this._load();
        this._toast("Paramètres enregistrés.");
      } catch (error) {
        this._toast(error?.message || "Enregistrement impossible.");
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
    let preferredEquipment = String(data.get("preferred_equipment_radio") || "") || null;
    if (preferredEquipment && !availableEquipment.includes(preferredEquipment)) {
      preferredEquipment = null;
    }

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
      preferred_equipment: preferredEquipment,
      objectives,
      budget_per_serving: data.get("budget_per_serving") ? Number(data.get("budget_per_serving")) : null,
      grocery_store: String(data.get("grocery_store") || ""),
      time_profile: String(data.get("time_profile") || "normal"),
      complexity: String(data.get("complexity") || "free"),
      history_days_for_generation: Number(data.get("history_days_for_generation") || 20),
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
    };

    return { preferences, rules };
  }

  _toast(message) {
    this.shadowRoot.querySelector(".toast")?.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    this.shadowRoot.append(toast);
    setTimeout(() => toast.remove(), 3600);
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
