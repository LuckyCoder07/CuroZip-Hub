# CuroZip Hub Platform

Welcome to the **CuroZip Hub Platform** repository! This application is designed specifically for **Hub Managers** and **Delivery Partners** to manage and fulfill logistics and delivery operations seamlessly. 

The Hub Portal serves as the operational nerve center for individual hubs, allowing managers to oversee orders, handle last-mile deliveries, and assign tasks to delivery partners.

## 🚀 Features

### For Hub Managers
- **Dashboard Overview:** Monitor key metrics like new orders today, in-transit parcels, and today's deliveries. View pending assignments and hub specific stats at a glance.
- **Order Management:** Track and process orders routed through your hub. Quickly assign vendors, pickup partners, and delivery partners.
- **Delivery Partners Management:** View, add, and manage your local fleet of delivery partners.
- **Customers Overview:** View sending and receiving customers associated with your hub's orders.
- **Bulk Status Updates:** Efficiently update the status of multiple orders simultaneously (e.g., mark a batch as "Received at Hub").
- **Profile Management:** Update personal information and change your password.

### For Delivery Partners
- **My Orders View:** Access a mobile-friendly view of active and completed orders assigned specifically to you.
- **One-Tap Actions:** Quickly mark orders as "Picked Up", "Delivered", or "Failed/Returned" (with reason notes).
- **Profile Management:** Manage your account details and password on the go.

### Public Features
- **Real-Time Tracking:** A public `/track` page where anyone can enter their tracking ID to view the full shipment lifecycle and timeline without needing to log in.

## 🛠️ Technology Stack
- **Framework:** React + Vite
- **Styling:** Tailwind CSS (Vanilla CSS + modern utility classes)
- **Icons:** Lucide React
- **Charting:** Recharts
- **HTTP Client:** Axios
- **State Management:** React Context (Auth, Toast Notifications)

## 🎨 UI/UX Design Highlights
- **Modern Dark Theme:** Premium `#0a0e1a` background with vibrant `#f97316` (orange) accents.
- **Animations:** Smooth micro-animations for page transitions, loading spinners, and interactive buttons.
- **Responsive Layout:** fully optimized for desktops (Hub Managers) and mobile devices (Delivery Partners).
- **Feedback & Notifications:** Integrated toast notifications and custom modals for immediate user feedback.

## 📦 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v16+) and `npm` installed.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/LuckyCoder07/CuroZip-Hub.git
   cd CuroZip-Hub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in Browser:**
   Navigate to `http://localhost:5178` (or the port specified by Vite) to view the application.

## 🔗 Related Repositories
- **CuroZip Admin Portal:** For Super Admins to manage the entire network, hubs, vendors, and global settings.
- **CuroZip Backend:** The Node.js/Express and MongoDB backend powering the CuroZip ecosystem.

---
*Built with ❤️ by the CuroZip Team.*
