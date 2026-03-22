// ─── Data ─────────────────────────────────────────────────────────────────────
const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_COLORS={Monday:'#00d4a0',Tuesday:'#4d9fff',Wednesday:'#a78bfa',Thursday:'#fbbf24',Friday:'#4ade80',Saturday:'#4d9fff',Sunday:'#9ca3af'};
const DAY_TRAINING={Monday:'Upper body strength',Tuesday:'Lower body strength',Wednesday:'Push day — chest · shoulders · triceps',Thursday:'Pull day + treadmill HIIT',Friday:'Full body strength + core',Saturday:'Outdoor interval run (no gym)',Sunday:'Full rest day'};
// Dynamic targets — sum of all meals in user's plan for that day
function getDayTargets(dateKey){
  const tasks = getDynamicTasks(dateKey);
  const totals = tasks.reduce((acc,t) => ({
    kcal: acc.kcal + t.m.kcal,
    p:    acc.p    + t.m.p,
    c:    acc.c    + t.m.c,
    f:    acc.f    + t.m.f,
  }), {kcal:0,p:0,c:0,f:0});
  // fallback minimums so bars don't break on empty days
  return {
    kcal: totals.kcal || 2000,
    p:    totals.p    || 120,
    c:    totals.c    || 200,
    f:    totals.f    || 65,
  };
}

const MEALS={
  Monday:{tasks:[
    {id:'mon_water', s:'🌅 Morning',   name:'500ml water on waking',                                       meta:'6:15am',           badge:'Hydration',    bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:0,p:0,c:0,f:0}},
    {id:'mon_seeds', s:'🌅 Morning',   name:'Nuts + seed mix (4 almonds, 4 cashews, 1 tsp each: pumpkin, chia, flax, sunflower)', meta:'6:20am · 130 kcal', badge:'Micronutrients',bc:'#00d4a022',bt:'#00d4a0',m:{kcal:130,p:4,c:7,f:5}},
    {id:'mon_banana',s:'🌅 Morning',   name:'Pre-workout banana',                                          meta:'6:50am · 105 kcal',badge:'Pre-workout',  bc:'#fbbf2422',bt:'#fbbf24',m:{kcal:105,p:1,c:27,f:0}},
    {id:'mon_gym',   s:'🏋️ Gym',       name:'Gym — Upper body (bench press, BB row, OHP, pull-ups, core)',meta:'7:30am · 60-75 min',badge:'Training',    bc:'#f8717122',bt:'#f87171',m:{kcal:0,p:0,c:0,f:0}},
    {id:'mon_post',  s:'🏋️ Gym',       name:'2 boiled eggs post-workout (within 15 min)',                 meta:'8:45am · 140 kcal',badge:'Post-workout', bc:'#00d4a022',bt:'#00d4a0',m:{kcal:140,p:12,c:1,f:10}},
    {id:'mon_bf',    s:'🍽️ Breakfast', name:'2 wheat bread + 1 tbsp peanut butter + 2 boiled eggs',       meta:'9:15am · 255 kcal (bread+PB)',badge:'Breakfast',   bc:'#a78bfa22',bt:'#a78bfa',m:{kcal:255,p:10,c:29,f:6}},
    {id:'mon_lunch', s:'🍛 Lunch',     name:'Lemon/tomato rice + buttermilk + 125g grilled chicken',      meta:'12:30pm · 465 kcal',badge:'Lunch',       bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:465,p:45,c:56,f:10}},
    {id:'mon_snack', s:'🫘 Snack',     name:'Sprouted black chana salad (75g) + tea half sugar',          meta:'4:30pm · 165 kcal',badge:'Snack',        bc:'#4ade8022',bt:'#4ade80',m:{kcal:165,p:8,c:22,f:2}},
    {id:'mon_dinner',s:'🌙 Dinner',    name:'4 palm rotis + 100g dal + 3 boiled eggs + raw salad',        meta:'8:00pm · 730 kcal',badge:'Dinner',       bc:'#f472b622',bt:'#f472b6',m:{kcal:730,p:38,c:102,f:18}},
    {id:'mon_h2o',   s:'💧 Hydration', name:'3-4 litres water total today',                               meta:'All day',          badge:'Water',        bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:0,p:0,c:0,f:0}},
  ]},
  Tuesday:{tasks:[
    {id:'tue_water', s:'🌅 Morning',   name:'500ml water on waking',                                       meta:'6:15am',           badge:'Hydration',    bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:0,p:0,c:0,f:0}},
    {id:'tue_seeds', s:'🌅 Morning',   name:'Nuts + seed mix',                                             meta:'6:20am · 130 kcal',badge:'Micronutrients',bc:'#00d4a022',bt:'#00d4a0',m:{kcal:130,p:4,c:7,f:5}},
    {id:'tue_banana',s:'🌅 Morning',   name:'Pre-workout banana',                                          meta:'6:50am · 105 kcal',badge:'Pre-workout',  bc:'#fbbf2422',bt:'#fbbf24',m:{kcal:105,p:1,c:27,f:0}},
    {id:'tue_gym',   s:'🏋️ Gym',       name:'Gym — Lower body (squat, RDL, leg press, lunges)',            meta:'7:30am · 60-75 min',badge:'Training',    bc:'#f8717122',bt:'#f87171',m:{kcal:0,p:0,c:0,f:0}},
    {id:'tue_post',  s:'🏋️ Gym',       name:'2 boiled eggs post-workout',                                  meta:'8:45am · 140 kcal',badge:'Post-workout', bc:'#00d4a022',bt:'#00d4a0',m:{kcal:140,p:12,c:1,f:10}},
    {id:'tue_bf',    s:'🍽️ Breakfast', name:'2 plain dosa + gongura coconut chutney + 2 boiled eggs',      meta:'9:15am · 285 kcal (dosa+chutney)',badge:'Breakfast',   bc:'#a78bfa22',bt:'#a78bfa',m:{kcal:285,p:6,c:42,f:3}},
    {id:'tue_lunch', s:'🍛 Lunch',     name:'200g rice + 80g curd + masala egg (2 eggs) + 100g chicken',  meta:'12:30pm · 658 kcal',badge:'Lunch',       bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:658,p:52,c:62,f:18}},
    {id:'tue_snack', s:'🫖 Snack',     name:'Tea (half sugar) + sabja seed water',                        meta:'4:30pm · 75 kcal', badge:'Snack+Fibre',  bc:'#4ade8022',bt:'#4ade80',m:{kcal:75,p:1,c:11,f:0}},
    {id:'tue_dinner',s:'🌙 Dinner',    name:'3 palm rotis + 100g dal + 2 boiled eggs + raw salad',        meta:'8:00pm · 545 kcal',badge:'Dinner',       bc:'#f472b622',bt:'#f472b6',m:{kcal:545,p:29,c:75,f:13}},
    {id:'tue_h2o',   s:'💧 Hydration', name:'3-4 litres water total today',                               meta:'All day',          badge:'Water',        bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:0,p:0,c:0,f:0}},
  ]},
  Wednesday:{tasks:[
    {id:'wed_water', s:'🌅 Morning',   name:'500ml water on waking',                                       meta:'6:15am',           badge:'Hydration',    bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:0,p:0,c:0,f:0}},
    {id:'wed_seeds', s:'🌅 Morning',   name:'Nuts + seed mix',                                             meta:'6:20am · 130 kcal',badge:'Micronutrients',bc:'#00d4a022',bt:'#00d4a0',m:{kcal:130,p:4,c:7,f:5}},
    {id:'wed_banana',s:'🌅 Morning',   name:'Pre-workout banana',                                          meta:'6:50am · 105 kcal',badge:'Pre-workout',  bc:'#fbbf2422',bt:'#fbbf24',m:{kcal:105,p:1,c:27,f:0}},
    {id:'wed_gym',   s:'🏋️ Gym',       name:'Gym — Push day (incline press, Arnold press, lateral raise)', meta:'7:30am · 60-75 min',badge:'Training',    bc:'#f8717122',bt:'#f87171',m:{kcal:0,p:0,c:0,f:0}},
    {id:'wed_post',  s:'🏋️ Gym',       name:'2 boiled eggs post-workout',                                  meta:'8:45am · 140 kcal',badge:'Post-workout', bc:'#00d4a022',bt:'#00d4a0',m:{kcal:140,p:12,c:1,f:10}},
    {id:'wed_bf',    s:'🍽️ Breakfast', name:'3 chapati + black chana curry (100g) + 2 boiled eggs',        meta:'9:15am · 430 kcal (chapati+chana)',badge:'Breakfast',   bc:'#a78bfa22',bt:'#a78bfa',m:{kcal:430,p:18,c:89,f:9}},
    {id:'wed_lunch', s:'🍛 Lunch',     name:'2 chapati + masala omelette (2 eggs) + 100g chicken',         meta:'12:30pm · 585 kcal',badge:'Lunch',       bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:585,p:51,c:50,f:17}},
    {id:'wed_snack', s:'🫘 Snack',     name:'Sprouted black chana salad (75g) + tea half sugar',          meta:'4:30pm · 165 kcal',badge:'Snack',        bc:'#4ade8022',bt:'#4ade80',m:{kcal:165,p:8,c:22,f:2}},
    {id:'wed_dinner',s:'🌙 Dinner',    name:'3 palm rotis + 100g dal + 1 boiled egg + raw salad',         meta:'8:00pm · 490 kcal',badge:'Dinner',       bc:'#f472b622',bt:'#f472b6',m:{kcal:490,p:22,c:72,f:10}},
    {id:'wed_h2o',   s:'💧 Hydration', name:'3-4 litres water total today',                               meta:'All day',          badge:'Water',        bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:0,p:0,c:0,f:0}},
  ]},
  Thursday:{tasks:[
    {id:'thu_water', s:'🌅 Morning',   name:'500ml water on waking',                                       meta:'6:15am',           badge:'Hydration',    bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:0,p:0,c:0,f:0}},
    {id:'thu_seeds', s:'🌅 Morning',   name:'Nuts + seed mix',                                             meta:'6:20am · 130 kcal',badge:'Micronutrients',bc:'#00d4a022',bt:'#00d4a0',m:{kcal:130,p:4,c:7,f:5}},
    {id:'thu_banana',s:'🌅 Morning',   name:'Pre-workout banana',                                          meta:'6:50am · 105 kcal',badge:'Pre-workout',  bc:'#fbbf2422',bt:'#fbbf24',m:{kcal:105,p:1,c:27,f:0}},
    {id:'thu_gym',   s:'🏋️ Gym',       name:'Gym — Pull day + HIIT (deadlift, cable row, face pull)',      meta:'7:30am · 60-75 min',badge:'Training',    bc:'#f8717122',bt:'#f87171',m:{kcal:0,p:0,c:0,f:0}},
    {id:'thu_post',  s:'🏋️ Gym',       name:'2 boiled eggs post-workout',                                  meta:'8:45am · 140 kcal',badge:'Post-workout', bc:'#00d4a022',bt:'#00d4a0',m:{kcal:140,p:12,c:1,f:10}},
    {id:'thu_bf',    s:'🍽️ Breakfast', name:'2 wheat bread + 1 tbsp peanut butter + 2 boiled eggs',       meta:'9:15am · 255 kcal (bread+PB)',badge:'Breakfast',   bc:'#a78bfa22',bt:'#a78bfa',m:{kcal:255,p:10,c:29,f:6}},
    {id:'thu_lunch', s:'🍛 Lunch',     name:'Tomato/pudina rice + 125g grilled chicken',                   meta:'12:30pm · 455 kcal',badge:'Lunch',       bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:455,p:44,c:58,f:10}},
    {id:'thu_snack', s:'🫘 Snack',     name:'Sprouted black chana salad (75g) + tea half sugar',          meta:'4:30pm · 165 kcal',badge:'Snack',        bc:'#4ade8022',bt:'#4ade80',m:{kcal:165,p:8,c:22,f:2}},
    {id:'thu_dinner',s:'🌙 Dinner',    name:'4 palm rotis + 100g dal + 2 boiled eggs',                    meta:'8:00pm · 710 kcal',badge:'Dinner',       bc:'#f472b622',bt:'#f472b6',m:{kcal:710,p:32,c:102,f:16}},
    {id:'thu_h2o',   s:'💧 Hydration', name:'3-4 litres water total today',                               meta:'All day',          badge:'Water',        bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:0,p:0,c:0,f:0}},
  ]},
  Friday:{tasks:[
    {id:'fri_water', s:'🌅 Morning',   name:'500ml water on waking',                                       meta:'6:15am',           badge:'Hydration',    bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:0,p:0,c:0,f:0}},
    {id:'fri_seeds', s:'🌅 Morning',   name:'Nuts + seed mix',                                             meta:'6:20am · 130 kcal',badge:'Micronutrients',bc:'#00d4a022',bt:'#00d4a0',m:{kcal:130,p:4,c:7,f:5}},
    {id:'fri_banana',s:'🌅 Morning',   name:'Pre-workout banana',                                          meta:'6:50am · 105 kcal',badge:'Pre-workout',  bc:'#fbbf2422',bt:'#fbbf24',m:{kcal:105,p:1,c:27,f:0}},
    {id:'fri_gym',   s:'🏋️ Gym',       name:'Gym — Full body + core circuit',                              meta:'7:30am · 60-75 min',badge:'Training',    bc:'#f8717122',bt:'#f87171',m:{kcal:0,p:0,c:0,f:0}},
    {id:'fri_post',  s:'🏋️ Gym',       name:'2 boiled eggs post-workout',                                  meta:'8:45am · 140 kcal',badge:'Post-workout', bc:'#00d4a022',bt:'#00d4a0',m:{kcal:140,p:12,c:1,f:10}},
    {id:'fri_bf',    s:'🍽️ Breakfast', name:'2 wheat bread + 1 tbsp peanut butter + 2 boiled eggs',       meta:'9:15am · 255 kcal (bread+PB)',badge:'Breakfast',   bc:'#a78bfa22',bt:'#a78bfa',m:{kcal:255,p:10,c:29,f:6}},
    {id:'fri_lunch', s:'🍛 Lunch',     name:'200g rice + 80g curd + masala egg (2 eggs) + 100g chicken',  meta:'12:30pm · 658 kcal',badge:'Lunch',       bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:658,p:52,c:62,f:18}},
    {id:'fri_snack', s:'🫖 Snack',     name:'Tea (half sugar) + sabja seed water',                        meta:'4:30pm · 75 kcal', badge:'Snack+Fibre',  bc:'#4ade8022',bt:'#4ade80',m:{kcal:75,p:1,c:11,f:0}},
    {id:'fri_dinner',s:'🌙 Dinner',    name:'3 palm rotis + 100g dal + 2 boiled eggs + raw salad',        meta:'8:00pm · 545 kcal',badge:'Dinner',       bc:'#f472b622',bt:'#f472b6',m:{kcal:545,p:29,c:75,f:13}},
    {id:'fri_h2o',   s:'💧 Hydration', name:'3-4 litres water total today',                               meta:'All day',          badge:'Water',        bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:0,p:0,c:0,f:0}},
  ]},
  Saturday:{tasks:[
    {id:'sat_water', s:'🌅 Morning',   name:'500ml water on waking',                                       meta:'6:15am',           badge:'Hydration',    bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:0,p:0,c:0,f:0}},
    {id:'sat_seeds', s:'🌅 Morning',   name:'Nuts + seed mix',                                             meta:'6:20am · 130 kcal',badge:'Micronutrients',bc:'#00d4a022',bt:'#00d4a0',m:{kcal:130,p:4,c:7,f:5}},
    {id:'sat_banana',s:'🌅 Morning',   name:'Pre-run banana',                                              meta:'6:50am · 105 kcal',badge:'Pre-run',      bc:'#fbbf2422',bt:'#fbbf24',m:{kcal:105,p:1,c:27,f:0}},
    {id:'sat_run',   s:'🏃 Run',       name:'Outdoor interval run — 400m x4 OR 1 min on/off x8',          meta:'7:15am · 30-40 min',badge:'Cardio',      bc:'#f8717122',bt:'#f87171',m:{kcal:0,p:0,c:0,f:0}},
    {id:'sat_post',  s:'🏃 Run',       name:'2 boiled eggs post-run (within 15 min)',                      meta:'8:30am · 140 kcal',badge:'Post-run',     bc:'#00d4a022',bt:'#00d4a0',m:{kcal:140,p:12,c:1,f:10}},
    {id:'sat_bf',    s:'🍽️ Breakfast', name:'1 masala dosa + 1 boiled egg (chutney 2-3 tbsp max)',         meta:'9:00am · 350 kcal',badge:'Breakfast',   bc:'#a78bfa22',bt:'#a78bfa',m:{kcal:350,p:12,c:50,f:14}},
    {id:'sat_lunch', s:'🍛 Lunch',     name:'200g rice + sambar (150ml) + 200g grilled chicken',          meta:'12:30pm · 670 kcal',badge:'Best meal',   bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:670,p:71,c:64,f:8}},
    {id:'sat_snack', s:'🫖 Snack',     name:'Tea (half sugar) + sabja seed water',                        meta:'4:30pm · 75 kcal', badge:'Snack+Fibre',  bc:'#4ade8022',bt:'#4ade80',m:{kcal:75,p:1,c:11,f:0}},
    {id:'sat_dinner',s:'🌙 Dinner',    name:'2 boiled eggs + 80g curd + onion+tomato+cucumber salad bowl',meta:'8:00pm · 243 kcal',badge:'Light dinner', bc:'#f472b622',bt:'#f472b6',m:{kcal:243,p:16,c:14,f:11}},
    {id:'sat_h2o',   s:'💧 Hydration', name:'3-4 litres water total today',                               meta:'All day',          badge:'Water',        bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:0,p:0,c:0,f:0}},
  ]},
  Sunday:{tasks:[
    {id:'sun_water', s:'🌅 Morning',   name:'500ml water on waking',                                       meta:'6:15am',           badge:'Hydration',    bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:0,p:0,c:0,f:0}},
    {id:'sun_seeds', s:'🌅 Morning',   name:'Nuts + seed mix (NO banana today — rest day)',                 meta:'6:20am · 130 kcal',badge:'Micronutrients',bc:'#00d4a022',bt:'#00d4a0',m:{kcal:130,p:4,c:7,f:5}},
    {id:'sun_rest',  s:'😴 Rest',      name:'Full rest — no gym, no run. Sleep extra if possible',         meta:'All day',          badge:'Recovery',     bc:'#9ca3af22',bt:'#9ca3af',m:{kcal:0,p:0,c:0,f:0}},
    {id:'sun_bf',    s:'🍽️ Breakfast', name:'3 boiled eggs + 80g curd',                                    meta:'9:00am · 268 kcal',badge:'Breakfast',   bc:'#a78bfa22',bt:'#a78bfa',m:{kcal:268,p:24,c:8,f:22}},
    {id:'sun_lunch', s:'🍛 Lunch',     name:'1 plate chicken biryani (PG) + 1 boiled egg',                 meta:'12:30pm · 550 kcal',badge:'Treat meal',  bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:550,p:36,c:63,f:19}},
    {id:'sun_snack', s:'🫖 Snack',     name:'Tea only (half sugar)',                                       meta:'4:30pm · 35 kcal', badge:'Light',        bc:'#9ca3af22',bt:'#9ca3af',m:{kcal:35,p:0,c:4,f:0}},
    {id:'sun_pre',   s:'🌙 Dinner',    name:'3 boiled eggs from PG BEFORE going to hotel',                 meta:'7:30pm · 210 kcal',badge:'Pre-hotel',    bc:'#fbbf2422',bt:'#fbbf24',m:{kcal:210,p:18,c:1,f:15}},
    {id:'sun_dinner',s:'🌙 Dinner',    name:'Hotel: chicken curry + 2 rotis (dry/semi-dry)',               meta:'8:30pm · 420 kcal',badge:'Hotel dinner', bc:'#f472b622',bt:'#f472b6',m:{kcal:420,p:28,c:38,f:16}},
    {id:'sun_h2o',   s:'💧 Hydration', name:'3-4 litres water total today',                               meta:'All day',          badge:'Water',        bc:'#4d9fff22',bt:'#4d9fff',m:{kcal:0,p:0,c:0,f:0}},
  ]},
};

const MOTIVES=[
  {at:0,  icon:'🌅',title:"Rise and grind!",       sub:"Every champion starts with one step!"},
  {at:10, icon:'⚡',title:"You've started!",        sub:"Momentum is building. Keep crushing it!"},
  {at:25, icon:'🔥',title:"On fire! 25% done",      sub:"Your future six-pack is thanking you."},
  {at:50, icon:'💪',title:"Halfway there!",         sub:"This is where average people stop. You're not average."},
  {at:75, icon:'🚀',title:"75% — almost there!",    sub:"Elite athletes don't quit now. Finish strong!"},
  {at:90, icon:'🏆',title:"Almost there!",          sub:"Final stretch. Close it out like a champion!"},
  {at:100,icon:'🎉',title:"PERFECT DAY!",           sub:"100% complete! You're becoming the hybrid athlete!"},
];
const CELEBRATES=[
  {emoji:'🔥',title:'Crushed it!',     msg:'One step closer to that six-pack!'},
  {emoji:'⚡',title:'Beast mode!',      msg:'Your discipline is your superpower!'},
  {emoji:'💪',title:"That's strength!",msg:'Consistent action = unstoppable results!'},
  {emoji:'🏆',title:'Champion move!',  msg:'Elite athletes do exactly this!'},
  {emoji:'🌟',title:'Keep shining!',   msg:"You're building the best version of yourself!"},
  {emoji:'🚀',title:'Launched!',       msg:'Watch yourself transform week by week!'},
];
const PERFECT=[
  {emoji:'🏆',title:'PERFECT DAY!',    msg:'Everything done! This is how champions are made!'},
  {emoji:'🔥',title:'UNSTOPPABLE!',    msg:'100%! The six-pack gets closer every day like this!'},
  {emoji:'👑',title:'KING OF THE DAY!',msg:'Full day checked off. You earned your rest tonight!'},
];

// ─── Storage — uses localStorage (permanent on your device/browser) ───────────
const STORAGE_KEY = 'hybridAthlete_v3';

function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch(e){ return {}; }
}

function saveState(){
  try {
    const key = window.USER_STORAGE_KEY || STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(state));
  } catch(e){ console.warn('LocalStorage save failed:', e); }
}


// ─── showNotice helper ────────────────────────────────────────────────────────
function showNotice(msg, bg, col){
  const el = document.getElementById('save-notice');
  if(!el) return;
  el.textContent  = msg;
  el.style.background = bg  || 'var(--teal)';
  el.style.color      = col || '#000';
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(()=> el.classList.remove('show'), 2200);
}

// ─── State ────────────────────────────────────────────────────────────────────
// state.completions['YYYY-MM-DD']['taskId'] = true/false
// state.selectedKey = 'YYYY-MM-DD'

let state = loadState();
if(!state.completions) state.completions = {};

// ─── Date helpers ─────────────────────────────────────────────────────────────
function pad(n){ return String(n).padStart(2,'0'); }
function todayKey(){ const d=new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function keyToDate(k){ const [y,m,d]=k.split('-').map(Number); return new Date(y,m-1,d); }
function dateToKey(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function keyToDayName(k){
  const d=keyToDate(k); const jsDay=d.getDay();
  return DAYS[jsDay===0?6:jsDay-1];
}
function isFuture(k){ return k>todayKey(); }
function isToday(k){ return k===todayKey(); }

function getSelKey(){
  if(!state.selectedKey || isFuture(state.selectedKey)) return todayKey();
  return state.selectedKey;
}

// ─── Progress ─────────────────────────────────────────────────────────────────
function getProgress(dateKey){
  const dayName = keyToDayName(dateKey);
  const comp    = state.completions[dateKey] || {};
  const tasks   = getDynamicTasks(dateKey);
  if(!tasks || tasks.length === 0) return {done:0, total:0, pct:0, dayName};
  const done = tasks.filter(t => comp[t.id]).length;
  return {done, total:tasks.length, pct:Math.round(done/tasks.length*100), dayName};
}
// ─── Convert userMeals to task format ────────────────
function getDynamicTasks(dateKey){
  if(typeof getMealsForDate !== 'function') return [];
  const meals = getMealsForDate(dateKey);
  if(!meals || meals.length === 0) return [];
  return meals.map(m => ({
    id:    m.id,
    s:     getCategoryIcon(m.badge) + ' ' + m.badge,
    name:  m.name,
    meta:  m.time + (m.kcal ? ' · ' + m.kcal + ' kcal' : ''),
    badge: m.badge,
    bc:    (typeof getBadgeColors==='function') ? getBadgeColors(m.badge).bc : '#9ca3af22',
    bt:    (typeof getBadgeColors==='function') ? getBadgeColors(m.badge).bt : '#9ca3af',
    m:     { kcal: m.kcal||0, p: m.protein||0, c: m.carbs||0, f: m.fat||0 }
  }));
}

function getCategoryIcon(badge){
  const icons = {
    'Breakfast':'🍽️','Lunch':'🍛','Dinner':'🌙','Snack':'🫘',
    'Pre-workout':'⚡','Post-workout':'💪','Hydration':'💧',
    'Supplements':'💊','Other':'📋'
  };
  return icons[badge] || '📋';
}



function getDoneMacros(dateKey){
  const comp  = state.completions[dateKey] || {};
  const tasks = getDynamicTasks(dateKey);
  let kcal=0,p=0,c=0,f=0;
  if(tasks) tasks.forEach(t => {
    if(comp[t.id]){ kcal+=t.m.kcal; p+=t.m.p; c+=t.m.c; f+=t.m.f; }
  });
  return {kcal,p,c,f};
}

// Streak: count consecutive 100% days going backwards from YESTERDAY
// (today is allowed to be incomplete — it's ongoing)
// If yesterday was 100%, count it + go further back
// If yesterday was not 100% but today is 100%, streak = 1
function computeStreak(){
  const today = new Date();
  let streak = 0;

  // First check today
  const todK = todayKey();
  if(getProgress(todK).pct===100) streak=1;

  // Then go backwards from yesterday
  for(let i=1; i<=365; i++){
    const d = new Date(today); d.setDate(today.getDate()-i);
    const k = dateToKey(d);
    if(getProgress(k).pct===100) streak++;
    else break;
  }
  return streak;
}

function computePerfectDays(){
  // Count all dates in storage that are 100%
  let count=0;
  const now = new Date();
  const y=now.getFullYear(), m=now.getMonth();
  const days=new Date(y,m+1,0).getDate();
  for(let d=1;d<=days;d++){
    const k=`${y}-${pad(m+1)}-${pad(d)}`;
    if(!isFuture(k) && getProgress(k).pct===100) count++;
  }
  return count;
}

function computeAllTime(){
  return Object.values(state.completions).reduce((sum,dayMap)=>
    sum+Object.values(dayMap).filter(Boolean).length, 0);
}

// ─── Date Dropdown ────────────────────────────────────────────────────────────
function buildDateDropdowns(){
  const selKey = getSelKey();
  const selDate = keyToDate(selKey);
  const now = new Date();

  // Day dropdown (1–31, filtered by selected month/year)
  const selDay   = document.getElementById('sel-day');
  const selMonth = document.getElementById('sel-month');
  const selYear  = document.getElementById('sel-year');

  // Year: from 2025 up to current year
  selYear.innerHTML = '';
  for(let y=2025; y<=now.getFullYear(); y++){
    const o=document.createElement('option');
    o.value=y; o.textContent=y;
    if(y===selDate.getFullYear()) o.selected=true;
    selYear.appendChild(o);
  }

  // Month: all 12, but cap future months in current year
  selMonth.innerHTML = '';
  for(let m=0;m<12;m++){
    const isCurrentYear = parseInt(selYear.value)===now.getFullYear();
    if(isCurrentYear && m>now.getMonth()) continue;
    const o=document.createElement('option');
    o.value=m; o.textContent=MONTHS[m];
    if(m===selDate.getMonth()) o.selected=true;
    selMonth.appendChild(o);
  }

  // Day: 1 to days in selected month/year, cap at today if current month
  const y2=parseInt(selYear.value), m2=parseInt(selMonth.value);
  const daysInMonth=new Date(y2,m2+1,0).getDate();
  const maxDay = (y2===now.getFullYear()&&m2===now.getMonth()) ? now.getDate() : daysInMonth;
  selDay.innerHTML='';
  for(let d=1;d<=maxDay;d++){
    const o=document.createElement('option');
    o.value=d; o.textContent=d;
    if(d===selDate.getDate()) o.selected=true;
    selDay.appendChild(o);
  }
}

function onDateDropdownChange(){
  const y=parseInt(document.getElementById('sel-year').value);
  const m=parseInt(document.getElementById('sel-month').value);
  // Rebuild days when month/year changes
  const now=new Date();
  const daysInMonth=new Date(y,m+1,0).getDate();
  const maxDay=(y===now.getFullYear()&&m===now.getMonth())?now.getDate():daysInMonth;
  const selDay=document.getElementById('sel-day');
  const curDay=parseInt(selDay.value)||1;
  selDay.innerHTML='';
  for(let d=1;d<=maxDay;d++){
    const o=document.createElement('option');
    o.value=d; o.textContent=d;
    if(d===Math.min(curDay,maxDay)) o.selected=true;
    selDay.appendChild(o);
  }
  const d=parseInt(document.getElementById('sel-day').value);
  const k=`${y}-${pad(m+1)}-${pad(d)}`;
  if(!isFuture(k)){
    state.selectedKey=k;
    saveState();
    renderAll();
  }
}

function goToday(){
  state.selectedKey=todayKey();
  saveState();
  buildDateDropdowns();
  renderAll();
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderAll(){
  buildDateDropdowns();
  renderStats();
  renderDayTabs();
  renderProgress();
  renderMotive();
  renderPastBanner();
  renderTasks();
  renderWeekBars();
  renderHistory();
}

function renderStats(){
  document.getElementById('s-streak').textContent  = computeStreak();
  document.getElementById('s-perfect').textContent = computePerfectDays();
  document.getElementById('s-alltime').textContent  = computeAllTime();
  const now=new Date();
  document.getElementById('s-perfect-sub').textContent =
    `in ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

function renderDayTabs(){
  const selKey  = getSelKey();
  const selDate = keyToDate(selKey);
  const selWD   = selDate.getDay()===0?6:selDate.getDay()-1; // 0=Mon

  document.getElementById('day-tabs').innerHTML = DAYS.map((day,idx)=>{
    const diff=idx-selWD;
    const d2=new Date(selDate); d2.setDate(selDate.getDate()+diff);
    const k2=dateToKey(d2);
    const pct=isFuture(k2)?0:getProgress(k2).pct;
    const col=DAY_COLORS[day];
    const isActive=idx===selWD;
    return `<div class="day-tab ${isActive?'active':''}"
      style="${isActive?`background:linear-gradient(135deg,${col},${col}99);color:#000`:''}"
      onclick="selectByWeekday(${idx})">
      <span class="dt-name">${day.slice(0,3)}</span>
      <span class="dt-pct">${pct}%</span>
    </div>`;
  }).join('');
}

function renderProgress(){
  const dk = getSelKey();
  const {done,total,pct,dayName} = getProgress(dk);
  const col = DAY_COLORS[dayName];
  const offset = 289-(pct/100)*289;
  const dm  = getDoneMacros(dk);
  const tgt = getDayTargets(dk);
  const d   = keyToDate(dk);

  document.getElementById('ring-fill').style.stroke=col;
  document.getElementById('ring-fill').style.strokeDashoffset=offset;
  document.getElementById('ring-pct').textContent=pct+'%';
  document.getElementById('ring-pct').style.color=col;
  document.getElementById('ring-done').textContent=`${done}/${total}`;
  document.getElementById('day-title').textContent=`${dayName} · ${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
  document.getElementById('day-training').textContent=DAY_TRAINING[dayName];

  const items=[
    {label:'Calories',val:dm.kcal,target:tgt.kcal,unit:'kcal',color:col},
    {label:'Protein', val:dm.p,   target:tgt.p,   unit:'g',   color:'#4ade80'},
    {label:'Carbs',   val:dm.c,   target:tgt.c,   unit:'g',   color:'#fbbf24'},
    {label:'Fat',     val:dm.f,   target:tgt.f,   unit:'g',   color:'#f87171'},
  ];
  document.getElementById('day-macros').innerHTML=items.map(i=>{
    const p=Math.min(100,Math.round(i.val/i.target*100));
    return `<div class="dmacro-row">
      <span class="dmacro-label">${i.label}</span>
      <div class="dmacro-track"><div class="dmacro-fill" style="width:${p}%;background:${i.color}"></div></div>
      <span class="dmacro-val" style="color:${i.color}">${i.val}/${i.target}${i.unit}</span>
    </div>`;
  }).join('');
}

function renderMotive(){
  const dk  = getSelKey();
  const {pct} = getProgress(dk);
  const m = [...MOTIVES].reverse().find(x=>pct>=x.at)||MOTIVES[0];
  document.getElementById('motive-icon').textContent=m.icon;
  document.getElementById('motive-text').textContent=m.title;
  document.getElementById('motive-sub').textContent=m.sub;
}

function renderPastBanner(){
  const dk=getSelKey();
  const banner=document.getElementById('past-banner');
  if(!isToday(dk)){
    const d=keyToDate(dk);
    document.getElementById('past-text').textContent=
      `Viewing ${keyToDayName(dk)} · ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} — you can still update tasks`;
    banner.classList.add('show');
  } else {
    banner.classList.remove('show');
  }
}

function renderTasks(){
  const dk      = getSelKey();
  const dayName = keyToDayName(dk);
  const comp    = state.completions[dk]||{};
  const tgt     = getDayTargets(dk);
  const tasks   = getDynamicTasks(dk);

  // No meals set up — show empty state with button to open editor
  if(!tasks || tasks.length === 0){
    document.getElementById('tasks-container').innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:var(--muted)">
        <div style="font-size:44px;margin-bottom:12px">🍽️</div>
        <div style="font-size:16px;font-weight:700;margin-bottom:8px;color:var(--text)">
          No meals set up for ${dayName}
        </div>
        <div style="font-size:13px;margin-bottom:20px;line-height:1.6">
          Click the button below to add your meals for this day.
        </div>
        <button onclick="openMealEditor('${dayName}','template')"
          style="background:var(--teal);color:#000;border:none;padding:12px 28px;
                 border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;
                 font-family:'Inter',sans-serif;">
          + Add meals for ${dayName}
        </button>
      </div>`;
    return;
  }

  const sections={};
  tasks.forEach(t=>{ if(!sections[t.s]) sections[t.s]=[]; sections[t.s].push(t); });

  let html='';
  Object.entries(sections).forEach(([sec,items])=>{
    const secDone=items.filter(t=>comp[t.id]).length;
    html+=`<div class="sec-hdr"><span class="sec-title">${sec}</span><span class="sec-count">${secDone}/${items.length}</span></div>`;
    items.forEach(t=>{
      const done=!!comp[t.id];
      const hasNut=t.m.kcal>0||t.m.p>0;
      const dm=getDoneMacros(dk);
      const dropId='drop_'+t.id, btnId='ebtn_'+t.id;
      let dropHtml='';
      if(hasNut){
        const mis=[
          {label:'Calories',meal:t.m.kcal,day:dm.kcal,target:tgt.kcal,unit:'kcal',color:'#00d4a0'},
          {label:'Protein', meal:t.m.p,   day:dm.p,   target:tgt.p,   unit:'g',   color:'#4ade80'},
          {label:'Carbs',   meal:t.m.c,   day:dm.c,   target:tgt.c,   unit:'g',   color:'#fbbf24'},
          {label:'Fat',     meal:t.m.f,   day:dm.f,   target:tgt.f,   unit:'g',   color:'#f87171'},
        ];
        dropHtml=`<div class="macro-drop" id="${dropId}">
          <div class="macro-drop-title">This meal · Running day total</div>
          ${mis.map(mi=>{
            const dayPct =Math.min(100,Math.round(mi.day/mi.target*100));
            const mealPct=Math.min(100,Math.round(mi.meal/mi.target*100));
            return `<div class="mdrop-row">
              <span class="mdrop-label">${mi.label}</span>
              <div class="mdrop-track">
                <div class="mdrop-day"  style="width:${dayPct}%;background:${mi.color}"></div>
                <div class="mdrop-meal" style="width:${mealPct}%;background:${mi.color}"></div>
              </div>
              <div class="mdrop-right">
                <span style="color:${mi.color};font-weight:700">+${mi.meal}${mi.unit}</span>
                <span style="color:var(--muted)"> · ${mi.day}/${mi.target}${mi.unit} (${dayPct}%)</span>
              </div>
            </div>`;
          }).join('')}
        </div>`;
      }
      html+=`<div class="task-card ${done?'done':''}">
        <div class="task-main" onclick="toggleTask('${t.id}')">
          <div class="check-circle">${done?'✓':''}</div>
          <div class="task-content">
            <div class="task-name">${t.name}</div>
            <div class="task-meta">${t.meta}</div>
          </div>
          <div class="task-right">
            <div class="task-badge" style="background:${t.bc};color:${t.bt}">${t.badge}</div>
            ${hasNut?`<button class="expand-btn" id="${btnId}" onclick="event.stopPropagation();toggleDrop('${dropId}','${btnId}')">▼</button>`:''}
          </div>
        </div>
        ${dropHtml}
      </div>`;
    });
  });
  document.getElementById('tasks-container').innerHTML=html;
}

function renderWeekBars(){
  const selKey  = getSelKey();
  const selDate = keyToDate(selKey);
  const selWD   = selDate.getDay()===0?6:selDate.getDay()-1;

  document.getElementById('week-grid').innerHTML=DAYS.map((day,idx)=>{
    const diff=idx-selWD;
    const d2=new Date(selDate); d2.setDate(selDate.getDate()+diff);
    const k2=dateToKey(d2);
    const pct=isFuture(k2)?0:getProgress(k2).pct;
    const col=DAY_COLORS[day];
    const isActive=idx===selWD;
    return `<div class="wk-cell" onclick="selectByWeekday(${idx})">
      <div class="wk-bar-wrap">
        <div class="wk-bar" style="height:${Math.max(3,pct)}%;background:${pct>0?col:'rgba(255,255,255,0.08)'}"></div>
      </div>
      <div class="wk-name" style="${isActive?'color:#fff;font-weight:700':''}">${day.slice(0,3)}</div>
      <div class="wk-pct" style="color:${col}">${pct}%</div>
    </div>`;
  }).join('');
}

function renderHistory(){
  const entries=[];
  const today=new Date();
  for(let i=0;i<21;i++){
    const d=new Date(today); d.setDate(today.getDate()-i);
    const k=dateToKey(d);
    const {pct,dayName}=getProgress(k);
    if(pct>0||i===0) entries.push({k,dayName,pct,d});
  }
  if(!entries.length){
    document.getElementById('history-list').innerHTML='<div style="color:var(--muted);font-size:12px;text-align:center;padding:12px">No history yet — start ticking tasks!</div>';
    return;
  }
  document.getElementById('history-list').innerHTML=entries.slice(0,10).map(e=>{
    const col=DAY_COLORS[e.dayName];
    const status=e.pct===100?'🏆 Perfect':e.pct>=75?'🔥 Great':e.pct>=50?'💪 Good':e.pct>0?'📈 Started':'—';
    const dateStr=`${e.d.getDate()} ${MONTHS[e.d.getMonth()].slice(0,3)} · ${e.dayName.slice(0,3)}`;
    return `<div class="history-row" onclick="selectDate('${e.k}')">
      <span class="h-date">${dateStr}</span>
      <div class="h-bar"><div class="h-bar-fill" style="width:${e.pct}%;background:${col}"></div></div>
      <span class="h-pct" style="color:${col}">${e.pct}%</span>
      <span class="h-status">${status}</span>
    </div>`;
  }).join('');
}

// ─── Actions ──────────────────────────────────────────────────────────────────
function selectDate(k){
  if(isFuture(k)) return;
  state.selectedKey=k;
  saveState();
  renderAll();
  document.getElementById('tasks-container').scrollIntoView({behavior:'smooth',block:'start'});
}

function selectByWeekday(idx){
  const selKey  = getSelKey();
  const selDate = keyToDate(selKey);
  const selWD   = selDate.getDay()===0?6:selDate.getDay()-1;
  const diff    = idx-selWD;
  const d2=new Date(selDate); d2.setDate(selDate.getDate()+diff);
  const k2=dateToKey(d2);
  if(!isFuture(k2)) selectDate(k2);
}

function toggleTask(taskId){
  const dk=getSelKey();
  if(!state.completions[dk]) state.completions[dk]={};
  const wasAllDone=getProgress(dk).pct===100;
  state.completions[dk][taskId]=!state.completions[dk][taskId];

  // 1. Save locally immediately
  saveState();

  // 2. Push to Firebase — show cloud status to user
  if(fbDb){
    // Firebase ready — sync now
    syncToCloud(false);  // false = show the cloud notice
  } else {
    // Firebase not ready yet — queue it and show pending notice
    pendingSync = true;
    showNotice('💾 Saved locally — syncing to cloud...','#888780','#fff');
  }

  // 3. Celebrations
  const nowDone=state.completions[dk][taskId];
  const isAllDone=getProgress(dk).pct===100;
  if(nowDone){
    if(isAllDone&&!wasAllDone) showPerfect();
    else showCelebrate();
    spawnConfetti();
  }
  renderAll();
}

function toggleDrop(dropId,btnId){
  const drop=document.getElementById(dropId);
  const btn=document.getElementById(btnId);
  if(!drop||!btn) return;
  const open=drop.classList.toggle('open');
  btn.classList.toggle('open',open);
  btn.textContent=open?'▲':'▼';
}

function resetDay(){
  const dk=getSelKey();
  const dayName=keyToDayName(dk);
  if(!confirm(`Reset all tasks for ${dayName} (${dk})?`)) return;
  state.completions[dk]={};
  saveState();
  renderAll();
}

function showCelebrate(){
  const c=CELEBRATES[Math.floor(Math.random()*CELEBRATES.length)];
  showCel(c.emoji,c.title,c.msg,1800);
}
function showPerfect(){
  const c=PERFECT[Math.floor(Math.random()*PERFECT.length)];
  showCel(c.emoji,c.title,c.msg,3000);
}
function showCel(emoji,title,msg,dur){
  document.getElementById('cel-emoji').textContent=emoji;
  document.getElementById('cel-title').textContent=title;
  document.getElementById('cel-msg').textContent=msg;
  const el=document.getElementById('celebration');
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),dur);
}
function spawnConfetti(){
  const cols=['#00d4a0','#4d9fff','#a78bfa','#fbbf24','#4ade80','#f472b6','#f87171'];
  for(let i=0;i<20;i++){
    const el=document.createElement('div');
    el.className='confetti-piece';
    el.style.cssText=`left:${Math.random()*100}vw;top:${Math.random()*30}vh;background:${cols[Math.floor(Math.random()*cols.length)]};animation-duration:${1+Math.random()}s;animation-delay:${Math.random()*.3}s;transform:rotate(${Math.random()*360}deg)`;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),2000);
  }
}


// ─── Firebase ────────────────────────────────────────────────────────────────
const LS_FB_KEY = 'hybridAthlete_fbConfig_v4';
let fbDb = null;
let fbSdkLoaded = false;
let pendingSync = false;  // queue a sync if Firebase not ready yet

function loadFirebaseSDK(cb){
  if(fbSdkLoaded && window.firebase){ cb(); return; }
  // Remove any old scripts first
  document.querySelectorAll('script[data-fb]').forEach(s=>s.remove());
  
  const s1 = document.createElement('script');
  s1.setAttribute('data-fb','1');
  s1.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js';
  s1.onerror = ()=>{ showNotice('⚠ Could not load Firebase SDK — check internet','#f87171','#fff'); setFbStatus('disconnected','SDK load failed — check internet connection'); };
  s1.onload = ()=>{
    const s2 = document.createElement('script');
    s2.setAttribute('data-fb','2');
    s2.src = 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js';
    s2.onerror = ()=>{ showNotice('⚠ Could not load Firestore SDK','#f87171','#fff'); };
    s2.onload = ()=>{ fbSdkLoaded=true; cb(); };
    document.head.appendChild(s2);
  };
  document.head.appendChild(s1);
}

function initFirebase(cfg){
  try {
    if(!window.firebase){ console.error('Firebase SDK not loaded'); return false; }
    // Delete existing app if any to allow re-init with new config
    if(firebase.apps.length > 0){
      firebase.apps[0].delete().then(()=>{}).catch(()=>{});
    }
    firebase.initializeApp(cfg);
    fbDb = firebase.firestore();
    // Enable persistence for offline support
    fbDb.enablePersistence({synchronizeTabs:true}).catch(e=>{
      console.log('Persistence not available:', e.code);
    });
    return true;
  } catch(e){
    console.error('Firebase init error:', e);
    return false;
  }
}

function setFbStatus(status, text){
  const dot = document.getElementById('fb-dot');
  const lbl = document.getElementById('fb-status-text');
  if(!dot||!lbl) return;
  dot.className = 'fb-dot' + (status==='connected'?' connected':status==='syncing'?' syncing':'');
  lbl.textContent = text;
  lbl.style.color = status==='connected'?'var(--teal)':status==='syncing'?'var(--amber)':'var(--coral)';
}

async function syncToCloud(silent){
  if(!fbDb){ 
    if(!silent) showNotice('⚠ Not connected to Firebase yet','#f87171','#fff'); 
    return; 
  }
  try {
    isSyncing = true;  // tell listener to ignore this write (it came from us)
    const payload = JSON.stringify({
      completions: state.completions,
      selectedKey: state.selectedKey,
      lastUpdated: new Date().toISOString(),
      version: 'v4'
    });
    await fbDb.collection('users').doc(currentUser.uid).collection('tracker').doc('userData').set({ payload: payload });
    setFbStatus('connected','☁️ Live — synced ' + new Date().toLocaleTimeString());
    showNotice('☁️ Synced to cloud!','#fbbf24','#000');  // always show
  } catch(e){
    console.error('Firestore write error:', e);
    const msg = e.code === 'permission-denied' 
      ? 'Permission denied — fix Firestore rules'
      : e.code === 'unavailable'
      ? 'Offline — saved locally, will sync when back online'
      : 'Sync failed: ' + (e.message||e.code||'unknown');
    setFbStatus('disconnected', msg);
    showNotice('⚠ ' + msg,'#f87171','#fff');  // always show errors
  } finally {
    // Release lock after a short delay (enough for snapshot to arrive and be skipped)
    setTimeout(() => { isSyncing = false; }, 2000);
  }
}

// ─── Real-time listener — pushes cloud changes to ALL devices instantly ─────────
let fbUnsubscribe = null;  // holds the listener so we can detach if needed
let isSyncing = false;     // prevent echo: don't re-apply cloud changes we just sent

function startRealtimeSync(){
  if(!fbDb) return;
  // Detach any old listener first
  if(fbUnsubscribe){ fbUnsubscribe(); fbUnsubscribe = null; }

  setFbStatus('syncing','Connecting live sync...');

  // If tasks were ticked before Firebase was ready, sync them now
  if(pendingSync){
    pendingSync = false;
    syncToCloud(false);
  }

  fbUnsubscribe = fbDb.collection('users').doc(currentUser.uid).collection('tracker').doc('userData')
    .onSnapshot(
      (doc) => {
        // Skip if WE just triggered this update (echo prevention)
        if(isSyncing) return;

        if(doc.exists && doc.data().payload){
          try {
            const loaded = JSON.parse(doc.data().payload);
            if(!loaded.completions) return;

            let changed = false;

            // Apply cloud data — cloud always wins
            Object.keys(loaded.completions).forEach(dateKey => {
              if(!state.completions[dateKey]) state.completions[dateKey] = {};
              Object.keys(loaded.completions[dateKey]).forEach(taskId => {
                const cloudVal = loaded.completions[dateKey][taskId];
                if(state.completions[dateKey][taskId] !== cloudVal){
                  state.completions[dateKey][taskId] = cloudVal;
                  changed = true;
                }
              });
            });

            if(changed){
              saveState();
              renderAll();
              setFbStatus('connected', '☁️ Live — updated ' + new Date().toLocaleTimeString());
            } else {
              setFbStatus('connected', '☁️ Live — ' + new Date().toLocaleTimeString());
            }
          } catch(e){
            console.error('Snapshot parse error:', e);
          }
        } else {
          // No cloud data yet — push local data up
          setFbStatus('connected','☁️ Connected — uploading...');
          syncToCloud(true);
        }
      },
      (error) => {
        console.error('Snapshot error:', error);
        const msg = error.code === 'permission-denied'
          ? 'Permission denied — fix Firestore rules'
          : 'Live sync error: ' + (error.message || error.code);
        setFbStatus('disconnected', msg);
      }
    );
}

// Keep old loadFromCloud for compatibility but now it just starts listener
async function loadFromCloud(){
  startRealtimeSync();
}

function openModal(){
  try {
    const c = JSON.parse(localStorage.getItem(LS_FB_KEY)||'null') || BAKED_FB_CONFIG;
    document.getElementById('fb-apiKey').value    = c.apiKey||'';
    document.getElementById('fb-projectId').value = c.projectId||'';
    document.getElementById('fb-appId').value     = c.appId||'';
  } catch(e){}
  document.getElementById('fb-modal').classList.add('show');
}
function closeModal(){ document.getElementById('fb-modal').classList.remove('show'); }

async function saveFirebaseConfig(){
  const apiKey    = document.getElementById('fb-apiKey').value.trim();
  const projectId = document.getElementById('fb-projectId').value.trim();
  const appId     = document.getElementById('fb-appId').value.trim();

  if(!apiKey||!projectId||!appId){ 
    showNotice('⚠ Please fill all 3 fields','#f87171','#fff'); 
    return; 
  }

  const cfg = {
    apiKey:        apiKey,
    authDomain:    projectId + '.firebaseapp.com',
    projectId:     projectId,
    storageBucket: projectId + '.appspot.com',
    appId:         appId,
    // messagingSenderId extracted from appId (middle number)
    messagingSenderId: appId.split(':')[1] || ''
  };

  setFbStatus('syncing','Loading Firebase SDK...');
  
  loadFirebaseSDK(async()=>{
    setFbStatus('syncing','Initializing Firebase...');
    const ok = initFirebase(cfg);
    if(ok){
      localStorage.setItem(LS_FB_KEY, JSON.stringify(cfg));
      closeModal();
      setFbStatus('syncing','Testing connection...');
      // Test connection with a small write first
      try {
        await fbDb.collection('users').doc(currentUser.uid).collection('tracker').doc('ping').set({ts: new Date().toISOString()});
        setFbStatus('connected','☁️ Connected successfully!');
        showNotice('☁️ Firebase connected!','#fbbf24','#000');
        await loadFromCloud();
        renderAll();
      } catch(e){
        console.error('Connection test failed:', e);
        if(e.code === 'permission-denied'){
          setFbStatus('disconnected', 
            'PERMISSION DENIED — Fix: Firebase Console → Firestore Database → Rules → change "if false" to "if true" → Publish');
          showNotice('⚠ Fix Firestore Rules — see status bar below','#f87171','#fff');
        } else {
          setFbStatus('disconnected', 'Connection failed: ' + (e.message||e.code));
          showNotice('⚠ ' + (e.message||'Connection failed'), '#f87171','#fff');
        }
      }
    } else {
      setFbStatus('disconnected','Init failed — check your API key and App ID');
      showNotice('⚠ Firebase init failed — check credentials','#f87171','#fff');
    }
  });
}

// Auto-reconnect on page load if config saved — runs after DOM ready
// ── Pre-baked Firebase config — works on any device automatically ──────────────
const BAKED_FB_CONFIG = {
  apiKey:            "AIzaSyC6JwSVcCuS56Hiy65K4T7GFhD8ZfRvpZg",
  authDomain:        "mealtrackerwithcustomdata.firebaseapp.com",
  projectId:         "mealtrackerwithcustomdata",
  storageBucket:     "mealtrackerwithcustomdata.firebasestorage.app",
  messagingSenderId: "379393762983",
  appId:             "1:379393762983:web:987977c1d1f39ff1241d82",
  measurementId:     "G-HRCK8XLDWS"
};

function autoConnect(){
  // Called from auth.js bootApp() after user is confirmed logged in
  // fbDb is set by connectUserFirebase() in auth.js
  // startRealtimeSync() is also called from auth.js directly
  // This function kept for compatibility — real work done in auth.js
}

// ─── Export / Import / Clear ──────────────────────────────────────────────────
function exportData(){
  const now=new Date();
  const fname=`hybrid-backup-${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}.json`;
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download=fname; a.click(); URL.revokeObjectURL(url);
  showNotice('⬇ Backup saved to Downloads folder!','#00d4a0','#000');
}

function importData(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=(ev)=>{
    try {
      const imp=JSON.parse(ev.target.result);
      if(!imp.completions) throw new Error('bad format');
      state.completions=Object.assign({},state.completions,imp.completions);
      if(imp.selectedKey) state.selectedKey=imp.selectedKey;
      saveState(); if(fbDb) syncToCloud(true); renderAll();
      showNotice('⬆ Backup imported!','#4d9fff','#000');
    } catch(err){ showNotice('⚠ Import failed — invalid file','#f87171','#fff'); }
  };
  reader.readAsText(file); e.target.value='';
}

function clearAllData(){
  if(!confirm('Delete ALL tracking data permanently?\n\nTip: Export a backup first!')) return;
  state={completions:{},selectedKey:todayKey()};
  saveState(); if(fbDb) syncToCloud(true); renderAll();
  showNotice('🗑 All data cleared','#f87171','#fff');
}

function updateStorageBar(){
  try {
    const key = window.USER_STORAGE_KEY || STORAGE_KEY;
    const raw = localStorage.getItem(key)||'';
    const kb  = (raw.length*2/1024).toFixed(1);
    const pct = Math.min(100, raw.length*2/(5*1024*1024)*100);
    document.getElementById('storage-val').textContent = kb+' KB of 5 MB used';
    document.getElementById('storage-fill').style.width = pct+'%';
  } catch(e){}
}

// Boot is handled by auth.js