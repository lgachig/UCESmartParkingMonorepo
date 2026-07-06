AI Service — Agent Context

Read the global CLAUDE.md first, then this file.
This service DOES NOT EXIST YET.

⸻

Status

🔴 PENDING — Epic USP-9 (issues USP-121 to USP-126)

Port: 3009

Database: MongoDB (per-user usage history)

External dependency: search-service (synchronous HTTP call)

Framework: NestJS + Nx

⸻

Service Purpose

Generates personalized parking slot recommendations based on each user's usage history, and resolves the case where the favorite slot is unavailable by querying search-service for the geographically nearest one.

⸻

USP-121 — As a student I want up to 3 slot recommendations based on my usage history

USP-122 — As a professor I want unlimited slot recommendations based on my usage history

What it must do

* Expose an endpoint that returns the list of recommended slots for the authenticated user, ordered from most to least frequently used historically.
* Limit the response to a maximum of 3 recommendations when the user's role is student.
* Do not limit the number of recommendations when the user's role is professor.
* If the user has no history yet (new user), the response must be an empty list, never an error.

How it's validated as done

* A student with a history of 10 different slots receives exactly 3 recommendations, the 3 most frequent ones.
* A professor with the same history receives all 10.
* A new user receives an empty list without the request failing.

⸻

USP-123 — When the favorite slot is unavailable, calculate the nearest one via a geospatial query

What it must do

* Before returning the main recommendation, check the current status of the favorite slot.
* If the favorite slot is no longer available, query search-service (synchronously, via internal HTTP) for the nearest available slot to the user's location.
* This synchronous call to search-service must implement a circuit breaker: if search-service does not respond within a reasonable time or fails repeatedly, ai-service must stop trying for a short period and return the recommendation without the geographic replacement (graceful degradation), instead of leaving the user's request hanging waiting for a response that never comes.
* While the circuit is "open" (failing), the service must keep responding with the recommendations it can resolve from its own history, only skipping the geographic-replacement step until search-service recovers.

How it's validated as done

* If the favorite slot is occupied or reserved, the nearest available one is returned automatically.
* If search-service is down, the user's request still gets a response (without the geographic replacement) instead of hanging or failing entirely.
* After several consecutive failures, subsequent requests stop trying to call search-service for a short period, and the attempt automatically resumes afterward.

⸻

USP-124 — Per-user usage history in MongoDB (frequent slots)

What it must do

* Maintain, for each user, a record of which slots they have used and how many times.
* Update this record every time a reservation checkout is completed (event arriving from reservation-service).
* If the slot was not previously in the user's history, it must be added; if it already existed, its usage counter must be incremented.

How it's validated as done

* After completing a checkout, the usage counter for the corresponding slot increases for that user.
* A slot never used before by that user appears added to their history after the first use.

⸻

USP-125 — Dockerfile + CI/CD + Swagger + Prometheus for ai-service

What it must do

* Same packaging, health, metrics, and CI/CD pattern as the rest of the new services.
* Metrics must include, in addition to the standard ones, the number of times the circuit breaker toward search-service was triggered (to monitor whether that dependency is a frequent point of failure).

How it's validated as done

* The image builds and publishes correctly, and the service ends up deployed and reachable in QA.

⸻

USP-126 — Unit tests for ai-service

What it must do

* Cover the recommendation calculation (limit of 3 for students, unlimited for professors, empty list with no history).
* Cover the circuit breaker's behavior toward search-service: closed circuit (works normally), open circuit (degrades without failing), half-open circuit (resumes the attempt).

How it's validated as done

* The tests cover both the happy path and search-service failure scenarios, and run inside the CI pipeline.

⸻

Expected Result

A functional service with MongoDB for usage history, role-differentiated recommendations, resilient integration (with circuit breaker) toward search-service for the unavailable-slot case, and its Dockerfile, CI/CD, documentation and tests in place.
