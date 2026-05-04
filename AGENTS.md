<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🧠 Agents.md — Step-by-Step Execution Guide

Enterprise Subscription Management System

---

## ⚙️ 0. Execution Principles

* Always prioritize **data integrity over speed**
* Keep UI **simple and non-technical**
* Follow **modular and scalable architecture**
* Avoid duplicate logic across layers
* Validate all inputs before DB writes

---

## 🧱 1. Project Initialization

### 1.1 Frontend Setup (Next.js)

* Initialize Next.js (App Router, TypeScript)
* Setup folder structure:

  * `/app`
  * `/components`
  * `/lib`
  * `/services`
  * `/store` (if using Redux)

### 1.2 Backend Setup (Node.js)

* Initialize Node.js server
* Use:

  * Express OR NestJS
* Create base structure:

  * `/controllers`
  * `/services`
  * `/repositories`
  * `/middlewares`
  * `/routes`

### 1.3 Database Setup

* Use **MongoDB**
* Create connection module
* Enable environment-based config

---

## 🧩 2. Data Modeling

### 2.1 Create Subscription Schema

Must include:

* toolName
* vendor
* plan
* startDate
* expiryDate
* paymentCycle
* status
* licenses
* departments[]
* teams[]
* owner { name, email, userId }
* renewalReminderDays[]
* timestamps

### 2.2 Constraints

* Unique: `toolName + vendor`
* Required:

  * toolName
  * vendor
  * owner
  * expiryDate

---

## 🔌 3. API Development

### 3.1 Build Core APIs

#### Create Subscription

* Validate required fields
* Check duplicate before insert
* Save record

#### Get Subscriptions

* Support:

  * Filtering (status, department)
  * Pagination

#### Update Subscription

* Allow partial updates
* Update timestamps

#### Delete Subscription

* Soft delete preferred
* Prevent deletion if in use

---

## 🧠 4. Business Logic Layer

### 4.1 Status Automation

* If `expiryDate < today` → mark `expired`

### 4.2 Renewal Logic

* Trigger reminders based on:

  * renewalReminderDays[]

### 4.3 Ownership Handling

* If owner removed:

  * Assign fallback admin
  * Log change

---

## 🔔 5. Notification System

* Build background job (cron)
* Run daily:

  * Check upcoming renewals
  * Send alerts (log for now)

---

## 🖥️ 6. Frontend Development

### 6.1 Core Pages

* Dashboard
* Subscription List
* Add/Edit Subscription Form

### 6.2 Form Features

* Dropdowns for:

  * status
  * payment cycle
* Multi-select:

  * departments
  * teams

### 6.3 UX Rules

* No technical jargon
* Clear labels
* Inline validation errors

---

## 📊 7. Dashboard Implementation

Display:

* Total subscriptions
* Active / Expired count
* Expiring soon list

Add charts:

* Subscriptions by status
* Department usage

---

## 🧾 8. Audit Logging

Track:

* Create
* Update
* Status change
* Ownership change

Store:

* action
* timestamp
* user

---

## 🚫 9. Duplicate Prevention

Before creating:

* Check:

  * toolName + vendor exists
* Reject request if duplicate

---

## ⚠️ 10. Edge Case Handling

### 10.1 Multi-Team Usage

* Allow multiple teams per subscription
* Prevent accidental deletion

### 10.2 Partial Failures

* Use try/catch in all services
* Rollback where needed

### 10.3 Expiry

* Auto-update expired subscriptions

---

## 🔐 11. Role-Based Access (Optional Phase)

Roles:

* Admin → full access
* Manager → limited edit
* Viewer → read-only

---

## 🧪 12. Testing

* Unit test services
* Test API endpoints
* Validate:

  * duplicate prevention
  * expiry logic

---

## 🚀 13. Deployment Readiness

* Use environment variables
* Enable logging
* Optimize API responses

---

## 📦 14. Final Checklist

* [ ] CRUD APIs working
* [ ] No duplicate subscriptions
* [ ] Dashboard displays correct data
* [ ] Expiry automation works
* [ ] Ownership assigned correctly
* [ ] Alerts system running
* [ ] UI usable by non-technical users

---

## 🧠 Agent Execution Notes

* Never skip validation
* Always log critical changes
* Keep functions small and reusable
* Avoid tight coupling between layers
* Design for future scalability
