# Complete E-Commerce App — Open Fashion UI Kit Implementation

Build out all 8 placeholder page components following the **Open Fashion - Free eCommerce UI Kit** Figma design system.

## User Review Required

> [!IMPORTANT]
> **Mobile-to-Web Adaptation**: The Open Fashion Figma kit is designed for **mobile apps** (375px width). Since your Angular app is a **web application**, I'll adapt the designs to be fully responsive — using the Figma's design language (colors, typography, spacing, component styles) but laid out for desktop/tablet/mobile web viewports. The mobile Figma screens will serve as the mobile breakpoint reference.

> [!IMPORTANT]
> **Design System Change**: The Open Fashion kit uses a **clean, white/light minimalist** aesthetic with **Bodoni Moda** serif headings — this is very different from the current **dark glassmorphism** theme. I will **replace the current dark theme** with the Open Fashion design system. The navbar will be redesigned to match.

## Open Questions

> [!IMPORTANT]
> **Which screens do you want?** The Open Fashion kit has ~30 screens. I'll focus on the ones that map to your existing routing structure. Let me know if you want any additional screens beyond what's listed below.

> [!IMPORTANT]
> **Authentication**: DummyJSON doesn't support real registration. The Register page will be a visual form that shows a success message but doesn't actually create accounts. Is that okay?

---

## Open Fashion Design System

| Token | Value |
|-------|-------|
| **Heading Font** | Bodoni Moda (Google Fonts) — serif, editorial |
| **Body Font** | Tenor Sans (Google Fonts) — clean sans-serif |
| **Primary Background** | `#FFFFFF` (white) |
| **Secondary Background** | `#F9F9F9` (off-white) |
| **Text Primary** | `#333333` (dark charcoal) |
| **Text Secondary** | `#555555` (medium gray) |
| **Text Muted** | `#999999` (light gray) |
| **Accent/CTA** | `#DD8560` (warm coral/terracotta) |
| **Border Color** | `#E0E0E0` (light gray) |
| **Error** | `#D32F2F` |
| **Success** | `#2E7D32` |
| **Spacer Line** | Thin horizontal rules with diamond/dot decorations |

---

## Proposed Changes

### 1. Design System Overhaul

#### [MODIFY] [styles.css](file:///d:/ITI/Angular/E-commerce/src/styles.css)
- Replace all CSS custom properties with Open Fashion palette (white bg, dark text, Bodoni Moda + Tenor Sans)
- Remove dark theme gradients, glassmorphism utilities
- Add new utility classes: `.section-title` (centered heading with decorative line), `.btn-primary-of` (coral CTA), `.btn-outline-of` (outlined button)
- Add Open Fashion card styles, spacing system

#### [MODIFY] [index.html](file:///d:/ITI/Angular/E-commerce/src/index.html)
- Update Google Fonts import to Bodoni Moda + Tenor Sans
- Update `<title>` to "Open Fashion"

---

### 2. Navbar Redesign

#### [MODIFY] [navbar.component.html](file:///d:/ITI/Angular/E-commerce/src/app/shared/components/navbar/navbar.component.html)
- Clean white/transparent navbar with centered logo text "Open Fashion" in Bodoni Moda
- Left: hamburger menu icon, Right: search + cart icons
- Minimal, elegant layout matching the kit's top bar

#### [MODIFY] [navbar.component.css](file:///d:/ITI/Angular/E-commerce/src/app/shared/components/navbar/navbar.component.css)
- Replace dark glassmorphism with clean white/light style
- Thin bottom border, minimal padding

---

### 3. Home / Product List Page

#### [MODIFY] [product-list.component.ts](file:///d:/ITI/Angular/E-commerce/src/app/products/product-list/product-list.component.ts)
- Inject `ProductService`, fetch products on init
- Implement category filtering, search
- Track loading state

#### [MODIFY] [product-list.component.html](file:///d:/ITI/Angular/E-commerce/src/app/products/product-list/product-list.component.html)
- **Hero banner** section with large fashion image and tagline
- **"New Arrival"** section title with decorative line
- **Category tabs** row (All, Beauty, Fragrances, Furniture, etc.)
- **Product grid**: 2-column on mobile, 3-4 column on desktop
- Each product card: thumbnail image, title, price, minimal hover effects
- Pagination or "Load More" button

#### [NEW] [product-list.component.css](file:///d:/ITI/Angular/E-commerce/src/app/products/product-list/product-list.component.css)
- Product grid layout, card styles, hero banner, category tabs

---

### 4. Product Details Page

#### [MODIFY] [product-details.component.ts](file:///d:/ITI/Angular/E-commerce/src/app/products/product-details/product-details.component.ts)
- Inject `ProductService`, `CartService`, `ActivatedRoute`
- Fetch product by ID from route params
- Add to cart functionality, quantity selector

#### [MODIFY] [product-details.component.html](file:///d:/ITI/Angular/E-commerce/src/app/products/product-details/product-details.component.html)
- Large product image (or gallery carousel if multiple images)
- Product title (Bodoni Moda), price, description
- Star rating display
- Quantity selector (+/- buttons)
- **"ADD TO CART"** button (coral, full-width on mobile)
- Product info accordion (Description, Reviews, Stock info)

#### [NEW] [product-details.component.css](file:///d:/ITI/Angular/E-commerce/src/app/products/product-details/product-details.component.css)
- Image gallery, product info layout, accordion styles

---

### 5. Login Page

#### [MODIFY] [login.component.ts](file:///d:/ITI/Angular/E-commerce/src/app/auth/login/login.component.ts)
- Inject `AuthService`, `Router`, `FormBuilder`
- Reactive form with username/password validation
- Login via DummyJSON API, redirect to products on success

#### [MODIFY] [login.component.html](file:///d:/ITI/Angular/E-commerce/src/app/auth/login/login.component.html)
- Clean centered form card
- "Open Fashion" heading
- Username/Password input fields with underline style
- "Sign In" coral button
- "Forgot Password?" link
- "New? Create Account" link to register
- Validation error messages

#### [NEW] [login.component.css](file:///d:/ITI/Angular/E-commerce/src/app/auth/login/login.component.css)
- Centered form styles, input underlines, button styles

#### [MODIFY] [auth.module.ts](file:///d:/ITI/Angular/E-commerce/src/app/auth/auth.module.ts)
- Import `ReactiveFormsModule`

---

### 6. Register Page

#### [MODIFY] [register.component.ts](file:///d:/ITI/Angular/E-commerce/src/app/auth/register/register.component.ts)
- Reactive form with name, email, password, confirm password
- Client-side validation
- Simulated registration with success message

#### [MODIFY] [register.component.html](file:///d:/ITI/Angular/E-commerce/src/app/auth/register/register.component.html)
- Same clean card layout as login
- Form fields: Name, Email, Password, Confirm Password
- "Create Account" coral button
- "Already have an account? Sign In" link

#### [NEW] [register.component.css](file:///d:/ITI/Angular/E-commerce/src/app/auth/register/register.component.css)

---

### 7. Cart Page

#### [MODIFY] [cart.component.ts](file:///d:/ITI/Angular/E-commerce/src/app/cart/cart/cart.component.ts)
- Inject `CartService`, `Router`
- Expose cart items, total, count
- Methods: update quantity, remove item, checkout (create order)

#### [MODIFY] [cart.component.html](file:///d:/ITI/Angular/E-commerce/src/app/cart/cart/cart.component.html)
- "Shopping Cart" page title
- Cart item rows: product thumbnail, title, price, quantity controls (−/+), remove (×) button
- Empty cart state with "Continue Shopping" button
- Order summary: subtotal, shipping, total
- "Checkout" coral button

#### [NEW] [cart.component.css](file:///d:/ITI/Angular/E-commerce/src/app/cart/cart/cart.component.css)

#### [MODIFY] [cart.module.ts](file:///d:/ITI/Angular/E-commerce/src/app/cart/cart.module.ts)
- Import `ReactiveFormsModule` (for checkout form if needed)

---

### 8. Order List Page

#### [MODIFY] [order-list.component.ts](file:///d:/ITI/Angular/E-commerce/src/app/orders/order-list/order-list.component.ts)
- Inject `OrderService`
- Display all orders from mock JSON

#### [MODIFY] [order-list.component.html](file:///d:/ITI/Angular/E-commerce/src/app/orders/order-list/order-list.component.html)
- "My Orders" page title
- Order cards: order ID, date, status badge (color-coded), total, item count
- Click to navigate to order details

#### [NEW] [order-list.component.css](file:///d:/ITI/Angular/E-commerce/src/app/orders/order-list/order-list.component.css)

---

### 9. Order Details Page

#### [MODIFY] [order-details.component.ts](file:///d:/ITI/Angular/E-commerce/src/app/orders/order-details/order-details.component.ts)
- Inject `OrderService`, `ActivatedRoute`
- Fetch order by ID from route params

#### [MODIFY] [order-details.component.html](file:///d:/ITI/Angular/E-commerce/src/app/orders/order-details/order-details.component.html)
- Order header: ID, date, status badge
- Shipping address card
- Item list with thumbnails and prices
- Order total summary

#### [NEW] [order-details.component.css](file:///d:/ITI/Angular/E-commerce/src/app/orders/order-details/order-details.component.css)

#### [MODIFY] [orders.module.ts](file:///d:/ITI/Angular/E-commerce/src/app/orders/orders.module.ts)
- Import `RouterModule` for `routerLink` usage in templates

---

### 10. Admin Dashboard

#### [MODIFY] [dashboard.component.ts](file:///d:/ITI/Angular/E-commerce/src/app/admin/dashboard/dashboard.component.ts)
- Inject `OrderService`, `UserService`, `ProductService`
- Display summary stats (total orders, users, products, revenue)

#### [MODIFY] [dashboard.component.html](file:///d:/ITI/Angular/E-commerce/src/app/admin/dashboard/dashboard.component.html)
- Stats cards row: Total Orders, Total Revenue, Total Products, Total Users
- Recent orders table
- Clean, minimal admin layout matching Open Fashion aesthetic

#### [NEW] [dashboard.component.css](file:///d:/ITI/Angular/E-commerce/src/app/admin/dashboard/dashboard.component.css)

---

### 11. Footer Component (NEW)

#### [NEW] [footer.component.ts](file:///d:/ITI/Angular/E-commerce/src/app/shared/components/footer/footer.component.ts)
#### [NEW] [footer.component.html](file:///d:/ITI/Angular/E-commerce/src/app/shared/components/footer/footer.component.html)
#### [NEW] [footer.component.css](file:///d:/ITI/Angular/E-commerce/src/app/shared/components/footer/footer.component.css)
- Social media icons row (Twitter, Instagram, YouTube)
- Links: About, Contact, Blog
- Copyright text
- Clean, centered footer matching Open Fashion kit

#### [MODIFY] [shared.module.ts](file:///d:/ITI/Angular/E-commerce/src/app/shared/shared.module.ts)
- Declare and export `FooterComponent`

#### [MODIFY] [app.component.html](file:///d:/ITI/Angular/E-commerce/src/app/app.component.html)
- Add `<app-footer>` below `<router-outlet>`

---

## Implementation Order

```
1. Design System (styles.css, index.html)          ← Foundation
2. Navbar Redesign                                   ← Visible immediately
3. Footer Component (NEW)                           ← Completes layout shell
4. Product List Page                                ← Main landing page
5. Product Details Page                             ← Core shopping flow
6. Login Page                                       ← Auth flow
7. Register Page                                    ← Auth flow
8. Cart Page                                        ← Shopping flow
9. Order List Page                                  ← Post-purchase
10. Order Details Page                              ← Post-purchase
11. Admin Dashboard                                 ← Admin area
```

## Verification Plan

### Automated Tests
- `ng build` — verify no compilation errors
- `ng serve` — visual verification in browser

### Manual Verification
- Navigate all routes and verify layouts match Open Fashion aesthetic
- Test responsive breakpoints (mobile, tablet, desktop)
- Test login flow with DummyJSON credentials (`emilys` / `emilyspass`)
- Test add to cart → view cart → checkout flow
- Verify orders display correctly from mock JSON data
