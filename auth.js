// ═══════════════════════════════════════════════════════
// AUTH.JS — Multi-user login/signup via Firebase Auth
// Each user sees ONLY their own tracker data
// ═══════════════════════════════════════════════════════

let currentUser = null;

// ─── Page switching ───────────────────────────────────
function showLoginPage(){
  document.getElementById('login-overlay').classList.remove('hidden');
  document.getElementById('signup-overlay').classList.add('hidden');
  document.getElementById('app-wrapper').style.display = 'none';
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').className = 'login-error';
}

function showSignupPage(){
  document.getElementById('login-overlay').classList.add('hidden');
  document.getElementById('signup-overlay').classList.remove('hidden');
  document.getElementById('app-wrapper').style.display = 'none';
  document.getElementById('signup-name').value = '';
  document.getElementById('signup-email').value = '';
  document.getElementById('signup-password').value = '';
  document.getElementById('signup-confirm').value = '';
  document.getElementById('signup-error').className = 'login-error';
}

function showAppPage(){
  document.getElementById('login-overlay').classList.add('hidden');
  document.getElementById('signup-overlay').classList.add('hidden');
  document.getElementById('app-wrapper').style.display = 'block';
}

// ─── Login ────────────────────────────────────────────
function handleLogin(){
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('login-submit');

  if(!email || !password){
    setAuthError('login-error','Please enter your email and password.');
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Signing in...';

  firebase.auth().signInWithEmailAndPassword(email, password)
    .catch(e => {
      btn.disabled = false;
      btn.textContent = 'Sign In';
      setAuthError('login-error', friendlyError(e.code));
    });
}

// ─── Signup ───────────────────────────────────────────
function handleSignup(){
  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirm  = document.getElementById('signup-confirm').value;
  const btn      = document.getElementById('signup-submit');

  if(!name || !email || !password || !confirm){
    setAuthError('signup-error','Please fill in all fields.'); return;
  }
  if(password.length < 6){
    setAuthError('signup-error','Password must be at least 6 characters.'); return;
  }
  if(password !== confirm){
    setAuthError('signup-error','Passwords do not match.'); return;
  }

  btn.disabled = true;
  btn.textContent = 'Creating account...';

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(result => result.user.updateProfile({ displayName: name }))
    .catch(e => {
      btn.disabled = false;
      btn.textContent = 'Create Account';
      setAuthError('signup-error', friendlyError(e.code));
    });
}

// ─── Logout ───────────────────────────────────────────
function doLogout(){
  if(!confirm('Sign out of your account?')) return;
  if(typeof fbUnsubscribe === 'function') fbUnsubscribe();
  fbUnsubscribe = null;
  fbDb = null;
  firebase.auth().signOut();
  state = { completions: {}, selectedKey: todayKey() };
  currentUser = null;
}

// ─── Auth state listener ──────────────────────────────
function initAuthListener(){
  firebase.auth().onAuthStateChanged(user => {
    if(user){
      currentUser = user;
      const greeting = document.getElementById('user-greeting');
      if(greeting) greeting.textContent = 'Hi, ' + (user.displayName || user.email.split('@')[0]) + ' 👋';
      showAppPage();
      bootApp();
    } else {
      currentUser = null;
      showLoginPage();
    }
  });
}

// ─── Boot app after login ─────────────────────────────
async function bootApp(){
  window.USER_STORAGE_KEY = 'hybridAthlete_' + currentUser.uid;

  // Load this user's local cache
  try {
    const raw = localStorage.getItem(window.USER_STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    state.completions = saved.completions || {};
    state.selectedKey = saved.selectedKey || todayKey();
  } catch(e){
    state = { completions: {}, selectedKey: todayKey() };
  }
  if(!state.selectedKey || isFuture(state.selectedKey)) state.selectedKey = todayKey();

  // Connect Firebase first
  connectUserFirebase();

  // Load user's meal plan from Firebase
  await loadUserMeals();

  // Check if new user (no meals set up yet)
  if(!userHasMeals()){
    showSetupPage();
  } else {
    renderAll();
  }
}

// ─── Connect Firebase for this specific user ──────────
function connectUserFirebase(){
  if(!firebase.apps.length){
    firebase.initializeApp(BAKED_FB_CONFIG);
  }
  fbDb = firebase.firestore();

  // Start real-time listener for THIS user's data
  startRealtimeSync();
}

// ─── Helpers ──────────────────────────────────────────
function setAuthError(elId, msg){
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.classList.add('show');
}

function friendlyError(code){
  const map = {
    'auth/user-not-found':     'No account found with this email.',
    'auth/wrong-password':     'Incorrect password. Try again.',
    'auth/invalid-email':      'Please enter a valid email address.',
    'auth/email-already-in-use':'An account with this email already exists.',
    'auth/weak-password':      'Password must be at least 6 characters.',
    'auth/too-many-requests':  'Too many attempts. Please wait and try again.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

function togglePassword(inputId, btnId){
  const input = document.getElementById(inputId);
  const btn   = document.getElementById(btnId);
  input.type  = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
}

// ─── Enter key support ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-email')
    .addEventListener('keydown', e => { if(e.key === 'Enter') document.getElementById('login-password').focus(); });
  document.getElementById('login-password')
    .addEventListener('keydown', e => { if(e.key === 'Enter') handleLogin(); });
  document.getElementById('signup-confirm')
    .addEventListener('keydown', e => { if(e.key === 'Enter') handleSignup(); });
});

// ─── Entry point — load Firebase SDKs then start auth ─
(function init(){
  // Load app + firestore + auth SDKs in sequence
  function loadScript(src, cb){
    const s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    s.onerror = () => console.error('Failed to load:', src);
    document.head.appendChild(s);
  }

  const BASE = 'https://www.gstatic.com/firebasejs/10.7.1/';
  loadScript(BASE + 'firebase-app-compat.js', () => {
    loadScript(BASE + 'firebase-firestore-compat.js', () => {
      loadScript(BASE + 'firebase-auth-compat.js', () => {
        // All SDKs loaded — initialize Firebase and start auth
        if(!firebase.apps.length){
          firebase.initializeApp(BAKED_FB_CONFIG);
        }
        initAuthListener();
      });
    });
  });
})();
