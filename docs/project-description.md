# SmartCart Ecommerce Project Description

## Project Overview

SmartCart is a full-stack ecommerce web application built for selling clothes and accessories. The shop is organized into three main customer sections: Women, Men, and Babies. Each main section contains product types such as jeans, t-shirts, shoes, glasses, jackets, and bags.

The project allows customers to browse products, search for items, open product detail pages, add products to a cart, apply coupons, and complete checkout through Stripe. It also includes an admin dashboard where an administrator can create products, manage existing products, mark products as featured, and view business analytics.

The goal of the project is to demonstrate a realistic online store with both customer-facing and admin-facing functionality. It combines frontend design, backend API development, database modeling, authentication, payment processing, stock control, and a chatbot assistant.

## What The Project Does

SmartCart provides an online shopping experience where users can discover products by category or search. Customers can register an account, log in, add available products to their cart, update quantities, use discount coupons, and pay securely through Stripe Checkout.

The application also supports an administrator role. Admin users can access a protected dashboard where they can add new products, upload product images, assign products to the correct main category and product type, control stock, delete products, toggle featured products, and view analytics such as total users, total products, total sales, and revenue.

## Main User Roles

### Customer

A customer can:

- Create an account and log in.
- Browse the homepage.
- Search for products.
- View products by main category, such as Women, Men, or Babies.
- View products by product type, such as jeans, shoes, or jackets.
- Open a product detail page.
- See product price, description, image, category, and stock.
- Add products to the shopping cart.
- Increase or decrease cart quantities.
- Remove products from the cart.
- Apply an available coupon.
- Checkout using Stripe.
- See success or cancellation pages after checkout.
- Use the chatbot to ask about products, categories, recommendations, and stock.

### Administrator

An administrator can:

- Access the protected admin dashboard.
- Create new products.
- Add product name, description, price, stock, main category, product type, and image.
- View all products in the admin product table.
- Delete products.
- Mark or unmark products as featured.
- View store analytics.

## Customer-Facing Features

### Homepage

The homepage introduces the store with a large search area and category navigation. Customers can quickly jump into Women, Men, or Babies using category chips below the search bar. The homepage also displays category sections and featured products.

### Product Search

The search bar lets customers type what they are looking for. The app searches product names, descriptions, categories, and main categories. Matching products appear in a dropdown with the product image, name, category, and price.

### Category Browsing

Products are grouped by:

- Main category: `women`, `men`, `babies`
- Product type: `jeans`, `t-shirts`, `shoes`, `glasses`, `jackets`, `bags`

Customers can view all products in a main category or narrow the view to a specific product type.

### Product Cards

Product cards show the main shopping information:

- Product image
- Product name
- Product description
- Price
- Stock availability
- Add to cart button

If a product is out of stock, the card shows an out-of-stock state and disables adding it to the cart.

### Product Detail Page

Each product has a full detail page that shows:

- Large product image
- Product name
- Main category and product type
- Description
- Price
- Stock count
- Add to cart button

This gives customers more information before buying.

### Shopping Cart

Logged-in customers can add products to the cart. The cart supports:

- Viewing selected products
- Product quantity controls
- Removing items
- Stock validation
- Subtotal calculation
- Coupon discount calculation
- Final total calculation

The cart prevents customers from buying more items than are available in stock.

### Coupons

The project includes coupon support. A customer can enter a coupon code, and the backend checks whether the coupon belongs to the user, is active, and has not expired. If valid, the coupon discount is applied to the order total.

### Stripe Checkout

Payments are handled with Stripe Checkout. When the customer clicks checkout, the frontend asks the backend to create a Stripe checkout session. The customer is redirected to Stripe to pay securely.

After payment:

- The app checks that the Stripe session was paid.
- An order is created in MongoDB.
- Product stock is reduced.
- The user's cart is cleared.
- Used coupons are deactivated when needed.
- The customer is sent to a purchase success page.

If checkout is cancelled, the customer is sent to a purchase cancellation page.

### Chatbot Assistant

The project includes a floating shopping assistant chatbot. It can:

- Greet the user.
- Explain what the shop offers.
- Answer what categories exist.
- Search product data.
- Suggest matching products.
- Check whether products are in stock.
- Use Gemini AI to polish replies when an API key is configured.

The chatbot uses real product data from the database, so it does not invent products that are not in the store.

## Admin Features

### Protected Admin Dashboard

The admin dashboard is protected by authentication and role-based authorization. Only users with the `admin` role can access it.

The route is:

```text
/secret-dashboard
```

If a normal customer tries to access the dashboard, they are redirected away.

### Create Product

The admin can create products with:

- Product name
- Description
- Price
- Stock
- Main category
- Product type
- Image upload

Images are uploaded through Cloudinary. The uploaded Cloudinary URL is saved in the database as the product image.

### Manage Products

The admin can view existing products, delete products, and toggle whether a product is featured. Featured products are shown in the featured product section on the customer homepage.

### Analytics

The analytics section shows store performance metrics:

- Total users
- Total products
- Total sales
- Total revenue
- Daily sales and revenue trends

This gives the administrator a simple overview of store activity.

## Authentication And Authorization

The project uses JWT authentication with cookies.

When a user signs up or logs in:

- The password is hashed using bcrypt.
- An access token is created.
- A refresh token is created.
- Tokens are stored in HTTP cookies.

Protected backend routes check the access token before allowing the request. Admin-only routes also check that the authenticated user has the `admin` role.

Security features include:

- Hashed passwords
- Access and refresh tokens
- Protected customer routes
- Protected admin routes
- Role-based admin authorization
- Cookie-based authentication

## Backend API Features

The backend is built with Express.js and exposes REST API routes for:

- Authentication
- Products
- Cart
- Coupons
- Payments
- Analytics
- Chatbot

Main backend route groups:

```text
/api/auth
/api/products
/api/cart
/api/coupons
/api/payments
/api/analytics
/api/chatbot
```

## Database Design

The project uses MongoDB with Mongoose models.

### User Model

The user model stores:

- Name
- Email
- Hashed password
- Cart items
- User role, either `customer` or `admin`
- Created and updated timestamps

### Product Model

The product model stores:

- Name
- Description
- Price
- Stock
- Image URL
- Main category
- Product type category
- Featured status
- Created and updated timestamps

### Order Model

The order model stores:

- User reference
- Purchased products
- Quantity for each product
- Price at purchase time
- Total amount
- Stripe session ID
- Created and updated timestamps

### Coupon Model

The coupon model stores discount data connected to users, including the coupon code, discount percentage, expiration date, and active status.

## Technologies Used

### Frontend

- React
- Vite
- React Router DOM
- Zustand for state management
- Axios for API requests
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons
- React Hot Toast for notifications
- Recharts for analytics charts
- Stripe.js for checkout redirection

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens
- bcryptjs
- cookie-parser
- dotenv
- Stripe
- Cloudinary
- ioredis

### External Services

- MongoDB Atlas for database hosting
- Stripe for payment processing
- Cloudinary for product image storage
- Upstash Redis for caching featured products
- Gemini API for optional chatbot response polishing

## State Management

The frontend uses Zustand stores to manage shared application state.

The user store handles:

- Signup
- Login
- Logout
- Authentication checking
- Token refresh
- Current user state

The cart store handles:

- Cart items
- Add to cart
- Remove from cart
- Quantity updates
- Coupon state
- Subtotal and total calculations

The product store handles:

- Fetching products
- Fetching featured products
- Fetching products by category
- Creating products
- Deleting products
- Toggling featured status

## Stock Handling

Stock is an important part of the project. Products have a stock number, and the app checks stock before customers add products to the cart or complete checkout.

The system prevents:

- Adding out-of-stock products to the cart.
- Increasing cart quantity above available stock.
- Completing checkout if the requested quantity is no longer available.

After a successful payment, the backend reduces stock using database updates.

## Caching

The project uses Redis to cache featured products. This improves performance because featured products are frequently shown on the homepage. When an admin changes a product's featured status, the featured product cache is updated.

## Design And User Interface

The design uses a dark theme with emerald green accents. The interface is designed to feel modern and simple:

- Fixed navigation bar
- Search-focused homepage
- Category cards
- Product grids
- Product detail pages
- Clean cart layout
- Admin dashboard tabs
- Toast notifications
- Responsive layouts for different screen sizes

## Main Pages

The main frontend pages are:

- Home page
- Signup page
- Login page
- Category page
- Product detail page
- Cart page
- Purchase success page
- Purchase cancel page
- Admin dashboard

## Environment Variables Needed

The project needs environment variables for external services and security:

```text
MONGO_URI
ACCESS_TOKEN_SECRET
REFRESH_TOKEN_SECRET
UPSTASH_REDIS_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
STRIPE_SECRET_KEY
CLIENT_URL
GEMINI_API_KEY
GEMINI_MODEL
SHOP_TIME_ZONE
NODE_ENV
PORT
```

Some variables are optional depending on the feature. For example, the chatbot can still return fallback replies without Gemini, but Gemini improves the wording of responses.

## How The Project Can Be Demonstrated

A good classroom demonstration can follow this order:

1. Open the homepage and explain the shop categories.
2. Use the search bar to find a product.
3. Click a main category such as Women, Men, or Babies.
4. Open a product detail page.
5. Add a product to the cart.
6. Change quantity in the cart.
7. Apply a coupon if one exists.
8. Start Stripe checkout.
9. Show the purchase success or cancellation flow.
10. Log in as an admin.
11. Open the admin dashboard.
12. Create a new product.
13. Toggle a featured product.
14. Show the analytics dashboard.
15. Ask the chatbot about products or stock.

## Summary

SmartCart is a complete ecommerce project that includes both customer and administrator workflows. It demonstrates frontend development with React, backend development with Express, database design with MongoDB and Mongoose, authentication with JWT, secure password storage, shopping cart logic, product stock control, Stripe checkout, Cloudinary image hosting, Redis caching, analytics, and an AI-supported shopping assistant.

This project is a strong example of a modern full-stack web application because it connects many real-world ecommerce requirements into one working system.
