if (!self.define) {
  let e
  const s = {}
  const a = (a, i) => (
    (a = new URL(a + '.js', i).href),
    s[a] ||
      new Promise((s) => {
        if ('document' in self) {
          const e = document.createElement('script')
          ;((e.src = a), (e.onload = s), document.head.appendChild(e))
        } else ((e = a), importScripts(a), s())
      }).then(() => {
        const e = s[a]
        if (!e) throw new Error(`Module ${a} didn’t register its module`)
        return e
      })
  )
  self.define = (i, n) => {
    const c =
      e ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href
    if (s[c]) return
    const r = {}
    const t = (e) => a(e, c),
      h = { module: { uri: c }, exports: r, require: t }
    s[c] = Promise.all(i.map((e) => h[e] || t(e))).then((e) => (n(...e), r))
  }
}
define(['./workbox-cb477421'], function (e) {
  'use strict'
  ;(importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/_next/app-build-manifest.json',
          revision: '5191ff0262a83ee2d2bcf03bc148a741',
        },
        {
          url: '/_next/static/3hpe07FTT1AhlSHrPS4CF/_buildManifest.js',
          revision: '6310079bf1ae7bebeb6a2135896e4564',
        },
        {
          url: '/_next/static/3hpe07FTT1AhlSHrPS4CF/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/_next/static/chunks/1032-8a446a7ac6224ff5.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/1056-c686518fdf9bcc4b.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/108-92f4b6fec0ca0521.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/168-9666d1683743d766.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/2117-7618102bfd3aefcb.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/2650-7b813396d953c0e1.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/2695-232d80521126c8da.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/2931-d2d4f01ffbb5620f.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/2957-0d00dcae13b3c06e.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/2972-1d989784569d75da.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/3209-9682b10ab0e07b1b.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/3956-5e744998905e25dd.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/4438-0710328a64f5c0fb.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/4599-120503d00c6f4bfa.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/468.6abd150238504256.js',
          revision: '6abd150238504256',
        },
        {
          url: '/_next/static/chunks/5359-2cb9e34386020a80.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/560-61545bebdb43a4a8.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/584-8e83be23dd8f8159.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/589-c385308af9a9addb.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/5934-994a68ca733c1e45.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/6137-03d2cd0024eec2f8.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/6530-efa68bc218265306.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/6673-90330139227fd809.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/6934-703d3f951d2af412.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/7086-7965ec2dba7a7091.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/7426-dbd3272765d6d658.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/7456-59442d9c4da024f7.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/8183-3ef2504b80ac99d5.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/8865-4ca4d6b7b2199734.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/8950-96950db30e55cf9b.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/904-a3d4232619ae811b.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/9885-b614cebc3735714b.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/aaea2bcf-6962612a017290e0.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/(auth)/layout-8e1a5d064c19e572.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/(auth)/login/page-0e9ebe1e7effb44a.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/(auth)/registro/page-fbff6ec51c626570.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-7381533dafaddf55.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/admin/analytics/page-8a59f1388f633397.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/admin/auditoria/page-e8ec8d498d904c1a.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/admin/seguridad/page-674f17fc95c112f6.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/asesoria/page-7df46fea6ec2f8d2.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/asesoria/preguntas-frecuentes/page-c618ff50c2cd67c4.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/asesoria/regimen-tributario/page-fdea40f4c720bbd7.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/ayuda/page-296fc880e757b02a.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/biblioteca/page-6efc73d3a16d7a01.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/calendario/page-a8293bcd135a3b8e.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/dashboard/page-2ac53e549a4f2d46.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/facturacion/clientes/page-e1a2f3458a20fa0d.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/facturacion/facturas/page-c8176f8e9f0b4256.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/facturacion/mis-servicios/page-5e534a0f46c19225.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/facturacion/nueva/page-fc81eb6c6f1fda49.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/forgot-password/page-1880345d6af9f41c.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/herramientas/calculadoras/page-ee6ad07b78ac12a8.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/herramientas/page-68a1b6d533a1d1b1.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/herramientas/simuladores/page-3b78e242fbb9194b.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/layout-62bfc3475dc8b24c.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/mock-payment/page-7780a9080d43f613.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/notificaciones/page-ddd010408a08836b.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/onboarding/page-879c00b4ac26425e.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/onboarding/paso-2/page-c5aa356205678394.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/onboarding/paso-3/page-6573a3e4ddc24a6a.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/onboarding/paso-4/page-1a63ea7fdec82caf.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/page-d681125e0d6f3ac9.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/perfil/page-93da0517a42b1da9.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/perfil/privacidad/page-6c529bb96c440765.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/perfil/seguridad/page-936acf57512927cb.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/pila/comprobantes/page-f1bbe3f169932e54.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/pila/liquidar/page-56ef2850861021ca.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/pila/registro-inicial/page-45853c2fb1787fa5.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/politica-cookies/page-724371358ed06da0.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/politica-privacidad/page-900be67f4cbc26b5.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/privacy/confirm-deletion/%5Btoken%5D/page-57cb1f30eea9ccb3.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/reset-password/%5Btoken%5D/page-69e89b1118e0f306.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/terminos-asesoria/page-c2b339666367dc77.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/app/terminos-condiciones/page-2d35a6c7f1fe03d0.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/ca377847-85d99089638f5d91.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/e80c4f76-a61d79ba0918a31c.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/fd9d1056-ca04a0a7bb9349a7.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/framework-8e0e0f4a6b83a956.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/main-app-1114a2100aaee9b8.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/main-b27767185380b5f5.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/pages/_app-3c9ca398d360b709.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/pages/_error-cf5ca766ac8f493f.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-b61824f4b30c7c4e.js',
          revision: '3hpe07FTT1AhlSHrPS4CF',
        },
        {
          url: '/_next/static/css/2eea354556f22e73.css',
          revision: '2eea354556f22e73',
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
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      '/',
      new e.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: s,
              event: a,
              state: i,
            }) =>
              s && 'opaqueredirect' === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: 'OK',
                    headers: s.headers,
                  })
                : s,
          },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https?.*/,
      new e.NetworkFirst({
        cacheName: 'offlineCache',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ))
})
