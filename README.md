# Mi Player — Sitio privado

Este repositorio contiene una demo de reproductor de música con soporte para proteger el acceso mediante Cloudflare Workers o Cloudflare Access.

Cómo desplegar (rápido)

- Opción Pages + Worker (recomendado, gratis): desplegar el sitio con Cloudflare Pages y protegerlo con el Worker `workers/token-gate/worker.js`. Sigue `workers/README.md`.
- Opción GitHub Pages: hay un workflow en `.github/workflows/pages.yml` que construye y publica `dist/` en `gh-pages`.

Comandos útiles

```bash
# instalar dependencias
npm install

# regenerar tracks.json desde ID3 (opcional)
npm run extract-metadata

# ejecutar dev server
npm run dev
```

Notas
- Asegúrate de no subir secretos ni `.env.local` al repo.
- Para proteger el sitio en producción usa Cloudflare Access o el Worker token-gate.
