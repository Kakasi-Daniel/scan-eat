# Restaurant Ordering System

A real-time restaurant ordering system with two apps:

- **Public App** — Customer-facing mobile ordering (scan QR → browse menu → order → pay)
- **Admin App** — Staff dashboard for managing menu, tables, and orders

Built with React (Vite), Firebase Realtime Database, Zustand, Tailwind CSS v4, and shadcn/ui.

## Architecture

No backend server — pure BaaS (Backend as a Service) with Firebase:

- Firebase Realtime Database for data storage and real-time sync
- Firebase Auth for admin authentication
- Firebase Hosting for deployment (multisite)

## Prerequisites

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project

## Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" and follow the steps
3. Create a Web App (Project Settings → Add App → Web)
4. Copy the firebaseConfig values

### 2. Enable Firebase Services

**Realtime Database:**

1. In Firebase Console → Build → Realtime Database
2. Click "Create Database"
3. Choose your region
4. Start in **test mode** (we'll apply proper rules later)

**Authentication:**

1. In Firebase Console → Build → Authentication
2. Click "Get Started"
3. Enable **Email/Password** sign-in method
4. Go to the **Users** tab and manually create an admin account (email + password)

### 3. Configure Environment Variables

Copy the example env files and fill in your Firebase config:

```bash
# Public App
cp public-app/.env.example public-app/.env
# Edit public-app/.env with your Firebase config values

# Admin App
cp admin-app/.env.example admin-app/.env
# Edit admin-app/.env with your Firebase config values
# Also set VITE_PUBLIC_APP_URL to your public app's URL
```

### 4. Install Dependencies

```bash
cd public-app && npm install
cd ../admin-app && npm install
```

### 5. Deploy Database Rules

```bash
firebase deploy --only database
```

### 6. Run Locally

In two terminals:

```bash
# Terminal 1 — Public App (port 5173)
cd public-app
npm run dev

# Terminal 2 — Admin App (port 5174)
cd admin-app
npm run dev -- --port 5174
```

## Usage

### Getting Started

1. Open the **Admin App** at `http://localhost:5174`
2. Log in with the admin account you created in Firebase Console
3. Add some **categories** (e.g., Appetizers, Mains, Drinks)
4. Add some **menu items** to each category
5. Add some **tables** (e.g., Table 1, Table 2)
6. Click the QR code button on a table to generate its QR code

### Customer Flow

1. Customer scans the QR code → opens the **Public App** at `/{tableId}`
2. Clicks "Start Order" to begin
3. Browses the menu and adds items
4. Views their order with real-time status updates
5. When done, clicks "Request Payment" and selects Cash or Card
6. Waits for staff to confirm payment

### Staff Flow

1. Staff sees new orders appear in real-time on the **Orders** page
2. Updates item statuses: Pending → Received → Preparing → Served
3. When customer requests payment, a visual/audio alert appears
4. Staff clicks "Confirm Payment" to complete the order and free the table

## Deploying to Firebase Hosting

### 1. Set Up Multisite Hosting

In Firebase Console → Hosting → Add another site:

- Create site: `scan-eat-client`
- Create site: `scan-eat-admin`

### 2. Configure Targets

Edit `.firebaserc` and replace `your-firebase-project-id` with your actual project ID.

```bash
firebase target:apply hosting scan-eat-client scan-eat-client
firebase target:apply hosting scan-eat-admin scan-eat-admin
```

### 3. Build and Deploy

```bash
# Build both apps
cd public-app && npm run build
cd ../admin-app && npm run build
cd ..

# Deploy everything
firebase deploy
```

Your apps will be available at:

- Public: `https://scan-eat-client.web.app`
- Admin: `https://scan-eat-admin.web.app`

Don't forget to update `VITE_PUBLIC_APP_URL` in the admin app's `.env` to the production public app URL before building.

## Data Model

```
tables/{tableId}
  name, number, status, activeOrderId

menu/{itemId}
  title, description, price, category, available, createdAt

categories/{categoryId}
  name, order

orders/{orderId}
  tableId, tableNumber, status, paymentMethod, createdAt, completedAt, total
  items/{orderItemId}
    menuItemId, title, price, quantity, status, addedAt, notes
```

## Tech Stack

- **React** (Vite) — UI framework
- **React Router v6** — Client-side routing
- **Zustand** — State management
- **Tailwind CSS v4** — Styling
- **shadcn/ui** — UI component library
- **Firebase Realtime Database** — Data storage + real-time sync
- **Firebase Auth** — Admin authentication
- **Firebase Hosting** — Deployment
- **qrcode.react** — QR code generation
- **Lucide React** — Icons
