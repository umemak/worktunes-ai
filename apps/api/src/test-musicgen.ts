/**
 * MusicGen サービステストスクリプト
 * 
 * 使用方法:
 * 1. .env.local に HUGGINGFACE_API_TOKEN を設定
 * 2. npx ts-node src/test-musicgen.ts
 */

import dotenv from 'dotenv';
import { MusicGenService } from './services/musicgenService';
import { BGMRequest } from '@worktunes/types';
import fs from 'fs';
import path from 'path';

// 環境変数をロード
dotenv.config({ path: '../../.env.local' });

async function testMusicGen() {
  console.log('🎵 MusicGen Service Test\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 環境変数チェック
  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (!token) {
    console.error('❌ Error: HUGGINGFACE_API_TOKEN not set in .env.local');
    console.log('\n📝 Setup instructions:');
    console.log('1. Visit: https://huggingface.co/settings/tokens');
    console.log('2. Create a new token with "read" permissions');
    console.log('3. Add to .env.local: HUGGINGFACE_API_TOKEN=hf_xxxxx\n');
    process.exit(1);
  }

  console.log('✅ API Token found');
  console.log(`   Token: ${token.substring(0, 10)}...${token.slice(-5)}\n`);

  // MusicGenServiceインスタンス作成
  const musicgenService = new MusicGenService();

  // ヘルスチェック
  console.log('🔍 Checking API health...');
  const isHealthy = await musicgenService.healthCheck();
  console.log(`   Status: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}\n`);

  // テストリクエスト作成
  const testRequest: BGMRequest = {
    environment: {
      timeOfDay: 'morning',
      weather: {
        condition: 'sunny',
        temperature: 22,
        humidity: 60,
        windSpeed: 5,
        description: 'Clear sky'
      },
      season: 'spring',
      timestamp: new Date().toISOString()
    },
    workType: 'focus',
    duration: 10, // 短縮してテストを高速化
    mood: 'calm',
    genre: 'lo-fi'
  };

  console.log('🎼 Generating BGM with MusicGen...');
  console.log('   Settings:');
  console.log(`   - Time: ${testRequest.environment.timeOfDay}`);
  console.log(`   - Weather: ${testRequest.environment.weather.condition}`);
  console.log(`   - Work Type: ${testRequest.workType}`);
  console.log(`   - Duration: ${testRequest.duration}s`);
  console.log(`   - Mood: ${testRequest.mood}`);
  console.log(`   - Genre: ${testRequest.genre}\n`);

  console.log('⏳ This may take 30-90 seconds...\n');

  try {
    const startTime = Date.now();
    
    const result = await musicgenService.generateBGM(testRequest);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('✅ BGM Generation Successful!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Result:');
    console.log(`   ID: ${result.id}`);
    console.log(`   Title: ${result.metadata.title}`);
    console.log(`   Genre: ${result.metadata.genre}`);
    console.log(`   Mood: ${result.metadata.mood}`);
    console.log(`   BPM: ${result.metadata.bpm}`);
    console.log(`   Energy: ${result.metadata.energy}`);
    console.log(`   Instruments: ${result.metadata.instruments.join(', ')}`);
    console.log(`   Duration: ${result.metadata.duration}s`);
    console.log(`   Generation Time: ${duration}s\n`);

    console.log('🎹 Generation Parameters:');
    console.log(`   Model: ${result.generationParams.model}`);
    console.log(`   Prompt: ${result.generationParams.prompt}\n`);

    // オーディオデータを保存
    const outputDir = path.join(__dirname, '../test-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const audioFilePath = path.join(outputDir, `test-music-${Date.now()}.wav`);
    
    // Base64データをデコードして保存
    if (result.audioUrl.startsWith('data:audio/wav;base64,')) {
      const base64Data = result.audioUrl.replace('data:audio/wav;base64,', '');
      const audioBuffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(audioFilePath, audioBuffer);
      console.log('💾 Audio saved to:');
      console.log(`   ${audioFilePath}\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 Test completed successfully!\n');

  } catch (error: any) {
    console.error('❌ BGM Generation Failed\n');
    console.error('Error Details:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack: ${error.stack}\n`);

    if (error.response) {
      console.error('API Response:');
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}\n`);
    }

    console.log('💡 Troubleshooting:');
    console.log('1. Check your HUGGINGFACE_API_TOKEN');
    console.log('2. Verify the model is available: https://huggingface.co/facebook/musicgen-small');
    console.log('3. Check API status: https://status.huggingface.co/');
    console.log('4. If "Model is loading", wait and try again in 30 seconds\n');

    process.exit(1);
  }
}

// テスト実行
testMusicGen().catch(console.error);
