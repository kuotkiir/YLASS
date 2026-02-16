// YLASS Portal — School List Tracker

document.addEventListener('DOMContentLoaded', () => {
  const loadingState = document.getElementById('loadingState');
  const schoolsContent = document.getElementById('schoolsContent');
  const modal = document.getElementById('schoolModal');
  let currentUser = null;
  let schools = [];

  auth.onAuthStateChanged(async user => {
    if (!user) { window.location.href = 'portal.html'; return; }
    currentUser = user;
    await loadSchools();
  });

  document.getElementById('navLogout').addEventListener('click', e => {
    e.preventDefault();
    auth.signOut().then(() => window.location.href = 'portal.html');
  });

  async function loadSchools() {
    try {
      const snapshot = await db.collection('students').doc(currentUser.uid)
        .collection('schools').orderBy('deadline').get();
      schools = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      renderSchools();
      loadingState.style.display = 'none';
      schoolsContent.style.display = 'block';
    } catch (err) {
      console.error('Error loading schools:', err);
    }
  }

  function renderSchools() {
    // Summary
    document.getElementById('totalSchools').textContent = schools.length;
    document.getElementById('acceptedCount').textContent = schools.filter(s => s.status === 'Accepted').length;
    document.getElementById('pendingCount').textContent = schools.filter(s => ['Applying', 'Submitted', 'Researching'].includes(s.status)).length;
    const totalAid = schools.reduce((sum, s) => sum + (parseInt(s.aid) || 0), 0);
    document.getElementById('totalAid').textContent = totalAid > 0 ? `$${totalAid.toLocaleString()}` : '$0';

    const listEl = document.getElementById('schoolsList');
    if (schools.length === 0) {
      listEl.innerHTML = '<div class="docs-empty" style="padding:40px;">No schools added yet. Click "+ Add School" to start building your list.</div>';
      return;
    }

    listEl.innerHTML = schools.map(s => {
      const statusClass = getStatusClass(s.status);
      const deadlineStr = s.deadline ? new Date(s.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      return `
        <div class="school-card">
          <div class="school-card-main">
            <div class="school-card-info">
              <h3 class="school-card-name">${s.name}</h3>
              <div class="school-card-meta">
                ${s.type ? `<span class="school-tag">${s.type}</span>` : ''}
                ${deadlineStr ? `<span class="school-deadline">Deadline: ${deadlineStr}</span>` : ''}
              </div>
            </div>
            <span class="school-status ${statusClass}">${s.status}</span>
          </div>
          ${s.aid ? `<div class="school-card-aid">${s.aidType || 'Aid'}: $${parseInt(s.aid).toLocaleString()}</div>` : ''}
          ${s.notes ? `<div class="school-card-notes">${s.notes}</div>` : ''}
          <div class="school-card-actions">
            <button class="doc-btn" onclick="editSchool('${s.id}')">Edit</button>
            <button class="doc-btn doc-delete" onclick="deleteSchool('${s.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function getStatusClass(status) {
    switch (status) {
      case 'Accepted': return 'status-accepted';
      case 'Submitted': return 'status-submitted';
      case 'Waitlisted': return 'status-waitlisted';
      case 'Denied': return 'status-denied';
      default: return 'status-pending';
    }
  }

  // Add school button
  document.getElementById('addSchoolBtn').addEventListener('click', () => {
    document.getElementById('schoolModalTitle').textContent = 'Add School';
    document.getElementById('schoolForm').reset();
    document.getElementById('schoolEditId').value = '';
    modal.style.display = 'flex';
  });

  // Modal close
  document.getElementById('schoolModalClose').addEventListener('click', () => modal.style.display = 'none');
  modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

  // Save school
  document.getElementById('schoolForm').addEventListener('submit', async e => {
    e.preventDefault();
    const editId = document.getElementById('schoolEditId').value;
    const data = {
      name: document.getElementById('schoolName').value,
      deadline: document.getElementById('schoolDeadline').value,
      type: document.getElementById('schoolType').value,
      status: document.getElementById('schoolStatus').value,
      aid: document.getElementById('schoolAid').value,
      aidType: document.getElementById('schoolAidType').value,
      notes: document.getElementById('schoolNotes').value,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      if (editId) {
        await db.collection('students').doc(currentUser.uid).collection('schools').doc(editId).update(data);
      } else {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('students').doc(currentUser.uid).collection('schools').add(data);
      }
      modal.style.display = 'none';
      await loadSchools();
    } catch (err) {
      console.error('Error saving school:', err);
    }
  });

  // Edit school (global function for onclick)
  window.editSchool = function(id) {
    const s = schools.find(x => x.id === id);
    if (!s) return;
    document.getElementById('schoolModalTitle').textContent = 'Edit School';
    document.getElementById('schoolEditId').value = id;
    document.getElementById('schoolName').value = s.name || '';
    document.getElementById('schoolDeadline').value = s.deadline || '';
    document.getElementById('schoolType').value = s.type || 'RD';
    document.getElementById('schoolStatus').value = s.status || 'Applying';
    document.getElementById('schoolAid').value = s.aid || '';
    document.getElementById('schoolAidType').value = s.aidType || '';
    document.getElementById('schoolNotes').value = s.notes || '';
    modal.style.display = 'flex';
  };

  // Delete school (global function for onclick)
  window.deleteSchool = async function(id) {
    if (!confirm('Remove this school from your list?')) return;
    try {
      await db.collection('students').doc(currentUser.uid).collection('schools').doc(id).delete();
      await loadSchools();
    } catch (err) {
      console.error('Error deleting school:', err);
    }
  };
});
