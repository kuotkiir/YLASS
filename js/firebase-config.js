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

// Admin emails
const ADMIN_EMAILS = [
  'kuotkiir@stanford.edu',
  'kuotkiir@gmail.com',
  'info@ylass.org'
];

// Progress checklist template
const PROGRESS_TEMPLATE = {
  'SAT Preparation': [
    { id: 'sat-register', label: 'Register for SAT', done: false },
    { id: 'sat-khan', label: 'Complete Khan Academy SAT prep', done: false },
    { id: 'sat-practice1', label: 'Take practice test 1', done: false },
    { id: 'sat-practice2', label: 'Take practice test 2', done: false },
    { id: 'sat-exam', label: 'Take SAT exam', done: false }
  ],
  'TOEFL Preparation': [
    { id: 'toefl-register', label: 'Register for TOEFL', done: false },
    { id: 'toefl-study', label: 'Complete TOEFL study materials', done: false },
    { id: 'toefl-practice', label: 'Take practice test', done: false },
    { id: 'toefl-exam', label: 'Take TOEFL exam', done: false }
  ],
  'College Applications': [
    { id: 'app-commonapp', label: 'Create Common App account', done: false },
    { id: 'app-schoollist', label: 'Finalize school list', done: false },
    { id: 'app-personal-essay', label: 'Write personal essay', done: false },
    { id: 'app-supplements', label: 'Write supplemental essays', done: false },
    { id: 'app-submit', label: 'Submit applications', done: false }
  ],
  'Financial Aid': [
    { id: 'fin-css', label: 'Complete CSS Profile', done: false },
    { id: 'fin-idoc', label: 'Submit IDOC documents', done: false },
    { id: 'fin-schoolforms', label: 'Complete school-specific forms', done: false }
  ],
  'Interviews & Tests': [
    { id: 'int-initialview', label: 'Complete InitialView interview', done: false },
    { id: 'int-university', label: 'Complete university interviews', done: false }
  ],
  'Documents': [
    { id: 'doc-transcript', label: 'Request official transcripts', done: false },
    { id: 'doc-recs', label: 'Request recommendation letters', done: false },
    { id: 'doc-passport', label: 'Ensure passport is valid', done: false }
  ]
};
