# Flowentra Backend — VPS Operations Handover

This is the **operations runbook** for the Flowentra .NET 8 backend running onk the OVH VPS. Pair it with `HANDOVER.md` (architecture) and `Backend/README.md` (deep dive).

>  **Credentials in this document are sensitive.** Rotate them after handover and store the new values in a password manager (1Password / Bitwarden / Vault). Do **not** commit rotated secrets back to Git.j

---ok

## 1. VPS Connection

| Field | Value |
|---|---|
| Host | `vps-cf5a8c99.vps.ovh.net` |
| SSH user | `backend` |
| Password | `Zaleyo2026` |
| Root password | `Zaleyo2026` (same — switch via `su - root`) |
| Backend folder | `/home/backend/FlowServiceBackend` |
| Publish folder | `/home/backend/publish` |
| systemd unit | `backend.service` |
| Reverse proxy | nginx (system service) |

### 1.1 Connect via SSH

```bash
ssh backend@vps-cf5a8c99.vps.ovh.net
# password: Zaleyo2026
```

### 1.2 Switch to root

```bash
su - root
# password: Zaleyo2026
```

> The `backend` user owns the application files and runs the service. Use `root` only for `systemctl`, `nginx`, package installs, and editing files under `/etc/`.

### 1.3 Move into the backend repo

```bash
cd /home/backend/FlowServiceBackend
```

This is a Git working copy of the repository. **It auto-builds on each commit** via `Backend/buildscript.ps` (a bash script despite the `.ps` extension — see §4).

---

## 2. Daily Operations Cheat Sheet

```bash
# Tail live logs
sudo journalctl -u backend -f

# Service control
sudo systemctl status backend
sudo systemctl restart backend
sudo systemctl stop backend
sudo systemctl start backend

# nginx (after editing any nginx config OR backend.service env vars)
sudo systemctl reload nginx
systemctl reload nginx     # second reload as instructed by upstream config

# Check what port the backend is listening on
ss -tlnp | grep dotnet

# Disk / memory
df -h
free -m
```

---

## 3. Building & Verifying Code Locally on the VPS

When you push code, the auto-deploy script builds it (see §4). To **manually verify a build** before pushing or to debug compile errors:

```bash
ssh backend@vps-cf5a8c99.vps.ovh.net
cd /home/backend/FlowServiceBackend

# Quick compile check (does NOT publish, does NOT restart the service)
dotnet build

# If you need a clean build (clears stale obj/ bin/)
dotnet clean -c Release
rm -rf obj bin
dotnet restore
dotnet build -c Release

# Full publish (what the auto-deploy actually runs)
dotnet publish -c Release -o /home/backend/publish
```

Build errors print with file + line; fix them in the repo, commit, and the auto-deploy re-runs.

---

## 4. Auto-Deploy Pipeline

File: `Backend/buildscript.ps` (bash script — extension is misleading).

What it does, on every poll:
1. `git fetch origin main`
2. If remote ≠ local: `git reset --hard origin/main`
3. `chown` + clean `obj/` `bin/` to avoid stale-cache failures
4. `dotnet restore`
5. `dotnet publish -c Release -o /home/backend/publish`
6. `sudo systemctl restart backend`

Triggering: a cron job or systemd timer runs this script (typical cadence: every 1–2 minutes). Verify with:

```bash
crontab -l                          # as backend user
sudo systemctl list-timers | grep -i deploy
```

If you need to **deploy immediately** instead of waiting for the poll:

```bash
cd /home/backend/FlowServiceBackend
bash Backend/buildscript.ps
```

---

## 5. Backend systemd Unit

Edit with:

```bash
sudo nano /etc/systemd/system/backend.service
```

This file holds the **runtime configuration**: database connection string, JWT secret, SMTP creds, Redis URL, port binding, etc. — passed to the .NET process as `Environment=` lines.

After **any change** to this file:

```bash
sudo systemctl daemon-reload
sudo systemctl restart backend
sudo systemctl reload nginx
systemctl reload nginx
```

> `daemon-reload` is required because systemd caches unit files.

### 5.1 Example skeleton (do **not** overwrite blindly — copy current values first)

```ini
[Unit]
Description=Flowentra Backend (.NET 8)
After=network.target

[Service]
WorkingDirectory=/home/backend/publish
ExecStart=/usr/bin/dotnet /home/backend/publish/MyApi.dll
Restart=always
RestartSec=5
User=backend
Group=backend

# --- Runtime config ---
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://127.0.0.1:5000
Environment=ConnectionStrings__DefaultConnection=Host=…;Database=…;Username=…;Password=…
Environment=Jwt__Key=…
Environment=Jwt__Issuer=https://api.flowentra.app
Environment=Jwt__Audience=https://api.flowentra.app
Environment=Smtp__Host=…
Environment=Smtp__Port=587
Environment=Smtp__User=…
Environment=Smtp__Password=…
Environment=Redis__ConnectionString=…

[Install]
WantedBy=multi-user.target
```

> Always `sudo cp /etc/systemd/system/backend.service /etc/systemd/system/backend.service.bak.$(date +%F)` before editing.

---

## 6. nginx Reverse Proxy

Config typically lives at `/etc/nginx/sites-available/backend` (symlinked to `sites-enabled/`).

Common edits:
- TLS certs (Let's Encrypt via `certbot` — auto-renewed by `certbot.timer`)
- `proxy_pass http://127.0.0.1:5000;`
- WebSocket upgrade headers for SignalR:
  ```nginx
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_read_timeout 3600s;
  ```
- Body size for uploads:
  ```nginx
  client_max_body_size 50M;
  ```

After editing:
```bash
sudo nginx -t                       # syntax check
sudo systemctl reload nginx
systemctl reload nginx
```

---

## 7. Standard Change Workflow

For any change that touches `backend.service` or nginx:

```bash
ssh backend@vps-cf5a8c99.vps.ovh.net
su - root
cd /home/backend/FlowServiceBackend

# 1. Pull / verify latest code
git pull
dotnet build                         # confirm no compile errors

# 2. Edit config if needed
sudo nano /etc/systemd/system/backend.service
# or
sudo nano /etc/nginx/sites-available/backend

# 3. Apply
sudo systemctl daemon-reload         # if backend.service changed
sudo systemctl restart backend
sudo nginx -t && sudo systemctl reload nginx
systemctl reload nginx

# 4. Verify
sudo systemctl status backend
curl -fsSI https://api.flowentra.app/health
sudo journalctl -u backend -n 100 --no-pager
```

---

## 8. Health Checks

| Check | Command |
|---|---|
| Service running | `sudo systemctl is-active backend` |
| HTTP healthy | `curl -fsS https://api.flowentra.app/health` |
| Swagger live | `curl -fsSI https://api.flowentra.app/swagger/index.html` |
| DB reachable | (from inside backend) `dotnet ef dbcontext info` or look for `[INFO] Connected to Postgres` in logs |
| Recent errors | `sudo journalctl -u backend --since "1 hour ago" -p err` |

Built-in HTTP health endpoint: `GET /health` returns `200 OK` with JSON `{ "status": "Healthy" }`.

---

## 9. Database Operations

The production DB is **Neon Postgres** (cloud). Connection string lives in `backend.service` under `ConnectionStrings__DefaultConnection`.

### 9.1 Connect via psql from the VPS

```bash
sudo apt install -y postgresql-client       # if not installed
psql "postgres://USER:PASS@HOST/DB?sslmode=require"
```

### 9.2 Run a migration manually

```bash
cd /home/backend/FlowServiceBackend
dotnet ef database update --project Backend/FlowServiceBackend.csproj
```

Or apply raw SQL:
```bash
psql "$CONNSTR" -f Backend/Neon/29_sync_history_retry.sql
```

### 9.3 Backup / restore

Neon: use the Neon dashboard → Branches → Restore (point-in-time, up to retention window).
Self-hosted Postgres: `pg_dump -Fc -f backup_$(date +%F).dump "$CONNSTR"`.

---

## 10. Log Locations

| Source | Location |
|---|---|
| Backend stdout/stderr | `journalctl -u backend` |
| Backend application logs | `SystemLogs` table in DB (queryable from `/system-logs` UI) |
| nginx access | `/var/log/nginx/access.log` |
| nginx errors | `/var/log/nginx/error.log` |
| systemd | `journalctl -xe` |
| Auto-deploy script | (depends on cron) — usually `/var/log/syslog` or `journalctl -u <timer-unit>` |

---

## 11. Recovery Playbook

### 11.1 Backend won't start
```bash
sudo journalctl -u backend -n 200 --no-pager
# Common causes:
#   - bad ConnectionStrings__DefaultConnection (db unreachable)
#   - port 5000 already bound: ss -tlnp | grep 5000
#   - missing publish dir: ls /home/backend/publish/MyApi.dll
```
Fix → `sudo systemctl restart backend`.

### 11.2 502 from nginx
- Backend is down (see 11.1) or listening on wrong port.
- `curl http://127.0.0.1:5000/health` from the VPS to bypass nginx.

### 11.3 Build failing on auto-deploy
- SSH in, `cd /home/backend/FlowServiceBackend`, `dotnet build` to see the real error.
- Permission issues: `sudo chown -R backend:backend /home/backend/FlowServiceBackend`.

### 11.4 Disk full
```bash
df -h
sudo journalctl --vacuum-time=7d
sudo apt clean
du -sh /home/backend/publish /home/backend/FlowServiceBackend/{bin,obj}
```

### 11.5 Roll back to a previous commit
```bash
cd /home/backend/FlowServiceBackend
git log --oneline -n 20
git reset --hard <good-commit-sha>
dotnet publish -c Release -o /home/backend/publish
sudo systemctl restart backend
```

---

## 12. Security Hardening Checklist (post-handover)

- [ ] Rotate `backend` user password, switch to SSH-key-only (`PasswordAuthentication no` in `/etc/ssh/sshd_config`).
- [ ] Rotate root password. Disable direct root SSH (`PermitRootLogin no`).
- [ ] Rotate JWT signing key in `backend.service` → `Jwt__Key`.
- [ ] Rotate Neon DB password and update connection string.
- [ ] Rotate UploadThing token (`VITE_UPLOADTHING_TOKEN` in Vercel).
- [ ] Enable UFW: `sudo ufw allow 22,80,443/tcp && sudo ufw enable`.
- [ ] Confirm `certbot.timer` is active (`systemctl list-timers | grep certbot`).
- [ ] Set up off-VPS log shipping (Grafana Loki / Datadog / Better Stack).
- [ ] Set up uptime monitoring on `https://api.flowentra.app/health`.

---

## 13. Quick Reference Card

```bash
# Connect
ssh backend@vps-cf5a8c99.vps.ovh.net          # pwd: Zaleyo2026
su - root                                      # pwd: Zaleyo2026
cd /home/backend/FlowServiceBackend

# Verify build
dotnet build

# Edit runtime config (DB, JWT, SMTP, …)
sudo nano /etc/systemd/system/backend.service

# Apply config + restart everything
sudo systemctl daemon-reload
sudo systemctl restart backend
sudo systemctl reload nginx
systemctl reload nginx

# Watch logs
sudo journalctl -u backend -f
```

---

End of runbook. Keep this file in the repo so it stays versioned with the code.
