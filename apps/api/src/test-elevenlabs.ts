/**
 * ElevenLabs サービステストスクリプト
 * 
 * 使用方法:
 * 1. .env.local に ELEVENLABS_API_KEY を設定
 * 2. npx ts-node src/test-elevenlabs.ts
 */

import dotenv from 'dotenv';
import { ElevenLabsService } from './services/elevenlabsService';
import { BGMRequest } from '@worktunes/types';
import fs from 'fs';
import path from 'path';

// 環境変数をロード
dotenv.config({ path: '../../.env.local' });

async function testElevenLabs() {
  console.log('🎵 ElevenLabs Service Test\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 環境変数チェック
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: ELEVENLABS_API_KEY not set in .env.local');
    console.log('\n📝 Setup instructions:');
    console.log('1. Visit: https://elevenlabs.io/');
    console.log('2. Sign up for an account (free tier available)');
    console.log('3. Go to Profile Settings > API Key');
    console.log('4. Copy your API key');
    console.log('5. Add to .env.local: ELEVENLABS_API_KEY=your_api_key\n');
    process.exit(1);
  }

  console.log('✅ API Key found');
  console.log(`   Key: ${apiKey.substring(0, 10)}...${apiKey.slice(-5)}\n`);

  // ElevenLabsServiceインスタンス作成
  const elevenlabsService = new ElevenLabsService();

  // ヘルスチェック
  console.log('🔍 Checking API health...');
  const isHealthy = await elevenlabsService.healthCheck();
  console.log(`   Status: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}\n`);

  if (!isHealthy) {
    console.error('❌ API health check failed. Please verify your API key.\n');
    process.exit(1);
  }

  // クレジット確認
  try {
    console.log('💳 Checking account credits...');
    const credits = await elevenlabsService.getCredits();
    console.log(`   Used: ${credits.character_count} / ${credits.character_limit} characters\n`);
  } catch (error) {
    console.warn('⚠️  Could not fetch credit info (may not be available on free tier)\n');
  }

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
    duration: 15, // ElevenLabs v2は最大30秒
    mood: 'calm',
    genre: 'lo-fi'
  };

  console.log('🎼 Generating BGM with ElevenLabs...');
  console.log('   Settings:');
  console.log(`   - Time: ${testRequest.environment.timeOfDay}`);
  console.log(`   - Weather: ${testRequest.environment.weather.condition}`);
  console.log(`   - Work Type: ${testRequest.workType}`);
  console.log(`   - Duration: ${testRequest.duration}s`);
  console.log(`   - Mood: ${testRequest.mood}`);
  console.log(`   - Genre: ${testRequest.genre}\n`);

  console.log('⏳ Generating... (typically takes 10-30 seconds)\n');

  try {
    const startTime = Date.now();
    
    const result = await elevenlabsService.generateBGM(testRequest);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('✅ BGM Generation Successful!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Result:');
    console.log(`   ID: ${result.id}`);
    console.log(`   Title: ${result.metadata.title}`);
    console.log(`   Genre: ${result.metadata.genre}`);
    console.log(`   Mood: ${result.metadata.mood}`);
    console.log(`   BPM: ${result.metadata.bpm}`);
    console.log(`   Key: ${result.metadata.key}`);
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

    const audioFilePath = path.join(outputDir, `elevenlabs-test-${Date.now()}.mp3`);
    
    // Base64データをデコードして保存
    if (result.audioUrl.startsWith('data:audio/mpeg;base64,')) {
      const base64Data = result.audioUrl.replace('data:audio/mpeg;base64,', '');
      const audioBuffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(audioFilePath, audioBuffer);
      console.log('💾 Audio saved to:');
      console.log(`   ${audioFilePath}\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 Test completed successfully!\n');

    console.log('📝 Notes:');
    console.log('- ElevenLabs v2 generates high-quality audio quickly');
    console.log('- Free tier includes 10,000 characters per month');
    console.log('- Audio duration is up to 30 seconds (v2 model)');
    console.log('- 48kHz sample rate - industry standard quality');
    console.log('- Check your remaining credits at https://elevenlabs.io/\n');

  } catch (error: any) {
    console.error('❌ BGM Generation Failed\n');
    console.error('Error Details:');
    console.error(`   Message: ${error.message}`);
    
    if (error.response) {
      console.error('\nAPI Response:');
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}\n`);
    }

    console.log('💡 Troubleshooting:');
    console.log('1. Verify your ELEVENLABS_API_KEY is correct');
    console.log('2. Check if you have remaining credits');
    console.log('3. Visit https://elevenlabs.io/ to manage your account');
    console.log('4. Check API status at https://status.elevenlabs.io/\n');

    if (error.response?.status === 401) {
      console.log('🔑 Error 401: Invalid API key. Please check your credentials.\n');
    } else if (error.response?.status === 429) {
      console.log('⏱️  Error 429: Rate limit exceeded. Please wait and try again.\n');
    } else if (error.response?.status === 402) {
      console.log('💳 Error 402: Insufficient credits. Please upgrade your plan.\n');
    }

    process.exit(1);
  }
}

// テスト実行
testElevenLabs().catch(console.error);
