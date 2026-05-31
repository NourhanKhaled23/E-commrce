# Open Fashion E-Commerce

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/NourhanKhaled23/E-commrce)

A full-featured Angular e-commerce application with admin, seller, and customer roles.

Live Demo: [your-vercel-url]
GitHub: https://github.com/NourhanKhaled23/E-commrce

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@openfashion.com | admin123 |
| Seller | seller@openfashion.com | seller123 |
| Customer | customer@openfashion.com | customer123 |

## Features
- Product browsing with search, filters, pagination
- Category-based filtering with parent/child support
- Shopping cart & checkout (guest + authenticated)
- Order tracking with status timeline
- Admin & Seller dashboards
- Profile with avatar upload
- Dark/Light mode
- Arabic/English i18n

## Development

```bash
npm install
ng serve
```

## Production Build

```bash
npm run build -- --configuration=production
# Output: dist/e-commerce/browser
```
