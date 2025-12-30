import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { app } from "./firebase.js";

const auth = getAuth(app);
const db = getFirestore(app);

const logoutBtn = document.getElementById("logoutBtn");
const ordersSection = document.getElementById("ordersSection");

// --- Auth check & role validation ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {

      const role = userDoc.data().role;
      const allowedRole = "supervisor";

      if (role !== allowedRole) {
        alert("Access denied. Redirecting to your dashboard...");
        window.location.replace(`dashboard-${role}.html`);
      }

      const stationaryQuery = query(
            collection(db, "orders"),
            where("itemCategory", "in", ["Books", "Gifts", "Chocolates"])
        );

        onSnapshot(stationaryQuery, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderOrders(orders);
        });
    }
  } else {

    window.location.replace("login.html");
  }
});

// --- Render Orders ---
function renderOrders(orders) {
    ordersSection.innerHTML = "";

    if (orders.length === 0) {
        ordersSection.innerHTML = `<p style="padding:20px;color:#666;">No stationery orders yet.</p>`;
        return;
    }

    const section = document.createElement("div");
    section.className = "cards-grid";

    orders.forEach(o => {
        const card = document.createElement("div");
        card.className = "card orders-card";

        const createdAt = o.createdAt?.seconds
            ? new Date(o.createdAt.seconds * 1000).toLocaleString()
            : "Invalid date";

        card.innerHTML = `
            <h4>${o.itemName}</h4>
            <p><strong>Quantity:</strong> ${o.quantity || 1}</p>
            <p><strong>Ordered By:</strong> ${o.voyagerEmail || "Unknown"}</p>
            <p><strong>At:</strong> ${createdAt}</p>
        `;

        section.appendChild(card);
    });

    ordersSection.appendChild(section);
}

// --- Logout ---
logoutBtn?.addEventListener('click', () => {
    signOut(auth)
        .then(() => window.location.replace("login.html"))
        .catch(err => alert("Error logging out: " + err.message));
});

console.log("Supervisor dashboard loaded successfully.");
