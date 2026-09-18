# Security Architecture & Risk Mitigations

## 1. Threat Modeling & Defenses

| Threat / Vulnerability | Risk | Architecture Defense |
| :--- | :--- | :--- |
| **Client-Side Price Tampering** | High | The server recalculates totals using authoritative DB rates. Client prices in request payloads are ignored. |
| **Receipt Upload Malware / RCE** | Critical | Strict MIME inspection (`image/jpeg`, `image/png`, `image/webp`), 5MB size limit, randomized storage names, stored outside web root with authorized streaming. |
| **Insecure Direct Object Reference (IDOR)** | High | Orders have private random UUID tracking tokens (`trackingToken`) alongside public short IDs (`#PH-1024`). Users can only view tracking data matching their session/token. |
| **Privilege Escalation** | Critical | Role-based middleware and Server Action authorization guards checking session role before performing cashier/kitchen/manager operations. |
| **Duplicate Order Submissions** | Medium | Client-side button debouncing + Server Action idempotency key generated per checkout session. |
| **SQL Injection** | Low | Fully mitigated via Prisma ORM parameterized queries. |
| **Cross-Site Scripting (XSS)** | Medium | React virtual DOM auto-escaping + strict Content-Security-Policy (CSP) headers. |
| **Financial Fraud (Fake Bank Slips)** | High | Transfer orders remain in `PAYMENT_PENDING` until a human cashier inspects the receipt against merchant bank SMS notifications and manually approves. |

---

## 2. Receipt Upload Guardrails

```typescript
export const UPLOAD_CONSTRAINTS = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
};
```
1. Filenames are generated using cryptographic random UUIDs (e.g. `rcpt_8f93a1c...png`). Original filenames are sanitized and stored as metadata only.
2. Direct execution of files is prevented by web server headers (`X-Content-Type-Options: nosniff`).
