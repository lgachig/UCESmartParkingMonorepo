Realtime Service — Agent Context

Read the global CLAUDE.md first, then this file.
This service DOES NOT EXIST YET and must be implemented from scratch following the project's standard architecture and conventions.

⸻

Status

🔴 PENDING — Epic USP-8 (issues USP-098 to USP-102)

Port: 3008

Database: None of its own — stateless, event-driven service

Cache/Scaling: Redis (Socket.IO adapter to allow multiple instances behind the ALB)

Message Broker: Kafka (consumer only)

Framework: NestJS + Nx + Socket.IO

⸻

Service Purpose

Keeps active WebSocket connections with clients and relays real-time changes in parking slot availability, removing the need for polling from the frontend.

⸻

USP-098 — Story: the availability map updates in real time without refreshing the page

What it must fulfill

This is the parent story. It is considered done when the four tasks below (099 to 102) are complete and a user can see, without refreshing the browser, how a slot's color changes on the map as soon as another user reserves, occupies, or releases it.

⸻

USP-099 — Backend: set up the WebSocket Gateway with Socket.IO

What it must do

* Create the microservice following the same folder structure as the rest (health, metrics, logger, filters).
* Stand up a WebSocket server with Socket.IO on a dedicated namespace, not on the socket root, to allow separating other real-time channels in the future if needed.
* Allow the client, upon connecting, to optionally indicate which zone or faculty it wants to subscribe to (so it doesn't receive updates for slots it doesn't care about).
* Keep a running count of active connections at all times, both when a client connects and when it disconnects (tab closed, network loss, etc.).
* Configure CORS the same way as the rest of the services, using the same allowed-origins environment variable.

Architecture note (not a new task, it's a requirement of this same task)

Since this service does not synchronously depend on another service, it does not need its own circuit breaker. The circuit breaker for this flow belongs on the side of whoever DOES make synchronous calls to other services (see ai-service and integration-service).

How it's validated as done

* A client can connect and the active-connections counter goes up and down correctly.
* A client subscribed to a specific zone does not receive events from other zones.

⸻

USP-100 — Kafka consumer for slot.*: receive state changes and relay them via WebSocket

What it must do

* Subscribe to every slot state-change event published by parking-service (created, updated, reserved, occupied, released, under maintenance, enabled).
* For each event received, translate it into the format the frontend expects and emit it to all connected clients, plus specifically to clients subscribed to that slot's zone or faculty.
* A malformed message (invalid JSON or missing the slot identifier) must be discarded with a warning log, without stopping the consumer for the rest of the messages.
* The consumer must reconnect automatically if it loses its connection to Kafka, with no manual intervention.

How it's validated as done

* A real state change in parking-service reaches the connected client in under 1 second.
* A corrupted message does not crash the service nor stop the processing of subsequent messages.

⸻

USP-101 — Dockerfile + CI/CD + Swagger + Prometheus for realtime-service

What it must do

* Package the service into a Docker image following the same pattern as the rest of the project's microservices.
* Expose a health endpoint reporting whether the WebSocket gateway and the Kafka connection are operational.
* Expose Prometheus metrics, at minimum: number of active connections and count of Kafka events processed.
* Publish Swagger documentation for the few HTTP endpoints that do exist (health and metrics; the rest of the communication is WebSocket-based and is not documented in Swagger).
* Add the corresponding filter in the CI pipeline so it only rebuilds when files from this service change.
* Add the Terraform module to deploy this service's instance following the same pattern as the other backend services (static instance, no Auto Scaling Group).

How it's validated as done

* The image builds and publishes correctly to the container registry.
* The pipeline detects changes in this service and only rebuilds what's necessary.
* The service ends up deployed and reachable in QA.

⸻

USP-102 — Frontend: integrate socket.io-client to receive real-time map updates

What it must do

* Connect the frontend to the WebSocket Gateway when entering the availability map view.
* Subscribe, if applicable, to the zone or faculty the user is currently viewing.
* Update a slot's visual state on the map as soon as an event arrives, without reloading the page or re-fetching the full slot list.
* Handle automatic reconnection if the connection is momentarily lost, without requiring any action from the user.
* Remove any existing polling logic used to refresh availability, since it is no longer needed.

How it's validated as done

* The map changes state in real time when another user reserves, occupies, or releases a slot, without reloading the page.
* If the WebSocket connection drops momentarily, it reconnects on its own and the map updates correctly once it's back.

⸻

Expected Result

A functional service, with no database of its own, that keeps WebSocket connections open and relays real-time availability changes arriving via Kafka, with its Dockerfile, CI/CD, documentation and metrics in place, and the frontend consuming it without polling.
