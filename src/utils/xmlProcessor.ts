import { parseString } from 'xml2js';
import { generateImage, generateAudio } from './api';

// Update interface to match XML structure
interface VideoElement {
  text?: [{
    _: string;
    $: {
      voiceId: string;
      style: string;
    }
  }];
  image?: string[];
}

interface VideoGroup {
  element: VideoElement[];
  _: { part: string };
}

interface VideoStructure {
  video: {
    group: VideoGroup[];
  };
}

interface VideoBlock {
  text: string;
  imageUrl: string | null;
  audioUrl: string | null;
  startTime: number;
  duration: number;
  wordTimestamps: Array<{ word: string, start: number, duration: number }>;
}

interface VideoMetadata {
  totalDuration: number;
  blocks: VideoBlock[];
}

export async function processVideoScript(xmlContent: string): Promise<VideoMetadata> {
  const cleanedXmlString = xmlContent.trim().replace(/^```xml\s*|```$/g, '');
  return new Promise((resolve, reject) => {
    parseString(cleanedXmlString, async (err, result: VideoStructure) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        const blocks: VideoBlock[] = []; // Store all the generated assets + time codes in this array
        const groups = result.video.group;
        let accumulatedDuration = 0; // Track total duration so far

        for (const group of groups) {  // Process each group; intro, content, outro
          for (const element of group.element) {  // Process each element; text and image
            const textContent = element.text?.[0]?._ || '';
            const imagePrompt = element.image?.[0];
            const style = element.text?.[0]?.$.style || '0';

            const { audioUrl, wordTimestamps } = await generateAudio(textContent, style);
            
            // Calculate block timing with offset
            const blockStartTime = accumulatedDuration;
            const blockDuration = wordTimestamps.length > 0 
              ? (wordTimestamps[wordTimestamps.length - 1].start + wordTimestamps[wordTimestamps.length - 1].duration)
              : 0;

            const imageUrl = imagePrompt ? await generateImage(imagePrompt) : null;
            
            blocks.push({
              text: textContent,
              imageUrl,
              audioUrl,
              startTime: blockStartTime,
              duration: blockDuration,
              wordTimestamps: wordTimestamps.map(wt => ({
                ...wt,
                start: wt.start + blockStartTime // Offset word timestamps
              }))
            });
            accumulatedDuration += blockDuration;
          }
        }

        const totalDuration = accumulatedDuration;

        // Debug logging
        console.log('🎥 Total Video Duration:', totalDuration.toFixed(2), 'seconds');
        
        console.log('\n📋 Video Blocks Summary:');
        console.table(blocks.map((block, index) => ({
          Block: index + 1,
          Text: block.text.substring(0, 30) + '...',
          Start: block.startTime.toFixed(2),
          Duration: block.duration.toFixed(2),
          'Word Count': block.wordTimestamps.length,
          'Has Image': !!block.imageUrl,
          'Has Audio': !!block.audioUrl
        })));

        resolve({
          totalDuration,
          blocks
        });

      } catch (error) {
        reject(error);
      }
    });
  });
}