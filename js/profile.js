// YLASS Portal — Profile Logic

document.addEventListener('DOMContentLoaded', () => {
  const loadingState = document.getElementById('loadingState');
  const profileContent = document.getElementById('profileContent');
  let currentUser = null;
  let studentDoc = null;

  auth.onAuthStateChanged(async user => {
    if (!user) { window.location.href = 'portal.html'; return; }
    currentUser = user;

    try {
      const doc = await db.collection('students').doc(user.uid).get();
      studentDoc = doc.exists ? doc.data() : {};
      renderProfile();
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  });

  document.getElementById('navLogout').addEventListener('click', e => {
    e.preventDefault();
    auth.signOut().then(() => window.location.href = 'portal.html');
  });

  function renderProfile() {
    document.getElementById('cohortText').textContent = `${studentDoc.cohortName || ''} — ${studentDoc.classYear || ''}`;
    document.getElementById('profileGreeting').textContent = studentDoc.name || 'My Profile';

    // Profile picture
    const picImg = document.getElementById('profilePicImg');
    if (studentDoc.profilePic) {
      picImg.src = studentDoc.profilePic;
    } else {
      picImg.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect fill="%23E4EFF4" width="120" height="120"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="48" fill="%234D8296">' + (studentDoc.name ? studentDoc.name.charAt(0).toUpperCase() : '?') + '</text></svg>');
    }

    const profile = studentDoc.profile || {};
    document.getElementById('profileName').value = studentDoc.name || '';
    document.getElementById('profileEmail').value = studentDoc.email || '';
    document.getElementById('profilePhone').value = profile.phone || '';
    document.getElementById('profileCity').value = profile.city || '';
    document.getElementById('profileCountry').value = profile.country || '';
    document.getElementById('profileSchool').value = profile.school || '';
    document.getElementById('profileGradYear').value = profile.gradYear || '';
    document.getElementById('profileGPA').value = profile.gpa || '';
    document.getElementById('profileSAT').value = profile.sat || '';
    document.getElementById('profileTOEFL').value = profile.toefl || '';
    document.getElementById('profileBio').value = profile.bio || '';
    document.getElementById('profileActivities').value = profile.activities || '';

    loadingState.style.display = 'none';
    profileContent.style.display = 'block';
  }

  document.getElementById('saveProfileBtn').addEventListener('click', async () => {
    const savedEl = document.getElementById('profileSaved');
    const profile = {
      phone: document.getElementById('profilePhone').value,
      city: document.getElementById('profileCity').value,
      country: document.getElementById('profileCountry').value,
      school: document.getElementById('profileSchool').value,
      gradYear: document.getElementById('profileGradYear').value,
      gpa: document.getElementById('profileGPA').value,
      sat: document.getElementById('profileSAT').value,
      toefl: document.getElementById('profileTOEFL').value,
      bio: document.getElementById('profileBio').value,
      activities: document.getElementById('profileActivities').value
    };

    try {
      await db.collection('students').doc(currentUser.uid).update({
        name: document.getElementById('profileName').value,
        profile: profile,
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
      });
      savedEl.style.display = 'inline';
      setTimeout(() => savedEl.style.display = 'none', 2000);
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  });

  // Profile picture upload
  document.getElementById('profilePicWrapper').addEventListener('click', () => {
    document.getElementById('profilePicInput').click();
  });

  document.getElementById('profilePicInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    if (file.size > 500 * 1024) {
      alert('Image must be under 500 KB. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      try {
        await db.collection('students').doc(currentUser.uid).update({
          profilePic: base64,
          lastActive: firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById('profilePicImg').src = base64;
        studentDoc.profilePic = base64;
      } catch (err) {
        console.error('Error saving profile picture:', err);
        alert('Error saving profile picture. Please try again.');
      }
    };
    reader.readAsDataURL(file);
  });

  // Change Password
  document.getElementById('changePasswordBtn').addEventListener('click', async () => {
    const msgEl = document.getElementById('passwordMsg');
    const currentPw = document.getElementById('currentPassword').value;
    const newPw = document.getElementById('newPassword').value;
    const confirmPw = document.getElementById('confirmPassword').value;

    msgEl.style.display = 'none';

    if (!currentPw || !newPw || !confirmPw) {
      showPasswordMsg('Please fill in all password fields.', true);
      return;
    }
    if (newPw.length < 6) {
      showPasswordMsg('New password must be at least 6 characters.', true);
      return;
    }
    if (newPw !== confirmPw) {
      showPasswordMsg('New passwords do not match.', true);
      return;
    }

    try {
      const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, currentPw);
      await currentUser.reauthenticateWithCredential(credential);
      await currentUser.updatePassword(newPw);
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
      showPasswordMsg('Password changed successfully!', false);
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        showPasswordMsg('Current password is incorrect.', true);
      } else {
        showPasswordMsg('Error changing password. Please try again.', true);
      }
      console.error('Password change error:', err);
    }
  });

  function showPasswordMsg(text, isError) {
    const msgEl = document.getElementById('passwordMsg');
    msgEl.textContent = text;
    msgEl.className = 'password-msg ' + (isError ? 'password-error' : 'password-success');
    msgEl.style.display = 'inline';
    setTimeout(() => msgEl.style.display = 'none', 4000);
  }
});
