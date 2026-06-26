Payment Service — Agent Context

Read the global CLAUDE.md first, then this file.
This service DOES NOT EXIST YET and must be implemented from scratch following the project’s standard architecture and conventions.

⸻

Status

🟡 IN PROGRESS — USP-091 implemented (base service + fee calculation)

Port: 3007

Database: paymentdb (PostgreSQL)

Message Broker: RabbitMQ

Framework: NestJS + Nx

⸻

Service Purpose

The payment-service is responsible for calculating the parking fee during vehicle checkout, processing payments through Stripe Checkout (TEST mode), generating a digital receipt, persisting all payment information into PostgreSQL, and publishing payment events through RabbitMQ so the remaining microservices can continue the business workflow.

This service must follow exactly the same architecture, coding standards, folder structure, and development practices used by the existing microservices.

⸻

General Workflow

1. reservation-service detects a vehicle checkout.
2. reservation-service publishes an event to RabbitMQ.
3. payment-service consumes the event.
4. The parking fee is calculated automatically.
5. A Payment record is created.
6. A Stripe Checkout Session (TEST mode) is generated.
7. The user completes the payment.
8. Stripe sends a webhook notification.
9. payment-service validates the payment.
10. A digital receipt is generated.
11. payment-service publishes the payment.completed event.
12. reservation-service updates the reservation status.
13. parking-service continues the parking workflow accordingly.

⸻

Environment Variables

PORT=3007
DATABASE_URL=postgresql://admin:admin@postgres:5432/paymentdb
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
STRIPE_SECRET_KEY=
STRIPE_PUBLIC_KEY=
STRIPE_WEBHOOK_SECRET=
INTERNAL_SERVICE_KEY=
CORS_ORIGINS=http://localhost:3002

⸻

USP-091 — Create the Payment Service and Parking Fee Calculation

Objective

Create the new microservice using Nx + NestJS and implement the parking fee calculation logic.

Implementation

Create the microservice following exactly the same structure and architecture used by the other services inside the Nx monorepo.

The implementation must include:

* Generate the NestJS application using Nx.
* Configure the application to run on port 3007.
* Configure the main application module.
* Configure environment variables.
* Configure Prisma.
* Configure RabbitMQ.
* Configure Swagger.
* Configure Winston logging.
* Configure Prometheus metrics.
* Configure Health Checks.
* Create the Dockerfile.
* Integrate the service into docker-compose.

Implement the parking fee calculation rules.

Pricing Rules

Professor

* $0.00

Student

* $0.15 per 30-minute block

Guest

* $0.25 per 30-minute block

The service must

* Retrieve reservation information.
* Calculate the parking duration.
* Round every started 30-minute block upward.
* Calculate the final amount.
* Create a Payment record with PENDING status.
* Persist the calculated amount before starting the payment process.

Acceptance Criteria

* Professors are always charged $0.
* Students are charged correctly.
* Guests are charged correctly.
* The calculated amount is stored in PostgreSQL.

⸻

USP-092 — RabbitMQ Consumer + Stripe Checkout

Objective

Implement the RabbitMQ consumer responsible for automatically starting the payment workflow.

Implementation

Create the RabbitMQ module for payment-service.

The consumer must listen for checkout events published by reservation-service.

When an event is received, the service must:

1. Retrieve reservation information.
2. Calculate the parking fee (USP-091).
3. Create the Payment record.
4. Create a Stripe Checkout Session using Stripe TEST mode.
5. Wait for the Stripe webhook confirmation.
6. Publish the corresponding payment event.

Published events:

* payment.completed
* payment.failed

The consumer must also implement:

* Automatic reconnection.
* Ack/Nack handling.
* Idempotency.
* Error handling.
* Message validation.

⸻

USP-093 — Digital JSON Receipt

Objective

Generate a digital receipt after a successful payment.

Implementation

Once the Stripe webhook confirms a successful payment:

* Create a Receipt record.
* Associate it with the Payment.
* Persist it in PostgreSQL.

Create the endpoint:

GET /api/payments/:id/receipt

The response must include:

* receiptNumber
* paymentId
* reservationId
* vehicle
* user
* amount
* currency
* paymentMethod
* status
* createdAt

⸻

USP-094 — Dead Letter Queue

Objective

Implement fault tolerance for payment processing.

Implementation

RabbitMQ must support:

* Three automatic retries.
* Exponential backoff.
* Dead Letter Queue (DLQ).

Log every failure using Winston, including:

* Error message.
* Retry number.
* Original message.
* Stack trace.

⸻

USP-095 — PostgreSQL + Prisma

Objective

Implement the complete persistence layer.

Implementation

Create the Prisma schema including:

* Payment
* Receipt

Generate:

* Prisma migrations.
* Prisma Client.
* Relationships.
* Indexes.
* Constraints.

Receipt must have a one-to-one relationship with Payment.

⸻

USP-096 — Infrastructure + Frontend Integration

Objective

Prepare the service for the QA environment and integrate the complete payment workflow into the frontend.

Backend

Implement:

* Dockerfile.
* docker-compose.
* GitHub Actions.
* Terraform.
* Swagger documentation.
* Prometheus metrics.
* Winston logging.
* Health Checks.

Configure:

* STRIPE_SECRET_KEY
* STRIPE_PUBLIC_KEY
* STRIPE_WEBHOOK_SECRET

Only Stripe TEST credentials must be used.

Never use LIVE credentials.

Frontend

Implement the complete payment flow.

After the user performs the vehicle checkout:

* Request a Stripe Checkout Session from payment-service.
* Redirect the user automatically to Stripe Checkout.
* Wait for the webhook confirmation.
* Display a payment success page.
* Display a payment cancellation page.
* Automatically refresh the reservation status.
* Display the generated digital receipt.

Create the following pages:

* /payment/success
* /payment/cancel

⸻

USP-097 — Unit Tests

Objective

Provide test coverage for the critical business logic.

Implementation

Create unit tests for:

* Parking Fee Calculator.
* Payment Service.
* Stripe Service.
* RabbitMQ Consumer.
* Receipt Service.
* Controllers.

Mock:

* Stripe SDK.
* RabbitMQ.
* Prisma.
* Reservation Service.

Minimum expected coverage:

80%

⸻

Expected Result

Once all user stories are completed, the project must include:

* A fully functional payment-service.
* Nx + NestJS architecture.
* PostgreSQL with Prisma.
* RabbitMQ messaging.
* Stripe Checkout integration (TEST mode).
* Stripe webhook handling.
* Digital receipt generation.
* Complete frontend integration.
* Docker support.
* Terraform infrastructure.
* CI/CD pipeline.
* Swagger API documentation.
* Prometheus metrics.
* Winston logging.
* Comprehensive unit tests.
* Ready for deployment to the QA environment following the same standards as every other microservice in the project.