if (!self.define) {
  let t
  const e = {}
  const s = (s, a) => (
    (s = new URL(s + '.js', a).href),
    e[s] ||
      new Promise((e) => {
        if ('document' in self) {
          const t = document.createElement('script')
          ;((t.src = s), (t.onload = e), document.head.appendChild(t))
        } else ((t = s), importScripts(s), e())
      }).then(() => {
        const t = e[s]
        if (!t) throw new Error(`Module ${s} didn’t register its module`)
        return t
      })
  )
  self.define = (a, i) => {
    const c =
      t ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href
    if (e[c]) return
    const n = {}
    const u = (t) => s(t, c),
      r = { module: { uri: c }, exports: n, require: u }
    e[c] = Promise.all(a.map((t) => r[t] || u(t))).then((t) => (i(...t), n))
  }
}
define(['./workbox-cb477421'], function (t) {
  'use strict'
  ;(importScripts(),
    self.skipWaiting(),
    t.clientsClaim(),
    t.precacheAndRoute(
      [
        {
          url: '/_next/app-build-manifest.json',
          revision: '0fad78bc6c7118c9d07adccbe994c011',
        },
        {
          url: '/_next/static/ZE9Sth9LwdWNlktSNfug2/_buildManifest.js',
          revision: '6310079bf1ae7bebeb6a2135896e4564',
        },
        {
          url: '/_next/static/ZE9Sth9LwdWNlktSNfug2/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/_next/static/chunks/1024-c28d5f585e82177b.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/1056-773a038bf72a2c22.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/1119-6191b5675631c610.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/164f4fb6-2b25e6031abd1f74.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/168-5ae7e1706f97f545.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/1749-f869b09a3f0a68ad.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/2117-d26264d5f33552d6.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/2340-600708d31b072be7.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/2366-c9e855b8caa2dbd3.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/2695-2cc5088e751e6352.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/2957-0d00dcae13b3c06e.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/2972-6f14452c7e57fb9d.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/2f0b94e8-873f1fff86411cc5.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/3209-9682b10ab0e07b1b.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/3340-109d261e4061a231.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/3689-3c8fc6f851c549c2.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/391-a7c3aa301f1e05e1.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/4438-0710328a64f5c0fb.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/4599-ce16c2ed6ab4435f.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/468.6abd150238504256.js',
          revision: '6abd150238504256',
        },
        {
          url: '/_next/static/chunks/5243.5491902035323dbf.js',
          revision: '5491902035323dbf',
        },
        {
          url: '/_next/static/chunks/560-d3e973b0ec8fbf13.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/583-a3bebdb2c672875c.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/589-be9591ded07aa7ec.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/5934-e15c53bd17524c7d.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/61-23ce220067ec66a2.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/6137-03d2cd0024eec2f8.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/616-3391cd313448b37d.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/6572-13ca5836d16daea8.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/6668-1e8e20257f43e4ec.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/6696-a2b9ebda83253f0f.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/6790-2a3e72e3f820fdcc.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/6885-c834a1fa8dedabfc.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/7086-7965ec2dba7a7091.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/7426-dbd3272765d6d658.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/8183-229cdeab44c4e79a.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/8848.604d673e614d3feb.js',
          revision: '604d673e614d3feb',
        },
        {
          url: '/_next/static/chunks/9027-ff700b87ed7921ec.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/904-a25a56543019d5da.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/9182-efbefa13526874b5.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/99-497a4e93a0e8f95d.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/aaea2bcf-6962612a017290e0.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/ad2866b8.df424f64adfa702a.js',
          revision: 'df424f64adfa702a',
        },
        {
          url: '/_next/static/chunks/app/(auth)/layout-8e1a5d064c19e572.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/(auth)/login/page-5824c3dd92660b23.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/(auth)/registro/page-e0efe63c3ffff479.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-2e02610573a32c83.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/admin/analytics/page-ebf802302b8d2147.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/admin/auditoria/page-3f880c6c2890b96f.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/admin/seguridad/page-fb3b3f8824e5c2fe.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/asesoria/page-ee0193deae71efc5.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/asesoria/preguntas-frecuentes/page-f89342d258d2848a.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/asesoria/regimen-tributario/page-43d0651909941246.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/ayuda/page-2fed7f02077ff3b5.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/biblioteca/page-edf9b06f34f64e28.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/calendario/page-20a9d00f89e38de8.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-aa666e5c3fe47d97.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/facturacion/clientes/page-b5eacd4fdd721f80.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/facturacion/facturas/page-551da7931dbade87.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/facturacion/mis-servicios/page-c9574b6aafd6443a.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/facturacion/nueva/page-dcb7c5520ef3b549.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/forgot-password/page-45b8869a1cb08b10.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/herramientas/calculadoras/page-c8621ea3b7a2f517.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/herramientas/page-6f4cc68d517670ff.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/herramientas/simuladores/page-46a45f7b5d259599.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/layout-118d21c6e7007dd9.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/mock-payment/page-68b32a7eb9098d92.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/notificaciones/page-073ee814c9235dbd.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/onboarding/page-86ce13e205fbc818.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/onboarding/paso-2/page-d8435f6d79429d49.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/onboarding/paso-3/page-4f5876993655a924.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/onboarding/paso-4/page-33219b48d2da4a9f.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/page-d681125e0d6f3ac9.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/perfil/page-787e5a5ba35a85ed.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/perfil/privacidad/page-6d0fd635d9178ce1.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/perfil/seguridad/page-3dde4507f3bcd192.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/pila/comprobantes/page-8aec17c6d2251eff.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/pila/liquidar/page-8c6101c3ef23456c.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/pila/registro-inicial/page-5bd916b19798740c.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/politica-cookies/page-724371358ed06da0.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/politica-privacidad/page-900be67f4cbc26b5.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/privacy/confirm-deletion/%5Btoken%5D/page-6a10308741aec725.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/reset-password/%5Btoken%5D/page-e14bd2f336b0ff37.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/terminos-asesoria/page-c2b339666367dc77.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/app/terminos-condiciones/page-2d35a6c7f1fe03d0.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/bc98253f.0646b3a425517e01.js',
          revision: '0646b3a425517e01',
        },
        {
          url: '/_next/static/chunks/ca377847-85d99089638f5d91.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/e80c4f76-a61d79ba0918a31c.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/fd9d1056-ca04a0a7bb9349a7.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/framework-8e0e0f4a6b83a956.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/main-app-1114a2100aaee9b8.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/main-b27767185380b5f5.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/pages/_app-3c9ca398d360b709.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/pages/_error-cf5ca766ac8f493f.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-53ad26e9b4f026b4.js',
          revision: 'ZE9Sth9LwdWNlktSNfug2',
        },
        {
          url: '/_next/static/css/331a7328622d61ce.css',
          revision: '331a7328622d61ce',
        },
        {
          url: '/_next/static/css/990910c8463239cc.css',
          revision: '990910c8463239cc',
        },
        {
          url: '/_next/static/css/a0d2f2e4aa89cf14.css',
          revision: 'a0d2f2e4aa89cf14',
        },
        {
          url: '/_next/static/css/e22327bc388712a9.css',
          revision: 'e22327bc388712a9',
        },
        {
          url: '/_next/static/media/19cfc7226ec3afaa-s.woff2',
          revision: '9dda5cfc9a46f256d0e131bb535e46f8',
        },
        {
          url: '/_next/static/media/21350d82a1f187e9-s.woff2',
          revision: '4e2553027f1d60eff32898367dd4d541',
        },
        {
          url: '/_next/static/media/8e9860b6e62d6359-s.woff2',
          revision: '01ba6c2a184b8cba08b0d57167664d75',
        },
        {
          url: '/_next/static/media/ba9851c3c22cd980-s.woff2',
          revision: '9e494903d6b0ffec1a1e14d34427d44d',
        },
        {
          url: '/_next/static/media/c5fe6dc8356a8c31-s.woff2',
          revision: '027a89e9ab733a145db70f09b8a18b42',
        },
        {
          url: '/_next/static/media/df0a9ae256c0569c-s.woff2',
          revision: 'd54db44de5ccb18886ece2fda72bdfe0',
        },
        {
          url: '/_next/static/media/e4af272ccee01ff0-s.p.woff2',
          revision: '65850a373e258f1c897a2b3d75eb74de',
        },
        { url: '/favicon.ico', revision: '7cb9abb9b5229521f004d5c5d84bbf50' },
        {
          url: '/icons/README.md',
          revision: 'ea230ea849bf82ca4d7030174520a91f',
        },
        {
          url: '/icons/icon-128x128.png',
          revision: '93ca32a536da1698ea979f183679af29',
        },
        {
          url: '/icons/icon-144x144.png',
          revision: '93ca32a536da1698ea979f183679af29',
        },
        {
          url: '/icons/icon-152x152.png',
          revision: '93ca32a536da1698ea979f183679af29',
        },
        {
          url: '/icons/icon-192x192.png',
          revision: '93ca32a536da1698ea979f183679af29',
        },
        {
          url: '/icons/icon-384x384.png',
          revision: '93ca32a536da1698ea979f183679af29',
        },
        {
          url: '/icons/icon-512x512.png',
          revision: '93ca32a536da1698ea979f183679af29',
        },
        {
          url: '/icons/icon-72x72.png',
          revision: '93ca32a536da1698ea979f183679af29',
        },
        {
          url: '/icons/icon-96x96.png',
          revision: '93ca32a536da1698ea979f183679af29',
        },
        { url: '/manifest.json', revision: 'c041e9325ca627c61fa71ecf1aa4cccb' },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    t.cleanupOutdatedCaches(),
    t.registerRoute(
      '/',
      new t.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({
              request: t,
              response: e,
              event: s,
              state: a,
            }) =>
              e && 'opaqueredirect' === e.type
                ? new Response(e.body, {
                    status: 200,
                    statusText: 'OK',
                    headers: e.headers,
                  })
                : e,
          },
        ],
      }),
      'GET'
    ),
    t.registerRoute(
      /^https?.*/,
      new t.NetworkFirst({
        cacheName: 'offlineCache',
        plugins: [
          new t.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ))
})
