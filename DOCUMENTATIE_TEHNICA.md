# Documentație tehnică — `admin-app` și `public-app`

## 1. Scop

Sistemul este compus din două aplicații web React:

- **`admin-app`** — aplicația de administrare folosită de personal.
- **`public-app`** — aplicația pentru clienți, accesată prin QR code-ul mesei.

Ambele aplicații folosesc **Firebase Realtime Database** pentru sincronizare în timp real. `admin-app` folosește suplimentar **Firebase Authentication** pentru autentificarea personalului.

## 2. Arhitectură și stack

- **Frontend:** React 19 + TypeScript + Vite
- **UI:** Tailwind CSS v4 + componente UI (Radix/shadcn-style)
- **State management:** Zustand
- **Routing:** React Router
- **BaaS:** Firebase Realtime Database + Firebase Auth (admin)
- **Deploy:** Firebase Hosting (multisite)

Arhitectura este **fără backend custom**: logica de business rulează în frontend, iar datele sunt persistate direct în Firebase.

## 3. Structura proiectului

```text
restaurant-system/
  admin-app/
  public-app/
  database.rules.json
  firebase.json
```

## 4. Model de date (Realtime Database)

```text
tables/{tableId}
  name: string
  number: number
  status: "available" | "occupied" | "payment_requested"
  activeOrderId: string | null

categories/{categoryId}
  name: string
  order: number

menu/{itemId}
  title: string
  description: string
  price: number
  category: categoryId
  available: boolean
  createdAt: timestamp

orders/{orderId}
  tableId: string
  tableNumber: number
  status: "active" | "payment_requested" | "completed"
  paymentMethod: "cash" | "card" | null
  createdAt: timestamp
  completedAt: timestamp | null
  total: number
  items/{orderItemId}
    menuItemId: string
    title: string
    price: number
    quantity: number
    status: "pending" | "received" | "preparing" | "served"
    addedAt: timestamp
    notes: string
```

## 5. `admin-app` (Aplicația de administrare)

### 5.1 Autentificare

- Login pe email/parolă cu Firebase Auth.
- Crearea userilor și setarea parolelor se fac din **Firebase Console**.
- Rutele administrative sunt protejate prin `ProtectedRoute`.

### 5.2 Rute

- `/login`
- `/` — Dashboard
- `/menu` — Menu Management
- `/tables` — Table Management
- `/orders` — Order Management
- `/orders/:orderId` — Order Detail

### 5.3 Dashboard

Afișează în timp real:

- număr comenzi active;
- număr cereri de plată;
- mese ocupate din total;
- comenzi completate.

### 5.4 Menu Management

- Administrare categorii și produse.
- **Regulă:** categoria poate fi ștearsă doar dacă nu mai are produse.
- Add/Edit/Delete categorie.
- Add/Edit/Delete produs cu câmpuri:
  - `title`
  - `description`
  - `price` (numeric)
  - `category` (single select)
  - `available` (toggle vizibilitate în meniu)

### 5.5 Table Management

- Add table (`number`, `name` opțional).
- Delete table doar dacă este `available`.
- Generare QR pentru fiecare masă: `${VITE_PUBLIC_APP_URL}/table/{tableId}`.
- Descărcare QR în PNG (`Download PNG`).
- Afișare status masă: `available` / `occupied` / `payment_requested`.

### 5.6 Order Management

- Comenzile apar instant (listener real-time, fără refresh).
- Pentru fiecare comandă:
  - număr masă;
  - total;
  - timp de la creare;
  - iteme + cantitate + observații + status item.
- Flux status item: `pending → received → preparing → served`.
- Cererile de plată sunt evidențiate vizual + alertă audio.
- Plata se confirmă prin `Confirm Payment`, ceea ce:
  - setează comanda `completed`;
  - eliberează masa (`available`, `activeOrderId = null`).
- Comenzile finalizate sunt în tab-ul `Completed`.

## 6. `public-app` (Aplicația clienților)

### 6.1 Rute

- `/`
- `/table/:tableId`
- `/table/:tableId/menu`
- `/table/:tableId/order`
- `/receipt/:orderId`

### 6.2 Flux client

1. Clientul scanează QR-ul mesei și ajunge pe link-ul unic al mesei.
2. `Start Order` creează comanda și ocupă masa.
3. În meniu, produsele sunt grupate pe categorii.
4. La `+`, se deschide modal pentru:
   - cantitate;
   - note/opțiuni (alergeni, preferințe etc.).
5. `Add to Order` adaugă item-ul cu status inițial `pending`.
6. În `View Order`, clientul vede itemele și statusurile live.
7. `Request Payment` deschide modal cu opțiuni: `Cash` / `Card`.
8. După confirmarea plății din `admin-app`, apare `View Receipt`.
9. Bonul poate fi vizualizat și printat (`window.print()`).

## 7. Sincronizare în timp real

- `admin-app` ascultă continuu nodurile: `menu`, `categories`, `tables`, `orders`.
- `public-app` ascultă masa curentă + comanda curentă.
- Actualizările sunt propagate instant între aplicații prin Firebase listeners (`onValue`).

## 8. Configurare și deploy

### 8.1 Variabile de mediu

Ambele aplicații necesită variabile Firebase (`VITE_FIREBASE_*`).

În plus, `admin-app` folosește:

- `VITE_PUBLIC_APP_URL` pentru generarea link-urilor QR.

### 8.2 Hosting

`firebase.json` definește două site-uri:

- `scan-eat-client` → `public-app/dist`
- `scan-eat-admin` → `admin-app/dist`

## 9. Reguli Firebase (observație tehnică)

În `database.rules.json`:

- `menu` / `categories`: read public, write doar user autentificat.
- `tables`: read public, write autenticat (cu excepții punctuale pe `status` și `activeOrderId`).
- `orders`: read și write public.

Pentru producție, se recomandă întărirea regulilor pentru `orders` și update-uri pe `tables`, astfel încât doar fluxurile valide să fie permise.
