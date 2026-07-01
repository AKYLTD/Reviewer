import React, { useState, useEffect, useRef, useCallback } from "react";
// Recipe import + tagging logic lives in a shared, framework-free module so the
// app and the one-off import script run the exact same transformation.
import {
  ingMap,
  detectTags,
  estimateStepSec,
  waitStepSec,
  importBase44Json,
} from "./lib/importBase44.js";
// Persistence layer (Supabase). The UI keeps its in-memory shapes; db.js maps
// them to/from the database and exposes the reads/writes the App needs.
import {
  loadAll, loadStaff, upsertRows, deleteByIds, saveSingleton, verifyPin as dbVerifyPin,
  persistProduction, persistCancellation, clearQueueForLocation, resetAllStock,
  scheduleSync, queueUpsert, setSyncErrorHandler,
  ingToRow, recToRow, staffToRow, locToRow,
} from "./lib/db.js";

/* ============================================================================
   PROOF·FLOOR v4 — Roni's Bakery production manager
   - Poppins (rounded geometric sans) to match the Roni's site
   - Base yield with unit choice (kg / boxes / units / slices)
   - Per-METHOD ingredients (each step has its own ingredient list + instruction)
   - Image per method step + hero image for the finished product
   - No emoji icons anywhere (clean numbers/labels)
   - Editable staff hourly rate
   - CPU (central production unit) address
   - Locations page: store address + distance + drive time -> delivery cost
     which folds into each run's total cost
   ========================================================================== */

const fmtMoney = (n) => "£" + (n || 0).toFixed(2);
const fmtClock = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
// Human duration: "2h 05m" / "45m" / "30s" — used for how long a production took.
const fmtDur = (sec) => {
  sec = Math.max(0, Math.round(sec || 0));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m) return `${m}m`;
  return `${s}s`;
};
const uid = (p = "id") => p + Math.random().toString(36).slice(2, 9);

const UNITS = ["kg", "litres", "boxes", "units", "slices"];
const ING_UNITS = ["g", "kg", "ml", "L", "unit", "slice", "slices", "piece", "portion", "spoon", "scoop", "tbsp", "tsp", "pinch", "handful", "bunch", "leaf", "clove", "drizzle", "to taste"]; // ingredient + service measurements
const DRIFT_THRESHOLD_SEC = 60; // alert admin if rolling avg drifts from set time by this much

const C = {
  cream: "#EDE4D3", card: "#F7F1E6", cardSoft: "#FBF7EF", ink: "#3A2A1E", inkSoft: "#7A6A58",
  rust: "#C9543B", rustDeep: "#A8412C", gold: "#E8A93C", goldSoft: "#F2C66B", line: "#DCCBB2", go: "#3F7D4F", white: "#fff",
};

/* ---------- seed data ---------- */
const ADMIN_USER = { id: "admin", name: "Admin", pin: "0712", role: "admin", wage: 0 };
const STAFF0 = [
  { id: "u1", name: "Marco", pin: "1234", wage: 14.5, role: "production" },
  { id: "u2", name: "Aylin", pin: "2222", wage: 13.0, role: "production" },
  { id: "u3", name: "Tomas", pin: "3333", wage: 15.5, role: "production" },
  { id: "d1", name: "Driver Sam", pin: "9999", wage: 12.0, role: "driver" },
];

const INGREDIENTS0 = [
  { id: "flour", name: "White bread flour", unit: "kg", cost: 0.95 },
  { id: "water", name: "Water", unit: "L", cost: 0.0 },
  { id: "yeast", name: "Fresh yeast", unit: "kg", cost: 4.2 },
  { id: "salt", name: "Sea salt", unit: "kg", cost: 1.1 },
  { id: "malt", name: "Barley malt", unit: "kg", cost: 3.8 },
  { id: "sugar", name: "Caster sugar", unit: "kg", cost: 1.3 },
  { id: "butter", name: "Butter", unit: "kg", cost: 7.5 },
  { id: "eggs", name: "Eggs", unit: "unit", cost: 0.18 },
  { id: "sesame", name: "Sesame seeds", unit: "kg", cost: 5.6 },
];

/* Recipes now: yieldUnit; each step carries its own `use` (ingredients) + optional image.
   Top-level `items` is derived from the union of step ingredients for costing. */
const RECIPES0 = [
  {
    id: "r1", name: "Plain Bagels", yieldKg: 10, yieldUnit: "kg", hero: null, expectedSec: 4860,
    steps: [
      { text: "Add flour, salt and malt to the mixer bowl.", image: null, use: [{ ingId: "flour", qty: 6 }, { ingId: "salt", qty: 0.12 }, { ingId: "malt", qty: 0.2 }] },
      { text: "Dissolve the yeast in the water, then pour in.", image: null, use: [{ ingId: "yeast", qty: 0.12 }, { ingId: "water", qty: 3.4 }] },
      { text: "Add sugar. Mix on low, then medium until smooth.", image: null, use: [{ ingId: "sugar", qty: 0.3 }], timerSec: 600 },
      { text: "Rest the dough, covered.", image: null, use: [], timerSec: 1200 },
      { text: "Divide, shape into rings, then proof.", image: null, use: [] , timerSec: 900 },
      { text: "Boil 45 seconds per side, then bake at 220°C.", image: null, use: [], timerSec: 1080 },
    ],
  },
  {
    id: "r2", name: "Challah", yieldKg: 8, yieldUnit: "units", hero: null, expectedSec: 5460,
    steps: [
      { text: "Whisk eggs, sugar and water together.", image: null, use: [{ ingId: "eggs", qty: 0.8 }, { ingId: "sugar", qty: 0.5 }, { ingId: "water", qty: 1.6 }] },
      { text: "Add flour, yeast and salt; mix to a shaggy dough.", image: null, use: [{ ingId: "flour", qty: 4.5 }, { ingId: "yeast", qty: 0.1 }, { ingId: "salt", qty: 0.08 }] },
      { text: "Add soft butter, knead until glossy.", image: null, use: [{ ingId: "butter", qty: 0.4 }], timerSec: 480 },
      { text: "First proof, covered.", image: null, use: [], timerSec: 2700 },
      { text: "Braid, egg-wash, top with sesame.", image: null, use: [{ ingId: "sesame", qty: 0.15 }] },
      { text: "Second proof, then bake at 190°C.", image: null, use: [], timerSec: 1500 },
    ],
  },
];

/* Locations: CPU is origin; stores have distance + drive time from CPU. */
const CPU0 = { name: "Roni's CPU", address: "Unit 4, Cricklewood Trading Estate, London NW2" };
const LOCATIONS0 = [
  { id: "belsize", name: "Ronis Belsize", address: "Belsize Lane, London NW3", distanceMi: 4.2, driveMin: 18 },
  { id: "sjw", name: "Ronis SJW", address: "Circus Road, St John's Wood NW8", distanceMi: 3.1, driveMin: 14 },
];
/* delivery cost model (editable in admin) */
const DELIVERY0 = { perMile: 1.10, perHour: 12.0 };

/* derive recipe ingredient totals from steps for costing */
function recipeItems(recipe) {
  const tot = {};
  recipe.steps.forEach((s) => (s.use || []).forEach((u) => { tot[u.ingId] = (tot[u.ingId] || 0) + u.qty; }));
  return Object.entries(tot).map(([ingId, qty]) => ({ ingId, qty }));
}
function recipeCost(recipe, ings) {
  const m = ingMap(ings);
  return recipeItems(recipe).reduce((s, it) => s + (m[it.ingId] ? m[it.ingId].cost * it.qty : 0), 0);
}
function deliveryCost(loc, delivery) {
  if (!loc) return 0;
  return (loc.distanceMi || 0) * delivery.perMile + ((loc.driveMin || 0) / 60) * delivery.perHour;
}

/* ===== Square-ready stock hook =====
   When Square is connected later, a sale at a location calls deductSold to
   subtract sold quantities from that location's live stock. Production ADDS,
   sales SUBTRACT, so the floor always sees what's left. Stubbed until Square. */
function deductSold(storeStock, location, recipeName, qtySold) {
  const next = { ...storeStock };
  next[location] = { ...(next[location] || {}) };
  const current = next[location][recipeName] || 0;
  next[location][recipeName] = Math.max(0, +(current - qtySold).toFixed(2));
  return next;
}
// NOTE for Square integration: map each Square catalog item -> recipeName + location,
// then on a completed sale webhook call deductSold(...) per line item.

const ALLERGENS = ["Celery","Gluten","Crustaceans","Eggs","Fish","Lupin","Milk","Molluscs","Mustard","Peanuts","Sesame","Soya","Sulphur Dioxide","Nuts"];
const CATEGORIES = ["Biscuit","Cake","Pastry","Dough","Filling","Traybake"];
// Service-side categories (for the S.Book). Categories are free-text, so any can be
// typed in the builder; these are just the quick suggestions.
const SERVICE_CATEGORIES = ["Sandwich","Salad","Breakfast","Hot food","Soup","Quiche","Bagel","Pastry","Cake","Drink","Other"];
const ALL_CATEGORIES = Array.from(new Set([...CATEGORIES, ...SERVICE_CATEGORIES]));
const DIETARY = ["Vegetarian","Vegan","Meaty","Non-Dairy"];


function useVoice(onCommand, enabled) {
  const recRef = useRef(null);
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);
    const rec = new SR();
    rec.continuous = true; rec.interimResults = false; rec.lang = "en-GB";
    rec.onresult = (e) => onCommand(e.results[e.results.length - 1][0].transcript.trim().toLowerCase());
    rec.onend = () => { if (enabled) { try { rec.start(); } catch {} } };
    recRef.current = rec;
    return () => { try { rec.stop(); } catch {} };
  }, [onCommand, enabled]);
  useEffect(() => { const rec = recRef.current; if (!rec) return; if (enabled) { try { rec.start(); } catch {} } else { try { rec.stop(); } catch {} } }, [enabled]);
  return { supported };
}
function useHold(onTap, onHold) {
  const timer = useRef(null); const held = useRef(false);
  const start = () => { held.current = false; timer.current = setTimeout(() => { held.current = true; onHold(); }, 450); };
  const end = () => { clearTimeout(timer.current); if (!held.current) onTap(); };
  const cancel = () => clearTimeout(timer.current);
  return { onMouseDown: start, onMouseUp: end, onMouseLeave: cancel, onTouchStart: (e) => { e.preventDefault(); start(); }, onTouchEnd: (e) => { e.preventDefault(); end(); } };
}
/* read an uploaded image file to a data URL */
function readImage(file, cb) { const r = new FileReader(); r.onload = () => cb(r.result); r.readAsDataURL(file); }
/* Downscale + re-encode an image (data URL or http URL) so it isn't stored full
   size in the database — keeps rows small so the app stays fast and cheap. */
function compressDataUrl(src, cb, maxDim = 1200, quality = 0.72) {
  if (!src) { cb(src); return; }
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    try {
      let { width: w, height: h } = img;
      if (w > maxDim || h > maxDim) { const s = maxDim / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      cb(canvas.toDataURL("image/jpeg", quality));
    } catch { cb(src); } // cross-origin taint etc. — keep original
  };
  img.onerror = () => cb(src);
  img.src = src;
}
/* Read an uploaded file and store a compressed version. */
function readImageCompressed(file, cb) { const r = new FileReader(); r.onload = () => compressDataUrl(r.result, cb); r.readAsDataURL(file); }

const BASE44_RECIPES = [{"title": "CHICKEN SOUP", "category": "Traybake", "department": "Production", "ingredients": [{"name": "Chixken wings", "unit": "kg", "quantity": 1.8}], "method": ["Boil chixken wings for 1.5H"], "notes": "", "allergen_tags": [], "images": {"final": [], "ingredients": [], "thumbnail": "", "process": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/3dc172493_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2220.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/a3f33dcc4_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2235.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/dbbfb7da4_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2242.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/15dcf1d0c_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2244.jpg"]}}, {"title": "Babka Cake", "category": "Cake", "department": "Pastry", "ingredients": [{"name": "Flour", "unit": "kg", "quantity": 2.5}, {"name": "Yolk eggs", "unit": "", "quantity": 10.0}, {"name": "Cold water", "unit": "L", "quantity": 1.2}, {"name": "Sugar", "unit": "g", "quantity": 350.0}, {"name": "Salt", "unit": "tbsp", "quantity": 1.0}, {"name": "Yeast", "unit": "g", "quantity": 85.0}, {"name": "Pastry Margarine", "unit": "kg", "quantity": 1.5}], "method": ["Mix all ingredients { no Marg } until smooth and the side of mixer bowl is clean. Aprox 8 mins", "Use 1.5kg of margarine for 4.5kg of pastry roll and fold 3x single fold. Allow to rest for a while, then roll out and use. store the pastry in a fridge or cool place as it rise so quickly"], "notes": "", "allergen_tags": [], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/b78ecf371_edited-image.jpg", "process": []}}, {"title": "Tahini biscuits", "category": "Biscuit", "department": "Pastry", "ingredients": [{"name": "Margarine", "unit": "g", "quantity": 600.0}, {"name": "Raw Tahini", "unit": "g", "quantity": 700.0}, {"name": "Brown sugar", "unit": "g", "quantity": 600.0}, {"name": "Ground almond", "unit": "kg", "quantity": 1.2}], "method": ["Put all  ingredients in mixer and mix together", "Take out and start portioning on try ready to bake", "Add sprinkle of sesame seed on top", "Bake for 10 mins on 150C"], "notes": "", "allergen_tags": ["Sesame", "Nuts"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/41f10f3e3_IMG_7408.jpeg", "process": []}}, {"title": "Coconut Macaroon", "category": "Biscuit", "department": "Pastry", "ingredients": [{"name": "Coconut", "unit": "kg", "quantity": 1.2}, {"name": "Granulated Sugar", "unit": "kg", "quantity": 1.0}, {"name": "Macaroon paste", "unit": "g", "quantity": 350.0}, {"name": "Eggs whites", "unit": "L", "quantity": 1.2}], "method": ["Add to the mixer sugar, macaroon paste, and coconut. mix for 5 mins on speed 1", "add egg whites to the mix and keep mixing for 5 to 8 mins on speed 2", "take out of mixer and start portioning on try ready to bake", "Bake on 150C for 14 mins"], "notes": "", "allergen_tags": ["Eggs"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/9571f2f79_IMG_0321.jpeg", "process": []}}, {"title": "Salmon bagel", "category": "Filling", "department": "Kitchen Service", "ingredients": [{"name": "Bagel", "unit": "", "quantity": 1.0}, {"name": "Cream Cheese", "unit": "g", "quantity": 18.0}, {"name": "Smoked Salmon", "unit": "g", "quantity": 50.0}], "method": ["Slice the bagels in half and toasted if required", "Spread the cream cheese then add Salmon", "Close the bagel and presented on plate as required in the service book"], "notes": "", "allergen_tags": ["Gluten", "Milk", "Fish"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/36fad8e54_edited-image.jpg", "process": []}}, {"title": "Bagel", "category": "Dough", "department": "Bakery", "ingredients": [{"name": "Bagel flour", "unit": "kg", "quantity": 16.0}, {"name": "Malt flour", "unit": "g", "quantity": 450.0}, {"name": "Yeast", "unit": "g", "quantity": 110.0}, {"name": "White sugar", "unit": "kg", "quantity": 1.0}, {"name": "Salt", "unit": "g", "quantity": 220.0}, {"name": "Water", "unit": "L", "quantity": 6.2}], "method": ["Add all ingredients to the mixer", "Mix on slaw mixing for 2 mins then fast mixing for 10mins then 2 mins again before finish", "Take the dough out of the mixer on prepared table", "Cover the dough for 4 mins then start making the bagels and put it nicely on the wood trays ready to bake", "Once finished leave the bagels out of the fridge to prove for about 30mins then put in the fridge", "Take t5he bagels out of the fridge half an hour before baking", "Prepare the boiler to very hot water / get the oven ready to bake [450F / maxim top heat / 0 bottom heat]", "Start boiling the bagels to get to the right size for about 1min \nTake the  bagels of the water and wash with cold water to cool down \nPlaced the bagels on the woods upside down then put in the oven with the wood\nLeave it in the oven until dry [ about 2 mins or less]\n\nBake for about 12 mins"], "notes": "", "allergen_tags": ["Gluten", "Sesame"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/e85d62a8c_IMG_7138.jpeg", "process": []}}, {"title": "Chollah", "category": "Dough", "department": "Bakery", "ingredients": [{"name": "White flour", "unit": "kg", "quantity": 16.0}, {"name": "white sugar", "unit": "kg", "quantity": 1.5}, {"name": "Veg oil", "unit": "L", "quantity": 1.5}, {"name": "Eggs", "unit": "", "quantity": 15.0}, {"name": "Yeast", "unit": "g", "quantity": 475.0}, {"name": "Warm water", "unit": "L", "quantity": 6.5}, {"name": "Salt", "unit": "g", "quantity": 220.0}], "method": ["Add all the ingredients to the mixer except salt and start slaw mixing for 4 mins", "add the salt and keep mixing on high speed for 10 mins until smooth dough", "Take the dough out and start portions 550G each challah", "Make the shapes of challah then nicely put on trays ready to bake", "Keep the challah dough out of the fridge to prove then in the fridge", "Take out of the fridge half an hour before baking", "Bake for 20 to 25 mins in stone bake oven {350F /6 top heat/ 2 bottom heat}"], "notes": "", "allergen_tags": ["Eggs", "Gluten", "Sesame"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/8d3e0edc4_IMG_7015.jpeg", "process": []}}, {"title": "Cinnamon Buns", "category": "Pastry", "department": "Pastry", "ingredients": [{"name": "Flour", "unit": "kg", "quantity": 2.5}, {"name": "Egg Yolk", "unit": "", "quantity": 10.0}, {"name": "Sugar", "unit": "g", "quantity": 350.0}, {"name": "Yeast", "unit": "g", "quantity": 85.0}, {"name": "Water cold", "unit": "L", "quantity": 1.2}, {"name": "Pastry margerine", "unit": "kg", "quantity": 1.5}], "method": ["Mix all ingredients together", "Add the Margrine to the dough and fold, double, double and single. To no.3.", "Spread the Cinnamon paste", "Cut first and roll"], "notes": "Cinnamon paste - 100g cake margarine, 2xL spoons Cinnamon, 80g brown sugar", "allergen_tags": [], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/2d699b713_edited-image.jpg", "process": []}}, {"title": "Sufganyot / Donuts", "category": "Pastry", "department": "Pastry", "ingredients": [{"name": "Flour", "unit": "kg", "quantity": 3.0}, {"name": "Margarine", "unit": "g", "quantity": 400.0}, {"name": "Eggs", "unit": "unit", "quantity": 10.0}, {"name": "Fresh Yeast", "unit": "g", "quantity": 150.0}, {"name": "Sugar", "unit": "g", "quantity": 400.0}, {"name": "Salt", "unit": "tbsp", "quantity": 3.0}, {"name": "Water", "unit": "L", "quantity": 1.2}, {"name": "Vanilla", "unit": "tbsp", "quantity": 2.0}], "method": ["Mix all ingridient together. Mix for 10 to 15 minutes", "Cut 50g portions. And make balls and orgenise on white proving trays", "Leave to prove until double in size", "Heat Oil to 160 degrees", "Fry"], "notes": "", "allergen_tags": [], "images": {"thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/e5660c60d_87508.jpg", "ingredients": [], "process": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/b1f31a95a_87500.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/eddeb0d8a_87503.jpg"], "final": []}}, {"title": "Eggmayo", "category": "Filling", "department": "Prep", "ingredients": [{"name": "Boiled eggs", "unit": "unit", "quantity": 60.0}, {"name": "Mayonnaise", "unit": "g", "quantity": 250.0}, {"name": "Chives", "unit": "bunch", "quantity": 1.0}], "method": ["Boiled 60 eggs for 12 min from boiling", "Cool in cold water", "Chopped chives", "Slice eggs vertical and horizontal", "Add mayonnaise and mix all"], "notes": "", "allergen_tags": ["Eggs", "Mustard", "Milk", "Sulphur Dioxide"], "images": {"thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/69652ed2e_17592256220114315519706092217085.jpg", "ingredients": [], "process": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/7c7952a16_1759223464087951881703780840923.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/af02b1c79_17592234910057620637918516183743.jpg"], "final": []}}, {"title": "Quiche Dough", "category": "Dough / Base", "department": "Prep", "ingredients": [{"name": "Flour", "unit": "g", "quantity": 1000.0}, {"name": "Margarine", "unit": "g", "quantity": 250.0}, {"name": "Salt", "unit": "g", "quantity": 10.0}, {"name": "Cold Water", "unit": "g", "quantity": 300.0}], "method": ["Mix flour, margarine, salt & water in large bowl.", "Mix well until dough forms.", "Rest in fridge for at least 2 hours."], "notes": "Must rest in fridge for at least 2 hours before use", "allergen_tags": ["Gluten"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/a72c25d68_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2160.jpg", "process": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/709e09fb0_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2200.jpg"]}}, {"title": "Quiche Filling (Example)", "category": "Filling / Bake", "department": "Prep", "ingredients": [{"name": "Eggs (beaten)", "unit": "unit", "quantity": 9.0}, {"name": "Milk", "unit": "ml", "quantity": 100.0}, {"name": "Sundried Tomato", "unit": "g", "quantity": 50.0}, {"name": "Fresh Broccoli", "unit": "g", "quantity": 150.0}], "method": ["Spread veg on quiche base.", "Cover with egg & milk mix.", "Bake at 165°C for 40 min."], "notes": "Any vegetables may be used for filling", "allergen_tags": ["Eggs", "Milk"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/068157ddb_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_2143.jpg", "process": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/78447d563_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2151.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/9bc54a35c_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2153.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/791987df1_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2158.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/b36effbf3_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2160.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/ce730cba4_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2161.jpg"]}}, {"title": "Moroccan Omelette", "category": "Bake / Protein", "department": "Prep", "ingredients": [{"name": "Potatoes (boiled, mashed)", "unit": "unit", "quantity": 6.0}, {"name": "Frozen Peas", "unit": "g", "quantity": 150.0}, {"name": "Carrots (cooked, cubed)", "unit": "unit", "quantity": 3.0}, {"name": "Eggs (boiled, cubed)", "unit": "unit", "quantity": 2.0}, {"name": "Parsley (chopped)", "unit": "g", "quantity": 30.0}, {"name": "Dill (chopped)", "unit": "g", "quantity": 30.0}, {"name": "Coriander (chopped)", "unit": "g", "quantity": 30.0}, {"name": "Soup Powder (kosher)", "unit": "g", "quantity": 15.0}, {"name": "Turmeric", "unit": "g", "quantity": 7.0}, {"name": "Salt", "unit": "g", "quantity": 15.0}, {"name": "Black Pepper", "unit": "g", "quantity": 7.0}, {"name": "Eggs (beaten)", "unit": "unit", "quantity": 10.0}], "method": ["Mix potatoes with all ingredients.", "Heat 2 tbsp oil in pot, pour mixture in.", "Cook uncovered 5 min, cover & cook 5 min more.", "Transfer to oven, bake 200°C for 40 min."], "notes": "", "allergen_tags": ["Eggs", "Celery"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/c66ad014d_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_1974.jpg", "process": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/598807c64_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_1981.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/ef722fdb7_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_1989.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/3bd81ae12_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_1993.jpg"]}}, {"title": "Harissa", "category": "Sauce", "department": "Prep", "ingredients": [{"name": "Red Peppers", "unit": "g", "quantity": 750.0}, {"name": "Rose harissa", "unit": "g", "quantity": 400.0}, {"name": "Fresh garlic", "unit": "g", "quantity": 75.0}, {"name": "Cracked chilli", "unit": "g", "quantity": 60.0}, {"name": "Salt", "unit": "g", "quantity": 60.0}, {"name": "Sugar", "unit": "g", "quantity": 50.0}, {"name": "Coriander powder", "unit": "g", "quantity": 40.0}, {"name": "Chopped tomatoes", "unit": "unit", "quantity": 1.0}], "method": ["Blend all ingredients to smooth paste.", "Add oil if too thick."], "notes": "Add oil if consistency is too thick", "allergen_tags": [], "images": {"thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/dc036bfb9_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_2045.jpg", "ingredients": [], "process": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/8134ee112_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_2061.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/0803f21be_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_2053.jpg"], "final": []}}, {"title": "Asian Slaw", "category": "Salad", "department": "Prep", "ingredients": [{"name": "White Cabbage (sliced)", "unit": "g", "quantity": 1200.0}, {"name": "Red Peppers (sliced)", "unit": "unit", "quantity": 2.0}, {"name": "Carrots (thin strips)", "unit": "g", "quantity": 500.0}, {"name": "Coriander", "unit": "g", "quantity": 100.0}, {"name": "Asian Dressing", "unit": "g", "quantity": 300.0}, {"name": "Sesame Seeds (black or white)", "unit": "g", "quantity": 10.0}], "method": ["Mix all ingredients in bowl.", "Garnish with sesame seeds & coriander."], "notes": "", "allergen_tags": ["Sesame", "Soya"], "images": {}}, {"title": "Broccoli Salad", "category": "Salad", "department": "Prep", "ingredients": [{"name": "Broccoli (florets)", "unit": "g", "quantity": 1000.0}, {"name": "Chili & Garlic Mix", "unit": "g", "quantity": 50.0}, {"name": "Chili Oil", "unit": "ml", "quantity": 30.0}], "method": ["Blanch broccoli in salted water 2.5 min, chill in ice water.", "Char-grill on hot griddle 1 min each side.", "Mix with chili, garlic & oil, season with salt."], "notes": "", "allergen_tags": [], "images": {}}, {"title": "Chili & Garlic", "category": "Base / Dressing", "department": "Prep", "ingredients": [{"name": "Garlic (thinly sliced)", "unit": "g", "quantity": 1000.0}, {"name": "Fresh Chili (thinly sliced)", "unit": "g", "quantity": 200.0}, {"name": "Vegetable Oil", "unit": "ml", "quantity": 3000.0}, {"name": "Olive Oil", "unit": "ml", "quantity": 1000.0}], "method": ["Heat oil to 150°C. Fry garlic until golden, drain on cloth.", "Repeat process with sliced chili.", "Keep oil for salad dressing."], "notes": "Save the infused oil for salad dressings", "allergen_tags": [], "images": {}}, {"title": "Labneh", "category": "Base / Spread", "department": "Prep", "ingredients": [{"name": "Greek Yogurt", "unit": "kg", "quantity": 10.0}, {"name": "Salt", "unit": "ml", "quantity": 1000.0}, {"name": "Olive Oil", "unit": "L", "quantity": 1.0}], "method": ["Our all the ingredients together in the mixer let run for about 30 minutes then pour the mixture in"], "notes": "", "allergen_tags": ["Milk"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/8b47a2ae4_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_2407.jpg", "process": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/d15f95c01_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_2410.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/724155623_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_2409.jpg"]}}, {"title": "Sausage Roll", "category": "Bake", "department": "Prep", "ingredients": [{"name": "Beef Mince", "unit": "g", "quantity": 1000.0}, {"name": "Salt", "unit": "g", "quantity": 10.0}, {"name": "Garlic Powder", "unit": "g", "quantity": 10.0}, {"name": "Paprika", "unit": "g", "quantity": 5.0}, {"name": "Onion (diced)", "unit": "g", "quantity": 60.0}, {"name": "Black Pepper", "unit": "g", "quantity": 3.0}, {"name": "Egg", "unit": "unit", "quantity": 1.0}], "method": ["Mix all ingredients.", "Place 400 g mix on pastry sheet, roll tightly.", "Cut into 4 equal portions."], "notes": "", "allergen_tags": ["Gluten", "Eggs"], "images": {"thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/c53c62092_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_2138.jpg", "ingredients": [], "process": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/c3f9ffb2e_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_1883.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/de4099e13_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_1889.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/f35840320_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_1896.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/68eb1c115_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_1902.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/eae6189d9_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_1908.jpg"], "final": []}}, {"title": "Sweet Corn Salad", "category": "Salad", "department": "Prep", "ingredients": [{"name": "Sweetcorn (tins, 1425 g each)", "unit": "unit", "quantity": 5.0}, {"name": "Red Peppers (diced)", "unit": "g", "quantity": 950.0}, {"name": "Dill (chopped)", "unit": "g", "quantity": 30.0}, {"name": "Pickles (diced)", "unit": "g", "quantity": 400.0}, {"name": "Mayonnaise", "unit": "g", "quantity": 200.0}], "method": ["Squeeze sweetcorn & pickles dry with cloth.", "Mix all ingredients in large bowl."], "notes": "", "allergen_tags": ["Eggs", "Mustard"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/91e390913_233d9528-74b4-4e8f-a553-3257e78b9fbf-1_all_1843.jpg", "process": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/38369133b_233d9528-74b4-4e8f-a553-3257e78b9fbf-1_all_1847.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/325b21a1d_233d9528-74b4-4e8f-a553-3257e78b9fbf-1_all_1852.jpg"]}}, {"title": "Potato Latkes", "category": "Side", "department": "Prep", "ingredients": [{"name": "Potatoes", "unit": "g", "quantity": 3500.0}, {"name": "Onions", "unit": "g", "quantity": 2800.0}, {"name": "Salt", "unit": "g", "quantity": 60.0}, {"name": "Eggs", "unit": "unit", "quantity": 11.0}, {"name": "Plain Flour", "unit": "g", "quantity": 200.0}, {"name": "Garlic powder", "unit": "g", "quantity": 50.0}, {"name": "Parsley (chopped)", "unit": "g", "quantity": 50.0}, {"name": "Golden bread crumbs", "unit": "g", "quantity": 80.0}, {"name": "Turmeric", "unit": "g", "quantity": 10.0}, {"name": "Coriander", "unit": "unit", "quantity": 1.0}], "method": ["Mix veg & salt, rest 20 min.", "Squeeze liquid, add eggs & flour.", "Shape 120 g patties, fry until golden.", "Finish in oven 175°C ~20 min."], "notes": "", "allergen_tags": ["Eggs", "Gluten"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/dc293aa32_edited-image.jpg", "process": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/d12055aa1_233d9528-74b4-4e8f-a553-3257e78b9fbf-1_all_2119.jpg"]}}, {"title": "Omelette Base", "category": "Base", "department": "Prep", "ingredients": [{"name": "Eggs", "unit": "unit", "quantity": 20.0}, {"name": "Roasted Vegetables (any)", "unit": "g", "quantity": 600.0}, {"name": "Fresh Herbs (chopped)", "unit": "g", "quantity": 10.0}], "method": ["Place roasted veg on lined tray.", "Pour beaten eggs & herbs over veg.", "Season with salt & pepper.", "Bake at 175°C for ~20 min."], "notes": "", "allergen_tags": ["Eggs"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/4579aa6d2_233d9528-74b4-4e8f-a553-3257e78b9fbf-1_all_1974.jpg", "process": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/02b362eab_233d9528-74b4-4e8f-a553-3257e78b9fbf-1_all_1981.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/47a2f34cb_233d9528-74b4-4e8f-a553-3257e78b9fbf-1_all_1986.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/705a4beec_233d9528-74b4-4e8f-a553-3257e78b9fbf-1_all_1993.jpg"]}}, {"title": "Beetroot Salad", "category": "Salad", "department": "Prep", "ingredients": [{"name": "Cooked Beetroot", "unit": "g", "quantity": 900.0}, {"name": "Olive Oil", "unit": "g", "quantity": 20.0}, {"name": "Lemon Juice", "unit": "g", "quantity": 20.0}, {"name": "Balsamic Reduction", "unit": "g", "quantity": 10.0}, {"name": "Lemon Zest", "unit": "unit", "quantity": 1.0}, {"name": "White Vinegar", "unit": "g", "quantity": 40.0}, {"name": "Parsley (picked)", "unit": "handful", "quantity": 1.0}, {"name": "Salt", "unit": "tsp", "quantity": 1.0}, {"name": "Sugar", "unit": "tsp", "quantity": 1.0}, {"name": "Cumin", "unit": "tsp", "quantity": 1.0}, {"name": "Labneh", "unit": "unit", "quantity": 8.0}], "method": ["Mix all ingredients.", "Plate with fresh mint leaves.", "Add 6–8 labneh balls around."], "notes": "", "allergen_tags": ["Milk"], "images": {}}, {"title": "Berries Compote", "category": "Dessert Base", "department": "Prep", "ingredients": [{"name": "Frozen Mixed Berries", "unit": "g", "quantity": 4000.0}, {"name": "Caster Sugar", "unit": "g", "quantity": 3600.0}, {"name": "Lemon juice", "unit": "unit", "quantity": 6.0}, {"name": "Fish gélatine", "unit": "tbsp", "quantity": 6.0}], "method": ["Drop the frozen berries in the pot under very low heat for about 30 minutes then add the lemon juice and turn heat to medium for 30 minutes more to simer, turn the head to low add the sugar coock for 20 minutes turn it off and add the gelatin and stir it really well let cool down and then blend it"], "notes": "Adjust sugar depending on berries supplier.", "allergen_tags": [], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/efb002356_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_1855.jpg", "process": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/1306d5c02_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_1854.jpg"]}}, {"title": "Shakshuka Base", "category": "Base", "department": "Prep", "ingredients": [{"name": "Red Peppers (julian sliced)", "unit": "g", "quantity": 2100.0}, {"name": "Onions ( julian sliced)", "unit": "g", "quantity": 4200.0}, {"name": "Fresh  garlic", "unit": "g", "quantity": 75.0}, {"name": "Cooking oil", "unit": "ml", "quantity": 200.0}, {"name": "Salt", "unit": "g", "quantity": 90.0}, {"name": "Paprika", "unit": "g", "quantity": 90.0}, {"name": "Cracked chilli", "unit": "g", "quantity": 30.0}, {"name": "Custer sugar", "unit": "g", "quantity": 25.0}, {"name": "Bay leaves", "unit": "unit", "quantity": 5.0}, {"name": "Tomato paste", "unit": "g", "quantity": 420.0}, {"name": "Tinned Chopped Tomato", "unit": "unit", "quantity": 3.0}], "method": ["Put your  pot on high heat pour 3 minutes then drop your onion let simer for 12 minutes the the red for about 10 minutes and keep stirring, turn the head medium add the garlic spicies and tomato paste stir all the ingredients together to ancorporat the aroma for 5 minutes then add 3 tins of chopped tomatoes cooked 70 minutes and keep stirring time to time"], "notes": "", "allergen_tags": ["Celery"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/d0d9a4551_edited-image.jpg", "process": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/ad6c2cb5e_233d9528-74b4-4e8f-a553-3257e78b9fbf-1_all_1932.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/6f94e827e_233d9528-74b4-4e8f-a553-3257e78b9fbf-1_all_1938.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/7134924ee_233d9528-74b4-4e8f-a553-3257e78b9fbf-1_all_1941.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/66f7b256a_233d9528-74b4-4e8f-a553-3257e78b9fbf-1_all_1944.jpg"]}}, {"title": "Coleslaw", "category": "Salad", "department": "Prep", "ingredients": [{"name": "White Cabbage (thinly sliced)", "unit": "g", "quantity": 2500.0}, {"name": "Carrots (grated)", "unit": "g", "quantity": 1000.0}, {"name": "Mayonnaise", "unit": "g", "quantity": 1200.0}, {"name": "Black Pepper", "unit": "g", "quantity": 5.0}, {"name": "Sugar", "unit": "g", "quantity": 200.0}], "method": ["Mix cabbage & carrot.", "Add mayo & pepper, combine."], "notes": "", "allergen_tags": ["Eggs", "Mustard"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/fc9497f0f_233d9528-74b4-4e8f-a553-3257e78b9fbf-1_all_2080.jpg", "process": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/896703fdc_233d9528-74b4-4e8f-a553-3257e78b9fbf-1_all_2085.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/c7c63dfa0_233d9528-74b4-4e8f-a553-3257e78b9fbf-1_all_2087.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/1694273d2_233d9528-74b4-4e8f-a553-3257e78b9fbf-1_all_2093.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/cfbc5bdda_233d9528-74b4-4e8f-a553-3257e78b9fbf-1_all_2096.jpg"]}}, {"title": "Fried Cauliflower Salad", "category": "Salad", "department": "Prep", "ingredients": [{"name": "Cauliflower (florets)", "unit": "g", "quantity": 2000.0}, {"name": "Onion (rings)", "unit": "unit", "quantity": 1.0}, {"name": "Salt", "unit": "g", "quantity": 10.0}, {"name": "Tahini", "unit": "g", "quantity": 150.0}, {"name": "Turmeric", "unit": "g", "quantity": 3.0}, {"name": "Parsley (chopped)", "unit": "handful", "quantity": 1.0}, {"name": "Pomegranate Seeds", "unit": "g", "quantity": 50.0}], "method": ["Fry cauliflower at high temp until golden.", "Fry onion rings, mix with cauliflower.", "Spread on flat plate.", "Mix tahini & turmeric, drizzle.", "Garnish with parsley & pomegranate."], "notes": "", "allergen_tags": ["Sesame"], "images": {}}, {"title": "Moroccan Carrots", "category": "Salad", "department": "Prep", "ingredients": [{"name": "Carrots (sliced)", "unit": "g", "quantity": 1900.0}, {"name": "Coriander (chopped)", "unit": "g", "quantity": 60.0}, {"name": "Rose Harissa", "unit": "g", "quantity": 200.0}, {"name": "Salt", "unit": "g", "quantity": 80.0}, {"name": "Lemon Juice", "unit": "g", "quantity": 40.0}], "method": ["Boil carrots ~14 min, drain, cool.", "Mix with remaining ingredients."], "notes": "", "allergen_tags": [], "images": {}}, {"title": "Zakalugh Aubergine Salad", "category": "Salad", "department": "Prep", "ingredients": [{"name": "Roasted Aubergine", "unit": "g", "quantity": 1200.0}, {"name": "White Onion", "unit": "g", "quantity": 200.0}, {"name": "Garlic (chopped)", "unit": "g", "quantity": 30.0}, {"name": "Kalamata Olives", "unit": "g", "quantity": 100.0}, {"name": "Tomato Paste", "unit": "g", "quantity": 250.0}], "method": ["Sauté onion & garlic until golden.", "Add tomato paste, mix well.", "Combine with roasted aubergine by hand until paste-like.", "Garnish with coriander."], "notes": "", "allergen_tags": [], "images": {}}, {"title": "Schnitzel", "category": "Protein", "department": "Prep", "ingredients": [{"name": "Chicken Breast", "unit": "g", "quantity": 3500.0}, {"name": "Mustard (mild)", "unit": "g", "quantity": 60.0}, {"name": "Salt", "unit": "g", "quantity": 30.0}, {"name": "Eggs (beaten)", "unit": "unit", "quantity": 4.0}, {"name": "Panko", "unit": "g", "quantity": 1000.0}, {"name": "Garlic powder", "unit": "g", "quantity": 20.0}, {"name": "Paprika", "unit": "g", "quantity": 20.0}], "method": ["Mix mustard, ketchup, garlic, salt, soy sauce. Marinate chicken 24h.", "Dip chicken in flour → egg → panko.", "Lay on tray."], "notes": "", "allergen_tags": ["Eggs", "Mustard", "Gluten"], "images": {"thumbnail": null, "ingredients": [], "process": [], "final": []}}, {"title": "Green Beans & Confit Garlic Salad", "category": "Salad", "department": "Prep", "ingredients": [{"name": "French Beans (blanched)", "unit": "g", "quantity": 500.0}, {"name": "Mange Tout (blanched)", "unit": "g", "quantity": 500.0}, {"name": "Confit Garlic", "unit": "g", "quantity": 150.0}, {"name": "Salt", "unit": "g", "quantity": 4.0}, {"name": "Parsley (roughly chopped)", "unit": "g", "quantity": 30.0}, {"name": "Lemon Zest", "unit": "tsp", "quantity": 2.0}], "method": ["Mix all ingredients together."], "notes": "", "allergen_tags": [], "images": {}}, {"title": "Roasted Sweet Potato Wedges", "category": "Side", "department": "Prep", "ingredients": [{"name": "Sweet Potato (wedges)", "unit": "g", "quantity": 2000.0}, {"name": "Paprika Powder", "unit": "g", "quantity": 20.0}, {"name": "Olive Oil", "unit": "g", "quantity": 50.0}, {"name": "Salt", "unit": "g", "quantity": 5.0}], "method": ["Mix potato with oil, salt, paprika.", "Lay on tray with baking paper.", "Roast 185°C for ~20 min."], "notes": "", "allergen_tags": [], "images": {}}, {"title": "Russian Salad", "category": "Salad", "department": "Prep", "ingredients": [{"name": "Carrots (cubed)", "unit": "g", "quantity": 1800.0}, {"name": "Potatoes (cubed)", "unit": "g", "quantity": 2000.0}, {"name": "Frozen Peas", "unit": "g", "quantity": 600.0}, {"name": "Pickles (cubed)", "unit": "g", "quantity": 600.0}, {"name": "Salt", "unit": "g", "quantity": 30.0}, {"name": "Black Pepper", "unit": "g", "quantity": 5.0}, {"name": "Eggs (boiled, cubed)", "unit": "unit", "quantity": 14.0}, {"name": "Mayonnaise", "unit": "g", "quantity": 500.0}], "method": ["Boil carrot & potato ~15 min. Add peas last 30 sec. Cool on tray.", "Mix with eggs, pickles, mayo, seasoning."], "notes": "", "allergen_tags": ["Eggs", "Mustard"], "images": {"thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/f622a63bf_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_1967.jpg", "ingredients": [], "process": [], "final": []}}, {"title": "Spinach Rolls", "category": "Bake", "department": "Prep", "ingredients": [{"name": "Spinach (fresh)", "unit": "unit", "quantity": 12.0}, {"name": "Cheddar Cheese (grated)", "unit": "g", "quantity": 500.0}, {"name": "Feta Cheese", "unit": "g", "quantity": 1200.0}, {"name": "Eggs (beaten)", "unit": "", "quantity": 7.0}, {"name": "Puff Pastry Sheets", "unit": "unit", "quantity": 1.0}, {"name": "Sesame Seeds", "unit": "g", "quantity": 30.0}, {"name": "Cracked black pepper", "unit": "g", "quantity": 10.0}], "method": ["Mix spinach, cheeses & eggs until combined.", "Spread 390 g mix onto pastry sheet.", "Roll & cut into 3 pieces.", "Egg wash, sprinkle sesame.", "Bake at 175°C for ~27 min."], "notes": "", "allergen_tags": ["Eggs", "Milk", "Gluten", "Sesame"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/ff2cea605_edited-image.jpg", "process": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/5e990d1aa_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2139.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/107bbeee3_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2413.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/36a98d369_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2417.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/46bc20d3a_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2418.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/2684ee2ca_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2420.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/ebac866b7_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2425.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/8aafc649c_8c57dfd9-b1c3-4df7-9ab9-2ccbfba95ca9-1_all_2428.jpg"]}}, {"title": "Chicken Soup", "category": "Soup", "department": "Prep", "ingredients": [{"name": "Carrots", "unit": "g", "quantity": 15000.0}, {"name": "White Onion (peeled)", "unit": "g", "quantity": 1000.0}, {"name": "Dill (fresh)", "unit": "bunch", "quantity": 1.0}, {"name": "Celery", "unit": "g", "quantity": 300.0}, {"name": "Bay Leaves", "unit": "unit", "quantity": 6.0}, {"name": "Water", "unit": "L", "quantity": 14.0}, {"name": "Chicken Stock powder", "unit": "g", "quantity": 100.0}, {"name": "Chicken wings", "unit": "g", "quantity": 1700.0}, {"name": "Veg stock", "unit": "g", "quantity": 30.0}, {"name": "Fresh garlic", "unit": "g", "quantity": 75.0}, {"name": "Vermicelles", "unit": "unit", "quantity": 8.0}, {"name": "Turmeric", "unit": "g", "quantity": 5.0}], "method": ["To cook  the chicken soup there is two mager steps Place all then ingredients to boil for 1:30 minutes except the dill drop it in your pan 15 minutes before the end the first half of the process.", "The second part is filter your soup using colander split the soup from the chicken and vegetables put back  your soup on the stove dice 800 gr of carrot and 4 stolks of celery add some water let coock for about 15 minutes till the diced vegetables soften switch it of then break 8 nest of vermicelle in your pot"], "notes": "", "allergen_tags": ["Celery", "Sulphur Dioxide"], "images": {"thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/46156d8f4_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_2235.jpg", "ingredients": [], "process": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/36788553c_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_2245.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/17a50da7a_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_2244.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/edf88aca8_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_2222.jpg", "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/a41a80aa5_5f1c138c-f284-443c-9159-cb1cb83fbb9f-1_all_2220.jpg"], "final": []}}, {"title": "Greek Salad", "category": "Salad", "department": "Prep", "ingredients": [{"name": "Cucumber", "unit": "unit", "quantity": 4.0}, {"name": "Tomato", "unit": "unit", "quantity": 4.0}, {"name": "Red pepper", "unit": "unit", "quantity": 1.0}, {"name": "Mixed Olives", "unit": "g", "quantity": 300.0}, {"name": "Olive Oil", "unit": "ml", "quantity": 50.0}, {"name": "Lemon Juice (fresh)", "unit": "ml", "quantity": 30.0}, {"name": "Dry Oregano", "unit": "g", "quantity": 5.0}, {"name": "Lettuce", "unit": "unit", "quantity": 1.0}], "method": ["Prepare a  large mixing bowl, dice the cucumber and tomato cut the red pepper julian add choppe the lettuce in stripes around 2 centimètres wide add the olives lemon juice and olive oil mix every thing gently pour it in your displaying bowl dice your feta sprinkle your oregano dush of olive oil on the top and display."], "notes": "", "allergen_tags": ["Milk"], "images": {"thumbnail": null, "ingredients": [], "process": [], "final": []}}, {"title": "Tuna & Beans", "category": "Salad", "department": "Prep", "ingredients": [{"name": "Tuna (tins, drained)", "unit": "unit", "quantity": 2.0}, {"name": "White Kidney Beans", "unit": "g", "quantity": 312.0}, {"name": "Red Kidney Beans", "unit": "g", "quantity": 312.0}, {"name": "Celery (diced)", "unit": "g", "quantity": 250.0}, {"name": "Basil (sliced)", "unit": "bunch", "quantity": 1.0}, {"name": "Olive Oil", "unit": "g", "quantity": 200.0}, {"name": "White Wine Vinegar", "unit": "g", "quantity": 70.0}, {"name": "Salt", "unit": "g", "quantity": 10.0}], "method": ["Squeeze tuna dry.", "Mix all ingredients gently."], "notes": "", "allergen_tags": ["Fish", "Celery"], "images": {}}, {"title": "Potato Kugel", "category": "Bake", "department": "Prep", "ingredients": [{"name": "Potatoes (grated)", "unit": "g", "quantity": 2000.0}, {"name": "Eggs (beaten)", "unit": "unit", "quantity": 10.0}, {"name": "Salt", "unit": "g", "quantity": 20.0}, {"name": "White Onion (grated)", "unit": "g", "quantity": 300.0}, {"name": "Vegetable Oil", "unit": "g", "quantity": 250.0}], "method": ["Mix all ingredients.", "Transfer to baking dish.", "Bake 180°C for 25 min."], "notes": "", "allergen_tags": ["Eggs"], "images": {}}, {"title": "Red Pepper Salad", "category": "Salad", "department": "Prep", "ingredients": [{"name": "Roasted Red Peppers", "unit": "g", "quantity": 1500.0}, {"name": "Pesto", "unit": "g", "quantity": 10.0}], "method": ["Cut peppers into wedges, season with salt & olive oil.", "Roast until soft.", "Mix with pesto.", "Plate on flat tray with baking paper."], "notes": "", "allergen_tags": ["Nuts", "Milk"], "images": {}}, {"title": "Scone (about 50 scones)", "category": "Pastry", "department": "", "ingredients": [{"name": "Flour", "unit": "", "quantity": 0.0}, {"name": "Baking powder", "unit": "", "quantity": 0.0}, {"name": "Margarine", "unit": "", "quantity": 0.0}, {"name": "Sugar", "unit": "", "quantity": 0.0}, {"name": "Double cream", "unit": "", "quantity": 0.0}, {"name": "Raisin", "unit": "", "quantity": 0.0}, {"name": "Quinoa", "unit": "", "quantity": 0.0}, {"name": "Salt", "unit": "", "quantity": 0.0}, {"name": "Vanilla", "unit": "", "quantity": 0.0}], "method": ["Mix flour, baking powder, sugar and margarine. Gradually add milk, and knead until relatively smooth and elastic. Knead in raisins.", "Roll out to 2 cm high and cut circles 10 cm diameter.", "Bake 145 for 30 min."], "notes": "", "allergen_tags": ["Gluten", "Milk"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/0244515dd_IMG_8233.png", "process": []}}, {"title": "Baked Cheesecake - Classic Style", "category": "Cake", "department": "", "ingredients": [{"name": "full fat cheese", "unit": "kg", "quantity": 4.0}, {"name": "granulated sugar", "unit": "g", "quantity": 800.0}, {"name": "eggs", "unit": "", "quantity": 25.0}, {"name": "milk", "unit": "L", "quantity": 0.5}, {"name": "flour", "unit": "g", "quantity": 453.59}, {"name": "egg whites", "unit": "g", "quantity": 500.0}], "method": ["Mix cheese and sugar. Add 12 eggs at a time; mix until smooth.", "Meanwhile whip egg whites until firm; add sugar; whip to shiny meringue.", "When all eggs are incorporated, add milk and sifted flour; mix with cheese mixture.", "Carefully fold meringue into the cheesy mix.", "Divide between rings lined with digestive biscuit base.", "Bake 1.5-2 hours at 300F. Surface lightly skinned and golden, flexible when pressed. Cool overnight; slice next day with hot knife."], "notes": "", "allergen_tags": ["Gluten", "Eggs", "Milk"], "images": {}}, {"title": "Brownie (about 14x20 inches baking mold)", "category": "Traybake", "department": "", "ingredients": [{"name": "Margarine", "unit": "g", "quantity": 950.0}, {"name": "Dark chocolate", "unit": "g", "quantity": 900.0}, {"name": "Eggs", "unit": "", "quantity": 15.0}, {"name": "Brown Sugar", "unit": "g", "quantity": 750.0}, {"name": "Ground Almond", "unit": "g", "quantity": 750.0}, {"name": "Coca powder", "unit": "g", "quantity": 100.0}, {"name": "Walnut on top", "unit": "", "quantity": 0.0}], "method": ["Melt the margarine and chocolate (microwave or low heat). Cool slightly.", "Mix eggs with sugar until foamy, light and fluffy.", "Combine chocolate mix with egg mixture; add almond and cocoa; mix until smooth; add walnut pieces.", "Baking: 150, 30 mins. Inside should be still sticky. Cool before slicing."], "notes": "", "allergen_tags": ["Eggs", "Nuts"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/812c5c081_IMG_8209.jpeg", "process": []}}, {"title": "Florentin", "category": "Biscuit", "department": "", "ingredients": [{"name": "margarine", "unit": "g", "quantity": 600.0}, {"name": "granulated sugar", "unit": "g", "quantity": 600.0}, {"name": "double cream", "unit": "ml", "quantity": 180.0}, {"name": "glucose syrup", "unit": "g", "quantity": 160.0}, {"name": "sliced almond", "unit": "g", "quantity": 600.0}, {"name": "raisin and glace cherry", "unit": "", "quantity": 0}], "method": ["In a saucepan, melt margarine, sugar, double cream and glucose syrup.", "Bring to the boil; cook until colour turns golden, stirring continuously; add almond and cook another 2 minutes.", "Sprinkle the sheets with the raisins and cherries.", "Bake in large sheets and cut while still warm, or place 1 tbsp doses on trays. 150 for 30 mins until golden."], "notes": "", "allergen_tags": ["Milk", "Nuts"], "images": {}}, {"title": "Puff Pastry (12 kg dough)", "category": "Dough", "department": "", "ingredients": [{"name": "Flour", "unit": "kg", "quantity": 2.0}, {"name": "Cold water", "unit": "L", "quantity": 1.2}, {"name": "Salt", "unit": "g", "quantity": 20.0}, {"name": "Pastry Maragrine", "unit": "kg", "quantity": 1.5}], "method": ["Mix flour, margarine and salt with water; knead until bowl is clean and pastry is smooth and elastic.", "Fold 2x double and 1x single for the mix above."], "notes": "", "allergen_tags": ["Gluten"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/0cc5d4b2d_edited-image.jpg", "process": []}}, {"title": "Danish Dough (around 12 kg dough)", "category": "Dough", "department": "", "ingredients": [{"name": "flour", "unit": "g", "quantity": 2500.0}, {"name": "yolk eggs", "unit": "", "quantity": 10.0}, {"name": "cold water", "unit": "ml", "quantity": 1200.0}, {"name": "sugar", "unit": "g", "quantity": 350.0}, {"name": "salt", "unit": "tbsp", "quantity": 1.0}, {"name": "yeast", "unit": "g", "quantity": 70.0}, {"name": "pastry margarine", "unit": "kg", "quantity": 1.5}], "method": ["Mix all ingredients (no margarine) until smooth and the side of the caldron is clean (~8 minutes).", "Use 1.5 kg of pastry margarine for 4.5 kg of pastry. Roll and fold 3x single fold. Rest; then roll out and use. Store pastry in fridge/cool place as it rises quickly."], "notes": "", "allergen_tags": ["Gluten", "Eggs"], "images": {}}, {"title": "Granola Biscuit", "category": "Biscuit", "department": "", "ingredients": [{"name": "rolled oats", "unit": "g", "quantity": 500.0}, {"name": "margarine", "unit": "g", "quantity": 450.0}, {"name": "eggs", "unit": "", "quantity": 2.0}, {"name": "walnut", "unit": "g", "quantity": 100.0}, {"name": "almond, sliced", "unit": "g", "quantity": 100.0}, {"name": "coconut", "unit": "g", "quantity": 80.0}, {"name": "raisins", "unit": "g", "quantity": 100.0}, {"name": "brown sugar", "unit": "g", "quantity": 350.0}, {"name": "granulated sugar", "unit": "g", "quantity": 100.0}, {"name": "flour", "unit": "g", "quantity": 150.0}, {"name": "cinnamon", "unit": "tbsp", "quantity": 1.0}], "method": ["Mix margarine with sugar until fluffy; beat in the eggs.", "Add all remaining ingredients and mix until combined.", "Form balls and put on a baking tray. Baking: 360F, 15-20 mins."], "notes": "", "allergen_tags": ["Gluten", "Eggs", "Nuts"], "images": {}}, {"title": "Fresh Cheesecake (Cheese Mousse)", "category": "Cake", "department": "", "ingredients": [{"name": "Vanilla", "unit": "tbsp", "quantity": 2.0}, {"name": "Full fat cheese", "unit": "kg", "quantity": 2.0}, {"name": "Whipping cream or double cream", "unit": "L", "quantity": 2.2}, {"name": "Icing Sugar", "unit": "g", "quantity": 750.0}, {"name": "Fish gelatine", "unit": "tbsp", "quantity": 6.0}, {"name": "Water", "unit": "ml", "quantity": 200.0}, {"name": "Digestive biscuit", "unit": "g", "quantity": 600.0}, {"name": "Margarine", "unit": "g", "quantity": 300.0}], "method": ["Put gelatine into a saucepan with the water; set aside.", "Whip fresh cream not too hard (just stands on its own).", "Mix the cheese with vanilla and sugar; mix 5 minutes until soft.", "Mix together carefully the cream and the cheese.", "Melt the gelatine; add a few spoons of cheese & cream; stir smooth (runny). Gradually add to remaining cream; stir quickly.", "Prepare biscuit base with digestive + margarine; fill and set."], "notes": "", "allergen_tags": ["Gluten", "Eggs", "Milk", "Fish"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/13672ff9e_IMG_1436.webp", "process": []}}, {"title": "Orange and Walnut Florentin", "category": "Biscuit", "department": "", "ingredients": [{"name": "walnut", "unit": "g", "quantity": 300.0}, {"name": "granulated sugar", "unit": "g", "quantity": 300.0}, {"name": "candied orange", "unit": "g", "quantity": 300.0}, {"name": "margarine", "unit": "g", "quantity": 40.0}, {"name": "flour", "unit": "g", "quantity": 40.0}, {"name": "double cream", "unit": "ml", "quantity": 200.0}], "method": ["Chop the walnut (or crush with rolling pin) to small pieces.", "Put walnut, sugar, orange, margarine and cream into a saucepan; bring to the boil; stir 2-3 mins; add flour; stir through and set aside to cool.", "Pipe walnut-sized balls on baking sheet, 2-3 cm apart (they will flatten).", "Baking: 390-400F, 6-10 mins, until golden on the edges. Coat one side with dark chocolate."], "notes": "", "allergen_tags": ["Gluten", "Milk", "Nuts"], "images": {}}, {"title": "Viennese Biscuit", "category": "Biscuit", "department": "Pastry", "ingredients": [{"name": "margarine", "unit": "g", "quantity": 2250.0}, {"name": "icing sugar", "unit": "g", "quantity": 1325.0}, {"name": "vanilla", "unit": "g", "quantity": 60.0}, {"name": "Flour", "unit": "g", "quantity": 3000.0}], "method": ["Mix margarine and icing sugar until pale and fluffy, about 5 mins. Add vanilla compound meanwhile.", "Slowly add the flour; take care not to overmix.", "Immediately put in a piping bag and pipe desired forms.", "Baking: 150, 10-12 mins, until pale and firm, and lightly golden.", "Fill with jam; dip end with melted dark chocolate."], "notes": "", "allergen_tags": ["Gluten", "Milk"], "images": {"thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/715c7274a_recipe_page2_img3.png", "ingredients": ["https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/3e7924444_recipe_page3_img3.png"], "process": [], "final": []}}, {"title": "Cinnamon Balls (4 big trays)", "category": "Biscuit", "department": "Pastry", "ingredients": [{"name": "Ground almond", "unit": "g", "quantity": 2041.0}, {"name": "Macaroon paste", "unit": "g", "quantity": 1134.0}, {"name": "Granulated sugar", "unit": "g", "quantity": 1134.0}, {"name": "Cinnamon", "unit": "g", "quantity": 100.0}, {"name": "Golden syrup", "unit": "g", "quantity": 200.0}, {"name": "Egg whites (20)", "unit": "g", "quantity": 600.0}], "method": ["Mix all dry ingredients with the macaron paste on high speed until the lumps disappear.", "Add golden syrup and egg whites; mix.", "Form balls, cover with icing sugar, and bake immediately.", "Baking: 160, 10 mins, until cracks appear on the surface, but still soft inside.", "The raw mix can be stored in refrigerator for a week."], "notes": "", "allergen_tags": ["Nuts", "Eggs"], "images": {"thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/public/68c7f70c8764c9386f5252cb/11292294d_1000174920.jpg", "ingredients": [], "process": [], "final": []}}, {"title": "Carrot Cake (2x 8-inch cake)", "category": "Cake", "department": "", "ingredients": [{"name": "oil", "unit": "ml", "quantity": 300.0}, {"name": "brown sugar", "unit": "g", "quantity": 400.0}, {"name": "eggs", "unit": "", "quantity": 4.0}, {"name": "carrots, grated", "unit": "g", "quantity": 350.0}, {"name": "flour", "unit": "g", "quantity": 350.0}, {"name": "baking powder", "unit": "tsp", "quantity": 2.0}, {"name": "bicarbonate of soda", "unit": "tsp", "quantity": 2.0}, {"name": "cinnamon", "unit": "tsp", "quantity": 4.0}, {"name": "walnut, chopped", "unit": "g", "quantity": 100.0}], "method": ["Mix the sugar with the oil and beat with the eggs until smooth.", "Stir in the carrots and walnuts, then fold through the dry ingredients.", "Divide the batter in 2 or 4 (sandwich) tins, and bake.", "Baking: 160, 25-30 mins.", "Finish with cream cheese filling and coating (see next recipe)."], "notes": "", "allergen_tags": ["Gluten", "Eggs", "Milk", "Nuts"], "images": {}}, {"title": "Dates & Walnuts Strudel Biscuits", "category": "Pastry", "department": "Pastry", "ingredients": [{"name": "Flour", "unit": "kg", "quantity": 2.2}, {"name": "Corn flour", "unit": "g", "quantity": 200.0}, {"name": "Margarine", "unit": "g", "quantity": 700.0}, {"name": "Oil", "unit": "g", "quantity": 700.0}, {"name": "Cold water", "unit": "ml", "quantity": 700000.0}, {"name": "Baking powder", "unit": "tbsp", "quantity": 1.0}, {"name": "Salt", "unit": "tbsp", "quantity": 1.0}, {"name": "Vanilla", "unit": "tbsp", "quantity": 2.0}], "method": ["Mix ingredients together for 3 minutes; roll flat.", "Add dates and walnuts.", "Roll twice and cut into strips.", "Bake 160 for 23 min."], "notes": "", "allergen_tags": ["Gluten", "Nuts"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/07e439ee6_edited-image.jpg", "process": []}}, {"title": "Marble Cake", "category": "Cake", "department": "", "ingredients": [{"name": "Oil", "unit": "", "quantity": 0.0}, {"name": "eggs", "unit": "", "quantity": 0.0}, {"name": "sugar", "unit": "", "quantity": 0.0}, {"name": "flour", "unit": "", "quantity": 0.0}, {"name": "baking powder", "unit": "", "quantity": 0.0}, {"name": "orange juice", "unit": "", "quantity": 0.0}, {"name": "vanilla compound", "unit": "", "quantity": 0.0}, {"name": "coca powder", "unit": "", "quantity": 0.0}], "method": ["Mix oil, eggs and sugar until light and creamy; add vanilla compound.", "Sift flours and baking powder together; add flour and orange juice, stirring constantly.", "Divide the dough in half; add cocoa powder + some water to one part.", "Layer in the paper cups (or mix with chocolate chips for muffins).", "Bake at 150 until ~30 mins or until skewer comes out clean."], "notes": "", "allergen_tags": ["Gluten", "Eggs"], "images": {"final": [], "ingredients": [], "thumbnail": "https://base44.app/api/apps/68c7f70c8764c9386f5252cb/files/mp/public/68c7f70c8764c9386f5252cb/cb0168457_edited-image.jpg", "process": []}}, {"title": "Almond Crescent (Half-Moon Biscuit)", "category": "Biscuit", "department": "", "ingredients": [{"name": "margarine", "unit": "g", "quantity": 1000.0}, {"name": "sugar (preferably icing sugar)", "unit": "g", "quantity": 500.0}, {"name": "ground almond", "unit": "g", "quantity": 700.0}, {"name": "egg yolks", "unit": "", "quantity": 7.0}, {"name": "flour", "unit": "g", "quantity": 1200.0}, {"name": "Almond flavour", "unit": "tbsp", "quantity": 2.0}], "method": ["Mix margarine with sugar, flour and ground almond until crumbly, then add egg yolks and mix until combined.", "On lightly floured surface roll it into long stripes around 2 cm in diameter. Cut up into 2-3 cm long pieces, and shape into small crescents/half moons.", "Leave space between them as they will flatten a bit.", "Baking: 150, 10 mins, until pale and firm.", "Dust with icing sugar, or dip into melted chocolate."], "notes": "", "allergen_tags": ["Gluten", "Eggs", "Nuts"], "images": {}}, {"title": "Filling for Carrot & Red Velvet Cakes", "category": "Filling", "department": "", "ingredients": [{"name": "soft cheese", "unit": "g", "quantity": 400.0}, {"name": "margarine (soft)", "unit": "g", "quantity": 200.0}, {"name": "icing sugar", "unit": "g", "quantity": 250.0}, {"name": "vanilla", "unit": "tbsp", "quantity": 2.0}], "method": ["Beat all ingredients together until smooth and fluffy.", "Sandwich the layers with the icing and coat with the remaining cream.", "Decorate with marzipan carrots.", "You can freeze the whole ready-to-eat cake for weeks."], "notes": "", "allergen_tags": ["Milk", "Eggs"], "images": {}}, {"title": "Gingerbread Man", "category": "Biscuit", "department": "", "ingredients": [{"name": "margarine", "unit": "g", "quantity": 1250.0}, {"name": "golden syrup", "unit": "g", "quantity": 1250.0}, {"name": "brown sugar", "unit": "g", "quantity": 2000.0}, {"name": "egg yolks", "unit": "", "quantity": 30.0}, {"name": "flour", "unit": "g", "quantity": 4000.0}, {"name": "cinnamon", "unit": "tbsp", "quantity": 5.0}, {"name": "ground ginger", "unit": "tbsp", "quantity": 3.0}, {"name": "ground nutmeg", "unit": "tbsp", "quantity": 1.0}, {"name": "baking powder", "unit": "tbsp", "quantity": 1.0}], "method": ["Mix margarine, golden syrup and sugar, then add egg yolks, and mix again until pale and fluffy.", "Add flour and spices, and mix until combined.", "Knead through and roll out on a lightly floured surface to a 0.5 cm thickness; cut out the GBMs; decorate with smarties.", "Baking: 150, 12 mins, until lightly golden-brown, pale and firm. It will harden after cooled, but will become soft again in one day.", "Decorate with dark chocolate."], "notes": "", "allergen_tags": ["Gluten", "Eggs", "Nuts"], "images": {}}];

/* Build seed recipes + ingredients from the embedded Base44 export.
   Uses the same importer the admin uses, so behaviour matches exactly. */
const _seed = importBase44Json(JSON.stringify(BASE44_RECIPES), INGREDIENTS0);
const SEED_RECIPES = _seed.recipes;
const SEED_INGREDIENTS = _seed.ingredients;

function App() {
  const [screen, setScreen] = useState("home");
  const [user, setUser] = useState(null);
  // State starts empty and is populated from Supabase on mount (see load effect).
  const [staff, setStaff] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [cpu, setCpu] = useState({ name: "", address: "" });
  const [locations, setLocations] = useState([]);
  const [delivery, setDelivery] = useState({ perMile: 0, perHour: 0 });
  const [ready, setReady] = useState(false);
  // Gate persistence until the first load completes, so the initial empty state
  // is never written back over the database.
  const readyRef = useRef(false);

  // Single-site mode: we bake & sell in the same place — no shops to deliver to.
  const singleSite = !!cpu?.singleSite;
  const stores = singleSite ? [] : locations.map((l) => l.name);
  // Where "Back" lands: admins always return to the admin screen.
  const backScreen = user?.role === "admin" ? "admin" : user?.role === "driver" ? "driver" : "home";

  const [productions, setProductions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [finishing, setFinishing] = useState(null);

  const [storeStock, setStoreStock] = useState({});
  const [centralStock, setCentralStock] = useState({});
  const [deliveryQueue, setDeliveryQueue] = useState({});
  const [runs, setRuns] = useState([]);
  const [cancellations, setCancellations] = useState([]); // log of cancelled productions
  const [alerts, setAlerts] = useState([]); // admin alerts about time drift

  const [voiceOn, setVoiceOn] = useState(false);
  const [toast, setToast] = useState(null);
  const [adminPrompt, setAdminPrompt] = useState(false);
  const flash = (m, ms = 1700) => { setToast(m); setTimeout(() => setToast(null), ms); };
  const handleVoice = useCallback((t) => { flash(`“${t}”`); window.dispatchEvent(new CustomEvent("voicecmd", { detail: t })); }, []);
  const { supported: voiceSupported } = useVoice(handleVoice, voiceOn);

  const active = productions.find((p) => p.id === activeId) || null;

  // ---- load all state: instant from cache, then fresh from Supabase ----
  const applyData = (data) => {
    setStaff(data.staff); setIngredients(data.ingredients); setRecipes(data.recipes);
    setCpu(data.cpu); setLocations(data.locations); setDelivery(data.delivery);
    setStoreStock(data.storeStock); setCentralStock(data.centralStock); setDeliveryQueue(data.deliveryQueue);
    setRuns(data.runs); setCancellations(data.cancellations); setAlerts(data.alerts);
  };
  useEffect(() => {
    // surface any background save failure to the user (with the real error)
    setSyncErrorHandler((table, e) => flash(`⚠️ Couldn't save ${table} — ${e.message || e}. Retrying…`, 7000));
    let cancelled = false;
    // 1. instant paint: hydrate from the last-known cache so the page isn't blank
    let hadCache = false;
    try { const c = localStorage.getItem("ronis_cache_v1"); if (c) { applyData(JSON.parse(c)); hadCache = true; } } catch {}
    // 1b. fast staff fetch so the sign-in names show right away (not after the full load)
    loadStaff().then((s) => { if (s && !cancelled) setStaff(s); }).catch(() => {});
    // 2. recover: replay any writes that failed on a previous visit (offline / error)
    //    so unsaved recipes/ingredients/staff/locations are never lost.
    (async () => {
      let recovered = 0;
      for (const t of ["recipes", "ingredients", "staff", "locations"]) {
        try {
          const pend = localStorage.getItem("ronis_pending_" + t);
          if (pend) { await upsertRows(t, JSON.parse(pend)); localStorage.removeItem("ronis_pending_" + t); recovered++; }
        } catch (e) { console.error("recover " + t + " failed", e); }
      }
      if (recovered) flash("Recovered unsaved changes ✓");
      try {
        const data = await loadAll();
        if (data && !cancelled) { applyData(data); try { localStorage.setItem("ronis_cache_v1", JSON.stringify(data)); } catch {} }
      } catch (e) {
        console.error("Load failed", e); if (!hadCache) flash("Couldn't load data from the database");
      } finally {
        if (!cancelled) { readyRef.current = true; setReady(true); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ---- persistence-aware setters for admin-managed data ----
  // Same call signature as React setters; they also sync the change to Supabase
  // (debounced, so per-keystroke edits coalesce into one write).
  const alertToRow = (a) => ({ id: a.id, kind: a.kind || "time", message: a.message || null, recipe: a.recipe, from_sec: a.from, to_sec: a.to, dir: a.dir, diff: a.diff, runs: a.runs, when_label: a.when });
  const persistColl = (setState, table, toRow) => (updater) => setState((prev) => {
    const next = typeof updater === "function" ? updater(prev) : updater;
    if (readyRef.current) {
      const prevById = Object.fromEntries(prev.map((x) => [x.id, x]));
      const nextIds = new Set(next.map((x) => x.id));
      // Only send rows that are NEW or actually CHANGED — never the whole collection.
      const changed = next.filter((x) => { const p = prevById[x.id]; return !p || JSON.stringify(toRow(p)) !== JSON.stringify(toRow(x)); }).map(toRow);
      if (changed.length) queueUpsert(table, changed);
      // SAFETY: only delete a small, deliberate removal (a ✕ click). A large drop is
      // almost always a glitch/stale state — never let it wipe rows from the database.
      const removed = prev.filter((x) => !nextIds.has(x.id)).map((x) => x.id);
      if (removed.length && removed.length <= 3) deleteByIds(table, removed).catch((e) => { console.error(`delete ${table} failed`, e); flash("Couldn't delete from the database"); });
      else if (removed.length > 3) console.warn(`Skipped auto-delete of ${removed.length} ${table} rows (safety guard)`);
    }
    return next;
  });
  const persistOne = (setState, table, toRow) => (updater) => setState((prev) => {
    const next = typeof updater === "function" ? updater(prev) : updater;
    if (readyRef.current) scheduleSync(table, () => saveSingleton(table, toRow(next)).catch((e) => { console.error(`save ${table} failed`, e); flash(`⚠️ NOT saved — ${e.message || e}`, 7000); }));
    return next;
  });
  const setIngredientsP = persistColl(setIngredients, "ingredients", ingToRow);
  const setRecipesP = persistColl(setRecipes, "recipes", recToRow);
  const setStaffP = persistColl(setStaff, "staff", staffToRow);
  const setLocationsP = persistColl(setLocations, "locations", locToRow);
  const setAlertsP = persistColl(setAlerts, "alerts", alertToRow);
  const setCpuP = persistOne(setCpu, "cpu", (c) => ({ name: c.name, address: c.address || "", single_site: !!c.singleSite }));
  const setDeliveryP = persistOne(setDelivery, "delivery_settings", (d) => ({ per_mile: Number(d.perMile) || 0, per_hour: Number(d.perHour) || 0 }));

  const locId = (name) => locations.find((l) => l.name === name)?.id;

  const startProduction = (recipe, targetQty) => {
    const p = { id: uid("p"), recipe, targetQty, stepIndex: 0, durations: [], startedBy: user, startedAt: Date.now() };
    setProductions((ps) => [...ps, p]); setActiveId(p.id); setScreen("run");
  };
  const updateProduction = (id, patch) => setProductions((ps) => ps.map((p) => p.id === id ? { ...p, ...patch } : p));
  const removeProduction = (id) => setProductions((ps) => ps.filter((p) => p.id !== id));
  // Stop the clock the moment we reach the delivery stage; that elapsed time is
  // what labour cost is based on.
  const finishProduction = (p) => { setFinishing({ ...p, finishedAt: Date.now() }); setScreen("yield"); };

  const commitDistribution = (alloc, notForDelivery, prod) => {
    const p = prod || finishing;
    const producedQty = p.actualQty ?? p.targetQty;
    const whenLabel = new Date().toLocaleString("en-GB");
    const rName = p.recipe.name, rId = p.recipe.id, yUnit = p.recipe.yieldUnit;
    // deterministic queue-item ids so the in-memory state and the DB rows match
    const allocIds = alloc.map((a) => ({ ...a, qid: uid("q") }));

    setStoreStock((prev) => { const next = { ...prev }; alloc.forEach(({ store, qty }) => { next[store] = { ...(next[store] || {}) }; next[store][rName] = (next[store][rName] || 0) + qty; }); return next; });
    setDeliveryQueue((prev) => { const next = { ...prev }; allocIds.forEach(({ store, qty, qid }) => { next[store] = [...(next[store] || []), { id: qid, recipe: rName, qty, unit: yUnit, by: p.startedBy?.name, when: whenLabel }]; }); return next; });
    if (notForDelivery > 0) setCentralStock((prev) => ({ ...prev, [rName]: (prev[rName] || 0) + notForDelivery }));

    // total time the production took (clock stopped at the delivery stage)
    const totalSec = p.finishedAt && p.startedAt ? Math.max(0, Math.round((p.finishedAt - p.startedAt) / 1000)) : p.durations.reduce((a, b) => a + b, 0);
    const labour = (totalSec / 3600) * (p.startedBy?.wage || 0);
    const ingCost = recipeCost(p.recipe, ingredients) * (p.targetQty / p.recipe.yieldKg);
    const deliv = alloc.reduce((sum, { store }) => sum + deliveryCost(locations.find((l) => l.name === store), delivery), 0);
    const thisRun = { id: uid("run"), recipeId: rId, recipe: rName, qty: producedQty, unit: yUnit, by: p.startedBy?.name, totalSec, labour, ingCost, deliv, total: labour + ingCost + deliv, when: whenLabel, at: new Date().toISOString() };

    // rolling average of actual time for this recipe vs the set expected time
    const updated = [thisRun, ...runs];
    const sameRecipe = updated.filter((x) => x.recipeId === rId);
    const avg = sameRecipe.reduce((a, x) => a + x.totalSec, 0) / sameRecipe.length;
    const expected = p.recipe.expectedSec || 0;
    let recipeExpected = null, alertRow = null;
    if (expected && sameRecipe.length >= 2 && Math.abs(avg - expected) >= DRIFT_THRESHOLD_SEC) {
      const newExp = Math.round(avg);
      const diff = Math.round(avg - expected);
      const dir = diff > 0 ? "up" : "down";
      // auto-correct the recipe's expected time and alert admin
      setRecipes((rs) => rs.map((x) => x.id === rId ? { ...x, expectedSec: newExp } : x));
      const al = { id: uid("al"), recipe: rName, from: expected, to: newExp, dir, diff: Math.abs(diff), runs: sameRecipe.length, when: whenLabel };
      setAlerts((prev) => [al, ...prev.filter((a) => a.recipe !== rName)]);
      flash(`Heads up: ${rName} time went ${dir} by ${fmtClock(Math.abs(diff))} — updated`);
      recipeExpected = { id: rId, sec: newExp };
      alertRow = alertToRow(al);
    }
    setRuns((r) => [thisRun, ...r]);
    removeProduction(p.id); setFinishing(null);
    setActiveId(productions.find((x) => x.id !== p.id)?.id || null);
    setScreen("home"); flash("Production logged");

    // ---- persist to Supabase (production adds stock; Square will later subtract) ----
    if (readyRef.current) {
      const storeUpserts = alloc.map(({ store, qty }) => { const li = locId(store); return li ? { location_id: li, recipe_id: rId, qty: (storeStock[store]?.[rName] || 0) + qty } : null; }).filter(Boolean);
      const queueInserts = allocIds.map(({ store, qty, qid }) => { const li = locId(store); return li ? { id: qid, location_id: li, recipe_id: rId, recipe: rName, qty, unit: yUnit, by_name: p.startedBy?.name, when_label: whenLabel } : null; }).filter(Boolean);
      const centralUpsert = notForDelivery > 0 ? { recipe_id: rId, qty: (centralStock[rName] || 0) + notForDelivery } : null;
      const runRow = { id: thisRun.id, recipe_id: rId, recipe: rName, qty: thisRun.qty, unit: thisRun.unit, by_name: thisRun.by, total_sec: totalSec, labour, ing_cost: ingCost, deliv, total: thisRun.total, when_label: whenLabel };
      persistProduction({ storeUpserts, queueInserts, centralUpsert, runRow, recipeExpected, alert: alertRow })
        .catch((e) => { console.error("Persist production failed", e); flash("Saved on screen, but database write failed"); });
    }
  };
  const cancelProduction = (p) => {
    const whenLabel = new Date().toLocaleString("en-GB");
    const row = { id: uid("cx"), recipe: p.recipe.name, qty: p.targetQty, unit: p.recipe.yieldUnit, by: p.startedBy?.name, stoppedAtStep: (p.stepIndex || 0) + 1, totalSteps: p.recipe.steps.length, when: whenLabel };
    setCancellations((c) => [row, ...c]);
    removeProduction(p.id); setFinishing(null); setActiveId(null); setScreen("home"); flash("Production cancelled — logged");
    if (readyRef.current) persistCancellation({ id: row.id, recipe: row.recipe, qty: row.qty, unit: row.unit, by_name: row.by, stopped_at_step: row.stoppedAtStep, total_steps: row.totalSteps, when_label: row.when })
      .catch((e) => { console.error("Persist cancellation failed", e); flash("Database write failed"); });
  };

  // End-of-production yield check. Learn the real yield when close (≤5%), or flag
  // the admin when it's off by more.
  const confirmYield = (actual) => {
    const p = finishing;
    const target = p.targetQty;
    const recipe = p.recipe;
    if (target > 0 && actual > 0 && actual !== target) {
      const diffPct = Math.abs(actual - target) / target;
      if (diffPct <= 0.05) {
        const newBase = +(actual * recipe.yieldKg / target).toFixed(2);
        setRecipesP((rs) => rs.map((r) => r.id === recipe.id ? { ...r, yieldKg: newBase } : r));
        flash(`Yield auto-adjusted: ${recipe.name} → ${newBase} ${recipe.yieldUnit}`, 3500);
      } else {
        const pct = Math.round(diffPct * 100);
        const dir = actual > target ? "higher" : "lower";
        const al = { id: uid("al"), kind: "yield", recipe: recipe.name, message: `Yield ${dir} by ${pct}%: aimed ${target}, made ${actual} ${recipe.yieldUnit}. Recipe yield left unchanged — please review.`, when: new Date().toLocaleString("en-GB") };
        setAlertsP((prev) => [al, ...prev.filter((a) => !(a.kind === "yield" && a.recipe === recipe.name))]);
        flash(`Yield off by ${pct}% — flagged for admin review`, 4000);
      }
    }
    const fin = { ...p, actualQty: actual };
    setFinishing(fin);
    if (singleSite || stores.length === 0) { commitDistribution([], actual, fin); } // produce for itself → own stock
    else { setScreen("distribute"); }
  };

  const requestSignOut = () => {
    if (productions.length > 0) { setActiveId(productions[0].id); setScreen("run"); flash("Finish or stop the live production first"); }
    else { setUser(null); setScreen("home"); }
  };

  const resetStock = () => {
    setStoreStock({}); setCentralStock({}); setDeliveryQueue({});
    if (readyRef.current) resetAllStock().then(() => flash("Stock reset")).catch((e) => { console.error("Reset stock failed", e); flash("Stock reset on screen, but database write failed"); });
  };

  const [timerOpen, setTimerOpen] = useState(false);
  const [viewing, setViewing] = useState(null);      // service recipe being read (RecipeView)
  const [sbookPrompt, setSbookPrompt] = useState(false); // PIN gate to open S.Book
  const [produceGate, setProduceGate] = useState(null);  // recipe pending PIN gate to produce
  const [yieldPopup, setYieldPopup] = useState(false);   // admin login pop-up for yield warnings
  const hasServiceRecipes = recipes.some((r) => (r.dept2 || "Production") === "Service");
  const yieldAlerts = alerts.filter((a) => a.kind === "yield");
  // pop the yield warnings when an admin signs in
  useEffect(() => { if (user?.role === "admin" && alerts.some((a) => a.kind === "yield")) setYieldPopup(true); }, [user]);

  return (
    <div style={{ fontFamily: "'Nunito Sans',system-ui,sans-serif", background: C.cream, minHeight: "100vh", color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Nunito+Sans:ital,opsz,wght@0,6..12,400;0,6..12,600;0,6..12,700;0,6..12,800;0,6..12,900;1,6..12,400&display=swap');
        *{box-sizing:border-box}
        .display{font-family:'Quicksand',sans-serif;letter-spacing:-.01em}
        @keyframes pop{from{transform:scale(.98);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes ring{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
        .scr{animation:pop .22s ease}
        input,textarea,select{font-family:inherit}
        /* mobile / tablet */
        .row2,.row3,.row4{display:grid;gap:14px}
        .row2{grid-template-columns:1fr 1fr}
        .row3{grid-template-columns:1fr 1fr 1fr}
        .row4{grid-template-columns:1fr 1fr 1fr 1fr}
        .builder-head{display:grid;grid-template-columns:200px 1fr;gap:16px;align-items:start}
        .admin-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
        @media (max-width: 860px){
          .row3,.row4{grid-template-columns:1fr 1fr}
        }
        @media (max-width: 640px){
          .row2,.row3,.row4{grid-template-columns:1fr}
          .builder-head{grid-template-columns:1fr}
          .admin-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch;flex-wrap:nowrap !important}
          .admin-tabs > button{white-space:nowrap}
          .hide-sm{display:none !important}
          .admin-title{font-size:26px !important}
          .topbar{padding:10px 12px !important;gap:8px !important}
        }
        @media (max-width: 900px){
          .rv-cols{grid-template-columns:1fr !important}
          .recipeview{height:auto !important;overflow:visible !important}
        }
        @media (max-width: 760px){
          .card-cols{grid-template-columns:1fr !important}
          .card-cols > div:first-child{border-right:none !important;border-bottom:1px solid ${C.line}}
          .step-cols{grid-template-columns:1fr !important}
          .recipe-hero-side{display:none !important}
          .rv-head{grid-template-columns:1fr !important}
        }
      `}</style>

      {screen === "run" && active ? (
        <RunRecipe key={active.id} production={active} ingredients={ingredients} recipes={recipes}
          onStep={(patch) => updateProduction(active.id, patch)}
          onComplete={() => finishProduction(active)} onCancel={() => cancelProduction(active)}
          onBack={() => setScreen("home")} />
      ) : (
      <>
      <TopBar user={user} voiceOn={voiceOn} voiceSupported={voiceSupported} maxWidth={screen === "view" ? 1200 : 1280}
        onToggleVoice={() => setVoiceOn((v) => !v)}
        onHome={() => { if (productions.length && user?.role === "production") { setActiveId(productions[0].id); setScreen("run"); } else setScreen("home"); }}
        onAdmin={() => { if (productions.length) { flash("Finish the live production to open admin"); return; } if (user?.role === "admin") { setScreen("admin"); } else { setAdminPrompt(true); } }}
        onStock={() => setScreen("stock")}
        onTimer={() => setTimerOpen(true)}
        onSBook={() => { if (hasPerm(user, "sbook")) { setScreen("sbook"); } else { setSbookPrompt(true); } }}
        onSignOut={requestSignOut}
        showAdmin showStock={!!user} showSBook={hasServiceRecipes} />

      {adminPrompt && (
        <AdminPinGate onClose={() => setAdminPrompt(false)} onOk={() => { setAdminPrompt(false); setUser(ADMIN_USER); setScreen("admin"); }} />
      )}
      {sbookPrompt && (
        <StaffPinGate perm="sbook" title="Service Book" subtitle="Enter your PIN to open the service recipe book"
          onClose={() => setSbookPrompt(false)} onOk={(person) => { setSbookPrompt(false); setUser(person); setScreen("sbook"); }} />
      )}
      {produceGate && (
        <StaffPinGate perm="production" title={`Produce ${produceGate.name}`} subtitle="Enter your PIN to start this production"
          onClose={() => setProduceGate(null)} onOk={(person) => { const r = produceGate; setProduceGate(null); setUser(person); setFinishing({ _pickQty: r }); setScreen("qty"); }} />
      )}
      {yieldPopup && yieldAlerts.length > 0 && (
        <Modal onClose={() => setYieldPopup(false)}>
          <div className="display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, color: C.rust }}>⚠ Yield warnings</div>
          <p style={{ color: C.inkSoft, marginTop: 0, fontSize: 14 }}>Productions came out more than 5% off their set yield. The recipe yields were left unchanged — please review them.</p>
          <div style={{ display: "grid", gap: 10, marginTop: 12, maxHeight: "50vh", overflowY: "auto" }}>
            {yieldAlerts.map((a) => (
              <div key={a.id} style={{ background: "#F6E0D6", border: `1px solid ${C.rust}`, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ flex: 1, fontSize: 14 }}><b>{a.recipe}</b> — {a.message} <span style={{ color: C.inkSoft }}>({a.when})</span></span>
                <button onClick={() => setAlertsP((al) => al.filter((x) => x.id !== a.id))} style={{ ...pillGhost, padding: "6px 12px", fontSize: 13 }}>Resolve</button>
              </div>
            ))}
          </div>
          <BigButton full tone="go" onClick={() => setYieldPopup(false)}>Got it</BigButton>
        </Modal>
      )}

      {user?.role === "production" && productions.length > 0 && screen !== "admin" && (
        <Switcher productions={productions} activeId={activeId} onSwitch={(id) => { setActiveId(id); setScreen("run"); }} onNew={() => setScreen("home")} />
      )}

      <div style={{ maxWidth: screen === "view" ? 1200 : 1280, margin: "0 auto", padding: screen === "view" ? "18px clamp(14px,3vw,26px) 40px" : "24px clamp(14px,3vw,26px) 80px", ...((!user && screen === "home") ? { minHeight: "calc(100dvh - 66px)", display: "flex", flexDirection: "column", justifyContent: "center" } : {}) }}>
        {screen === "view" && viewing && (
          <RecipeView recipe={viewing} ingredients={ingredients} recipes={recipes} onNavigate={(r) => setViewing(r)} onBack={() => { setViewing(null); setScreen(hasServiceRecipes && user?.role !== "admin" ? "sbook" : backScreen); }} />
        )}
        {screen === "home" && (
          <Home user={user} staff={staff} recipes={recipes} ingredients={ingredients} verifyPin={dbVerifyPin}
            storeStock={storeStock} centralStock={centralStock} cpu={cpu} stores={stores} runs={runs}
            onOpenStock={() => setScreen("stock")}
            onSignIn={(u) => { setUser(u); setScreen(u.role === "driver" ? "driver" : u.role === "admin" ? "admin" : "home"); }}
            onPick={(r) => { if ((r.dept2 || "Production") === "Service") { setViewing(r); setScreen("view"); } else { setFinishing({ _pickQty: r }); setScreen("qty"); } }} />
        )}
        {screen === "sbook" && (
          <SBook recipes={recipes} ingredients={ingredients} onView={(r) => { setViewing(r); setScreen("view"); }} onBack={() => setScreen(backScreen)} />
        )}
        {screen === "qty" && finishing?._pickQty && (
          <Quantity recipe={finishing._pickQty} ingredients={ingredients}
            onBack={() => { setFinishing(null); setScreen("home"); }}
            onStart={(qty) => { const r = finishing._pickQty; setFinishing(null); startProduction(r, qty); }} />
        )}
        {screen === "yield" && finishing && !finishing._pickQty && (
          <YieldCheck production={finishing} onConfirm={confirmYield} />
        )}
        {screen === "distribute" && finishing && !finishing._pickQty && (
          <Distribute production={finishing} stores={stores} locations={locations} delivery={delivery} onConfirm={commitDistribution} />
        )}
        {screen === "driver" && (
          <DriverView deliveryQueue={deliveryQueue} stores={stores}
            onCollected={(store) => { setDeliveryQueue((p) => ({ ...p, [store]: [] })); flash(`${store} collected`); const li = locId(store); if (readyRef.current && li) clearQueueForLocation(li).catch((e) => console.error("Clear queue failed", e)); }} />
        )}
        {screen === "stock" && (
          <LiveStock recipes={recipes} storeStock={storeStock} centralStock={centralStock} cpu={cpu} stores={stores} runs={runs}
            onProduce={(recipe) => { if (!recipe) return; if (hasPerm(user, "production")) { setFinishing({ _pickQty: recipe }); setScreen("qty"); } else { setProduceGate(recipe); } }}
            onBack={() => setScreen(backScreen)} />
        )}
        {screen === "admin" && (
          <Admin ingredients={ingredients} setIngredients={setIngredientsP} recipes={recipes} setRecipes={setRecipesP}
            staff={staff} setStaff={setStaffP} cpu={cpu} setCpu={setCpuP} locations={locations} setLocations={setLocationsP}
            delivery={delivery} setDelivery={setDeliveryP} storeStock={storeStock} centralStock={centralStock}
            deliveryQueue={deliveryQueue} runs={runs} cancellations={cancellations} alerts={alerts} setAlerts={setAlertsP} stores={stores} onResetStock={resetStock} onClose={() => { if (user?.role === "admin") { setUser(null); } setScreen("home"); }} />
        )}
      </div>
      </>
      )}

      <TimerTool open={timerOpen} onClose={() => setTimerOpen(false)} onAlarm={() => setTimerOpen(true)} />

      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.ink, color: C.cream, padding: "13px 22px", borderRadius: 999, fontWeight: 600, fontSize: 16, boxShadow: "0 10px 30px rgba(0,0,0,.25)", zIndex: 50 }}>{toast}</div>}
    </div>
  );
}

function TopBar({ user, voiceOn, voiceSupported, onToggleVoice, onHome, onAdmin, onStock, onTimer, onSBook, onSignOut, showAdmin, showStock, showSBook, maxWidth = 1060 }) {
  return (
    <div className="topbar" style={{ background: C.cream, borderBottom: `1px solid ${C.line}`, position: "sticky", top: 0, zIndex: 40 }}>
    <div style={{ maxWidth, margin: "0 auto", padding: "14px clamp(14px,3vw,26px)", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ cursor: "pointer", display: "flex", alignItems: "baseline", gap: 9, minWidth: 0 }} onClick={onHome}>
        <span className="display" style={{ fontSize: 27, fontWeight: 800, color: C.ink, whiteSpace: "nowrap" }}>Roni's<span style={{ color: C.rust }}>.</span></span>
        <span className="display hide-sm" style={{ fontSize: 17, fontStyle: "italic", fontWeight: 500, color: C.inkSoft, whiteSpace: "nowrap" }}>Production Floor</span>
      </div>
      <div style={{ flex: 1 }} />
      <button onClick={onToggleVoice} title={voiceSupported ? "Voice control" : "Voice unsupported here — buttons still work"}
        style={{ background: voiceOn ? C.go : "transparent", border: `1.5px solid ${voiceOn ? C.go : C.line}`, color: voiceOn ? "#fff" : C.ink, borderRadius: 999, padding: "9px 14px", fontWeight: 600, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ width: 9, height: 9, borderRadius: 999, background: voiceOn ? "#9be8ad" : C.line }} /><span className="hide-sm">{voiceOn ? "Listening" : "Voice"}</span>
      </button>
      <button onClick={onTimer} title="Kitchen timer" style={{ ...pillGhost, flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M9 2h6" /><path d="M12 2v3" /></svg>
        <span className="hide-sm">Timer</span>
      </button>
      {showSBook && <button onClick={onSBook} style={{ ...pillGhost, flexShrink: 0, borderColor: C.gold, color: C.rustDeep }}>S.Book</button>}
      {showStock && <button onClick={onStock} style={{ ...pillGhost, flexShrink: 0, borderColor: C.go, color: C.go }}>Stock</button>}
      {showAdmin && user?.role !== "admin" && <button onClick={onAdmin} style={{ ...pillGhost, flexShrink: 0 }}>Admin</button>}
      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, padding: "6px 10px 6px 6px", borderRadius: 999, border: `1px solid ${C.line}`, flexShrink: 0 }}>
          <span style={{ width: 30, height: 30, borderRadius: 999, background: user.role === "driver" ? C.rust : C.gold, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14 }}>{user.name[0]}</span>
          <span className="hide-sm" style={{ fontWeight: 600 }}>{user.name}</span>
          <button onClick={onSignOut} title="Sign out" style={{ background: "none", border: "none", color: C.inkSoft, cursor: "pointer", fontSize: 17 }}>⏻</button>
        </div>
      )}
    </div>
    </div>
  );
}

/* Standalone kitchen timer — a tool, independent of any recipe. Stays mounted so
   it keeps counting in the background; pops itself open and sounds a repeating
   alarm when it reaches zero (alarm can be disabled/silenced). */
function TimerTool({ open, onClose, onAlarm }) {
  const [h, setH] = useState(0);
  const [mn, setMn] = useState(5);
  const [sc, setSc] = useState(0);
  const [remaining, setRemaining] = useState(null); // seconds left, or null before start
  const [running, setRunning] = useState(false);
  const [alarming, setAlarming] = useState(false);
  const [alarmEnabled, setAlarmEnabled] = useState(true);

  // countdown tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r == null) return r;
        if (r <= 1) { setRunning(false); if (alarmEnabled) { setAlarming(true); onAlarm?.(); } return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, alarmEnabled, onAlarm]);

  // repeating alarm while ringing
  useEffect(() => {
    if (!alarming) return;
    beep(); const id = setInterval(beep, 1300);
    return () => clearInterval(id);
  }, [alarming]);

  const setTotal = h * 3600 + mn * 60 + sc;
  const startResume = () => {
    setAlarming(false);
    if (remaining == null || remaining <= 0) { if (setTotal <= 0) return; setRemaining(setTotal); }
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => { setRunning(false); setAlarming(false); setRemaining(null); };
  const stopAlarm = () => { setAlarming(false); setRemaining(null); };

  const show = remaining == null ? setTotal : remaining;
  const hh = Math.floor(show / 3600), mm = Math.floor((show % 3600) / 60), ss = show % 60;
  const clock = (hh > 0 ? String(hh).padStart(2, "0") + ":" : "") + String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
  const numBtn = { background: C.card, border: `1px solid ${C.line}`, color: C.ink, borderRadius: 14, padding: "14px 0", fontSize: 22, fontWeight: 700, cursor: "pointer", width: 70 };
  const bigBtn = (bg, fg) => ({ background: bg, color: fg, border: "none", borderRadius: 16, padding: "16px 30px", fontSize: 18, fontWeight: 700, cursor: "pointer" });
  const stepper = (label, val, setVal, max) => (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{label}</div>
      <button onClick={() => setVal((v) => (v + 1) % (max + 1))} style={numBtn}>▲</button>
      <div className="display" style={{ fontSize: 40, fontWeight: 800, margin: "6px 0", color: C.rust }}>{String(val).padStart(2, "0")}</div>
      <button onClick={() => setVal((v) => (v - 1 + (max + 1)) % (max + 1))} style={numBtn}>▼</button>
    </div>
  );

  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(58,42,30,.55)", zIndex: 80, display: "grid", placeItems: "center", padding: 16 }}>
      <div className="scr" style={{ background: C.cream, borderRadius: 26, border: `1px solid ${C.line}`, width: "min(680px, 96vw)", maxHeight: "92vh", overflowY: "auto", padding: "26px 26px 30px", boxShadow: "0 30px 80px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <h2 className="display" style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>Timer</h2>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={pillGhost}>Close</button>
        </div>
        <p style={{ color: C.inkSoft, marginTop: 0, fontSize: 15 }}>A standalone kitchen timer — not tied to any recipe.</p>

        {alarming ? (
          <div style={{ textAlign: "center", padding: "30px 10px" }}>
            <div className="display" style={{ fontSize: "clamp(56px,16vw,110px)", fontWeight: 800, color: C.rust, animation: "ring .6s ease infinite" }}>00:00</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 22 }}>Time's up!</div>
            <button onClick={stopAlarm} style={bigBtn(C.rust, "#fff")}>Stop alarm</button>
          </div>
        ) : remaining == null ? (
          <>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", alignItems: "center", margin: "10px 0 24px" }}>
              {stepper("Hours", h, setH, 23)}
              <span className="display" style={{ fontSize: 40, fontWeight: 800, color: C.line }}>:</span>
              {stepper("Minutes", mn, setMn, 59)}
              <span className="display" style={{ fontSize: 40, fontWeight: 800, color: C.line }}>:</span>
              {stepper("Seconds", sc, setSc, 59)}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 22 }}>
              {[["1m", 0, 1, 0], ["3m", 0, 3, 0], ["5m", 0, 5, 0], ["10m", 0, 10, 0], ["30m", 0, 30, 0], ["1h", 1, 0, 0]].map(([l, ph, pm, ps]) => (
                <button key={l} onClick={() => { setH(ph); setMn(pm); setSc(ps); }} style={{ ...pillGhost }}>{l}</button>
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={startResume} disabled={setTotal <= 0} style={{ ...bigBtn(setTotal > 0 ? C.go : C.line, "#fff"), opacity: setTotal > 0 ? 1 : 0.6 }}>Start</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center", margin: "14px 0 26px" }}>
              <div className="display" style={{ fontSize: "clamp(64px,18vw,130px)", fontWeight: 800, color: running ? C.ink : C.inkSoft, lineHeight: 1 }}>{clock}</div>
              <div style={{ fontSize: 15, color: C.inkSoft, marginTop: 6 }}>{running ? "Counting down…" : "Paused"}</div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {running
                ? <button onClick={pause} style={bigBtn(C.gold, C.ink)}>Pause</button>
                : <button onClick={startResume} style={bigBtn(C.go, "#fff")}>{remaining > 0 ? "Resume" : "Start"}</button>}
              <button onClick={reset} style={bigBtn(C.card, C.ink)}>Reset</button>
            </div>
          </>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 26, paddingTop: 18, borderTop: `1px solid ${C.line}` }}>
          <span style={{ fontSize: 14, color: C.inkSoft }}>Alarm sound</span>
          <button onClick={() => { setAlarmEnabled((v) => !v); if (alarmEnabled) setAlarming(false); }}
            style={{ background: alarmEnabled ? C.go : "transparent", border: `1.5px solid ${alarmEnabled ? C.go : C.line}`, color: alarmEnabled ? "#fff" : C.inkSoft, borderRadius: 999, padding: "8px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {alarmEnabled ? "On" : "Off (disabled)"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Switcher({ productions, activeId, onSwitch, onNew }) {
  const [, setT] = useState(0);
  useEffect(() => { const i = setInterval(() => setT((x) => x + 1), 1000); return () => clearInterval(i); }, []);
  return (
    <div style={{ background: C.card, borderBottom: `1px solid ${C.line}`, padding: "10px 22px", display: "flex", gap: 10, alignItems: "center", overflowX: "auto" }}>
      <span style={{ color: C.inkSoft, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap" }}>Live ({productions.length})</span>
      {productions.map((p) => {
        const on = p.id === activeId;
        return (
          <button key={p.id} onClick={() => onSwitch(p.id)} style={{ background: on ? C.rust : C.cream, color: on ? "#fff" : C.ink, border: `1px solid ${on ? C.rust : C.line}`, borderRadius: 999, padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", display: "flex", gap: 8, alignItems: "center" }}>
            {p.recipe.name} · {p.targetQty}{p.recipe.yieldUnit}
            <span style={{ background: on ? "rgba(255,255,255,.25)" : C.line, borderRadius: 999, padding: "2px 8px", fontSize: 11 }}>{p.stepIndex + 1}/{p.recipe.steps.length}</span>
            <span style={{ background: on ? "rgba(0,0,0,.2)" : C.cream, borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{fmtClock(Math.floor((Date.now() - (p.startedAt || Date.now())) / 1000))}</span>
          </button>
        );
      })}
      <button onClick={onNew} style={{ background: "transparent", border: `1.5px dashed ${C.inkSoft}`, color: C.inkSoft, borderRadius: 999, padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>+ New</button>
    </div>
  );
}

function Eyebrow({ children }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}><span style={{ width: 30, height: 2, background: C.rust }} /><span style={{ color: C.rust, fontWeight: 700, letterSpacing: 3, fontSize: 12, textTransform: "uppercase" }}>{children}</span></div>;
}

function Home({ user, staff, recipes, ingredients, onSignIn, onPick, verifyPin, storeStock = {}, centralStock = {}, cpu, stores = [], runs = [], onOpenStock }) {
  const [pinFor, setPinFor] = useState(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const [errKind, setErrKind] = useState("wrong"); // "wrong" | "server"
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);
  // One-shot voice search: tap the mic, say a recipe, it fills the search box.
  const startVoiceSearch = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setListening(false); alert("Voice search isn't supported in this browser. You can still type to search."); return; }
    const rec = new SR();
    rec.lang = "en-GB"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = (e) => setQuery(e.results[0][0].transcript.replace(/[.?!]+$/, "").trim());
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    try { rec.start(); setListening(true); } catch { setListening(false); }
  };
  useEffect(() => {
    const h = (e) => {
      const t = e.detail;
      if (!user) { const m = staff.find((s) => t.includes(s.name.toLowerCase())); if (m) onSignIn(m); }
      else if (user.role === "production") { const r = recipes.find((r) => t.includes(r.name.toLowerCase().split(" ")[0])); if (r) onPick(r); }
    };
    window.addEventListener("voicecmd", h); return () => window.removeEventListener("voicecmd", h);
  }, [user, staff, recipes, onSignIn, onPick]);

  if (!user) {
    return (
      <div className="scr">
        <Eyebrow>Sign in</Eyebrow>
        <h1 className="display" style={{ fontSize: 54, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.02 }}>Who's on the <span style={{ color: C.rust }}>floor?</span></h1>
        <p style={{ fontSize: 18, color: C.inkSoft, marginTop: 0, fontWeight: 400 }}>Tap your name, then your PIN. Or say “Sign in [name]”.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginTop: 22 }}>
          {staff.map((s) => (
            <button key={s.id} onClick={() => { setPinFor(s); setPin(""); setErr(false); }} style={{ background: C.card, border: pinFor?.id === s.id ? `2px solid ${C.rust}` : `1px solid ${C.line}`, borderRadius: 20, padding: "24px 20px", cursor: "pointer", color: C.ink, textAlign: "left" }}>
              <div style={{ width: 52, height: 52, borderRadius: 999, background: s.role === "driver" ? C.rust : C.gold, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 22, marginBottom: 12 }}>{s.name[0]}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{s.name}</div>
              <div style={{ fontSize: 13, color: C.inkSoft, textTransform: "capitalize" }}>{s.role}</div>
            </button>
          ))}
        </div>

        {/* Compact live-stock summary, visible to everyone on the sign-in page */}
        <div style={{ marginTop: 30 }}>
          <StockPanel recipes={recipes} storeStock={storeStock} centralStock={centralStock} cpu={cpu} stores={stores} onOpenStock={onOpenStock} />
        </div>

        {pinFor && (
          <Modal onClose={() => { setPinFor(null); setPin(""); setErr(false); }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 999, background: pinFor.role === "driver" ? C.rust : C.gold, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 24, marginBottom: 10 }}>{pinFor.name[0]}</div>
              <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>{pinFor.name}</div>
              <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 14, textTransform: "capitalize" }}>Enter PIN</div>
              <div style={{ fontSize: 36, letterSpacing: 14, textAlign: "center", minHeight: 46, color: err ? C.rust : C.ink }}>{pin.replace(/./g, "•")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 14, width: "100%", maxWidth: 300 }}>
                {[1,2,3,4,5,6,7,8,9].map((n) => <button key={n} onClick={() => { setErr(false); setPin((p) => (p + n).slice(0, 4)); }} style={padBtn}>{n}</button>)}
                <button onClick={() => setPin("")} style={{ ...padBtn, fontSize: 15 }}>clear</button>
                <button onClick={() => setPin((p) => (p + "0").slice(0, 4))} style={padBtn}>0</button>
                <button onClick={async () => { try { const u = await verifyPin(pin); if (u) { onSignIn(u); } else { setErrKind("wrong"); setErr(true); setPin(""); } } catch (e) { console.error("Sign-in failed", e); setErrKind("server"); setErr(true); setPin(""); } }} style={{ ...padBtn, background: C.go, color: "#fff" }}>✓</button>
              </div>
              {err && <p style={{ color: C.rust, fontSize: 13, marginBottom: 0, marginTop: 12 }}>{errKind === "server" ? "Couldn't reach the server — check the connection and try again." : "Wrong PIN — try again."}</p>}
              <p style={{ color: C.inkSoft, fontSize: 12, marginTop: 12, marginBottom: 0, textAlign: "center" }}>Demo: Marco 1234 · Aylin 2222 · Tomas 3333 · Driver Sam 9999</p>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div className="scr">
      <Eyebrow>Production</Eyebrow>
      <h1 className="display" style={{ fontSize: 50, fontWeight: 800, margin: "0 0 4px" }}>What are we <span style={{ color: C.rust }}>making?</span></h1>
      <p style={{ fontSize: 18, color: C.inkSoft, marginTop: 0, fontWeight: 400 }}>Pick a recipe — start as many as you like and switch between them up top.</p>
      <div style={{ marginTop: 18 }}>
        <StockPanel recipes={recipes} storeStock={storeStock} centralStock={centralStock} cpu={cpu} stores={stores} onOpenStock={onOpenStock} />
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 4, alignItems: "stretch" }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search recipes — type or tap the mic"
          style={{ flex: 1, background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px 18px", fontSize: 18, color: C.ink }} />
        {query && <button onClick={() => setQuery("")} title="Clear" style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "0 16px", fontSize: 18, color: C.inkSoft, cursor: "pointer" }}>✕</button>}
        <button onClick={startVoiceSearch} title="Say a recipe"
          style={{ background: listening ? C.rust : C.card, border: `1px solid ${listening ? C.rust : C.line}`, color: listening ? "#fff" : C.ink, borderRadius: 14, padding: "0 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          <span className="hide-sm">{listening ? "Listening…" : "Voice"}</span>
        </button>
      </div>
      {(() => {
        const q = query.trim().toLowerCase();
        // Production recipes only — service recipes live in the S.Book
        const prod = recipes.filter((r) => (r.dept2 || "Production") === "Production");
        const filtered = q ? prod.filter((r) => r.name.toLowerCase().includes(q) || (r.category || "").toLowerCase().includes(q)) : prod;
        if (!filtered.length) return <div style={{ background: C.card, borderRadius: 16, padding: 22, color: C.inkSoft, border: `1px solid ${C.line}`, marginTop: 18 }}>No recipes match “{query}”.</div>;
        return (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 18, marginTop: 18 }}>
            {filtered.map((r) => (
              <button key={r.id} onClick={() => onPick(r)} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 22, padding: 0, overflow: "hidden", cursor: "pointer", color: C.ink, textAlign: "left" }}>
                <div style={{ height: 150, background: r.hero ? `url(${r.hero}) center/cover` : `linear-gradient(135deg,${C.goldSoft},${C.rust})` }} />
                <div style={{ padding: "16px 20px" }}>
                  <div className="display" style={{ fontSize: 25, fontWeight: 700 }}>{r.name}</div>
                  <div style={{ fontSize: 14, color: C.inkSoft, marginTop: 4 }}>{r.steps.length} steps · yields {r.yieldKg} {r.yieldUnit}</div>
                </div>
              </button>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
const padBtn = { background: C.cream, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 0", fontSize: 24, fontWeight: 700, cursor: "pointer" };
const pillGhost = { background: "transparent", border: `1.5px solid ${C.line}`, color: C.ink, borderRadius: 999, padding: "9px 16px", fontWeight: 600, cursor: "pointer", fontSize: 14 };

function Quantity({ recipe, ingredients, onBack, onStart }) {
  const [qty, setQty] = useState(recipe.yieldKg);
  const factor = qty / recipe.yieldKg;
  const m = ingMap(ingredients);
  const items = recipeItems(recipe);
  useEffect(() => {
    const h = (e) => { const t = e.detail; const n = t.match(/(\d+(\.\d+)?)/); if (n && (t.includes(recipe.yieldUnit) || t.includes("make"))) setQty(parseFloat(n[1])); if (t.includes("start") || t.includes("begin") || t.includes("go")) onStart(qty); };
    window.addEventListener("voicecmd", h); return () => window.removeEventListener("voicecmd", h);
  }, [qty, onStart, recipe.yieldUnit]);
  return (
    <div className="scr">
      <button onClick={onBack} style={pillGhost}>← Back</button>
      <h1 className="display" style={{ fontSize: 44, fontWeight: 800, margin: "12px 0 2px" }}>{recipe.name}</h1>
      <p style={{ fontSize: 18, color: C.inkSoft, marginTop: 0 }}>How many {recipe.yieldUnit} do you need to produce?</p>
      <div style={{ display: "flex", alignItems: "center", gap: 20, justifyContent: "center", margin: "18px 0", flexWrap: "wrap" }}>
        <button onClick={() => setQty((k) => Math.max(1, +(k - 1).toFixed(1)))} style={stepBtn}>−</button>
        <div style={{ textAlign: "center" }}><div className="display" style={{ fontSize: 92, fontWeight: 800, lineHeight: 1, color: C.rust }}>{qty}</div><div style={{ fontSize: 20, color: C.inkSoft, fontWeight: 600 }}>{recipe.yieldUnit}</div></div>
        <button onClick={() => setQty((k) => +(k + 1).toFixed(1))} style={stepBtn}>+</button>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 22 }}>
        {[5, 10, 20, 50].map((n) => <button key={n} onClick={() => setQty(n)} style={{ background: qty === n ? C.rust : C.card, color: qty === n ? "#fff" : C.ink, border: `1px solid ${qty === n ? C.rust : C.line}`, borderRadius: 14, padding: "12px 22px", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>{n}</button>)}
      </div>
      <div style={{ background: C.card, borderRadius: 20, padding: 22, border: `1px solid ${C.line}` }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.rust, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Total ingredients ×{factor.toFixed(2)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 8 }}>
          {items.map((it) => <div key={it.ingId} style={{ display: "flex", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${C.line}` }}><span style={{ fontWeight: 400 }}>{m[it.ingId]?.name}</span><span className="display" style={{ fontWeight: 700 }}>{(it.qty * factor).toFixed(2)} {m[it.ingId]?.unit}</span></div>)}
        </div>
      </div>
      <div style={{ marginTop: 24 }}><BigButton full tone="rust" onClick={() => onStart(qty)} voiceHint="start">START</BigButton></div>
    </div>
  );
}

function RunRecipe({ production, ingredients, recipes = [], onStep, onComplete, onCancel, onBack }) {
  const rcById = Object.fromEntries(recipes.map((r) => [r.id, r]));
  const cName = (u) => u.recipeId ? (rcById[u.recipeId]?.name || "Recipe") : ingMap(ingredients)[u.ingId]?.name;
  const cUnit = (u) => u.recipeId ? (u.unit || "units") : ingMap(ingredients)[u.ingId]?.unit;
  const { recipe, targetQty, stepIndex } = production;
  const factor = targetQty / recipe.yieldKg;
  const m = ingMap(ingredients);
  const step = recipe.steps[stepIndex];

  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(step.timerSec || 0);
  const [stepStart, setStepStart] = useState(Date.now());
  const [alerted, setAlerted] = useState(false);
  const [showStop, setShowStop] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  // live elapsed clocks: total (since production started) + this step
  useEffect(() => { const i = setInterval(() => setNowTick(Date.now()), 500); return () => clearInterval(i); }, []);
  const totalElapsed = Math.floor((nowTick - (production.startedAt || stepStart)) / 1000);
  const stepElapsed = Math.floor((nowTick - stepStart) / 1000);

  useEffect(() => { setRunning(false); setRemaining(step.timerSec || 0); setAlerted(false); setStepStart(Date.now()); }, [stepIndex]);
  useEffect(() => { if (!running) return; const i = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000); return () => clearInterval(i); }, [running]);
  useEffect(() => { if (running && remaining === 0 && !alerted) { setAlerted(true); setRunning(false); beep(); } }, [running, remaining, alerted]);

  const next = useCallback(() => {
    const dur = Math.floor((Date.now() - stepStart) / 1000);
    if (stepIndex + 1 < recipe.steps.length) onStep({ stepIndex: stepIndex + 1, durations: [...production.durations, dur] });
    else { onStep({ durations: [...production.durations, dur] }); onComplete(); }
  }, [stepIndex, recipe.steps.length, onStep, production.durations, stepStart, onComplete]);

  useEffect(() => {
    const h = (e) => { const t = e.detail; if (t.includes("done") || t.includes("next") || t.includes("ok") || t.includes("yes")) next(); if (t.includes("start count") || t.includes("start timer")) setRunning(true); if (t.includes("stop")) setShowStop(true); };
    window.addEventListener("voicecmd", h); return () => window.removeEventListener("voicecmd", h);
  }, [next]);

  const used = step.use || [];
  const manyIng = used.length > 5; // shrink harder when there are lots of ingredients

  return (
    <div className="runscr" style={{ height: "100dvh", display: "flex", flexDirection: "column", gap: "clamp(6px, 1.2vh, 12px)", overflow: "hidden", padding: "clamp(8px,1.6vh,16px) clamp(10px,2.5vw,22px)" }}>
      {/* full-screen top bar: back · LIVE · recipe name · time · step count */}
      <div style={{ display: "flex", alignItems: "center", gap: "clamp(6px,1.5vw,12px)", flexShrink: 0 }}>
        <button onClick={onBack} title="Back to recipes (production keeps running)" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink, borderRadius: 12, padding: "clamp(7px,1.4vh,11px) clamp(11px,2vw,15px)", fontWeight: 800, fontSize: "clamp(15px,2.6vw,19px)", cursor: "pointer", flexShrink: 0 }}>←</button>
        <span style={{ background: C.rust, color: "#fff", borderRadius: 999, padding: "5px 12px", fontWeight: 800, fontSize: "clamp(10px,1.8vw,12px)", letterSpacing: 1, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}><span style={{ width: 8, height: 8, borderRadius: 999, background: "#fff", animation: "ring 1.2s infinite" }} />LIVE</span>
        <span className="display" style={{ fontSize: "clamp(16px,3vw,26px)", fontWeight: 800, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{recipe.name} · {targetQty} {recipe.yieldUnit}</span>
        <div style={{ flex: 1 }} />
        <div style={{ background: C.ink, color: C.cream, borderRadius: 999, padding: "5px 13px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", opacity: .8 }}>time</span>
          <span className="display" style={{ fontSize: "clamp(16px, 2.8vw, 22px)", fontWeight: 800 }}>{fmtClock(totalElapsed)}</span>
        </div>
        <div style={{ fontSize: "clamp(14px, 2.4vw, 18px)", fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0 }}>{stepIndex + 1}/{recipe.steps.length}</div>
      </div>

      {/* progress */}
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        {recipe.steps.map((_, k) => <div key={k} style={{ flex: 1, height: 7, borderRadius: 999, background: k < stepIndex ? C.go : k === stepIndex ? C.rust : C.line }} />)}
      </div>

      {/* step card — flexes to fill remaining height; content force-fit, page never scrolls */}
      <div style={{ position: "relative", flex: 1, minHeight: 0, background: C.card, borderRadius: 20, padding: "clamp(12px, 2.5vh, 26px) clamp(14px, 3vw, 30px)", textAlign: "center", border: `1px solid ${C.line}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* corner badges: step elapsed + target recommendation (guide only) */}
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.cream, border: `1px solid ${C.line}`, borderRadius: 999, padding: "3px 9px" }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: .5, textTransform: "uppercase", color: C.inkSoft }}>step</span>
            <span className="display" style={{ fontSize: "clamp(13px, 2.2vw, 16px)", fontWeight: 800, color: C.rust }}>{fmtClock(stepElapsed)}</span>
          </div>
          {(step.estSec || step.timerSec) > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.cardSoft, border: `1px solid ${C.line}`, borderRadius: 999, padding: "3px 9px" }} title="Recommended time — a guide, not a countdown">
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: .5, textTransform: "uppercase", color: C.inkSoft }}>target</span>
              <span className="display" style={{ fontSize: "clamp(13px, 2.2vw, 16px)", fontWeight: 800, color: C.go }}>~{fmtClock(step.isTimed && step.timerSec ? step.timerSec : (step.estSec || 0))}</span>
            </div>
          )}
        </div>

        <div style={{ fontSize: "clamp(10px, 1.6vw, 13px)", fontWeight: 700, color: C.gold, letterSpacing: 2, flexShrink: 0, textAlign: "left" }}>STEP {String(stepIndex + 1).padStart(2, "0")}</div>

        {/* image: only when present AND not crowded by many ingredients; shrinks with viewport */}
        {step.image && !manyIng && (
          <div style={{ flexShrink: 0, height: "clamp(70px, 16vh, 170px)", borderRadius: 14, margin: "clamp(6px,1.2vh,12px) auto", width: "min(420px, 100%)", background: `url(${step.image}) center/cover` }} />
        )}

        {/* step text — big, bold, high-contrast: readable from a couple of steps away */}
        <div className="display" style={{ fontSize: manyIng ? "clamp(20px, 3.8vw, 34px)" : "clamp(24px, 4.6vw, 46px)", fontWeight: 700, lineHeight: 1.12, color: C.ink, margin: "clamp(4px,1vh,10px) 0", flexShrink: 0 }}>{step.text}</div>

        {/* ingredients — the flexible middle; only THIS scrolls if truly necessary on tiny screens */}
        {used.length > 0 && (
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "grid", gap: manyIng ? "clamp(4px,0.8vh,7px)" : "clamp(6px,1vh,10px)", alignContent: "center", maxWidth: 640, width: "100%", marginLeft: "auto", marginRight: "auto" }}>
            {used.map((u, ui) => (
              <div key={u.ingId || u.recipeId || ui} style={{ background: C.cream, borderRadius: 12, padding: manyIng ? "clamp(6px,1vh,9px) clamp(12px,2.5vw,18px)" : "clamp(9px,1.5vh,14px) clamp(14px,3vw,22px)", border: `1.5px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span className="display" style={{ fontSize: manyIng ? "clamp(15px, 3vw, 22px)" : "clamp(17px, 3.6vw, 28px)", fontWeight: 700, color: C.ink, textAlign: "left", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{u.recipeId ? "▸ " : ""}{cName(u)}</span>
                <span className="display" style={{ fontSize: manyIng ? "clamp(16px, 3.2vw, 24px)" : "clamp(19px, 4vw, 32px)", fontWeight: 700, color: C.rust, whiteSpace: "nowrap" }}>{(u.qty * factor).toFixed(2)}<span style={{ fontSize: "0.55em" }}> {cUnit(u)}</span></span>
              </div>
            ))}
          </div>
        )}
        {used.length === 0 && <div style={{ flex: 1, minHeight: 0 }} />}

        {/* timed countdown — only for genuine wait steps; sits at the bottom of the card */}
        {step.isTimed && step.timerSec > 0 && (
          <div style={{ flexShrink: 0, marginTop: "clamp(4px,1vh,8px)" }}>
            <div className="display" style={{ fontSize: "clamp(34px, 8vh, 60px)", fontWeight: 800, lineHeight: 1, color: remaining === 0 ? C.go : running ? C.rust : C.ink, animation: running ? "ring 1.2s infinite" : "none" }}>{fmtClock(remaining)}</div>
            {!running && remaining === step.timerSec && (
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 6, alignItems: "center", flexWrap: "wrap" }}>
                <BigButton tone="go" onClick={() => setRunning(true)} voiceHint="start count">START COUNT</BigButton>
                <button onClick={next} style={{ background: "transparent", border: `1.5px solid ${C.inkSoft}`, color: C.inkSoft, borderRadius: 12, padding: "12px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>skip ›</button>
              </div>
            )}
            {running && <div style={{ color: C.inkSoft, marginTop: 4, fontSize: 13 }}>Counting… you'll be alerted when done.</div>}
            {!running && remaining < step.timerSec && <div style={{ color: remaining === 0 ? C.go : C.gold, fontWeight: 700, marginTop: 4, fontSize: 14 }}>{remaining === 0 ? "Time's up" : "Paused"}</div>}
          </div>
        )}
      </div>

      {/* action bar pinned at bottom — fixed height, never overlaps */}
      <div style={{ display: "flex", gap: 10, alignItems: "stretch", flexShrink: 0 }}>
        <button onClick={() => setShowStop(true)} style={{ background: "transparent", border: `1.5px solid ${C.rust}`, color: C.rust, borderRadius: 14, padding: "0 clamp(16px,4vw,26px)", fontWeight: 700, fontSize: "clamp(14px,2.4vw,17px)", cursor: "pointer", whiteSpace: "nowrap" }}>STOP</button>
        <div style={{ flex: 1, display: "flex" }}>
          <BigButton full tone="go" onClick={next} voiceHint="done">{stepIndex + 1 < recipe.steps.length ? "STEP DONE → NEXT" : "FINISH PRODUCTION"}</BigButton>
        </div>
      </div>

      {showStop && (
        <Modal onClose={() => setShowStop(false)}>
          <div className="display" style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Stop this production?</div>
          <p style={{ color: C.inkSoft, marginTop: 0 }}>{recipe.name} · {targetQty} {recipe.yieldUnit}</p>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <BigButton full tone="go" onClick={() => { setShowStop(false); onStep({ durations: [...production.durations, Math.floor((Date.now() - stepStart) / 1000)] }); onComplete(); }}>COMPLETED — where's it going?</BigButton>
            <BigButton full tone="rust" onClick={() => { setShowStop(false); onCancel(); }}>CANCELLED — discard</BigButton>
            <button onClick={() => setShowStop(false)} style={{ background: "transparent", border: "none", color: C.inkSoft, fontWeight: 600, fontSize: 16, cursor: "pointer", padding: 10 }}>Keep going</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* End-of-production yield check — confirm how much was actually made. */
function YieldCheck({ production, onConfirm }) {
  const { recipe, targetQty } = production;
  const unit = recipe.yieldUnit;
  const [actual, setActual] = useState(targetQty);
  return (
    <div className="scr" style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
      <Eyebrow>Yield check</Eyebrow>
      <h1 className="display" style={{ fontSize: "clamp(28px,6vw,42px)", fontWeight: 800, margin: "0 0 6px" }}>Did you make <span style={{ color: C.rust }}>{targetQty} {unit}</span>?</h1>
      <p style={{ fontSize: 17, color: C.inkSoft, marginTop: 0 }}>Confirm what you actually got — this keeps the recipe's yield accurate. (Within 5% adjusts automatically; bigger gaps are flagged for admin.)</p>
      <div style={{ display: "flex", alignItems: "center", gap: 20, justifyContent: "center", margin: "22px 0", flexWrap: "wrap" }}>
        <button onClick={() => setActual((a) => Math.max(0, +((Number(a) || 0) - 1).toFixed(1)))} style={stepBtn}>−</button>
        <div style={{ textAlign: "center" }}>
          <input type="number" inputMode="decimal" value={actual} onChange={(e) => setActual(e.target.value)} onFocus={(e) => e.target.select()}
            style={{ width: 180, textAlign: "center", border: `2px solid ${C.line}`, borderRadius: 16, background: C.card, color: C.rust, fontFamily: "'Quicksand',sans-serif", fontSize: 72, fontWeight: 800, lineHeight: 1, padding: "6px 0" }} />
          <div style={{ fontSize: 18, color: C.inkSoft, fontWeight: 600 }}>{unit} — tap the number to type</div>
        </div>
        <button onClick={() => setActual((a) => +((Number(a) || 0) + 1).toFixed(1))} style={stepBtn}>+</button>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
        {(Number(actual) || 0) !== targetQty && <button onClick={() => setActual(targetQty)} style={pillGhost}>Reset to {targetQty}</button>}
      </div>
      <BigButton full tone="go" onClick={() => onConfirm(Number(actual) || 0)}>{(Number(actual) || 0) === targetQty ? "Yes — that's right" : `Confirm ${Number(actual) || 0} ${unit}`}</BigButton>
    </div>
  );
}

function Distribute({ production, stores, locations, delivery, onConfirm }) {
  const { recipe } = production;
  const targetQty = production.actualQty ?? production.targetQty; // what was actually made
  const [alloc, setAlloc] = useState(stores.map((s) => ({ store: s, qty: 0 })));
  const [central, setCentral] = useState(0);
  const assigned = alloc.reduce((a, b) => a + b.qty, 0) + central;
  const left = +(targetQty - assigned).toFixed(2);
  const set = (store, qty) => setAlloc((a) => a.map((x) => x.store === store ? { ...x, qty: Math.max(0, qty) } : x));
  return (
    <div className="scr">
      <Eyebrow>Distribute</Eyebrow>
      <h1 className="display" style={{ fontSize: 42, fontWeight: 800, margin: "0 0 2px" }}>Where's it <span style={{ color: C.rust }}>going?</span></h1>
      <p style={{ fontSize: 18, color: C.inkSoft, marginTop: 0 }}>You made <b>{targetQty} {recipe.yieldUnit}</b> of {recipe.name}. Hold <b>+</b> to add all that's left · hold <b>−</b> to reset to 0.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16, marginTop: 18 }}>
        {alloc.map(({ store, qty }) => {
          const loc = locations.find((l) => l.name === store);
          const dc = deliveryCost(loc, delivery);
          return (
            <div key={store} style={{ background: C.card, borderRadius: 20, padding: 20, border: `1px solid ${C.line}` }}>
              <div className="display" style={{ fontSize: 21, fontWeight: 700, marginBottom: 4 }}>{store}</div>
              <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 10 }}>{loc ? `${loc.distanceMi}mi · ${loc.driveMin}min · delivery ${fmtMoney(dc)}` : "no location set"}</div>
              <Stepper value={qty} unit={recipe.yieldUnit} onChange={(v) => set(store, v)} onFillAll={() => set(store, +(qty + Math.max(0, left)).toFixed(1))} onZero={() => set(store, 0)} />
            </div>
          );
        })}
        <div style={{ background: C.cardSoft, borderRadius: 20, padding: 20, border: `1.5px dashed ${C.gold}` }}>
          <div className="display" style={{ fontSize: 21, fontWeight: 700, marginBottom: 4 }}>Not for delivery</div>
          <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 10 }}>Held in Total Production stock (no delivery cost)</div>
          <Stepper value={central} unit={recipe.yieldUnit} onChange={setCentral} onFillAll={() => setCentral((c) => +(c + Math.max(0, left)).toFixed(1))} onZero={() => setCentral(0)} />
        </div>
      </div>
      <div style={{ textAlign: "center", margin: "20px 0", fontSize: 20, fontWeight: 700, color: left === 0 ? C.go : left < 0 ? C.rust : C.gold }}>
        {left === 0 ? "All allocated" : left > 0 ? `${left} ${recipe.yieldUnit} left to allocate` : `${Math.abs(left)} over — reduce somewhere`}
      </div>
      <BigButton full tone="go" disabled={left !== 0 || assigned === 0} onClick={() => onConfirm(alloc.filter((a) => a.qty > 0), central)}>CONFIRM</BigButton>
    </div>
  );
}
function Stepper({ value, unit, onChange, onFillAll, onZero }) {
  const minus = useHold(() => onChange(+(value - 0.5).toFixed(1)), onZero);
  const plus = useHold(() => onChange(+(value + 0.5).toFixed(1)), onFillAll);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", userSelect: "none" }}>
      <button {...minus} title="Tap −0.5 · hold = 0" style={{ ...stepBtn, width: 52, height: 52, fontSize: 28 }}>−</button>
      <div className="display" style={{ fontSize: 44, fontWeight: 800, minWidth: 90, textAlign: "center", color: C.rust }}>{value}<span style={{ fontSize: 15, color: C.inkSoft }}> {unit}</span></div>
      <button {...plus} title="Tap +0.5 · hold = all remaining" style={{ ...stepBtn, width: 52, height: 52, fontSize: 28 }}>+</button>
    </div>
  );
}

function DriverView({ deliveryQueue, stores, onCollected }) {
  const [store, setStore] = useState(null);
  const [checked, setChecked] = useState({});
  if (!store) {
    return (
      <div className="scr">
        <Eyebrow>Delivery</Eyebrow>
        <h1 className="display" style={{ fontSize: 42, fontWeight: 800, margin: "0 0 4px" }}>Delivery <span style={{ color: C.rust }}>run</span></h1>
        <p style={{ fontSize: 18, color: C.inkSoft, marginTop: 0 }}>Pick a shop to see what's waiting for collection.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginTop: 18 }}>
          {stores.map((s) => {
            const items = deliveryQueue[s] || [];
            const totalQty = items.reduce((a, b) => a + b.qty, 0);
            return (
              <button key={s} onClick={() => { setStore(s); setChecked({}); }} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 24, cursor: "pointer", color: C.ink, textAlign: "left" }}>
                <div className="display" style={{ fontSize: 24, fontWeight: 700 }}>{s}</div>
                <div style={{ fontSize: 15, color: items.length ? C.rust : C.inkSoft, marginTop: 6, fontWeight: 600 }}>{items.length ? `${items.length} items · ${totalQty.toFixed(1)} waiting` : "Nothing waiting"}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  const items = deliveryQueue[store] || [];
  const allChecked = items.length > 0 && items.every((it) => checked[it.id]);
  return (
    <div className="scr">
      <button onClick={() => setStore(null)} style={pillGhost}>← All shops</button>
      <div style={{ background: C.cardSoft, color: C.ink, borderRadius: 20, padding: 24, marginTop: 12, border: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div className="display" style={{ fontWeight: 800, fontSize: 23 }}>{store}</div>
          <div style={{ fontSize: 13, color: C.inkSoft }}>Tick each item as you load it</div>
        </div>
        <div style={{ borderBottom: `2px dashed ${C.line}`, margin: "14px 0" }} />
        {items.length === 0 ? <div style={{ color: C.inkSoft, padding: "10px 0" }}>Nothing waiting for this shop.</div> :
          items.map((it) => (
            <label key={it.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: `1px solid ${C.line}`, cursor: "pointer" }}>
              <input type="checkbox" checked={!!checked[it.id]} onChange={(e) => setChecked((c) => ({ ...c, [it.id]: e.target.checked }))} style={{ width: 28, height: 28, accentColor: C.go }} />
              <span style={{ fontSize: 20, fontWeight: 700, textDecoration: checked[it.id] ? "line-through" : "none", opacity: checked[it.id] ? 0.5 : 1 }}>{it.qty}{it.unit} {it.recipe}</span>
              <span style={{ marginLeft: "auto", fontSize: 13, color: C.inkSoft }}>by {it.by}</span>
            </label>
          ))}
      </div>
      {items.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <BigButton full tone="go" disabled={!allChecked} onClick={() => { onCollected(store); setStore(null); }}>{allChecked ? "ALL LOADED — CONFIRM COLLECTION" : `${items.filter((i) => checked[i.id]).length}/${items.length} ticked`}</BigButton>
        </div>
      )}
    </div>
  );
}

/* ===================== LIVE PRODUCTION STOCK (all users) ===================== */
/* Compact live-stock summary for the home/sign-in page (Production recipes only),
   with a link to the full Stock page. */
function StockPanel({ recipes, storeStock, centralStock, cpu, stores, onOpenStock }) {
  const cpuName = cpu?.name || "CPU";
  const cols = [...stores, cpuName];
  const prodNames = new Set(recipes.filter((r) => (r.dept2 || "Production") === "Production").map((r) => r.name));
  const rowsMap = {};
  stores.forEach((s) => Object.entries(storeStock[s] || {}).forEach(([r, q]) => { if (prodNames.has(r)) (rowsMap[r] ||= {})[s] = q; }));
  Object.entries(centralStock || {}).forEach(([r, q]) => { if (prodNames.has(r)) (rowsMap[r] ||= {})[cpuName] = q; });
  let rows = Object.entries(rowsMap).map(([recipe, byLoc]) => ({ recipe, byLoc, total: cols.reduce((a, c) => a + (byLoc[c] || 0), 0) }));
  rows.sort((a, b) => b.total - a.total || a.recipe.localeCompare(b.recipe));
  const top = rows.slice(0, 6);
  return (
    <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.line}`, overflow: "hidden", marginBottom: 26 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 20px", borderBottom: `1px solid ${C.line}`, background: C.cardSoft, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: C.go }} />
          <span className="display" style={{ fontWeight: 800, fontSize: 18 }}>Live stock</span>
        </div>
        <button onClick={onOpenStock} style={{ ...pillGhost, borderColor: C.go, color: C.go, padding: "8px 16px" }}>Full stock & leaderboard →</button>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: 20, color: C.inkSoft, fontSize: 14 }}>No stock yet. Quantities appear here once productions are completed and allocated.</div>
      ) : (
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <div style={{ display: "grid", gridTemplateColumns: `1.6fr repeat(${cols.length}, 1fr) 0.9fr`, minWidth: 110 + cols.length * 110, gap: 10, padding: "10px 20px", fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.line}` }}>
            <span>Recipe</span>
            {cols.map((c) => <span key={c} style={{ textAlign: "right" }}>{c}</span>)}
            <span style={{ textAlign: "right" }}>Total</span>
          </div>
          {top.map((r, idx) => (
            <div key={r.recipe} style={{ display: "grid", gridTemplateColumns: `1.6fr repeat(${cols.length}, 1fr) 0.9fr`, minWidth: 110 + cols.length * 110, gap: 10, padding: "10px 20px", borderTop: idx ? `1px solid ${C.line}` : "none", fontSize: 14, alignItems: "center" }}>
              <b style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.recipe}</b>
              {cols.map((c) => { const v = r.byLoc[c] || 0; return <span key={c} className="display" style={{ textAlign: "right", fontWeight: 700, color: v > 0 ? C.ink : C.line }}>{v ? v.toFixed(1) : "—"}</span>; })}
              <span className="display" style={{ textAlign: "right", fontWeight: 800, color: C.rust }}>{r.total.toFixed(1)}</span>
            </div>
          ))}
          {rows.length > top.length && (
            <button onClick={onOpenStock} style={{ width: "100%", background: "transparent", border: "none", borderTop: `1px solid ${C.line}`, color: C.inkSoft, padding: "11px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ {rows.length - top.length} more · view all</button>
          )}
        </div>
      )}
    </div>
  );
}

/* SERVICE BOOK — permission-gated list of service recipes (reference only). */
function SBook({ recipes, ingredients, onView, onBack }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const service = recipes.filter((r) => (r.dept2 || "Production") === "Service");
  const cats = ["All", ...Array.from(new Set(service.map((r) => r.category).filter(Boolean))).sort()];
  const query = q.trim().toLowerCase();
  const list = service
    .filter((r) => cat === "All" || (r.category || "") === cat)
    .filter((r) => !query || r.name.toLowerCase().includes(query) || (r.category || "").toLowerCase().includes(query));
  return (
    <div className="scr">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
        <button onClick={onBack} style={pillGhost}>← Back</button>
        <div style={{ flex: 1 }} />
      </div>
      <Eyebrow>Service book</Eyebrow>
      <h1 className="display" style={{ fontSize: "clamp(32px, 6vw, 44px)", fontWeight: 800, margin: "0 0 4px" }}>The <span style={{ color: C.rust }}>book</span></h1>
      <p style={{ fontSize: 17, color: C.inkSoft, marginTop: 0 }}>Service recipes for reference. Tap one to read it — no production, just the recipe.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the book…" style={{ width: "100%", maxWidth: 360, background: C.card, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 999, padding: "11px 18px", fontSize: 15, margin: "8px 0 12px", display: "block" }} />
      {cats.length > 1 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} style={{ background: cat === c ? C.rust : C.card, color: cat === c ? "#fff" : C.ink, border: `1.5px solid ${cat === c ? C.rust : C.line}`, borderRadius: 999, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{c}</button>
          ))}
        </div>
      )}
      {list.length === 0 ? (
        <div style={{ background: C.card, borderRadius: 14, padding: 22, color: C.inkSoft, border: `1px solid ${C.line}` }}>{query ? `No service recipes match “${q}”.` : "No service recipes yet. Mark recipes as ‘Service’ (Department) in admin to add them here."}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
          {list.map((r) => (
            <button key={r.id} onClick={() => onView(r)} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: 0, overflow: "hidden", cursor: "pointer", color: C.ink, textAlign: "left" }}>
              <div style={{ height: 120, background: r.hero ? `url(${r.hero}) center/cover` : `linear-gradient(135deg,${C.goldSoft},${C.gold})` }} />
              <div style={{ padding: "12px 16px" }}>
                <div className="display" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.15 }}>{r.name}</div>
                <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 3 }}>{r.category || "Service"}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* SERVICE recipe — one-page read-only reference. No production flow. */
function RecipeView({ recipe, ingredients, recipes = [], onBack, onNavigate }) {
  const m = ingMap(ingredients);
  const recById = Object.fromEntries(recipes.map((r) => [r.id, r]));
  const [lightbox, setLightbox] = useState(null);
  const touch = useRef(null);
  // component-aware ingredient list (handles produced recipes used as components)
  const agg = {};
  (recipe.steps || []).forEach((s) => (s.use || []).forEach((u) => {
    const key = u.recipeId ? "r:" + u.recipeId : "i:" + u.ingId;
    if (!agg[key]) agg[key] = { key, qty: 0, name: u.recipeId ? (recById[u.recipeId]?.name || "Recipe") : (m[u.ingId]?.name || ""), unit: u.recipeId ? (u.unit || "units") : (m[u.ingId]?.unit || ""), isRecipe: !!u.recipeId };
    agg[key].qty += Number(u.qty) || 0;
  }));
  const items = Object.values(agg);

  // gallery: hero first, then any process/final images (deduped)
  const extra = [...(recipe.images?.process || []), ...(recipe.images?.final || [])].filter(Boolean);
  const gallery = Array.from(new Set([recipe.hero, ...extra].filter(Boolean)));

  // siblings for swipe/arrow navigation (service recipes, same order as the book)
  const siblings = recipes.filter((r) => (r.dept2 || "Production") === "Service");
  const idx = siblings.findIndex((r) => r.id === recipe.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const onTouchStart = (e) => { touch.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touch.current == null || !onNavigate) return;
    const dx = e.changedTouches[0].clientX - touch.current; touch.current = null;
    if (dx < -60 && next) onNavigate(next);
    else if (dx > 60 && prev) onNavigate(prev);
  };
  const arrow = (dir) => ({ background: C.card, border: `1px solid ${C.line}`, color: C.ink, borderRadius: 999, width: 44, height: 44, fontSize: 20, fontWeight: 800, cursor: "pointer", flexShrink: 0, opacity: dir ? 1 : 0.3 });

  const frame = { borderRadius: 18, border: `1px solid ${C.line}`, background: C.white, overflow: "hidden", cursor: "zoom-in" };
  const coverImg = { width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" };
  return (
    <div className="scr" style={{ display: "flex", flexDirection: "column", gap: 14 }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button onClick={onBack} style={pillGhost}>← Back</button>
        {onNavigate && <button disabled={!prev} onClick={() => prev && onNavigate(prev)} style={arrow(prev)} title="Previous">‹</button>}
        {onNavigate && <button disabled={!next} onClick={() => next && onNavigate(next)} style={arrow(next)} title="Next">›</button>}
        {siblings.length > 1 && <span style={{ fontSize: 13, color: C.inkSoft }}>{idx + 1} / {siblings.length} · swipe to flip</span>}
        <div style={{ flex: 1 }} />
        <span style={{ background: C.gold, color: C.ink, borderRadius: 999, padding: "5px 14px", fontSize: 13, fontWeight: 700 }}>Reference</span>
      </div>

      <div className="rv-cols" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* LEFT: hero + title + tags + ingredients */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {recipe.hero && (
            <div onClick={() => setLightbox(recipe.hero)} style={{ ...frame, height: "clamp(280px, 46vh, 480px)" }}>
              <img src={recipe.hero} alt={recipe.name} style={coverImg} />
            </div>
          )}
          <div>
            <h1 className="display" style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, margin: 0, lineHeight: 1.02 }}>{recipe.name}</h1>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {recipe.category && <span style={{ background: C.cream, border: `1px solid ${C.line}`, borderRadius: 999, padding: "4px 12px", fontSize: 13, fontWeight: 600 }}>{recipe.category}</span>}
              {(recipe.dietary || []).map((d) => <span key={d} style={{ background: "#E2EFE0", color: C.go, borderRadius: 999, padding: "4px 12px", fontSize: 13, fontWeight: 700 }}>{d}</span>)}
              {(recipe.allergens || []).map((a) => <span key={a} style={{ background: "#F6E0D6", color: C.rustDeep, borderRadius: 999, padding: "4px 12px", fontSize: 13, fontWeight: 700 }}>{a}</span>)}
            </div>
          </div>
          <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.line}`, padding: "16px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.rust, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Ingredients</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}><tbody>
              {items.map((it) => (
                <tr key={it.key} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "11px 0", fontWeight: it.isRecipe ? 700 : 500, color: it.isRecipe ? C.rust : C.ink, fontSize: "clamp(16px, 2.6vw, 20px)" }}>{it.isRecipe ? "▸ " : ""}{it.name}</td>
                  <td className="display" style={{ padding: "11px 0", textAlign: "right", fontWeight: 800, whiteSpace: "nowrap", fontSize: "clamp(16px, 2.6vw, 20px)" }}>{it.qty} {it.unit}</td>
                </tr>
              ))}
            </tbody></table>
          </div>
        </div>

        {/* RIGHT: method with per-step photos */}
        <div style={{ background: C.card, borderRadius: 18, border: `1px solid ${C.line}`, padding: "18px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.rust, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Method</div>
          <div style={{ display: "grid", gap: 18 }}>
            {recipe.steps.map((s, k) => (
              <div key={k} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span className="display" style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, color: C.gold, lineHeight: 1.15, minWidth: 28, flexShrink: 0 }}>{k + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "clamp(16px, 2.8vw, 21px)", lineHeight: 1.5, color: C.ink, fontWeight: 500 }}>{s.text}</div>
                  {s.image && (
                    <div onClick={() => setLightbox(s.image)} style={{ ...frame, marginTop: 10, width: "clamp(160px, 32vw, 260px)", height: "clamp(110px, 20vw, 170px)" }}>
                      <img src={s.image} alt="" style={coverImg} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {recipe.notes && <div style={{ marginTop: 16, padding: "12px 14px", background: C.cardSoft, border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 15, color: C.inkSoft }}><b style={{ color: C.ink }}>Notes:</b> {recipe.notes}</div>}
        </div>
      </div>

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.9)", zIndex: 90, display: "grid", placeItems: "center", padding: 16, cursor: "zoom-out" }}>
          <img src={lightbox} alt={recipe.name} style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12, objectFit: "contain" }} />
          <button onClick={() => setLightbox(null)} style={{ position: "fixed", top: 18, right: 18, background: "rgba(255,255,255,.15)", color: "#fff", border: "none", borderRadius: 999, width: 44, height: 44, fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
      )}
    </div>
  );
}

function LiveStock({ recipes, storeStock, centralStock, cpu, stores, runs = [], embedded = false, onProduce, onBack }) {
  const [query, setQuery] = useState("");
  // build a unified table: every recipe that has stock anywhere, qty per location + CPU
  const cpuName = cpu?.name || "CPU";
  const cols = [...stores, cpuName];
  // only PRODUCTION recipes appear in stock — service recipes are reference only
  const prodNames = new Set(recipes.filter((r) => (r.dept2 || "Production") === "Production").map((r) => r.name));
  const recipeByName = Object.fromEntries(recipes.map((r) => [r.name, r]));
  const rowsMap = {};
  stores.forEach((s) => Object.entries(storeStock[s] || {}).forEach(([r, q]) => { if (prodNames.has(r)) (rowsMap[r] ||= {})[s] = q; }));
  Object.entries(centralStock || {}).forEach(([r, q]) => { if (prodNames.has(r)) (rowsMap[r] ||= {})[cpuName] = q; });
  let rows = Object.entries(rowsMap).map(([recipe, byLoc]) => ({ recipe, byLoc, total: cols.reduce((a, c) => a + (byLoc[c] || 0), 0) }));
  const q = query.trim().toLowerCase();
  if (q) rows = rows.filter((r) => r.recipe.toLowerCase().includes(q));
  rows.sort((a, b) => a.recipe.localeCompare(b.recipe));

  const colTotal = (c) => rows.reduce((a, r) => a + (r.byLoc[c] || 0), 0);
  const canProduce = !!onProduce;
  const gcols = `1.6fr repeat(${cols.length}, 1fr) 0.9fr${canProduce ? " 110px" : ""}`;
  const minW = 120 + cols.length * 120 + (canProduce ? 110 : 0);

  return (
    <div className="scr">
      {!embedded && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
          <button onClick={onBack} style={pillGhost}>← Back</button>
          <div style={{ flex: 1 }} />
        </div>
      )}
      <Eyebrow>{embedded ? "On the shelves" : "Live stock"}</Eyebrow>
      <h1 className="display" style={{ fontSize: embedded ? "clamp(28px,5vw,38px)" : "clamp(32px, 6vw, 44px)", fontWeight: 800, margin: "0 0 4px" }}>What we <span style={{ color: C.rust }}>have</span></h1>
      <p style={{ fontSize: 16, color: C.inkSoft, marginTop: 0 }}>Live quantities at every shop and the CPU.{canProduce ? " Tap Produce to make more." : ""} Production adds to this; sales (via Square, later) will subtract.</p>

      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a recipe…" style={{ width: "100%", maxWidth: 360, background: C.card, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 999, padding: "11px 18px", fontSize: 15, marginBottom: 16 }} />

      {rows.length === 0 ? (
        <div style={{ background: C.card, borderRadius: 14, padding: 22, color: C.inkSoft, border: `1px solid ${C.line}` }}>
          {q ? `No stock matching “${query}”.` : "No stock yet. Once a production is completed and allocated, quantities show here."}
        </div>
      ) : (
        <div style={{ background: C.card, borderRadius: 16, overflowX: "auto", WebkitOverflowScrolling: "touch", border: `1px solid ${C.line}` }}>
          <div style={{ display: "grid", gridTemplateColumns: gcols, minWidth: minW, gap: 10, padding: "14px 18px", borderBottom: `2px solid ${C.line}`, fontSize: 12, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 0.5 }}>
            <span>Recipe</span>
            {cols.map((c) => <span key={c} style={{ textAlign: "right" }}>{c}</span>)}
            <span style={{ textAlign: "right" }}>Total</span>
            {canProduce && <span />}
          </div>
          {rows.map((r, idx) => (
            <div key={r.recipe} style={{ display: "grid", gridTemplateColumns: gcols, minWidth: minW, gap: 10, padding: "11px 18px", borderTop: idx ? `1px solid ${C.line}` : "none", fontSize: 15, alignItems: "center" }}>
              <b>{r.recipe}</b>
              {cols.map((c) => {
                const v = r.byLoc[c] || 0;
                return <span key={c} className="display" style={{ textAlign: "right", fontWeight: 700, color: v > 0 ? C.ink : C.line }}>{v ? v.toFixed(1) : "—"}</span>;
              })}
              <span className="display" style={{ textAlign: "right", fontWeight: 800, color: C.rust }}>{r.total.toFixed(1)}</span>
              {canProduce && <button onClick={() => onProduce(recipeByName[r.recipe])} style={{ background: C.rust, color: "#fff", border: "none", borderRadius: 999, padding: "8px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Produce</button>}
            </div>
          ))}
          {/* totals row */}
          <div style={{ display: "grid", gridTemplateColumns: gcols, minWidth: minW, gap: 10, padding: "13px 18px", borderTop: `2px solid ${C.line}`, fontSize: 14, alignItems: "center", background: C.cardSoft }}>
            <b style={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: 12, color: C.inkSoft }}>All recipes</b>
            {cols.map((c) => <span key={c} className="display" style={{ textAlign: "right", fontWeight: 800 }}>{colTotal(c).toFixed(1)}</span>)}
            <span className="display" style={{ textAlign: "right", fontWeight: 800, color: C.rust }}>{rows.reduce((a, r) => a + r.total, 0).toFixed(1)}</span>
            {canProduce && <span />}
          </div>
        </div>
      )}

      <Leaderboard runs={runs} recipes={recipes} />
      <ProductionsLog runs={runs} />
    </div>
  );
}

function CrownIcon({ size = 18, color = C.gold }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true" style={{ flexShrink: 0 }}><path d="M2.5 7.5l4.2 3.6L12 4l5.3 7.1 4.2-3.6L20 19H4L2.5 7.5z" /></svg>);
}

/* Fair leaderboard: each run scores expectedTime / actualTime, so doing a long
   recipe at pace beats doing a short one — short recipes can't win just for being
   short. Summed over runs it rewards both speed and volume. Crown on the top. */
function Leaderboard({ runs, recipes }) {
  const expById = Object.fromEntries(recipes.map((r) => [r.id, r.expectedSec]));
  const people = {};
  runs.forEach((r) => {
    const key = r.by || "—";
    const g = (people[key] ||= { name: key, made: 0, paceSum: 0, paceN: 0, secs: 0 });
    g.made++; g.secs += r.totalSec || 0;
    const exp = expById[r.recipeId];
    if (exp > 0 && r.totalSec > 0) { g.paceSum += exp / r.totalSec; g.paceN++; }
  });
  const board = Object.values(people)
    .map((g) => ({ ...g, pace: g.paceN ? g.paceSum / g.paceN : 0, points: g.paceSum }))
    .sort((a, b) => b.points - a.points || b.made - a.made);

  if (!board.length) return null;
  const medal = ["#E8A93C", "#B9B3A6", "#C28E5A"]; // gold / silver / bronze accents

  return (
    <div style={{ marginTop: 26 }}>
      <Eyebrow>Leaderboard</Eyebrow>
      <p style={{ fontSize: 14, color: C.inkSoft, margin: "0 0 12px" }}>Ranked by pace vs each recipe's expected time and how many were made — so a longer recipe counts for more than a quick one.</p>
      <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, overflow: "hidden" }}>
        {board.map((g, i) => (
          <div key={g.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderTop: i ? `1px solid ${C.line}` : "none", background: i === 0 ? C.cardSoft : "transparent" }}>
            <span style={{ width: 26, display: "grid", placeItems: "center", fontWeight: 800, color: C.inkSoft }}>{i === 0 ? <CrownIcon size={22} color={C.gold} /> : i + 1}</span>
            <span style={{ width: 34, height: 34, borderRadius: 999, background: medal[i] || C.line, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{(g.name || "?")[0]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{g.name}</div>
              <div style={{ fontSize: 13, color: C.inkSoft }}>{g.made} recipe{g.made === 1 ? "" : "s"} made</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="display" style={{ fontWeight: 800, fontSize: 18, color: g.pace >= 1 ? C.go : C.rust }}>{g.pace ? g.pace.toFixed(2) + "×" : "—"}</div>
              <div style={{ fontSize: 11, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 0.5 }}>pace vs expected</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Recent productions: date made, who made it, how long it took. Newest first,
   with a date-range filter. */
function ProductionsLog({ runs }) {
  const [range, setRange] = useState("all"); // all | today | 7 | 30
  const now = Date.now();
  const cutoff = range === "today" ? new Date().setHours(0, 0, 0, 0)
    : range === "7" ? now - 7 * 864e5
    : range === "30" ? now - 30 * 864e5
    : 0;
  const list = runs
    .filter((r) => { const t = r.at ? Date.parse(r.at) : 0; return cutoff ? t >= cutoff : true; })
    .slice()
    .sort((a, b) => (Date.parse(b.at || 0) || 0) - (Date.parse(a.at || 0) || 0)); // newest first

  const sel = { background: C.card, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 999, padding: "8px 14px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
  return (
    <div style={{ marginTop: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <Eyebrow>Recent productions</Eyebrow>
        <div style={{ flex: 1 }} />
        <select value={range} onChange={(e) => setRange(e.target.value)} style={sel}>
          <option value="all">All time</option>
          <option value="today">Today</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </div>
      {list.length === 0 ? (
        <div style={{ background: C.card, borderRadius: 14, padding: 20, color: C.inkSoft, border: `1px solid ${C.line}` }}>No productions in this period yet.</div>
      ) : (
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr 0.8fr", minWidth: 560, gap: 10, padding: "13px 18px", borderBottom: `2px solid ${C.line}`, fontSize: 12, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 0.5 }}>
            <span>Recipe</span><span>Made by</span><span>Date made</span><span style={{ textAlign: "right" }}>Qty</span><span style={{ textAlign: "right" }}>Time taken</span>
          </div>
          {list.map((r, i) => (
            <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr 0.8fr", minWidth: 560, gap: 10, padding: "12px 18px", borderTop: i ? `1px solid ${C.line}` : "none", fontSize: 14, alignItems: "center" }}>
              <b>{r.recipe}</b>
              <span>{r.by || "—"}</span>
              <span style={{ color: C.inkSoft }}>{r.when || (r.at ? new Date(r.at).toLocaleString("en-GB") : "—")}</span>
              <span className="display" style={{ textAlign: "right", fontWeight: 700 }}>{r.qty}{r.unit ? " " + r.unit : ""}</span>
              <span className="display" style={{ textAlign: "right", fontWeight: 700, color: C.rust }}>{fmtDur(r.totalSec)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===================== ADMIN ===================== */
function Admin({ ingredients, setIngredients, recipes, setRecipes, staff, setStaff, cpu, setCpu, locations, setLocations, delivery, setDelivery, storeStock, centralStock, deliveryQueue, runs, cancellations, alerts, setAlerts, stores, onResetStock, onClose }) {
  const [tab, setTab] = useState("recipes");
  const tabs = [["recipes", "Recipes"], ["ingredients", "Ingredient costs"], ["staff", "Staff & wages"], ["locations", "Locations & delivery"], ["reports", "Reports"]];
  return (
    <div className="scr">
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
        <h1 className="display admin-title" style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>Admin</h1><div style={{ flex: 1 }} />
        <button onClick={onClose} style={pillGhost}>← Back to floor</button>
      </div>
      <div className="admin-tabs" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(([id, l]) => <button key={id} onClick={() => setTab(id)} style={{ background: tab === id ? C.rust : C.card, color: tab === id ? "#fff" : C.ink, border: `1px solid ${tab === id ? C.rust : C.line}`, borderRadius: 999, padding: "11px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>{l}</button>)}
      </div>
      {alerts && alerts.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          {alerts.map((a) => a.kind === "yield" ? (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#F6E0D6", border: `1px solid ${C.rust}`, borderRadius: 14, padding: "12px 16px", marginBottom: 8 }}>
              <span style={{ fontWeight: 800, color: C.rust }}>⚠</span>
              <span style={{ flex: 1, fontSize: 14 }}><b>{a.recipe}</b> — {a.message}</span>
              <button onClick={() => setAlerts((al) => al.filter((x) => x.id !== a.id))} style={{ background: "none", border: "none", color: C.inkSoft, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
          ) : (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, background: a.dir === "up" ? "#F6E0D6" : "#E2EFE0", border: `1px solid ${a.dir === "up" ? C.rust : C.go}`, borderRadius: 14, padding: "12px 16px", marginBottom: 8 }}>
              <span style={{ fontWeight: 800, color: a.dir === "up" ? C.rust : C.go }}>{a.dir === "up" ? "▲" : "▼"}</span>
              <span style={{ flex: 1, fontSize: 14 }}>Production time for <b>{a.recipe}</b> went <b>{a.dir}</b> by <b>{fmtClock(a.diff)}</b> over {a.runs} runs. Expected time updated {fmtClock(a.from)} → <b>{fmtClock(a.to)}</b>.</span>
              <button onClick={() => setAlerts((al) => al.filter((x) => x.id !== a.id))} style={{ background: "none", border: "none", color: C.inkSoft, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
          ))}
        </div>
      )}
      {tab === "recipes" && <AdminRecipes recipes={recipes} ingredients={ingredients} setRecipes={setRecipes} setIngredients={setIngredients} />}
      {tab === "ingredients" && <AdminIngredients ingredients={ingredients} setIngredients={setIngredients} />}
      {tab === "staff" && <AdminStaff staff={staff} setStaff={setStaff} />}
      {tab === "locations" && <AdminLocations cpu={cpu} setCpu={setCpu} locations={locations} setLocations={setLocations} delivery={delivery} setDelivery={setDelivery} />}
      {tab === "reports" && <AdminReports runs={runs} recipes={recipes} cancellations={cancellations} storeStock={storeStock} centralStock={centralStock} deliveryQueue={deliveryQueue} stores={stores} onResetStock={onResetStock} />}
    </div>
  );
}

function AdminIngredients({ ingredients, setIngredients }) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [paste, setPaste] = useState("White bread flour, 0.95\nFresh yeast, 4.20\nButter, 7.50");
  const [query, setQuery] = useState("");
  const upd = (idx, patch) => setIngredients((p) => p.map((x, i) => i === idx ? { ...x, ...patch } : x));
  // keep each ingredient's original index so edits/deletes stay correct when filtered
  const q = query.trim().toLowerCase();
  const shown = ingredients.map((ing, idx) => ({ ing, idx })).filter(({ ing }) => !q || ing.name.toLowerCase().includes(q));
  const applyPaste = () => {
    paste.split("\n").map((l) => l.trim()).filter(Boolean).forEach((line) => {
      const [name, costStr] = line.split(/[,\t]/).map((x) => x.trim()); const cost = parseFloat(costStr);
      if (!name || isNaN(cost)) return;
      setIngredients((prev) => { const next = [...prev]; const idx = next.findIndex((i) => i.name.toLowerCase() === name.toLowerCase()); if (idx >= 0) next[idx] = { ...next[idx], cost }; else next.push({ id: uid("ing"), name, unit: "kg", cost }); return next; });
    });
    setPasteOpen(false);
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={() => setPasteOpen((o) => !o)} style={{ ...adminBtn, background: C.go, color: "#fff", border: "none" }}>Upload cost list (paste Excel)</button>
        <button onClick={() => setIngredients((p) => [...p, { id: uid("ing"), name: "New ingredient", unit: "kg", cost: 0 }])} style={adminBtn}>+ Add ingredient</button>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ingredients…" style={{ flex: 1, minWidth: 200, background: C.card, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 999, padding: "11px 18px", fontSize: 15 }} />
      </div>
      {pasteOpen && (
        <div style={{ background: C.card, borderRadius: 16, padding: 18, marginBottom: 16, border: `1px solid ${C.line}` }}>
          <p style={{ marginTop: 0, color: C.inkSoft }}>Paste rows from Excel — <b>name, cost</b> per line. Matching names update; new names are added.</p>
          <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={5} style={{ width: "100%", background: C.cream, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: "monospace" }} />
          <button onClick={applyPaste} style={{ ...adminBtn, background: C.go, color: "#fff", border: "none", marginTop: 10 }}>Apply costs</button>
        </div>
      )}
      <div style={{ background: C.card, borderRadius: 16, overflowX: "auto", border: `1px solid ${C.line}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 130px 40px", minWidth: 520, gap: 12, padding: "12px 18px", borderBottom: `2px solid ${C.line}`, fontSize: 12, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 1 }}>
          <span>Ingredient</span><span>Unit</span><span>Cost</span><span />
        </div>
        {shown.length === 0 && <div style={{ padding: 18, color: C.inkSoft }}>No ingredients match “{query}”.</div>}
        {shown.map(({ ing, idx }, row) => (
          <div key={ing.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 130px 40px", minWidth: 520, gap: 12, alignItems: "center", padding: "10px 18px", borderTop: row ? `1px solid ${C.line}` : "none" }}>
            <input value={ing.name} onChange={(e) => upd(idx, { name: e.target.value })} style={cellInput} />
            <select value={ing.unit} onChange={(e) => upd(idx, { unit: e.target.value })} style={cellInput}>{ING_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ color: C.inkSoft }}>£</span><input type="number" step="0.01" value={ing.cost} onChange={(e) => upd(idx, { cost: parseFloat(e.target.value) || 0 })} style={cellInput} /><span style={{ color: C.inkSoft, fontSize: 12 }}>/{ing.unit}</span></div>
            <button onClick={() => setIngredients((p) => p.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: C.rust, cursor: "pointer", fontSize: 18 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminRecipes({ recipes, ingredients, setRecipes, setIngredients }) {
  const [editing, setEditing] = useState(null); // recipe object or "new"
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState(null);
  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All"); // All | Production | Service
  const [optMsg, setOptMsg] = useState(null);
  const fileRef = useRef();

  // shrink oversized uploaded images already stored in recipes (keeps the DB small & fast)
  const optimiseImages = async () => {
    setOptMsg("Optimising… this can take a moment.");
    const compress = (src) => new Promise((res) => compressDataUrl(src, res));
    const big = (s) => s && typeof s === "string" && s.startsWith("data:") && s.length > 60000;
    let changed = 0; const updates = [];
    for (const r of recipes) {
      let dirty = false; let hero = r.hero;
      if (big(hero)) { hero = await compress(hero); dirty = true; }
      const steps = [];
      for (const s of (r.steps || [])) {
        if (big(s.image)) { steps.push({ ...s, image: await compress(s.image) }); dirty = true; }
        else steps.push(s);
      }
      if (dirty) { changed++; updates.push({ ...r, hero, steps }); }
    }
    if (changed) { setRecipes((rs) => rs.map((x) => updates.find((y) => y.id === x.id) || x)); setOptMsg(`Optimised ${changed} recipe${changed > 1 ? "s" : ""} ✓ — loads will be faster now.`); }
    else setOptMsg("Nothing to optimise — images are already small ✓");
  };

  const doImport = (text) => {
    try {
      const { recipes: imported, ingredients: newIngs } = importBase44Json(text, ingredients);
      if (!imported.length) { setImportMsg({ ok: false, text: "No recipes found in that JSON. Expected a recipe object or an array of them." }); return; }
      setIngredients(newIngs);
      setRecipes((rs) => {
        // replace by name if it already exists, else add
        const byName = Object.fromEntries(rs.map((r) => [r.name.toLowerCase(), r]));
        imported.forEach((r) => { byName[r.name.toLowerCase()] = r; });
        return Object.values(byName);
      });
      setImportMsg({ ok: true, text: `Imported ${imported.length} recipe${imported.length > 1 ? "s" : ""}. New ingredients were added with £0 cost — set their prices in Ingredient costs.` });
      setImportText("");
    } catch (e) {
      setImportMsg({ ok: false, text: "Couldn't parse JSON: " + e.message });
    }
  };

  const upsertRecipe = (r) => setRecipes((rs) => rs.some((x) => x.id === r.id) ? rs.map((x) => x.id === r.id ? r : x) : [...rs, r]);
  if (editing) return <RecipeBuilder ingredients={ingredients} recipes={recipes} initial={editing === "new" ? null : editing}
    onAutoSave={upsertRecipe}
    onCancel={() => setEditing(null)} onSave={(r) => { upsertRecipe(r); setEditing(null); }} />;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {optMsg && <span style={{ fontSize: 13, color: C.go, fontWeight: 600, marginRight: "auto" }}>{optMsg}</span>}
        <button onClick={optimiseImages} style={{ ...adminBtn }} title="Shrink large uploaded images so the app loads fast">Optimise images</button>
        <button onClick={() => { setImportOpen((o) => !o); setImportMsg(null); }} style={{ ...adminBtn, background: C.ink, color: "#fff", border: "none", fontSize: 15, padding: "12px 20px" }}>⤓ Import from Base44 JSON</button>
        <button onClick={() => setEditing("new")} style={{ ...adminBtn, background: C.rust, color: "#fff", border: "none", fontSize: 16, padding: "12px 22px" }}>+ Add new recipe</button>
      </div>

      {importOpen && (
        <div style={{ background: C.card, borderRadius: 16, padding: 18, marginBottom: 16, border: `1px solid ${C.line}` }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Import your recipes</div>
          <p style={{ marginTop: 0, color: C.inkSoft, fontSize: 14 }}>Upload or paste the recipe JSON exported from Base44 — a single recipe object, an array, or <code>{`{ "recipes": [...] }`}</code>. Ingredients are auto-matched to the method steps that mention them. New ingredients are created at £0 — set their costs afterwards.</p>
          <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <button onClick={() => fileRef.current?.click()} style={{ ...adminBtn, background: C.go, color: "#fff", border: "none" }}>Choose JSON file</button>
            <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => doImport(String(r.result)); r.readAsText(f); } }} />
          </div>
          <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={6} placeholder='Paste JSON here…' style={{ width: "100%", background: C.cream, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14, fontSize: 13, fontFamily: "monospace" }} />
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
            <button onClick={() => doImport(importText)} disabled={!importText.trim()} style={{ ...adminBtn, background: importText.trim() ? C.rust : C.line, color: "#fff", border: "none", opacity: importText.trim() ? 1 : .6 }}>Import pasted JSON</button>
            {importMsg && <span style={{ fontSize: 14, color: importMsg.ok ? C.go : C.rust, fontWeight: 600 }}>{importMsg.text}</span>}
          </div>
        </div>
      )}

      {/* search + department filter */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search recipes, ingredients, category…" style={{ flex: 1, minWidth: 220, background: C.card, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 999, padding: "11px 18px", fontSize: 15 }} />
        <div style={{ display: "flex", gap: 6, background: C.card, border: `1px solid ${C.line}`, borderRadius: 999, padding: 4 }}>
          {["All", "Production", "Service"].map((d) => (
            <button key={d} onClick={() => setDeptFilter(d)} style={{ background: deptFilter === d ? C.rust : "transparent", color: deptFilter === d ? "#fff" : C.ink, border: "none", borderRadius: 999, padding: "8px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>{d}</button>
          ))}
        </div>
      </div>

      {(() => {
        const q = query.trim().toLowerCase();
        const m = ingMap(ingredients);
        const filtered = recipes.filter((r) => {
          if (deptFilter !== "All" && (r.dept2 || "Production") !== deptFilter) return false;
          if (!q) return true;
          if (r.name.toLowerCase().includes(q)) return true;
          if ((r.category || "").toLowerCase().includes(q)) return true;
          if ((r.allergens || []).some((a) => a.toLowerCase().includes(q))) return true;
          if ((r.dietary || []).some((a) => a.toLowerCase().includes(q))) return true;
          // search ingredient names
          return recipeItems(r).some((it) => (m[it.ingId]?.name || "").toLowerCase().includes(q));
        });
        if (!filtered.length) return <div style={{ background: C.card, borderRadius: 12, padding: 20, color: C.inkSoft, border: `1px solid ${C.line}` }}>No recipes match “{query}”{deptFilter !== "All" ? ` in ${deptFilter}` : ""}.</div>;
        return (
          <>
            <div style={{ color: C.inkSoft, fontSize: 13, marginBottom: 10 }}>{filtered.length} recipe{filtered.length > 1 ? "s" : ""}</div>
            {filtered.map((r) => <RecipeCard key={r.id} recipe={r} ingredients={ingredients} recipes={recipes} onEdit={() => setEditing(r)} onDelete={() => setRecipes((rs) => rs.filter((x) => x.id !== r.id))} />)}
          </>
        );
      })()}
    </div>
  );
}

function RecipeCard({ recipe, ingredients, recipes = [], onEdit, onDelete }) {
  const m = ingMap(ingredients);
  const recById = Object.fromEntries(recipes.map((r) => [r.id, r]));
  const cName = (u) => u.recipeId ? (recById[u.recipeId]?.name || "Recipe") : (m[u.ingId]?.name || "");
  const cUnit = (u) => u.recipeId ? (u.unit || "units") : (m[u.ingId]?.unit || "");
  // component-aware totals (ingredients + recipe components)
  const agg = {};
  (recipe.steps || []).forEach((s) => (s.use || []).forEach((u) => {
    const key = u.recipeId ? "r:" + u.recipeId : "i:" + u.ingId;
    if (!agg[key]) agg[key] = { key, qty: 0, name: cName(u), unit: cUnit(u), isRecipe: !!u.recipeId };
    agg[key].qty += Number(u.qty) || 0;
  }));
  const items = Object.values(agg);
  return (
    <div style={{ background: C.card, borderRadius: 20, marginBottom: 18, border: `1px solid ${C.line}`, overflow: "hidden" }}>
      <div style={{ display: "flex" }}>
        {recipe.hero && <div className="recipe-hero-side" style={{ width: 160, background: `url(${recipe.hero}) center/cover`, flexShrink: 0 }} />}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "18px 24px", background: C.cardSoft, borderBottom: `1px solid ${C.line}`, flexWrap: "wrap" }}>
          <div>
            <div className="display" style={{ fontSize: 26, fontWeight: 800 }}>{recipe.name}</div>
            <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 2 }}>Yields {recipe.yieldKg} {recipe.yieldUnit} · {recipe.steps.length} steps{recipe.expectedSec ? ` · expected ${fmtClock(recipe.expectedSec)}` : ""}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              <span style={{ background: (recipe.dept2 || "Production") === "Service" ? "#E2EFE0" : C.ink, color: (recipe.dept2 || "Production") === "Service" ? C.go : "#fff", borderRadius: 999, padding: "3px 11px", fontSize: 12, fontWeight: 700 }}>{recipe.dept2 || "Production"}</span>
              {recipe.category && <span style={{ background: C.cream, border: `1px solid ${C.line}`, borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{recipe.category}</span>}
              {(recipe.dietary || []).map((d) => <span key={d} style={{ background: "#E2EFE0", color: C.go, borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>{d}</span>)}
              {(recipe.allergens || []).map((a) => <span key={a} style={{ background: "#F6E0D6", color: C.rustDeep, borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>{a}</span>)}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: C.gold, color: C.ink, borderRadius: 999, padding: "8px 16px", fontWeight: 700, fontSize: 14 }}>ingredients {fmtMoney(recipeCost(recipe, ingredients))}</span>
            <button onClick={onEdit} style={{ background: C.ink, border: "none", color: "#fff", cursor: "pointer", fontSize: 14, borderRadius: 999, padding: "7px 16px", fontWeight: 600 }}>Edit</button>
            <button onClick={onDelete} style={{ background: "none", border: `1px solid ${C.line}`, color: C.rust, cursor: "pointer", fontSize: 14, borderRadius: 999, padding: "6px 12px", fontWeight: 600 }}>Delete</button>
          </div>
        </div>
      </div>

      <div className="card-cols" style={{ display: "grid", gridTemplateColumns: "minmax(220px,0.8fr) 1.2fr" }}>
        <div style={{ padding: "20px 24px", borderRight: `1px solid ${C.line}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.rust, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Total ingredients</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {items.map((it) => (
                <tr key={it.key} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "9px 0", fontWeight: it.isRecipe ? 700 : 400, color: it.isRecipe ? C.rust : C.ink }}>{it.isRecipe ? "▸ " : ""}{it.name}</td>
                  <td className="display" style={{ padding: "9px 0", textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{it.qty} {it.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.rust, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Method</div>
          <div style={{ display: "grid", gap: 14 }}>
            {recipe.steps.map((s, k) => (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "34px 1fr auto", gap: 12, alignItems: "start" }}>
                <span className="display" style={{ fontSize: 18, fontWeight: 800, color: C.gold }}>{String(k + 1).padStart(2, "0")}</span>
                <div>
                  {s.image && <div style={{ height: 90, width: 140, borderRadius: 10, background: `url(${s.image}) center/cover`, marginBottom: 8 }} />}
                  <div style={{ fontWeight: 400, lineHeight: 1.45 }}>{s.text}</div>
                  {s.use && s.use.length > 0 && <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>{s.use.map((u) => `${u.qty}${cUnit(u)} ${cName(u)}`).join(" · ")}</div>}
                </div>
                {s.isTimed && s.timerSec ? <span style={{ background: C.cream, border: `1px solid ${C.line}`, borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: C.gold, whiteSpace: "nowrap" }}>⏲ {fmtClock(s.timerSec)}</span> : <span />}
              </div>
            ))}
          </div>
          {recipe.notes && <div style={{ marginTop: 14, padding: "12px 14px", background: C.cardSoft, border: `1px solid ${C.line}`, borderRadius: 12, fontSize: 13, color: C.inkSoft }}><b style={{ color: C.ink }}>Notes:</b> {recipe.notes}</div>}
        </div>
      </div>
    </div>
  );
}

function RecipeBuilder({ ingredients, recipes = [], initial, onCancel, onSave, onAutoSave }) {
  const idRef = useRef(initial?.id || uid("r")); // stable id for the whole edit session (so autosave updates, not duplicates)
  const recById = Object.fromEntries(recipes.map((r) => [r.id, r]));
  // A step item can be a raw ingredient OR a produced recipe used as a component.
  const compName = (u, mm) => u.recipeId ? (recById[u.recipeId]?.name || "Recipe") : (mm[u.ingId]?.name || "Choose…");
  const compUnit = (u, mm) => u.recipeId ? (u.unit || recById[u.recipeId]?.yieldUnit || "units") : (mm[u.ingId]?.unit || "");
  const [picker, setPicker] = useState(null); // { step, use } when choosing an ingredient/component
  const [savedTick, setSavedTick] = useState(0);
  const [name, setName] = useState(initial?.name || "");
  const [yieldKg, setYieldKg] = useState(initial?.yieldKg ?? 10);
  const [yieldUnit, setYieldUnit] = useState(initial?.yieldUnit || "kg");
  const [expectedMin, setExpectedMin] = useState(initial?.expectedSec ? Math.round(initial.expectedSec / 60) : 0);
  const [hero, setHero] = useState(initial?.hero || null);
  const [dept2, setDept2] = useState(initial?.dept2 || "Production");
  const [asComponent, setAsComponent] = useState(initial?.asComponent || false);
  const [category, setCategory] = useState(initial?.category || "");
  const [allergens, setAllergens] = useState(initial?.allergens || []);
  const [dietary, setDietary] = useState(initial?.dietary || []);
  const [steps, setSteps] = useState(initial?.steps?.map((s) => ({ text: s.text, image: s.image || null, use: s.use || [], isTimed: s.isTimed ?? !!s.timerSec, timerMin: s.timerSec ? s.timerSec / 60 : 0 })) || [{ text: "", image: null, use: [], isTimed: false, timerMin: 0 }]);
  const m = ingMap(ingredients);
  const toggle = (arr, setArr, val) => setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  const autoDetect = () => {
    const ri = []; const seen = {};
    steps.forEach((s) => (s.use || []).forEach((u) => { if (!seen[u.ingId]) { seen[u.ingId] = 1; ri.push({ ingId: u.ingId, qty: u.qty }); } }));
    const d = detectTags(ri, ingredients);
    setAllergens(Array.from(new Set([...allergens, ...d.allergens])));
    setDietary(d.dietary);
  };

  const setStep = (i, patch) => setSteps((a) => a.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const addUse = (i, pick) => setStep(i, { use: [...steps[i].use, pick.recipeId ? { recipeId: pick.recipeId, qty: 1, unit: pick.unit || "units" } : { ingId: pick.ingId, qty: 1 }] });
  const setUse = (i, j, patch) => setStep(i, { use: steps[i].use.map((u, idx) => idx === j ? { ...u, ...patch } : u) });
  const delUse = (i, j) => setStep(i, { use: steps[i].use.filter((_, idx) => idx !== j) });

  const buildClean = () => {
    const clean = {
      id: idRef.current,
      name: name.trim() || "Untitled recipe",
      yieldKg: parseFloat(yieldKg) || 1, yieldUnit, hero, dept2, category, allergens, dietary, asComponent,
      expectedSec: expectedMin > 0 ? Math.round(expectedMin * 60) : (initial?.expectedSec || 0),
      steps: steps.filter((s) => s.text.trim()).map((s) => {
        const est = estimateStepSec({ text: s.text, use: s.use }, ingredients);
        const timed = !!s.isTimed;
        return {
          text: s.text.trim(), image: s.image || null,
          use: s.use.filter((u) => (u.ingId || u.recipeId) && u.qty > 0).map((u) => u.recipeId ? { recipeId: u.recipeId, qty: parseFloat(u.qty) || 0, unit: u.unit || "units" } : { ingId: u.ingId, qty: parseFloat(u.qty) || 0 }),
          isTimed: timed,
          timerSec: timed ? (s.timerMin > 0 ? Math.round(s.timerMin * 60) : waitStepSec(s.text)) : 0,
          estSec: est,
        };
      }),
    };
    if (!clean.steps.length) clean.steps = [{ text: "Step 1", image: null, use: [], isTimed: false, timerSec: 0, estSec: 60 }];
    if (!clean.expectedSec) clean.expectedSec = clean.steps.reduce((a, s) => a + (s.isTimed ? s.timerSec : (s.estSec || 0)), 0);
    return clean;
  };
  const save = () => onSave(buildClean());

  // Autosave: persist changes in the background (debounced) so edits aren't lost.
  // Skips the initial render, and won't create a blank brand-new recipe.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (!onAutoSave) return;
    const hasContent = name.trim() || steps.some((s) => s.text.trim());
    if (!initial && !hasContent) return;
    const t = setTimeout(() => { onAutoSave(buildClean()); setSavedTick((n) => n + 1); }, 900);
    return () => clearTimeout(t);
  }, [name, yieldKg, yieldUnit, expectedMin, hero, dept2, category, allergens, dietary, steps]);

  return (
    <div className="scr">
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <h2 className="display" style={{ fontSize: 30, fontWeight: 800, margin: 0 }}>{initial ? "Edit recipe" : "New recipe"}</h2><div style={{ flex: 1 }} />
        {onAutoSave && savedTick > 0 && <span style={{ fontSize: 13, color: C.go, fontWeight: 700 }}>✓ Saved</span>}
        <button onClick={onCancel} style={pillGhost}>{onAutoSave ? "Done" : "Cancel"}</button>
        <button onClick={save} style={{ ...adminBtn, background: C.go, color: "#fff", border: "none", fontSize: 15, padding: "11px 20px" }}>Save recipe</button>
      </div>

      {/* Production vs Service — prominent, editable any time */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 1 }}>This recipe is for</span>
        <div style={{ display: "inline-flex", background: C.card, border: `1px solid ${C.line}`, borderRadius: 999, padding: 4 }}>
          {["Production", "Service"].map((d) => (
            <button key={d} onClick={() => setDept2(d)} style={{ background: dept2 === d ? C.rust : "transparent", color: dept2 === d ? "#fff" : C.ink, border: "none", borderRadius: 999, padding: "9px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{d}</button>
          ))}
        </div>
        <span style={{ fontSize: 13, color: C.inkSoft }}>{dept2 === "Service" ? "Shown in the S.Book (reference only)." : "Made on the bake floor; appears in production & stock."}</span>
      </div>

      {/* usable as a component in other recipes (e.g. Bagel inside a sandwich) */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <button onClick={() => setAsComponent((v) => !v)} style={{ background: asComponent ? C.go : "transparent", color: asComponent ? "#fff" : C.inkSoft, border: `1.5px solid ${asComponent ? C.go : C.line}`, borderRadius: 999, padding: "8px 16px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{asComponent ? "✓ Usable as an ingredient" : "Use as an ingredient?"}</button>
        <span style={{ fontSize: 13, color: C.inkSoft }}>Turn on for items used inside other recipes (e.g. Bagel, Egg Mayo). They appear in the ingredient picker.</span>
      </div>

      {/* hero + name + yield */}
      <div className="builder-head" style={{ marginBottom: 18 }}>
        <ImageDrop label="Hero image" image={hero} onImage={setHero} height={150} />
        <div style={{ display: "grid", gap: 14 }}>
          <Field label="Recipe name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sesame Bagels" style={bigInput} /></Field>
          <div className="row3">
            <Field label="Category">
              <input list="cat-suggestions" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Sandwich, Cake…" style={bigInput} />
              <datalist id="cat-suggestions">{ALL_CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Yield unit">
              <select value={yieldUnit} onChange={(e) => setYieldUnit(e.target.value)} style={bigInput}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
            </Field>
            <Field label="Base yield"><input type="number" value={yieldKg} onChange={(e) => setYieldKg(e.target.value)} style={bigInput} /></Field>
          </div>
          <Field label="Expected time (min)"><input type="number" min="0" value={expectedMin} onChange={(e) => setExpectedMin(parseFloat(e.target.value) || 0)} style={bigInput} /></Field>
        </div>
      </div>

      {/* allergens + dietary */}
      <div style={{ background: C.card, borderRadius: 18, padding: 18, border: `1px solid ${C.line}`, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.rust, textTransform: "uppercase", letterSpacing: 1.5 }}>Allergens & dietary</div>
          <button onClick={autoDetect} style={{ ...adminBtn, fontSize: 13, padding: "7px 14px", background: C.cardSoft }}>✦ Auto-detect from ingredients</button>
          <span style={{ fontSize: 12, color: C.inkSoft }}>Suggestion only — review before relying on it.</span>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Dietary</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {DIETARY.map((d) => { const on = dietary.includes(d); return <button key={d} onClick={() => toggle(dietary, setDietary, d)} style={{ background: on ? C.go : "transparent", color: on ? "#fff" : C.ink, border: `1.5px solid ${on ? C.go : C.line}`, borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{d}</button>; })}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Allergens</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ALLERGENS.map((a) => { const on = allergens.includes(a); return <button key={a} onClick={() => toggle(allergens, setAllergens, a)} style={{ background: on ? C.rust : "transparent", color: on ? "#fff" : C.ink, border: `1.5px solid ${on ? C.rust : C.line}`, borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{a}</button>; })}
        </div>
      </div>

      {/* method steps, each with own ingredients + image */}
      <div style={{ fontSize: 12, fontWeight: 700, color: C.rust, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Method steps</div>
      {steps.map((s, i) => (
        <div key={i} style={{ background: C.card, borderRadius: 18, padding: 18, marginBottom: 14, border: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <span className="display" style={{ fontSize: 20, fontWeight: 800, color: C.gold }}>{String(i + 1).padStart(2, "0")}</span>
            <input value={s.text} onChange={(e) => setStep(i, { text: e.target.value })} placeholder="What to do at this step…" style={{ ...cellInput, flex: 1, fontSize: 16, minWidth: 160 }} />
            <button onClick={() => setStep(i, { isTimed: !s.isTimed, timerMin: !s.isTimed && !s.timerMin ? +(waitStepSec(s.text) / 60).toFixed(1) : s.timerMin })}
              style={{ background: s.isTimed ? C.gold : "transparent", color: s.isTimed ? C.ink : C.inkSoft, border: `1.5px solid ${s.isTimed ? C.gold : C.line}`, borderRadius: 999, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
              {s.isTimed ? "⏲ Timed wait" : "+ Make timed"}
            </button>
            {s.isTimed && (
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.inkSoft, whiteSpace: "nowrap" }}>
                minutes
                <input type="number" min="0" step="0.5" value={s.timerMin} onChange={(e) => setStep(i, { timerMin: parseFloat(e.target.value) || 0 })} style={{ ...cellInput, width: 70 }} />
              </label>
            )}
            <button onClick={() => setSteps((a) => a.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: C.rust, cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
          <div className="step-cols" style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 16, alignItems: "start" }}>
            <ImageDrop label="Step image" image={s.image} onImage={(img) => setStep(i, { image: img })} height={100} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Ingredients for this step</div>
              {s.use.map((u, j) => (
                <div key={j} style={{ display: "grid", gridTemplateColumns: "1fr 70px 50px 28px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <button onClick={() => setPicker({ step: i, use: j })} style={{ ...cellInput, textAlign: "left", cursor: "pointer", background: u.recipeId ? "#F2E7CF" : C.cream, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.recipeId ? "▸ " : ""}{compName(u, m)}</button>
                  <input type="number" step="0.01" value={u.qty} onChange={(e) => setUse(i, j, { qty: e.target.value })} style={cellInput} />
                  {u.recipeId
                    ? <select value={u.unit || "units"} onChange={(e) => setUse(i, j, { unit: e.target.value })} style={{ ...cellInput, padding: "8px 4px", fontSize: 12 }}>{ING_UNITS.map((un) => <option key={un} value={un}>{un}</option>)}</select>
                    : <span style={{ fontSize: 13, color: C.inkSoft, fontWeight: 600 }}>{compUnit(u, m)}</span>}
                  <button onClick={() => delUse(i, j)} style={{ background: "none", border: "none", color: C.rust, cursor: "pointer", fontSize: 15 }}>✕</button>
                </div>
              ))}
              <button onClick={() => setPicker({ step: i, use: null })} style={{ ...adminBtn, fontSize: 13, padding: "7px 12px" }}>+ Add ingredient / recipe</button>
            </div>
          </div>
        </div>
      ))}
      <button onClick={() => setSteps((a) => [...a, { text: "", image: null, use: [], timerMin: 0 }])} style={{ ...adminBtn, fontSize: 14 }}>+ Add step</button>

      {picker && (
        <IngredientPicker ingredients={ingredients} recipes={recipes} onClose={() => setPicker(null)}
          onPick={(pick) => { if (picker.use == null) addUse(picker.step, pick); else setUse(picker.step, picker.use, pick.recipeId ? { ingId: undefined, recipeId: pick.recipeId, unit: pick.unit || "units" } : { ingId: pick.ingId, recipeId: undefined }); setPicker(null); }} />
      )}
    </div>
  );
}

/* Searchable picker — choose a raw ingredient OR a produced recipe to use as a
   component (e.g. Egg Mayo inside a sandwich). */
function IngredientPicker({ ingredients, recipes = [], onPick, onClose }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const ingList = ingredients.filter((i) => !q || i.name.toLowerCase().includes(q)).slice().sort((a, b) => a.name.localeCompare(b.name));
  const recList = recipes.filter((r) => r.asComponent).filter((r) => !q || r.name.toLowerCase().includes(q)).slice().sort((a, b) => a.name.localeCompare(b.name));
  const rowBtn = (extra) => ({ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "13px 16px", fontSize: 16, color: C.ink, cursor: "pointer", ...extra });
  const hdr = { padding: "8px 16px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: C.inkSoft, background: C.cardSoft };
  return (
    <Modal onClose={onClose}>
      <div style={{ width: "100%" }}>
        <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 10 }}>Add ingredient or recipe</div>
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…"
          style={{ width: "100%", background: C.cream, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 16px", fontSize: 16, marginBottom: 12 }} />
        <div style={{ maxHeight: "52vh", overflowY: "auto", border: `1px solid ${C.line}`, borderRadius: 12 }}>
          {recList.length > 0 && <div style={hdr}>Production recipes (use as a component)</div>}
          {recList.map((r) => (
            <button key={r.id} onClick={() => onPick({ recipeId: r.id, unit: "units" })} style={rowBtn({ borderTop: `1px solid ${C.line}` })}>
              <span>▸ {r.name}</span><span style={{ fontSize: 13, color: C.rust, fontWeight: 700 }}>recipe</span>
            </button>
          ))}
          {ingList.length > 0 && <div style={hdr}>Ingredients</div>}
          {ingList.map((ing) => (
            <button key={ing.id} onClick={() => onPick({ ingId: ing.id })} style={rowBtn({ borderTop: `1px solid ${C.line}` })}>
              <span>{ing.name}</span><span style={{ fontSize: 13, color: C.inkSoft }}>{ing.unit}{ing.cost > 0 ? ` · ${fmtMoney(ing.cost)}` : ""}</span>
            </button>
          ))}
          {ingList.length === 0 && recList.length === 0 && <div style={{ padding: 16, color: C.inkSoft }}>Nothing matches “{query}”.</div>}
        </div>
      </div>
    </Modal>
  );
}

function ImageDrop({ label, image, onImage, height = 120 }) {
  const ref = useRef();
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div onClick={() => ref.current?.click()} style={{ height, borderRadius: 12, border: `1.5px dashed ${C.line}`, background: image ? `url(${image}) center/cover` : C.cream, cursor: "pointer", display: "grid", placeItems: "center", color: C.inkSoft, fontSize: 13, overflow: "hidden" }}>
        {!image && "Tap to upload"}
      </div>
      {image && <button onClick={() => onImage(null)} style={{ background: "none", border: "none", color: C.rust, cursor: "pointer", fontSize: 12, marginTop: 4 }}>remove</button>}
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) readImageCompressed(f, onImage); }} />
    </div>
  );
}
function Field({ label, children }) { return <label style={{ display: "block" }}><div style={{ fontSize: 12, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</div>{children}</label>; }

function AdminStaff({ staff, setStaff }) {
  const upd = (idx, patch) => setStaff((p) => p.map((x, i) => i === idx ? { ...x, ...patch } : x));
  const togglePerm = (idx, perm) => setStaff((p) => p.map((x, i) => {
    if (i !== idx) return x;
    const cur = x.perms || (x.role === "driver" ? [] : ["production"]);
    return { ...x, perms: cur.includes(perm) ? cur.filter((q) => q !== perm) : [...cur, perm] };
  }));
  const PermChip = ({ on, onClick, children }) => (
    <button onClick={onClick} style={{ background: on ? C.go : "transparent", color: on ? "#fff" : C.inkSoft, border: `1.5px solid ${on ? C.go : C.line}`, borderRadius: 999, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{on ? "✓ " : ""}{children}</button>
  );
  return (
    <div>
      <div style={{ background: C.card, borderRadius: 16, overflowX: "auto", border: `1px solid ${C.line}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 90px 130px 180px 40px", minWidth: 760, gap: 12, padding: "12px 18px", borderBottom: `2px solid ${C.line}`, fontSize: 12, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 1 }}>
          <span>Name</span><span>Role</span><span>PIN</span><span>Hourly wage</span><span>Access</span><span />
        </div>
        {staff.map((s, idx) => {
          const perms = s.perms || (s.role === "driver" ? [] : ["production"]);
          const isDriver = s.role === "driver";
          return (
            <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 110px 90px 130px 180px 40px", minWidth: 760, gap: 12, alignItems: "center", padding: "10px 18px", borderTop: idx ? `1px solid ${C.line}` : "none" }}>
              <input value={s.name} onChange={(e) => upd(idx, { name: e.target.value })} style={cellInput} />
              <select value={s.role} onChange={(e) => upd(idx, { role: e.target.value })} style={cellInput}><option value="production">production</option><option value="driver">driver</option></select>
              <input value={s.pin || ""} placeholder="set PIN" onChange={(e) => upd(idx, { pin: e.target.value.slice(0, 4) })} style={cellInput} />
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ color: C.inkSoft }}>£</span><input type="number" step="0.10" value={s.wage} onChange={(e) => upd(idx, { wage: parseFloat(e.target.value) || 0 })} style={cellInput} /></div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {isDriver ? <span style={{ fontSize: 12, color: C.inkSoft }}>delivery only</span> : (
                  <>
                    <PermChip on={perms.includes("production")} onClick={() => togglePerm(idx, "production")}>Production</PermChip>
                    <PermChip on={perms.includes("sbook")} onClick={() => togglePerm(idx, "sbook")}>S.Book</PermChip>
                  </>
                )}
              </div>
              <button onClick={() => setStaff((p) => p.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: C.rust, cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
          );
        })}
      </div>
      <button onClick={() => setStaff((p) => [...p, { id: uid("u"), name: "New person", pin: "0000", wage: 12, role: "production", perms: ["production"] }])} style={{ ...adminBtn, marginTop: 12 }}>+ Add staff</button>
      <div style={{ color: C.inkSoft, fontSize: 13, marginTop: 10 }}>Access controls what each person can open: <b>Production</b> (the bake floor) and <b>S.Book</b> (the service recipe book). Tick one or both. Wages cost each production run and are never shown on the floor.</div>
    </div>
  );
}

function AdminLocations({ cpu, setCpu, locations, setLocations, delivery, setDelivery }) {
  const upd = (idx, patch) => setLocations((p) => p.map((x, i) => i === idx ? { ...x, ...patch } : x));
  return (
    <div>
      {/* CPU */}
      <div style={{ background: C.card, borderRadius: 18, padding: 20, border: `1px solid ${C.line}`, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.rust, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Central Production Unit (CPU)</div>
        <div className="row2">
          <Field label="CPU name"><input value={cpu.name} onChange={(e) => setCpu({ ...cpu, name: e.target.value })} style={bigInput} /></Field>
          <Field label="CPU address (where everything is produced)"><input value={cpu.address} onChange={(e) => setCpu({ ...cpu, address: e.target.value })} style={bigInput} /></Field>
        </div>
      </div>

      {/* single-site toggle */}
      <div style={{ background: C.card, borderRadius: 18, padding: 20, border: `1px solid ${C.line}`, marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Single site — bake &amp; sell here</div>
          <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 2 }}>No deliveries and no shops: production goes straight into your own stock. Turn this off if you deliver to other shops.</div>
        </div>
        <button onClick={() => setCpu({ ...cpu, singleSite: !cpu.singleSite })}
          style={{ background: cpu.singleSite ? C.go : "transparent", color: cpu.singleSite ? "#fff" : C.inkSoft, border: `1.5px solid ${cpu.singleSite ? C.go : C.line}`, borderRadius: 999, padding: "10px 22px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          {cpu.singleSite ? "✓ Single site ON" : "Single site OFF"}
        </button>
      </div>

      {cpu.singleSite ? (
        <div style={{ background: C.cardSoft, borderRadius: 18, padding: 20, border: `1px dashed ${C.gold}`, color: C.inkSoft }}>
          Single-site mode is on — shops and delivery rates are hidden, and everything you produce goes into your own stock. Turn it off above to manage shops and deliveries.
        </div>
      ) : (<>
      {/* delivery rates */}
      <div style={{ background: C.card, borderRadius: 18, padding: 20, border: `1px solid ${C.line}`, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.rust, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Delivery rates</div>
        <div className="row2" style={{ maxWidth: 420 }}>
          <Field label="Cost per mile (£)"><input type="number" step="0.05" value={delivery.perMile} onChange={(e) => setDelivery({ ...delivery, perMile: parseFloat(e.target.value) || 0 })} style={bigInput} /></Field>
          <Field label="Driver cost per hour (£)"><input type="number" step="0.5" value={delivery.perHour} onChange={(e) => setDelivery({ ...delivery, perHour: parseFloat(e.target.value) || 0 })} style={bigInput} /></Field>
        </div>
        <div style={{ color: C.inkSoft, fontSize: 13, marginTop: 10 }}>Delivery cost = distance × per-mile + (drive time ÷ 60) × per-hour. This folds into each run's total cost.</div>
      </div>

      {/* store locations */}
      <div style={{ background: C.card, borderRadius: 18, overflowX: "auto", WebkitOverflowScrolling: "touch", border: `1px solid ${C.line}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 100px 100px 130px 40px", minWidth: 720, gap: 12, padding: "12px 18px", borderBottom: `2px solid ${C.line}`, fontSize: 12, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 1 }}>
          <span>Store</span><span>Address</span><span>Distance</span><span>Drive</span><span>Delivery</span><span />
        </div>
        {locations.map((loc, idx) => (
          <div key={loc.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 100px 100px 130px 40px", minWidth: 720, gap: 12, alignItems: "center", padding: "10px 18px", borderTop: idx ? `1px solid ${C.line}` : "none" }}>
            <input value={loc.name} onChange={(e) => upd(idx, { name: e.target.value })} style={cellInput} />
            <input value={loc.address} onChange={(e) => upd(idx, { address: e.target.value })} style={cellInput} />
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}><input type="number" step="0.1" value={loc.distanceMi} onChange={(e) => upd(idx, { distanceMi: parseFloat(e.target.value) || 0 })} style={cellInput} /><span style={{ color: C.inkSoft, fontSize: 12 }}>mi</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}><input type="number" value={loc.driveMin} onChange={(e) => upd(idx, { driveMin: parseFloat(e.target.value) || 0 })} style={cellInput} /><span style={{ color: C.inkSoft, fontSize: 12 }}>min</span></div>
            <span className="display" style={{ fontWeight: 700, color: C.rust }}>{fmtMoney(deliveryCost(loc, delivery))}</span>
            <button onClick={() => setLocations((p) => p.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", color: C.rust, cursor: "pointer", fontSize: 18 }}>✕</button>
          </div>
        ))}
      </div>
      <button onClick={() => setLocations((p) => [...p, { id: uid("loc"), name: "New store", address: "", distanceMi: 0, driveMin: 0 }])} style={{ ...adminBtn, marginTop: 12 }}>+ Add location</button>
      </>)}
    </div>
  );
}

function AdminReports({ runs: allRuns, recipes, cancellations, storeStock, centralStock, deliveryQueue, stores, onResetStock }) {
  const [view, setView] = useState("runs");
  const [range, setRange] = useState("all"); // all | today | 7 | 30
  const recipesById = Object.fromEntries((recipes || []).map((r) => [r.id, r]));

  // date filter (newest data first) — applies to all run-based figures
  const now = Date.now();
  const cutoff = range === "today" ? new Date().setHours(0, 0, 0, 0) : range === "7" ? now - 7 * 864e5 : range === "30" ? now - 30 * 864e5 : 0;
  const runs = (allRuns || [])
    .filter((r) => { const t = r.at ? Date.parse(r.at) : 0; return cutoff ? t >= cutoff : true; })
    .slice()
    .sort((a, b) => (Date.parse(b.at || 0) || 0) - (Date.parse(a.at || 0) || 0));

  const totalQty = runs.reduce((a, r) => a + r.qty, 0), totalLabour = runs.reduce((a, r) => a + r.labour, 0);
  const totalIng = runs.reduce((a, r) => a + r.ingCost, 0), totalDeliv = runs.reduce((a, r) => a + (r.deliv || 0), 0), totalCost = runs.reduce((a, r) => a + r.total, 0);
  const totalSec = runs.reduce((a, r) => a + r.totalSec, 0);

  // group by recipe
  const byRecipe = {};
  runs.forEach((r) => { (byRecipe[r.recipe] ||= { name: r.recipe, recipeId: r.recipeId, runs: 0, qty: 0, sec: 0, ing: 0, labour: 0, deliv: 0, total: 0 }); const g = byRecipe[r.recipe]; g.runs++; g.qty += r.qty; g.sec += r.totalSec; g.ing += r.ingCost; g.labour += r.labour; g.deliv += (r.deliv || 0); g.total += r.total; });
  // group by person
  const byPerson = {};
  runs.forEach((r) => { (byPerson[r.by] ||= { name: r.by, runs: 0, qty: 0, sec: 0, labour: 0 }); const g = byPerson[r.by]; g.runs++; g.qty += r.qty; g.sec += r.totalSec; g.labour += r.labour; });

  const views = [["runs", "All runs"], ["recipe", "By recipe"], ["person", "By person"], ["cancelled", "Cancelled"], ["stock", "Stock & delivery"]];
  const rangeSel = { background: C.card, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, marginBottom: 18 }}>
        <Stat label="Runs" value={runs.length} />
        <Stat label="Produced" value={totalQty.toFixed(1)} />
        <Stat label="Total time" value={fmtClock(totalSec)} />
        <Stat label="Ingredients" value={fmtMoney(totalIng)} />
        <Stat label="Labour" value={fmtMoney(totalLabour)} />
        <Stat label="Delivery" value={fmtMoney(totalDeliv)} />
        <Stat label="Total cost" value={fmtMoney(totalCost)} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {views.map(([id, l]) => <button key={id} onClick={() => setView(id)} style={{ background: view === id ? C.ink : C.card, color: view === id ? "#fff" : C.ink, border: `1px solid ${view === id ? C.ink : C.line}`, borderRadius: 999, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{l}</button>)}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 1 }}>Date</span>
        <select value={range} onChange={(e) => setRange(e.target.value)} style={rangeSel}>
          <option value="all">All time</option>
          <option value="today">Today</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </div>

      {view === "runs" && (
        <div style={{ background: C.card, borderRadius: 16, overflowX: "auto", border: `1px solid ${C.line}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.7fr 0.8fr 0.7fr 0.7fr 0.7fr 0.7fr 0.8fr", minWidth: 680, gap: 10, padding: "12px 18px", borderBottom: `2px solid ${C.line}`, fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 0.5 }}>
            <span>Recipe</span><span>Qty</span><span>Person</span><span>Time</span><span>Ingr.</span><span>Labour</span><span>Deliv.</span><span>Total</span>
          </div>
          {runs.length === 0 ? <div style={{ padding: 18, color: C.inkSoft }}>No runs yet.</div> : runs.map((r, idx) => {
            const rec = recipesById[r.recipeId];
            const over = rec?.expectedSec && r.totalSec > rec.expectedSec;
            return (
              <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.7fr 0.8fr 0.7fr 0.7fr 0.7fr 0.7fr 0.8fr", minWidth: 680, gap: 10, padding: "12px 18px", borderTop: idx ? `1px solid ${C.line}` : "none", fontSize: 14, alignItems: "center" }}>
                <div><b>{r.recipe}</b><div style={{ fontSize: 11, color: C.inkSoft }}>{r.when}</div></div>
                <span>{r.qty}{r.unit}</span>
                <span>{r.by}</span>
                <span style={{ color: over ? C.rust : C.ink, fontWeight: over ? 700 : 400 }} title={rec?.expectedSec ? `target ${fmtClock(rec.expectedSec)}` : ""}>{fmtClock(r.totalSec)}{over ? " ▲" : ""}</span>
                <span>{fmtMoney(r.ingCost)}</span>
                <span style={{ color: C.rust }}>{fmtMoney(r.labour)}</span>
                <span style={{ color: C.gold }}>{fmtMoney(r.deliv || 0)}</span>
                <span style={{ fontWeight: 800 }}>{fmtMoney(r.total)}</span>
              </div>
            );
          })}
        </div>
      )}

      {view === "recipe" && (
        <div style={{ background: C.card, borderRadius: 16, overflowX: "auto", border: `1px solid ${C.line}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr 0.7fr 0.9fr 0.9fr 0.8fr 0.8fr", minWidth: 620, gap: 10, padding: "12px 18px", borderBottom: `2px solid ${C.line}`, fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 0.5 }}>
            <span>Recipe</span><span>Runs</span><span>Qty</span><span>Avg time</span><span>vs target</span><span>Avg cost</span><span>Total cost</span>
          </div>
          {Object.values(byRecipe).length === 0 ? <div style={{ padding: 18, color: C.inkSoft }}>No runs yet.</div> : Object.values(byRecipe).map((g, idx) => {
            const avgSec = Math.round(g.sec / g.runs);
            const rec = recipesById[g.recipeId];
            const diff = rec?.expectedSec ? avgSec - rec.expectedSec : null;
            return (
              <div key={g.name} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr 0.7fr 0.9fr 0.9fr 0.8fr 0.8fr", minWidth: 620, gap: 10, padding: "12px 18px", borderTop: idx ? `1px solid ${C.line}` : "none", fontSize: 14, alignItems: "center" }}>
                <b>{g.name}</b><span>{g.runs}</span><span>{g.qty.toFixed(1)}</span>
                <span>{fmtClock(avgSec)}</span>
                <span style={{ color: diff == null ? C.inkSoft : diff > 0 ? C.rust : C.go, fontWeight: 600 }}>{diff == null ? "—" : `${diff > 0 ? "+" : "−"}${fmtClock(Math.abs(diff))}`}</span>
                <span>{fmtMoney(g.total / g.runs)}</span><span style={{ fontWeight: 800 }}>{fmtMoney(g.total)}</span>
              </div>
            );
          })}
        </div>
      )}

      {view === "person" && (
        <div style={{ background: C.card, borderRadius: 16, overflowX: "auto", border: `1px solid ${C.line}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.7fr 0.8fr 0.9fr 0.9fr 0.9fr", minWidth: 560, gap: 10, padding: "12px 18px", borderBottom: `2px solid ${C.line}`, fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 0.5 }}>
            <span>Person</span><span>Runs</span><span>Produced</span><span>Total time</span><span>Avg / run</span><span>Labour</span>
          </div>
          {Object.values(byPerson).length === 0 ? <div style={{ padding: 18, color: C.inkSoft }}>No runs yet.</div> : Object.values(byPerson).map((g, idx) => (
            <div key={g.name} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.7fr 0.8fr 0.9fr 0.9fr 0.9fr", minWidth: 560, gap: 10, padding: "12px 18px", borderTop: idx ? `1px solid ${C.line}` : "none", fontSize: 14, alignItems: "center" }}>
              <b>{g.name}</b><span>{g.runs}</span><span>{g.qty.toFixed(1)}</span><span>{fmtClock(g.sec)}</span><span>{fmtClock(Math.round(g.sec / g.runs))}</span><span style={{ color: C.rust }}>{fmtMoney(g.labour)}</span>
            </div>
          ))}
        </div>
      )}

      {view === "cancelled" && (
        <div style={{ background: C.card, borderRadius: 16, overflowX: "auto", border: `1px solid ${C.line}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.7fr 0.9fr 1fr 1.1fr", minWidth: 560, gap: 10, padding: "12px 18px", borderBottom: `2px solid ${C.line}`, fontSize: 11, fontWeight: 700, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 0.5 }}>
            <span>Recipe</span><span>Qty</span><span>Person</span><span>Stopped at</span><span>When</span>
          </div>
          {(!cancellations || cancellations.length === 0) ? <div style={{ padding: 18, color: C.inkSoft }}>No cancelled productions. Good sign.</div> : cancellations.map((c, idx) => (
            <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 0.7fr 0.9fr 1fr 1.1fr", minWidth: 560, gap: 10, padding: "12px 18px", borderTop: idx ? `1px solid ${C.line}` : "none", fontSize: 14, alignItems: "center" }}>
              <b>{c.recipe}</b><span>{c.qty}{c.unit}</span><span>{c.by}</span>
              <span style={{ color: C.inkSoft }}>step {c.stoppedAtStep}/{c.totalSteps}</span>
              <span style={{ color: C.inkSoft, fontSize: 13 }}>{c.when}</span>
            </div>
          ))}
        </div>
      )}
      {view === "stock" && (
        <div>
          {onResetStock && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F6E0D6", border: `1px solid ${C.rust}`, borderRadius: 14, padding: "12px 16px", marginBottom: 16, flexWrap: "wrap" }}>
              <span style={{ flex: 1, fontSize: 14, minWidth: 200 }}>Reset clears <b>all</b> live stock (every shop + CPU) and the delivery queue. Production history and the leaderboard are kept. This can't be undone.</span>
              <button onClick={() => { if (window.confirm("Reset ALL stock to zero and clear the delivery queue? This can't be undone.")) onResetStock(); }} style={{ ...adminBtn, background: C.rust, color: "#fff", border: "none" }}>Reset all stock</button>
            </div>
          )}
          <Section title="Store stock (delivered)">
            {stores.map((s) => <div key={s} style={rowCard}><b>{s}</b><div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>{storeStock[s] && Object.keys(storeStock[s]).length ? Object.entries(storeStock[s]).map(([r, q]) => <span key={r}>{r}: <b>{q.toFixed(1)}</b></span>) : <span style={{ color: C.inkSoft }}>empty</span>}</div></div>)}
          </Section>
          <Section title="Total Production stock (not for delivery)">
            <div style={rowCard}><b>Central</b><div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>{Object.keys(centralStock).length ? Object.entries(centralStock).map(([r, q]) => <span key={r}>{r}: <b>{q.toFixed(1)}</b></span>) : <span style={{ color: C.inkSoft }}>empty</span>}</div></div>
          </Section>
          <Section title="Awaiting collection">
            {stores.map((s) => { const items = deliveryQueue[s] || []; return <div key={s} style={rowCard}><b>{s}</b><div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>{items.length ? items.map((i) => <span key={i.id}>{i.qty}{i.unit} {i.recipe}</span>) : <span style={{ color: C.inkSoft }}>nothing waiting</span>}</div></div>; })}
          </Section>
        </div>
      )}
    </div>
  );
}

function BigButton({ children, onClick, tone = "go", sub, disabled, full, voiceHint }) {
  const bg = tone === "go" ? C.go : tone === "rust" ? C.rust : tone === "gold" ? C.gold : C.card;
  const col = tone === "gold" ? C.ink : "#fff";
  const shadow = tone === "go" ? "#2f5e3c" : tone === "rust" ? C.rustDeep : "rgba(0,0,0,.2)";
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: bg, color: col, border: "none", borderRadius: 18, padding: "22px 28px", fontSize: 25, fontWeight: 700, letterSpacing: -0.2, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, width: full ? "100%" : "auto", boxShadow: `0 6px 0 ${shadow}`, lineHeight: 1.1, display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4 }}
      onMouseDown={(e) => { e.currentTarget.style.transform = "translateY(3px)"; e.currentTarget.style.boxShadow = "0 3px 0 rgba(0,0,0,.2)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 6px 0 ${shadow}`; }}>
      <span>{children}</span>{sub && <span style={{ fontSize: 14, fontWeight: 500, opacity: .85 }}>{sub}</span>}{voiceHint && <span style={{ fontSize: 12, fontWeight: 600, opacity: .8, textTransform: "uppercase", letterSpacing: 1 }}>say “{voiceHint}”</span>}
    </button>
  );
}
function GestureBar({ onThumbsUp, label }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <button onClick={onThumbsUp} title="Simulated camera gesture" style={{ background: C.gold, border: "none", borderRadius: 14, padding: "13px 24px", fontSize: 16, fontWeight: 700, color: C.ink, cursor: "pointer", boxShadow: "0 5px 0 rgba(0,0,0,.18)" }}>👍 Confirm</button>
      <span style={{ color: C.inkSoft, fontWeight: 500, fontSize: 14 }}>{label}</span>
    </div>
  );
}
function AdminPinGate({ onClose, onOk }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const submit = (p) => { if (p === ADMIN_USER.pin) onOk(); else { setErr(true); setPin(""); } };
  return (
    <Modal onClose={onClose}>
      <div className="display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Admin access</div>
      <p style={{ color: C.inkSoft, marginTop: 0, fontSize: 14 }}>Enter the admin PIN to manage recipes, costs, staff and reports.</p>
      <div style={{ fontSize: 32, letterSpacing: 12, textAlign: "center", minHeight: 40, color: err ? C.rust : C.ink }}>{pin.replace(/./g, "•")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 12 }}>
        {[1,2,3,4,5,6,7,8,9].map((n) => <button key={n} onClick={() => { setErr(false); setPin((p) => (p + n).slice(0, 4)); }} style={padBtn}>{n}</button>)}
        <button onClick={() => setPin("")} style={{ ...padBtn, fontSize: 15 }}>clear</button>
        <button onClick={() => setPin((p) => (p + "0").slice(0, 4))} style={padBtn}>0</button>
        <button onClick={() => submit(pin)} style={{ ...padBtn, background: C.go, color: "#fff" }}>✓</button>
      </div>
      {err && <p style={{ color: C.rust, fontSize: 13, marginBottom: 0 }}>Wrong PIN — try again.</p>}
    </Modal>
  );
}

/* Does this (already signed-in) user have a permission lane? Admin = all. */
function hasPerm(user, perm) {
  if (!user) return false;
  if (user.role === "admin") return true;
  const p = user.perms || (user.role === "driver" ? [] : ["production"]);
  return p.includes(perm);
}

/* Permission gate: enter a PIN to identify yourself and prove you have `perm`.
   Verified server-side via verify_pin (PINs are never read in the browser). */
function StaffPinGate({ perm, title, subtitle, onClose, onOk }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const submit = async (p) => {
    try {
      const person = await dbVerifyPin(p);
      if (!person) { setErr("PIN not recognised."); setPin(""); return; }
      const allowed = person.role === "admin" || (person.perms || (person.role === "driver" ? [] : ["production"])).includes(perm);
      if (!allowed) { setErr(`${person.name} doesn't have ${perm === "sbook" ? "Service Book" : "Production"} access.`); setPin(""); return; }
      onOk(person);
    } catch (e) { console.error("verify_pin failed", e); setErr("Couldn't reach the server — try again."); setPin(""); }
  };
  return (
    <Modal onClose={onClose}>
      <div className="display" style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{title}</div>
      <p style={{ color: C.inkSoft, marginTop: 0, fontSize: 14 }}>{subtitle}</p>
      <div style={{ fontSize: 32, letterSpacing: 12, textAlign: "center", minHeight: 40, color: err ? C.rust : C.ink }}>{pin.replace(/./g, "•")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 12 }}>
        {[1,2,3,4,5,6,7,8,9].map((n) => <button key={n} onClick={() => { setErr(""); setPin((p) => (p + n).slice(0, 4)); }} style={padBtn}>{n}</button>)}
        <button onClick={() => setPin("")} style={{ ...padBtn, fontSize: 15 }}>clear</button>
        <button onClick={() => setPin((p) => (p + "0").slice(0, 4))} style={padBtn}>0</button>
        <button onClick={() => submit(pin)} style={{ ...padBtn, background: C.go, color: "#fff" }}>✓</button>
      </div>
      {err && <p style={{ color: C.rust, fontSize: 13, marginBottom: 0 }}>{err}</p>}
    </Modal>
  );
}

function Modal({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(58,42,30,.5)", display: "grid", placeItems: "center", zIndex: 60, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.card, borderRadius: 22, padding: 24, maxWidth: 460, width: "100%", maxHeight: "88vh", overflowY: "auto", boxSizing: "border-box", boxShadow: "0 20px 60px rgba(0,0,0,.4)", border: `1px solid ${C.line}` }}>{children}</div>
    </div>
  );
}
const stepBtn = { width: 74, height: 74, borderRadius: 999, background: C.card, color: C.ink, border: `1px solid ${C.line}`, fontSize: 38, fontWeight: 800, cursor: "pointer", boxShadow: "0 5px 0 rgba(0,0,0,.12)" };
const adminBtn = { background: C.card, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 12, padding: "11px 16px", fontWeight: 600, fontSize: 14, cursor: "pointer" };
const cellInput = { background: C.cream, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 11px", fontSize: 15, width: "100%", fontWeight: 500 };
const bigInput = { background: C.card, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 12, padding: "13px 16px", fontSize: 17, width: "100%", fontWeight: 500 };
const rowCard = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: C.card, borderRadius: 12, padding: "12px 16px", marginBottom: 8, flexWrap: "wrap", border: `1px solid ${C.line}` };
function Stat({ label, value }) { return <div style={{ background: C.card, borderRadius: 16, padding: 18, border: `1px solid ${C.line}` }}><div style={{ fontSize: 12, color: C.inkSoft, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div><div className="display" style={{ fontSize: 30, fontWeight: 800 }}>{value}</div></div>; }
function Section({ title, children }) { return <div style={{ marginBottom: 22 }}><div style={{ fontSize: 13, color: C.rust, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 }}>{title}</div>{children}</div>; }
function Empty({ msg }) { return <div style={{ background: C.card, borderRadius: 12, padding: 18, color: C.inkSoft, border: `1px solid ${C.line}` }}>{msg}</div>; }
function beep() { try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; o.start(); g.gain.setValueAtTime(0.3, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2); o.stop(ctx.currentTime + 1.2); } catch {} }

export default App;
