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
        await db.collection('students').doc(user.uid).set({
          name: user.displayName || user.email,
          email: user.email,
          cohort: 'YLASS2027',
          cohortName: 'First Cohort',
          classYear: 'Class of 2027',
          isAdmin: false,
          progress: PROGRESS_TEMPLATE,
          notes: '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastActive: firebase.firestore.FieldValue.serverTimestamp()
        });
        studentDoc = (await db.collection('students').doc(user.uid).get()).data();
      } else {
        studentDoc = doc.data();
      }

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
    const name = studentDoc.name ? studentDoc.name.split(' ')[0] : 'Student';
    document.getElementById('greetingText').textContent = `Welcome back, ${name}`;
    document.getElementById('cohortText').textContent = `${studentDoc.cohortName} — ${studentDoc.classYear}`;

    // Profile picture on dashboard
    const dashPic = document.getElementById('dashboardPic');
    if (studentDoc.profilePic) {
      dashPic.src = studentDoc.profilePic;
      dashPic.style.display = 'block';
    }

    // Show admin link if admin
    if (studentDoc.isAdmin) {
      const navLinks = document.getElementById('navLinks');
      const logoutLi = navLinks.querySelector('#navLogout').parentElement;
      const adminLi = document.createElement('li');
      adminLi.innerHTML = '<a href="admin.html">Admin</a>';
      navLinks.insertBefore(adminLi, logoutLi);
    }

    // Render checklist with deadlines
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
          ${items.map(item => {
            const deadlineClass = getDeadlineClass(item.deadline, item.done);
            return `
            <li class="checklist-item ${item.done ? 'done' : ''}">
              <label class="checklist-label">
                <input type="checkbox" class="checklist-checkbox" data-category="${category}" data-id="${item.id}" ${item.done ? 'checked' : ''}>
                <span class="checkmark"></span>
                <span class="checklist-text">${item.label}</span>
              </label>
              <div class="checklist-deadline-row">
                <input type="date" class="deadline-input ${deadlineClass}" data-category="${category}" data-id="${item.id}" value="${item.deadline || ''}">
                ${item.deadline && !item.done ? `<span class="deadline-label ${deadlineClass}">${formatDeadline(item.deadline)}</span>` : ''}
              </div>
            </li>`;
          }).join('')}
        </ul>
      `;
      grid.appendChild(card);
    }

    updateProgressRing(totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0);

    // Attach checkbox listeners
    grid.querySelectorAll('.checklist-checkbox').forEach(cb => {
      cb.addEventListener('change', handleCheckboxChange);
    });

    // Attach deadline listeners
    grid.querySelectorAll('.deadline-input').forEach(input => {
      input.addEventListener('change', handleDeadlineChange);
    });

    // Notes
    document.getElementById('notesArea').value = studentDoc.notes || '';

    // Documents
    renderDocuments();

    // Show dashboard
    loadingState.style.display = 'none';
    dashboardContent.style.display = 'block';
  }

  function getDeadlineClass(deadline, done) {
    if (!deadline || done) return '';
    const now = new Date();
    const dl = new Date(deadline);
    const daysLeft = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'overdue';
    if (daysLeft <= 7) return 'due-soon';
    return '';
  }

  function formatDeadline(deadline) {
    const now = new Date();
    const dl = new Date(deadline);
    const daysLeft = Math.ceil((dl - now) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return `${Math.abs(daysLeft)}d overdue`;
    if (daysLeft === 0) return 'Due today';
    if (daysLeft === 1) return 'Due tomorrow';
    if (daysLeft <= 7) return `${daysLeft}d left`;
    return dl.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  async function handleDeadlineChange(e) {
    const input = e.target;
    const category = input.dataset.category;
    const itemId = input.dataset.id;
    const deadline = input.value;

    const items = studentDoc.progress[category];
    const item = items.find(i => i.id === itemId);
    if (item) item.deadline = deadline;

    try {
      await db.collection('students').doc(currentUser.uid).update({
        progress: studentDoc.progress,
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (err) {
      console.error('Error saving deadline:', err);
    }

    // Re-render to update deadline labels
    renderDashboard();
  }

  // --- Document Upload ---
  document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById('uploadStatus');
    const category = document.getElementById('docCategory').value;

    if (file.size > 1048576) {
      statusEl.textContent = 'File too large. Maximum size is 1MB.';
      statusEl.className = 'upload-status error';
      statusEl.style.display = 'block';
      e.target.value = '';
      return;
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      statusEl.textContent = 'Invalid file type. Use PDF, JPG, PNG, or DOC.';
      statusEl.className = 'upload-status error';
      statusEl.style.display = 'block';
      e.target.value = '';
      return;
    }

    statusEl.textContent = 'Uploading...';
    statusEl.className = 'upload-status uploading';
    statusEl.style.display = 'block';

    try {
      const base64 = await fileToBase64(file);
      await db.collection('students').doc(currentUser.uid).collection('documents').add({
        name: file.name,
        category: category,
        type: file.type,
        size: file.size,
        data: base64,
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      statusEl.textContent = 'Uploaded successfully!';
      statusEl.className = 'upload-status success';
      setTimeout(() => statusEl.style.display = 'none', 3000);
      renderDocuments();
    } catch (err) {
      console.error('Upload error:', err);
      statusEl.textContent = 'Upload failed. Please try again.';
      statusEl.className = 'upload-status error';
    }
    e.target.value = '';
  });

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function renderDocuments() {
    const listEl = document.getElementById('documentsList');
    listEl.innerHTML = '<p class="docs-loading">Loading documents...</p>';

    try {
      const snapshot = await db.collection('students').doc(currentUser.uid)
        .collection('documents').orderBy('uploadedAt', 'desc').get();

      if (snapshot.empty) {
        listEl.innerHTML = '<p class="docs-empty">No documents uploaded yet.</p>';
        return;
      }

      const grouped = {};
      snapshot.docs.forEach(doc => {
        const d = { id: doc.id, ...doc.data() };
        if (!grouped[d.category]) grouped[d.category] = [];
        grouped[d.category].push(d);
      });

      listEl.innerHTML = '';
      for (const [category, docs] of Object.entries(grouped)) {
        const section = document.createElement('div');
        section.className = 'doc-category-group';
        section.innerHTML = `
          <h3 class="doc-category-title">${category}</h3>
          ${docs.map(d => `
            <div class="doc-item" data-id="${d.id}">
              <div class="doc-info">
                <span class="doc-icon">${getFileIcon(d.type)}</span>
                <div>
                  <span class="doc-name">${d.name}</span>
                  <span class="doc-meta">${formatFileSize(d.size)} — ${d.uploadedAt ? new Date(d.uploadedAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                </div>
              </div>
              <div class="doc-actions">
                <button class="doc-btn doc-download" data-id="${d.id}" title="Download">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                </button>
                <button class="doc-btn doc-delete" data-id="${d.id}" title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </button>
              </div>
            </div>
          `).join('')}
        `;
        listEl.appendChild(section);
      }

      listEl.querySelectorAll('.doc-download').forEach(btn => {
        btn.addEventListener('click', () => downloadDocument(btn.dataset.id));
      });
      listEl.querySelectorAll('.doc-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteDocument(btn.dataset.id));
      });
    } catch (err) {
      console.error('Error loading documents:', err);
      listEl.innerHTML = '<p class="docs-empty">Error loading documents.</p>';
    }
  }

  async function downloadDocument(docId) {
    try {
      const doc = await db.collection('students').doc(currentUser.uid)
        .collection('documents').doc(docId).get();
      const data = doc.data();
      const link = document.createElement('a');
      link.href = data.data;
      link.download = data.name;
      link.click();
    } catch (err) {
      console.error('Download error:', err);
    }
  }

  async function deleteDocument(docId) {
    if (!confirm('Delete this document?')) return;
    try {
      await db.collection('students').doc(currentUser.uid)
        .collection('documents').doc(docId).delete();
      renderDocuments();
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  function getFileIcon(type) {
    if (type === 'application/pdf') return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    if (type.startsWith('image/')) return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3498db" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  async function handleCheckboxChange(e) {
    const checkbox = e.target;
    const category = checkbox.dataset.category;
    const itemId = checkbox.dataset.id;
    const isChecked = checkbox.checked;

    const items = studentDoc.progress[category];
    const item = items.find(i => i.id === itemId);
    if (item) item.done = isChecked;

    checkbox.closest('.checklist-item').classList.toggle('done', isChecked);

    const card = checkbox.closest('.checklist-card');
    const catDone = items.filter(i => i.done).length;
    card.querySelector('.checklist-count').textContent = `${catDone}/${items.length}`;

    let total = 0, completed = 0;
    for (const cat of Object.values(studentDoc.progress)) {
      total += cat.length;
      completed += cat.filter(i => i.done).length;
    }
    updateProgressRing(total > 0 ? Math.round((completed / total) * 100) : 0);

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
