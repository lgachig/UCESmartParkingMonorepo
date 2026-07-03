Analytics Service — Agent Context

Read the global CLAUDE.md first, then this file.
This service DOES NOT EXIST YET.

⸻

Status

🔴 PENDING — Epic USP-9 (issues USP-127 to USP-131)

Port: 3010

Database: MongoDB (raw event history) + ClickHouse (aggregations for dashboards)

Message Broker: Kafka (consumer of all topics)

Framework: NestJS + Nx

⸻

Service Purpose

Consumes every business event in the system and retains it for historical analysis and generation of admin dashboards (occupancy, revenue, average time per zone). It differs from audit-service: here the goal is business/analytics and the data can be reprocessed; in audit-service the goal is compliance and the data is immutable.

⸻

USP-127 — As an admin I want a dashboard with occupancy, revenue and average time metrics per zone

What it must do

* Expose read-only endpoints, restricted to the admin role, that return aggregated metrics: current and date-range occupancy, daily revenue, average usage time per zone, and most-used slots.
* These queries must be resolved against the aggregation layer (ClickHouse, see USP-129), not against the raw history, so they respond fast even with a lot of accumulated data volume.

How it's validated as done

* Each dashboard endpoint responds in under half a second with data from the last 30 days.
* Only the admin role can access these endpoints.

⸻

USP-128 — Kafka consumer of ALL events: persist to MongoDB

What it must do

* Subscribe to every business event topic in the system (slots, reservations, payments, users, vehicles), without needing to maintain a fixed list that has to be manually updated every time a new topic is added.
* Store each event received as-is, together with its source topic and the reception timestamp, without transforming it.
* This storage is the raw history: it serves as the source of truth to be able to rebuild or recalculate aggregated metrics if the business logic ever changes.

How it's validated as done

* Any event published in the system ends up recorded in the history, with no exceptions.

⸻

USP-129 — ClickHouse for OLAP time-series queries for admin dashboards

What it must do

* Maintain a data layer optimized for fast aggregations (hourly occupancy, daily revenue, etc.), separate from the raw MongoDB history.
* Periodically sync the relevant data from the raw history into this aggregation layer (not in real time event-by-event, but in short batches, since this is dashboard data, not information for instant operational decisions).

How it's validated as done

* The dashboard queries (USP-127) are resolved against this layer, not directly against MongoDB.
* The aggregation layer's data reflects reality with a lag of at most a few minutes.

⸻

USP-130 — Dockerfile + CI/CD + Swagger + Prometheus for analytics-service

What it must do

* Same packaging, health, metrics, and CI/CD pattern as the rest of the new services.
* Metrics must include the number of events processed per topic and the status of the sync toward the aggregation layer.

How it's validated as done

* The image builds and publishes correctly, and the service ends up deployed and reachable in QA.

⸻

USP-131 — Unit tests for analytics-service

What it must do

* Cover the raw-history persistence (that any incoming event ends up correctly stored).
* Cover the aggregation logic that feeds the dashboard (occupancy, revenue, average time calculations) using controlled test data.

How it's validated as done

* The tests run inside the CI pipeline and cover both ingestion and metric calculation.

⸻

Expected Result

A functional service with MongoDB for raw history and ClickHouse for fast aggregations, feeding an admin dashboard with occupancy, revenue and average-time metrics, with its Dockerfile, CI/CD, documentation and tests in place.
