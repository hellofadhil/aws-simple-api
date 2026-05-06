# Deploy Guide

Panduan deploy `simple-api` ke AWS EC2 Ubuntu 24 menggunakan:

- Bun
- Nginx
- systemd
- GitHub Actions

## 1. Buat EC2

Siapkan EC2 Ubuntu 24.

Security Group minimal:

- `22` untuk SSH
- `80` untuk HTTP
- `443` untuk HTTPS nanti kalau pakai SSL

## 2. Install dependency dasar di EC2

SSH ke EC2:

```bash
ssh -i "C:\Users\gaske\Downloads\simple-api.pem" ubuntu@ec2-54-254-219-33.ap-southeast-1.compute.amazonaws.com
```

Lalu install package dasar:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl unzip nginx
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

## 3. Clone project ke server

Project disimpan di:

```bash
/home/ubuntu/simple-api
```

Clone repo:

```bash
cd /home/ubuntu
git clone https://github.com/hellofadhil/aws-simple-api.git simple-api
cd /home/ubuntu/simple-api
```

## 4. Buat environment production

Buat file `.env`:

```bash
cat > /home/ubuntu/simple-api/.env <<'EOF'
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST/YOUR_DB?sslmode=verify-full&channel_binding=require"
EOF
```

Edit jika perlu:

```bash
nano /home/ubuntu/simple-api/.env
```

## 5. Install dependency project

```bash
cd /home/ubuntu/simple-api
bun install --frozen-lockfile
bun run prisma:generate
bun run prisma:migrate:deploy
```

## 6. Buat service systemd

Buat file:

```bash
sudo tee /etc/systemd/system/simple-api.service > /dev/null <<'EOF'
[Unit]
Description=Simple API Bun service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/simple-api
EnvironmentFile=/home/ubuntu/simple-api/.env
ExecStart=/home/ubuntu/.bun/bin/bun run start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
```

Aktifkan service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable simple-api
sudo systemctl start simple-api
sudo systemctl status simple-api --no-pager -l
```

Cek log kalau ada error:

```bash
journalctl -u simple-api -n 100 --no-pager
```

## 7. Setup Nginx

Hapus default site:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

Buat config Nginx:

```bash
sudo tee /etc/nginx/sites-available/simple-api > /dev/null <<'EOF'
server {
    listen 80;
    server_name ec2-54-254-219-33.ap-southeast-1.compute.amazonaws.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

Enable Nginx config:

```bash
sudo ln -sf /etc/nginx/sites-available/simple-api /etc/nginx/sites-enabled/simple-api
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl status nginx --no-pager
```

## 8. Test aplikasi

Test dari server:

```bash
curl http://127.0.0.1:3000/health
curl http://localhost/health
```

Test dari browser:

```text
http://54.254.219.33/
http://54.254.219.33/health
```

Expected:

```json
{"status":"ok"}
```

## 9. Buat akses sudo untuk deploy

Supaya GitHub Actions bisa restart service tanpa password:

```bash
sudo tee /etc/sudoers.d/simple-api-deploy > /dev/null <<'EOF'
ubuntu ALL=NOPASSWD: /bin/systemctl restart simple-api, /bin/systemctl status simple-api
EOF
sudo chmod 440 /etc/sudoers.d/simple-api-deploy
```

## 10. GitHub Actions secrets

Di GitHub repo:

`Settings -> Secrets and variables -> Actions`

Isi:

- `EC2_HOST` = `ec2-54-254-219-33.ap-southeast-1.compute.amazonaws.com`
- `EC2_USER` = `ubuntu`
- `EC2_PORT` = `22`
- `APP_DIR` = `/home/ubuntu/simple-api`
- `EC2_SSH_KEY` = isi file `simple-api.pem`

Kalau ambil isi `.pem` dari Windows PowerShell:

```powershell
Get-Content "C:\Users\gaske\Downloads\simple-api.pem" -Raw
```

Copy seluruh output ke secret `EC2_SSH_KEY`.

## 11. Workflow GitHub Actions

Workflow deploy ada di:

```text
.github/workflows/deploy.yml
```

Script deploy server ada di:

```text
scripts/deploy.sh
```

Flow deploy:

1. Push ke branch `main`
2. GitHub Actions jalan
3. Runner SSH ke EC2
4. Server menjalankan deploy script
5. Code di-update
6. Dependency di-install
7. Prisma client di-generate
8. Migration dijalankan
9. Service `simple-api` di-restart

## 12. Command deploy manual

Kalau mau deploy manual tanpa GitHub Actions:

```bash
cd /home/ubuntu/simple-api
git fetch origin main
git checkout main
git reset --hard origin/main
bun install --frozen-lockfile
bun run prisma:generate
bun run prisma:migrate:deploy
sudo systemctl restart simple-api
sudo systemctl status simple-api --no-pager -l
```

## 13. Troubleshooting

Kalau app error:

```bash
sudo systemctl status simple-api --no-pager -l
journalctl -u simple-api -n 100 --no-pager
```

Kalau Nginx error:

```bash
sudo nginx -t
sudo systemctl status nginx --no-pager
```

Kalau port 3000 tidak kebuka:

```bash
ss -ltnp | grep 3000
```

Kalau repo tidak bisa update:

```bash
cd /home/ubuntu/simple-api
git fetch origin main
```

## 14. Catatan penting

- Jangan edit code langsung di server kalau pakai flow deploy ini, karena deploy script memakai:

```bash
git reset --hard origin/main
```

- Jangan commit `.env` ke GitHub.
- Setelah setup selesai, rotasi password database kalau sebelumnya pernah terekspos.
