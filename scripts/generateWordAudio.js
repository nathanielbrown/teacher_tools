import { GoogleGenAI } from '@google/genai';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// Initialize the Google Gen AI SDK. 
// Make sure you have GEMINI_API_KEY set in your environment variables.
const ai = new GoogleGenAI({});

/**
 * Generates an audio file for a given word using Gemini's audio modality,
 * converts it to OGG format using ffmpeg, and saves it to the premium folder.
 * 
 * @param {string[]} words - List of words to generate audio for.
 */
export async function generateWordAudio(words) {
  // Define the target premium folder
  const outputDir = path.join(process.cwd(), 'public', 'premium', 'audio');
  
  // Ensure the output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  for (const word of words) {
    console.log(`Generating audio for word: "${word}"`);
    try {
      // 1. Generate audio using Gemini 2.0 Flash
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Clearly and naturally speak the following word: "${word}"`,
        config: {
          responseModalities: ["AUDIO"],
          systemInstruction: "You are a professional voice actor for an educational app. Speak the word clearly and naturally with good pronunciation. Only output the spoken word, no extra text or sounds."
        }
      });

      // 2. Extract audio data from the response
      const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      
      if (!audioPart || !audioPart.inlineData) {
         console.error(`Failed to get audio data for "${word}". Did the model return text instead?`);
         continue;
      }

      const { data, mimeType } = audioPart.inlineData;
      console.log(`Received audio with mime type: ${mimeType}`);

      // Create a temporary file for the raw audio.
      const tempFilePath = path.join(outputDir, `temp_${word}.raw`);
      const buffer = Buffer.from(data, 'base64');
      await fs.writeFile(tempFilePath, buffer);

      // 3. Convert to OGG using ffmpeg
      const finalOggPath = path.join(outputDir, `${word.toLowerCase()}.ogg`);
      console.log(`Converting to OGG: ${finalOggPath}`);
      
      // Determine input arguments based on mime type. 
      // Gemini usually returns raw PCM data at 24kHz for audio modalities.
      let ffmpegInputArgs = '-i';
      if (mimeType.includes('audio/pcm')) {
         ffmpegInputArgs = '-f s16le -ar 24000 -ac 1 -i';
      }

      await execPromise(`ffmpeg -y ${ffmpegInputArgs} "${tempFilePath}" -c:a libvorbis "${finalOggPath}"`);
      
      // Clean up the temporary raw file
      await fs.unlink(tempFilePath);
      
      console.log(`✅ Successfully created ${finalOggPath}`);
      
      // Add a small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error generating audio for "${word}":`, error);
    }
  }
}

// Example usage:
// generateWordAudio(['Cat', 'Dog', 'Elephant', 'Alphabet'])
//   .then(() => console.log('Finished generating all audio files.'))
//   .catch(console.error);
