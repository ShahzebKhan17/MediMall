# MediMall

> **We Deliver Before Everyone Knows.**

MediMall is an AI-powered hyperlocal medicine ordering platform designed to connect customers with nearby pharmacies for fast and reliable medicine delivery.

The platform provides two ways to order medicines:

1. Search and directly order a known medicine.
2. Use an AI-assisted health interface to analyze symptoms or prescriptions and receive medicine recommendations.

Before an order is dispatched, the selected pharmacy verifies the prescription/recommendation to add an additional layer of safety and trust.

---

## 🚀 Key Features

### 👤 User Dashboard

Users can manage their personal information including:

- Name
- Age
- Mobile number
- Email
- Address
- Allergies
- Order history
- Prescription history

### 💊 Medicine Search & Ordering

Users can:

- Search for medicines by name
- View medicine details
- Add medicines to cart
- Place orders
- Track order status
- Upload prescriptions

### 🤖 AI-Assisted Medicine Recommendation

Users can describe their symptoms or provide prescription information using:

- Text
- Multiple languages
- Uploaded prescriptions

The AI analyzes the provided information and generates recommendations.

> **Important:** AI recommendations are intended as an assistance layer and are subject to pharmacist verification before order dispatch.

### 🏥 Pharmacy / Shopkeeper Dashboard

Every registered pharmacy has its own dashboard containing:

- Shop name
- Owner name
- Shop address
- GST information
- Medical license number
- Mobile number
- Email
- Medicine inventory
- Incoming orders
- Prescription verification
- Order history
- Sales analytics

### 📍 Hyperlocal Pharmacy Allocation

When a user places an order, the platform identifies nearby registered pharmacies and routes the order to the most suitable pharmacy based on:

- Distance
- Medicine availability
- Pharmacy status
- Order capacity

The goal is to enable **ultra-fast local delivery**, with a target of approximately 10 minutes where operationally feasible.

### 🔍 Prescription Verification

For prescription-based orders:

1. User uploads a prescription.
2. AI extracts/analyzes the relevant information.
3. A nearby pharmacy receives the order.
4. The pharmacist verifies the requested medicines.
5. The pharmacist confirms or rejects the order.
6. The order proceeds to fulfillment only after verification.

This creates an additional human verification layer instead of relying solely on AI.

### 📊 Pharmacy Analytics

Each pharmacy can analyze its own business data, including:

- Total orders
- Completed orders
- Cancelled orders
- Most ordered medicines
- Sales
- Customer ordering patterns
- Inventory information

---

# 🏗️ System Architecture

```text
                    ┌─────────────────────────────────────────┐
                    │               Web Client                │
                    │   Next.js 15 · React 19 · TypeScript    │
                    ├────────────────────┬────────────────────┤
                    │   Client State     │    Server State    │
                    │   Zustand Store    │   TanStack Query   │
                    │  (Persistent Cart) │  (Cache & Sync)    │
                    └──────────┬─────────┴──────────┬─────────┘
                               │                    │
                               └──────────┬─────────┘
                                          │
                                       REST API
                                          │
                                          ▼
                    ┌─────────────────────────────────────────┐
                    │             FastAPI Backend             │
                    │         Python · JWT Auth · CORS        │
                    └──────────┬──────────┬─────────┬─────────┘
                               │          │         │
               ┌───────────────┘          │         └───────────────┐
               ▼                          ▼                         ▼
        ┌──────────────┐           ┌──────────────┐          ┌──────────────┐
        │  PostgreSQL  │           │   AI Doctor  │          │   Pharmacy   │
        │  / SQLite DB │           │    Engine    │          │   Routing    │
        └──────────────┘           └──────────────┘          └──────────────┘
```

---

## 🛠️ Tech Stack & State Management

### 🎨 Frontend
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **State Management Architecture**:
  - 🔄 **TanStack Query (React Query v5)**: Manages all server state (user profile, medicine catalog, live orders queue, prescriptions). Features automatic background refetching, query deduplication, and declarative cache invalidation on mutations.
  - ⚡ **Zustand (v5)**: Manages pure client-side state (shopping cart) with built-in `persist` middleware for local storage synchronization.
- **Icons & UI**: Lucide React + custom responsive CSS design system with Dark/Light theme switching.

### ⚙️ Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database & ORM**: SQLAlchemy with SQLite (local development) / PostgreSQL (production)
- **Authentication**: JWT tokens via HttpOnly cookies and Bearer authorization headers with Bcrypt password hashing
- **Geocoding & Dispatch**: Haversine distance-based hyperlocal pharmacy matching algorithm

---

## 🚦 Getting Started

### 1. Backend Setup
```bash
cd Backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
