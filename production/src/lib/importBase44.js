/* ============================================================================
   importBase44 — shared, framework-free recipe import + tagging logic.

   Extracted VERBATIM from the prototype (src/App.jsx) so the app UI and the
   one-off recipe import script (scripts/import-recipes.mjs) run the EXACT same
   transformation. Do not fork this logic; both sides import from here.
   ============================================================================ */

const ingMap = (ings) => Object.fromEntries(ings.map((i) => [i.id, i]));

/* keyword -> allergen, derived from ingredient names. best-effort suggestion only. */
const ALLERGEN_KEYWORDS = {
  Gluten: ["flour","wheat","bread","semolina","barley","rye","oat","breadcrumb","pasta","couscous","biscuit","pastry","malt"],
  Eggs: ["egg","yolk","mayonnaise","mayo","meringue"],
  Milk: ["milk","butter","cheese","cream","yoghurt","yogurt","labneh","ghee","mascarpone","buttermilk","margarine"],
  Nuts: ["almond","walnut","hazelnut","pecan","pistachio","cashew","nut "],
  Peanuts: ["peanut"],
  Sesame: ["sesame","tahini","tahina"],
  Soya: ["soy","soya","tofu","edamame","miso"],
  Fish: ["salmon","tuna","cod","herring","anchovy","fish"],
  Crustaceans: ["prawn","shrimp","crab","lobster","langoustine"],
  Molluscs: ["mussel","clam","oyster","squid","octopus","scallop"],
  Celery: ["celery","celeriac"],
  Mustard: ["mustard"],
  Lupin: ["lupin"],
  "Sulphur Dioxide": ["sulphur","sulphite","sulfite","dried apricot","glace cherry"],
};
const MEAT_KEYWORDS = ["chicken","beef","lamb","pork","veal","turkey","duck","sausage","schnitzel","mince","goujon","thigh","wing","bacon","ham","chixken"];
const FISH_KEYWORDS = ["salmon","tuna","cod","herring","anchovy","fish","prawn","shrimp","crab"];
const DAIRY_KEYWORDS = ["milk","butter","cheese","cream","yoghurt","yogurt","labneh","ghee","mascarpone","buttermilk"];
const NONVEG_KEYWORDS = [...MEAT_KEYWORDS, ...FISH_KEYWORDS, "gelatin","gelatine","lard"];

function detectTags(recipeIngredients, ings) {
  const m = ingMap(ings);
  const names = recipeIngredients.map((ri) => (m[ri.ingId]?.name || "").toLowerCase());
  const blob = names.join(" | ");
  const has = (kws) => kws.some((k) => blob.includes(k));

  const allergens = [];
  for (const [allg, kws] of Object.entries(ALLERGEN_KEYWORDS)) if (has(kws)) allergens.push(allg);

  const meaty = has(MEAT_KEYWORDS) || has(FISH_KEYWORDS);
  const hasNonVeg = has(NONVEG_KEYWORDS);
  const hasDairy = has(DAIRY_KEYWORDS) || allergens.includes("Milk");
  const hasEgg = allergens.includes("Eggs");

  const dietary = [];
  if (meaty) dietary.push("Meaty");
  if (!hasNonVeg) dietary.push("Vegetarian");
  if (!hasNonVeg && !hasDairy && !hasEgg) dietary.push("Vegan");
  if (!hasDairy) dietary.push("Non-Dairy");

  return { allergens, dietary };
}

/* find or create an ingredient id by name; mutates an ingredients array copy */
function resolveIngredient(ings, name, unit) {
  const key = (name || "").trim().toLowerCase();
  let found = ings.find((i) => i.name.trim().toLowerCase() === key);
  if (found) return found.id;
  const id = "ing_" + key.replace(/[^a-z0-9]+/g, "_").slice(0, 24) + "_" + Math.random().toString(36).slice(2, 5);
  ings.push({ id, name: (name || "Unnamed").trim(), unit: unit || "kg", cost: 0 });
  return id;
}

/* auto-match: for a method step string, return the recipe ingredients whose
   name appears in that step text. */
function matchIngredientsToStep(stepText, recipeIngredients, ings) {
  const m = ingMap(ings);
  const t = (stepText || "").toLowerCase();
  const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return recipeIngredients.filter((ri) => {
    const nm = (m[ri.ingId]?.name || "").toLowerCase();
    if (!nm) return false;
    const words = nm.split(/\s+/);
    return t.includes(nm) || words.some((w) => w.length > 3 && new RegExp(`\\b${esc(w)}\\b`).test(t));
  });
}

/* import one Base44 recipe (schema shape) -> internal recipe; pushes any new
   ingredients into `ings`. Returns the internal recipe object. */
function importBase44Recipe(raw, ings) {
  // recipe-level ingredient list
  const recipeIngredients = (raw.ingredients || []).map((ig) => ({
    ingId: resolveIngredient(ings, ig.name, ig.unit),
    qty: Number(ig.quantity) || 0,
  }));
  // build steps from the plain method strings, auto-matching ingredients
  const methodArr = Array.isArray(raw.method) ? raw.method : (raw.method ? [String(raw.method)] : []);
  const matchedIds = new Set();
  let steps = methodArr.map((line, idx) => {
    const text = String(line).replace(/^\s*\d+[\).\s-]*/, "").trim();
    const use = matchIngredientsToStep(line, recipeIngredients, ings);
    use.forEach((u) => matchedIds.add(u.ingId));
    const wait = isWaitStep(text);
    const step = { text, use, image: (raw.images?.process?.[idx]) || null, isTimed: wait };
    // timerSec drives the countdown when isTimed; estimate still informs expected total
    step.timerSec = wait ? waitStepSec(text) : 0;
    step.estSec = estimateStepSec(step, ings); // used for expected-time totals
    return step;
  });
  // ingredients never mentioned in any step: attach to step 1 so nothing is missed
  const unmatched = recipeIngredients.filter((ri) => !matchedIds.has(ri.ingId));
  if (steps.length === 0) steps = [{ text: "Combine all ingredients.", use: recipeIngredients, image: null, isTimed: false, timerSec: 0, estSec: 60 }];
  else if (unmatched.length) steps[0] = { ...steps[0], use: [...unmatched, ...steps[0].use] };

  const expectedSec = steps.reduce((a, s) => a + (s.isTimed ? s.timerSec : (s.estSec || 0)), 0);
  const detected = detectTags(recipeIngredients, ings);
  // merge any allergen tags that were already in the source with detected ones
  const allergens = Array.from(new Set([...(raw.allergen_tags || []), ...detected.allergens]));
  // map free-text department to the two service lanes
  const deptRaw = (raw.department || "").toLowerCase();
  const dept2 = /(service|kitchen|prep|front)/.test(deptRaw) ? "Service" : "Production";
  return {
    id: "r_" + (raw.title || "recipe").toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 28) + "_" + Math.random().toString(36).slice(2, 5),
    name: raw.title || "Untitled",
    category: raw.category || "",
    department: raw.department || "",
    dept2,
    notes: raw.notes || "",
    allergens,
    dietary: detected.dietary,
    images: raw.images || null,
    hero: raw.images?.thumbnail || raw.images?.final?.[0] || null,
    yieldKg: 10, yieldUnit: "kg", // schema has no yield; default, editable in builder
    steps,
    expectedSec,
  };
}

/* parse a pasted/uploaded JSON blob (object or array) into internal recipes */
function importBase44Json(text, baseIngredients) {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : (data.recipes && Array.isArray(data.recipes) ? data.recipes : [data]);
  const ings = baseIngredients.map((i) => ({ ...i }));
  const recipes = arr
    .filter((r) => r && (r.title || r.name) && (r.ingredients || r.method))
    .map((r) => importBase44Recipe({ ...r, title: r.title || r.name }, ings));
  return { recipes, ingredients: ings };
}

/* realistic non-zero time estimate for a step, from its action words + ingredients */
function estimateStepSec(step, ingredients) {
  const m = ingMap(ingredients);
  const text = (step.text || "").toLowerCase();
  const use = step.use || [];
  // handling time: base per ingredient + scaled by amount
  const handling = use.reduce((sum, u) => {
    const unit = m[u.ingId]?.unit || "kg";
    const qty = u.qty || 0;
    let perAmount = 0;
    if (unit === "kg") perAmount = qty * 12;
    else if (unit === "g") perAmount = (qty / 1000) * 12;
    else if (unit === "L") perAmount = qty * 8;
    else if (unit === "ml") perAmount = (qty / 1000) * 8;
    else perAmount = qty * 3;
    return sum + 20 + Math.min(perAmount, 240);
  }, 0);
  // For a genuine wait step, the recommendation IS the wait time.
  if (isWaitStep(text)) return waitStepSec(text);
  // Otherwise it's active work: recommendation = handling + a little base,
  // capped so it stays a sensible guide (active steps rarely need >12 min).
  const active = /(knead|mix|beat|whisk|cream|fold|roll|shape|divide|portion|pipe|spread|assemble|cut|chop|peel|grate|whip)/.test(text) ? 240 : 0;
  return Math.max(30, Math.min(720, Math.round(handling + active + 30)));
}

/* genuine WAIT steps that need a live countdown — only when the step clearly
   means "set a timer and wait": an explicit duration, or proof/bake/chill/boil
   with a number. Vague phrases like "rest for a while" do NOT qualify; they get
   a quiet target-time recommendation instead. */
function isWaitStep(text) {
  const t = (text || "").toLowerCase();
  // must contain an explicit duration to be a real countdown
  const hasDuration = /([\d.]+)\s*(h|hour|hours|hr|m|min|mins|minute|minutes|sec|secs|second|seconds)\b/.test(t);
  const waitVerb = /(prove|proof|prov|rise|ferment|bake|oven|roast|boil|simmer|chill|cool|fridge|refrigerat|marinat|soak|infuse|defrost|thaw|set in|leave to set|leave for)/.test(t);
  // real countdown only when there's a wait verb AND an explicit duration
  return waitVerb && hasDuration;
}
/* explicit duration in seconds parsed from text, else 0 */
function parsedDurationSec(text) {
  const t = (text || "").toLowerCase();
  const hr = t.match(/([\d.]+)\s*(h|hour|hours|hr)\b/);
  if (hr) return Math.round(parseFloat(hr[1]) * 3600);
  const min = t.match(/([\d.]+)\s*(m|min|mins|minute|minutes)\b/);
  if (min) return Math.round(parseFloat(min[1]) * 60);
  const sec = t.match(/([\d.]+)\s*(sec|secs|second|seconds)\b/);
  if (sec) return Math.round(parseFloat(sec[1]));
  return 0;
}
/* suggested wait duration for a confirmed wait step */
function waitStepSec(text) {
  const explicit = parsedDurationSec(text);
  if (explicit) return explicit;
  const t = (text || "").toLowerCase();
  if (/(prove|proof|rise|ferment)/.test(t)) return 1800;
  if (/(bake|oven|roast)/.test(t)) return 1200;
  if (/(boil|simmer)/.test(t)) return 480;
  if (/(chill|cool|fridge|refrigerat|set in)/.test(t)) return 1800;
  return 600;
}


export {
  ingMap,
  ALLERGEN_KEYWORDS, MEAT_KEYWORDS, FISH_KEYWORDS, DAIRY_KEYWORDS, NONVEG_KEYWORDS,
  detectTags,
  resolveIngredient,
  matchIngredientsToStep,
  importBase44Recipe,
  importBase44Json,
  estimateStepSec,
  isWaitStep,
  parsedDurationSec,
  waitStepSec,
};
