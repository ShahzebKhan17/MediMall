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
                    ┌─────────────────────┐
                    │       User          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Next.js Frontend  │
                    │       React         │
                    └──────────┬──────────┘
                               │
                         REST API
                               │
                               ▼
                    ┌─────────────────────┐
                    │   FastAPI Backend   │
                    │       Python        │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        ┌──────────┐     ┌──────────┐    ┌────────────┐
        │PostgreSQL│     │ AI Layer │    │  Pharmacy  │
        │ Database │     │          │    │  Routing   │
        └──────────┘     └──────────┘    └────────────┘
                               │
                               ▼
                     Prescription Analysis
                               │
                               ▼
                       Pharmacist Review
                               │
                               ▼
                          Order Dispatch
