# APIForge — Full-Stack MERN API Development & Testing Workspace

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloudflare%20Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://apiforge-b9a.pages.dev)
[![Backend API](https://img.shields.io/badge/Backend%20API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://apiforge-backend-g6n2.onrender.com/health)
[![Demo Video](https://img.shields.io/badge/Demo%20Video-Google%20Drive-4285F4?style=for-the-badge&logo=googledrive&logoColor=white)](https://drive.google.com/file/d/1X2Ny1NJwRy33F2jQ8te6oJQCDwymIcWd/view?usp=drive_link)
[![Tests Passing](https://img.shields.io/badge/Tests-53%2F53%20Passed-22c55e?style=for-the-badge&logo=vitest&logoColor=white)](https://github.com/mallesh-bot/APIForge)
[![Stack](https://img.shields.io/badge/MERN-MongoDB%20%7C%20Express%20%7C%20React%20%7C%20Node-00ed64?style=for-the-badge&logo=mongodb&logoColor=white)](https://github.com/mallesh-bot/APIForge)

APIForge is a modern, developer-first API testing and documentation workspace designed for REST API construction, execution, assertion testing, and documentation generation. Built on the **MERN** stack (MongoDB, Express.js, React 18, Node.js 20+), APIForge pairs the agility of lightweight HTTP clients with the power of automated collection runners, AES-256-GCM secret encryption, and multi-stage SSRF defense.

---

## 🔗 Project Links

| Resource | Link |
|---|---|
| **🌐 Deployed Application (Frontend)** | [https://apiforge-b9a.pages.dev](https://apiforge-b9a.pages.dev) |
| **⚡ Backend API Service** | [https://apiforge-backend-g6n2.onrender.com](https://apiforge-backend-g6n2.onrender.com) |
| **🩺 Backend Health Endpoint** | [https://apiforge-backend-g6n2.onrender.com/health](https://apiforge-backend-g6n2.onrender.com/health) |
| **🎥 Video Demonstration Walkthrough** | [Watch Video on Google Drive](https://drive.google.com/file/d/1X2Ny1NJwRy33F2jQ8te6oJQCDwymIcWd/view?usp=drive_link) |
| **📦 GitHub Repository** | [https://github.com/mallesh-bot/APIForge](https://github.com/mallesh-bot/APIForge) |

---

## 🎥 Demonstration Video

[![Watch APIForge Demonstration Video](https://img.shields.io/badge/Demo%20Video-Google%20Drive-4285F4?style=for-the-badge&logo=googledrive&logoColor=white)](https://drive.google.com/file/d/1X2Ny1NJwRy33F2jQ8te6oJQCDwymIcWd/view?usp=drive_link)

**Direct Link**: [Watch the Video Walkthrough on Google Drive](https://drive.google.com/file/d/1X2Ny1NJwRy33F2jQ8te6oJQCDwymIcWd/view?usp=drive_link)

---

## Table of Contents

1. [Architecture Overview](#-architecture-overview)
2. [Core Feature Modules](#-core-feature-modules)
3. [Enumerated 18-Request ShopKart Demo Collection](#-enumerated-18-request-shopkart-demo-collection)
4. [Project Structure](#-project-structure)
5. [Live Demonstration & Verification Guide](#-live-demonstration--verification-guide)
6. [Local Installation & Setup](#-local-installation--setup)
7. [Running the Application](#-running-the-application)
8. [Automated Testing Suite (53 Tests)](#-automated-testing-suite-53-tests)
9. [Security Architecture & Best Practices](#-security-architecture--best-practices)
10. [Production Deployment Architecture](#-production-deployment-architecture)
11. [College End-Term Evaluation Checklist](#-college-end-term-evaluation-checklist)

---

## 🏛 Architecture Overview

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 18 + Vite + Tailwind CSS)"]
        UI[APIForge Workspace Shell]
        ReqBuilder[Interactive Request Builder\nMethod, URL, Params, Headers, Auth, Body]
        RespViewer[Response Inspector\nStatus Badge, Latency, Size, Pretty JSON, Headers]
        CollTree[Collection Explorer & 1-Click Demo Importer]
        EnvMgr[Environment Manager & Secret Masking]
        HistPanel[Sanitized Execution History & 1-Click Replay]
        TestRunner[Assertion Engine & Sequential Collection Runner]
        DocViewer[Interactive Docs & Markdown Exporter]
    end

    subgraph Backend ["Server Layer (Node.js 20+ & Express.js)"]
        AuthMid[Dual-Layer Auth: HttpOnly Cookie + Bearer Fallback]
        TrustProxy[Express Trust Proxy for Cloud Reverse Proxies]
        RateLim[Helmet Security Headers & Express Rate Limiter]
        Router[API v1 Versioned Router]
        
        subgraph SecurityEngines ["Security & Core Processing Engines"]
            SSRFGuard[Multi-Stage SSRF Guard\nDNS Pre-Resolution + CIDR Blacklist]
            HTTPExec[Outbound HTTP Executor via undici\n5MB Body Clamp, Timeouts, Redirect Verification]
            CryptoEngine[AES-256-GCM Symmetric Cryptor\n12-byte Random IV + 16-byte AuthTag]
            AssertEngine[Rule-Based Assertion Evaluator\nStrictly Zero eval() / Safe AST]
            DocEngine[Collection-to-Markdown Generator]
        end

        subgraph MockTargets ["Built-in Deterministic Targets"]
            ShopKartMock[ShopKart Mock API Controller\n/api/v1/mock/shopkart/*\nAuth, Products, Wishlist, Cart, Orders]
        end
    end

    subgraph Database ["Persistence Layer (MongoDB Atlas / Local)"]
        Users[(Users)]
        Collections[(Collections)]
        SavedRequests[(Saved Requests)]
        Environments[(Environments - AES-256 Encrypted)]
        RequestHistory[(Request History - Sanitized)]
        TestRuns[(Test Runs & Reports)]
    end

    UI --> AuthMid
    AuthMid --> TrustProxy
    TrustProxy --> Router
    Router --> RateLim
    Router --> SSRFGuard
    SSRFGuard --> HTTPExec
    HTTPExec -->|Internal Mock Target| ShopKartMock
    HTTPExec -->|External Public Targets| ExternalAPI[External Public APIs]
    Router --> AssertEngine
    Router --> CryptoEngine
    Router --> DocEngine
    Router --> Database
```

---

## 🚀 Core Feature Modules

### 1. Interactive Multi-Tab HTTP Request Builder
- Full HTTP method support: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- Key-Value parameter and header management with row-by-row enable/disable toggles.
- Multiple authentication modes: **None**, **Bearer Token**, **Basic Auth**, and custom **API Key** headers.
- Request body options: **None**, **JSON** (with real-time syntax formatting and validation), and **Raw Text**.
- Save requests directly into MongoDB collections with organized naming and folder hierarchies.

### 2. High-Precision Response Inspector & Diagnostics
- Color-coded HTTP status badges (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Server Error`).
- Exact measured round-trip latency in milliseconds (`ms`) and response payload byte calculation (`KB`).
- Tabbed diagnostics: Formatted Pretty JSON with copy-to-clipboard, Raw body inspection, Response Headers table, and Assertion Test Results.

### 3. Multi-Stage SSRF Security Engine
- **Protocol Whitelisting**: Exclusively permits `http:` and `https:`.
- **Pre-Flight DNS Resolution**: Uses `dns.promises.lookup` with `{ all: true }` to inspect every destination IP before opening sockets.
- **CIDR Blocklists**: Blocks loopback (`127.0.0.0/8`), cloud metadata IP (`169.254.169.254`), private RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local (`169.254.0.0/16`), multicast, and IPv6 mapped addresses.
- **Dev-Only Mock Gating**: Loopback access is strictly restricted to development mode with `ENABLE_INTERNAL_MOCK_TARGET=true` on the server's own port and approved routes (`/api/v1/mock/shopkart/*`).
- **DoS Protection**: Clamps response bodies at 5MB and enforces rigid socket timeouts.
- **Session Leak Prevention**: Strips internal APIForge session cookies and sensitive authorization headers from outbound targets.

### 4. Dynamic Environments & AES-256-GCM Encryption
- Template variable interpolation using `{{variableName}}` syntax across URLs, headers, and request bodies.
- Secret variables (`isSecret: true`) are encrypted at rest with **AES-256-GCM** (unique 12-byte random IV per write, 16-byte authentication tag).
- Secret values are masked with `********` in all standard API responses and never written to request history or server logs.

### 5. Sanitized Execution History & 1-Click Replay
- Automatically logs executed requests with sanitized URLs, status codes, response sizes, and measured durations.
- Automatically redacts sensitive query parameters (`token`, `password`, `key`, `secret`).
- 1-click restore: loads past requests back into the Request Builder with original parameters and headers.
- Search and filter history by HTTP method or URL substring, with one-click history clearing.

### 6. Rule-Based Assertion Test Runner
- Safe AST evaluation engine completely free of `eval()` or `new Function()`.
- Built-in assertion types:
  - Status Code Equals
  - Status Code In Range (e.g., `200-299`)
  - Response Time Below (ms)
  - Header Exists / Header Equals
  - JSON Field Exists / JSON Field Equals
  - Body Contains Substring
- **Sequential Collection Runner**: Executes every request in a collection in order against an active environment, showing live progress and test pass/fail tallies.

### 7. Automated API Documentation Generator
- Converts saved collections into comprehensive, readable API documentation.
- Generates endpoint references, request parameter breakdowns, and sample cURL commands.
- 1-click export to GitHub-Flavored Markdown (`.md`) files.

### 8. Preloaded 18-Request ShopKart Demo Collection
- Built-in deterministic mock target (`/api/v1/mock/shopkart/*`) requiring zero external dependencies.
- Covers complete e-commerce lifecycle: Customer Registration, Login, Profile Retrieval, Product Search & Category Filtering, Wishlist Management, Cart Operations, and Order Creation.

---

## 📋 Enumerated 18-Request ShopKart Demo Collection

APIForge includes an importable demo collection representing a complete e-commerce backend workflow. All 18 endpoints are backed by APIForge's built-in mock controller:

| # | Request Name | Method | Route | Auth | Status | Key Assertions |
|---|---|---|---|---|---|---|
| 1 | Auth - Register Customer (Valid) | `POST` | `{{baseUrl}}/customers/register` | None | `201` | Status == 201, `success` == true, `customer._id` exists |
| 2 | Auth - Register Customer (Validation Failure) | `POST` | `{{baseUrl}}/customers/register` | None | `400` | Status == 400, `success` == false |
| 3 | Auth - Login Customer (Valid Credentials) | `POST` | `{{baseUrl}}/customers/login` | None | `200` | Status == 200, `token` exists, `success` == true |
| 4 | Auth - Login Customer (Invalid Password) | `POST` | `{{baseUrl}}/customers/login` | None | `401` | Status == 401, `success` == false |
| 5 | Auth - Get Profile (Authenticated) | `GET` | `{{baseUrl}}/customers/me` | Bearer `{{authToken}}` | `200` | Status == 200, `customer.email` == "jane.doe@example.com" |
| 6 | Auth - Get Profile (Missing Token) | `GET` | `{{baseUrl}}/customers/me` | None | `401` | Status == 401, `success` == false |
| 7 | Products - List All Products | `GET` | `{{baseUrl}}/products` | None | `200` | Status == 200, `success` == true, Latency < 1000ms |
| 8 | Products - Search Products by Keyword | `GET` | `{{baseUrl}}/products?search=Keyboard` | None | `200` | Status == 200, `count` == 1 |
| 9 | Products - Filter Products by Category | `GET` | `{{baseUrl}}/products?category=electronics` | None | `200` | Status == 200, `count` == 2 |
| 10 | Products - Get Single Product Details | `GET` | `{{baseUrl}}/products/{{sampleProductId}}` | None | `200` | Status == 200, `product._id` == "prod_101" |
| 11 | Products - Get Product (Non-Existent 404) | `GET` | `{{baseUrl}}/products/prod_nonexistent_999` | None | `404` | Status == 404, `success` == false |
| 12 | Wishlist - Get Current User Wishlist | `GET` | `{{baseUrl}}/wishlist` | Bearer `{{authToken}}` | `200` | Status == 200, `success` == true |
| 13 | Wishlist - Add Item to Wishlist | `POST` | `{{baseUrl}}/wishlist/{{sampleProductId}}` | Bearer `{{authToken}}` | `200` | Status == 200, `success` == true |
| 14 | Wishlist - Remove Item from Wishlist | `DELETE` | `{{baseUrl}}/wishlist/{{sampleProductId}}` | Bearer `{{authToken}}` | `200` | Status == 200, `success` == true |
| 15 | Cart - Get Cart Contents | `GET` | `{{baseUrl}}/cart` | Bearer `{{authToken}}` | `200` | Status == 200, `cart.items` exists |
| 16 | Cart - Add Item to Cart | `POST` | `{{baseUrl}}/cart/{{sampleProductId}}` | Bearer `{{authToken}}` | `200` | Status == 200, `item.quantity` == 2 |
| 17 | Cart - Update Cart Item Quantity | `PATCH` | `{{baseUrl}}/cart/{{sampleProductId}}` | Bearer `{{authToken}}` | `200` | Status == 200, `item.quantity` == 3 |
| 18 | Orders - Create Sample Order | `POST` | `{{baseUrl}}/orders` | Bearer `{{authToken}}` | `201` | Status == 201, `order.status` == "pending" |

*Note: In accordance with academic scope, third-party payment gateways (Razorpay, Stripe) have been intentionally omitted.*

---

## 📁 Project Structure

```
MERN_PROJECT/
├── .env.example              # Server environment variable template
├── .gitignore                # Git exclusions (ignores .env and build files)
├── package.json              # Monorepo scripts (dev, build, test, install:all)
├── README.md                 # Project documentation and deployment references
│
├── server/                   # Express.js Backend Server
│   ├── package.json          # Backend dependencies & test scripts
│   ├── src/
│   │   ├── app.js            # Express app with Helmet, CORS & Rate limiting
│   │   ├── server.js         # HTTP server startup & database initialization
│   │   ├── config/
│   │   │   ├── db.js         # Mongoose connection & DNS SRV resolution
│   │   │   └── env.js        # Zod environment schema validation
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Collection.js
│   │   │   ├── SavedRequest.js
│   │   │   ├── Environment.js
│   │   │   ├── RequestHistory.js
│   │   │   └── TestRun.js
│   │   ├── middleware/
│   │   │   ├── auth.js       # JWT cookie & header verification
│   │   │   ├── validate.js   # Zod request validation middleware
│   │   │   └── errorHandler.js
│   │   ├── utils/
│   │   │   ├── crypto.js     # AES-256-GCM symmetric encryption
│   │   │   └── ssrfGuard.js  # DNS pre-resolution & CIDR blocklists
│   │   ├── services/
│   │   │   ├── httpExecutor.js    # Undici outbound request dispatcher
│   │   │   └── assertionEngine.js # Safe AST assertion engine
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── collectionController.js
│   │   │   ├── requestController.js
│   │   │   ├── environmentController.js
│   │   │   ├── executeController.js
│   │   │   ├── historyController.js
│   │   │   ├── testRunController.js
│   │   │   ├── documentationController.js
│   │   │   ├── mockShopKartController.js
│   │   │   └── demoCollectionController.js
│   │   └── routes/           # Versioned Express endpoints (/api/v1/*)
│   └── tests/                # Vitest backend tests (47 unit & integration tests)
│       ├── auth.test.js
│       ├── ssrfGuard.test.js
│       ├── cryptoAndSecrets.test.js
│       ├── assertionEngine.test.js
│       ├── shopkartMock.test.js
│       └── demoCollection.test.js
│
└── client/                   # React 18 + Vite Frontend
    ├── package.json
    ├── vite.config.js        # Vite build & proxy configuration
    ├── tailwind.config.js    # Custom dark developer theme
    ├── src/
    │   ├── main.jsx          # React DOM entrypoint
    │   ├── App.jsx           # React Router & ProtectedRoute logic
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── EnvironmentContext.jsx
    │   ├── services/
    │   │   └── api.js        # Axios instance with cross-origin resilience
    │   ├── components/common/
    │   │   ├── Button.jsx
    │   │   ├── Input.jsx
    │   │   ├── Modal.jsx
    │   │   ├── StatusBadge.jsx
    │   │   ├── KeyValueEditor.jsx
    │   │   ├── CodeEditor.jsx
    │   │   └── Toast.jsx
    │   ├── features/
    │   │   ├── workspace/     # TopNav, Sidebar & WorkspaceLayout
    │   │   ├── request-builder/ # RequestBuilder & ResponseViewer
    │   │   ├── collections/   # CollectionExplorer & Demo Importer
    │   │   ├── environments/  # EnvironmentManager
    │   │   ├── history/       # HistoryPanel
    │   │   ├── testing/       # CollectionRunner
    │   │   ├── documentation/ # DocumentationViewer
    │   │   └── auth/          # LoginPage & RegisterPage
    │   └── __tests__/         # Frontend component tests
```

---

## 🧪 Live Demonstration & Verification Guide

Follow these steps to evaluate the live deployment on [Cloudflare Pages](https://apiforge-b9a.pages.dev):

1. **User Registration & Login**:
   - Navigate to [https://apiforge-b9a.pages.dev/register](https://apiforge-b9a.pages.dev/register).
   - Enter your name, email, and a password (min. 8 characters).
   - Click **Create Account**. You will be securely authenticated into the workspace.
2. **1-Click ShopKart Demo Import**:
   - In the left sidebar under **API Collections**, click the **"Import ShopKart Demo"** button.
   - An 18-request collection with folders (*Customer Auth*, *Products*, *Wishlist & Cart*, *Orders*) appears instantly.
3. **Execute a Request**:
   - Expand the **Products** folder &rarr; select **`GET Products - List All Products`**.
   - Click the cyan **Send** button.
   - Observe the green `200 OK` status, latency in milliseconds, payload byte size, and formatted JSON output.
4. **Environment Variables & Secrets**:
   - Click **Environments** in the sidebar. Select the automatically seeded **ShopKart Local** environment.
   - Notice that sensitive values (such as `authToken`) are masked as `********` with AES-256-GCM encryption.
5. **Run the Collection Suite**:
   - Click **Test Runner** in the sidebar navigation.
   - Choose **ShopKart E-Commerce API** and click **Run Collection**.
   - Watch the real-time sequential runner execute all requests and report a 100% pass rate.
6. **Generate Documentation**:
   - Click **API Docs** in the sidebar.
   - Review the auto-generated documentation with sample cURL commands.
   - Click **Export .md** to download the Markdown file.
7. **SSRF Guard Validation**:
   - Open a new tab in the Request Builder.
   - Enter a private address: `http://169.254.169.254` (cloud metadata) or `http://192.168.1.1`.
   - Click **Send** &rarr; observe immediate `403 Forbidden` SSRF block.

---

## 💻 Local Installation & Setup

### 1. Prerequisites
- **Node.js**: v20.x or higher (`node -v`)
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or a free MongoDB Atlas connection string.

### 2. Environment Configuration
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Generate secure cryptographic keys using Node.js:
```bash
# Generate 48-byte hex secret for JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# Generate 32-byte hex key for ENCRYPTION_KEY (AES-256):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Populate your `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/apiforge
JWT_SECRET=<YOUR_GENERATED_48_BYTE_HEX_SECRET>
ENCRYPTION_KEY=<YOUR_GENERATED_64_CHAR_HEX_KEY>
FRONTEND_ORIGIN=http://localhost:5173
ENABLE_INTERNAL_MOCK_TARGET=true
```

### 3. Install Dependencies
Install all packages across the root, server, and client:
```bash
npm run install:all
```

---

## 🏃 Running the Application

### Development Mode (Concurrent Frontend + Backend)
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

### Run Backend Only
```bash
npm run dev:server
```

### Run Frontend Only
```bash
npm run dev:client
```

### Production Build & Local Serve
```bash
npm run build
npm start
```
The Express backend serves the optimized production client bundle directly on `http://localhost:5000`.

---

## 🧪 Automated Testing Suite (53 Tests)

APIForge includes **53 automated tests** spanning unit, integration, and security test suites.

### Run All Tests
```bash
npm test
```

### Run Server Tests (47 Tests)
```bash
npm run test:server
```
| Test Suite | Tests | Description |
|---|---|---|
| `auth.test.js` | 8 | User registration, password hashing, HttpOnly cookies, login validation, session retrieval |
| `ssrfGuard.test.js` | 7 | CIDR blocking, loopback defense, metadata IP `169.254.169.254` blocking, redirect checks |
| `cryptoAndSecrets.test.js` | 4 | AES-256-GCM encryption/decryption, unique IV generation, auth tag validation |
| `assertionEngine.test.js` | 7 | Safe rule evaluation for status codes, latency, headers, and nested JSON fields |
| `shopkartMock.test.js` | 19 | Complete verification of all 18 ShopKart mock endpoints |
| `demoCollection.test.js` | 2 | Idempotent seeding and request retrieval of the ShopKart demo collection |

### Run Client Tests (6 Tests)
```bash
npm run test:client
```
| Test Suite | Tests | Description |
|---|---|---|
| `ResponseViewer.test.jsx` | 3 | Status badge color-coding, duration display, assertion rendering |
| `KeyValueEditor.test.jsx` | 3 | Dynamic row addition, modification, and deletion |

---

## 🔒 Security Architecture & Best Practices

1. **Dual-Layer Authentication Resilience**:
   - Primary: JWT stored in HttpOnly cookies with `sameSite: 'none'`, `secure: true` in production.
   - Secondary: Client fallback attaches `Authorization: Bearer <token>` from `localStorage` to ensure full compatibility with browsers that restrict third-party cross-site cookies (e.g., Safari ITP).
2. **Reverse Proxy Support**:
   - `app.set('trust proxy', 1)` enables Express to correctly read HTTPS proto headers forwarded by Render and Cloudflare reverse proxies.
3. **Multi-Stage SSRF Defense**:
   - Hostnames are resolved to IP addresses before socket creation.
   - Resolved IPs are matched against a comprehensive list of private and restricted CIDR subnets.
   - In production, loopback bypass is strictly disabled.
4. **AES-256-GCM Encryption**:
   - Sensitive environment variables are stored in encrypted format using a 32-byte key, random 12-byte initialization vector per write, and a 16-byte authentication tag for integrity verification.
5. **Strict User Scoping**:
   - Every database query for collections, requests, environments, history, and test reports is scoped to `ownerId: req.user.id`.

---

## 🌐 Production Deployment Architecture

```
Cloudflare Pages (Static Frontend CDN)
URL: https://apiforge-b9a.pages.dev
         │
         │  HTTPS Cross-Origin Requests
         ▼
Render Web Service (Node.js + Express Backend)
URL: https://apiforge-backend-g6n2.onrender.com
         │
         │  TLS 1.3 / Mongoose Driver
         ▼
MongoDB Atlas (Cloud Managed Database Cluster)
```

- **Frontend Hosting**: Cloudflare Pages with automatic edge CDN caching, HTTP/3, and Brotli compression.
- **Backend Hosting**: Render Web Service running Node.js 20 with automatic branch deployment.
- **Cross-Origin Configuration**: Express CORS dynamically accepts `https://apiforge-b9a.pages.dev` and all preview builds matching `https://*.pages.dev`.

---

## 🎓 College End-Term Evaluation Checklist

- [x] **User Authentication**: Register, login, session persistence, and logout.
- [x] **1-Click ShopKart Demo Import**: Populate the 18-request demo collection and environment.
- [x] **Request Execution & Diagnostics**: Send requests, inspect latency in `ms`, byte size, and formatted JSON.
- [x] **SSRF Protection**: Verify blocking of loopback and cloud metadata (`169.254.169.254`).
- [x] **Environment Variables**: Template interpolation (`{{baseUrl}}`) and AES-256 secret masking (`********`).
- [x] **Assertion Engine**: Status code, latency, and JSON field assertions without using `eval()`.
- [x] **Collection Runner**: Sequential batch execution with progress tracking and report generation.
- [x] **Documentation Generator**: Instant documentation view with cURL generation and `.md` file export.
- [x] **Sanitized History**: Automatic request logging with query parameter redaction and 1-click replay.
- [x] **Automated Tests**: All 53 unit, integration, and security tests passing.
- [x] **Cloud Deployment**: Live production frontend on Cloudflare Pages and backend on Render.
