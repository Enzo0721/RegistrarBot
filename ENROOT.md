# NVIDIA Enroot Deployment Guide

## Notes: Enroot should be fully implemented but I am still having errors locally. I believe part of it is because it is trying to run the llm locally & ofc my laptop can't so that is causing issues. For now just develop on docker version and we can merge later.

## Quick Start

### 1. Initial Setup

```bash
# Make scripts executable
chmod +x registrarbot/scripts/deploy-enroot.sh registrarbot/scripts/run-enroot.sh

# Deploy (converts Docker images to Enroot format)
registrarbot/scripts/deploy-enroot.sh

# This creates:
# - ~/.local/share/enroot/registrarbot-app.sqsh
# - ~/.local/share/enroot/postgres-db.sqsh
# - ~/.local/share/enroot/sandbox.sqsh
```

### 2. Running Services

```bash
# Start all services
registrarbot/scripts/run-enroot.sh start

# Check status
./run-enroot.sh status

# Stop all services
./run-enroot.sh stop
```


### Enroot-Specific Config

Generated automatically by `deploy-enroot.sh` in `enroot-config.env`:

```bash
export ENROOT_APP_IMAGE="~/.local/share/enroot/registrarbot-app.sqsh"
export ENROOT_DB_IMAGE="~/.local/share/enroot/postgres-db.sqsh"
export ENROOT_SANDBOX_IMAGE="~/.local/share/enroot/sandbox.sqsh"
```

## Service Management

### Starting Services

```bash
# Start everything
registrarbot/scripts/run-enroot.sh start

# Or start individually:
enroot start --root --rw $ENROOT_DB_IMAGE postgres &
enroot start --root --rw $ENROOT_APP_IMAGE node src/index.js &
enroot start --root --rw $ENROOT_SANDBOX_IMAGE npm run dev &
```

### Checking Status

```bash
./run-enroot.sh status

# Output:
# ● Database (PID: 12345) - Running
# ● App (PID: 12346) - Running
# ● Sandbox (PID: 12347) - Running
```

### Stopping Services

```bash
./run-enroot.sh stop

# Or manually:
kill $(cat ~/registrarbot-data/db.pid)
kill $(cat ~/registrarbot-data/app.pid)
kill $(cat ~/registrarbot-data/sandbox.pid)
```

## Data Persistence

### Database Data

Stored at: `~/registrarbot-data/postgres`

- Persists across container restarts
- Mounted as volume in database container
- Backup: `tar -czf db-backup.tar.gz ~/registrarbot-data/postgres`

### Application Logs

Stored at: `~/registrarbot-data/logs`

```bash
# View logs
ls ~/registrarbot-data/logs/

# Tail app logs
tail -f ~/registrarbot-data/logs/app.log
```


## Resources

- [NVIDIA Enroot Documentation](https://github.com/NVIDIA/enroot)
- [Enroot Installation Guide](https://github.com/NVIDIA/enroot/blob/master/doc/installation.md)
- [Enroot User Guide](https://github.com/NVIDIA/enroot/blob/master/doc/usage.md)
