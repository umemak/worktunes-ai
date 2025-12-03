# 🎵 ElevenLabs 統合ガイド

WorkTunes AI で ElevenLabs を使用した高品質音楽生成を実装する方法

## 📋 目次

1. [ElevenLabsとは](#elevenlabsとは)
2. [セットアップ手順](#セットアップ手順)
3. [使用方法](#使用方法)
4. [料金プラン](#料金プラン)
5. [API仕様](#api仕様)
6. [トラブルシューティング](#トラブルシューティング)

---

## ElevenLabsとは

**ElevenLabs** は、最先端のAI音声・音楽生成プラットフォームです。

### ✅ メリット

- **高品質**: プロフェッショナルグレードの音質
- **高速生成**: 10-30秒で生成完了
- **自然言語プロンプト**: 日本語でもOK（英語推奨）
- **商用利用可能**: 有料プランで商用利用可能

### ⚠️ 制限事項

- **有料**: 無料枠は月10,000文字まで
- **最大長**: 22秒まで
- **クレジット消費**: プロンプトの文字数でカウント
- **API制限**: レート制限あり

---

## セットアップ手順

### 1. ElevenLabs アカウント作成

1. [ElevenLabs](https://elevenlabs.io/) にアクセス
2. **Sign Up** でアカウントを作成
3. メール認証を完了

### 2. API キー取得

1. ログイン後、右上のプロフィールアイコンをクリック
2. **Profile Settings** を選択
3. **API Key** タブに移動
4. APIキーをコピー（形式: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）

### 3. 環境変数設定

`.env.local` ファイルに以下を追加:

```bash
# ElevenLabs API設定
ELEVENLABS_API_KEY=your_api_key_here
MUSIC_PROVIDER=elevenlabs
```

### 4. サーバー再起動

```bash
cd apps/api
npm run dev
```

---

## 使用方法

### API エンドポイント

**POST** `/api/bgm/generate`

#### リクエスト例

```bash
curl -X POST http://localhost:8000/api/bgm/generate \
  -H "Content-Type: application/json" \
  -d '{
    "environment": {
      "timeOfDay": "morning",
      "weather": {
        "condition": "sunny",
        "temperature": 22
      },
      "season": "spring",
      "timestamp": "2024-01-01T09:00:00Z"
    },
    "workType": "focus",
    "duration": 15,
    "mood": "calm",
    "genre": "lo-fi"
  }'
```

#### レスポンス例

```json
{
  "success": true,
  "data": {
    "id": "abc123...",
    "audioUrl": "data:audio/mpeg;base64,//uQx...",
    "metadata": {
      "title": "Morning Sunny - Focus Soundscape",
      "duration": 15,
      "genre": "Lo-fi / Ambient",
      "mood": "Fresh & Energetic",
      "instruments": ["Piano", "Soft Synth", "Ambient Pads", "Light Percussion"],
      "bpm": 75,
      "key": "D Major",
      "energy": 0.4,
      "generatedAt": "2024-01-01T09:00:00.000Z"
    },
    "generationParams": {
      "prompt": "Create lo-fi background music for work...",
      "model": "eleven_multilingual_v2",
      "duration": 15
    }
  }
}
```

---

## 料金プラン

### 無料プラン (Free)

- ✅ **10,000文字/月**
- ✅ Text-to-Speech & Sound Effects
- ✅ 基本的な音声品質
- ❌ 商用利用不可

### スタータープラン ($5/月)

- ✅ **30,000文字/月**
- ✅ より高い音質
- ✅ 商用利用可能
- ✅ プロジェクト管理

### クリエイタープラン ($22/月)

- ✅ **100,000文字/月**
- ✅ 最高品質
- ✅ 優先サポート
- ✅ Voice cloning

### プロプラン ($99/月)

- ✅ **500,000文字/月**
- ✅ 専用サポート
- ✅ SLA保証
- ✅ カスタム音声

**詳細**: https://elevenlabs.io/pricing

---

## API仕様

### 環境適応型プロンプト生成

ElevenLabsServiceは、以下の要素を組み合わせて最適なプロンプトを自動生成します:

#### 時間帯スタイル

| 時間帯 | スタイル |
|--------|----------|
| morning | bright morning ambience with gentle awakening melodies |
| afternoon | focused productive atmosphere with steady rhythms |
| evening | relaxing sunset vibes with warm harmonies |
| night | peaceful nighttime soundscape with calm tones |
| lateNight | deep night atmosphere with minimal subtle sounds |

#### 天気スタイル

| 天気 | スタイル |
|------|----------|
| sunny | cheerful sunny day energy with uplifting tones |
| cloudy | contemplative overcast mood with balanced sounds |
| rainy | gentle rain ambience with soothing water sounds |
| snowy | serene winter atmosphere with crystalline textures |
| stormy | dramatic weather energy with powerful elements |

#### 作業タイプスタイル

| 作業タイプ | スタイル |
|-----------|----------|
| focus | concentration-enhancing lo-fi beats with minimal distractions |
| creative | inspiring creative flow with dynamic progressions |
| relaxed | calm ambient soundscape for relaxation |
| energetic | upbeat motivational music with driving rhythms |

### クレジット消費

プロンプトの文字数でクレジットを消費します:

- 平均プロンプト長: 約150-200文字
- 1回の生成: 約150-200文字消費
- 無料プラン: 月約50-65回生成可能

### レート制限

- **無料プラン**: 1分あたり約10リクエスト
- **有料プラン**: より高いレート制限
- リトライロジックで自動対応

---

## トラブルシューティング

### エラー: 401 Unauthorized

**原因**: API キーが無効

**解決策**:
1. `.env.local` の `ELEVENLABS_API_KEY` を確認
2. ElevenLabsダッシュボードで新しいAPIキーを生成
3. サーバーを再起動

### エラー: 402 Payment Required

**原因**: クレジットが不足

**解決策**:
1. [ElevenLabs Dashboard](https://elevenlabs.io/app/usage) で残高確認
2. プランをアップグレード
3. 月初まで待つ（無料プランの場合）

### エラー: 429 Too Many Requests

**原因**: レート制限に達した

**解決策**:
- 自動リトライが実行されます（最大3回）
- 数分待ってから再試行
- プランをアップグレード

### 音質が低い

**原因**: 無料プランの制限

**解決策**:
- 有料プランにアップグレード
- より詳細なプロンプトを使用
- `prompt_influence` パラメータを調整

---

## 高度な設定

### プロンプトのカスタマイズ

`elevenlabsService.ts` の `buildMusicPrompt` メソッドを編集:

```typescript
private buildMusicPrompt(request: BGMRequest): string {
  // カスタムプロンプトロジック
  const customPrompt = `Your custom prompt here...`;
  return customPrompt;
}
```

### プロンプト影響度の調整

`callElevenLabsAPI` メソッド内の `prompt_influence` を変更:

```typescript
{
  text: prompt,
  duration_seconds: duration,
  prompt_influence: 0.5  // 0.0-1.0 の範囲で調整
}
```

- **0.0**: モデルの自由度が高い
- **0.5**: バランス（デフォルト）
- **1.0**: プロンプトに厳密に従う

### 他のElevenLabs APIの使用

音楽生成以外にも、ElevenLabsは以下のAPIを提供:

- **Text-to-Speech**: 音声合成
- **Voice Cloning**: カスタム音声作成
- **Speech-to-Speech**: 音声変換

詳細: https://elevenlabs.io/docs

---

## プロバイダー比較

| 機能 | ElevenLabs | MusicGen | Genspark |
|------|-----------|----------|----------|
| **品質** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **速度** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **コスト** | 💰💰💰 | 💰 (無料) | 💰💰 |
| **最大長** | 22秒 | 30秒 | 180秒 |
| **商用利用** | ✅ (有料) | ✅ | ✅ |
| **API安定性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 参考リンク

- [ElevenLabs 公式サイト](https://elevenlabs.io/)
- [API ドキュメント](https://elevenlabs.io/docs)
- [料金プラン](https://elevenlabs.io/pricing)
- [ダッシュボード](https://elevenlabs.io/app)
- [ステータスページ](https://status.elevenlabs.io/)

---

## サポート

問題が発生した場合:

1. ログを確認: `apps/api/logs/`
2. ElevenLabs Status: https://status.elevenlabs.io/
3. ElevenLabs サポート: support@elevenlabs.io
4. GitHub Issues: プロジェクトのIssueセクション

---

**最終更新**: 2024-12-03
