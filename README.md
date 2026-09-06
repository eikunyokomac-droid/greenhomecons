# Green Home Consult

Source code for the Green Home Consult company website.

## Development

```bash
npm ci
npm run dev
```

## Build and test

```bash
npm run build
npm test
```

## Cloudflare Workers

Cloudflare production builds use `npm run build:cloudflare` and deploy with
`npm run deploy:cloudflare`. The deploy command applies the tracked D1
migrations before publishing the Worker.

## Environment variables

The contact form uses Cloudflare Email Sending. Configure secrets in the hosting environment and keep `.env` files out of Git.

- `CLOUDFLARE_EMAIL_ACCOUNT_ID`
- `CLOUDFLARE_EMAIL_API_TOKEN`
- `CONTACT_FROM_EMAIL`
- `CONTACT_TO_EMAIL`
