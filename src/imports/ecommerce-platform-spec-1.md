You are a senior full-stack engineer and product architect. Build a fully functional, scalable, production-ready e-commerce web application for a wholesale general store business.

The business sells products like soaps, tea powders, coffee powders, toothpaste, detergent/surf, personal care items, and grocery essentials.

This platform must support both:

Retail Customers (B2C) – Fixed MRP pricing

Shop Owners / Retailers (B2B) – Special wholesale pricing (different from customer pricing)

The website should have similar UX quality as JioMart and BigBasket, but optimized for wholesale logic.

🏗 CORE REQUIREMENTS
🔐 1. Authentication System
Login Page:

User must choose login type:

Login as Customer

Login as Shop Owner

Each role must have separate dashboards and pricing visibility.

👤 2. Customer Flow (B2C)
Registration:

Name

Email

Phone Number

Address

Password

Features:

View products with MRP pricing

Add to cart

Wishlist

Apply coupons

Checkout (Cash on Delivery + UPI + Card)

Order history

Reorder option

Delivery tracking

Interface should look modern and simple like BigBasket.

🏪 3. Shop Owner Flow (B2B)
Shop Sign-Up Page:

Fields:

Name

Gmail

Phone Number

Shop Name

Shop Location

GST Number (optional)

Upload shop license (optional file upload)

After submission:

Account should go into Pending Approval

Admin must manually approve request

Only after approval shop owner can login

Shop Owner Dashboard:

See wholesale pricing

Minimum order quantity option

Bulk discounts

View stock availability

Download invoice

View credit limit (if admin assigns)

Order history

Reorder in bulk

Add to cart in carton/box quantity

Shop interface should show:

Margin percentage

Savings compared to MRP

🛒 4. Product Management

Each product must support:

Product Name

Category

Brand

Description

Images (multiple)

MRP Price (Customer Price)

Wholesale Price (Shop Price)

Minimum Wholesale Quantity

Stock Count

SKU Code

Unit Type (Piece / Box / Carton)

Admin must be able to:

Add/Edit/Delete products

Set separate pricing for customer and shop

Set bulk discounts

Mark products as featured

Mark out of stock

🧑‍💼 5. Admin Panel

Admin Dashboard Features:

Approve/Reject shop registrations

View all orders (B2C + B2B separately filtered)

Sales analytics (daily, weekly, monthly)

Revenue graph

Manage inventory

Manage banners

Create discount coupons

Assign credit limits to shop owners

Change wholesale prices anytime

Block users

Manage delivery charges

📊 6. Advanced Features (Premium-Level)

Real-time inventory tracking

Dynamic pricing control

Role-based access control

GST invoice generation (PDF download)

WhatsApp order confirmation

SMS order alerts

Razorpay integration

UPI QR integration

Delivery slot selection

Location-based delivery charges

Search with filters (brand, price, category)

Add “Buy Again” quick reorder button

Dark mode option

🎨 UI/UX DESIGN

Design must be:

Clean

Modern

Mobile responsive

Fast loading

Easy navigation

Homepage Sections:

Banner carousel

Shop by Category

Featured Products

Top Brands

Wholesale Deals Section (visible only for shop login)

Best Sellers

Recently Viewed

Color theme:

Professional wholesale vibe

Blue + White OR Green + White theme

⚙️ TECH STACK

Frontend:

React.js / Next.js

Tailwind CSS

Redux or Zustand

Backend:

Node.js + Express

MongoDB

Authentication:

JWT + Role-based access

Deployment:

Vercel (Frontend)

Render / Railway (Backend)

Payment:

Razorpay Integration

📈 Scalability Design

Structure the backend in a scalable way:

Separate pricing logic by user role

Modular API routes

Proper error handling

Clean folder structure

Environment variable config

Security best practices

Input validation

Rate limiting

Password hashing (bcrypt)

🧠 Business Logic Requirements

Customers see only MRP pricing.

Shop owners see only wholesale pricing.

If user is not logged in → only MRP pricing visible.

Wholesale pricing should never be exposed in frontend for customers.

Minimum order quantity must be enforced for shop accounts.

Admin approval required before shop login access.

💰 Future Ready Add-ons

Android App API ready

Delivery agent dashboard

Wallet system

Loyalty points

Referral system

Multi-warehouse support

🎯 Final Goal

Build a professional, production-ready wholesale + retail hybrid e-commerce platform that can scale to multiple cities and thousands of shop owners.

Code must be clean, secure, and business scalable.