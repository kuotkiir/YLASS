// YLASS — Application Form Logic

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('applyForm');
  const formContainer = document.getElementById('applicationForm');
  const successEl = document.getElementById('applicationSubmitted');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const errorEl = document.getElementById('applyError');
    const btn = document.getElementById('submitAppBtn');
    errorEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    const application = {
      fullName: document.getElementById('app-fullName').value.trim(),
      email: document.getElementById('app-email').value.trim(),
      phone: document.getElementById('app-phone').value.trim(),
      dob: document.getElementById('app-dob').value,
      city: document.getElementById('app-city').value.trim(),
      country: document.getElementById('app-country').value.trim(),
      school: document.getElementById('app-school').value.trim(),
      graduationYear: document.getElementById('app-graduationYear').value,
      gpa: document.getElementById('app-gpa').value.trim(),
      whyYlass: document.getElementById('app-whyYlass').value.trim(),
      goals: document.getElementById('app-goals').value.trim(),
      activities: document.getElementById('app-activities').value.trim(),
      challenges: document.getElementById('app-challenges').value.trim(),
      howHeard: document.getElementById('app-howHeard').value.trim(),
      status: 'Submitted',
      submittedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      await db.collection('applications').add(application);
      formContainer.style.display = 'none';
      successEl.style.display = 'block';
    } catch (err) {
      console.error('Application error:', err);
      errorEl.textContent = 'Error submitting application. Please try again.';
      errorEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Submit Application';
    }
  });
});
