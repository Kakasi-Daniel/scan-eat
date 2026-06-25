Ghidul Sistemului: admin-app și public-app

1. Povestea pe scurt (Scopul)
   Sistemul este format din două aplicații web construite în React, care lucrează constant împreună:

admin-app: Este „panoul de control” al restaurantului, dedicat personalului.

public-app: Este meniul digital interactiv al clientului, pe care acesta îl accesează super simplu, scanând codul QR de pe masă.

Magia din spate? Ambele aplicații comunică instantaneu prin Firebase Realtime Database. Pentru partea de administrare, am adăugat și Firebase Authentication, astfel încât doar personalul autorizat să aibă acces la datele sensibile.

2. Cum am construit totul (Arhitectură și Tehnologii)
   Am mers pe o arhitectură modernă, fără un backend clasic. Asta înseamnă că toată logica se întâmplă direct în interfață (frontend), iar datele se salvează și se citesc direct din Firebase.

Uite ce am folosit sub capotă:

Frontend: React 19, susținut de TypeScript și Vite pentru o dezvoltare rapidă.

Design (UI): Tailwind CSS v4 combinat cu componente gata făcute în stilul Radix/shadcn, pentru un aspect curat și modern.

Starea aplicației: Zustand, ca să ținem minte datele eficient și fără bătăi de cap.

Navigare: React Router.

Baza de date & Auth: Firebase Realtime Database și Firebase Auth (pentru admini).

Găzduire (Deploy): Totul e urcat pe Firebase Hosting, folosind setarea de tip multisite.

3. Cum e organizat codul
   Dacă arunci o privire în fișiere, lucrurile sunt împărțite simplu și logic:

Plaintext
restaurant-system/
admin-app/ # Aici stă codul pentru angajați
public-app/ # Aici e codul pentru clienți
database.rules.json # Regulile de securitate pentru baza de date
firebase.json # Configurările pentru hosting 4. Inima sistemului: Modelul de date (Realtime Database)
Informația este organizată pe patru mari categorii (noduri), gândite să fie ușor de citit:

Plaintext
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
notes: string 5. Aplicația echipei (admin-app)
Autentificare și Rute
Intrarea se face pe bază de email și parolă. Pentru a păstra lucrurile sigure, conturile noi pentru colegi se creează direct din Firebase Console, iar toate rutele interne sunt protejate (ProtectedRoute).

Pe scurt, avem aceste ecrane: /login, / (Dashboard), /menu, /tables, /orders și pagina detaliată pentru fiecare comandă (/orders/:orderId).

Ce poți face în aplicație?
Dashboard-ul: Îți arată pulsul restaurantului dintr-o privire (câte comenzi sunt active, cine a cerut nota, câte mese sunt ocupate și ce am finalizat deja).

Meniul: Aici adaugi sau modifici categoriile și preparatele. O regulă importantă de ținut minte: nu poți șterge o categorie dacă mai ai produse în ea. De asemenea, poți ascunde temporar un produs dacă ai rămas fără ingrediente (butonul available).

Mesele (Tables): Adaugi mese noi și generezi codurile QR pentru ele (linkul arată cam așa: ${VITE_PUBLIC_APP_URL}/table/{tableId}). Le poți descărca frumos în format PNG ca să le printezi. Tot de aici vezi statusul live al fiecărei mese.

Comenzile: Partea cea mai dinamică! Comenzile noi apar instant pe ecran, fără să dai refresh. Vezi masa, totalul, detaliile comenzii și statusul fiecărui produs (de la pending până la served). Când un client cere nota, ecranul te atenționează vizual și audio. După ce confirmi plata, masa se eliberează automat și comanda se mută în tab-ul „Completed”.

6. Experiența clientului (public-app)
   Aplicația clienților e gândită să fie super intuitivă. Traseul (fluxul) arată așa:

Clientul se așază la masă, scanează codul QR și ajunge pe link-ul unic al mesei lui.

Când apasă Start Order, sistemul îi creează comanda și marchează masa ca ocupată pentru ospătari.

Se uită prin meniu (bine organizat pe categorii) și își alege ce vrea apăsând butonul de +. Acolo poate alege cantitatea și poate lăsa un mesaj la bucătărie (ex: "fără ceapă").

Când dă Add to Order, produsele ajung la personal cu statusul de pending.

În secțiunea View Order, clientul vede live ce se întâmplă cu mâncarea lui.

La final, apasă Request Payment, alege cum vrea să plătească (Cash sau Card), iar după ce ospătarul confirmă încasarea, clientul primește un bon digital (View Receipt) pe care îl poate și printa la nevoie.

7. Cum comunică între ele (Sincronizarea)
   Aici intervin „puterile” Firebase-ului. admin-app este mereu cu ochii (onValue listeners) pe meniu, categorii, mese și comenzi. În același timp, telefonul clientului (public-app) este atent doar la masa lui și la comanda lui curentă. Când cineva face o modificare într-o parte, ea apare instant și în cealaltă.

8. Detalii tehnice: Configurare și Deploy
   Ambele aplicații au nevoie de cheile Firebase (VITE*FIREBASE*\*) în variabilele de mediu. În plus, admin-app are nevoie de VITE_PUBLIC_APP_URL pentru a ști cum să genereze link-urile pentru codurile QR.

În fișierul firebase.json am definit clar unde se duce codul fiecărei aplicații:

scan-eat-client ține fișierele din public-app/dist

scan-eat-admin ține fișierele din admin-app/dist

9. O notă importantă despre Securitate (Reguli Firebase)
   În database.rules.json am stabilit niște granițe clare:

Meniul și categoriile: Oricine le poate vedea, dar doar angajații autentificați pot face modificări.

Mesele: Oricine le poate vedea. Modificările se fac doar de către angajați, cu câteva mici excepții (ex: când clientul dă „Start Order” sau cere plata).

Comenzile: Momentan sunt deschise (read/write public) pentru a ușura testarea. Recomandare pentru producție: Aceste reguli trebuie întărite, astfel încât doar fluxurile stricte (creare comandă nouă, modificare status) să fie permise, pentru a evita modificări nedorite din exterior.
