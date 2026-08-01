// Configuration Firebase (clés publiques, sans risque à exposer côté client).
// Projet : pokemon-banlocke — Realtime Database utilisée pour stocker les
// votes et les partager en temps réel entre tous les visiteurs du site.
const firebaseConfig = {
  apiKey: "AIzaSyBI9ZsAlXA-8j7IJLkhOPu3bkD_qMkqeoQ",
  authDomain: "pokemon-banlocke.firebaseapp.com",
  databaseURL: "https://pokemon-banlocke-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pokemon-banlocke",
  storageBucket: "pokemon-banlocke.firebasestorage.app",
  messagingSenderId: "217761119282",
  appId: "1:217761119282:web:9224ffbdafd33ee020902b"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
