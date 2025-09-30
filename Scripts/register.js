import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { app } from "./firebase.js";

const auth = getAuth(app);
const db = getFirestore(app);

const form = document.getElementById("registerForm");

form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const role = document.getElementById("role").value; // Get role from dropdown
    const username = document.getElementById("username").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Create Firestore document for role-based access
        await setDoc(doc(db, "users", uid), {
            username: username,
            email: email,
            role: role,
            createdAt: new Date().toISOString()
        });

        console.log("User registered and Firestore doc created:", userCredential.user);
        window.location.replace(`dashboard-${role}.html`);

    } catch (error) {
        console.error("Error during registration:", error.code, error.message);
        alert(error.message);
    }
});
