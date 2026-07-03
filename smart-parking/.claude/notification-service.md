Notification Service — Agent Context

Read the global CLAUDE.md first, then this file.
This service DOES NOT EXIST YET.

⚠️ This service is DIFFERENT from realtime-service. realtime-service keeps the map alive via WebSocket; notification-service sends emails, push notifications, and alerts. They don't share code or a database.

⸻

Status

🔴 PENDING — Epic USP-9 (issues USP-103 to USP-108)

Port: 3011

Database: None of its own

Cache: Redis (deduplication of already-notified events)

Message Brokers: RabbitMQ (consumer) + Kafka (consumer) — this service consumes from BOTH

Framework: NestJS + Nx + Nodemailer

⸻

Service Purpose

Sends notifications via email (SMTP), push notifications and system alerts, deciding who to notify and what to notify based on events received from reservation-service (via Kafka) and payment-service (via RabbitMQ).

⸻

USP-103 — As a user I want to receive a confirmation email when I create a reservation

What it must do

* Listen for the reservation-created event published by reservation-service.
* Compose and send an email with the reservation code, the assigned slot, and the deadline to check in before it expires automatically.
* If the email fails to send (SMTP provider down, invalid credentials), the error must be logged without stopping the processing of the rest of the incoming events.
* The same creation event must never generate two duplicate emails, even if the message is received more than once from the broker (idempotency via Redis, storing a flag keyed by reservation ID for 24 hours).

How it's validated as done

* Upon creating a reservation, the user receives the email within 5 seconds.
* Manually resending the same event does not generate a second email.

⸻

USP-104 — As a user I want to receive an email when my reservation expires or is cancelled

What it must do

* Listen for the cancellation and automatic-expiration events published by reservation-service.
* Send the corresponding email for each case, with a distinct message (cancelled by the user vs. expired due to not checking in on time).
* Apply the same idempotency rule as in USP-103.

How it's validated as done

* Cancelling or letting a reservation expire triggers the correct email in each case.

⸻

USP-105 — RabbitMQ consumer with routing by event type and user role

What it must do

* Connect to the same RabbitMQ exchange that payment-service uses to publish payment results (payment.completed and payment.failed).
* Differentiate the email content based on the user's role: a professor who doesn't pay (rate $0.00) should receive a "reservation confirmed" message, not a "payment processed" message, even though technically it's the same event.
* Reconnect automatically if the connection to RabbitMQ is lost, without losing messages that were already queued.
* A message that cannot be processed correctly must not stay retrying forever: it must be discarded in a controlled way after failing, leaving a record of the reason.

Important note on this same requirement

This consumer will not receive real traffic in the checkout flow until the Outbox Pattern is implemented in reservation-service (see 00-ESTADO-GENERAL-MICROSERVICIOS.md): today reservation-service does not publish the checkout event via RabbitMQ, only via Kafka, so payment-service never actually processes the payment automatically nor publishes payment.completed. This consumer can be built and tested with a test message while the full flow is fixed on the reservation-service side.

How it's validated as done

* A successful payment generates the correct email depending on whether the user paid or not.
* A failed payment generates a different email, explaining that it could not be processed.
* A corrupted message does not block the queue nor stop the consumption of subsequent messages.

⸻

USP-106 — Kafka consumer for system-level alerts

What it must do

* Define a shared channel (a Kafka topic) that any microservice in the project can use to report an operational alert (for example, a service detecting repeated failures in an external integration).
* Log every alert received, indicating which service originated it, its severity level, and the message.
* Leave the mechanism prepared for, in a later phase, automatically notifying administrators when severity is high (this part of notifying administrators is not required in this task, only the logging).

How it's validated as done

* Any other service can publish an alert to the shared channel and it is correctly logged by notification-service.

⸻

USP-107 — Sending emails via SMTP (Nodemailer)

What it must do

* Configure sending of real emails using an SMTP provider, fully parameterized via environment variables (host, port, user, password, sender) to be able to use different credentials in QA and PROD without touching code.
* The three emails from USP-103/104/105 must rely on this same sending mechanism, not each reimplement it separately.
* A sending failure must be logged with enough detail to debug it (recipient, subject, failure reason) without exposing credentials in the log.

How it's validated as done

* A test email is delivered correctly against a real SMTP provider in QA.
* An incorrect-credentials failure is clearly logged, without crashing the service.

⸻

USP-108 — Dockerfile + CI/CD + Swagger + Prometheus for notification-service

What it must do

* Package the service following the same Docker pattern as the rest of the microservices.
* Expose health and metrics (number of emails sent, number of send failures, number of events processed per broker).
* Add the corresponding filter in the CI pipeline.
* Add the Terraform module for deployment (static instance, same pattern as the other backend services without a public interface).

How it's validated as done

* The image builds and publishes correctly.
* The service ends up deployed and reachable in QA, with /health and /metrics responding.

⸻

Expected Result

A service with no database of its own, fully event-driven, that consumes Kafka (reservation events and alerts) and RabbitMQ (payment events) in parallel, sends real emails via SMTP, avoids duplicates using Redis, and is ready for production once the publishing flow from reservation-service to RabbitMQ is fixed.
