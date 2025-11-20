# 🎵 AI Developer向け：Gensparkベース設計移行ガイド

## 🔄 設計変更概要

**新方針**: GensparkのAI音楽生成機能をコアエンジンとして活用  
**旧方針**: ElevenLabs外部API中心の独立サービス

## 🚀 最優先実装タスク（Gensparkベース）

### 1. 【最重要】Genspark音楽生成統合
```typescript
// apps/api/src/services/gensparkMusicService.ts
// ✅ 基本実装完了 - AI Developerで以下を実装

class GensparkMusicService {
  // TODO: 実際のGenspark API統合
  private async callGensparkAudioGeneration() {
    // Gensparkのaudio_generation toolを呼び出し
    // 複数モデル（ElevenLabs, Suno, MiniMax等）から最適選択
  }
}
```

### 2. 【重要】環境適応モデル選択ロジック
```typescript
// 実装必要: 時間帯×天気×作業タイプ → 最適Gensparkモデル
const modelSelection = {
  focus_morning_sunny: 'mureka/instrumental-generator',
  creative_evening_rainy: 'fal-ai/lyria2', 
  energetic_afternoon_sunny: 'elevenlabs/v3-tts'
  // ... 全組み合わせのマッピング
};
```

### 3. 【重要】フロントエンドGensparkプレイヤー
```typescript
// apps/web/components/GensparkMusicPlayer.tsx
// Genspark生成音楽の再生・制御UI
```

## 🎯 Gensparkベース実装指示

### AI Developerでの作業開始コマンド
```
WorkTunes AI をGensparkの音楽生成機能ベースに実装します。

ARCHITECTURE_REVISION.md を確認し、以下を順次実装してください:

1. apps/api/src/services/gensparkMusicService.ts の完成
   - Gensparkのaudio_generation tool統合
   - 複数モデル選択ロジック実装
   - 環境適応プロンプト生成

2. apps/api/src/routes/bgm.ts の更新  
   - GensparkMusicService使用に変更
   - ElevenLabs依存を削除

3. apps/web/components/GensparkMusicPlayer.tsx 作成
   - Genspark生成音楽の再生UI
   - 進捗表示、再生制御

既存の型定義（packages/types）とデータベース設計は活用してください。
```

## 🔧 具体的実装ガイド

### Genspark Audio Generation統合

#### Step 1: Gensparkクライアント設定
```typescript
// apps/api/src/config/genspark.ts
export const gensparkConfig = {
  apiUrl: process.env.GENSPARK_API_URL,
  token: process.env.GENSPARK_TOKEN,
  timeout: 60000, // 音楽生成は時間がかかる
  
  models: {
    focus: 'mureka/instrumental-generator',
    creative: 'elevenlabs/v3-tts', 
    relaxed: 'fal-ai/lyria2',
    energetic: 'fal-ai/minimax-music/v2'
  }
};
```

#### Step 2: 音楽生成API呼び出し
```typescript
// GensparkのAPIまたはツール統合方法
// Option A: REST API経由
const response = await fetch(`${gensparkApiUrl}/tools/audio_generation`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    model: selectedModel,
    query: musicPrompt,
    duration: requestDuration
  })
});

// Option B: Gensparkツール直接統合（推奨）
import { audio_generation } from '@genspark/tools';
const result = await audio_generation({
  model: selectedModel,
  query: musicPrompt, 
  duration: requestDuration
});
```

#### Step 3: 複数モデル戦略
```typescript
// 環境に応じた最適モデル選択
const selectGensparkModel = (environment: EnvironmentData, workType: string) => {
  // 朝×晴れ×集中作業 → インストゥルメンタル
  if (environment.timeOfDay === 'morning' && 
      environment.weather.condition === 'sunny' && 
      workType === 'focus') {
    return 'mureka/instrumental-generator';
  }
  
  // 雨×夜×リラックス → アンビエント
  if (environment.weather.condition === 'rainy' && 
      environment.timeOfDay === 'night' && 
      workType === 'relaxed') {
    return 'fal-ai/lyria2';
  }
  
  // デフォルト高品質
  return 'elevenlabs/v3-tts';
};
```

### フロントエンド実装

#### Gensparkプレイヤーコンポーネント
```typescript
// apps/web/components/GensparkMusicPlayer.tsx
export const GensparkMusicPlayer = ({ currentTrack, onGenerate }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const handleGenerate = async (params) => {
    setIsGenerating(true);
    
    // Gensparkベース生成APIを呼び出し
    const result = await fetch('/api/bgm/generate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    
    setIsGenerating(false);
    onGenerate(result);
  };

  return (
    <div className="genspark-music-player">
      {isGenerating ? (
        <GenerationProgress progress={generationProgress} />
      ) : (
        <StandardMusicControls track={currentTrack} />
      )}
    </div>
  );
};
```

## 🎵 Gensparkモデル活用戦略

### 利用可能Gensparkモデルと用途

#### 1. ElevenLabs系（高品質汎用）
- **elevenlabs/v3-tts**: 最高品質、多様なスタイル対応
- **用途**: デフォルト選択、重要なシーン

#### 2. Mureka系（楽曲特化）
- **mureka/song-generator**: 歌詞付き楽曲
- **mureka/instrumental-generator**: インストゥルメンタル
- **用途**: 集中作業、メロディ重視

#### 3. Lyria系（アンビエント特化）
- **fal-ai/lyria2**: 環境音楽、アンビエント
- **用途**: リラックス、雨天時、深夜作業

#### 4. MiniMax系（多機能）
- **fal-ai/minimax-music/v2**: 歌詞対応、多様なジャンル
- **用途**: エネルギッシュな作業、創作活動

### 環境別最適化マッピング
```typescript
const gensparkModelMapping = {
  // 時間帯別
  morning: {
    defaultModel: 'elevenlabs/v3-tts',
    focusModel: 'mureka/instrumental-generator',
    energeticModel: 'fal-ai/minimax-music/v2'
  },
  
  // 天気別
  rainy: {
    primaryModel: 'fal-ai/lyria2',
    secondaryModel: 'mureka/instrumental-generator'
  },
  
  // 作業タイプ別
  focus: {
    preferred: 'mureka/instrumental-generator',
    alternative: 'fal-ai/lyria2'
  }
};
```

## 🔄 マイグレーション手順

### Phase 1: Gensparkサービス実装
1. **GensparkMusicService完成**: API統合・モデル選択
2. **BGMルート更新**: Gensparkサービス使用
3. **基本テスト**: 音楽生成動作確認

### Phase 2: フロントエンド対応
1. **プレイヤーUI更新**: Genspark対応
2. **生成プロセス表示**: 複数モデル選択状況
3. **結果表示**: 使用モデル・品質情報

### Phase 3: 最適化
1. **キャッシュ実装**: 同条件音楽の再利用
2. **A/Bテスト**: モデル選択精度向上
3. **ユーザー学習**: 好み反映システム

## 📋 実装チェックリスト

### バックエンド
- [ ] GensparkMusicService実装完了
- [ ] 複数モデル選択ロジック
- [ ] 環境適応プロンプト生成
- [ ] エラーハンドリング・フォールバック
- [ ] 音楽メタデータ生成

### フロントエンド  
- [ ] Gensparkプレイヤーコンポーネント
- [ ] 生成進捗表示UI
- [ ] モデル情報表示
- [ ] 音楽品質・詳細表示

### 統合・テスト
- [ ] E2E音楽生成フロー
- [ ] 複数環境条件テスト
- [ ] パフォーマンス最適化
- [ ] ユーザビリティ確認

---

**🎵 GensparkのAI音楽生成エコシステムを最大活用したWorkTunes AIを実装しましょう！**