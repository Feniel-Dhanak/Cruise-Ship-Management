// Import the functions you need from the SDKs you need
import {initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR-API-KEY",
  authDomain: "YOUR-AUTH-DOMAIN",
  projectId: "YOUR-PROJECT-ID",
  storageBucket: "YOUR-STORAGE-BUCKET",
  messagingSenderId: "YOUR-SENDER-ID",
  appId: "YOUR-APP_ID"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);