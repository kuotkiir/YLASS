// YLASS Portal — Admin Logic

document.addEventListener('DOMContentLoaded', () => {
  const loadingState = document.getElementById('loadingState');
  const accessDenied = document.getElementById('accessDenied');
  const adminContent = document.getElementById('adminContent');
  const modal = document.getElementById('studentModal');
  const appModal = document.getElementById('appModal');
  let allStudents = [];
  let allApplications = [];
  let currentFilter = 'all';

  auth.onAuthStateChanged(async user => {
    if (!user || !user.emailVerified) {
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

      // Load applications
      const appsSnapshot = await db.collection('applications').orderBy('submittedAt', 'desc').get();
      allApplications = appsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      renderAdmin();
    } catch (err) {
      console.error('Error loading admin:', err);
      loadingState.innerHTML = '<p>Error loading admin panel.</p>';
    }
  });

  // Logout
  document.getElementById('navLogout').addEventListener('click', e => {
    e.preventDefault();
    auth.signOut().then(() => window.location.href = 'portal.html');
  });

  // Admin tabs
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      document.getElementById('studentsTab').style.display = tabName === 'students' ? 'block' : 'none';
      document.getElementById('applicationsTab').style.display = tabName === 'applications' ? 'block' : 'none';
    });
  });

  // Cohort filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.cohort;
      renderStudentsTable();
    });
  });

  // Student modal close
  document.getElementById('modalClose').addEventListener('click', () => modal.style.display = 'none');
  modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

  // App modal close
  document.getElementById('appModalClose').addEventListener('click', () => appModal.style.display = 'none');
  appModal.addEventListener('click', e => { if (e.target === appModal) appModal.style.display = 'none'; });

  function renderAdmin() {
    renderStudentsTable();
    renderApplicationsTable();
    loadingState.style.display = 'none';
    adminContent.style.display = 'block';
  }

  // ---- Students Tab ----
  function renderStudentsTable() {
    const filtered = currentFilter === 'all'
      ? allStudents
      : allStudents.filter(s => s.cohort === currentFilter);

    document.getElementById('totalStudents').textContent = filtered.length;

    let totalProgress = 0;
    filtered.forEach(s => { totalProgress += getStudentProgress(s); });
    const avg = filtered.length > 0 ? Math.round(totalProgress / filtered.length) : 0;
    document.getElementById('avgProgress').textContent = `${avg}%`;

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

  let currentStudentId = null;

  async function showStudentModal(studentId) {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;
    currentStudentId = studentId;

    document.getElementById('modalStudentName').textContent = student.name || 'Unknown';
    document.getElementById('modalStudentCohort').textContent = `${student.cohortName || ''} — ${student.classYear || student.cohort}`;
    document.getElementById('modalNotes').textContent = student.notes || 'No notes yet.';
    document.getElementById('adminNotesTextarea').value = student.adminNotes || '';

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

    // Load documents
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

  // ---- Applications Tab ----
  function renderApplicationsTable() {
    document.getElementById('totalApps').textContent = allApplications.length;
    document.getElementById('newApps').textContent = allApplications.filter(a => a.status === 'Submitted').length;

    const tbody = document.getElementById('appsTableBody');
    tbody.innerHTML = '';

    if (allApplications.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No applications yet</td></tr>';
      return;
    }

    allApplications.forEach(app => {
      const submitted = app.submittedAt
        ? new Date(app.submittedAt.seconds * 1000).toLocaleDateString()
        : 'Unknown';
      const statusClass = app.status === 'Submitted' ? 'status-submitted'
        : app.status === 'Reviewed' ? 'status-accepted'
        : app.status === 'Rejected' ? 'status-denied' : 'status-pending';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="td-name">${app.fullName || 'Unknown'}</td>
        <td>${app.email || ''}</td>
        <td>${app.school || ''}</td>
        <td>${submitted}</td>
        <td><span class="school-status ${statusClass}">${app.status || 'Submitted'}</span></td>
        <td><button class="btn-view" data-id="${app.id}">View</button></td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', () => showAppModal(btn.dataset.id));
    });
  }

  let currentAppId = null;

  function showAppModal(appId) {
    const app = allApplications.find(a => a.id === appId);
    if (!app) return;
    currentAppId = appId;

    document.getElementById('appModalName').textContent = app.fullName || 'Unknown';

    const details = document.getElementById('appModalDetails');
    details.innerHTML = `
      <div class="app-detail-grid">
        <div class="app-detail"><strong>Email:</strong> ${app.email || 'N/A'}</div>
        <div class="app-detail"><strong>Phone:</strong> ${app.phone || 'N/A'}</div>
        <div class="app-detail"><strong>Date of Birth:</strong> ${app.dob || 'N/A'}</div>
        <div class="app-detail"><strong>Location:</strong> ${app.city || ''}, ${app.country || ''}</div>
        <div class="app-detail"><strong>School:</strong> ${app.school || 'N/A'}</div>
        <div class="app-detail"><strong>Graduation Year:</strong> ${app.graduationYear || 'N/A'}</div>
        <div class="app-detail"><strong>GPA:</strong> ${app.gpa || 'N/A'}</div>
        <div class="app-detail"><strong>How Heard:</strong> ${app.howHeard || 'N/A'}</div>
        <div class="app-detail"><strong>Status:</strong> ${app.status || 'Submitted'}</div>
      </div>
      <div class="app-essay">
        <h4>Why YLASS?</h4>
        <p>${app.whyYlass || 'No response'}</p>
      </div>
      <div class="app-essay">
        <h4>Academic & Career Goals</h4>
        <p>${app.goals || 'No response'}</p>
      </div>
      <div class="app-essay">
        <h4>Extracurricular Activities</h4>
        <p>${app.activities || 'No response'}</p>
      </div>
      ${app.challenges ? `<div class="app-essay"><h4>Challenge Overcome</h4><p>${app.challenges}</p></div>` : ''}
    `;

    appModal.style.display = 'flex';
  }

  // Mark as reviewed
  document.getElementById('appMarkReviewed').addEventListener('click', async () => {
    if (!currentAppId) return;
    try {
      await db.collection('applications').doc(currentAppId).update({ status: 'Reviewed' });
      const app = allApplications.find(a => a.id === currentAppId);
      if (app) app.status = 'Reviewed';
      renderApplicationsTable();
      appModal.style.display = 'none';
    } catch (err) {
      console.error('Error updating application:', err);
    }
  });

  // Mark as rejected
  document.getElementById('appMarkRejected').addEventListener('click', async () => {
    if (!currentAppId) return;
    if (!confirm('Reject this application?')) return;
    try {
      await db.collection('applications').doc(currentAppId).update({ status: 'Rejected' });
      const app = allApplications.find(a => a.id === currentAppId);
      if (app) app.status = 'Rejected';
      renderApplicationsTable();
      appModal.style.display = 'none';
    } catch (err) {
      console.error('Error updating application:', err);
    }
  });

  // Save admin notes
  document.getElementById('saveAdminNotes').addEventListener('click', async () => {
    if (!currentStudentId) return;
    const notes = document.getElementById('adminNotesTextarea').value;
    const savedEl = document.getElementById('adminNotesSaved');
    try {
      await db.collection('students').doc(currentStudentId).update({ adminNotes: notes });
      const student = allStudents.find(s => s.id === currentStudentId);
      if (student) student.adminNotes = notes;
      savedEl.style.display = 'inline';
      setTimeout(() => savedEl.style.display = 'none', 2000);
    } catch (err) {
      console.error('Error saving admin notes:', err);
    }
  });

  // Export Students CSV
  document.getElementById('exportStudentsCSV').addEventListener('click', () => {
    const filtered = currentFilter === 'all'
      ? allStudents
      : allStudents.filter(s => s.cohort === currentFilter);

    const headers = ['Name', 'Email', 'Cohort', 'Progress', 'Last Active', 'Admin Notes'];
    const rows = filtered.map(s => {
      const progress = getStudentProgress(s);
      const lastActive = s.lastActive
        ? new Date(s.lastActive.seconds * 1000).toLocaleDateString()
        : 'Never';
      return [
        s.name || '',
        s.email || '',
        s.classYear || s.cohort || '',
        progress + '%',
        lastActive,
        (s.adminNotes || '').replace(/"/g, '""')
      ];
    });
    downloadCSV(headers, rows, 'ylass-students.csv');
  });

  // Export Applications CSV
  document.getElementById('exportAppsCSV').addEventListener('click', () => {
    const headers = ['Name', 'Email', 'Phone', 'School', 'Graduation Year', 'GPA', 'Status', 'Submitted'];
    const rows = allApplications.map(a => {
      const submitted = a.submittedAt
        ? new Date(a.submittedAt.seconds * 1000).toLocaleDateString()
        : 'Unknown';
      return [
        a.fullName || '',
        a.email || '',
        a.phone || '',
        a.school || '',
        a.graduationYear || '',
        a.gpa || '',
        a.status || 'Submitted',
        submitted
      ];
    });
    downloadCSV(headers, rows, 'ylass-applications.csv');
  });

  function downloadCSV(headers, rows, filename) {
    const escape = v => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(',')]
      .concat(rows.map(r => r.map(escape).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
});
