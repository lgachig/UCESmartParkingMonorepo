Search Service — Agent Context

Read the global CLAUDE.md first, then this file.
This service DOES NOT EXIST YET.

⸻

Status

🔴 PENDING — Epic USP-9 (issues USP-132 to USP-136)

Port: 3013

Database: None of its own — indices live in Elasticsearch

Message Broker: Kafka (consumer of slot.*)

Framework: NestJS + Nx

⸻

Service Purpose

Maintains Elasticsearch search indices to locate slots by geographic proximity and user profiles by free text. This is the service that ai-service depends on when it needs to find the nearest available slot.

⸻

USP-132 — Index parking slots in Elasticsearch with a geospatial mapping

What it must do

* Define a slot index that includes its geographic location in a format that allows distance calculations (storing latitude/longitude as plain text is not enough — they must be mapped as a proper geospatial data type).
* Create the index automatically on service startup if it doesn't exist yet, to avoid depending on a manual setup step.
* Keep the index updated with each slot's real state (number, status, zone, faculty, location).

How it's validated as done

* The index exists and every indexed slot has a valid, queryable geographic location.

⸻

USP-133 — Index user profiles in Elasticsearch for free-text search

What it must do

* Maintain a separate index of user profiles (first name, last name, email) that allows the admin panel to search users by partial text matches, not only exact matches.
* Keep this index in sync with the profile changes published by user-service.

How it's validated as done

* Searching for a fragment of a first or last name returns all profiles that contain it, without needing to type it in full or with exact casing.

⸻

USP-134 — Internal endpoint for ai-service to find the nearest available slot

What it must do

* Expose an internal endpoint (not public, protected with a service-to-service key, not a user JWT) that receives a geographic coordinate and returns the nearest available slot to that point.
* If there is no available slot at that moment, it must return an empty or null response, never an error, so that whoever consumes it (ai-service) can handle it normally.
* This endpoint must respond quickly, since ai-service calls it synchronously within the recommendation flow while a user is waiting for a response in the app.

How it's validated as done

* Given a geographic point, the endpoint returns the nearest available slot by real distance.
* If there are no available slots, the response is empty, not a 500 error.

⸻

USP-135 — Kafka consumer for slot.*: re-index state changes in real time

What it must do

* Listen to the same slot state-change events consumed by realtime-service, but instead of relaying them via WebSocket, update the corresponding Elasticsearch index.
* The index must reflect each slot's real state with the smallest possible lag, since USP-134's correctness directly depends on this.

How it's validated as done

* A real slot state change is reflected in the search index within a few seconds.

⸻

USP-136 — Dockerfile + CI/CD + Swagger + Prometheus for search-service

What it must do

* Same packaging, health, metrics, and CI/CD pattern as the rest of the new services.
* Verify Elasticsearch is available as part of the environment (add it to docker-compose if not already present) before deploying this service.

How it's validated as done

* The image builds and publishes correctly, the service ends up deployed and reachable in QA, with Elasticsearch operational.

⸻

Expected Result

A functional service with Elasticsearch for geographic and free-text search, synced in real time via Kafka, exposing the internal endpoint that ai-service depends on, with its Dockerfile, CI/CD, documentation and metrics in place.
