# Roles & Permissions (RBAC Matrix)

## 1. System Roles

1. **GUEST / CUSTOMER**: Unauthenticated or authenticated ordering customer.
2. **KITCHEN (طاقم المطبخ)**: Kitchen chefs and oven operators responsible for food preparation.
3. **CASHIER (أمين الصندوق / الكاشير)**: Front-counter staff responsible for order reception, payment verification, and handoff.
4. **MANAGER (مدير الفرع)**: Operational supervisor managing daily stock, menus, and business hours.
5. **OWNER / ADMIN (المالك / المدير العام)**: Full administrative authority, financial reports, user management, and system configuration.

---

## 2. RBAC Permission Matrix

| Capability / Permission | Customer | Kitchen | Cashier | Manager | Owner/Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Browse Menu & Products | Yes | Yes | Yes | Yes | Yes |
| Place Order & Upload Receipt | Yes | - | Yes | Yes | Yes |
| Track Own Order Status | Yes | - | Yes | Yes | Yes |
| View Kitchen Display (KDS) | - | **Yes** | Yes | Yes | Yes |
| Update Kitchen State (Prep $\to$ Ready) | - | **Yes** | - | Yes | Yes |
| View All Orders List | - | - | **Yes** | Yes | Yes |
| Verify / Reject Transfer Payments | - | - | **Yes** | Yes | Yes |
| Mark Order Completed (Handoff) | - | - | **Yes** | Yes | Yes |
| Toggle Item Sold Out / Available | - | - | - | **Yes** | Yes |
| Edit Prices & Menu Items | - | - | - | **Yes** | Yes |
| Pause / Resume Online Ordering | - | - | - | **Yes** | Yes |
| View Revenue & Analytics | - | - | - | **Yes** | Yes |
| Manage Staff Users & Roles | - | - | - | - | **Yes** |
| System Configuration & Settings | - | - | - | - | **Yes** |

---

## 3. Server-Side Enforcement Invariant

- Authorization checks are strictly enforced in Server Actions and API endpoints.
- UI button visibility is considered purely a UX convenience, never a security boundary.
- Attempting unauthorized mutations returns an explicit HTTP 403 Forbidden with audit logging.
