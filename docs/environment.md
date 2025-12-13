# Environment Variable Contract

RegistrarBot relies on a strict set of environment variables that are validated
at startup. Missing required variables will cause the application to fail fast.

This document defines the expected environment contract for development and deployment.

---

## Required Variables

These variables **must** be set or the application will refuse to start.

### `SERVER_ADDRESS`
- Description: Base address the server binds to
- Example: `http://localhost`

### `SERVER_PORT`
- Description: Port the HTTP and Socket.IO server listens on
- Example: `3000`

### `SOCKET_ORIGIN`
- Description: Allowed origin(s) for Socket.IO connections
- Example: `*` (development only)

---

## Suggested Variables

These variables have defaults but should be explicitly set in most cases.

### `LLM_PORT`
- Description: Port where the LLM service (Ollama-compatible) is running
- Default: `11434`

### `LLM_MODEL`
- Description: Model identifier used by the LLM backend
- Default: `qwen3`

---

## Optional Variables

### `VERBOSE`
- Description: Enables verbose logging output
- Default: `false`
- Accepted values: `true | false`

---

## Validation Behavior

- Required variables are enforced at startup
- Suggested variables fall back to defaults with warnings
- Optional variables silently default if unset

This validation logic is implemented in `config/index.js`.
