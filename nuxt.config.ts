// https://nuxt.com/docs/api/configuration/nuxt-config

// Cloudflare builds use D1; everywhere else (your machine) uses a local SQLite file.
const onCloudflare =
  (process.env.NITRO_PRESET ?? '').includes('cloudflare') ||
  !!process.env.CF_PAGES ||
  !!process.env.WORKERS_CI

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['nuxt-auth-utils'],

  css: ['~/assets/css/tokens.css', '~/assets/css/base.css'],

  vite: {
    optimizeDeps: {
      include: ['@vue/devtools-core']
    }
  },

  runtimeConfig: {
    // Server-only. Override with NUXT_RESEND_API_KEY / NUXT_EMAIL_FROM in .env
    resendApiKey: '',
    emailFrom: 'Brain Dump <onboarding@resend.dev>',
    session: {
      maxAge: 60 * 60 * 24 * 30 // stay signed in for 30 days
    },
    public: {
      // Used to build sign-in links. Override with NUXT_PUBLIC_SITE_URL
      siteUrl: 'http://localhost:3000'
    }
  },

  nitro: {
    // Cloudflare Workers (with static assets) is Nitro's recommended Cloudflare target.
    preset: onCloudflare ? 'cloudflare_module' : undefined,
    experimental: { database: true },
    database: {
      default: onCloudflare
        ? { connector: 'cloudflare-d1', options: { bindingName: 'DB' } }
        : { connector: 'node-sqlite', options: { name: 'braindump' } }
    },
    devDatabase: {
      default: { connector: 'node-sqlite', options: { name: 'braindump' } }
    }
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Brain Dump',
      titleTemplate: '%s · Brain Dump',
      meta: [
        // viewport-fit=cover lets the page use the full iPhone screen; safe-area padding keeps content clear of the notch and home bar
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content: 'A morning journal that turns each brain dump into a small solar system, colored by how you felt.'
        },
        { name: 'theme-color', content: '#FAF9F7' },
        // "Add to Home Screen" opens it like an app, without browser bars
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Brain Dump' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..600,100;1,9..144,300..600,100&display=swap'
        }
      ]
    }
  }
})
