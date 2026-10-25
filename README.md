<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2.3-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/MongoDB-6.6-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Razorpay-Integrated-02042B?style=for-the-badge&logo=razorpay" alt="Razorpay" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

<h1 align="center">🚀 TRADEXFLOOR ACADEMY</h1>

<p align="center">
  <strong>India's #1 Premium Trading Education Platform</strong>
  <br />
  <em>Learn Stock Market, Forex & Crypto Trading from Expert Mentors</em>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#environment-variables">Environment</a> •
  <a href="#api-endpoints">API</a> •
  <a href="#new-features">What's New</a>
</p>

---

## 🆕 What's New (v3.0 - January 2026)

### 🎬 **Cinematic Trading Landing Page**
- Premium video-style cinematic hero section
- Trading-themed animations (candlesticks, charts, data streams)
- Real-time stock ticker with Indian market data (NIFTY, SENSEX, BANKNIFTY)
- Interactive image slider with trading success stories
- Parallax scrolling effects for immersive experience

### ⚡ **Performance Optimized**
- Lightweight animations optimized for mobile devices
- Reduced DOM elements for faster rendering
- Lazy loading for images and heavy components
- Static stock data to reduce CPU usage
- Simplified parallax effects (disabled heavy decorations)

### 🎨 **Modern UI/UX Updates**
- New pill-shaped navigation buttons with smooth hover effects
- Clean glassmorphism cards with subtle animations
- Responsive design improvements for all screen sizes
- Theme toggle (Dark/Light mode)
- Trading chart backgrounds with gradient overlays

### 💳 **Razorpay Payment Integration**
- Complete payment flow with order creation and verification
- Support for UPI, Cards, NetBanking, and Wallets
- Automatic subscription creation after successful payment
- Email confirmation for purchases

### 📧 **Email Service**
- OTP delivery via email (Gmail/SMTP support)
- Beautiful HTML email templates
- Purchase confirmation emails
- Fallback to console for development

### 🎬 **DRM Video Player**
- Custom video player with anti-screen recording
- Dynamic watermarking with user email
- Right-click and screenshot prevention
- Visibility change detection

### 📄 **PDF Viewer**
- Embedded PDF viewing with zoom controls
- Watermark overlay for protection
- Optional download functionality
- Fullscreen support

---

## ✨ Features

### 🎓 **For Students**
- 📹 **Premium Video Courses** - High-quality trading education with DRM protection
- 📄 **PDF Resources** - Downloadable study materials and cheat sheets
- 🔐 **Secure Authentication** - OTP-based login/signup system with email verification
- 📊 **Progress Tracking** - Track your learning journey
- 💳 **Easy Payments** - Razorpay integration for seamless purchases

### 👨‍💼 **Admin Dashboard**
- 📈 **Analytics Dashboard** - Real-time stats on users, sales & revenue
- 📦 **Product Management** - Create, edit & manage courses
- 👥 **User Management** - View and manage all registered users
- 💰 **Transaction History** - Track all payments and orders
- 📧 **OTP-based Admin Login** - Secure admin authentication

### 🎨 **UI/UX**
- 🌙 **Dark/Light Theme** - Toggle between eye-friendly modes
- 🎬 **Cinematic Design** - Video-style trading vibes with candlesticks & charts
- 📱 **Fully Responsive** - Optimized for all devices including mobile
- ⚡ **Fast & Optimized** - Performance-first approach with lazy loading
- 🎭 **Glassmorphism Design** - Modern glass-effect UI components
- 📊 **Trading Animations** - Stock ticker, candlestick backgrounds, chart SVGs

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 14, React 18, TailwindCSS |
| **Animations** | Framer Motion (Performance Optimized) |
| **Backend** | Next.js API Routes |
| **Database** | MongoDB Atlas |
| **Authentication** | NextAuth.js + OTP-based Email Auth |
| **Payments** | Razorpay Integration |
| **UI Components** | Radix UI, Lucide Icons, ShadCN |
| **Forms** | React Hook Form + Zod Validation |
| **Charts** | Recharts |
| **Styling** | Tailwind CSS + Custom CSS Animations |

---

## 🚀 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- Yarn or npm

### Quick Start

```bash
# Clone the repository
git clone https://github.com/NICK-FURY-6023/TradeXFlooracademy.git

# Navigate to project directory
cd TradeXFlooracademy

# Install dependencies
yarn install
# or
npm install

# Set up environment variables (see below)
cp .env.example .env

# Run development server
yarn dev
# or
npm run dev
```

The app will be running at [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB / Prisma Configuration
DATABASE_URL="mongodb://localhost:27017/tradexfloor"

# Auth.js / JWT Configuration
# Generate with: openssl rand -base64 32
AUTH_SECRET="replace-with-a-random-secret-at-least-32-characters"
AUTH_TRUST_HOST=true
AUTH_URL="http://localhost:3000"
AUTH_SESSION_MAX_AGE=604800
AUTH_SESSION_UPDATE_AGE=86400

# CORS Settings
CORS_ORIGINS=*

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email Configuration (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# Or use SMTP
# SMTP_HOST=smtp.yourprovider.com
# SMTP_PORT=587
# SMTP_USER=your_username
# SMTP_PASS=your_password
```

> 📌 See `.env.example` for detailed configuration options

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a user and send an OTP |
| `POST` | `/api/auth/login-init` | Start OTP login |
| `POST` | `/api/auth/otp` | Verify OTP |
| `GET` | `/api/auth/me` | Return the current session (`401` when unauthenticated) |

Authentication uses an HttpOnly Auth.js JWT session cookie. API routes should use
the shared `auth()` helper or the existing admin-auth middleware rather than
reading or decoding the cookie directly. Never expose `AUTH_SECRET` to client
code.

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/send-otp` | Send admin OTP |
| `POST` | `/api/admin/verify-otp` | Verify admin OTP |
| `GET` | `/api/admin/stats` | Get dashboard stats |
| `POST` | `/api/admin/setup` | Create first admin user |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | Get all products |
| `POST` | `/api/products` | Create new product |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Delete product |

### Payments (NEW)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payment/create-order` | Create Razorpay order |
| `POST` | `/api/payment/verify` | Verify payment signature |
| `POST` | `/api/payment/webhook` | Razorpay webhook handler |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | Get all users |
| `GET` | `/api/user/:id` | Get user by ID |

---

## 📁 Project Structure

```
TradeXFlooracademy/
├── app/
│   ├── globals.css          # Global styles & animations
│   ├── layout.js            # Root layout
│   ├── page.js              # Main landing page
│   ├── admin/
│   │   └── page.js          # Admin dashboard
│   └── api/
│       └── [[...path]]/
│           └── route.js     # All API routes
├── components/
│   └── ui/                  # Reusable UI components
├── hooks/                   # Custom React hooks
├── lib/
│   └── utils.js             # Utility functions
├── public/                  # Static assets
└── tests/                   # Test files
```

---

## 🎨 Key Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with hero, features, courses |
| Products | `/products` | Browse all courses |
| About | `/about` | About the academy |
| Contact | `/contact` | Contact form |
| Admin | `/admin` | Admin dashboard |
| Dashboard | `/dashboard` | User dashboard |

---

## 🖥️ Scripts

```bash
# Development
yarn dev              # Start dev server with hot reload

# Production
yarn build            # Build for production
yarn start            # Start production server

# Other
yarn lint             # Run ESLint
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

<p align="center">
  <strong>NICK FURY</strong>
  <br />
  <a href="https://github.com/NICK-FURY-6023">GitHub</a>
</p>

---

<p align="center">
  Made with ❤️ by <strong>TRADEXFLOOR ACADEMY</strong>
  <br />
  <em>🚀 Start Your Trading Journey Today!</em>
</p>
