addEventListener('fetch', event => {
  event.respondWith(handle(event.request))
})

const encoder = new TextEncoder()

async function hmac(signKey, data) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(signKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

function parseCookies(header) {
  const obj = {}
  if (!header) return obj
  header.split(';').forEach(pair => {
    const idx = pair.indexOf('=')
    if (idx === -1) return
    const key = pair.slice(0, idx).trim()
    const val = pair.slice(idx + 1).trim()
    obj[key] = val
  })
  return obj
}

async function handle(request) {
  const url = new URL(request.url)
  const tokenParam = url.searchParams.get('k')

  const PASS_TOKEN = typeof PASS_TOKEN !== 'undefined' ? PASS_TOKEN : null
  const SIGN_SECRET = typeof SIGN_SECRET !== 'undefined' ? SIGN_SECRET : null
  const PAGES_ORIGIN = typeof PAGES_ORIGIN !== 'undefined' ? PAGES_ORIGIN : 'https://REPLACE_WITH_PAGES_URL'

  // token flow: if ?k=TOKEN present
  if (tokenParam) {
    if (!PASS_TOKEN || !SIGN_SECRET) return new Response('Server misconfigured', { status: 500 })
    if (tokenParam !== PASS_TOKEN) return new Response('Token inválido', { status: 403 })
    const cookieValue = 'ok'
    const sig = await hmac(SIGN_SECRET, cookieValue)
    const cookie = `__pg=${cookieValue}; Path=/; HttpOnly; Secure; SameSite=Lax;` + ` __pg_sig=${sig}; Path=/; HttpOnly; Secure; SameSite=Lax;`
    url.searchParams.delete('k')
    const clean = url.toString()
    return new Response(null, { status: 302, headers: { 'Location': clean, 'Set-Cookie': cookie } })
  }

  // check cookie and signature
  const cookies = parseCookies(request.headers.get('cookie') || '')
  if (cookies['__pg'] && cookies['__pg_sig'] && SIGN_SECRET) {
    const expected = await hmac(SIGN_SECRET, cookies['__pg'])
    if (expected === cookies['__pg_sig']) {
      // proxy to Pages origin
      const target = new URL(PAGES_ORIGIN)
      target.pathname = url.pathname
      target.search = url.search
      const proxied = new Request(target.toString(), request)
      return fetch(proxied)
    }
  }

  // otherwise redirect to locked page on origin (or show 403)
  return Response.redirect(PAGES_ORIGIN.replace(/\/$/, '') + '/locked.html', 302)
}
