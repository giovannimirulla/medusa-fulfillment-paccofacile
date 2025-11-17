# 📦 Pubblicazione Plugin su GitHub Packages

Guida per pubblicare `@giovannimirulla/medusa-fulfillment-paccofacile` come pacchetto npm privato su GitHub Packages.

## 🚀 Setup Iniziale (Una Tantum)

### 1. Crea Repository GitHub

```bash
# Dalla directory del plugin
cd /path/to/medusa-fulfillment-paccofacile

# Inizializza git (se non già fatto)
git init
git add .
git commit -m "Initial commit"

# Crea repo su GitHub e collega
git remote add origin https://github.com/giovannimirulla/medusa-fulfillment-paccofacile.git
git branch -M main
git push -u origin main
```

### 2. Verifica Configurazione

Il `package.json` è già configurato con:
```json
{
  "name": "@giovannimirulla/medusa-fulfillment-paccofacile",
  "version": "0.0.1",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com/"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/giovannimirulla/medusa-fulfillment-paccofacile.git"
  }
}
```

## 📤 Pubblicare Nuova Versione

### Opzione A: Automatica con GitHub Actions (Consigliata)

1. **Aggiorna versione** in `package.json`:
   ```bash
   # Patch (0.0.1 → 0.0.2)
   npm version patch
   
   # Minor (0.0.2 → 0.1.0)
   npm version minor
   
   # Major (0.1.0 → 1.0.0)
   npm version major
   ```

2. **Push tag**:
   ```bash
   git push origin main --tags
   ```

3. GitHub Actions pubblicherà automaticamente! 🎉

### Opzione B: Manuale

```bash
# 1. Build plugin
bun run build

# 2. Login GitHub (una volta)
npm login --registry=https://npm.pkg.github.com
# Username: giovannimirulla
# Password: [GitHub Personal Access Token con scope: write:packages]
# Email: tua-email@domain.com

# 3. Pubblica
npm publish
```

## 🔑 Creare GitHub Token (per publish manuale)

1. GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. **Generate new token (classic)**
3. Nome: `npm-publish-packages`
4. Scopes:
   - ✅ `write:packages`
   - ✅ `read:packages`
   - ✅ `delete:packages` (opzionale)
5. **Generate token** e copia

## 📥 Installare il Plugin (nel Backend)

### Setup Autenticazione

Crea/aggiorna `.npmrc` nel backend:
```bash
cd /path/to/backend
echo "@giovannimirulla:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> .npmrc
```

O usa variabile ambiente:
```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
```

### Installa Plugin

```bash
# Nel backend
bun add @giovannimirulla/medusa-fulfillment-paccofacile
```

### Configura in `medusa-config.ts`

```typescript
export default defineConfig({
  modules: [
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "@giovannimirulla/medusa-fulfillment-paccofacile/providers/paccofacile-fulfillment",
            id: "paccofacile",
            options: {
              api_key: process.env.PACCOFACILE_API_KEY,
              api_token: process.env.PACCOFACILE_API_TOKEN,
              account_number: process.env.PACCOFACILE_ACCOUNT_NUMBER
            }
          }
        ]
      }
    }
  ],
  plugins: [
    {
      resolve: "@giovannimirulla/medusa-fulfillment-paccofacile",
      options: {
        api_key: process.env.PACCOFACILE_API_KEY,
        api_token: process.env.PACCOFACILE_API_TOKEN,
        account_number: process.env.PACCOFACILE_ACCOUNT_NUMBER
      }
    }
  ]
})
```

## 🔄 Workflow Sviluppo

1. **Modifica codice** nel plugin
2. **Test locale** (con yalc se necessario)
3. **Commit cambio**: `git commit -am "feat: nuova feature"`
4. **Bump versione**: `npm version patch`
5. **Push + tag**: `git push origin main --tags`
6. **GitHub Actions pubblica** automaticamente
7. **Aggiorna backend**: `bun update @giovannimirulla/medusa-fulfillment-paccofacile`

## 🌐 Deploy su Render

Aggiungi env var su Render:
```
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
```

Render userà automaticamente `.npmrc` per installare i plugin privati.

## 🐛 Troubleshooting

### Errore 401/403 durante install
- Verifica `GITHUB_TOKEN` sia valido e abbia scope `read:packages`
- Controlla `.npmrc` contenga registry corretto

### Package non trovato
- Verifica il plugin sia pubblicato: https://github.com/giovannimirulla?tab=packages
- Controlla nome esatto: `@giovannimirulla/medusa-fulfillment-paccofacile`

### GitHub Actions fallisce
- Verifica permissions in workflow file (già configurato)
- `GITHUB_TOKEN` è automatico nelle Actions, non serve configurarlo

## 📚 Link Utili

- [GitHub Packages Docs](https://docs.github.com/en/packages)
- [npm version](https://docs.npmjs.com/cli/v10/commands/npm-version)
- [Medusa Plugin Development](https://docs.medusajs.com/v2/resources/plugins)
