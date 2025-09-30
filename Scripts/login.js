import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { app } from "./firebase.js";

const auth = getAuth(app);
const db = getFirestore(app);
const form = document.getElementById("loginForm");

// Map roles to their dashboards
const roleDashboards = {
  voyager: "dashboard-voyager.html",
  'head-cook': "dashboard-head-cook.html",
  manager: "dashboard-manager.html",
  supervisor: "dashboard-supervisor.html",
  admin: "dashboard-admin.html",
};

// Auto-redirect if already logged in
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) return;

    const role = userDoc.data().role;
    const dashboardPage = roleDashboards[role];

    if (dashboardPage) {
      window.location.replace(dashboardPage);
    } else {
      console.warn("Unknown role:", role);
      await auth.signOut();
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    await auth.signOut();
  }
});

// Handle login form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) throw new Error("User data not found");

    const role = userDoc.data().role;
    const dashboardPage = roleDashboards[role];

    if (dashboardPage) {
      window.location.replace(dashboardPage);
    } else {
      alert("Access denied for your role");
      await auth.signOut();
    }
  } catch (err) {
    console.error("Login error:", err.message);
    alert(err.message);
  }
});
