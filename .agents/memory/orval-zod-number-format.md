---
name: Orval Zod numeric schema compatibility
description: Integer OpenAPI properties generate an incompatible Zod helper in this workspace.
---

Use OpenAPI `number` properties for whole-number fields in API contracts unless the generator/runtime combination is upgraded and verified.

**Why:** The current Orval/Zod setup generates `zod.int()` for `integer`, but the installed Zod runtime does not expose that helper, breaking the generated library typecheck.

**How to apply:** Model ranks, scores, counts, and similar whole values as `number`; validate integer semantics in application code if needed.