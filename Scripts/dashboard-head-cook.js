import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { app } from "./firebase.js";

const auth = getAuth(app);
const db = getFirestore(app);

const logoutBtn = document.getElementById("logoutBtn");
const ordersSection = document.getElementById("ordersSection");

let currentUser = null;

// ---------------- Helper ----------------
function formatTimestamp(ts) {
    if (!ts) return "Processing...";
    if (ts.toDate && typeof ts.toDate === "function") return ts.toDate().toLocaleString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    return new Date(ts).toLocaleString();
}

// ---------------- Auth check ----------------
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const role = userDoc.data().role;
            const allowedRole = "head-cook";

            if (role !== allowedRole) {
                alert("Access denied. Redirecting to your dashboard...");
                window.location.replace(`dashboard-${role}.html`);
            }

            const cateringQuery = query(
                collection(db, "orders"),
                where("itemCategory", "in", ["Snacks", "Meals", "Beverages"])
            );

            onSnapshot(cateringQuery, (snapshot) => {
                const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderOrders(orders, "catering");
            });
        }
    } else {
        window.location.replace("login.html");
    }
});

// ---------------- Render Orders ----------------
function renderOrders(orders, categoryName) {
    ordersSection.innerHTML = "";

    if (orders.length === 0) {
        ordersSection.innerHTML = `<p style="padding:20px;color:#666;">No ${categoryName} orders yet.</p>`;
        return;
    }

    const section = document.createElement("div");
    section.className = "cards-grid";

    orders.forEach(o => {
        const card = document.createElement("div");
        card.className = "card orders-card";

        const createdAt = formatTimestamp(o.createdAt);

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

// ---------------- Logout ----------------
logoutBtn?.addEventListener('click', () => {
    signOut(auth)
        .then(() => window.location.replace("login.html"))
        .catch(err => alert("Error logging out: " + err.message));
});

console.log("Head-Cook dashboard loaded successfully.");

// --- Logout ---
logoutBtn?.addEventListener('click', () => {
    signOut(auth)
        .then(() => window.location.replace("login.html"))
        .catch(err => alert("Error logging out: " + err.message));
});

console.log("Head-Cook dashboard loaded successfully.");
