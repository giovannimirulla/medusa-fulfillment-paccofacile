# PaccoFacile API Reference (snapshot)

Nota: Questo file è uno snapshot della documentazione operativa fornita dall'integrazione. Mantienilo sincronizzato con le API ufficiali di PaccoFacile.

## Indice
- Configurazione
- Effettua chiamate API REST
- Rubrica
  - Introduzione
  - Elenco indirizzi
  - Dettaglio indirizzo
  - Aggiungi indirizzo
  - Modifica indirizzo
  - Elimina indirizzo
- Account
  - Introduzione
  - Dettaglio account
  - Credito Residuo
- Località
  - Introduzione
  - Ricerca di una località
- Shipment
  - Introduzione
  - Quotazione di una spedizione
  - Specifiche AccessoriRequest
  - Specifiche ShipmentParcelsRequest
  - Specifiche ShipmentAddressRequest
  - Creazione di una spedizione
  - Scelta della data di ritiro e del servizio
  - Servizi doganali
  - Utilizzo dei punti locker
  - Dettaglio spedizione
  - Recupero etichetta (New)
  - Acquisto della spedizione (New)
- Corrieri e servizi
  - Introduzione
  - Elenco corrieri
  - Elenco punti lockers

---

## Configurazione

Ambienti:
- Sandbox: https://paccofacile.tecnosogima.cloud/sandbox
- Live: https://paccofacile.tecnosogima.cloud/live

Versioning: anteporre la versione all'endpoint, ad es. `/sandbox/v1/service/address-book`

Headers richiesti:
- Authorization: `Bearer {access_token}`
- Account-Number: `{account_number}`
- Api-Key: `{api_key}`
- Content-Type: `application/json`

---

## Rubrica
CRUD sugli indirizzi (AddressBook Resource):

Proprietà principali: `id`, `customer_id`, `name`, `alias`, `reference`, `phone`, `email`, `category` (DEPARTURE, DEPARTURE-DEFAULT, SENDER, SENDER-DEFAULT, ARRIVAL), `locality` (iso_code, city, address, building_number | km_number, intercom_name, postal_code).

- Elenco indirizzi – GET – Response: `items: AddressBook[]`
- Dettaglio indirizzo – GET – Response: `data: AddressBook`
- Aggiungi indirizzo – POST – Body: vedi esempio nel testo fornito
- Modifica indirizzo – PUT – Body: vedi esempio nel testo fornito
- Elimina indirizzo – DELETE

---

## Account
- Dettaglio account – GET – Response: `customer_id, firstname, lastname, contact.email, contact.telephone, account.service, account.company`
- Credito residuo e PFcoin – GET – Response: `cashback.total, credit.value, credit.currency`

---

## Località
- Ricerca località – POST `/service/locality/validation` – Body: `{ iso_code, search, postal_code }`
- Response: `cap, locality, StateOrProvinceCode, iso_code, latitude, longitude`

---

## Shipment
### Quotazione di una spedizione – POST `/service/shipment/quote`
Request:
- `shipment_service.parcels[]` (vedi ShipmentParcelsRequest)
- `shipment_service.accessories[]` (vedi AccessoriRequest)
- `shipment_service.package_content_type` (GOODS | DOCUMENTS)
- `pickup`, `triangulation` (opzionale), `destination` (ShipmentAddressRequest)

ShipmentParcelsRequest:
- `shipment_type` (1: Pacco, 2: Pallet, 4: Valigia, 5: Busta)
- `default_size` per Busta/Valigia (LETTERA, PICCOLA, MEDIA, SMALL, MEDIUM, BIG, HUGE, CUSTOM)
- `weight`, `dim1`, `dim2`, `dim3`

ShipmentAddressRequest:
- `iso_code`, `postal_code`, `city`, `StateOrProvinceCode`
- Solo per creazione shipment: `header_name`, `address`, `building_number`|`km_number`, `phone`, `email`, `note`

Esempi request (singolo collo e multicollo) inclusi nel testo originale.

### Accessori principali
- Contrassegno (CREPAY, CREDBON, BON, PAYPAL) con strutture `price`, `price_account_charging`, `collect_method`, `refund_method`, `wire_transfer_detail` ove richiesto.
- Programmata (ID servizio 30) con disponibilità per giorno (`MORNING|AFTERNOON|NONE`).
- Appuntamento (ID 29) con `phone`.
- Stabilito (ID 31) con `delivery_date`.
- Al piano (ID 6), Ore 12 (ID 8), Ore 10 (ID 26), Ore 9 (ID 25), Sera (ID 27), Sabato (ID 28).
- Assicurazione (ID 7) con `parcels[].accessory_assurance_amount` e `accessories[].amount_total`.

### Creazione di una spedizione – POST `/service/shipment/save`
- Richiede `shipment_service.service_id` ottenuto dalla quote
- Supporta `pickup_date`, `pickup_range` (AM|PM)

### Acquisto spedizione – POST `/service/shipment/buy`
- Body: `{ shipments: number[], billing_type: 2|1, billing_date: "1"|"2", payment_method: "CREDIT" }`

### Dettaglio spedizione – GET (restituisce tracking, prezzi, indirizzi, ecc.)

### Recupero etichetta – GET (restituisce `content` base64, `format` pdf, `label` vari tipi)

### Locker
- Ricerca e uso dei campi `locker_id`, `locker_address`, etc. in `pickup`/`destination`.

---

## Corrieri e servizi
- Elenco corrieri – GET – Response: `service_id, service_name, carrier_id, carrier_name, carrier_ship_time, pickup_type, ...`
- Elenco punti lockers – GET – Parametri: `corriere_id`, `latitude`, `longitude` – Response: dettagli locker

---

Fonte: Contenuto fornito dall'utente (snapshot del 2025-11-07).