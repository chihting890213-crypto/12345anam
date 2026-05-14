# 🌸 花卉訂單管理系統 — 部署指南

本指南說明如何在自己的伺服器上完整部署花卉訂單管理系統，**零成本、無訂閱費、數據完全自主**。

---

## 系統需求

| 項目 | 最低需求 |
|------|---------|
| 作業系統 | Ubuntu 20.04+ / Debian 11+ / CentOS 8+ |
| CPU | 1 核心 |
| 記憶體 | 1 GB RAM |
| 硬碟 | 10 GB 可用空間 |
| 軟體 | Docker 24+ 、Docker Compose v2+ |

---

## 快速部署（5 分鐘）

### 1. 安裝 Docker

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 驗證安裝
docker --version
docker compose version
```

### 2. 下載專案

```bash
git clone <your-repo-url> flower-ordering-system
cd flower-ordering-system
```

或直接上傳整個專案資料夾到伺服器。

### 3. 設定環境變數

```bash
# 複製範本
cp .env.example .env

# 編輯設定（務必修改密碼！）
nano .env
```

**.env 重要設定說明：**

```env
# 資料庫 root 密碼（請改成強密碼）
MYSQL_ROOT_PASSWORD=your_strong_root_password

# 資料庫使用者密碼（請改成強密碼）
MYSQL_PASSWORD=your_strong_db_password

# JWT 金鑰（請改成隨機長字串）
# 生成方式：openssl rand -hex 64
JWT_SECRET=your_very_long_random_secret_here

# 應用程式對外埠號（預設 8080）
APP_PORT=8080
```

### 4. 啟動服務

```bash
# 建置並啟動（首次約需 3-5 分鐘）
docker compose up -d --build

# 查看啟動狀態
docker compose ps

# 查看應用程式日誌
docker compose logs -f app
```

### 5. 完成！

開啟瀏覽器訪問：`http://您的伺服器IP:8080`

**預設管理員帳號：**
- 帳號：`AAA`
- 密碼：`BBB`

> ⚠️ **請立即登入後修改預設密碼！**

---

## 帳號管理

### 修改預設密碼

1. 以 `AAA` / `BBB` 登入系統
2. 點擊右上角個人選單 → 「修改密碼」
3. 輸入舊密碼 `BBB` 及新密碼

### 新增員工帳號

1. 以管理員身份登入
2. 前往 **管理員 → 員工管理**
3. 點擊「新增員工」
4. 填寫帳號、密碼、顯示名稱
5. 選擇角色（管理員 / 員工）

### 角色權限說明

| 功能 | 管理員 | 員工 |
|------|--------|------|
| 查看訂單 | ✅ | ✅ |
| 新增訂單 | ✅ | ✅ |
| 編輯訂單 | ✅ | ✅ |
| 審核訂單狀態 | ✅ | ✅ |
| 員工管理 | ✅ | ❌ |
| 花卉管理 | ✅ | ❌ |
| 區域管理 | ✅ | ❌ |
| 容量設定 | ✅ | ❌ |
| 付款帳號管理 | ✅ | ❌ |

---

## 客戶查詢頁面

客戶可透過以下網址查詢訂單（無需登入）：

```
http://您的伺服器IP:8080/query
```

客戶輸入訂單編號即可查看：
- 訂單狀態
- 配送資訊
- 付款資訊（員工確認後才顯示）
- 與員工的互動訊息

---

## 常用維護指令

```bash
# 查看服務狀態
docker compose ps

# 查看應用程式日誌
docker compose logs -f app

# 查看資料庫日誌
docker compose logs -f db

# 重啟應用程式
docker compose restart app

# 停止所有服務
docker compose down

# 停止並清除所有數據（⚠️ 危險！）
docker compose down -v

# 更新應用程式（重新建置）
docker compose up -d --build app
```

---

## 資料備份

### 備份資料庫

```bash
# 建立備份
docker compose exec db mysqldump \
  -u flower_user \
  -pflower_pass_2024 \
  flower_ordering > backup_$(date +%Y%m%d_%H%M%S).sql

# 壓縮備份
gzip backup_*.sql
```

### 還原資料庫

```bash
# 解壓縮
gunzip backup_20240101_120000.sql.gz

# 還原
docker compose exec -T db mysql \
  -u flower_user \
  -pflower_pass_2024 \
  flower_ordering < backup_20240101_120000.sql
```

### 自動備份（建議設定）

```bash
# 編輯 crontab
crontab -e

# 每天凌晨 2 點備份，保留 30 天
0 2 * * * cd /path/to/flower-ordering-system && \
  docker compose exec -T db mysqldump \
  -u flower_user -pflower_pass_2024 flower_ordering | \
  gzip > /backup/flower_$(date +\%Y\%m\%d).sql.gz && \
  find /backup -name "flower_*.sql.gz" -mtime +30 -delete
```

---

## HTTPS 設定（可選）

如需啟用 HTTPS，可使用 Nginx + Let's Encrypt：

### 1. 安裝 Certbot

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

### 2. 建立 Nginx 設定

```bash
cat > docker/nginx.conf << 'EOF'
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

### 3. 複製憑證並啟用 Nginx

```bash
mkdir -p docker/ssl
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/ssl/

# 取消 docker-compose.yml 中 nginx 的註解
# 重啟服務
docker compose up -d
```

---

## 疑難排解

### 資料庫連線失敗

```bash
# 檢查資料庫是否正常啟動
docker compose logs db

# 手動連線測試
docker compose exec db mysql -u flower_user -pflower_pass_2024 flower_ordering
```

### 應用程式無法啟動

```bash
# 查看詳細錯誤
docker compose logs app

# 重新建置
docker compose up -d --build --force-recreate app
```

### 重置管理員密碼

```bash
# 進入資料庫
docker compose exec db mysql -u flower_user -pflower_pass_2024 flower_ordering

# 查看員工帳號
SELECT id, username, role FROM staff_accounts;

# 刪除舊帳號（系統重啟後會自動重建 AAA/BBB）
DELETE FROM staff_accounts WHERE username = 'AAA';
exit;

# 重啟應用程式以觸發重新建立預設帳號
docker compose restart app
```

---

## 授權

本系統採用 **MIT 開源授權**，您可以：
- ✅ 自由使用、修改、分發
- ✅ 用於商業用途
- ✅ 永久免費使用
- ✅ 完全自主控制數據

詳見 `LICENSE` 文件。
