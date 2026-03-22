// ═══════════════════════════════════════════════════════
// MEALS.JS — Custom meal plan builder
// Loaded after app.js, before auth.js
// ═══════════════════════════════════════════════════════

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

// userMeals: { template: {Monday:[...], ...}, overrides: {'2026-03-22':[...], ...} }
let userMeals = { template:{}, overrides:{} };
let mealEditorDay  = 'Monday';
let mealEditorMode = 'template';
let editingMealId  = null;
let dragSrcIndex   = null;
let setupCurrentDay = 'Monday';

// ─── Helpers ──────────────────────────────────────────
function genId(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function timeToMins(t){ if(!t) return 0; const[h,m]=t.split(':').map(Number); return(h||0)*60+(m||0); }
function getBadgeColors(badge){ return BADGE_COLORS[badge]||BADGE_COLORS['Other']; }
function getCategoryIcon(badge){
  return {'Breakfast':'🍽️','Lunch':'🍛','Dinner':'🌙','Snack':'🫘',
          'Pre-workout':'⚡','Post-workout':'💪','Hydration':'💧',
          'Supplements':'💊','Other':'📋'}[badge]||'📋';
}

// ─── Get meals for a date (override → template) ───────
function getMealsForDate(dateKey){
  if(userMeals.overrides && userMeals.overrides[dateKey])
    return userMeals.overrides[dateKey];
  const dayName = keyToDayName(dateKey);
  return (userMeals.template && userMeals.template[dayName]) || [];
}

// ─── Has any meals set up? ────────────────────────────
function userHasMeals(){
  if(!userMeals.template) return false;
  return DAYS.some(d => userMeals.template[d] && userMeals.template[d].length > 0);
}

// ─── Firebase load/save ───────────────────────────────
async function loadUserMeals(){
  if(!fbDb || !currentUser) return;
  try {
    const doc = await fbDb.collection('users').doc(currentUser.uid)
                          .collection('meals').doc('plan').get();
    if(doc.exists && doc.data().plan){
      const loaded = JSON.parse(doc.data().plan);
      userMeals = {
        template:  loaded.template  || {},
        overrides: loaded.overrides || {}
      };
    } else {
      userMeals = { template:{}, overrides:{} };
    }
  } catch(e){ console.error('loadUserMeals:', e); }
}

async function saveUserMeals(){
  if(!fbDb || !currentUser) return;
  try {
    await fbDb.collection('users').doc(currentUser.uid)
              .collection('meals').doc('plan')
              .set({ plan: JSON.stringify(userMeals) });
  } catch(e){ console.error('saveUserMeals:', e); }
}

// ══════════════════════════════════════════════════════
// SETUP WIZARD — shown to new users
// ══════════════════════════════════════════════════════
function showSetupPage(){
  document.getElementById('setup-overlay').classList.remove('hidden');
  document.getElementById('app-wrapper').style.display = 'none';
  setupCurrentDay = 'Monday';
  renderSetupWizard();
}

function hideSetupPage(){
  document.getElementById('setup-overlay').classList.add('hidden');
}

function renderSetupWizard(){
  const meals  = (userMeals.template[setupCurrentDay]||[])
                  .slice().sort((a,b)=>timeToMins(a.time)-timeToMins(b.time));
  const totalSetup = DAYS.filter(d=>(userMeals.template[d]||[]).length>0).length;

  const dayTabs = DAYS.map(d => {
    const count = (userMeals.template[d]||[]).length;
    return `<div class="setup-day-tab ${d===setupCurrentDay?'active':''} ${count>0?'done':''}"
      onclick="setupCurrentDay='${d}';renderSetupWizard()">
      ${d.slice(0,3)} ${count>0?`<span class="setup-day-count">${count}</span>`:''}
    </div>`;
  }).join('');

  const mealsHtml = meals.length === 0
    ? `<div class="me-empty" style="padding:20px 0">
        <div style="font-size:32px">🍽️</div>
        <div style="font-weight:600;margin:8px 0 4px">No meals for ${setupCurrentDay}</div>
        <div style="font-size:12px;color:var(--muted)">Fill the form below and click Add</div>
       </div>`
    : meals.map(m=>`
        <div class="me-meal-card" style="margin-bottom:6px">
          <div class="me-meal-info">
            <div class="me-meal-name">${m.name}</div>
            <div class="me-meal-meta">
              <span class="me-badge" style="background:${getBadgeColors(m.badge).bc};color:${getBadgeColors(m.badge).bt}">${m.badge}</span>
              <span>🕐 ${m.time}</span>
              <span>🔥 ${m.kcal} kcal</span>
              <span>💪 ${m.protein}g P</span>
              <span>🍚 ${m.carbs}g C</span>
              <span>🥑 ${m.fat}g F</span>
            </div>
          </div>
          <div class="me-meal-actions">
            <button class="me-btn me-btn-del" onclick="setupDeleteMeal('${m.id}')">🗑</button>
          </div>
        </div>`).join('');

  const canFinish = totalSetup > 0;

  document.querySelector('.setup-inner').innerHTML = `
    <div class="setup-header">
      <div class="setup-logo">🏋️</div>
      <div class="setup-title">Build Your Meal Plan</div>
      <div class="setup-sub">Add your meals for each day. This repeats every week automatically.</div>
      <div class="setup-progress">
        <div class="setup-progress-bar" style="width:${Math.round(totalSetup/7*100)}%"></div>
      </div>
      <div class="setup-progress-label">${totalSetup}/7 days set up</div>
    </div>

    <div class="setup-day-tabs">${dayTabs}</div>

    <div style="max-height:220px;overflow-y:auto;margin-bottom:12px">${mealsHtml}</div>

    <div class="me-form-panel" id="setup-form">
      <div class="me-form-title">Add meal for ${setupCurrentDay}</div>
      <div class="me-form-grid">
        <div class="me-form-field full">
          <label>Meal Name *</label>
          <input class="me-input" type="text" id="sf-name" placeholder="e.g. Oats + banana + 2 eggs"/>
        </div>
        <div class="me-form-field">
          <label>Time *</label>
          <input class="me-input" type="time" id="sf-time" value="08:00"/>
        </div>
        <div class="me-form-field">
          <label>Category</label>
          <select class="me-input" id="sf-badge">
            ${BADGE_OPTIONS.map(b=>`<option>${b}</option>`).join('')}
          </select>
        </div>
        <div class="me-form-field">
          <label>Calories (kcal)</label>
          <input class="me-input" type="number" id="sf-kcal" placeholder="0" min="0"/>
        </div>
        <div class="me-form-field">
          <label>Protein (g)</label>
          <input class="me-input" type="number" id="sf-protein" placeholder="0" min="0"/>
        </div>
        <div class="me-form-field">
          <label>Carbs (g)</label>
          <input class="me-input" type="number" id="sf-carbs" placeholder="0" min="0"/>
        </div>
        <div class="me-form-field">
          <label>Fat (g)</label>
          <input class="me-input" type="number" id="sf-fat" placeholder="0" min="0"/>
        </div>
      </div>
      <button class="me-save-btn" onclick="setupAddMeal()" style="width:100%">+ Add Meal</button>
    </div>

    <div class="setup-footer">
      <button class="setup-skip-btn" onclick="finishSetup()">Skip — set up later</button>
      <button class="setup-done-btn ${canFinish?'':'disabled'}"
        onclick="${canFinish?'finishSetup(true)':'void(0)'}">
        ${canFinish ? '✓ Start Tracking →' : 'Add at least 1 meal'}
      </button>
    </div>
  `;
}

function setupAddMeal(){
  const name    = document.getElementById('sf-name').value.trim();
  const time    = document.getElementById('sf-time').value;
  const badge   = document.getElementById('sf-badge').value;
  const kcal    = parseInt(document.getElementById('sf-kcal').value)||0;
  const protein = parseInt(document.getElementById('sf-protein').value)||0;
  const carbs   = parseInt(document.getElementById('sf-carbs').value)||0;
  const fat     = parseInt(document.getElementById('sf-fat').value)||0;
  if(!name){ alert('Please enter a meal name.'); return; }
  if(!userMeals.template[setupCurrentDay]) userMeals.template[setupCurrentDay]=[];
  userMeals.template[setupCurrentDay].push(
    {id:genId(), name, time, badge, kcal, protein, carbs, fat, m:{kcal,p:protein,c:carbs,f:fat}}
  );
  saveUserMeals();
  renderSetupWizard();
  if(typeof showNotice==='function') showNotice('✅ Meal added!','var(--teal)','#000');
}

function setupDeleteMeal(mealId){
  if(!confirm('Remove this meal?')) return;
  userMeals.template[setupCurrentDay] =
    (userMeals.template[setupCurrentDay]||[]).filter(m=>m.id!==mealId);
  saveUserMeals();
  renderSetupWizard();
}

async function finishSetup(save){
  if(save) await saveUserMeals();
  hideSetupPage();
  if(typeof showAppPage==='function') showAppPage();
  if(typeof startRealtimeSync==='function') startRealtimeSync();
  if(typeof renderAll==='function') renderAll();
}

// ══════════════════════════════════════════════════════
// MEAL EDITOR — opened from FAB or empty state button
// ══════════════════════════════════════════════════════
function openMealEditor(day, mode){
  mealEditorDay  = day || keyToDayName(getSelKey());
  mealEditorMode = mode || 'template';
  renderMealEditor();
  document.getElementById('meal-editor-overlay').classList.remove('hidden');
}

function closeMealEditor(){
  document.getElementById('meal-editor-overlay').classList.add('hidden');
  editingMealId = null;
  if(typeof renderAll==='function') renderAll();
}

function renderMealEditor(){
  const list   = getMealList();
  const sorted = list.slice().sort((a,b)=>timeToMins(a.time)-timeToMins(b.time));
  const dk     = getSelKey();

  const dayTabs = DAYS.map(d=>`
    <div class="me-day-tab ${d===mealEditorDay?'active':''}" onclick="mealEditorDay='${d}';renderMealEditor()">
      ${d.slice(0,3)}
    </div>`).join('');

  const mealsHtml = sorted.length===0
    ? `<div class="me-empty"><div style="font-size:32px">🍽️</div><div>No meals yet — add below</div></div>`
    : sorted.map((m,i)=>`
        <div class="me-meal-card" draggable="true"
          ondragstart="onDragStart(event,${i})"
          ondragover="onDragOver(event)"
          ondrop="onDrop(event,${i})"
          ondragend="onDragEnd()">
          <div class="me-drag-handle">⠿</div>
          <div class="me-meal-info">
            <div class="me-meal-name">${m.name}</div>
            <div class="me-meal-meta">
              <span class="me-badge" style="background:${getBadgeColors(m.badge).bc};color:${getBadgeColors(m.badge).bt}">${m.badge}</span>
              <span>🕐 ${m.time}</span>
              <span>🔥 ${m.kcal} kcal</span>
              <span>💪 ${m.protein}g P</span>
            </div>
          </div>
          <div class="me-meal-actions">
            <button class="me-btn me-btn-edit" onclick="openEditForm('${m.id}')">✏️</button>
            <button class="me-btn me-btn-del"  onclick="deleteMeal('${m.id}')">🗑</button>
          </div>
        </div>`).join('');

  const hasOverride = userMeals.overrides && userMeals.overrides[dk];

  document.querySelector('.meal-editor-inner').innerHTML = `
    <div class="me-header">
      <div>
        <div class="me-title">✏️ Edit Meal Plan</div>
        <div class="me-subtitle">${mealEditorMode==='template'?'Weekly template — repeats every week':'Override for today only'}</div>
      </div>
      <button class="me-close" onclick="closeMealEditor()">✕</button>
    </div>

    <div class="me-mode-tabs">
      <button class="me-mode-tab ${mealEditorMode==='template'?'active':''}"
        onclick="mealEditorMode='template';renderMealEditor()">📅 Weekly Template</button>
      <button class="me-mode-tab ${mealEditorMode==='override'?'active':''}"
        onclick="switchToOverride()">📌 Override Today</button>
    </div>

    <div class="me-day-tabs">${dayTabs}</div>

    ${hasOverride && mealEditorMode==='override' ? `
      <div class="me-override-banner">
        📅 Today has custom meals (overrides template)
        <button onclick="clearOverride('${dk}')">Use template instead</button>
      </div>` : ''}

    <div id="me-list" style="max-height:260px;overflow-y:auto;margin-bottom:12px">${mealsHtml}</div>

    <div style="display:flex;gap:8px;margin-bottom:12px">
      ${mealEditorMode==='template' ? `<button class="me-copy-btn" onclick="showCopyModal()">📋 Copy day</button>` : ''}
      <button class="me-add-btn" onclick="openAddForm()">+ Add Meal</button>
    </div>

    <div class="me-form-panel hidden" id="me-form">
      <div class="me-form-title" id="me-form-title">Add Meal</div>
      <div class="me-form-grid">
        <div class="me-form-field full">
          <label>Meal Name *</label>
          <input class="me-input" type="text" id="mf-name" placeholder="e.g. Lunch — rice + chicken"/>
        </div>
        <div class="me-form-field">
          <label>Time *</label>
          <input class="me-input" type="time" id="mf-time" value="08:00"/>
        </div>
        <div class="me-form-field">
          <label>Category</label>
          <select class="me-input" id="mf-badge">
            ${BADGE_OPTIONS.map(b=>`<option>${b}</option>`).join('')}
          </select>
        </div>
        <div class="me-form-field">
          <label>Calories</label>
          <input class="me-input" type="number" id="mf-kcal" placeholder="0" min="0"/>
        </div>
        <div class="me-form-field">
          <label>Protein (g)</label>
          <input class="me-input" type="number" id="mf-protein" placeholder="0" min="0"/>
        </div>
        <div class="me-form-field">
          <label>Carbs (g)</label>
          <input class="me-input" type="number" id="mf-carbs" placeholder="0" min="0"/>
        </div>
        <div class="me-form-field">
          <label>Fat (g)</label>
          <input class="me-input" type="number" id="mf-fat" placeholder="0" min="0"/>
        </div>
      </div>
      <div class="me-form-btns">
        <button class="me-save-btn"   onclick="saveMealForm()">Save</button>
        <button class="me-cancel-btn" onclick="document.getElementById('me-form').classList.add('hidden')">Cancel</button>
      </div>
    </div>
  `;
}

function switchToOverride(){
  mealEditorMode = 'override';
  const dk = getSelKey();
  if(!userMeals.overrides[dk]){
    const dayName = keyToDayName(dk);
    userMeals.overrides[dk] = JSON.parse(JSON.stringify(userMeals.template[dayName]||[]));
  }
  mealEditorDay = keyToDayName(dk);
  renderMealEditor();
}

function clearOverride(dk){
  if(!confirm('Remove override? Template meals will be used for this date.')) return;
  delete userMeals.overrides[dk];
  saveUserMeals();
  renderMealEditor();
}

// ─── Add/Edit form ────────────────────────────────────
function openAddForm(){
  editingMealId = null;
  document.getElementById('me-form-title').textContent = 'Add Meal';
  ['mf-name','mf-kcal','mf-protein','mf-carbs','mf-fat'].forEach(id => document.getElementById(id).value='');
  document.getElementById('mf-time').value  = '08:00';
  document.getElementById('mf-badge').value = 'Breakfast';
  document.getElementById('me-form').classList.remove('hidden');
  document.getElementById('mf-name').focus();
}

function openEditForm(mealId){
  const meal = getMealList().find(m=>m.id===mealId);
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
  document.getElementById('me-form').classList.remove('hidden');
  document.getElementById('mf-name').focus();
}

function saveMealForm(){
  const name    = document.getElementById('mf-name').value.trim();
  const time    = document.getElementById('mf-time').value;
  const badge   = document.getElementById('mf-badge').value;
  const kcal    = parseInt(document.getElementById('mf-kcal').value)||0;
  const protein = parseInt(document.getElementById('mf-protein').value)||0;
  const carbs   = parseInt(document.getElementById('mf-carbs').value)||0;
  const fat     = parseInt(document.getElementById('mf-fat').value)||0;
  if(!name){ alert('Please enter a meal name.'); return; }
  const meal = {id:editingMealId||genId(), name, time, badge, kcal, protein, carbs, fat,
                m:{kcal, p:protein, c:carbs, f:fat}};
  const list = getMealList();
  if(editingMealId){ const i=list.findIndex(m=>m.id===editingMealId); if(i!==-1) list[i]=meal; }
  else list.push(meal);
  setMealList(list);
  saveUserMeals();
  renderMealEditor();
  if(typeof showNotice==='function') showNotice('✅ Saved!','var(--teal)','#000');
}

function deleteMeal(mealId){
  if(!confirm('Delete this meal?')) return;
  setMealList(getMealList().filter(m=>m.id!==mealId));
  saveUserMeals();
  renderMealEditor();
}

// ─── Get/set current meal list ────────────────────────
function getMealList(){
  if(mealEditorMode==='template'){
    if(!userMeals.template[mealEditorDay]) userMeals.template[mealEditorDay]=[];
    return userMeals.template[mealEditorDay];
  } else {
    const dk = getSelKey();
    if(!userMeals.overrides[dk]) userMeals.overrides[dk]=[];
    return userMeals.overrides[dk];
  }
}
function setMealList(list){
  if(mealEditorMode==='template') userMeals.template[mealEditorDay]=list;
  else userMeals.overrides[getSelKey()]=list;
}

// ─── Copy day ─────────────────────────────────────────
function showCopyModal(){
  const from = mealEditorDay;
  const overlay = document.getElementById('meal-editor-overlay');
  const modal = document.createElement('div');
  modal.className = 'me-copy-modal';
  modal.innerHTML = `
    <div class="me-copy-modal-inner">
      <div style="font-weight:700;margin-bottom:12px;font-size:14px">Copy ${from}'s meals to:</div>
      <div class="me-copy-days">
        ${DAYS.filter(d=>d!==from).map(d=>`
          <button class="me-copy-day-btn" onclick="copyDay('${from}','${d}',this.closest('.me-copy-modal'))">${d}</button>
        `).join('')}
      </div>
      <button class="me-cancel-btn" style="margin-top:12px;width:100%" onclick="this.closest('.me-copy-modal').remove()">Cancel</button>
    </div>`;
  overlay.appendChild(modal);
}

function copyDay(from, to, modalEl){
  if(!confirm(`Copy all ${from} meals to ${to}? This replaces ${to}'s current meals.`)) return;
  const src = JSON.parse(JSON.stringify(userMeals.template[from]||[]));
  src.forEach(m=>m.id=genId());
  userMeals.template[to]=src;
  saveUserMeals();
  if(modalEl) modalEl.remove();
  mealEditorDay = to;
  renderMealEditor();
  if(typeof showNotice==='function') showNotice(`✅ Copied to ${to}!`,'var(--teal)','#000');
}

// ─── Drag & drop reorder ──────────────────────────────
function onDragStart(e,i){ dragSrcIndex=i; e.dataTransfer.effectAllowed='move'; e.currentTarget.style.opacity='0.4'; }
function onDragOver(e){ e.preventDefault(); return false; }
function onDrop(e,targetIdx){
  e.stopPropagation();
  if(dragSrcIndex===null||dragSrcIndex===targetIdx) return false;
  const list = getMealList().slice().sort((a,b)=>timeToMins(a.time)-timeToMins(b.time));
  const moved = list.splice(dragSrcIndex,1)[0];
  list.splice(targetIdx,0,moved);
  setMealList(list);
  saveUserMeals();
  renderMealEditor();
  return false;
}
function onDragEnd(){ dragSrcIndex=null; }

// ─── Copy modal ───────────────────────────────────────
// (defined inline above in showCopyModal)
