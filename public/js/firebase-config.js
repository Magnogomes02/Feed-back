// js/firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyC-jc_0KeDoIxpHkFWsJRitgKnozDRxGNU",
  authDomain: "cubbotech-feedback.firebaseapp.com",
  projectId: "cubbotech-feedback",
  storageBucket: "cubbotech-feedback.appspot.com",
  messagingSenderId: "312047315630",
  appId: "1:312047315630:web:ac9ce18358d37d86af5b3f",
  measurementId: "G-QSF54T6YD6"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();
