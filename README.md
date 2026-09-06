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

## Environment variables

The contact form uses Cloudflare Email Sending. Configure secrets in the hosting environment and keep `.env` files out of Git.

- `CLOUDFLARE_EMAIL_ACCOUNT_ID`
- `CLOUDFLARE_EMAIL_API_TOKEN`
- `CONTACT_FROM_EMAIL`
- `CONTACT_TO_EMAIL`
