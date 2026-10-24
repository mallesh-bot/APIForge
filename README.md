# APIForge — Full-Stack MERN API Development & Testing Workspace

APIForge is a modern developer workspace and testing platform designed for REST API design, execution, assertion testing, and documentation generation. Built using the **MERN** stack (MongoDB, Express.js, React, Node.js), APIForge bridges the gap between simple HTTP clients and full-lifecycle testing suites like Postman and Insomnia.

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph Client ["Client (React 18 + Vite + Tailwind CSS)"]
        UI[APIForge Workspace Shell]
        ReqBuilder[Interactive Request Builder\nMethod, URL, Params, Headers, Auth, Body]
        RespViewer[Response Inspector\nStatus Badge, Latency, Size, Pretty JSON, Headers]
        CollTree[Collection Explorer & Demo Importer]
        EnvMgr[Environment Manager & Secret Masking]
        HistPanel[Sanitized Execution History & Replay]
        TestRunner[Assertion Engine & Sequential Collection Runner]
        DocViewer[Interactive Docs & Markdown Exporter]
    end

    subgraph Backend ["Server (Node.js 20+ & Express.js)"]
        AuthMid[JWT Auth Middleware & HttpOnly Cookie]
        RateLim[Helmet, CORS & Express Rate Limiter]
        Router[API v1 Versioned Router]
        
        subgraph SecurityEngines ["Security & Execution Engine"]
            SSRFGuard[Multi-Stage SSRF Guard\nDNS Pre-Resolution + CIDR Blacklist]
            HTTPExec[Outbound HTTP Executor via undici\nBody Clamp 5MB, Timeouts, Redirect Verification]
            CryptoEngine[AES-256-GCM Variable Encryptor\n12-byte IV + 16-byte AuthTag]
            AssertEngine[Rule-Based Assertion Evaluator\nStrictly Zero eval()]
            DocEngine[Collection-to-Markdown Generator]
        end

        subgraph MockTargets ["Built-in Deterministic Target"]
            ShopKartMock[ShopKart Mock API Controller\n/api/v1/mock/shopkart/*\nAuth, Products, Wishlist, Cart, Orders]
        end
    end

    subgraph Database ["MongoDB (Local 27017 or Atlas)"]
        Users[(Users)]
        Collections[(Collections)]
        SavedRequests[(Saved Requests)]
        Environments[(Environments - AES Encrypted)]
        RequestHistory[(Request History - Sanitized)]
        TestRuns[(Test Runs & Reports)]
    end

    UI --> AuthMid
    AuthMid --> Router
    Router --> RateLim
    Router --> SSRFGuard
    SSRFGuard --> HTTPExec
    HTTPExec -->|Internal Mock Target| ShopKartMock
    HTTPExec -->|External Permitted Targets| ExternalAPI[External Public APIs]
    Router --> AssertEngine
    Router --> CryptoEngine
    Router --> DocEngine
    Router --> Database
```

---

## Core Features

1. **Interactive Multi-Tab HTTP Request Builder**
   - Supports `GET`, `POST`, `PUT`, `PATCH`, `DELETE` methods.
   - Dynamic query parameters and custom headers with row-by-row enable/disable toggles.
   - Authentication modes: None, Bearer Token, Basic Auth, and API Key headers.
   - Request bodies: None, JSON (with client-side syntax formatting and validation), and Raw Text.
   - Save requests directly into MongoDB collections.

2. **Response Inspector & Diagnostics**
   - Color-coded HTTP status badges (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Server Error`).
   - True measured round-trip latency (in milliseconds) and byte size calculation.
   - Tabs: Formatted Pretty JSON with copy-to-clipboard, Raw body, Response Headers table, and Assertion Test Results.

3. **Multi-Stage SSRF Security Engine**
   - Protocol whitelisting: strictly `http:` and `https:`.
   - Pre-flight DNS resolution via `dns.promises.lookup` with `{ all: true }`.
   - Comprehensive CIDR blocklist blocking loopback (`127.0.0.0/8`), cloud metadata (`169.254.169.254`), private RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local (`169.254.0.0/16`), and IPv6 mapped addresses.
   - Dev-only mock exception: loopback access is gated strictly to `ENABLE_INTERNAL_MOCK_TARGET=true` in development on the server's own port and restricted to `/api/v1/mock/shopkart/*`.
   - 5MB maximum response body clamping to prevent Denial of Service.
   - Stripping of internal APIForge session cookies from all outbound requests.

4. **Persistent Collections & Saved Requests**
   - Full CRUD operations persisted in MongoDB with strict user-level ownership.
   - Duplicate request functionality with automatic name suffixing.
   - Cascading deletions: deleting a collection automatically removes child requests to prevent orphaned data.

5. **Dynamic Environments & AES-256-GCM Encryption**
   - Template variable interpolation using `{{variableName}}` syntax across URLs, headers, and request bodies.
   - Secret variables (`isSecret: true`) are encrypted at rest with AES-256-GCM (12-byte random IV, 16-byte auth tag).
   - Real secret values are masked as `********` in API responses and never logged to history or console.

6. **Execution History & Replay**
   - Automatically records executed requests with sanitized URLs, status codes, response sizes, and measured durations.
   - Sensitive query parameters (`token`, `password`, `key`, `secret`) are masked before recording.
   - 1-click restore: load past requests back into the Request Builder.
   - Filter history by HTTP method or search URL substring; single-click history purge.

7. **Rule-Based Assertion Test Runner**
   - Safe AST evaluator strictly avoiding `eval()` and `new Function()`.
   - Supported assertions: Status Code Equals, Status Code In Range (e.g. `200-299`), Response Time Below (ms), Header Exists, Header Equals, JSON Field Exists, JSON Field Equals, and Body Contains String.
   - Sequential Collection Runner: executes an entire collection in sequence against an environment, displaying real-time pass/fail progress and generating downloadable JSON test reports.

8. **Automated Documentation Generator**
   - Converts saved collections into interactive API reference pages.
   - Generates and exports GitHub-Flavored Markdown (`.md`) with copy-to-clipboard support and sample cURL commands.

9. **Preloaded ShopKart Demo Collection (18 Endpoints)**
   - Includes an idempotent one-click import of the complete **ShopKart E-Commerce API** test suite backed by a built-in deterministic mock target (`/api/v1/mock/shopkart/*`).
   - Covers Authentication, Products, Wishlist, Cart, and Orders.

---

## Enumerated 18-Request ShopKart Demo Collection

APIForge includes an importable demo collection representing a complete e-commerce backend workflow. All 18 endpoints are backed by APIForge's built-in mock controller and require zero external dependencies:

| # | Name | Method | Route | Auth | Status | Key Assertions |
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

*Note: Order creation represents a standard REST resource submission (`POST /orders`). In accordance with project requirements, third-party payment gateways (Razorpay, Stripe) have been intentionally omitted.*

---

## Project Structure

```
MERN_PROJECT/
├── .env.example              # Server environment template
├── .gitignore                # Git exclusions
├── package.json              # Monorepo scripts (dev, build, test, start)
│
├── server/                   # Express.js Backend Server
│   ├── package.json          # Server dependencies & scripts
│   ├── src/
│   │   ├── app.js            # Express app with Helmet, CORS & Rate limiting
│   │   ├── server.js         # HTTP server entrypoint
│   │   ├── config/
│   │   │   ├── db.js         # Mongoose connection & error recovery
│   │   │   └── env.js        # Zod startup environment validation
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Collection.js
│   │   │   ├── SavedRequest.js
│   │   │   ├── Environment.js
│   │   │   ├── RequestHistory.js
│   │   │   └── TestRun.js
│   │   ├── middleware/
│   │   │   ├── auth.js       # JWT cookie & header verification
│   │   │   ├── validate.js   # Zod body validation middleware
│   │   │   └── errorHandler.js
│   │   ├── utils/
│   │   │   ├── crypto.js     # AES-256-GCM symmetric encryption
│   │   │   └── ssrfGuard.js  # DNS verification & CIDR blocklists
│   │   ├── services/
│   │   │   ├── httpExecutor.js    # Undici outbound request executor
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
│   │   └── routes/           # Versioned Express routes (/api/v1/*)
│   └── tests/                # Vitest backend tests (47 unit & integration tests)
│       ├── auth.test.js
│       ├── ssrfGuard.test.js
│       ├── cryptoAndSecrets.test.js
│       ├── assertionEngine.test.js
│       ├── shopkartMock.test.js
│       └── demoCollection.test.js
│
└── client/                   # React + Vite Frontend
    ├── package.json
    ├── vite.config.js        # Vite + Vitest configuration with API proxy
    ├── tailwind.config.js    # Dark developer theme & custom palettes
    ├── src/
    │   ├── main.jsx          # React DOM entrypoint
    │   ├── App.jsx           # React Router & ProtectedRoute guards
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── EnvironmentContext.jsx
    │   ├── services/
    │   │   └── api.js        # Axios instance with credentials
    │   ├── components/common/
    │   │   ├── Button.jsx
    │   │   ├── Input.jsx
    │   │   ├── Modal.jsx
    │   │   ├── StatusBadge.jsx
    │   │   ├── KeyValueEditor.jsx
    │   │   ├── CodeEditor.jsx
    │   │   └── Toast.jsx
    │   ├── features/
    │   │   ├── workspace/    # TopNav, Sidebar & WorkspaceLayout
    │   │   ├── request-builder/ # RequestBuilder & ResponseViewer
    │   │   ├── collections/  # CollectionExplorer & Demo Importer
    │   │   ├── environments/ # EnvironmentManager
    │   │   ├── history/      # HistoryPanel
    │   │   ├── testing/      # CollectionRunner
    │   │   ├── documentation/ # DocumentationViewer
    │   │   └── auth/         # LoginPage & RegisterPage
    │   └── __tests__/        # Frontend component tests
```

---

## Installation & Setup

### 1. Prerequisites
- **Node.js**: v20 or higher (`node -v` to check)
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or a cloud MongoDB Atlas connection string.

### 2. Environment Configuration
Copy `.env.example` to `.env` in the root folder:
```bash
cp .env.example .env
```

Generate secure secrets locally using Node.js:
```bash
# Generate 48-byte hex secret for JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# Generate 32-byte hex key for ENCRYPTION_KEY (AES-256):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Fill in `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/apiforge
JWT_SECRET=<YOUR_GENERATED_JWT_SECRET>
ENCRYPTION_KEY=<YOUR_GENERATED_64_CHAR_HEX_KEY>
FRONTEND_ORIGIN=http://localhost:5173
ENABLE_INTERNAL_MOCK_TARGET=true
```

### 3. Install Dependencies
Install all dependencies across root, server, and client:
```bash
npm run install:all
```

---

## Running the Application

### Development Mode (Both Frontend & Backend)
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

### Running Backend Only
```bash
npm run dev:server
```

### Running Frontend Only
```bash
npm run dev:client
```

### Production Build & Serve
```bash
npm run build
npm start
```
The Express backend serves the optimized client bundle on `http://localhost:5000`.

---

## Running Automated Tests

APIForge includes 53 comprehensive unit, security, and integration tests across backend and frontend suites.

### Run All Tests
```bash
npm test
```

### Run Server Tests Only (47 Tests)
```bash
npm run test:server
```
Covers:
- `auth.test.js`: User registration, password hashing, JWT HttpOnly cookies, login validation, session persistence.
- `ssrfGuard.test.js`: CIDR blocklists, loopback restrictions, metadata IP `169.254.169.254` blocks, protocol validation, dev-only mock gating.
- `cryptoAndSecrets.test.js`: AES-256-GCM encryption/decryption, unique IV generation, authentication tag validation.
- `assertionEngine.test.js`: Rule-based assertion evaluation for status codes, latency, headers, and nested JSON fields.
- `shopkartMock.test.js`: Verification of all 18 ShopKart mock endpoints.
- `demoCollection.test.js`: Idempotent seeding of the 18-request demo collection.

### Run Client Tests Only (6 Tests)
```bash
npm run test:client
```
Covers:
- `ResponseViewer.test.jsx`: Status badge formatting, duration, size, assertion results rendering.
- `KeyValueEditor.test.jsx`: Dynamic key-value row insertion, modification, and deletion.

---

## Connecting an External ShopKart Backend

If you wish to test a live external ShopKart backend instead of the built-in mock target:
1. Open the **Environments** view in APIForge.
2. Select or create an environment (e.g. `ShopKart External`).
3. Set `baseUrl` to your external backend's URL (e.g. `http://localhost:4000/api`).
4. Set `authToken` to a valid customer JWT issued by your external backend.
5. In development mode with `ENABLE_INTERNAL_MOCK_TARGET=true`, requests to approved internal targets execute cleanly.

---

## Security Design & Best Practices

1. **HttpOnly Authentication Cookies**: JWT tokens are stored in HttpOnly cookies with `sameSite: 'lax'` (or `'strict'` in production) to mitigate XSS-based token theft.
2. **SSRF Guard**:
   - Outbound requests resolve hostnames before socket connection.
   - Every resolved IP is checked against CIDR ranges: `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, and IPv6 unique local/link-local ranges.
   - Redirects are inspected and re-validated against SSRF policies.
3. **Sensitive Variable Protection**:
   - All secret variables are encrypted with AES-256-GCM.
   - Secret values are masked in the UI and never leaked to history or logs.
4. **Per-User Ownership Scoping**: Every database query for collections, saved requests, environments, history, and test runs strictly includes `ownerId: req.user.id`.

---

## College End-Term Evaluation Demo Checklist

- [x] **Authentication**: Register with a new email, login, refresh page to verify session persistence, and logout.
- [x] **ShopKart Demo Import**: Click "Import ShopKart Demo" to populate the 18-request collection and local environment.
- [x] **Request Execution**: Open `Products - List All Products` and click **Send**. Inspect `200 OK`, latency in milliseconds, response size, and pretty-printed JSON.
- [x] **SSRF Security**: Try sending a request to `http://169.254.169.254` or `http://127.0.0.1:8080` to verify immediate 403 SSRF blocking.
- [x] **Environment Variables**: Inspect the "ShopKart Local" environment and verify `authToken` is masked with `********`.
- [x] **Collection Runner**: Run the entire 18-request ShopKart collection; verify all 42 assertions pass (100% pass rate).
- [x] **Documentation Generator**: View the interactive documentation for "ShopKart E-Commerce API", copy cURL commands, and click "Export .md" to generate the Markdown file.
- [x] **Automated Tests**: Run `npm test` to verify all 53 automated test suites pass.
