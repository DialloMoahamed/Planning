/* Planning Tracker — moteur générique.
   Les plannings se créent dans l'application (bouton « Nouveau planning »).
   Ceux écrits dans plannings/*.js sont des plannings fournis (optionnels). */
const $ = id => document.getElementById(id);
const JOURS = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const MOIS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const LAST_KEY = "planning-tracker:dernier";
const CUSTOM_KEY = "planning-tracker:plannings";
const TPL_KEY = "planning-tracker:modeles";
const BACKUP_KEY = "planning-tracker:derniere-sauvegarde", CHANGE_KEY = "planning-tracker:derniere-modif";
const CREATED_KEY = "planning-tracker:premiere-modif", SNOOZE_KEY = "planning-tracker:rappel-reporte";
const DAY = 864e5;

const BUILTIN = (window.PLANNINGS || []).map(p => ({ ...p, builtin: true }));
let custom = readJSON(CUSTOM_KEY, []);
let plan, dates, state, openDays, editing, notes = {}, openNotes = new Set();

function readJSON(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) || fallback; } catch { return fallback; } }
const all = () => [...BUILTIN, ...custom];
function mark() {   // note qu'il y a des données non sauvegardées (pour le rappel)
  try { localStorage.setItem(CHANGE_KEY, String(Date.now())); if (!localStorage.getItem(CREATED_KEY)) localStorage.setItem(CREATED_KEY, String(Date.now())); } catch {}
}
const saveCustom = () => { localStorage.setItem(CUSTOM_KEY, JSON.stringify(custom)); mark(); };
const fmt = d => `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const slug = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "planning";
function el(tag, props = {}, ...kids) {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...kids);
  return e;
}
function show(view) { $("trackerView").hidden = view !== "tracker"; $("editorView").hidden = view !== "editor"; window.scrollTo(0, 0); }

const datesKey = () => `planning-tracker:${plan.id}:dates`;
function nextValid(d, p) { while (!p.includeWeekends && (d.getDay() === 0 || d.getDay() === 6)) d.setDate(d.getDate() + 1); return d; }
function computeDates(p) {
  const ov = readJSON(`planning-tracker:${p.id}:dates`, null);   // calendrier décalé par « Replanifier »
  if (Array.isArray(ov) && ov.length === p.days.length) return ov.map(s => new Date(s + "T12:00:00"));
  const out = [], d = new Date(p.startDate + "T12:00:00");
  for (let i = 0; i < p.days.length; i++) { nextValid(d, p); out.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return out;
}
const notesKey = () => `planning-tracker:${plan.id}:notes`;
function setNote(k, v) {
  mark();
  v.trim() ? notes[k] = v : delete notes[k];
  try { localStorage.setItem(notesKey(), JSON.stringify(notes)); }
  catch { $("notice").textContent = "Impossible de sauvegarder les notes ici. Exporte ton planning."; }
}
function noteBox(k, placeholder, btn) {
  const ta = el("textarea", { className: "note", value: notes[k] || "", placeholder, rows: 2 });
  ta.oninput = () => { setNote(k, ta.value); if (btn) btn.classList.toggle("has", !!ta.value.trim()); };
  return ta;
}
const key = () => `planning-tracker:${plan.id}`;
const isDone = (i, j) => !!state[`${i}-${j}`];
const dayDone = i => plan.days[i].tasks.every((_, j) => isDone(i, j));

function loadState() {
  for (const k of [key(), plan.legacyKey]) if (k) { const s = readJSON(k, null); if (s) return s; }
  return {};
}
function save(msg = "Progression sauvegardée automatiquement.") {
  mark();
  try { localStorage.setItem(key(), JSON.stringify(state)); $("notice").textContent = msg; }
  catch { $("notice").textContent = "Impossible de sauvegarder ici. Exporte ta progression."; }
}

/* ---------- Vue suivi ---------- */
function fillPicker() {
  const p = $("picker");
  p.innerHTML = "";
  all().forEach(x => p.appendChild(el("option", { value: x.id, textContent: x.title })));
  p.hidden = all().length < 2;
}
function select(id) {
  plan = all().find(p => p.id === id) || all()[0];
  if (!plan) return openEditor(null);
  try { localStorage.setItem(LAST_KEY, plan.id); } catch {}
  dates = computeDates(plan);
  state = loadState();
  notes = readJSON(notesKey(), {});
  openNotes = new Set();
  openDays = new Set([Math.max(plan.days.findIndex((_, i) => !dayDone(i)), 0)]);
  fillPicker();
  $("picker").value = plan.id;
  $("eyebrow").textContent = plan.eyebrow || "Planning de projet";
  $("title").textContent = plan.title;
  const last = dates.at(-1);
  const range = `Du ${dates[0].getDate()} ${MOIS[dates[0].getMonth()]} au ${last.getDate()} ${MOIS[last.getMonth()]} ${last.getFullYear()} · ${plan.days.length} jour${plan.days.length > 1 ? "s" : ""}`;
  $("subtitle").textContent = plan.subtitle ? `${plan.subtitle} · ${range}` : range;
  $("editPlan").textContent = plan.builtin ? "Dupliquer pour modifier" : "Modifier";
  $("deletePlan").hidden = !!plan.builtin;
  const ov = readJSON(datesKey(), null);
  $("unplan").hidden = !(Array.isArray(ov) && ov.length === plan.days.length);
  $("notice").textContent = "Sauvegarde automatique activée sur cet appareil.";
  document.title = `${plan.title} — Planning`;
  show("tracker");
  render();
  checkBackup();
}

function render() {
  const box = $("days"), today = iso(new Date());
  box.innerHTML = "";
  plan.days.forEach((day, i) => {
    const done = day.tasks.filter((_, j) => isDone(i, j)).length, open = openDays.has(i), isToday = iso(dates[i]) === today;
    const date = el("span", { className: "date", textContent: fmt(dates[i]) });
    if (isToday) date.append(el("span", { className: "badge", textContent: "Aujourd'hui" }));
    const head = el("button", { type: "button", className: "day-head" },
      el("span", { className: "day-num", textContent: String(i + 1).padStart(2, "0") }),
      el("span", { className: "day-title" }, date, el("br"), el("strong", { textContent: day.title })),
      el("span", { className: "day-progress", textContent: `${done}/${day.tasks.length}` }),
      el("span", { className: "tick", textContent: dayDone(i) ? "✓" : open ? "⌃" : "⌄" }));
    head.setAttribute("aria-expanded", String(open));
    head.onclick = () => { open ? openDays.delete(i) : openDays.add(i); render(); };

    const tasks = el("div", { className: "tasks", hidden: !open });
    day.tasks.forEach((t, j) => {
      const cb = el("input", { type: "checkbox", checked: isDone(i, j) });
      cb.onchange = () => { state[`${i}-${j}`] = cb.checked; save(); openDays.add(i); render(); };
      const nk = `t${i}-${j}`;
      const nb = el("button", { type: "button", className: "note-btn" + (notes[nk] ? " has" : ""), textContent: "📝", title: "Note sur cette tâche" });
      nb.onclick = () => { openNotes.has(nk) ? openNotes.delete(nk) : openNotes.add(nk); render(); };
      tasks.appendChild(el("div", { className: "task-row" }, el("label", { className: "task" }, cb, el("span", { textContent: t })), nb));
      if (openNotes.has(nk)) tasks.appendChild(noteBox(nk, "Note sur cette tâche…", nb));
    });
    tasks.appendChild(el("div", { className: "day-notes" },
      el("span", { className: "w-label", textContent: "Notes du jour" }), noteBox(`d${i}`, "Blocages, liens, idées…")));
    const complete = el("button", { type: "button", textContent: dayDone(i) ? "Journée terminée ✓" : "Valider la journée" });
    complete.onclick = () => { day.tasks.forEach((_, j) => state[`${i}-${j}`] = true); save(`${day.title} validée.`); openDays.add(i); render(); };
    tasks.appendChild(el("div", { className: "day-actions" }, complete));
    box.appendChild(el("article", { className: "day" + (isToday ? " today" : "") }, head, tasks));
  });
  const total = plan.days.reduce((n, d) => n + d.tasks.length, 0);
  const done = plan.days.reduce((n, d, i) => n + d.tasks.filter((_, j) => isDone(i, j)).length, 0);
  const pct = total ? Math.round(done / total * 100) : 0;
  $("percent").textContent = `${pct} %`;
  $("summary").textContent = `${done} tâche${done > 1 ? "s" : ""} terminée${done > 1 ? "s" : ""} sur ${total}`;
  $("daySummary").textContent = `${plan.days.filter((_, i) => dayDone(i)).length} / ${plan.days.length} journées terminées`;
  $("progress").value = pct;
  updateLevel(done, total);
  tick();
}

/* ---------- Niveau (selon le pourcentage de tâches terminées) ---------- */
const LEVELS = [
  { name: "Débutant", at: 0 }, { name: "Apprenti", at: 20 }, { name: "Confirmé", at: 40 },
  { name: "Expert", at: 60 }, { name: "Maître", at: 80 }, { name: "Légende", at: 100 }
];
function updateLevel(done, total) {
  const pct = total ? done / total * 100 : 0;
  let idx = 0;
  LEVELS.forEach((l, i) => { if (pct >= l.at) idx = i; });
  const cur = LEVELS[idx], next = LEVELS[idx + 1];
  $("level").textContent = `Niveau ${idx + 1} · ${cur.name}`;
  if (!next) { $("levelBar").value = 100; $("levelSub").textContent = "Niveau maximum atteint 🎉"; return; }
  const need = Math.ceil(next.at * total / 100) - done;
  $("levelBar").value = (pct - cur.at) / (next.at - cur.at) * 100;
  $("levelSub").textContent = `Encore ${need} tâche${need > 1 ? "s" : ""} pour devenir ${next.name}`;
}

/* ---------- Compte à rebours (fin du dernier jour, 23h59) ---------- */
function tick() {
  if (!plan || !dates) return;
  const now = new Date(), start = new Date(dates[0]), end = new Date(dates.at(-1));
  start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);
  let label = "Temps restant", ms = end - now;
  if (now < start) { label = "Début dans"; ms = start - now; }
  else if (now > end) { label = "Délai dépassé de"; ms = now - end; }
  const t = Math.floor(ms / 1000), p2 = n => String(n).padStart(2, "0");
  $("countdownLabel").textContent = label;
  $("countdown").textContent = `${Math.floor(t / 86400)}j ${p2(Math.floor(t % 86400 / 3600))}h ${p2(Math.floor(t % 3600 / 60))}m ${p2(t % 60)}s`;
  const left = plan.days.filter((_, i) => !dayDone(i)).length;
  $("countdownSub").textContent = left ? `${left} journée${left > 1 ? "s" : ""} à valider` : "Planning terminé 🎉";
  updatePace();
}

/* ---------- Rythme : avance / retard par rapport au calendrier ---------- */
function updatePace() {
  const today = iso(new Date());
  const total = plan.days.reduce((n, d) => n + d.tasks.length, 0);
  const done = plan.days.reduce((n, d, i) => n + d.tasks.filter((_, j) => isDone(i, j)).length, 0);
  const expected = plan.days.reduce((n, d, i) => n + (iso(dates[i]) < today ? d.tasks.length : 0), 0);
  const todayLeft = plan.days.reduce((n, d, i) => n + (iso(dates[i]) === today ? d.tasks.filter((_, j) => !isDone(i, j)).length : 0), 0);
  const diff = done - expected, perDay = total / plan.days.length;
  const s = (n, w) => `${n} ${w}${n > 1 ? "s" : ""}`;
  let txt, sub = "", cls = "";
  if (total && done === total) { txt = "Terminé 🎉"; cls = "good"; }
  else if (today < iso(dates[0])) { txt = "Pas encore commencé"; sub = `Début le ${fmt(dates[0])}`; }
  else if (diff < 0) { txt = "En retard"; cls = "bad"; sub = `${s(-diff, "tâche")} de retard (≈ ${String(Math.round(-diff / perDay * 10) / 10).replace(".", ",")} j)`; }
  else if (diff > 0) { txt = "En avance"; cls = "good"; sub = `${s(diff, "tâche")} d'avance`; }
  else { txt = "Dans les temps"; cls = "good"; sub = todayLeft ? `Aujourd'hui : ${s(todayLeft, "tâche")} à faire` : "Rien de prévu en retard"; }
  $("pace").textContent = txt;
  $("pace").className = "w-value " + cls;
  $("paceSub").textContent = sub;
}
setInterval(tick, 1000);

/* ---------- Vue éditeur (création / modification) ---------- */
function openEditor(src) {
  const d = src
    ? { title: src.title, subtitle: src.subtitle || "", startDate: src.startDate, includeWeekends: !!src.includeWeekends,
        days: src.days.map(x => ({ title: x.title, text: x.tasks.join("\n") })) }
    : { title: "", subtitle: "", startDate: iso(new Date()), includeWeekends: false, days: [{ title: "", text: "" }] };
  if (src && src.builtin) d.title += " (copie)";
  editing = { id: src && !src.builtin ? src.id : null, draft: d, fresh: !src };
  renderEditor();
  show("editor");
}
function renderEditor() {
  const d = editing.draft, v = $("editorView");
  v.innerHTML = "";
  const bind = (input, prop, obj = d) => { input.oninput = () => obj[prop] = input.type === "checkbox" ? input.checked : input.value; return input; };
  const field = (label, input) => el("label", { className: "field" }, el("span", { textContent: label }), input);

  const days = el("div");
  d.days.forEach((day, i) => {
    const mv = (txt, to) => { const b = el("button", { type: "button", textContent: txt, disabled: to < 0 || to >= d.days.length });
      b.onclick = () => { [d.days[i], d.days[to]] = [d.days[to], d.days[i]]; renderEditor(); }; return b; };
    const del = el("button", { type: "button", className: "danger", textContent: "✕", disabled: d.days.length === 1 });
    del.onclick = () => { d.days.splice(i, 1); renderEditor(); };
    days.appendChild(el("div", { className: "day-edit" },
      el("div", { className: "day-edit-head" }, el("span", { textContent: `Jour ${i + 1}` }), el("div", {}, mv("↑", i - 1), mv("↓", i + 1), del)),
      field("Titre du jour", bind(el("input", { type: "text", value: day.title, placeholder: "Ex. Configuration du projet" }), "title", day)),
      field("Tâches (une par ligne)", bind(el("textarea", { value: day.text, placeholder: "Installer les outils\nCréer le dépôt Git" }), "text", day))));
  });
  const add = el("button", { type: "button", textContent: "+ Ajouter un jour" });
  add.onclick = () => { d.days.push({ title: "", text: "" }); renderEditor(); };
  const saveBtn = el("button", { type: "button", className: "primary", textContent: "Enregistrer le planning" });
  saveBtn.onclick = saveEditor;
  const cancel = el("button", { type: "button", textContent: "Annuler" });
  cancel.onclick = () => all().length ? select(plan ? plan.id : all()[0].id) : null;

  v.appendChild(el("div", { className: "editor" },
    el("div", { className: "eyebrow", textContent: editing.id ? "Modifier" : "Nouveau planning" }),
    el("h1", { textContent: editing.id ? "Modifier le planning" : "Créer un planning" }),
    ...(editing.fresh ? [templatesBox()] : []),
    field("Titre du projet", bind(el("input", { type: "text", value: d.title, placeholder: "Ex. Mon site e-commerce" }), "title")),
    field("Sous-titre (optionnel)", bind(el("input", { type: "text", value: d.subtitle }), "subtitle")),
    el("div", { className: "row2" },
      field("Date de début", bind(el("input", { type: "date", value: d.startDate }), "startDate")),
      el("label", { className: "check" }, bind(el("input", { type: "checkbox", checked: d.includeWeekends }), "includeWeekends"), "Compter samedi et dimanche")),
    days,
    el("div", { className: "toolbar" }, add),
    el("div", { className: "error", id: "editorError", role: "alert" }),
    el("div", { className: "toolbar" }, saveBtn, cancel)));
}
function saveEditor() {
  const d = editing.draft, err = m => $("editorError").textContent = m;
  const days = d.days.map(x => ({ title: x.title.trim(), tasks: x.text.split("\n").map(s => s.trim()).filter(Boolean) }))
    .filter(x => x.title || x.tasks.length);
  if (!d.title.trim()) return err("Donne un titre au planning.");
  if (!d.startDate) return err("Choisis une date de début.");
  if (!days.length) return err("Ajoute au moins un jour.");
  const bad = days.findIndex(x => !x.title || !x.tasks.length);
  if (bad >= 0) return err(`Le jour ${bad + 1} a besoin d'un titre et d'au moins une tâche.`);
  const p = { id: editing.id || `${slug(d.title)}-${Date.now().toString(36)}`, title: d.title.trim(), subtitle: d.subtitle.trim(),
    eyebrow: "Planning de projet", startDate: d.startDate, includeWeekends: d.includeWeekends, days };
  const idx = custom.findIndex(x => x.id === p.id);
  idx >= 0 ? custom[idx] = p : custom.push(p);
  saveCustom();
  try { localStorage.removeItem(`planning-tracker:${p.id}:dates`); } catch {}
  select(p.id);
  $("notice").textContent = "Planning enregistré.";
}

/* ---------- Modèles ---------- */
const userTemplates = () => readJSON(TPL_KEY, []);
const allTemplates = () => [...(window.TEMPLATES || []), ...userTemplates()];
function applyTemplate(t) {
  const d = editing.draft;
  if (d.days.some(x => x.title.trim() || x.text.trim()) && !confirm("Remplacer les jours actuels par ceux du modèle ?")) return;
  d.days = t.days.map(x => ({ title: x.title, text: x.tasks.join("\n") }));
  if (!d.title.trim()) d.title = t.name;
  renderEditor();
}
function templatesBox() {
  const chips = allTemplates().map(t => {
    const b = el("button", { type: "button", className: "chip", textContent: `${t.name} · ${t.days.length} j`, title: t.description || "" });
    b.onclick = () => applyTemplate(t);
    const wrap = el("span", { className: "chip-wrap" }, b);
    if (t.user) {
      const x = el("button", { type: "button", className: "chip danger", textContent: "✕", title: "Supprimer ce modèle" });
      x.onclick = () => {
        if (!confirm(`Supprimer le modèle « ${t.name} » ?`)) return;
        localStorage.setItem(TPL_KEY, JSON.stringify(userTemplates().filter(u => u.id !== t.id))); mark(); renderEditor();
      };
      wrap.append(x);
    }
    return wrap;
  });
  return el("div", { className: "tpl" }, el("span", { className: "w-label", textContent: "Partir d'un modèle" }), el("div", { className: "chips" }, ...chips));
}

/* ---------- Sauvegarde complète et rappel ---------- */
function downloadJSON(name, obj) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }));
  el("a", { href: url, download: name }).click();
  URL.revokeObjectURL(url);
}
function exportAll() {
  const data = { app: "planning-tracker-all", version: 3, exportedAt: new Date().toISOString(), plans: custom, templates: userTemplates(), progress: {} };
  all().forEach(p => {
    data.progress[p.id] = { state: readJSON(`planning-tracker:${p.id}`, null) || (p.legacyKey && readJSON(p.legacyKey, null)) || {},
      dates: readJSON(`planning-tracker:${p.id}:dates`, null), notes: readJSON(`planning-tracker:${p.id}:notes`, {}) };
  });
  downloadJSON(`planning-tracker-sauvegarde-${iso(new Date())}.json`, data);
  try { localStorage.setItem(BACKUP_KEY, String(Date.now())); } catch {}
  $("notice").textContent = "Sauvegarde complète exportée (tous les plannings, notes et modèles).";
  checkBackup();
}
function restoreAll(data) {
  if (!confirm("Restaurer la sauvegarde complète ? Elle remplacera la progression et les notes des plannings qu'elle contient.")) return;
  (data.plans || []).forEach(p => {
    if (!p || !p.id || !p.title || !p.startDate || !Array.isArray(p.days)) return;
    const i = custom.findIndex(x => x.id === p.id);
    i >= 0 ? custom[i] = p : custom.push(p);
  });
  saveCustom();
  const tpls = userTemplates();
  (data.templates || []).forEach(t => { if (t && t.id && Array.isArray(t.days) && !tpls.some(x => x.id === t.id)) tpls.push(t); });
  localStorage.setItem(TPL_KEY, JSON.stringify(tpls));
  Object.entries(data.progress || {}).forEach(([id, v]) => {
    if (!all().some(p => p.id === id) || !v) return;
    localStorage.setItem(`planning-tracker:${id}`, JSON.stringify(v.state || {}));
    localStorage.setItem(`planning-tracker:${id}:notes`, JSON.stringify(v.notes || {}));
    if (Array.isArray(v.dates)) localStorage.setItem(`planning-tracker:${id}:dates`, JSON.stringify(v.dates));
    else localStorage.removeItem(`planning-tracker:${id}:dates`);
  });
  try { localStorage.setItem(BACKUP_KEY, String(Date.now())); } catch {}
  select(plan ? plan.id : all()[0].id);
  $("notice").textContent = "Sauvegarde complète restaurée.";
}
function checkBackup() {
  const box = $("backup"), now = Date.now(), n = k => +localStorage.getItem(k) || 0;
  const last = n(BACKUP_KEY), ref = last || n(CREATED_KEY);
  const due = n(CHANGE_KEY) > last && ref && now - ref > 7 * DAY && now > n(SNOOZE_KEY);
  box.hidden = !due;
  if (!due) return;
  const days = Math.floor((now - last) / DAY);
  const msg = (last ? `Dernière sauvegarde complète il y a ${days} jour${days > 1 ? "s" : ""}.` : "Tu n'as encore jamais fait de sauvegarde complète.")
    + " Tes plannings sont stockés dans ce navigateur : exporte-les pour ne rien perdre.";
  const go = el("button", { type: "button", className: "primary", textContent: "Sauvegarder maintenant" });
  go.onclick = exportAll;
  const later = el("button", { type: "button", textContent: "Plus tard" });
  later.onclick = () => { localStorage.setItem(SNOOZE_KEY, String(Date.now() + 2 * DAY)); box.hidden = true; };
  box.innerHTML = "";
  box.append(el("p", { textContent: msg }), el("div", { className: "backup-actions" }, go, later));
}

/* ---------- Actions ---------- */
$("exportAll").onclick = exportAll;
$("saveTpl").onclick = () => {
  const name = (prompt("Nom du modèle :", plan.title) || "").trim();
  if (!name) return;
  const list = userTemplates();
  list.push({ id: `u-${slug(name)}-${Date.now().toString(36)}`, name, description: "Modèle personnel", user: true,
    days: plan.days.map(d => ({ title: d.title, tasks: [...d.tasks] })) });
  localStorage.setItem(TPL_KEY, JSON.stringify(list)); mark();
  $("notice").textContent = `Modèle « ${name} » enregistré : retrouve-le dans « Nouveau planning ».`;
};
$("picker").onchange = e => select(e.target.value);
$("newPlan").onclick = () => openEditor(null);
$("editPlan").onclick = () => openEditor(plan);
$("deletePlan").onclick = () => {
  if (!confirm(`Supprimer « ${plan.title} » et sa progression ? Irréversible sans sauvegarde.`)) return;
  custom = custom.filter(x => x.id !== plan.id);
  saveCustom();
  try { localStorage.removeItem(key()); localStorage.removeItem(datesKey()); localStorage.removeItem(notesKey()); } catch {}
  select(all()[0] && all()[0].id);
};
$("openNext").onclick = () => {
  const next = plan.days.findIndex((_, i) => !dayDone(i));
  if (next < 0) { $("notice").textContent = "Bravo, toutes les tâches sont terminées !"; return; }
  openDays.add(next); render();
  $("days").children[next].scrollIntoView({ behavior: "smooth", block: "center" });
};
$("export").onclick = () => {
  const data = { app: "planning-tracker", version: 2, exportedAt: new Date().toISOString(), planning: plan.id, plan, state, dates: readJSON(datesKey(), null), notes };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = el("a", { href: url, download: `${plan.id}.json` });
  a.click(); URL.revokeObjectURL(url);
  $("notice").textContent = "Planning et progression exportés.";
};
$("import").onclick = () => $("importFile").click();
$("importFile").onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.app === "planning-tracker-all") { restoreAll(data); }
    else if (data.plan && Array.isArray(data.plan.days)) {            // planning complet (version 2)
      const p = { ...data.plan, builtin: undefined };
      if (!p.id || !p.title || !p.startDate) throw new Error("format");
      if (BUILTIN.some(b => b.id === p.id)) p.id += "-import";
      const idx = custom.findIndex(x => x.id === p.id);
      idx >= 0 ? custom[idx] = p : custom.push(p);
      saveCustom();
      localStorage.setItem(`planning-tracker:${p.id}`, JSON.stringify(data.state || {}));
      if (data.notes && typeof data.notes === "object") localStorage.setItem(`planning-tracker:${p.id}:notes`, JSON.stringify(data.notes));
      if (Array.isArray(data.dates)) localStorage.setItem(`planning-tracker:${p.id}:dates`, JSON.stringify(data.dates));
      select(p.id);
      $("notice").textContent = "Planning importé.";
    } else {                                                      // progression seule (ancien format)
      const imported = data.state || data;
      if (!imported || typeof imported !== "object" || Array.isArray(imported)) throw new Error("format");
      state = {};
      plan.days.forEach((d, i) => d.tasks.forEach((_, j) => state[`${i}-${j}`] = !!imported[`${i}-${j}`]));
      save("Progression importée."); render();
    }
  } catch { $("notice").textContent = "Fichier invalide. Choisis un JSON exporté depuis cette application."; }
  e.target.value = "";
};
$("reset").onclick = () => {
  if (!confirm("Effacer la progression de ce planning ? Irréversible sans sauvegarde.")) return;
  state = {}; save("Progression réinitialisée."); render();
};

$("replan").onclick = () => {
  const first = plan.days.findIndex((_, i) => !dayDone(i));
  if (first < 0) { $("notice").textContent = "Tout est terminé, rien à replanifier."; return; }
  const today = new Date(); today.setHours(12, 0, 0, 0);
  if (iso(dates[first]) >= iso(today)) { $("notice").textContent = "Tu n'es pas en retard : rien à replanifier."; return; }
  if (!confirm(`Décaler les jours non terminés à partir d'aujourd'hui (${fmt(today)}) ? Les dates et le compteur seront recalculés.`)) return;
  const out = dates.slice(0, first).map(iso), d = new Date(today);
  if (first > 0 && iso(dates[first - 1]) >= iso(d)) { d.setTime(dates[first - 1].getTime()); d.setDate(d.getDate() + 1); }
  for (let i = first; i < plan.days.length; i++) { nextValid(d, plan); out.push(iso(d)); d.setDate(d.getDate() + 1); }
  localStorage.setItem(datesKey(), JSON.stringify(out)); mark();
  select(plan.id);
  $("notice").textContent = `Replanifié : « ${plan.days[first].title} » est maintenant prévu le ${fmt(dates[first])}.`;
};
$("unplan").onclick = () => {
  if (!confirm("Revenir au calendrier d'origine ?")) return;
  localStorage.removeItem(datesKey()); mark();
  select(plan.id);
  $("notice").textContent = "Calendrier d'origine rétabli.";
};

select(localStorage.getItem(LAST_KEY));
