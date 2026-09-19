# Hilaly Outfit - Server (API)

Backend ya duka: **Node.js + Express + MongoDB (Mongoose) + Cloudinary**. JavaScript ya kawaida (ES modules), hakuna build step.

## Kuwasha

```bash
cd server
npm install
npm run dev      # development (inajiwasha upya ukibadilisha code)
npm start        # production
npm run seed     # ongeza bidhaa 9 za mwanzo + admin (haifuti chochote)
```

API inapatikana `http://localhost:5000/api` (jaribu `GET /api/health`).

Usanidi wote upo kwenye `server/.env`. Nakili `.env.example` kuwa `.env` kama haipo. **Usiweke `.env` kwenye git.**

## 1. Database (MongoDB)

Weka `MONGODB_URI` kwenye `.env`:

- **MongoDB Atlas (inapendekezwa, ina mpango wa bure):** `mongodb+srv://USER:PASS@cluster.mongodb.net/hilaly`
- **MongoDB ya kompyuta yako:** `mongodb://127.0.0.1:27017/hilaly`

`MONGODB_URI` ikiwa tupu kwenye development, server huwasha **database ya majaribio** (`mongodb-memory-server`) na kuhifadhi data kwenye `server/.data/db` ili isipotee ukizima server. Mara ya kwanza hupakua MongoDB (~dakika chache). Hii ni kwa majaribio TU - kwenye production server hukataa kuwaka bila `MONGODB_URI`.

> Usiendeshe `npm run seed` wakati `npm run dev` inaendelea ukiwa unatumia database ya majaribio (zote mbili hushindania folda moja). Server yenyewe hufanya seed kila inapowaka, kwa hiyo hauhitaji.

Kuanza upya database ya majaribio: zima server, futa folda `server/.data`, washa tena.

## 2. Akaunti ya admin

Weka `ADMIN_NAME`, `ADMIN_PHONE` na `ADMIN_PASSWORD` kwenye `.env`. Server inapowaka:

- kama hakuna mtumiaji mwenye namba hiyo -> admin hutengenezwa;
- kama yupo lakini si admin -> hupandishwa kuwa admin (password yake haibadiliki);
- kama admin yupo tayari -> hakuna kinachobadilika (kubadilisha `ADMIN_PASSWORD` baadaye HAIBADILISHI password iliyopo).

Admin huingia kupitia ukurasa uleule wa kuingia (`POST /api/auth/login`) kwa namba ya simu na password.

## 3. Cloudinary (picha za bidhaa)

Fungua akaunti kwenye <https://cloudinary.com>, kisha kwenye Dashboard nakili: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Picha huhifadhiwa kwenye folda ya `CLOUDINARY_FOLDER`.

Bila Cloudinary, admin bado anaweza kuongeza bidhaa kwa **kiungo cha picha** (`imageUrl`); akijaribu kupakia faili atapata ujumbe wa 503. `GET /api/config` huonyesha `cloudinaryEnabled`.

Picha: JPG / PNG / WEBP, ukubwa wa juu MB 5.

## 4. Malipo (`PAYMENT_DRIVER`)

- `simulator` (sasa): hakuna pesa halisi. Oda huanza `processing`, kisha frontend huita `POST /api/payments/simulate/:id` na `{ "decision": "approve" | "wrong_pin" | "cancel" }`.
- `gateway`: imehifadhiwa kwa aggregator halisi (Selcom, AzamPay, ClickPesa...). Kwa sasa hurudisha 501. Mahali pa kuunganisha pameandikwa kwa `TODO(gateway)` ndani ya `src/services/payments/gateway.js` (STK push) na `src/routes/payments.js` (webhook + uthibitisho wa sahihi).
- Webhook: `POST /api/payments/webhook` yenye header `x-webhook-secret: <PAYMENT_WEBHOOK_SECRET>` na body `{ reference, status: successful|failed|cancelled, reason? }`. Ni idempotent - oda iliyokwisha kamilika haibadilishwi tena.

Bei na jumla ya oda hukokotolewa na server kutoka database kila wakati - bei inayotumwa na browser hupuuzwa.

## 5. Production

- `NODE_ENV=production`, `MONGODB_URI` halisi, na `JWT_SECRET` ya angalau herufi 32 (server hukataa kuwaka bila hivyo):
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `CLIENT_ORIGIN` = anwani ya frontend (zitenganishe kwa koma kama ni nyingi). Kwenye development `http://localhost:<port yoyote>` huruhusiwa pia.
- Kuingia/kujisajili: maombi 20 kwa dakika 15 kwa kila IP (kila njia peke yake).

## Muundo

```
src/index.js      kuwasha: env -> DB -> seed -> listen
src/app.js        express app (inaweza kujaribiwa bila listen)
src/config        env, db, cloudinary
src/models        User, Product, Order
src/middleware    auth (requireAuth, requireAdmin), error, upload (multer)
src/routes        auth, products, orders, payments, admin, config
src/services/payments   index (kichagua driver), simulator, gateway (stub)
src/utils         phone, serialize, httpError
src/seed          products (data), ensure, run
```
