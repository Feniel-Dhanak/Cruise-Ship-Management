import { 
    getAuth, signOut, onAuthStateChanged, createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
    getFirestore, doc, getDoc, collection, addDoc, onSnapshot, deleteDoc, query, where 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { app } from "./firebase.js";

const auth = getAuth(app);
const db = getFirestore(app);

const logoutBtn = document.getElementById("logoutBtn");
const dashboardContainer = document.querySelector('.dashboard-container');

let currentUser = null;

// --- Auth check ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const role = userDoc.data().role;

            if (role !== "admin") {
                alert("Access denied. Redirecting...");
                window.location.replace(`dashboard-${role}.html`);
            }
            console.log("Welcome, Admin!");

            // Start listening to live Firestore updates
            listenBookingsOrders();
            listenItems();
            listenVoyagers();
        }
    } else {
        window.location.replace("login.html");
    }
});

// --- Containers ---
const bookingsOrdersContainer = document.createElement("div");
bookingsOrdersContainer.id = "bookingsOrdersContainer";
dashboardContainer.appendChild(bookingsOrdersContainer);

// --- Section toggling ---
const manageItemsLink = document.getElementById("manageItemsLink");
const registerVoyagerLink = document.getElementById("registerVoyagerLink");

const addItemSection = document.getElementById("addItemSection");
const registerVoyagerSection = document.getElementById("registerVoyagerSection");

manageItemsLink.addEventListener("click", (e) => {
    e.preventDefault();
    addItemSection.style.display = "block";
    registerVoyagerSection.style.display = "none";
    bookingsOrdersContainer.style.display = "none";
});

registerVoyagerLink.addEventListener("click", (e) => {
    e.preventDefault();
    addItemSection.style.display = "none";
    registerVoyagerSection.style.display = "block";
    bookingsOrdersContainer.style.display = "none";
});

// --- Logout ---
logoutBtn?.addEventListener('click', () => {
    signOut(auth)
    .then(() => window.location.replace("login.html"))
    .catch(err => alert("Error logging out: " + err.message));
});

// ================= Firestore Listeners =================

// --- Bookings & Orders ---
function listenBookingsOrders() {
    onSnapshot(collection(db, "bookings"), (snapshot) => {
        renderAllBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    onSnapshot(collection(db, "orders"), (snapshot) => {
        renderAllOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
}

// Render all bookings
function renderAllBookings(bookings) {
    const oldDiv = document.getElementById("allBookings");
    if (oldDiv) oldDiv.remove();

    const div = document.createElement("div");
    div.id = "allBookings";
    div.className = "scrollable-section";
    div.style.marginTop = "30px";

    let html = `<h2>All Bookings</h2><div class="cards-grid">`;
    bookings.forEach(b => {
        html += `<div class="card bookings-card" style="margin-bottom:15px; padding:15px; border:1px solid #ddd; border-radius:8px; background:white;">
                    <p><strong>${b.itemName}</strong> (${b.itemCategory})</p>
                    <p>Booked by: ${b.voyagerEmail}</p>
                    <p>At: ${b.createdAt ? new Date(b.createdAt).toLocaleString() : "Invalid date"}</p>
                    <button class="cancel-btn" data-id="${b.id}" style="margin-top:5px;padding:5px 10px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;">Cancel</button>
                 </div>`;
    });
    html += `</div>`;
    div.innerHTML = html;
    bookingsOrdersContainer.appendChild(div);

    div.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const docId = btn.dataset.id;
            if (confirm("Cancel this booking?")) {
                try {
                    await deleteDoc(doc(db, "bookings", docId));
                } catch(err) {
                    alert("Error cancelling booking: " + err.message);
                }
            }
        });
    });
}

// Render all orders
function renderAllOrders(orders) {
    const oldDiv = document.getElementById("allOrders");
    if (oldDiv) oldDiv.remove();

    const div = document.createElement("div");
    div.id = "allOrders";
    div.className = "scrollable-section";
    div.style.marginTop = "30px";

    let html = `<h2>All Orders</h2><div class="cards-grid">`;
    orders.forEach(o => {
        html += `<div class="card orders-card" style="margin-bottom:15px; padding:15px; border:1px solid #ddd; border-radius:8px; background:white;">
                    <p><strong>${o.itemName}</strong> (${o.itemCategory})</p>
                    <p>Ordered by: ${o.voyagerEmail}</p>
                    <p>At: ${o.createdAt ? new Date(o.createdAt).toLocaleString() : "Invalid date"}</p>
                 </div>`;
    });
    html += `</div>`;
    div.innerHTML = html;
    bookingsOrdersContainer.appendChild(div);
}

// --- Message Helper ---
function showMessage(element, text, type="success", duration=3000) {
    element.className = `message-box ${type === "success" ? "message-success" : "message-error"}`;
    element.textContent = text;
    setTimeout(() => {
        element.textContent = "";
        element.className = "";
    }, duration);
}

// --- Items ---
const addItemForm = document.getElementById("addItemForm");
const itemsList = document.getElementById("itemsList");
const itemMessage = document.getElementById("itemMessage");

addItemForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const itemName = document.getElementById("itemName").value.trim();
    const itemType = document.getElementById("itemType").value;

    if (!itemName || !itemType) return alert("Please fill all fields");

    try {
        await addDoc(collection(db, "items"), {
            name: itemName,
            type: itemType,
            createdAt: new Date().toISOString()
        });
        showMessage(itemMessage, `Item "${itemName}" added successfully!`);
        addItemForm.reset();
    } catch(err) {
        showMessage(itemMessage, `Error adding item: ${err.message}`, "error");
    }
});

function listenItems() {
    const itemsCol = collection(db, "items");
    onSnapshot(itemsCol, snapshot => {
        itemsList.innerHTML = "";
        snapshot.docs.forEach(docSnap => {
            const item = docSnap.data();
            const li = document.createElement("li");
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.alignItems = "center";
            li.style.marginBottom = "5px";
            li.innerHTML = `<span>${item.name} (${item.type})</span>`;

            // Delete button
            const delBtn = document.createElement("button");
            delBtn.textContent = "Delete";
            delBtn.style.marginLeft = "10px";
            delBtn.style.padding = "3px 8px";
            delBtn.style.border = "none";
            delBtn.style.borderRadius = "4px";
            delBtn.style.background = "#f44336";
            delBtn.style.color = "white";
            delBtn.style.cursor = "pointer";

            delBtn.addEventListener("click", async () => {
                if (confirm(`Delete item "${item.name}"?`)) {
                    try {
                        await deleteDoc(doc(db, "items", docSnap.id));
                        showMessage(itemMessage, `Item "${item.name}" deleted successfully!`);
                    } catch(err) {
                        showMessage(itemMessage, `Error deleting item: ${err.message}`, "error");
                    }
                }
            });

            li.appendChild(delBtn);
            itemsList.appendChild(li);
        });
    });
}

// --- Voyagers ---
const registerVoyagerForm = document.getElementById("registerVoyagerForm");
const voyagersList = document.getElementById("voyagersList");
const voyagerMessage = document.getElementById("voyagerMessage");

registerVoyagerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("voyagerEmail").value.trim();
    const password = document.getElementById("voyagerPassword").value;

    if (!email || !password) return alert("Please fill all fields");

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        await addDoc(collection(db, "users"), {
            uid,
            email,
            role: "voyager",
            createdAt: new Date().toISOString()
        });

        showMessage(voyagerMessage, `Voyager "${email}" registered successfully!`);
        registerVoyagerForm.reset();
    } catch(err) {
        showMessage(voyagerMessage, `Error registering voyager: ${err.message}`, "error");
    }
});

// Listen to all voyagers
function listenVoyagers() {
    const usersQuery = query(collection(db, "users"), where("role", "==", "voyager"));
    onSnapshot(usersQuery, snapshot => {
        voyagersList.innerHTML = "";
        snapshot.docs.forEach(docSnap => {
            const voyager = docSnap.data();
            const li = document.createElement("li");
            li.style.display = "flex";
            li.style.justifyContent = "space-between";
            li.style.alignItems = "center";
            li.style.marginBottom = "5px";

            li.innerHTML = `<span>${voyager.email}</span>`;

            // Delete button
            const delBtn = document.createElement("button");
            delBtn.textContent = "Delete";
            delBtn.style.marginLeft = "10px";
            delBtn.style.padding = "3px 8px";
            delBtn.style.border = "none";
            delBtn.style.borderRadius = "4px";
            delBtn.style.background = "#f44336";
            delBtn.style.color = "white";
            delBtn.style.cursor = "pointer";

            delBtn.addEventListener("click", async () => {
                if (confirm(`Delete voyager "${voyager.email}"?`)) {
                    try {
                        await deleteDoc(doc(db, "users", docSnap.id));
                        showMessage(voyagerMessage, `Voyager "${voyager.email}" deleted successfully!`);
                    } catch(err) {
                        showMessage(voyagerMessage, `Error deleting voyager: ${err.message}`, "error");
                    }
                }
            });

            li.appendChild(delBtn);
            voyagersList.appendChild(li);
        });
    });
}

const hamburger = document.querySelector('.hamburger');
const navItems = document.querySelector('.nav-items');

hamburger?.addEventListener('click', () => {
    if (window.innerWidth <= 540) {
        navItems.style.display = navItems.style.display === 'flex' ? 'none' : 'flex';
        navItems.style.flexDirection = 'column';
        navItems.style.width = '100%';
        navItems.style.backgroundColor = '#1e88e5';
    }
});

document.addEventListener('click', (e) => {
    if (window.innerWidth <= 540) {
        if (!hamburger.contains(e.target) && !navItems.contains(e.target)) {
            navItems.style.display = 'none';
        }
    }
});


window.addEventListener('resize', () => {
    if (window.innerWidth > 540) {
        navItems.style.display = 'flex';
        navItems.style.flexDirection = 'row';
    } else {
        navItems.style.display = 'none';
    }
});

console.log("Admin dashboard loaded successfully with Items & Voyager management");
