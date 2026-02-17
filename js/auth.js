// YLASS Portal — Authentication Logic

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const resetForm = document.getElementById('resetForm');

  // Check if user is already logged in — redirect admins to admin page
  auth.onAuthStateChanged(async user => {
    if (user) {
      try {
        const doc = await db.collection('students').doc(user.uid).get();
        if (doc.exists && doc.data().isAdmin) {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      } catch (e) {
        window.location.href = 'dashboard.html';
      }
    }
  });

  // Toggle between forms
  document.getElementById('showSignup').addEventListener('click', e => {
    e.preventDefault();
    loginForm.classList.remove('active');
    signupForm.classList.add('active');
    resetForm.classList.remove('active');
  });

  document.getElementById('showLogin').addEventListener('click', e => {
    e.preventDefault();
    signupForm.classList.remove('active');
    loginForm.classList.add('active');
    resetForm.classList.remove('active');
  });

  document.getElementById('showReset').addEventListener('click', e => {
    e.preventDefault();
    loginForm.classList.remove('active');
    signupForm.classList.remove('active');
    resetForm.classList.add('active');
  });

  document.getElementById('showLoginFromReset').addEventListener('click', e => {
    e.preventDefault();
    resetForm.classList.remove('active');
    loginForm.classList.add('active');
  });

  // Login
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    errorEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    try {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      const doc = await db.collection('students').doc(cred.user.uid).get();
      if (doc.exists && doc.data().isAdmin) {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      errorEl.textContent = getErrorMessage(err.code);
      errorEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Log In';
    }
  });

  // Signup
  signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const cohortCode = document.getElementById('signupCohort').value.trim().toUpperCase();
    const errorEl = document.getElementById('signupError');
    const btn = document.getElementById('signupBtn');

    errorEl.style.display = 'none';

    // Validate cohort code
    if (!VALID_COHORTS[cohortCode]) {
      errorEl.textContent = 'Invalid cohort code. Please check with your mentor.';
      errorEl.style.display = 'block';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Creating account...';

    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: name });

      // Create student document in Firestore
      await db.collection('students').doc(cred.user.uid).set({
        name: name,
        email: email,
        cohort: cohortCode,
        cohortName: VALID_COHORTS[cohortCode].name,
        classYear: VALID_COHORTS[cohortCode].classYear,
        isAdmin: false,
        progress: PROGRESS_TEMPLATE,
        notes: '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
      });

      window.location.href = 'dashboard.html';
    } catch (err) {
      errorEl.textContent = getErrorMessage(err.code);
      errorEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });

  // Password Reset
  resetForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value.trim();
    const errorEl = document.getElementById('resetError');
    const successEl = document.getElementById('resetSuccess');
    const btn = document.getElementById('resetBtn');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      await auth.sendPasswordResetEmail(email);
      successEl.textContent = 'Password reset email sent! Check your inbox.';
      successEl.style.display = 'block';
    } catch (err) {
      errorEl.textContent = getErrorMessage(err.code);
      errorEl.style.display = 'block';
    }
    btn.disabled = false;
    btn.textContent = 'Send Reset Link';
  });
});

function getErrorMessage(code) {
  switch (code) {
    case 'auth/user-not-found': return 'No account found with this email.';
    case 'auth/wrong-password': return 'Incorrect password.';
    case 'auth/invalid-credential': return 'Invalid email or password.';
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/too-many-requests': return 'Too many attempts. Please try again later.';
    default: return 'An error occurred. Please try again.';
  }
}
