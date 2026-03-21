// ═══════════════════════════════════════════════════════
// MEALS.JS — Custom meal plan builder
// Each user creates their own weekly meal template
// They can override specific days and reorder/edit/delete
// ═══════════════════════════════════════════════════════

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const BADGE_OPTIONS = ['Breakfast','Lunch','Dinner','Snack','Pre-workout','Post-workout','Hydration','Supplements','Other'];
const BADGE_COLORS  = {
  'Breakfast':    {bc:'#a78bfa22',bt:'#a78bfa'},
  'Lunch':        {bc:'#4d9fff22',bt:'#4d9fff'},
  'Dinner':       {bc:'#f472b622',bt:'#f472b6'},
  'Snack':        {bc:'#4ade8022',bt:'#4ade80'},
  'Pre-workout':  {bc:'#fbbf2422',bt:'#fbbf24'},
  'Post-workout': {bc:'#00d4a022',bt:'#00d4a0'},
  'Hydration':    {bc:'#4d9fff22',bt:'#4d9fff'},
  'Supplements':  {bc:'#9ca3af22',bt:'#9ca3af'},
  'Other':        {bc:'#9ca3af22',bt:'#9ca3af'},
};

// userMeals structure:
// {
//   template: { Monday: [...meals], Tuesday: [...meals], ... },  ← weekly template
//   overrides: { '2026-03-21': [...meals], ... }                 ← specific day overrides
// }
let userMeals = { template: {}, overrides: {} };

// Current state for meal editor
let mealEditorDay    = 'Monday';
let mealEditorMode   = 'template';  // 'template' or 'override'
let editingMealId    = null;
let dragSrcIndex     = null;

// ─── Generate unique ID ───────────────────────────────
function genId(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

// ─── Get meals for a specific date ───────────────────
// Returns override if exists, otherwise template
function getMealsForDate(dateKey){
  if(userMeals.overrides && userMeals.overrides[dateKey]){
    return userMeals.overrides[dateKey];
  }
  const dayName = keyToDayName(dateKey);
  return (userMeals.template && userMeals.template[dayName]) || [];
}

// ─── Check if user has set up any meals ──────────────
function userHasMeals(){
  if(!userMeals.template) return false;
  return DAYS.some(d => userMeals.template[d] && userMeals.template[d].length > 0);
}

// ─── Load user meals from Firebase ───────────────────
async function loadUserMeals(){
  if(!fbDb || !currentUser) return;
  try {
    const doc = await fbDb.collection('users').doc(currentUser.uid)
                          .collection('meals').doc('plan').get();
    if(doc.exists && doc.data().plan){
      userMeals = JSON.parse(doc.data().plan);
      if(!userMeals.template)  userMeals.template  = {};
      if(!userMeals.overrides) userMeals.overrides  = {};
    }
  } catch(e){ console.error('loadUserMeals error:', e); }
}

// ─── Save user meals to Firebase ─────────────────────
async function saveUserMeals(){
  if(!fbDb || !currentUser) return;
  try {
    await fbDb.collection('users').doc(currentUser.uid)
              .collection('meals').doc('plan')
              .set({ plan: JSON.stringify(userMeals) });
  } catch(e){ console.error('saveUserMeals error:', e); }
}

// ════════════════════════════════════════════════════════
// MEAL EDITOR — Full page overlay
// ════════════════════════════════════════════════════════

function openMealEditor(day, mode){
  mealEditorDay  = day || 'Monday';
  mealEditorMode = mode || 'template';
  renderMealEditor();
  document.getElementById('meal-editor-overlay').classList.remove('hidden');
}

function closeMealEditor(){
  document.getElementById('meal-editor-overlay').classList.add('hidden');
  editingMealId = null;
}

function renderMealEditor(){
  const overlay = document.getElementById('meal-editor-overlay');

  // Day tabs
  const tabsHtml = DAYS.map(d => `
    <div class="me-day-tab ${d===mealEditorDay?'active':''}" onclick="switchMealEditorDay('${d}')">
      ${d.slice(0,3)}
    </div>`).join('');

  // Get current meals for this day
  const meals = mealEditorMode === 'template'
    ? (userMeals.template[mealEditorDay] || [])
    : (userMeals.overrides[getCurrentDateKey()] || []);

  // Sort by time
  const sorted = [...meals].sort((a,b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  // Meals list
  const mealsHtml = sorted.length === 0
    ? `<div class="me-empty">
        <div style="font-size:40px;margin-bottom:10px">🍽️</div>
        <div style="font-weight:700;margin-bottom:6px">No meals yet</div>
        <div style="font-size:12px;color:var(--muted)">Click "+ Add Meal" below to start building your plan</div>
       </div>`
    : sorted.map((meal, idx) => `
        <div class="me-meal-card" draggable="true"
          ondragstart="onDragStart(event,${idx})"
          ondragover="onDragOver(event)"
          ondrop="onDrop(event,${idx})"
          ondragend="onDragEnd()">
          <div class="me-drag-handle">⠿</div>
          <div class="me-meal-info">
            <div class="me-meal-name">${meal.name}</div>
            <div class="me-meal-meta">
              <span class="me-badge" style="background:${getBadgeColors(meal.badge).bc};color:${getBadgeColors(meal.badge).bt}">${meal.badge}</span>
              <span>🕐 ${meal.time}</span>
              <span>🔥 ${meal.kcal} kcal</span>
              <span>💪 ${meal.protein}g P</span>
            </div>
          </div>
          <div class="me-meal-actions">
            <button class="me-btn me-btn-edit" onclick="openEditMealForm('${meal.id}')">✏️</button>
            <button class="me-btn me-btn-del"  onclick="deleteMeal('${meal.id}')">🗑</button>
          </div>
        </div>`).join('');

  // Check if this day has an override
  const dateKey = getCurrentDateKey();
  const hasOverride = userMeals.overrides && userMeals.overrides[dateKey];
  const overrideBanner = mealEditorMode === 'override' && hasOverride
    ? `<div class="me-override-banner">
        📅 This specific date has custom meals (overrides template)
        <button onclick="clearOverride('${dateKey}')">Use template instead</button>
       </div>` : '';

  const copyBtn = mealEditorMode === 'template'
    ? `<button class="me-copy-btn" onclick="showCopyDayModal()">📋 Copy to another day</button>` : '';

  overlay.querySelector('.meal-editor-inner').innerHTML = `
    <div class="me-header">
      <div>
        <div class="me-title">✏️ Meal Plan Editor</div>
        <div class="me-subtitle">${mealEditorMode === 'template' ? 'Weekly template — repeats every week' : 'Override for ' + dateKey}</div>
      </div>
      <button class="me-close" onclick="closeMealEditor()">✕</button>
    </div>

    <div class="me-mode-tabs">
      <button class="me-mode-tab ${mealEditorMode==='template'?'active':''}"
        onclick="switchMealEditorMode('template')">📅 Weekly Template</button>
      <button class="me-mode-tab ${mealEditorMode==='override'?'active':''}"
        onclick="switchMealEditorMode('override')">📌 Override Today</button>
    </div>

    <div class="me-day-tabs">${tabsHtml}</div>

    ${overrideBanner}

    <div class="me-meals-list" id="me-meals-list">${mealsHtml}</div>

    <div class="me-footer">
      ${copyBtn}
      <button class="me-add-btn" onclick="openAddMealForm()">+ Add Meal</button>
    </div>

    <!-- Add/Edit form (hidden by default) -->
    <div class="me-form-panel hidden" id="me-form-panel">
      <div class="me-form-title" id="me-form-title">Add New Meal</div>
      <div class="me-form-grid">
        <div class="me-form-field full">
          <label>Meal Name</label>
          <input type="text" id="mf-name" placeholder="e.g. Oats + banana + eggs" class="me-input"/>
        </div>
        <div class="me-form-field">
          <label>Time</label>
          <input type="time" id="mf-time" value="08:00" class="me-input"/>
        </div>
        <div class="me-form-field">
          <label>Category</label>
          <select id="mf-badge" class="me-input">
            ${BADGE_OPTIONS.map(b=>`<option value="${b}">${b}</option>`).join('')}
          </select>
        </div>
        <div class="me-form-field">
          <label>Calories (kcal)</label>
          <input type="number" id="mf-kcal" placeholder="0" min="0" class="me-input"/>
        </div>
        <div class="me-form-field">
          <label>Protein (g)</label>
          <input type="number" id="mf-protein" placeholder="0" min="0" class="me-input"/>
        </div>
        <div class="me-form-field">
          <label>Carbs (g)</label>
          <input type="number" id="mf-carbs" placeholder="0" min="0" class="me-input"/>
        </div>
        <div class="me-form-field">
          <label>Fat (g)</label>
          <input type="number" id="mf-fat" placeholder="0" min="0" class="me-input"/>
        </div>
      </div>
      <div class="me-form-btns">
        <button class="me-save-btn" onclick="saveMealForm()">Save Meal</button>
        <button class="me-cancel-btn" onclick="closeMealForm()">Cancel</button>
      </div>
    </div>
  `;
}

function getCurrentDateKey(){
  return typeof getSelKey === 'function' ? getSelKey() : todayKey();
}

function switchMealEditorDay(day){
  mealEditorDay = day;
  renderMealEditor();
}

function switchMealEditorMode(mode){
  mealEditorMode = mode;
  // If switching to override and no override exists yet, copy template
  if(mode === 'override'){
    const dateKey = getCurrentDateKey();
    if(!userMeals.overrides[dateKey]){
      const dayName = keyToDayName(dateKey);
      userMeals.overrides[dateKey] = JSON.parse(JSON.stringify(
        userMeals.template[dayName] || []
      ));
    }
    mealEditorDay = keyToDayName(dateKey);
  }
  renderMealEditor();
}

function clearOverride(dateKey){
  if(!confirm('Remove override? Template meals will be used for this date.')) return;
  delete userMeals.overrides[dateKey];
  saveUserMeals();
  renderMealEditor();
  renderAll();
}

// ─── Add / Edit meal form ─────────────────────────────
function openAddMealForm(){
  editingMealId = null;
  document.getElementById('me-form-title').textContent = 'Add New Meal';
  document.getElementById('mf-name').value    = '';
  document.getElementById('mf-time').value    = '08:00';
  document.getElementById('mf-badge').value   = 'Breakfast';
  document.getElementById('mf-kcal').value    = '';
  document.getElementById('mf-protein').value = '';
  document.getElementById('mf-carbs').value   = '';
  document.getElementById('mf-fat').value     = '';
  document.getElementById('me-form-panel').classList.remove('hidden');
  document.getElementById('mf-name').focus();
}

function openEditMealForm(mealId){
  const meals = getMealList();
  const meal  = meals.find(m => m.id === mealId);
  if(!meal) return;
  editingMealId = mealId;
  document.getElementById('me-form-title').textContent = 'Edit Meal';
  document.getElementById('mf-name').value    = meal.name;
  document.getElementById('mf-time').value    = meal.time;
  document.getElementById('mf-badge').value   = meal.badge;
  document.getElementById('mf-kcal').value    = meal.kcal;
  document.getElementById('mf-protein').value = meal.protein;
  document.getElementById('mf-carbs').value   = meal.carbs;
  document.getElementById('mf-fat').value     = meal.fat;
  document.getElementById('me-form-panel').classList.remove('hidden');
  document.getElementById('mf-name').focus();
}

function closeMealForm(){
  document.getElementById('me-form-panel').classList.add('hidden');
  editingMealId = null;
}

function saveMealForm(){
  const name    = document.getElementById('mf-name').value.trim();
  const time    = document.getElementById('mf-time').value;
  const badge   = document.getElementById('mf-badge').value;
  const kcal    = parseInt(document.getElementById('mf-kcal').value)   || 0;
  const protein = parseInt(document.getElementById('mf-protein').value)|| 0;
  const carbs   = parseInt(document.getElementById('mf-carbs').value)  || 0;
  const fat     = parseInt(document.getElementById('mf-fat').value)    || 0;

  if(!name){ alert('Please enter a meal name.'); return; }
  if(!time){ alert('Please enter a time.'); return; }

  const meal = { id: editingMealId || genId(), name, time, badge, kcal, protein, carbs, fat,
                 m: { kcal, p: protein, c: carbs, f: fat } };

  const list = getMealList();

  if(editingMealId){
    const idx = list.findIndex(m => m.id === editingMealId);
    if(idx !== -1) list[idx] = meal;
  } else {
    list.push(meal);
  }

  setMealList(list);
  saveUserMeals();
  closeMealForm();
  renderMealEditor();
  renderAll();  // refresh tracker
}

function deleteMeal(mealId){
  if(!confirm('Delete this meal?')) return;
  const list = getMealList().filter(m => m.id !== mealId);
  setMealList(list);
  saveUserMeals();
  renderMealEditor();
  renderAll();
}

// ─── Get/Set the right meal list based on mode ────────
function getMealList(){
  if(mealEditorMode === 'template'){
    if(!userMeals.template[mealEditorDay]) userMeals.template[mealEditorDay] = [];
    return userMeals.template[mealEditorDay];
  } else {
    const dk = getCurrentDateKey();
    if(!userMeals.overrides[dk]) userMeals.overrides[dk] = [];
    return userMeals.overrides[dk];
  }
}

function setMealList(list){
  if(mealEditorMode === 'template'){
    userMeals.template[mealEditorDay] = list;
  } else {
    userMeals.overrides[getCurrentDateKey()] = list;
  }
}

// ─── Copy day meals ───────────────────────────────────
function showCopyDayModal(){
  const fromDay = mealEditorDay;
  const otherDays = DAYS.filter(d => d !== fromDay);
  const opts = otherDays.map(d =>
    `<button class="me-copy-day-btn" onclick="copyDayMeals('${fromDay}','${d}')">${d}</button>`
  ).join('');
  const modal = document.createElement('div');
  modal.className = 'me-copy-modal';
  modal.innerHTML = `
    <div class="me-copy-modal-inner">
      <div style="font-weight:700;margin-bottom:12px">Copy ${fromDay} meals to:</div>
      <div class="me-copy-days">${opts}</div>
      <button class="me-cancel-btn" style="margin-top:12px;width:100%" onclick="this.closest('.me-copy-modal').remove()">Cancel</button>
    </div>`;
  document.getElementById('meal-editor-overlay').appendChild(modal);
}

function copyDayMeals(fromDay, toDay){
  if(!confirm(`Copy all ${fromDay} meals to ${toDay}? This will replace ${toDay}'s meals.`)) return;
  const src = JSON.parse(JSON.stringify(userMeals.template[fromDay] || []));
  // Give new IDs to avoid duplicates
  src.forEach(m => m.id = genId());
  userMeals.template[toDay] = src;
  saveUserMeals();
  document.querySelectorAll('.me-copy-modal').forEach(m => m.remove());
  mealEditorDay = toDay;
  renderMealEditor();
  showNotice(`✅ Copied to ${toDay}!`, 'var(--teal)', '#000');
}

// ─── Drag and drop reorder ────────────────────────────
function onDragStart(e, idx){
  dragSrcIndex = idx;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.style.opacity = '0.4';
}
function onDragOver(e){
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  return false;
}
function onDrop(e, targetIdx){
  e.stopPropagation();
  if(dragSrcIndex === null || dragSrcIndex === targetIdx) return;
  const list   = getMealList();
  const sorted = [...list].sort((a,b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  const moved  = sorted.splice(dragSrcIndex, 1)[0];
  sorted.splice(targetIdx, 0, moved);
  setMealList(sorted);
  saveUserMeals();
  renderMealEditor();
  return false;
}
function onDragEnd(){ dragSrcIndex = null; renderMealEditor(); }

// ─── Helper: time string → minutes ───────────────────
function timeToMinutes(t){
  if(!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h||0)*60 + (m||0);
}

// ─── Helper: badge colors ─────────────────────────────
function getBadgeColors(badge){
  return BADGE_COLORS[badge] || BADGE_COLORS['Other'];
}

// ─── Setup page (shown to new users) ─────────────────
function showSetupPage(){
  document.getElementById('setup-overlay').classList.remove('hidden');
  document.getElementById('app-wrapper').style.display = 'none';
  renderSetupWizard();
}

function hideSetupPage(){
  document.getElementById('setup-overlay').classList.add('hidden');
  document.getElementById('app-wrapper').style.display = 'block';
}

let setupDay = 'Monday';

function renderSetupWizard(){
  const meals = userMeals.template[setupDay] || [];
  const sorted = [...meals].sort((a,b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  const dayTabs = DAYS.map(d => {
    const count = (userMeals.template[d]||[]).length;
    const done  = count > 0;
    return `<div class="setup-day-tab ${d===setupDay?'active':''} ${done?'done':''}"
      onclick="switchSetupDay('${d}')">
      <span>${d.slice(0,3)}</span>
      ${done ? `<span class="setup-day-count">${count}</span>` : ''}
    </div>`;
  }).join('');

  const mealsHtml = sorted.length === 0
    ? `<div class="me-empty">
        <div style="font-size:36px;margin-bottom:8px">🍽️</div>
        <div style="font-weight:600;margin-bottom:4px">No meals for ${setupDay} yet</div>
        <div style="font-size:12px;color:var(--muted)">Click "+ Add Meal" to build your ${setupDay} plan</div>
       </div>`
    : sorted.map(meal => `
        <div class="me-meal-card">
          <div class="me-meal-info">
            <div class="me-meal-name">${meal.name}</div>
            <div class="me-meal-meta">
              <span class="me-badge" style="background:${getBadgeColors(meal.badge).bc};color:${getBadgeColors(meal.badge).bt}">${meal.badge}</span>
              <span>🕐 ${meal.time}</span>
              <span>🔥 ${meal.kcal} kcal</span>
              <span>💪 ${meal.protein}g P</span>
            </div>
          </div>
          <div class="me-meal-actions">
            <button class="me-btn me-btn-edit" onclick="setupEditMeal('${meal.id}')">✏️</button>
            <button class="me-btn me-btn-del"  onclick="setupDeleteMeal('${meal.id}')">🗑</button>
          </div>
        </div>`).join('');

  const totalDaysSetup = DAYS.filter(d => (userMeals.template[d]||[]).length > 0).length;

  document.querySelector('.setup-inner').innerHTML = `
    <div class="setup-header">
      <div class="setup-logo">🏋️</div>
      <div class="setup-title">Build Your Meal Plan</div>
      <div class="setup-sub">Add your meals for each day. You can always edit later.</div>
      <div class="setup-progress">
        <div class="setup-progress-bar" style="width:${Math.round(totalDaysSetup/7*100)}%"></div>
      </div>
      <div class="setup-progress-label">${totalDaysSetup}/7 days set up</div>
    </div>

    <div class="setup-day-tabs">${dayTabs}</div>

    <div class="me-meals-list" id="setup-meals-list" style="max-height:320px;overflow-y:auto">
      ${mealsHtml}
    </div>

    <!-- Inline add form -->
    <div class="me-form-panel" id="setup-form-panel" style="margin-top:14px">
      <div class="me-form-title" id="setup-form-title">Add Meal for ${setupDay}</div>
      <div class="me-form-grid">
        <div class="me-form-field full">
          <label>Meal Name</label>
          <input type="text" id="sf-name" placeholder="e.g. Breakfast — eggs + oats" class="me-input"/>
        </div>
        <div class="me-form-field">
          <label>Time</label>
          <input type="time" id="sf-time" value="08:00" class="me-input"/>
        </div>
        <div class="me-form-field">
          <label>Category</label>
          <select id="sf-badge" class="me-input">
            ${BADGE_OPTIONS.map(b=>`<option value="${b}">${b}</option>`).join('')}
          </select>
        </div>
        <div class="me-form-field">
          <label>Calories</label>
          <input type="number" id="sf-kcal" placeholder="0" min="0" class="me-input"/>
        </div>
        <div class="me-form-field">
          <label>Protein (g)</label>
          <input type="number" id="sf-protein" placeholder="0" min="0" class="me-input"/>
        </div>
        <div class="me-form-field">
          <label>Carbs (g)</label>
          <input type="number" id="sf-carbs" placeholder="0" min="0" class="me-input"/>
        </div>
        <div class="me-form-field">
          <label>Fat (g)</label>
          <input type="number" id="sf-fat" placeholder="0" min="0" class="me-input"/>
        </div>
      </div>
      <div class="me-form-btns">
        <button class="me-save-btn" onclick="setupSaveMeal()">+ Add Meal</button>
      </div>
    </div>

    <div class="setup-footer">
      <button class="setup-skip-btn" onclick="finishSetup(false)">Skip — I'll set up later</button>
      <button class="setup-done-btn ${totalDaysSetup===0?'disabled':''}"
        onclick="finishSetup(true)">
        ${totalDaysSetup === 0 ? 'Add at least 1 meal to continue' : '✓ Start Tracking →'}
      </button>
    </div>
  `;
}

function switchSetupDay(day){
  setupDay = day;
  renderSetupWizard();
}

function setupSaveMeal(){
  const name    = document.getElementById('sf-name').value.trim();
  const time    = document.getElementById('sf-time').value;
  const badge   = document.getElementById('sf-badge').value;
  const kcal    = parseInt(document.getElementById('sf-kcal').value)   || 0;
  const protein = parseInt(document.getElementById('sf-protein').value)|| 0;
  const carbs   = parseInt(document.getElementById('sf-carbs').value)  || 0;
  const fat     = parseInt(document.getElementById('sf-fat').value)    || 0;

  if(!name){ alert('Please enter a meal name.'); return; }

  const meal = { id: genId(), name, time, badge, kcal, protein, carbs, fat,
                 m: { kcal, p: protein, c: carbs, f: fat } };

  if(!userMeals.template[setupDay]) userMeals.template[setupDay] = [];
  userMeals.template[setupDay].push(meal);
  saveUserMeals();
  renderSetupWizard();
  showNotice('✅ Meal added!', 'var(--teal)', '#000');
}

function setupEditMeal(mealId){
  // Open full editor for this day
  mealEditorDay  = setupDay;
  mealEditorMode = 'template';
  hideSetupPage();
  document.getElementById('app-wrapper').style.display = 'none';
  openMealEditor(setupDay, 'template');
}

function setupDeleteMeal(mealId){
  if(!confirm('Delete this meal?')) return;
  userMeals.template[setupDay] = (userMeals.template[setupDay]||[]).filter(m => m.id !== mealId);
  saveUserMeals();
  renderSetupWizard();
}

function finishSetup(save){
  if(save) saveUserMeals();
  hideSetupPage();
  renderAll();
}
