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
});
