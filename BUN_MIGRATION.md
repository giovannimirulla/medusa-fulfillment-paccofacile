# Migrazione a Bun

Questo plugin ora utilizza **Bun** come runtime e package manager predefinito.

## Setup iniziale

### 1. Installa Bun (una sola volta)
```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Rimuovi vecchi lock files e node_modules
```bash
rm -f package-lock.json yarn.lock pnpm-lock.yaml
rm -rf node_modules
```

### 3. Installa le dipendenze con Bun
```bash
bun install
```

## Build e pubblicazione con yalc

```bash
# Build del plugin
bun build

# Pubblicazione locale via yalc
yalc publish --push
```

## Comandi principali

| Comando npm | Comando Bun |
|-------------|------------|
| `npm install` | `bun install` |
| `npm install <pkg>` | `bun add <pkg>` |
| `npm install -D <pkg>` | `bun add -d <pkg>` |
| `npm run build` | `bun build` |
| `npm run dev` | `bun dev` |

## Vantaggi di Bun

- ⚡ **25x più veloce** di npm/yarn
- 🎯 **All-in-one**: Runtime + bundler + test runner + package manager
- 💾 **Efficiente**: Usa meno risorse
- 🚀 **Zero config**: Funziona out-of-the-box

## Link utili

- [Bun Documentation](https://bun.sh/docs)
