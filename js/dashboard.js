// YLASS Portal — Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
  const loadingState = document.getElementById('loadingState');
  const dashboardContent = document.getElementById('dashboardContent');
  let currentUser = null;
  let studentDoc = null;

  auth.onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = 'portal.html';
      return;
    }
    currentUser = user;

    try {
      const doc = await db.collection('students').doc(user.uid).get();
      if (!doc.exists) {
        // Create doc if missing (e.g., admin logging in for first time)
        await db.collection('students').doc(user.uid).set({
          name: user.displayName || user.email,
          email: user.email,
          cohort: 'YLASS2027',
          cohortName: 'First Cohort',
          classYear: 'Class of 2027',
          isAdmin: ADMIN_EMAILS.includes(user.email.toLowerCase()),
          progress: PROGRESS_TEMPLATE,
          notes: '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastActive: firebase.firestore.FieldValue.serverTimestamp()
        });
        studentDoc = (await db.collection('students').doc(user.uid).get()).data();
      } else {
        studentDoc = doc.data();
      }

      // Update last active
      db.collection('students').doc(user.uid).update({
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
      });

      renderDashboard();
    } catch (err) {
      console.error('Error loading dashboard:', err);
      loadingState.innerHTML = '<p>Error loading dashboard. Please try again.</p>';
    }
  });

  // Logout
  const logoutBtn = document.getElementById('navLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', e => {
      e.preventDefault();
      auth.signOut().then(() => window.location.href = 'portal.html');
    });
  }

  function renderDashboard() {
    // Greeting
    const name = studentDoc.name ? studentDoc.name.split(' ')[0] : 'Student';
    document.getElementById('greetingText').textContent = `Welcome back, ${name}`;
    document.getElementById('cohortText').textContent = `${studentDoc.cohortName} — ${studentDoc.classYear}`;

    // Show admin link if admin
    if (studentDoc.isAdmin) {
      const navLinks = document.getElementById('navLinks');
      const logoutLi = navLinks.querySelector('#navLogout').parentElement;
      const adminLi = document.createElement('li');
      adminLi.innerHTML = '<a href="admin.html">Admin</a>';
      navLinks.insertBefore(adminLi, logoutLi);
    }

    // Render checklist
    const grid = document.getElementById('checklistGrid');
    const progress = studentDoc.progress || PROGRESS_TEMPLATE;
    let totalItems = 0;
    let completedItems = 0;

    grid.innerHTML = '';

    for (const [category, items] of Object.entries(progress)) {
      const catDone = items.filter(i => i.done).length;
      totalItems += items.length;
      completedItems += catDone;

      const card = document.createElement('div');
      card.className = 'checklist-card';
      card.innerHTML = `
        <div class="checklist-card-header">
          <h3 class="checklist-category">${category}</h3>
          <span class="checklist-count">${catDone}/${items.length}</span>
        </div>
        <ul class="checklist-items">
          ${items.map(item => `
            <li class="checklist-item ${item.done ? 'done' : ''}">
              <label class="checklist-label">
                <input type="checkbox" class="checklist-checkbox" data-category="${category}" data-id="${item.id}" ${item.done ? 'checked' : ''}>
                <span class="checkmark"></span>
                <span class="checklist-text">${item.label}</span>
              </label>
            </li>
          `).join('')}
        </ul>
      `;
      grid.appendChild(card);
    }

    // Update progress ring
    updateProgressRing(totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0);

    // Attach checkbox listeners
    grid.querySelectorAll('.checklist-checkbox').forEach(cb => {
      cb.addEventListener('change', handleCheckboxChange);
    });

    // Notes
    document.getElementById('notesArea').value = studentDoc.notes || '';

    // Show dashboard
    loadingState.style.display = 'none';
    dashboardContent.style.display = 'block';
  }

  async function handleCheckboxChange(e) {
    const checkbox = e.target;
    const category = checkbox.dataset.category;
    const itemId = checkbox.dataset.id;
    const isChecked = checkbox.checked;

    // Update local data
    const items = studentDoc.progress[category];
    const item = items.find(i => i.id === itemId);
    if (item) item.done = isChecked;

    // Toggle done class
    checkbox.closest('.checklist-item').classList.toggle('done', isChecked);

    // Update count for this category
    const card = checkbox.closest('.checklist-card');
    const catDone = items.filter(i => i.done).length;
    card.querySelector('.checklist-count').textContent = `${catDone}/${items.length}`;

    // Update overall progress
    let total = 0, completed = 0;
    for (const cat of Object.values(studentDoc.progress)) {
      total += cat.length;
      completed += cat.filter(i => i.done).length;
    }
    updateProgressRing(total > 0 ? Math.round((completed / total) * 100) : 0);

    // Save to Firestore
    try {
      await db.collection('students').doc(currentUser.uid).update({
        progress: studentDoc.progress,
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  }

  function updateProgressRing(percent) {
    document.getElementById('progressPercent').textContent = `${percent}%`;
    document.getElementById('progressRingFill').setAttribute('stroke-dasharray', `${percent}, 100`);
  }

  // Save notes
  document.getElementById('saveNotesBtn').addEventListener('click', async () => {
    const notes = document.getElementById('notesArea').value;
    const savedEl = document.getElementById('notesSaved');
    try {
      await db.collection('students').doc(currentUser.uid).update({
        notes: notes,
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
      });
      savedEl.style.display = 'inline';
      setTimeout(() => savedEl.style.display = 'none', 2000);
    } catch (err) {
      console.error('Error saving notes:', err);
    }
  });
});
