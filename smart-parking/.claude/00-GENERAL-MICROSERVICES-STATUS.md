General Microservices Status — UCE Smart Parking (v2)

Updated with the port numbering from your thesis document (section 5, theoretical framework) and the mapping of Circuit Breaker, ACID and Outbox Pattern onto the existing Jira tasks. No new issue was added — everything is incorporated as an additional requirement inside tasks you already have.

⸻

Final port numbering

Your thesis document uses a different numbering than what is already running in the code (for example, there Auth = 3001, but in the real repo Auth is already deployed on 3000). Changing the ports of services that are ALREADY IN PRODUCTION means touching the gateway, Terraform, docker-compose and CI/CD of 8 services that already work — that is an unnecessary risk at this stage of the project.

Recommendation: leave the already-implemented services on their real port (do not touch code), and only correct the thesis document text so it matches the code. For the services that DO NOT EXIST YET, I adopt exactly the order from your thesis document, since there is nothing to break there.

| Port | Service | Status |
|---|---|---|
| 3000 | auth-service | ✅ Implemented (your thesis says 3001 — fix the text, not the code) |
| 3001 | user-service | ✅ Implemented (your thesis says 3002 — fix the text) |
| 3002 | frontend | ✅ Implemented (not in your thesis list) |
| 3003 | vehicle-service | ✅ Implemented (not in your thesis list) |
| 3004 | parking-service | ✅ Implemented (your thesis says 3003 — fix the text) |
| 3005 | reservation-service | ✅ Implemented (your thesis says 3004 — fix the text) |
| 3006 | gateway-service | ✅ Implemented (not in your thesis list) |
| 3007 | payment-service | ✅ Implemented (your thesis says 3005 — fix the text) |
| 3008 | realtime-service | ❌ Pending (matches your thesis) |
| 3009 | ai-service | ❌ Pending (matches your thesis) |
| 3010 | analytics-service | ❌ Pending (matches your thesis) |
| 3011 | notification-service | ❌ Pending (matches your thesis) |
| 3012 | audit-service | ❌ Pending (matches your thesis) |
| 3013 | search-service | ❌ Pending (matches your thesis) |
| 3014 | integration-service | ❌ Pending (matches your thesis) |
| 3015 | backup-service | ❌ Pending (matches your thesis) |

15 backend microservices + frontend = comfortably meets the mandatory requirement of "at least 10 microservices".

⸻

Circuit Breaker, ACID and Outbox — where they fit inside the tasks you already have

These three patterns are not new tasks: they are additional technical requirements added to inter-service communication tasks (Circuit Breaker) and to database-write-plus-event-publishing tasks (ACID + Outbox) that already exist in your backlog.

Outbox Pattern — prevents the "dual write" problem (saving to the database but failing to publish the event, or vice versa). Applies to every task where a service changes its state in the database AND publishes an event to Kafka or RabbitMQ in the same step:

* reservation-service — the task of publishing reservation.* events when a reservation's state changes (creation, check-in, check-out, cancellation, expiration). This is also the task where we fix the bug where reservation.checkout never reaches payment-service via RabbitMQ — by implementing Outbox, that fix comes naturally included (the same outbox record gets published to both Kafka and RabbitMQ as needed).
* payment-service — the task of publishing payment.completed / payment.failed to RabbitMQ after processing a simulated payment.
* parking-service — the task of publishing slot.* when a slot's state changes (occupied, released, reserved, under maintenance).
* user-service — the task of publishing Kafka events when a profile is updated or deleted.
* auth-service — if a session-event audit task exists (login, logout, token revocation), it must also use Outbox if those events are published to Kafka.

ACID — business transactions that combine more than one write operation must be atomic (everything is saved or nothing is):

* payment-service — processing the simulated payment and generating the digital receipt must happen inside a single database transaction. If receipt generation fails, the payment must not be left registered as half-completed.
* reservation-service — creating a reservation must combine, in a single transaction: acquiring/verifying the Redis distributed lock, changing the slot's state, and inserting the reservation record (plus the outbox record, see above). The distributed-lock task already exists (preventing duplicate reservations); it now gets the additional requirement that the whole set must be atomic.
* parking-service — the slot state change and its corresponding internal record (for the service's own internal audit) must be atomic.

Circuit Breaker — protects the system when a service it synchronously depends on (HTTP or gRPC) is down or responding slowly, preventing the failure from cascading:

* gateway-service — the task of the proxy controllers that forward REST requests to each backend microservice must include a circuit breaker per target service (if auth-service does not respond, the gateway must fail fast with a 503 instead of hanging the client's request).
* user-service — the task of communicating with auth-service via gRPC to validate identity must include a circuit breaker (if auth-service goes down, user-service must not wait indefinitely).
* ai-service (new, see ai-service.md) — the task of querying search-service when the favorite slot is unavailable must include a circuit breaker.
* integration-service (new, see integration-service.md) — the GraphQL resolvers and the SOAP bridge that call other microservices over REST must include a circuit breaker.

None of these three points requires opening a new Jira ticket: they are added as additional acceptance criteria inside the existing tasks mentioned above (for already-implemented services) and inside the corresponding tasks of the new .md files (for pending services).

⸻

Verification against the course's mandatory requirements

| # | Requirement | Meets it | Evidence / Pending |
|---|---|---|---|
| 1 | Monorepo | ✅ | A single Nx repository with all services and the frontend |
| 2 | A single backend language and framework | ✅ | TypeScript + NestJS across all microservices |
| 3 | Multi-platform with roles and permissions | ⚠️ Partial | Web (frontend) implemented with STUDENT/PROFESSOR/ADMIN roles via JWT. Mobile or Desktop still missing (your thesis mentions an Electron desktop app in USP-160/161/162 — pending) |
| 4 | At least 10 microservices | ✅ | 15 backend + frontend (see port table) |
| 5 | Security (Jump Box, EC2 Bastion, CORS, Cloudflare, Rate Limiting, JWT) | ⚠️ Partial | ✅ EC2 Bastion (already used in the CD for SSH), ✅ CORS, ✅ JWT (RS256 + refresh token rotation). ❌ Cloudflare/WAF (USP-163-165 pending). ❌ Explicit Rate Limiting — needs verification whether a global throttler exists or only in the gateway |
| 6 | BaaS/PaaS (Contentful, Strapi, Supabase) | ❌ Pending | Not detected in the repo — need to decide which one and where it fits (natural candidate: Strapi for static frontend content) |
| 7 | DevOps (CI/CD, GitHub Actions) | ✅ | ci.yml, qa.yml, prod.yml working (with the fixes already applied in this conversation) |
| 8 | Testing (Load, Unit, Functional, integrated into CI/CD) | ⚠️ Partial | Unit tests detected in payment-service. Need to confirm Functional/Integration and Load Testing (k6/Artillery), and that they run inside ci.yml, not just locally |
| 9 | Docker Hub / GHCR | ✅ | docker-push in prod.yml and qa.yml publish to Docker Hub |
| 10 | At least 4 design principles | ⚠️ Verify | The project uses hexagonal architecture (ports/adapters) in several services, which already implies Low Coupling and Cohesion. Need to explicitly document which 4 are applied and where (recommended: SOLID, DRY, Low Coupling, Cohesion) |
| 11 | At least 10 databases, with a cache and different types | ⚠️ Partial | PostgreSQL (auth, user, vehicle, parking, reservation, payment, audit = 7), Redis (cache, 1), MongoDB (ai, analytics = 2), Elasticsearch (search, non-relational). Once the pending services are implemented you would reach 10+ and 3 different types (relational, cache, document, search engine) |
| 12 | ELB and ASG | ⚠️ Partially fixed | A duplicated and misconfigured ASG for gateway/frontend was detected earlier in this session (it was causing constant create/destroy cycling). A fix was provided. Verify it stays applied and that the ALB routes correctly after the fix |
| 13 | Terraform | ✅ | infra/terraform with per-service modules, already reviewed in this session |
| 14 | API Gateway | ✅ | gateway-service |
| 15 | At least 3 communication methods (REST, SOAP, gRPC, Webhooks, WebSockets, GraphQL) | ⚠️ Pending until the new services are built | REST ✅ (already implemented). gRPC pending (user-service ↔ auth-service, described in your thesis but not detected in the real code — needs verification). WebSockets pending (realtime-service). GraphQL, SOAP and Webhooks pending (integration-service). Once integration-service + realtime-service are implemented, the minimum of 3 is comfortably met |
| 16 | At least 2 architectures (MVC, MVVM, Hexagonal, Layered) | ✅ | NestJS already applies a layered architecture (controller/service/repository) and several services use hexagonal (ports/adapters) per CLAUDE.md |
| 17 | Monitoring (Site24x7, Prometheus, Grafana) | ⚠️ Partial | Prometheus ✅ (/metrics endpoint on the services already reviewed). Grafana and Site24x7 pending (USP-166-168) |
| 18 | High availability | ⚠️ Partial | ALB + an ASG attempt (with the already-fixed bug). Need to confirm it truly ends up highly available after the fix |
| 19 | Connection to an on-premise environment for backups | ❌ Pending | Corresponds to backup-service (see backup-service.md) |
| 20 | Automate business processes with n8n | ❌ Pending | Corresponds to integration-service (see integration-service.md) |
| 21 | Documentation (Swagger, Conventional Commits, PRs, README) | ✅ Partial | Swagger detected in the already-implemented services. Conventional Commits already in use (seen in the commit history). Need to confirm a README per service |

⸻

Verification of the "red text" mandatory items

| Mandatory | Meets it | Evidence |
|---|---|---|
| Kafka | ✅ | kafkajs in parking-service, reservation-service, payment-service, and in the new pending ones (realtime, notification, analytics, audit, search) |
| RabbitMQ | ⚠️ Implemented but with the already-reported integration bug (reservation-service does not publish to RabbitMQ). With the Outbox Pattern above, this bug gets fixed as part of the same work |
| MQTT | ❌ Not detected in the repo | Does not appear in any .md or in the code. Need to decide where it fits (natural candidate: communication with physical occupancy IoT sensors in the slot, if the project considers real hardware; if there is no real hardware, an MQTT publisher can be simulated from parking-service toward a broker such as Mosquitto) |
| Microservices | ✅ | 15 independent services |
| Event Driven Architecture | ✅ | Kafka + RabbitMQ as the backbone of asynchronous communication |
| CQRS | ⚠️ Needs verification | Your thesis document (section 5.3) mentions it as part of reservation-service's theoretical framework (commands → Kafka events, queries → Redis cache). If reservation-service's real code does not explicitly separate a write model from a read model, it still needs to be implemented as such, not just mentioned in the thesis |

⚠️ MQTT is the only mandatory item I could not find anywhere in the project. I recommend resolving this soon since it is "red text" (non-negotiable) and there is no existing task where it naturally fits — it will most likely require a new task in parking-service or in a small IoT adapter.

⸻

Files from the previous iteration that are still valid

* realtime-service.md, notification-service.md, ai-service.md, analytics-service.md, search-service.md, audit-service.md, integration-service.md, backup-service.md — same services, same tasks (same USP numbers), now translated to English, code-free (activity/specification format), with Circuit Breaker/ACID/Outbox incorporated where applicable.
