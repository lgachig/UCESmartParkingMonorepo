Audit Service — Agent Context

Read the global CLAUDE.md first, then this file.
This service DOES NOT EXIST YET.

⸻

Status

🔴 PENDING — Epic USP-10 (issues USP-109 to USP-112)

Port: 3012

Database: PostgreSQL (insert-only, never updated or deleted)

Message Broker: Kafka (consumer of all topics)

Framework: NestJS + Nx

⸻

Service Purpose

Immutably records every event in the system for auditing and regulatory compliance purposes. It differs from analytics-service: here the goal is legal, unalterable traceability, not business analysis, so no record can be modified or deleted once created.

⸻

USP-109 — As an admin I want all system events recorded immutably

What it must do

* Create the base microservice and expose a read-only query endpoint so an admin can review the audit history, filtering by source service, action type, and date range.
* This endpoint must be restricted so only the admin role can access it, the same as the rest of the project's administrative endpoints.
* There must be no endpoint, not even for admins, that allows modifying or deleting an already-created record. Immutability must be guaranteed by design, not only by permissions.

How it's validated as done

* An admin can query the history filtering by service, action, and dates.
* There is no way to alter an already-saved record, either via the API or via configuration.

⸻

USP-110 — Kafka consumer of ALL topics: persist to PostgreSQL insert-only

What it must do

* Subscribe to every business event published in the system, in a way that also captures topics added in the future without needing to modify the code each time a new one appears.
* Store every event received as a new record, never updating or overwriting an existing one.
* An event that cannot be fully parsed (unexpected format) must still be recorded with its raw content, instead of being silently discarded, since for auditing purposes it's preferable to over-record than to lose an event.

How it's validated as done

* Any event in the system, known or not, ends up recorded in the audit database without manual intervention.
* There is no code path that updates or deletes an already-inserted record.

⸻

USP-111 — auditdb schema: user, action, previous value, new value, timestamp

What it must do

* Define the data structure so that every record captures, at minimum: what action occurred, in which service, who triggered it (if applicable), what the previous value was, what the new value is, and the exact moment it happened.
* Optimize for the admin panel's most common queries (by source service, by user, by date range) so they respond quickly even with a large accumulated history.

How it's validated as done

* The audit endpoint queries (USP-109) respond in reasonable times even with thousands of accumulated records.

⸻

USP-112 — Dockerfile + CI/CD + Swagger + Prometheus for audit-service

What it must do

* Same packaging, health, metrics, and CI/CD pattern as the rest of the new services.
* Metrics must include the number of events audited per topic, to be able to detect if some service unexpectedly stopped publishing events.

How it's validated as done

* The image builds and publishes correctly, and the service ends up deployed and reachable in QA.

⸻

Expected Result

A functional service that immutably records, in PostgreSQL, absolutely every event in the system, with a query endpoint restricted to admins, and its Dockerfile, CI/CD, documentation and metrics in place.
