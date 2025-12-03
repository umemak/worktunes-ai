# 🎵 MusicGen 統合ガイド

WorkTunes AI で MusicGen (Hugging Face) を使用した音楽生成を実装する方法

## 📋 目次

1. [MusicGenとは](#musicgenとは)
2. [セットアップ手順](#セットアップ手順)
3. [使用方法](#使用方法)
4. [API仕様](#api仕様)
5. [トラブルシューティング](#トラブルシューティング)

---

## MusicGenとは

**MusicGen** は Meta (Facebook) が開発したオープンソースの音楽生成AIモデルです。

### ✅ メリット

- **無料**: Hugging Face Inference API経由で無料利用可能
- **高品質**: テキストプロンプトから高品質な音楽を生成
- **簡単統合**: REST APIで簡単に統合可能
- **オープンソース**: モデルの仕組みが公開されている

### ⚠️ 制限事項

- **生成時間**: 30秒の音楽生成に約60-90秒かかる
- **レート制限**: 無料版は1日約1000リクエストまで
- **音質**: 商用APIと比較すると品質は劣る
- **最大長**: 最大30秒の音楽のみ生成可能

---

## セットアップ手順

### 1. Hugging Face アカウント作成

1. [Hugging Face](https://huggingface.co/join) にアクセス
2. アカウントを作成（無料）

### 2. API トークン取得

1. [Settings > Access Tokens](https://huggingface.co/settings/tokens) に移動
2. **New token** をクリック
3. トークン設定:
   - **Name**: `WorkTunes-AI`
   - **Role**: `read` を選択
4. **Generate a token** をクリック
5. 生成されたトークンをコピー（形式: `hf_xxxxxxxxxxxxxxxxx`）

### 3. 環境変数設定

`.env.local` ファイルに以下を追加:

```bash
# MusicGen (Hugging Face) 設定
HUGGINGFACE_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxx
MUSIC_PROVIDER=musicgen
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
    "duration": 30,
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
    "audioUrl": "data:audio/wav;base64,UklGRiQAAABXQVZF...",
    "metadata": {
      "title": "Morning Sunny - Focus BGM",
      "duration": 30,
      "genre": "Lo-fi",
      "mood": "Uplifting",
      "instruments": ["Piano", "Synthesizer", "Light Percussion"],
      "bpm": 80,
      "key": "C Major",
      "energy": 0.5,
      "generatedAt": "2024-01-01T09:00:00.000Z"
    },
    "generationParams": {
      "prompt": "lo-fi music, lo-fi, minimal percussion, steady rhythm, uplifting, fresh, energetic, bright, cheerful, optimistic, calm, high quality, no vocals",
      "model": "facebook/musicgen-small",
      "duration": 30
    }
  }
}
```

---

## API仕様

### 環境適応型プロンプト生成

MusicGenServiceは、以下の要素を組み合わせて最適なプロンプトを自動生成します:

#### 時間帯スタイル

| 時間帯 | スタイル |
|--------|----------|
| morning | uplifting, fresh, energetic |
| afternoon | focused, steady, moderate tempo |
| evening | relaxing, warm, mellow |
| night | calm, peaceful, ambient |
| lateNight | soft, minimal, atmospheric |

#### 天気スタイル

| 天気 | スタイル |
|------|----------|
| sunny | bright, cheerful, optimistic |
| cloudy | contemplative, neutral, balanced |
| rainy | gentle, soothing, with soft rain sounds |
| snowy | serene, pure, crystalline |
| stormy | dramatic, intense, powerful |

#### 作業タイプスタイル

| 作業タイプ | スタイル |
|-----------|----------|
| focus | lo-fi, minimal percussion, steady rhythm |
| creative | inspiring, flowing, dynamic |
| relaxed | ambient, spacious, slow tempo |
| energetic | upbeat, motivating, driving rhythm |

### 自動推定される属性

サービスは以下の属性を自動的に推定します:

- **Genre**: 作業タイプに基づいて推定
- **BPM**: 作業タイプに応じて 65-120 BPM
- **Mood**: 時間帯に基づいて推定
- **Instruments**: 作業タイプに応じた楽器構成
- **Energy**: 0.3-0.8 の範囲で推定

---

## トラブルシューティング

### エラー: "Model is loading"

**原因**: モデルがまだロードされていない（コールドスタート）

**解決策**: 自動的にリトライされます。約20-60秒待ってください。

```
Model is loading, retrying in 20 seconds...
```

### エラー: "Authentication failed"

**原因**: API トークンが無効または未設定

**解決策**:
1. `.env.local` の `HUGGINGFACE_API_TOKEN` を確認
2. トークンが `hf_` で始まることを確認
3. トークンが有効期限内であることを確認

### エラー: "Rate limit exceeded"

**原因**: 1日のリクエスト上限に達した

**解決策**:
- 無料プラン: 24時間待つ
- 有料プラン: [Hugging Face Pro](https://huggingface.co/pricing) にアップグレード

### 生成が遅い

**原因**: サーバーの負荷やモデルのコールドスタート

**改善策**:
- より小さいモデルを使用: `facebook/musicgen-small` (現在使用中)
- ローカル実行: モデルをダウンロードしてローカルで実行
- 有料API: ElevenLabs や Suno などの有料サービスを検討

---

## 高度な設定

### プロバイダーの切り替え

`.env.local` で音楽生成プロバイダーを切り替え:

```bash
# MusicGen を使用
MUSIC_PROVIDER=musicgen

# Genspark を使用（デフォルト）
MUSIC_PROVIDER=genspark
```

### カスタムモデル使用

`musicgenService.ts` の `apiUrl` を変更:

```typescript
// 標準モデル (小)
private readonly apiUrl = 'https://api-inference.huggingface.co/models/facebook/musicgen-small';

// 中サイズモデル (高品質、遅い)
private readonly apiUrl = 'https://api-inference.huggingface.co/models/facebook/musicgen-medium';

// 大サイズモデル (最高品質、非常に遅い)
private readonly apiUrl = 'https://api-inference.huggingface.co/models/facebook/musicgen-large';
```

### ローカル実行 (推奨: GPU搭載マシン)

Hugging Face APIの代わりにローカルでモデルを実行:

```bash
pip install transformers torch torchaudio

python local_musicgen_server.py
```

---

## 参考リンク

- [MusicGen Model Card](https://huggingface.co/facebook/musicgen-small)
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference/index)
- [MusicGen Paper](https://arxiv.org/abs/2306.05284)
- [Hugging Face Pricing](https://huggingface.co/pricing)

---

## サポート

問題が発生した場合:

1. ログを確認: `apps/api/logs/`
2. Hugging Face Status: https://status.huggingface.co/
3. GitHub Issues: プロジェクトのIssueセクション

---

**最終更新**: 2024-12-03
