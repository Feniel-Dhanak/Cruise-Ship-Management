import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, query, where, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { app } from "./firebase.js";

const auth = getAuth(app);
const db = getFirestore(app);

const logoutBtn = document.getElementById("logoutBtn");
const bookingsDiv = document.getElementById("myBookingsDiv");
const ordersDiv = document.getElementById("myOrdersDiv");

// Sample card data
const cardData = {
  "Movie": [{ name: "Titanic", time: "6 PM", seat: "A12", price: "$15" }, { name: "Avatar", time: "8 PM", seat: "B10", price: "$12" }],
  "Resort": [{ name: "Beach Resort", checkIn: "10 Oct", checkOut: "15 Oct", guests: 2 }, { name: "Mountain Resort", checkIn: "20 Oct", checkOut: "25 Oct", guests: 4 }],
  "Salon": [{ name: "Haircut", date: "1 Oct", time: "10:00 AM", staff: "Alice" }, { name: "Manicure", date: "1 Oct", time: "11:00 AM", staff: "Bob" }],
  "Spa": [{ name: "Massage", date: "5 Oct", time: "2:00 PM", staff: "Clara" }, { name: "Facial", date: "5 Oct", time: "3:00 PM", staff: "David" }],
  "Medical Consultation": [{ name: "General Checkup", date: "8 Oct", time: "9:00 AM", staff: "Dr. Smith" }, { name: "Dental", date: "9 Oct", time: "11:00 AM", staff: "Dr. Jane" }],
  "Gym": [{ name: "Weight Training", date: "2 Oct", time: "6:00 AM" }, { name: "Cardio", date: "3 Oct", time: "7:00 AM" }],
  "Yoga Classes": [{ name: "Morning Yoga", date: "4 Oct", time: "6:30 AM" }, { name: "Evening Yoga", date: "4 Oct", time: "5:30 PM" }],
  "Art Classes": [{ name: "Painting", date: "6 Oct", time: "3:00 PM" }, { name: "Sculpting", date: "6 Oct", time: "4:00 PM" }],
  "Event Hall": [{ name: "Wedding Event", date: "10 Oct", time: "6:00 PM", capacity: 100 }, { name: "Birthday Party", date: "12 Oct", time: "7:00 PM", capacity: 50 }],
  "Banquet Hall": [{ name: "Corporate Event", date: "15 Oct", time: "1:00 PM", capacity: 200 }, { name: "Dinner Party", date: "18 Oct", time: "8:00 PM", capacity: 80 }],
  "Snacks": [{ name: "Chips", quantity: "10 packs", price: "$20" }, { name: "Cookies", quantity: "5 packs", price: "$15" }],
  "Meals": [{ name: "Pizza", quantity: "2", price: "$25" }, { name: "Burger", quantity: "3", price: "$18" }],
  "Beverages": [{ name: "Coffee", quantity: "5 cups", price: "$10" }, { name: "Juice", quantity: "3 bottles", price: "$12" }],
  "Books": [{ name: "Novel A", quantity: "1", price: "$10" }, { name: "Novel B", quantity: "2", price: "$18" }],
  "Gifts": [{ name: "Mug", quantity: "2", price: "$12" }, { name: "Keychain", quantity: "3", price: "$9" }],
  "Chocolates": [{ name: "Milk Chocolate", quantity: "5", price: "$15" }, { name: "Dark Chocolate", quantity: "3", price: "$12" }]
};

let currentUser = null;

// ---------------- Auth & Role Check ----------------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const role = userDoc.data().role;
      if (role !== "voyager") {
        alert("Access denied. Redirecting to your dashboard...");
        window.location.replace(`dashboard-${role}.html`);
      }
      currentUser = user;
      loadMyBookings();
      loadMyOrders();
    }
  } else {
    window.location.replace("login.html");
  }
});

// ---------------- Navbar clicks ----------------
document.querySelector(".navbar").addEventListener("click", (e) => {
    const link = e.target.closest(".nav-link");
    if (!link) return;
    e.preventDefault();

    const parentItem = link.closest(".has-nested");
    let itemsByChild = {};

    if (parentItem && link.parentElement === parentItem) {
        const childrenLinks = Array.from(parentItem.querySelectorAll(".nested-dropdown .nav-link"));
        childrenLinks.forEach(cl => {
            const key = cl.textContent.trim();
            if (cardData[key]) itemsByChild[key] = cardData[key];
        });
        const parentTitle = parentItem.querySelector(".nav-link").textContent.trim();
        renderCards(itemsByChild);
    } else {
        const key = link.textContent.trim();
        if (cardData[key]) itemsByChild[key] = cardData[key];
        renderCards(itemsByChild);
    }
});

// ---------------- Render Cards ----------------
function renderCards(itemsByChild) {
    // Clear previous
    bookingsDiv.innerHTML = '<h2>My Bookings</h2>';
    ordersDiv.innerHTML = '<h2>My Orders</h2>';

    for (const [childName, items] of Object.entries(itemsByChild)) {
        const isBooking = ['Movie','Resort','Salon','Spa','Medical Consultation','Gym','Yoga Classes','Art Classes','Event Hall','Banquet Hall'].includes(childName);
        const container = isBooking ? bookingsDiv : ordersDiv;

        const sectionTitle = document.createElement('h3');
        sectionTitle.textContent = childName;
        sectionTitle.style.color = '#1e88e5';
        container.appendChild(sectionTitle);

        const gridDiv = document.createElement('div');
        gridDiv.className = 'cards-grid';
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = Object.entries(item).map(([k,v]) => `<p><strong>${k}:</strong> ${v}</p>`).join('');

            if (isBooking || !isBooking) {
                const btn = document.createElement('button');
                btn.textContent = isBooking ? 'Book' : 'Order';
                btn.className = 'action-btn';
                btn.style.cssText = 'margin-top:10px;padding:5px 10px;background:#1e88e5;color:white;border:none;border-radius:4px;cursor:pointer;';
                btn.addEventListener('click', async () => {
                    if (!currentUser) return alert("User not logged in!");
                    const colName = isBooking ? 'bookings' : 'orders';
                    try {
                        await addDoc(collection(db, colName), {
                            voyagerUid: currentUser.uid,
                            voyagerEmail: currentUser.email,
                            itemName: item.name,
                            itemCategory: childName,
                            createdAt: new Date().toISOString()
                        });
                        alert(`${isBooking ? 'Booking' : 'Order'} placed successfully for ${item.name}`);
                    } catch(err) {
                        alert("Error: " + err.message);
                    }
                });
                card.appendChild(btn);
            }
            gridDiv.appendChild(card);
        });
        container.appendChild(gridDiv);
    }
}

// ---------------- Load My Bookings ----------------
function loadMyBookings() {
    if (!currentUser) return;
    const bookingsQuery = query(collection(db, 'bookings'), where('voyagerUid', '==', currentUser.uid));
    onSnapshot(bookingsQuery, snapshot => {
        bookingsDiv.innerHTML = '<h2>My Bookings</h2>';
        snapshot.docs.forEach(docSnap => {
            const booking = docSnap.data();
            const card = document.createElement('div');
            card.className = 'card bookings-card';
            card.style.cssText = 'margin:10px 0; padding:15px; border-radius:8px; border:1px solid #ddd;';
            card.innerHTML = `
                <strong>${booking.itemName}</strong> <br>
                <small>Category: ${booking.itemCategory}</small><br>
                <small>Booked at: ${new Date(booking.createdAt).toLocaleString()}</small>
            `;
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.style.cssText = 'margin-top:10px;padding:5px 10px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;';
            cancelBtn.addEventListener('click', async () => {
                if (confirm(`Cancel booking for ${booking.itemName}?`)) {
                    try { await deleteDoc(doc(db, 'bookings', docSnap.id)); } 
                    catch(err) { alert("Error canceling: " + err.message); }
                }
            });
            card.appendChild(cancelBtn);
            bookingsDiv.appendChild(card);
        });
    });
}

// ---------------- Load My Orders ----------------
function loadMyOrders() {
    if (!currentUser) return;
    const ordersQuery = query(collection(db, 'orders'), where('voyagerUid', '==', currentUser.uid));
    onSnapshot(ordersQuery, snapshot => {
        ordersDiv.innerHTML = '<h2>My Orders</h2>';
        snapshot.docs.forEach(docSnap => {
            const order = docSnap.data();
            const card = document.createElement('div');
            card.className = 'card orders-card';
            card.style.cssText = 'margin:10px 0; padding:15px; border-radius:8px; border:1px solid #ddd;';
            card.innerHTML = `
                <strong>${order.itemName}</strong> <br>
                <small>Category: ${order.itemCategory}</small><br>
                <small>Ordered at: ${new Date(order.createdAt).toLocaleString()}</small>
            `;
            ordersDiv.appendChild(card);
        });
    });
}

// Toggle mobile nav
const hamburger = document.createElement("div");
hamburger.className = "hamburger";
hamburger.innerHTML = "&#9776;"; // ☰
document.querySelector(".navbar").appendChild(hamburger);

hamburger.addEventListener("click", () => {
  const navItems = document.querySelector(".nav-items");
  navItems.style.display = navItems.style.display === "flex" ? "none" : "flex";
});

// Toggle dropdowns on mobile
document.querySelectorAll(".nav-item.has-nested, .nav-item").forEach(item => {
  item.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
      const dropdown = item.querySelector(".dropdown, .nested-dropdown");
      if (dropdown) {
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
      }
    }
  });
});

// ---------------- Logout ----------------
logoutBtn?.addEventListener('click', async () => {
    try {
        await signOut(auth);
        currentUser = null;
        bookingsDiv.innerHTML = '';
        ordersDiv.innerHTML = '';
        window.location.replace("login.html");
    } catch(error) {
        alert("Error logging out: "+ error.message);
    }
});

console.log("Voyager dashboard loaded successfully with booking/order functionality.");
