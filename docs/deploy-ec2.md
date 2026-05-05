# Deploy to AWS EC2 with GitHub Actions

Target stack:

- Ubuntu 24.04
- Bun
- Nginx
- systemd
- PostgreSQL or Amazon RDS

## 1. Prepare the server

Install base packages and Bun:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl unzip nginx
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

Create the app directory and clone the repository:

```bash
sudo mkdir -p /var/www/simple-api
sudo chown -R $USER:$USER /var/www/simple-api
git clone <YOUR_REPOSITORY_URL> /var/www/simple-api
cd /var/www/simple-api
```

Create the production environment file:

```bash
cat > /var/www/simple-api/.env <<'EOF'
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public
EOF
```

Install dependencies once:

```bash
cd /var/www/simple-api
bun install --frozen-lockfile
bun run prisma:generate
```

## 2. Create the systemd service

Create `/etc/systemd/system/simple-api.service`:

```ini
[Unit]
Description=Simple API Bun service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/simple-api
EnvironmentFile=/var/www/simple-api/.env
ExecStart=/home/ubuntu/.bun/bin/bun run start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Then enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable simple-api
sudo systemctl start simple-api
sudo systemctl status simple-api --no-pager
```

## 3. Configure Nginx

Create `/etc/nginx/sites-available/simple-api`:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/simple-api /etc/nginx/sites-enabled/simple-api
sudo nginx -t
sudo systemctl restart nginx
```

If you have a domain, add HTTPS with Certbot after DNS points to the EC2 instance.

## 4. GitHub Actions secrets

In GitHub repository settings, add these secrets:

- `EC2_HOST`: public IP or domain of the instance
- `EC2_USER`: SSH user, usually `ubuntu`
- `EC2_SSH_KEY`: private SSH key contents
- `EC2_PORT`: optional, defaults to `22`
- `APP_DIR`: optional, defaults to `/var/www/simple-api`

## 5. Workflow behavior

The workflow in `.github/workflows/deploy.yml` will:

1. run on push to `main`
2. install Bun on the GitHub runner
3. install dependencies
4. generate the Prisma client
5. connect to EC2 over SSH
6. run `scripts/deploy.sh` on the server

The server-side script will:

1. fetch the latest code
2. hard reset to `origin/main`
3. install dependencies with Bun
4. generate Prisma client
5. run `prisma migrate deploy`
6. restart the `simple-api` service

## 6. Important note

`scripts/deploy.sh` uses `git reset --hard origin/<branch>` on the server copy. Do not make manual edits inside the deployed working tree unless you are fine losing them on the next deployment.
