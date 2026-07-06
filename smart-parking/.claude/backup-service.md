Backup Service — Agent Context

Read the global CLAUDE.md first, then this file.
This service DOES NOT EXIST YET.

⸻

Status

🔴 PENDING — Epic USP-10 (issues USP-155 to USP-159)

Port: 3015 (health and metrics only — exposes no business logic)

Database: None of its own — operates on the other services' databases

Framework: NestJS + Nx + scheduled tasks

⸻

Service Purpose

Runs automatic, scheduled backups of all the system's databases, uploads them to cloud storage, and additionally transfers them to the university's on-premise server, fulfilling the institutional business-continuity requirement.

⸻

USP-155 — As the university I need automatic backups of all databases uploaded to cloud storage

What it must do

* Run, on a scheduled basis, a backup of each of the system's relational databases (one per microservice that has its own), of the document history, and of the cache.
* Upload each generated backup to cloud storage, organized so a specific database and date's backup is easy to locate.
* If one database's backup fails, it must not prevent the rest of the databases' backups from being attempted: each one must be handled independently and logged if it failed.

How it's validated as done

* Every database in the system has a daily backup available in cloud storage.
* A failure backing up one database does not interrupt the backups of the others.

⸻

USP-156 — As the university I need backups also transferred to an on-premise server via a secure connection

What it must do

* After uploading each backup to cloud storage, also replicate it to the university's on-premise server, using an already-established secure connection between the cloud environment and the university's internal network (that network connection itself is an infrastructure matter, not something this service handles).
* Confirm the transfer completed successfully before considering it done, and log any connectivity failure so it can be reviewed.

How it's validated as done

* Every backup uploaded to the cloud is also correctly replicated to the on-premise server.

⸻

USP-157 — Scheduled backup tasks for each type of database

What it must do

* Define the backup execution frequency and schedule (for example, once a day during low-usage hours) in a configurable way, not hardcoded.
* Each type of database (relational, document, cache) requires its own backup mechanism appropriate to its technology; this task covers all three mechanisms being implemented and scheduled correctly, not just one of them.

How it's validated as done

* Backups run automatically at the configured schedule, with no manual intervention, for all three database types present in the system.

⸻

USP-158 — 30-day retention policy with automatic rotation

What it must do

* Backups older than 30 days must be automatically deleted from cloud storage, with no one having to do it manually.
* This rotation policy must not affect recent backups nor interrupt the process of generating new ones.

How it's validated as done

* A backup older than 30 days disappears from storage without manual intervention, while the most recent ones remain available.

⸻

USP-159 — Dockerfile + CI/CD + Swagger + Prometheus for backup-service

What it must do

* Package the service including the tools needed to generate backups for each database type (unlike the rest of the services, this image needs additional command-line tools, not just the Node runtime).
* Expose health and metrics: date and result of the last backup per database, and whether the last on-premise replication succeeded.
* Add the corresponding filter in the CI pipeline and the Terraform module, including the permissions this service needs to write to cloud storage.

How it's validated as done

* The image builds and publishes correctly, the service ends up deployed and reachable in QA, and the metrics reflect the real status of each database's last backup.

⸻

Expected Result

A functional service that automatically backs up every database in the system, with 30-day retention and replication to the university's on-premise server, with its Dockerfile, CI/CD, documentation and metrics in place.
