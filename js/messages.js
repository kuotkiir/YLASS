// YLASS Portal — Messaging Logic

document.addEventListener('DOMContentLoaded', () => {
  const loadingState = document.getElementById('loadingState');
  const messagesContent = document.getElementById('messagesContent');
  const conversationsList = document.getElementById('conversationsList');
  const messagesList = document.getElementById('messagesList');
  let currentUser = null;
  let studentDoc = null;
  let isAdmin = false;
  let activeConversation = null;

  auth.onAuthStateChanged(async user => {
    if (!user || !user.emailVerified) { window.location.href = 'portal.html'; return; }
    currentUser = user;

    try {
      const doc = await db.collection('students').doc(user.uid).get();
      studentDoc = doc.exists ? doc.data() : {};
      isAdmin = studentDoc.isAdmin || false;

      if (isAdmin) {
        // Admin sees list of conversations
        conversationsList.style.display = 'block';
        await loadConversations();
      } else {
        // Student sees their own thread
        activeConversation = user.uid;
        loadMessages(user.uid);
      }

      loadingState.style.display = 'none';
      messagesContent.style.display = 'block';
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  });

  document.getElementById('navLogout').addEventListener('click', e => {
    e.preventDefault();
    auth.signOut().then(() => window.location.href = 'portal.html');
  });

  // Admin: load all students for conversation list
  async function loadConversations() {
    try {
      const snapshot = await db.collection('students').orderBy('name').get();
      conversationsList.innerHTML = '<h2 class="card-title" style="margin-bottom:12px;">Students</h2>';
      snapshot.docs.forEach(doc => {
        const s = doc.data();
        const div = document.createElement('div');
        div.className = 'conversation-item';
        div.dataset.uid = doc.id;
        div.innerHTML = `
          <span class="conversation-name">${s.name || s.email}</span>
          <span class="conversation-cohort">${s.classYear || s.cohort || ''}</span>
        `;
        div.addEventListener('click', () => {
          document.querySelectorAll('.conversation-item').forEach(c => c.classList.remove('active'));
          div.classList.add('active');
          activeConversation = doc.id;
          loadMessages(doc.id);
        });
        conversationsList.appendChild(div);
      });
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  }

  // Load messages for a conversation
  function loadMessages(studentUid) {
    // Use real-time listener
    db.collection('messages')
      .where('studentUid', '==', studentUid)
      .orderBy('sentAt', 'asc')
      .onSnapshot(snapshot => {
        if (snapshot.empty) {
          messagesList.innerHTML = '<p class="docs-empty">No messages yet. Start the conversation below.</p>';
          return;
        }

        messagesList.innerHTML = '';
        snapshot.docs.forEach(doc => {
          const msg = doc.data();
          const isMine = msg.senderUid === currentUser.uid;
          const div = document.createElement('div');
          div.className = `message-bubble ${isMine ? 'sent' : 'received'}`;
          div.innerHTML = `
            <div class="message-sender">${msg.senderName || 'Unknown'}</div>
            <div class="message-text">${escapeHtml(msg.text)}</div>
            <div class="message-time">${msg.sentAt ? new Date(msg.sentAt.seconds * 1000).toLocaleString() : ''}</div>
          `;
          messagesList.appendChild(div);
        });

        // Scroll to bottom
        messagesList.scrollTop = messagesList.scrollHeight;
      }, err => {
        console.error('Error loading messages:', err);
      });
  }

  // Send message
  document.getElementById('composeForm').addEventListener('submit', async e => {
    e.preventDefault();
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text || !activeConversation) return;

    try {
      await db.collection('messages').add({
        studentUid: isAdmin ? activeConversation : currentUser.uid,
        senderUid: currentUser.uid,
        senderName: studentDoc.name || currentUser.email,
        isFromAdmin: isAdmin,
        text: text,
        sentAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      input.value = '';
    } catch (err) {
      console.error('Error sending message:', err);
    }
  });

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
