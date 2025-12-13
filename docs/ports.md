# Port Configuration Notes

During development, multiple components of RegistrarBot evolved independently.
As a result, port usage is currently inconsistent across documentation, containers,
and local development workflows.

This document captures the current state prior to consolidation.

---

## Current Observations

- Backend runtime listens on the value of `SERVER_PORT`
- Dockerfile exposes port `3000`
- docker-compose maps container ports inconsistently
- README references ports `3000` and `3001` in different sections
- API documentation assumes `localhost:3000`
- Frontend sandbox environment references a different backend port

---

## Root Cause

Port configuration evolved organically as:
- REST APIs were added
- Socket.IO support was introduced
- Docker-based development was layered in
- Frontend sandbox was developed independently

---

## Planned Resolution

A future change will:
- Make `SERVER_PORT` the single source of truth
- Align Dockerfile and docker-compose mappings
- Update all documentation and frontend configs
- Ensure Swagger reflects the active runtime port

This document exists to ensure the issue is visible and traceable.
