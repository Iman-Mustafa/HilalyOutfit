# Hilaly Outfit — Duka la Mtandaoni na Malipo ya Simu

Duka la mavazi la Hilaly Outfit: kiolesura cha Kiswahili, mandhari nyeupe na dhahabu, malipo kwa M-Pesa, Tigo Pesa, Airtel Money na HaloPesa.

| Sehemu | Teknolojia | Mahali |
|---|---|---|
| Frontend | React 19, TypeScript, Vite, React Router | `src/` |
| Backend | Node.js, Express, JWT | `server/` |
| Database | MongoDB (Mongoose) | `MONGODB_URI` |
| Picha za bidhaa | Cloudinary | `CLOUDINARY_*` |

## Kuendesha

API iko hewani: **https://hilalyoutfit.onrender.com** (Render), imeunganishwa na MongoDB Atlas na Cloudinary.

```bash
npm install
npm run dev            # frontend ya hapa (http://localhost:5173) + API iliyo hewani — huhitaji kuwasha server
```

Kufanya kazi kwenye backend yenyewe:

```bash
npm --prefix server install
npm run dev:all        # frontend + API ya kompyuta hii (http://localhost:5000)
```

Frontend huongea na `/api` tu, na Vite huipeleka kwa server husika (`vite.config.ts`):

| Amri | API inayotumika | Faili |
|---|---|---|
| `npm run dev` | Render (hewani) | `.env.development` |
| `npm run dev:all` | `server/` ya kompyuta hii | `.env.localapi` |
| `npm run build` | Render (hewani), moja kwa moja | `.env.production` |

Faili hizi tatu zina anwani za wazi tu, hakuna siri. **Zingatia:** njia zote mbili za dev huandika kwenye data halisi — `server/.env` ya hapa nayo inaelekeza kwenye Atlas ileile.

**Kuweka frontend hewani:** server ya Render hukubali maombi ya browser kutoka kwenye anwani zilizoorodheshwa kwenye `CLIENT_ORIGIN` tu. Ukishaipa frontend anwani yake (mfano `https://hilalyoutfit.com`), iongeze kwenye `CLIENT_ORIGIN` kwenye Environment ya Render (tenganisha kwa koma), vinginevyo browser itazuia maombi yote (CORS). Mwenyeji wa frontend aelekeze njia zote kwenye `index.html` (SPA rewrite) ili `/bidhaa/...` na `/admin` zifunguke zikipakiwa upya.

Render ya bure hulala isipotumika; ombi la kwanza baada ya hapo linaweza kuchukua hadi dakika moja.

## Usanidi — `server/.env`

Mfano wenye maelezo ya kila kigezo upo `server/.env.example`. Usiweke `server/.env` kwenye git. Kwenye Render, vigezo hivi hivi huwekwa kwenye Environment ya huduma.

- **`MONGODB_URI`** — weka ya MongoDB Atlas au ya kompyuta yako. Ikiwa tupu wakati wa development, server huwasha MongoDB ya majaribio yenyewe na kuhifadhi data ndani ya `server/.data/` (mara ya kwanza hupakua takribani MB 780). **Si kwa matumizi halisi** — production hukataa kuwaka bila `MONGODB_URI`.
- **`ADMIN_PHONE` / `ADMIN_PASSWORD`** — akaunti ya msimamizi huundwa server inapowaka mara ya kwanza. Kubadilisha `ADMIN_PASSWORD` baadaye hakubadilishi password ya msimamizi aliyekwisha undwa.
- **`JWT_SECRET`** — angalau herufi 32; production hukataa kuwaka bila hiyo.
- **`CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET`** — bila hizi, msimamizi hawezi kupakia faili la picha; anaweza kutumia kiungo cha picha badala yake.
- **`PAYMENT_DRIVER`** — `simulator` kwa sasa (angalia "Malipo" hapa chini).

Bidhaa 9 za mwanzo huwekwa zenyewe database ikiwa tupu (`server/src/seed/products.js`).

## Jinsi mfumo unavyofanya kazi

- **Bidhaa** hutoka kwenye database. Kila bidhaa ina ukurasa wake kamili (`/bidhaa/:id`) wenye bidhaa zinazofanana.
- **Usajili kwanza**: mgeni akitaka kuweka kitu kikapuni au kulipa, huombwa kufungua akaunti — jina kamili, namba halali ya simu ya Tanzania na password (angalau herufi 8, zikiwemo herufi na namba). Baada ya kusajiliwa, kitendo alichokuwa anafanya huendelea chenyewe.
- **Malipo ya hatua moja**: namba ya simu ya kulipia na mahali pa kupokelea mzigo. Mteja haulizwi mtandao kamwe: jina la mtandao ni lebo tu inayokisiwa kutoka kwenye kiambishi cha namba (namba zinaweza kuhamishwa mtandao, na viambishi kama `070` havimo kwenye orodha), na oda yenye mtandao usiojulikana hurekodiwa kama `other` — gateway ndiyo hupeleka ombi la malipo kwa namba husika. Bei hazitumwi kutoka kwenye browser; server hukokotoa kiasi kutoka kwenye database.
- **Akaunti** (`/akaunti`): taarifa za mteja na oda zake.
- **Admin** (`/admin`): huhitaji kuingia kwa akaunti ya msimamizi. Ulinzi halisi uko kwenye server — kila njia ya `/api/admin/*` na ya kuhariri bidhaa hukagua kuwa mtumiaji ni msimamizi. Dashibodi ina miamala, kijaribio cha webhook, na usimamizi wa bidhaa (ongeza, hariri, futa, pakia picha).

## Malipo: hali ya sasa

`PAYMENT_DRIVER=simulator` haiwasiliani na mtandao wowote wa simu: oda huundwa kwenye database, kisha "simu ya mteja (demo)" hujitokeza kwenye skrini ili kuidhinisha au kukataa malipo. **Hakuna pesa halisi inayokatwa.**

Kuunganisha gateway halisi: jaza `server/src/services/payments/gateway.js` (mahali pa ombi la STK push na uthibitisho wa saini pameonyeshwa kwa `TODO`), weka `PAYMENT_DRIVER=gateway`, na uelekeze callback ya gateway kwenye `POST /api/payments/webhook` yenye header `x-webhook-secret`. Frontend haihitaji mabadiliko — tayari huuliza hali ya oda kila sekunde 3.

## Amri nyingine

```bash
npm run build      # kagua TypeScript na ujenge frontend
npm run lint       # oxlint
npm run seed       # weka bidhaa za mwanzo na msimamizi (server ikiwa imezimwa)
```

Maelezo zaidi ya backend: `server/README.md`.
