# Green Home Consult

- Hero is illustrative stock photography, not a company project. Daniel Chen / Unsplash: https://unsplash.com/photos/brown-wooden-bench-near-window-SoNaNOFT974
- Add approved real project records in app/projects.ts. Current work list is intentionally empty. No content management UI is included.
- Contact POST saves inquiries in D1, then calls Cloudflare Email Sending over HTTPS. SMTP sockets are unsupported on hosted Sites. SMTP's Email Sending API token can also authenticate this API.
- Required runtime configuration: an `EMAIL` Cloudflare Email Sending binding, restricted to send from and to `info@greenhomecons.net`, plus `CONTACT_FROM_EMAIL` and `CONTACT_TO_EMAIL`. Never put credentials in source or client code.
- Token registration and an actual delivery check are still required. SMTP setup alone does not connect the Site. No real email has been sent from this integration yet.
- Notification results are stored per inquiry. Queued/delivered API responses count as provider acceptance, not proof of inbox receipt. Unknown outcomes are not retried automatically. Failed email preserves the inquiry and shows an alternate contact address. Existing inquiries are not automatically emailed.
- /admin requires ChatGPT sign-in AND a matching server-side ADMIN_EMAIL runtime value. Empty configuration denies all readers. Set ADMIN_EMAIL through Sites before public operation. Never implement first-user-claims-admin behavior.
- Public launch should confirm qualification holder details and necessary corporate permits, actual business scopes, privacy handling, and the contact monitoring process.
- Company home street address is intentionally not displayed; city-level location suffices for the initial marketing draft.
