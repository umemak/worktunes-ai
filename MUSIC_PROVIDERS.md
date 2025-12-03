# 🎵 音楽生成プロバイダー統合ガイド

WorkTunes AI では、3つの音楽生成プロバイダーから選択できます。

## 📊 プロバイダー比較表

| 項目 | Genspark | MusicGen | ElevenLabs |
|------|----------|----------|------------|
| **品質** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **生成速度** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **コスト** | 💰💰 | 無料 | 💰💰💰 |
| **最大音楽長** | 180秒 | 30秒 | 30秒 |
| **商用利用** | ✅ | ✅ | ✅ (有料) |
| **セットアップ難度** | 🔧🔧🔧 | 🔧 | 🔧 |
| **API安定性** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **環境適応** | 優秀 | 良好 | 優秀 |

---

## 🎯 用途別の推奨プロバイダー

### 🏆 高品質が最優先
**推奨**: ElevenLabs
- プロフェッショナルグレードの音質
- 商用プロジェクトに最適
- 最大30秒（v2モデル）
- クライアントへの提供に使用可

### 💰 コスト重視・テスト用
**推奨**: MusicGen
- 完全無料（Hugging Face API）
- 最大30秒の音楽生成
- 開発・テストに最適
- プロトタイピングに使用

### ⏱️ 長い音楽が必要（30秒以上）
**推奨**: Genspark
- 最大180秒（3分）の音楽生成
- 複数モデルの自動選択
- 長時間BGMに最適

---

## ⚙️ セットアップ手順

### 1️⃣ Genspark

```bash
# .env.local に追加
GENSPARK_TOKEN=your_genspark_token
MUSIC_PROVIDER=genspark
```

**取得方法**: 
- Gensparkセッション内で自動利用可能
- 詳細: `AI_DEVELOPER_GENSPARK_MIGRATION.md`

---

### 2️⃣ MusicGen (Hugging Face)

```bash
# .env.local に追加
HUGGINGFACE_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxx
MUSIC_PROVIDER=musicgen
```

**取得方法**:
1. https://huggingface.co/join でアカウント作成
2. https://huggingface.co/settings/tokens でトークン作成
3. Role: "read" を選択

**詳細ガイド**: `MUSICGEN_SETUP.md`

---

### 3️⃣ ElevenLabs

```bash
# .env.local に追加
ELEVENLABS_API_KEY=your_elevenlabs_api_key
MUSIC_PROVIDER=elevenlabs
```

**取得方法**:
1. https://elevenlabs.io/ でアカウント作成
2. Profile Settings > API Key でキーをコピー

**詳細ガイド**: `ELEVENLABS_SETUP.md`

---

## 🔄 プロバイダーの切り替え

### 方法1: 環境変数で切り替え

`.env.local` ファイルを編集:

```bash
# Gensparkを使用
MUSIC_PROVIDER=genspark

# MusicGenを使用
MUSIC_PROVIDER=musicgen

# ElevenLabsを使用
MUSIC_PROVIDER=elevenlabs
```

サーバーを再起動:
```bash
cd apps/api
npm run dev
```

### 方法2: 動的切り替え（実装例）

フロントエンドから選択:

```typescript
// APIリクエスト時にプロバイダーを指定
const response = await axios.post('/api/bgm/generate', {
  ...bgmRequest,
  provider: 'elevenlabs' // または 'musicgen', 'genspark'
});
```

---

## 🧪 テスト方法

### 全プロバイダーのヘルスチェック

```bash
cd apps/api

# Genspark
curl http://localhost:8000/api/bgm/health/genspark

# MusicGen
curl http://localhost:8000/api/bgm/health/musicgen

# ElevenLabs
curl http://localhost:8000/api/bgm/health/elevenlabs
```

### 個別テストスクリプト

```bash
# MusicGenテスト
npx ts-node src/test-musicgen.ts

# ElevenLabsテスト
npx ts-node src/test-elevenlabs.ts
```

### プロバイダー情報取得

```bash
curl http://localhost:8000/api/bgm/providers
```

レスポンス例:
```json
{
  "success": true,
  "data": {
    "current": "elevenlabs",
    "available": ["genspark", "musicgen", "elevenlabs"],
    "details": {
      "genspark": {
        "name": "Genspark Multi-Model",
        "maxDuration": 180,
        "apiKeyConfigured": false
      },
      "musicgen": {
        "name": "MusicGen (Hugging Face)",
        "maxDuration": 30,
        "apiKeyConfigured": true
      },
      "elevenlabs": {
        "name": "ElevenLabs Sound Effects",
        "maxDuration": 22,
        "apiKeyConfigured": true
      }
    }
  }
}
```

---

## 💡 使用シナリオ別の推奨構成

### シナリオ1: 個人プロジェクト・学習

**推奨**: MusicGen
```bash
MUSIC_PROVIDER=musicgen
HUGGINGFACE_API_TOKEN=hf_xxx...
```

**理由**:
- 完全無料
- 十分な品質
- APIトークン取得が簡単

---

### シナリオ2: 商用サービス（短いBGM）

**推奨**: ElevenLabs
```bash
MUSIC_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=xxx...
```

**理由**:
- 最高品質
- 高速生成
- SLA保証（有料プラン）

---

### シナリオ3: 商用サービス（長いBGM）

**推奨**: Genspark
```bash
MUSIC_PROVIDER=genspark
GENSPARK_TOKEN=xxx...
```

**理由**:
- 最大180秒（3分）
- 複数モデル対応
- 環境適応性が高い

---

### シナリオ4: ハイブリッド構成

複数プロバイダーを併用:

```typescript
// ロジック例
const provider = duration > 30 
  ? 'genspark'      // 長い音楽
  : quality === 'high' 
    ? 'elevenlabs'  // 高品質
    : 'musicgen';   // コスト重視
```

---

## 🔧 トラブルシューティング

### 問題: プロバイダーが切り替わらない

**解決策**:
1. `.env.local` を確認
2. サーバーを再起動
3. 環境変数がロードされているか確認:
   ```bash
   echo $MUSIC_PROVIDER
   ```

### 問題: API認証エラー

**解決策**:
1. APIキー/トークンを再確認
2. ヘルスチェックで接続確認
3. ログファイルを確認: `apps/api/logs/`

### 問題: 生成が失敗する

**解決策**:
1. プロバイダーのヘルスチェック実行
2. クレジット/レート制限を確認
3. 別のプロバイダーに切り替え

---

## 📊 コスト比較（月間100回生成の場合）

| プロバイダー | 月額コスト | 生成時間 | 品質 |
|------------|----------|---------|------|
| **MusicGen** | $0 | ~90秒/回 | 中 |
| **Genspark** | ~$20-50 | ~30秒/回 | 高 |
| **ElevenLabs** | $5-22 | ~20秒/回 | 最高 |

*概算です。実際のコストは使用量により異なります。

---

## 🚀 ベストプラクティス

### 1. フォールバック構成

メインプロバイダーが失敗した場合の代替:

```typescript
try {
  return await primaryProvider.generateBGM(request);
} catch (error) {
  logger.warn('Primary provider failed, trying fallback');
  return await fallbackProvider.generateBGM(request);
}
```

### 2. キャッシング

生成済み音楽をキャッシュして再利用:

```typescript
const cacheKey = `${timeOfDay}_${weather}_${workType}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;
```

### 3. プリウォーム

MusicGenはコールドスタートが遅いので事前ウォーム:

```bash
# 定期的にヘルスチェック
*/10 * * * * curl http://localhost:8000/api/bgm/health/musicgen
```

---

## 📚 関連ドキュメント

- [MusicGen セットアップ](./MUSICGEN_SETUP.md)
- [ElevenLabs セットアップ](./ELEVENLABS_SETUP.md)
- [Genspark 移行ガイド](./AI_DEVELOPER_GENSPARK_MIGRATION.md)
- [アーキテクチャ概要](./ARCHITECTURE_REVISION.md)

---

## 🆘 サポート

各プロバイダーの公式サポート:

- **Genspark**: このセッション内で質問
- **MusicGen**: https://huggingface.co/facebook/musicgen-small
- **ElevenLabs**: support@elevenlabs.io

---

**最終更新**: 2024-12-03
