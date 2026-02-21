# Spring Boot 3 + JPA + Redis POC

## 專案架構

```
poc/
│
├── docker-compose.yml          # 啟動 PostgreSQL + Redis
├── build.gradle.kts            # Gradle 設定（依賴、版本）
├── settings.gradle.kts         # Gradle 專案名稱設定
│
└── src/main/
    ├── java/com/poc/
    │   │
    │   ├── PocApplication.java         # 程式入口，@EnableCaching 開啟 cache
    │   │
    │   ├── entity/
    │   │   └── User.java               # DB table 對應的物件（@Entity）
    │   │
    │   ├── repository/
    │   │   └── UserRepository.java     # 負責跟 DB 溝通（JPA）
    │   │
    │   ├── service/
    │   │   └── UserService.java        # 商業邏輯 + Cache 設定
    │   │                               # @Cacheable → 查詢時 cache
    │   │                               # @CacheEvict → 刪除時清 cache
    │   │
    │   ├── controller/
    │   │   └── UserController.java     # REST API 入口，接收 HTTP request
    │   │
    │   └── config/
    │       └── RedisConfig.java        # Redis 設定（JSON 格式、TTL）
    │
    └── resources/
        └── application.yml             # DB 連線、Redis 連線、Cache 設定
```

---

## 資料流說明

```
HTTP Request
     │
     ▼
Controller          ← 接收 request，回傳 response
     │
     ▼
Service             ← 商業邏輯
  │     │
  │     ▼
  │   Redis         ← 先查 cache，有的話直接回傳
  │
  ▼
Repository          ← cache 沒有才去查 DB
     │
     ▼
PostgreSQL          ← 真正的資料來源
```

---

## 各層職責

| 層 | 檔案 | 職責 |
|----|------|------|
| Controller | UserController.java | 定義 API endpoint，接收/回傳 HTTP |
| Service | UserService.java | 商業邏輯、決定要不要 cache |
| Repository | UserRepository.java | 跟 DB 溝通，JPA 自動產生 SQL |
| Entity | User.java | 對應 DB 的 users table |
| Config | RedisConfig.java | Redis 序列化格式、TTL 設定 |

---

## 起步方式

### 1. 啟動 Docker（PostgreSQL + Redis）
```bash
docker-compose up -d

# 確認有跑起來
docker ps
```

### 2. 跑 Spring Boot
```bash
./gradlew bootRun
```

### 3. 測試 API

**新增 user**
```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com"}'
```

**查詢 user（第一次從 DB，之後從 Redis）**
```bash
curl http://localhost:8080/api/users/1
```

**查全部**
```bash
curl http://localhost:8080/api/users
```

**刪除 user（同時清 cache）**
```bash
curl -X DELETE http://localhost:8080/api/users/1
```

### 4. 驗證 Redis cache
```bash
docker exec -it poc-redis redis-cli

KEYS *        # 看有哪些 cache key
GET users::1  # 看 user id=1 的 cache 內容（JSON 格式）
```

---

## Cache 運作邏輯

- **第一次** `GET /api/users/1` → 去 DB 查，結果存進 Redis，console 會印出 SQL
- **之後** `GET /api/users/1` → 直接從 Redis 拿，**不打 DB**，console 不會印 SQL
- **DELETE** `/api/users/1` → 刪除 DB 資料，同時清掉 Redis 的 cache
- Cache **60 秒後自動過期**（在 application.yml 設定）
