import 'dotenv/config';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Gets an authentication header or query parameter for the Google Cloud TTS API.
 * 
 * @returns {Promise<{ urlSuffix: string, headers: Record<string, string> }>}
 */
async function getAuth() {
  try {
    const token = execSync('gcloud auth print-access-token', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const project = execSync('gcloud config get-value project', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    
    if (token) {
      const headers = { 'Authorization': `Bearer ${token}` };
      if (project) {
        headers['x-goog-user-project'] = project;
      }
      return { urlSuffix: '', headers };
    }
  } catch (e) {
    // gcloud failed or not logged in
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    return { urlSuffix: `?key=${apiKey}`, headers: {} };
  }

  throw new Error('No authentication found. Please provide GEMINI_API_KEY in .env or login with "gcloud auth login"');
}

/**
 * Generates an audio file for a given word using Google Cloud TTS REST API,
 * and saves it to the premium folder.
 * 
 * @param {string[]} words - List of words to generate audio for.
 */
export async function generateWordAudio(words) {
  const outputDir = path.join(process.cwd(), 'premium', 'audio');
  await fs.mkdir(outputDir, { recursive: true });

  const { urlSuffix, headers: authHeaders } = await getAuth();
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize${urlSuffix}`;

  console.log(`Target directory: ${outputDir}`);

  for (const word of words) {
    console.log(`\n--- Generating audio for word: "${word}" ---`);
    try {
      const finalOggPath = path.join(outputDir, `${word.toLowerCase()}.ogg`);
      
      if (existsSync(finalOggPath)) {
        console.log(`Skipping "${word}", file already exists at ${finalOggPath}`);
        continue;
      }

      const body = {
        input: { text: word },
        voice: { 
          name: 'en-AU-Standard-C',
          languageCode: 'en-AU' 
        },
        audioConfig: { audioEncoding: 'OGG_OPUS' },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google Cloud TTS API error: ${response.status} ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const audioBuffer = Buffer.from(data.audioContent, 'base64');
      
      await fs.writeFile(finalOggPath, audioBuffer);
      console.log(`✅ Successfully created ${finalOggPath}`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error generating audio for "${word}":`, error.message);
    }
  }
}

const numbers = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

generateWordAudio(numbers)
  .then(() => console.log('\nFinished generating all audio files.'))
  .catch(console.error);
