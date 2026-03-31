# mailqueue

SvelteKit-app voor het queueen en verzenden van uitgaande e-mail via SMTP.

## Onderdelen

- UI voor queue-overzicht en tokenbeheer
- UI voor SMTP servicebeheer
- Bearer-token API op `POST /api/v1/messages`
- Postgres als opslag voor tokens, SMTP services en queue
- Losse worker via `npm run worker`
- Drizzle migraties onder `drizzle/`, uit te voeren via `drizzle-kit migrate`
- Kubernetes manifests onder `infrastructure/`

## Lokale start

1. Installeer dependencies met `npm install`
2. Gebruik `.env` voor lokaal en `.env.production` voor cluster-secrets
3. Start migratie met `npm run db:migrate`
4. Start de app met `npm run dev`
5. Start de worker met `npm run worker`

Tokens zijn gekoppeld aan precies een SMTP service. SMTP usernames en passwords worden versleuteld opgeslagen met `ENCRYPTION_KEY`.
De `from` afzender is gekoppeld aan het token; API-clients kiezen dus niet zelf vrij een afzenderadres.

Voor cluster deployment:

```bash
./infrastructure/scripts/create-app-secret.sh
kubectl apply -k infrastructure/overlays/prod
```

Het script leest `.env.production` uit de repo-root en maakt daar de secret `mailqueue-app-env` in namespace `mailqueue` van.

## Releases

Gebruik release tags via npm:

```bash
npm version patch
```

De `preversion` hook weigert een dirty worktree. De `postversion` hook pusht `main` plus de tag, waarna `.github/workflows/release.yml` de image bouwt en de `release` branch met de nieuwe image tag bijwerkt.

## API voorbeeld

```bash
curl -X POST http://localhost:5173/api/v1/messages \
  -H 'Authorization: Bearer mq_xxx_yyy' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "user@example.com",
    "subject": "Welkom",
    "text": "Je account is actief"
  }'
```

## Nodemailer transport package

Deze repo bevat ook een losse npm-package voor apps die via Nodemailer naar mailqueue willen posten:

- [`packages/mailqueue/package.json`](/Users/marklindeman/Code/LDMax/mailqueue/packages/mailqueue/package.json)
- [`packages/mailqueue/README.md`](/Users/marklindeman/Code/LDMax/mailqueue/packages/mailqueue/README.md)

Die package heet `@mightymax/mailqueue`, is bedoeld voor publicatie op npmjs, en bevat Engelstalige documentatie inclusief een compleet SvelteKit server-action voorbeeld.
