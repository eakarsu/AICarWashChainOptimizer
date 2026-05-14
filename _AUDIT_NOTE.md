# Audit Apply Note — AICarWashChainOptimizer

Source: `_AUDIT/reports/batch_01.md` § 17.

## Original audit recommendations
- Missing notifications system
- Missing reporting / export
- Missing integration API (no webhooks)
- Strategic: agentic workflows, RAG, real-time anomaly detection, white-label

## Implemented in this pass (MECHANICAL)

| # | Item | File | Endpoints |
|---|------|------|-----------|
| 1 | Webhook subscription stub | `backend/src/routes/webhooks.js` (new) + `backend/src/server.js` | `GET/POST/DELETE /api/webhooks`, `POST /api/webhooks/:id/test`, `GET /api/webhooks/_/events` |

Allowed events: wash.completed, membership.signup/cancelled, equipment.maintenance_due, chemical.low, staffing.shift_open, revenue.target_missed, feedback.received, weather.adverse. Lazy table; payload-only test (no outbound HTTP). `node --check` passes.

## Backlog (not implemented)

| Item | Tag | Why deferred |
|------|-----|---------------|
| Email/SMS/push notifications | NEEDS-CREDS | SMTP / Twilio / FCM |
| Reporting / export | TOO-RISKY | Templates + UI |
| Outbound webhook delivery | TOO-RISKY | Background job infra |
| POS integrations | NEEDS-CREDS | Vendor partnerships |
| Multi-agent orchestration | NEEDS-PRODUCT-DECISION | Agent topology |

## Apply pass 3 (frontend)

LEFT-AS-IS — frontend already wires every backend AI endpoint (JWT Bearer from localStorage, matching existing styling, 503-no-key handled by backend). No changes needed. See `_AUDIT/apply3_logs/ab3_52.md` for details.

## Apply pass 4 (mechanical backlog)

NOTHING-TO-DO. Backlog is exclusively NEEDS-CREDS (notifications, POS integrations), TOO-RISKY (reporting/export templates, outbound webhook delivery infra), or NEEDS-PRODUCT-DECISION (multi-agent orchestration topology). None of these qualify as mechanical "BE endpoint + FE page" work without first making product/credential decisions. Existing webhook subscription stub + frontend already in place from earlier passes. See `_AUDIT/apply4_logs/ab3_52.md`.
