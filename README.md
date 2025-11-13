# WorkTunes AI - 環境適応型作業用BGM生成プラットフォーム

## 🎵 概要

WorkTunes AIは、リアルタイムの時間帯と天気情報に基づいて最適な作業用BGMを自動生成・配信するWebサービスです。

### ✨ 主な機能

- **環境連動BGM生成**: 時間帯×天気の組み合わせで最適化
- **AI音楽生成**: ElevenLabs Music APIによる高品質楽曲
- **個人最適化**: ユーザーの作業パターン学習
- **リアルタイム天気**: OpenWeatherMap APIで環境取得
- **プレイリスト管理**: カスタムプレイリスト作成・共有

## 🛠 技術スタック

### フロントエンド
- **Next.js 14** - React フレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **Shadcn/ui** - UIコンポーネント
- **Howler.js** - 音声再生
- **Zustand** - 状態管理

### バックエンド
- **Node.js 20** - ランタイム
- **Express.js** - サーバーフレームワーク
- **TypeScript** - 型安全性
- **PostgreSQL** - メインデータベース
- **Redis** - キャッシュ・セッション
- **Prisma** - ORM
- **JWT** - 認証

### 外部API
- **ElevenLabs Music API** - 音楽生成
- **OpenWeatherMap API** - 天気データ
- **Suno API (非公式)** - 代替音楽生成

### インフラ
- **Vercel** - フロントエンドホスティング
- **AWS** - バックエンド・データベース
- **Docker** - コンテナ化
- **GitHub Actions** - CI/CD

## 🚀 クイックスタート

### 前提条件
- Node.js 20以上
- PostgreSQL 15以上
- Redis 7以上

### インストール

```bash
# リポジトリクローン
git clone https://github.com/[YOUR_USERNAME]/worktunes-ai.git
cd worktunes-ai

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local

# データベース設定
npx prisma migrate dev
npx prisma generate

# 開発サーバー起動
npm run dev
```

### 環境変数設定

```env
# データベース
DATABASE_URL="postgresql://username:password@localhost:5432/worktunes"
REDIS_URL="redis://localhost:6379"

# 外部API
ELEVENLABS_API_KEY="your_elevenlabs_api_key"
OPENWEATHER_API_KEY="your_openweather_api_key"

# 認証
JWT_SECRET="your_jwt_secret"
JWT_REFRESH_SECRET="your_jwt_refresh_secret"

# Next.js
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"
```

## 📁 プロジェクト構造

```
worktunes-ai/
├── apps/
│   ├── web/                 # Next.js フロントエンド
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   └── api/                 # Express.js バックエンド
│       ├── src/
│       ├── prisma/
│       └── tests/
├── packages/
│   ├── ui/                  # 共通UIコンポーネント
│   ├── types/               # 型定義
│   └── config/              # 設定ファイル
├── docs/                    # ドキュメント
└── docker/                  # Docker設定
```

## 🎯 開発ロードマップ

### Phase 1: 基本機能 (2-3ヶ月)
- [x] プロジェクト初期設定
- [ ] ユーザー認証システム
- [ ] 基本的なBGM生成
- [ ] 天気API連携
- [ ] シンプルなWebUI

### Phase 2: 高度化 (3-4ヶ月)
- [ ] AI学習機能
- [ ] 個人最適化
- [ ] プレイリスト機能
- [ ] モバイル対応
- [ ] PWA化

### Phase 3: 拡張機能 (2-3ヶ月)
- [ ] チーム機能
- [ ] 企業向けプラン
- [ ] 高度な分析
- [ ] サードパーティ連携

## 🔧 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# テスト実行
npm run test

# リンティング
npm run lint

# 型チェック
npm run type-check

# データベースマイグレーション
npm run db:migrate

# データベースリセット
npm run db:reset
```

## 📊 環境マッピング

| 時間帯 | 晴れ | 曇り | 雨 | 雪 |
|--------|------|------|----|----|
| **朝** | 爽快ピアノ | 優しいアコースティック | 静かなアンビエント | 温かいストリングス |
| **午前** | アップテンポ | フォーカス音楽 | 集中Lo-fi | クラシック |
| **午後** | エネルギッシュ | バランス音楽 | 瞑想的 | ミニマル |
| **夜** | リラックス | 穏やか | ジャズ | 癒し系 |
| **深夜** | アンビエント | ドローン | 雨音ミックス | 静寂系 |

## 🤝 コントリビューション

プルリクエストやイシューの投稿を歓迎します！

1. フォークする
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. コミット (`git commit -m 'Add some AmazingFeature'`)
4. プッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエスト作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルをご覧ください。

## 👥 チーム

- **開発者**: [Your Name]
- **デザイン**: [Designer Name]
- **プロジェクトマネージャー**: [PM Name]

## 📞 サポート

質問やサポートが必要な場合は、以下にお問い合わせください：

- **Email**: support@worktunes.ai
- **Issues**: GitHub Issues
- **Discord**: [Discord Server Link]

## 🙏 謝辞

- [ElevenLabs](https://elevenlabs.io/) - 音楽生成API
- [OpenWeatherMap](https://openweathermap.org/) - 天気データAPI
- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [Prisma](https://www.prisma.io/) - データベースORM

---

⭐ このプロジェクトが気に入ったら、ぜひスターをお願いします！