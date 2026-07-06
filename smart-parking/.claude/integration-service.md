Integration Service — Agent Context

Read the global CLAUDE.md first, then this file.
This service DOES NOT EXIST YET.

⸻

Status

🔴 PENDING — Epic USP-9 (issues USP-137 to USP-141)

Port: 3014

Database: None of its own — acts as an aggregator over the other services

Framework: NestJS + Nx + Apollo Server (GraphQL) + SOAP adapter

⸻

Service Purpose

Exposes alternative integration methods beyond REST: GraphQL for the frontend, SOAP for the university's legacy systems, and outbound webhooks toward n8n to automate business processes.

⸻

USP-137 — As a frontend I want a GraphQL API (Apollo Server) for flexible queries

What it must do

* Expose a GraphQL endpoint that lets the frontend request, in a single query, data that today requires several separate REST calls (for example, a user's reservations together with slot and user data, in a single network round-trip).
* Every GraphQL resolver that needs data from another microservice must call it internally through that service's existing REST API, not duplicate business logic.
* Any synchronous call from a resolver to another microservice must implement a circuit breaker: if that microservice is down or slow, the resolver must fail fast with a clear error inside the GraphQL response (without breaking the rest of the query if other fields could be resolved), instead of leaving the request hanging.

How it's validated as done

* A GraphQL query can combine data from more than one microservice in a single response.
* If one of the microservices a resolver depends on is down, the query still responds (with that field in error) instead of hanging indefinitely.

⸻

USP-138 — As the university I need a SOAP interface to integrate with legacy systems

What it must do

* Expose at least the slot-availability-by-faculty query operation in SOAP format, since it is the highest-value use case for an external legacy system.
* This SOAP operation must internally translate the request into a call to parking-service's existing REST API, without duplicating the availability logic.
* This internal call must also be protected with a circuit breaker, for the same reason as the GraphQL resolvers.

How it's validated as done

* An external SOAP client can query a faculty's slot availability and receive a valid response in the format expected by legacy systems.

⸻

USP-139 — Outbound webhooks to n8n for business process automation

What it must do

* Detect relevant business events (for example, a new reservation or a completed payment) and notify them to n8n via an outbound request, so n8n can orchestrate external workflows from there (reports, internal alerts, etc.).
* If the notification to n8n fails, the error must be logged without affecting the original business flow (the payment or reservation already happened correctly regardless of whether n8n found out about it).

How it's validated as done

* Upon completing a payment or creating a reservation, n8n receives the corresponding notification.
* If n8n is unavailable at that moment, the rest of the system keeps working normally.

⸻

USP-140 — Configure n8n workflows: notification, payment, report

What it must do

* Stand up n8n as part of the project's infrastructure.
* Configure three base automation workflows: one triggered by notification events, one by payment events, and one that generates some kind of periodic or on-demand report.
* This task is mainly infrastructure and workflow configuration inside n8n, not application code.

How it's validated as done

* n8n is reachable and the three workflows are active and respond correctly to the webhooks from USP-139.

⸻

USP-141 — Dockerfile + CI/CD + Swagger + Prometheus for integration-service

What it must do

* Same packaging, health, metrics, and CI/CD pattern as the rest of the new services.
* Metrics must include how many times the circuit breaker toward each dependent microservice was triggered (to monitor which integrations are less reliable).

How it's validated as done

* The image builds and publishes correctly, and the service ends up deployed and reachable in QA.

⸻

Expected Result

A functional service that exposes GraphQL, SOAP and webhooks toward n8n, with resilient internal calls (circuit breaker) toward the other microservices, and its Dockerfile, CI/CD, documentation and metrics in place.
