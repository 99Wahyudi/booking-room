# StayEasy Booking — React + Vite

Faithful 1:1 conversion of the `stitch_stayeasy_web_design_system` HTML mockup into
a **React 18 + Vite + Tailwind CSS v3** application.

Every page component is a **direct port of the original `code.html`** — the same
markup and every original Tailwind class is preserved — so the visual design
matches the design system exactly. The Tailwind CDN `tailwind.config` was
extracted into `tailwind.config.cjs`, and the standalone inline scripts were
stripped in favour of routing/interactivity handled by React.

## Stack

- React 18 + react-router-dom (v6)
- Vite 5
- Tailwind CSS v3 (custom "Warm Modern Hospitality" design system)
- Material Symbols Outlined icons
- Fonts: Plus Jakarta Sans & Inter (Google Fonts)

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build -> dist/
npm run preview  # serve the built app
```

## Structure

```
src/
  main.jsx                 # entry / mounts BrowserRouter
  App.jsx                  # route table
  GlobalNav.jsx            # routes the design system's <a data-path="..."> links
  index.css                # Tailwind directives + base layer
  components/
    layout/
      PublicLayout.jsx     # used only by the extra /support page
      Navbar.jsx           # sticky navigation bar
    ui/
      Icon.jsx             # Material Symbols helper
      Logo.jsx             # StayEasy brand mark
  pages/                   # faithful 1:1 ports of each stitch page (own header+footer)
    Beranda.jsx                 -> /
    HasilPencarian.jsx          -> /search
    DetailKamar.jsx             -> /rooms/:slug
    KonfirmasiBooking.jsx       -> /booking/confirm
    BookingSaya.jsx             -> /bookings
    Login.jsx                   -> /login
    Register.jsx                -> /register
    Support.jsx                 -> /support   (small extra page)
  pages/admin/             # faithful ports (own admin header/sidebar)
    LoginAdmin.jsx              -> /admin/login
    DashboardAdmin.jsx          -> /admin
    KelolaKamar.jsx             -> /admin/rooms
    TambahKamar.jsx             -> /admin/rooms/new
    KelolaBooking.jsx           -> /admin/bookings
```

> `tailwind.config.cjs` and `postcss.config.cjs` are CommonJS (`.cjs`) because
> the package is `"type": "module"`.

## Notes

- Each page is a **full, self-contained layout** exactly as authored in the
  design system (it carries its own `<header>` and `<footer>`).
- The original anchors are `<a data-path="..." href="#">`; `src/components/GlobalNav.jsx`
  intercepts those clicks and maps them to react-router routes, so no markup had
  to change.
- The Tailwind token set (`primary`, `secondary`, `surface*`, `space-*`,
  `font-*`/`text-*` scales, etc.) is defined in `tailwind.config.cjs`.