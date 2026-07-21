# Site operating lifecycle

`/api/operating-lifecycle` creates one tenant/site/business-day cycle, validates opening readiness and safety interlocks, records degraded/halted operation, and blocks close until POS/payment, inventory/chemical, workforce, accounting, and environmental reconciliation is approved. Device telemetry requires a certificate fingerprint and monotonic sequence. Forecasts are deterministic and disclose their simple comparable-period method.

Provider calls remain durable jobs until independently configured workers succeed. Payment/PCI assessment, authenticated equipment certificates, calibrated chemical/water meters, environmental permits, accounting controls, labor-system contracts, and production reconciliation remain external gates. Startup is non-destructive; bootstrap, migration, and guarded demo seed are separate.
