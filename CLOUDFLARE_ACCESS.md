# Proteger el sitio con Cloudflare Access (guía)

Esta guía explica dos formas de proteger tu sitio con Cloudflare desde el nivel más seguro (recomendado) hasta una variante "link-only" mejorada usando un Cloudflare Worker.

Requisitos previos
- Tener un dominio y poder apuntarlo a Cloudflare (cambiar nameservers) o administrar la zona DNS desde Cloudflare.
- Una cuenta de Cloudflare (Zero Trust / Access) — la mayoría de cuentas incluyen la funcionalidad Access.

Opción A — Cloudflare Access (recomendado)
1. Añade tu sitio a Cloudflare y asegúrate de que el tráfico pase por Cloudflare (proxy activo, nube naranja) para el host que usarás (por ejemplo `player.tudominio.com`).
2. En el panel de Cloudflare, ve a **Zero Trust** (antes llamado Access) → **Access** → **Applications** → **Add an application**.
   - Tipo: **Self-hosted** application
   - Name: p. ej. `Mi Player privado`
   - Application domain: `https://player.tudominio.com` (o el dominio/subdominio donde vas a servir el sitio)
   - Session duration: elige el tiempo que dure una sesión (p. ej. 24h)
3. Después de crear la aplicación, añade una **Policy** de acceso:
   - Policy name: `Equipo interno` (por ejemplo)
   - Action: **Allow**
   - Include: **Emails** -> añade las direcciones de correo de las personas que quieres permitir (o `Emails ending in` para permitir todo un dominio, p. ej. `@midominio.com`).
   - (Opcional) Puedes configurar un proveedor de identidad (IdP) como Google, GitHub, Microsoft en **Authentication** → **Log in methods** y forzar a los usuarios a autenticar con dicho IdP.
4. Prueba el acceso: abre `https://player.tudominio.com` desde una ventana privada. Cloudflare te redirigirá a la pantalla de login de Access; una vez autenticado por el IdP y autorizado por la policy, verás tu sitio.

Ventajas:
- Autenticación robusta (SSO, MFA si lo requiere tu IdP).
- Control, auditoría y revocación desde Cloudflare (sin tocar el código).

Notas:
- No necesitas cambiar nada en el repositorio para usar Access — todo se gestiona en la consola Cloudflare.
- Si tu hosting es un servicio estático (Vercel, Netlify, S3, etc.) el flujo es el mismo: Cloudflare protege el dominio antes de llegar al hosting.

Opción B — Worker token-gate (link-only pero server-side)
Si prefieres poder compartir un enlace secreto (tipo `?k=TOKEN`) pero de forma más segura que exponer el token en HTML, puedes desplegar un Cloudflare Worker que:
- Valida un token contra un secreto almacenado en la configuración del Worker (no en el cliente).
- Si el token es válido, el Worker firma y escribe una cookie HttpOnly/secure y redirige al usuario limpiando el parámetro `k` de la URL.

Ventajas sobre la implementación cliente-side:
- El secreto no está embebido en el HTML público.
- La validación y firmado de la cookie ocurre server-side.

Ejemplo de despliegue del Worker (resumen):
1. Instala `wrangler` (CLI de Cloudflare):
   ```bash
   npm install -g wrangler
   wrangler login
   ```
2. Crea un proyecto Worker o usa el ejemplo incluido en este repositorio (`workers/token-gate/worker.js`).
3. Configura en `wrangler.toml` las variables de entorno del Worker:
   - `PASS_TOKEN` — el token que compartirás en el enlace (por ejemplo `s3cret-link-2025`)
   - `SIGN_SECRET` — clave para firmar cookies (al menos 32 bytes aleatorios)
4. Despliega:
   ```bash
   wrangler publish
   ```
5. En Cloudflare DNS crea un record para el subdominio que apunte al Worker (o enrutamiento mediante routes en `wrangler.toml`).

Limitaciones:
- Si alguien comparte el enlace, cualquiera con el token accederá — puedes revocar el token modificándolo en el binding del Worker.
- Para exigencias empresariales, usar Cloudflare Access con IdP es más apropiado.

Ejemplo y código de Worker se encuentra en `workers/token-gate/worker.js` dentro de este repositorio. Más abajo tienes instrucciones exactas de despliegue.

---

Si quieres, implemento el Worker de ejemplo y te doy las instrucciones paso a paso con los comandos de `wrangler` y el contenido de `wrangler.toml` que debes usar. O si prefieres, te guío para configurar Cloudflare Access con tu IdP y la política de emails.
