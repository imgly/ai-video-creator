import { Anthropic } from '@anthropic-ai/sdk';
import * as fal from '@fal-ai/serverless-client';
import { createVideoScriptPrompt } from './promptTemplate';
import { processVideoScript } from './xmlProcessor';

const anthropic = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

fal.config({
  credentials: process.env.NEXT_PUBLIC_FAL_API_KEY
});


export async function generateVideoScript(topic: string) {
  try {
    const prompt = createVideoScriptPrompt(topic);
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    });
    
    // Process the XML response and generate images
    const processedContent = await processVideoScript(response.content[0].text);
    return processedContent;
  } catch (error) {
    console.error('Error processing video script:', error);
    throw error;
  }
}

export async function generateImage(prompt: string): Promise<string | null> {
  try {
    console.log('Generating image for prompt:', prompt);
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: prompt,
        size: "portrait_16_9",
      },
    });
    const typedResult = result as { images: { url: string }[] };
    console.log('Image generation successful. URL:', typedResult.images[0].url);
    return typedResult.images[0].url;
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

export async function generateAudio(text: string, style: string): Promise<{ audioUrl: string, wordTimestamps: Array<{ word: string, start: number, duration: number }> }> {
  try {
    console.log('Creating audio for text:', text);
    console.log('Using style:', style);

    const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/FGY2WhTYpPnrIDTdsKH5/with-timestamps`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': 'sk_f32b2bf2fd255c2c86636359790d4454416df1b2a169c906',
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          style: parseFloat(style),
          similarity_boost: 0.75
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.audio_base64) {
      throw new Error('No audio data received');
    }

    const audioBytes = atob(data.audio_base64);
    const arrayBuffer = new ArrayBuffer(audioBytes.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < audioBytes.length; i++) {
      uint8Array[i] = audioBytes.charCodeAt(i);
    }
    const blob = new Blob([uint8Array], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(blob);
    
    console.log('Audio URL created:', audioUrl);
    
    const wordTimestamps = convertToWordTimestamps(text, data.alignment);
    console.log('Processed word timestamps:', JSON.stringify(wordTimestamps));

    return { audioUrl, wordTimestamps };
  } catch (error) {
    console.error('Error creating audio:', error);
    return { audioUrl: '', wordTimestamps: [] };
  }
}
  
function convertToWordTimestamps(text: string, alignment: {
  characters: string[],
  character_start_times_seconds: number[],
  character_end_times_seconds: number[]
}): Array<{ word: string, start: number, duration: number }> {
  const words = text.split(/\s+/);
  const wordTimestamps: Array<{ word: string, start: number, duration: number }> = [];
  let charIndex = 0;

  words.forEach(word => {
    if (charIndex >= alignment.characters.length) return;

    const wordStart = alignment.character_start_times_seconds[charIndex];
    const initialCharIndex = charIndex;

    while (charIndex < alignment.characters.length && alignment.characters[charIndex] !== ' ') {
      charIndex++;
    }

    const wordEnd = alignment.character_end_times_seconds[charIndex - 1];
    wordTimestamps.push({ word, start: wordStart, duration: wordEnd - wordStart });
    charIndex++; // Skip the space
  });


  return wordTimestamps;
}
  