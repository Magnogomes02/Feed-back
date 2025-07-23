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

// Inicializa Firebase só se não estiver já inicializado
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}