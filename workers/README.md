Cloudflare Pages + Worker token-gate (gratis, rápido)
===============================================

Este directorio contiene un Worker que actúa como puerta (gate) para una Cloudflare Pages origin. Flujo:

- El Worker valida un token `?k=TOKEN` y, si es correcto, firma una cookie HttpOnly.
- Con la cookie firmada presente, el Worker proxifica la petición hacia la origin de Pages.
- Si no hay cookie válida, redirige a `locked.html` en la origin.

Archivos
- `worker.js` — el Worker que valida token y firma cookie, y proxifica.
- `wrangler.toml` — configuración mínima para publicar.

Pasos para desplegar
1. Instala wrangler y autentica:
   ```bash
   npm install -g wrangler
   wrangler login
   ```
2. Actualiza `wrangler.toml`: pon tu `account_id` y (opcional) `route` si quieres enlazar a un dominio.
3. Crea los secrets:
   ```bash
   wrangler secret put PASS_TOKEN
   wrangler secret put SIGN_SECRET
   wrangler secret put PAGES_ORIGIN
   ```
   - `PASS_TOKEN`: el token que compartirás en el enlace (ej. `s3cret-link-2025`).
   - `SIGN_SECRET`: clave larga (32+ bytes) para firmar cookies.
   - `PAGES_ORIGIN`: la URL de tu Pages origin, p. ej. `https://mi-player.pages.dev`.
4. Publica el Worker:
   ```bash
   wrangler publish
   ```

Cómo usarlo
- Navega a: `https://<your-worker>.workers.dev/?k=<PASS_TOKEN>`
- El Worker establecerá la cookie y te redirigirá a la URL sin `k`.
- A partir de entonces, las peticiones se proxifican a tu Pages origin si la cookie es válida.

Notas
- Para revocar el acceso, cambia el `PASS_TOKEN` (bórralo y crea uno nuevo) o cambia `SIGN_SECRET` para invalidar todas las cookies.
- Workers free tier tiene límites; para uso ligero no deberías tener problema.
