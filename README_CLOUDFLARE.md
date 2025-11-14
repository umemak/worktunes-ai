# WorkTunes AI - Cloudflare Deployment Guide

## 🚀 Cloudflare構成

このプロジェクトはCloudflareプラットフォームで動作するように設計されています。

### アーキテクチャ

```
Frontend (Cloudflare Pages)
    ↓
Workers API (Cloudflare Workers)
    ↓
D1 Database (SQLite) + KV Storage
```

## 📋 必要なもの

1. Cloudflareアカウント (無料プランでOK)
2. Wrangler CLI
3. Node.js 20+

## 🛠 セットアップ手順

### 1. Wrangler CLIインストール

```bash
npm install -g wrangler
```

### 2. Cloudflareにログイン

```bash
wrangler login
```

### 3. D1データベース作成

```bash
cd workers/api

# データベース作成
wrangler d1 create worktunes-db

# 出力されたdatabase_idをwrangler.tomlに設定
# database_id = "your-database-id"

# スキーマ適用
wrangler d1 execute worktunes-db --file=./schema.sql
```

### 4. KV Namespace作成

```bash
# キャッシュ用KV
wrangler kv:namespace create CACHE
# 出力されたidをwrangler.tomlに設定

# セッション用KV
wrangler kv:namespace create SESSION
# 出力されたidをwrangler.tomlに設定
```

### 5. Secrets設定

```bash
cd workers/api

# JWT Secret
wrangler secret put JWT_SECRET
# 入力: your-jwt-secret-key

# JWT Refresh Secret
wrangler secret put JWT_REFRESH_SECRET
# 入力: your-jwt-refresh-secret-key

# ElevenLabs API Key (オプション)
wrangler secret put ELEVENLABS_API_KEY
# 入力: your-elevenlabs-api-key

# OpenWeatherMap API Key
wrangler secret put OPENWEATHER_API_KEY
# 入力: your-openweather-api-key
```

### 6. Workers APIデプロイ

```bash
cd workers/api

# 依存関係インストール
npm install

# デプロイ
npm run deploy

# または
wrangler deploy
```

### 7. Cloudflare Pagesデプロイ

#### Option A: GitHub連携（推奨）

1. GitHubにプッシュ
2. Cloudflare Dashboardで「Pages」を開く
3. 「Create a project」→「Connect to Git」
4. リポジトリを選択
5. ビルド設定:
   - **Build command**: `cd apps/web && npm install && npm run build`
   - **Build output directory**: `apps/web/.next`
   - **Root directory**: `/`

6. 環境変数設定:
   - `NEXT_PUBLIC_API_URL`: `https://your-worker-subdomain.workers.dev`

7. 「Save and Deploy」

#### Option B: Wranglerコマンド

```bash
cd apps/web

# ビルド
npm run build

# デプロイ
npx wrangler pages deploy .next --project-name=worktunes-ai
```

## 🔧 ローカル開発

### Workers APIローカル実行

```bash
cd workers/api

# ローカルD1データベース作成
wrangler d1 execute worktunes-db --local --file=./schema.sql

# 開発サーバー起動 (ポート8787)
npm run dev
```

### フロントエンドローカル実行

```bash
cd apps/web

# 環境変数設定
echo "NEXT_PUBLIC_API_URL=http://localhost:8787" > .env.local

# 開発サーバー起動 (ポート3000)
npm run dev
```

## 📝 環境変数

### Workers API (wrangler.toml)

```toml
[vars]
ENVIRONMENT = "production"
```

### Secrets (wrangler secret put)

- `JWT_SECRET`: JWT署名用シークレット
- `JWT_REFRESH_SECRET`: リフレッシュトークン署名用
- `ELEVENLABS_API_KEY`: ElevenLabs Music API Key
- `OPENWEATHER_API_KEY`: OpenWeatherMap API Key

### Frontend (Cloudflare Pages)

- `NEXT_PUBLIC_API_URL`: Workers APIのURL

## 🧪 テスト

### API動作確認

```bash
# Health check
curl https://your-worker.workers.dev/health

# ユーザー登録
curl -X POST https://your-worker.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","username":"testuser"}'

# ログイン
curl -X POST https://your-worker.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📊 D1データベース管理

### データ確認

```bash
# ローカル
wrangler d1 execute worktunes-db --local --command="SELECT * FROM users"

# 本番
wrangler d1 execute worktunes-db --command="SELECT * FROM users"
```

### バックアップ

```bash
# ローカルデータベースのバックアップ
wrangler d1 export worktunes-db --local --output=backup.sql

# 本番データベースのバックアップ
wrangler d1 export worktunes-db --output=backup.sql
```

## 🌐 カスタムドメイン設定

1. Cloudflare Dashboardで「Pages」を開く
2. プロジェクトを選択
3. 「Custom domains」タブ
4. 「Set up a custom domain」
5. ドメインを入力して設定

Workers APIも同様に:
1. 「Workers & Pages」を開く
2. Workerを選択
3. 「Triggers」タブ
4. 「Add Custom Domain」

## 💰 料金

### 無料枠（Free Plan）

- **Workers**: 100,000 リクエスト/日
- **Pages**: 無制限ビルド、500ビルド/月
- **D1**: 5GB ストレージ、500万 read/日
- **KV**: 100,000 read/日、1,000 write/日

これで十分な開発・小規模運用が可能です！

## 🔗 参考リンク

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare KV Docs](https://developers.cloudflare.com/kv/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)

## 🐛 トラブルシューティング

### Workers APIが起動しない

```bash
# ログ確認
wrangler tail your-worker-name

# デバッグモード
wrangler dev --local --persist
```

### D1接続エラー

```bash
# データベース一覧確認
wrangler d1 list

# バインディング確認
wrangler d1 info worktunes-db
```

### ビルドエラー

```bash
# キャッシュクリア
rm -rf node_modules package-lock.json
npm install

# Next.jsキャッシュクリア
rm -rf .next
npm run build
```

---

**🎉 Cloudflareデプロイが完了すれば、WorkTunes AIがグローバルに配信されます！**
