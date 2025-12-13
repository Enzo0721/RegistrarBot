# Logging and Debugging Guidelines

RegistrarBot uses a custom logging utility defined in `config/index.js` to provide
structured, styled, and configurable logging across the application.

This document describes how logging works and how to use it effectively.

---

## Logging Functions

The following logging helpers are exported from the config module:

- `log(...)` — Standard informational logging
- `warn(...)` — Warning-level logging
- `error(...)` — Error-level logging

Each function supports styled output and verbosity controls.

---

## Verbose Mode

Logging output is controlled by the `VERBOSE` environment variable.

- When `VERBOSE=false`, only forced logs and errors are shown
- When `VERBOSE=true`, all logs are printed

This allows noisy debug output during development without cluttering production logs.

---

## Forced Logs

Logs can be forced regardless of verbosity using the `@@force` prefix.

Example:
```js
config.log('@@force', 'Server starting...');
