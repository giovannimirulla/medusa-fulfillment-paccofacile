# API Store Endpoint - Località Validation

Questo endpoint permette allo storefront di validare e cercare località italiane utilizzando l'API di PaccoFacile.

## Endpoint

```
POST /store/paccofacile/locality/validation
```

## Descrizione

L'endpoint fornisce un'interfaccia per l'autocomplete degli indirizzi nello storefront. Quando l'utente digita il nome di una città durante il checkout, questo endpoint viene chiamato per ottenere suggerimenti di località valide con CAP e provincia.

## Request Body

```typescript
{
  iso_code?: string      // Codice ISO del paese (default: "IT")
  search?: string        // Termine di ricerca per la località
  postal_code?: string   // CAP da cercare
}
```

**Nota**: Almeno uno tra `search` o `postal_code` deve essere fornito.

## Response

```typescript
{
  localities: [
    {
      cap: string                    // Codice postale
      locality: string               // Nome della località
      StateOrProvinceCode: string    // Codice provincia (es. "MI")
      iso_code: string               // Codice ISO paese
      latitude?: number              // Latitudine (opzionale)
      longitude?: number             // Longitudine (opzionale)
    }
  ]
}
```

## Esempio di Utilizzo

### Request

```bash
curl -X POST http://localhost:9000/store/paccofacile/locality/validation \
  -H "Content-Type: application/json" \
  -d '{
    "iso_code": "IT",
    "search": "Milan"
  }'
```

### Response

```json
{
  "localities": [
    {
      "cap": "20121",
      "locality": "Milano",
      "StateOrProvinceCode": "MI",
      "iso_code": "IT",
      "latitude": 45.4642,
      "longitude": 9.1900
    },
    {
      "cap": "20122",
      "locality": "Milano",
      "StateOrProvinceCode": "MI",
      "iso_code": "IT",
      "latitude": 45.4642,
      "longitude": 9.1900
    }
  ]
}
```

## Configurazione

L'endpoint utilizza le seguenti variabili d'ambiente che devono essere configurate nel backend:

```env
PACCOFACILE_API_KEY=your_api_key
PACCOFACILE_API_TOKEN=your_access_token
PACCOFACILE_ACCOUNT_NUMBER=your_account_number
PACCOFACILE_ENVIRONMENT=sandbox  # o 'live'
```

## Errori

### 400 - Invalid Data

```json
{
  "type": "invalid_data",
  "message": "Either 'search' or 'postal_code' parameter is required"
}
```

Viene restituito quando la richiesta non contiene né `search` né `postal_code`.

### 400 - PaccoFacile credentials not configured

```json
{
  "type": "invalid_data",
  "message": "PaccoFacile credentials are not configured"
}
```

Viene restituito quando le credenziali PaccoFacile non sono configurate nel backend.

### 400 - Failed to validate locality

```json
{
  "type": "invalid_data",
  "message": "Failed to validate locality: 401 Unauthorized"
}
```

Viene restituito quando l'API di PaccoFacile restituisce un errore.

### 500 - Unexpected State

```json
{
  "type": "unexpected_state",
  "message": "An unexpected error occurred while validating locality"
}
```

Viene restituito in caso di errori imprevisti durante l'elaborazione.

## Integrazione con il Frontend

Questo endpoint è progettato per essere utilizzato dall'hook `use-address-autocomplete` nel frontend:

```typescript
// Nel frontend (storefront)
const response = await fetch(
  `${MEDUSA_BACKEND_URL}/store/paccofacile/locality/validation`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      iso_code: "IT",
      search: searchTerm,
    }),
  }
)

const data = await response.json()
// data.localities contiene l'array di località trovate
```

## Note Tecniche

- L'endpoint non richiede autenticazione (è pubblico per lo store)
- Implementa un debounce lato frontend (300ms) per evitare troppe chiamate
- Si consiglia di iniziare la ricerca solo dopo almeno 3 caratteri digitati
- L'API di PaccoFacile può restituire più risultati per una singola ricerca
- Le coordinate geografiche (latitude/longitude) sono opzionali e potrebbero non essere sempre presenti

## Performance

- La chiamata all'API di PaccoFacile è sincrona
- Tempo di risposta tipico: 200-500ms
- Si consiglia di implementare un timeout lato client (es. 5 secondi)
- Le risposte possono essere cachate lato client per query identiche

## Riferimenti

- [Documentazione API PaccoFacile](../../docs/paccofacile-api.md)
- [Frontend Integration Guide](../../../frontend/PACCOFACILE_ADDRESS_AUTOCOMPLETE.md)
