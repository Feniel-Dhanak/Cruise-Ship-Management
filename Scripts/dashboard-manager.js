import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { app } from "./firebase.js";

const auth = getAuth(app);
const db = getFirestore(app);

const logoutBtn = document.getElementById("logoutBtn");
const bookingsSection = document.getElementById("bookingsSection");

let currentUser = null;

// --- Auth check ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {

      const role = userDoc.data().role;
      const allowedRole = "manager";

      if (role !== allowedRole) {
        alert("Access denied. Redirecting to your dashboard...");
        window.location.replace(`dashboard-${role}.html`);
      }

      onSnapshot(collection(db, "bookings"), (snapshot) => {
            renderBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }
  } else {

    window.location.replace("login.html");
  }
});


// --- Render bookings ---
function renderBookings(bookings) {
    bookingsSection.innerHTML = "";

    if (bookings.length === 0) {
        bookingsSection.innerHTML = `<p style="padding:20px;color:#666;">No bookings yet.</p>`;
        return;
    }

    const grid = document.createElement("div");
    grid.className = "cards-grid";

    bookings.forEach(b => {
        const card = document.createElement("div");
        card.className = "card bookings-card";

        const bookedAt = b.bookedAt ? new Date(b.bookedAt).toLocaleString() : "Invalid date";

        card.innerHTML = `
            <h4>${b.itemName}</h4>
            <p><strong>Category:</strong> ${b.itemCategory}</p>
            <p><strong>Booked By:</strong> ${b.voyagerEmail}</p>
            <p><strong>At:</strong> ${bookedAt}</p>
        `;
        
        grid.appendChild(card);

        bookingsSection.appendChild(grid);
    });
}

// --- Logout ---
logoutBtn?.addEventListener('click', () => {
    signOut(auth)
    .then(() => window.location.replace("login.html"))
    .catch(err => alert("Error logging out: " + err.message));
});

console.log("Manager dashboard loaded successfully.");
