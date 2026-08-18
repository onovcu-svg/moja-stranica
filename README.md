# O novcu

Statički portal (bez build koraka). Vercel servira sve datoteke izravno.

## Deploy
1. Push ovaj repo na GitHub.
2. Import u Vercel (Framework Preset: Other, nema build commanda).
3. Postaviti env varijable u Vercel → Project Settings → Environment Variables:
   - BEEHIIV_API_KEY
   - BEEHIIV_PUBLICATION_ID
4. Deploy. vercel.json vec sadrzi SPA fallback rewrite za rutiranje.

## Struktura
- index.html - cijela stranica
- support.js - runtime skripta
- assets/ - logotipovi
- api/subscribe.js - Vercel serverless funkcija za newsletter (beehiiv)
- robots.txt, sitemap.xml - SEO
