// ═══════════════════════════════════════════════════════
// AUTH.JS — Loaded LAST. All other scripts already ready.
// ═══════════════════════════════════════════════════════

let currentUser = null;

// ─── Page switching ───────────────────────────────────
function showLoginPage(){
  document.getElementById('login-overlay').classList.remove('hidden');
  document.getElementById('signup-overlay').classList.add('hidden');
  document.getElementById('setup-overlay').classList.add('hidden');
  document.getElementById('meal-editor-overlay').classList.add('hidden');
  document.getElementById('app-wrapper').style.display = 'none';
  document.getElementById('login-email').value    = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').className = 'login-error';
}

function showSignupPage(){
  document.getElementById('login-overlay').classList.add('hidden');
  document.getElementById('signup-overlay').classList.remove('hidden');
  document.getElementById('setup-overlay').classList.add('hidden');
  document.getElementById('app-wrapper').style.display = 'none';
  document.getElementById('signup-name').value    = '';
  document.getElementById('signup-email').value   = '';
  document.getElementById('signup-password').value= '';
  document.getElementById('signup-confirm').value = '';
  document.getElementById('signup-error').className = 'login-error';
}

function showAppPage(){
  document.getElementById('login-overlay').classList.add('hidden');
  document.getElementById('signup-overlay').classList.add('hidden');
  document.getElementById('setup-overlay').classList.add('hidden');
  document.getElementById('app-wrapper').style.display = 'block';
}

// ─── Login ────────────────────────────────────────────
function handleLogin(){
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('login-submit');
  if(!email || !password){ setAuthError('login-error','Please enter your email and password.'); return; }
  btn.disabled = true; btn.textContent = 'Signing in...';
  firebase.auth().signInWithEmailAndPassword(email, password)
    .catch(e => { btn.disabled=false; btn.textContent='Sign In'; setAuthError('login-error', friendlyError(e.code)); });
}

// ─── Signup ───────────────────────────────────────────
function handleSignup(){
  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirm  = document.getElementById('signup-confirm').value;
  const btn      = document.getElementById('signup-submit');
  if(!name||!email||!password||!confirm){ setAuthError('signup-error','Please fill in all fields.'); return; }
  if(password.length < 6){ setAuthError('signup-error','Password must be at least 6 characters.'); return; }
  if(password !== confirm){ setAuthError('signup-error','Passwords do not match.'); return; }
  btn.disabled=true; btn.textContent='Creating account...';
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(r => r.user.updateProfile({ displayName: name }))
    .catch(e => { btn.disabled=false; btn.textContent='Create Account'; setAuthError('signup-error', friendlyError(e.code)); });
}

// ─── Logout ───────────────────────────────────────────
function doLogout(){
  if(!confirm('Sign out?')) return;
  if(typeof fbUnsubscribe==='function'){ fbUnsubscribe(); fbUnsubscribe=null; }
  fbDb = null;
  firebase.auth().signOut();
  state = { completions:{}, selectedKey: todayKey() };
  userMeals = { template:{}, overrides:{} };
  currentUser = null;
}

// ─── Auth state change ────────────────────────────────
function initAuthListener(){
  firebase.auth().onAuthStateChanged(async user => {
    if(user){
      currentUser = user;
      const g = document.getElementById('user-greeting');
      if(g) g.textContent = 'Hi, '+(user.displayName||user.email.split('@')[0])+' 👋';
      await bootApp();
    } else {
      currentUser = null;
      showLoginPage();
    }
  });
}

// ─── Boot after login ─────────────────────────────────
async function bootApp(){
  // 1. Set user-specific localStorage key
  window.USER_STORAGE_KEY = 'hybridAthlete_' + currentUser.uid;

  // 2. Load local cache
  try {
    const raw = localStorage.getItem(window.USER_STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    state.completions = saved.completions || {};
    state.selectedKey = saved.selectedKey || todayKey();
  } catch(e){ state={ completions:{}, selectedKey: todayKey() }; }
  if(!state.selectedKey || isFuture(state.selectedKey)) state.selectedKey = todayKey();

  // 3. Connect Firebase (sets fbDb)
  connectUserFirebase();

  // 4. Load meals from Firebase
  await loadUserMeals();

  // 5. Show setup wizard if brand new user (no meals at all)
  if(!userHasMeals()){
    document.getElementById('app-wrapper').style.display = 'none';
    document.getElementById('login-overlay').classList.add('hidden');
    document.getElementById('signup-overlay').classList.add('hidden');
    showSetupPage();
  } else {
    showAppPage();
    renderAll();
    // Start real-time sync in background
    startRealtimeSync();
  }
}

function connectUserFirebase(){
  try {
    if(!firebase.apps.length) firebase.initializeApp(BAKED_FB_CONFIG);
    fbDb = firebase.firestore();
  } catch(e){ console.error('Firebase connect error:', e); }
}

// ─── Helpers ──────────────────────────────────────────
function setAuthError(elId, msg){
  const el = document.getElementById(elId);
  el.textContent = msg; el.classList.add('show');
}

function friendlyError(code){
  return {
    'auth/user-not-found':       'No account found with this email.',
    'auth/wrong-password':       'Incorrect password. Try again.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/too-many-requests':    'Too many attempts. Please wait and try again.',
    'auth/invalid-credential':   'Incorrect email or password.',
    'auth/network-request-failed':'Network error. Check your internet connection.',
  }[code] || 'Something went wrong. Please try again.';
}

function togglePassword(inputId, btnId){
  const input = document.getElementById(inputId);
  const btn   = document.getElementById(btnId);
  input.type  = input.type==='password' ? 'text' : 'password';
  btn.textContent = input.type==='password' ? '👁' : '🙈';
}

// ─── Enter key support ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-email')
    .addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('login-password').focus(); });
  document.getElementById('login-password')
    .addEventListener('keydown', e => { if(e.key==='Enter') handleLogin(); });
  document.getElementById('signup-confirm')
    .addEventListener('keydown', e => { if(e.key==='Enter') handleSignup(); });
});

// ─── ENTRY POINT ─────────────────────────────────────
// Show login immediately, then load Firebase SDKs
showLoginPage();  // Show login right away — no blank screen

(function loadSDKs(){
  function loadScript(src, cb){
    const s = document.createElement('script');
    s.src = src; s.onload = cb;
    s.onerror = () => { console.error('Failed:', src); };
    document.head.appendChild(s);
  }
  const BASE = 'https://www.gstatic.com/firebasejs/10.7.1/';
  loadScript(BASE+'firebase-app-compat.js', ()=>{
    loadScript(BASE+'firebase-firestore-compat.js', ()=>{
      loadScript(BASE+'firebase-auth-compat.js', ()=>{
        if(!firebase.apps.length) firebase.initializeApp(BAKED_FB_CONFIG);
        initAuthListener();
      });
    });
  });
})();
