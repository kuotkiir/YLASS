// YLASS Portal — Admin Logic

document.addEventListener('DOMContentLoaded', () => {
  const loadingState = document.getElementById('loadingState');
  const accessDenied = document.getElementById('accessDenied');
  const adminContent = document.getElementById('adminContent');
  const modal = document.getElementById('studentModal');
  let allStudents = [];
  let currentFilter = 'all';

  auth.onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = 'portal.html';
      return;
    }

    try {
      const doc = await db.collection('students').doc(user.uid).get();
      if (!doc.exists || !doc.data().isAdmin) {
        loadingState.style.display = 'none';
        accessDenied.style.display = 'flex';
        return;
      }

      // Load all students
      const snapshot = await db.collection('students').orderBy('name').get();
      allStudents = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      renderAdmin();
    } catch (err) {
      console.error('Error loading admin:', err);
      loadingState.innerHTML = '<p>Error loading admin panel.</p>';
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

  // Cohort filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.cohort;
      renderStudentsTable();
    });
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click', () => {
    modal.style.display = 'none';
  });
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });

  function renderAdmin() {
    renderStudentsTable();
    loadingState.style.display = 'none';
    adminContent.style.display = 'block';
  }

  function renderStudentsTable() {
    const filtered = currentFilter === 'all'
      ? allStudents
      : allStudents.filter(s => s.cohort === currentFilter);

    // Stats
    document.getElementById('totalStudents').textContent = filtered.length;

    let totalProgress = 0;
    filtered.forEach(s => {
      totalProgress += getStudentProgress(s);
    });
    const avg = filtered.length > 0 ? Math.round(totalProgress / filtered.length) : 0;
    document.getElementById('avgProgress').textContent = `${avg}%`;

    // Table
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No students found</td></tr>';
      return;
    }

    filtered.forEach(student => {
      const progress = getStudentProgress(student);
      const lastActive = student.lastActive
        ? new Date(student.lastActive.seconds * 1000).toLocaleDateString()
        : 'Never';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="td-name">${student.name || 'Unknown'}</td>
        <td>${student.classYear || student.cohort}</td>
        <td>
          <div class="progress-bar-wrapper">
            <div class="progress-bar" style="width:${progress}%"></div>
          </div>
          <span class="progress-text">${progress}%</span>
        </td>
        <td>${lastActive}</td>
        <td><button class="btn-view" data-id="${student.id}">View</button></td>
      `;
      tbody.appendChild(tr);
    });

    // View buttons
    tbody.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', () => showStudentModal(btn.dataset.id));
    });
  }

  function getStudentProgress(student) {
    const progress = student.progress;
    if (!progress) return 0;
    let total = 0, done = 0;
    for (const items of Object.values(progress)) {
      total += items.length;
      done += items.filter(i => i.done).length;
    }
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }

  function showStudentModal(studentId) {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;

    document.getElementById('modalStudentName').textContent = student.name || 'Unknown';
    document.getElementById('modalStudentCohort').textContent = `${student.cohortName || ''} — ${student.classYear || student.cohort}`;
    document.getElementById('modalNotes').textContent = student.notes || 'No notes yet.';

    const checklistEl = document.getElementById('modalChecklist');
    checklistEl.innerHTML = '';

    const progress = student.progress || {};
    for (const [category, items] of Object.entries(progress)) {
      const catDone = items.filter(i => i.done).length;
      const section = document.createElement('div');
      section.className = 'modal-category';
      section.innerHTML = `
        <h4>${category} <span class="modal-cat-count">(${catDone}/${items.length})</span></h4>
        <ul>
          ${items.map(item => `
            <li class="${item.done ? 'done' : ''}">
              <span class="modal-check">${item.done ? '&#10003;' : '&#9675;'}</span>
              ${item.label}
            </li>
          `).join('')}
        </ul>
      `;
      checklistEl.appendChild(section);
    }

    // Load student's documents
    const docsEl = document.getElementById('modalDocuments');
    docsEl.innerHTML = '<p style="font-size:0.85rem;color:var(--color-text-muted);">Loading documents...</p>';

    try {
      const docsSnapshot = await db.collection('students').doc(studentId)
        .collection('documents').orderBy('uploadedAt', 'desc').get();

      if (docsSnapshot.empty) {
        docsEl.innerHTML = '<p style="font-size:0.85rem;color:var(--color-text-muted);">No documents uploaded.</p>';
      } else {
        docsEl.innerHTML = docsSnapshot.docs.map(d => {
          const doc = d.data();
          return `<div class="modal-doc-item">
            <span class="doc-name">${doc.name}</span>
            <span class="doc-meta">${doc.category} — ${doc.size ? Math.round(doc.size / 1024) + ' KB' : ''}</span>
          </div>`;
        }).join('');
      }
    } catch (err) {
      docsEl.innerHTML = '<p style="font-size:0.85rem;color:var(--color-text-muted);">Could not load documents.</p>';
    }

    modal.style.display = 'flex';
  }
});
