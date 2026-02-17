// Firebase Configuration for YLASS Portal
const firebaseConfig = {
  apiKey: "AIzaSyCZmtUv_oh57BERz-gGdqYKBua2GNZrKjg",
  authDomain: "ylass-487601.firebaseapp.com",
  projectId: "ylass-487601",
  storageBucket: "ylass-487601.firebasestorage.app",
  messagingSenderId: "207090716871",
  appId: "1:207090716871:web:f6afcc4a6835e0f7736ee2",
  measurementId: "G-C4DNNLRXXC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Valid cohort codes
const VALID_COHORTS = {
  'YLASS2027': { name: 'First Cohort', classYear: 'Class of 2027' },
  'YLASS2028': { name: 'Second Cohort', classYear: 'Class of 2028' },
  'YLASS2029': { name: 'Third Cohort', classYear: 'Class of 2029' },
  'YLASS2030': { name: 'Fourth Cohort', classYear: 'Class of 2030' }
};

// Progress checklist template with deadlines
const PROGRESS_TEMPLATE = {
  'SAT Preparation': [
    { id: 'sat-register', label: 'Register for SAT', done: false, deadline: '' },
    { id: 'sat-khan', label: 'Complete Khan Academy SAT prep', done: false, deadline: '' },
    { id: 'sat-practice1', label: 'Take practice test 1', done: false, deadline: '' },
    { id: 'sat-practice2', label: 'Take practice test 2', done: false, deadline: '' },
    { id: 'sat-exam', label: 'Take SAT exam', done: false, deadline: '' }
  ],
  'TOEFL Preparation': [
    { id: 'toefl-register', label: 'Register for TOEFL', done: false, deadline: '' },
    { id: 'toefl-study', label: 'Complete TOEFL study materials', done: false, deadline: '' },
    { id: 'toefl-practice', label: 'Take practice test', done: false, deadline: '' },
    { id: 'toefl-exam', label: 'Take TOEFL exam', done: false, deadline: '' }
  ],
  'College Applications': [
    { id: 'app-commonapp', label: 'Create Common App account', done: false, deadline: '' },
    { id: 'app-schoollist', label: 'Finalize school list', done: false, deadline: '' },
    { id: 'app-personal-essay', label: 'Write personal essay', done: false, deadline: '' },
    { id: 'app-supplements', label: 'Write supplemental essays', done: false, deadline: '' },
    { id: 'app-submit', label: 'Submit applications', done: false, deadline: '' }
  ],
  'Financial Aid': [
    { id: 'fin-css', label: 'Complete CSS Profile', done: false, deadline: '' },
    { id: 'fin-idoc', label: 'Submit IDOC documents', done: false, deadline: '' },
    { id: 'fin-schoolforms', label: 'Complete school-specific forms', done: false, deadline: '' }
  ],
  'Interviews & Tests': [
    { id: 'int-initialview', label: 'Complete InitialView interview', done: false, deadline: '' },
    { id: 'int-university', label: 'Complete university interviews', done: false, deadline: '' }
  ],
  'Documents': [
    { id: 'doc-transcript', label: 'Request official transcripts', done: false, deadline: '' },
    { id: 'doc-recs', label: 'Request recommendation letters', done: false, deadline: '' },
    { id: 'doc-passport', label: 'Ensure passport is valid', done: false, deadline: '' }
  ]
};

// Application form fields
const APPLICATION_FIELDS = [
  { id: 'fullName', label: 'Full Name', type: 'text', required: true },
  { id: 'email', label: 'Email Address', type: 'email', required: true },
  { id: 'phone', label: 'Phone Number', type: 'tel', required: true },
  { id: 'dob', label: 'Date of Birth', type: 'date', required: true },
  { id: 'school', label: 'Current/Most Recent School', type: 'text', required: true },
  { id: 'graduationYear', label: 'Graduation Year', type: 'number', required: true },
  { id: 'gpa', label: 'GPA or Average Grade', type: 'text', required: true },
  { id: 'city', label: 'City', type: 'text', required: true },
  { id: 'country', label: 'Country', type: 'text', required: true },
  { id: 'whyYlass', label: 'Why do you want to join YLASS?', type: 'textarea', required: true },
  { id: 'goals', label: 'What are your academic and career goals?', type: 'textarea', required: true },
  { id: 'activities', label: 'List your extracurricular activities and achievements', type: 'textarea', required: true },
  { id: 'challenges', label: 'Describe a challenge you have overcome', type: 'textarea', required: false },
  { id: 'howHeard', label: 'How did you hear about YLASS?', type: 'text', required: false }
];
