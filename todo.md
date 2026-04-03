# NEOXP Store - TODO

## Foundation
- [x] Dark cyberpunk theme (neon green #ccff00 + magenta #ff00b3) in index.css
- [x] Google Fonts (Inter + Noto Sans Thai) in index.html
- [x] Database schema: products, orders, order_items, cart_items, reviews
- [x] Server routers for all features

## Core Layout & Navigation
- [x] Responsive header with logo, nav, cart icon, user dropdown
- [x] Live trading ticker component (simulated forex data)
- [x] Animated background (particle stars)
- [x] Footer component with links and social icons

## Pages
- [x] Home page with hero, KPI stats, live trades feed, featured products, testimonials
- [x] Product catalog with filtering (category, search, sort)
- [x] Product detail page with specs, stats, tabs, buy button
- [x] User dashboard (purchases, downloads, order history, settings)
- [x] Admin panel (products CRUD, orders, user management, stats)
- [x] Cart page with item management
- [x] Checkout page with Stripe + bank transfer
- [x] Order success/confirmation page
- [x] About page
- [x] Contact page
- [x] 404 Not Found page

## Backend Features
- [x] Products CRUD procedures
- [x] Cart management procedures
- [x] Order creation and management
- [x] Stripe Checkout Session integration (real, opens in new tab)
- [x] Stripe webhook handler at /api/stripe/webhook
- [x] Secure download links with expiring tokens (1-year)
- [x] Admin notifications for new orders (notifyOwner)
- [x] Admin procedures (product/order/user management)
- [x] 6 demo NEOXP products seeded in database

## Testing
- [x] 20 vitest tests passing (auth, products, cart, orders, admin)
- [x] TypeScript clean (0 errors)

## Polish
- [x] Responsive design (mobile-first)
- [x] Loading states and empty states
- [x] Error handling throughout
- [x] Neon glow effects on buttons and cards
- [x] Category color coding for EA types
