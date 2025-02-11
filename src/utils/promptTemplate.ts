interface Format {
  name: string;
  example: string;
}

const formats: Record<string, Format> = {
  trivia: {
    name: 'Trivia',
    example: `<video>
    <group part="intro">
        <element>
            <text voiceId="50YSQEDPA2vlOxhCseP4" style="0.2">Did you know these fascinating facts about pyramids?</text>
            <image>Ancient Egyptian pyramid at sunset</image>
        </element>
        
    </group>
    <group part="content">
        <element>
            <text voiceId="50YSQEDPA2vlOxhCseP4" style="0.2">The Great Pyramid was the tallest structure for over 3,800 years!</text>
            <image>Great Pyramid comparison to modern buildings</image>
        </element>
    </group>
    <group part="outro">
        <element>
            <text voiceId="50YSQEDPA2vlOxhCseP4" style="0.4">The pyramids continue to reveal their secrets to this day...</text>
            <image>A giant 3D question mark hovering over the pyramids</image>
        </element>
        <element>
            <text voiceId="50YSQEDPA2vlOxhCseP4" style="0.4">Stay curious - there's always more to discover!</text>
            <image>Pyramids under starry night sky</image>
        </element>
    </group>
</video>`
  }
};

export const createVideoScriptPrompt = (topic: string, formatName: string = 'trivia') => {
  const format = formats[formatName];
  if (!format) throw new Error(`Format ${formatName} not found`);

  return `
Format: ${format.name}
Topic: ${topic}

Please write a detailed script for this short video, considering the specified format and topic.
Include an introduction, main content sections, and an outro. Each section should have an image.
Structure the script as an XML Document with clear sections, descriptions for the images.
The image description should be written as a prompt. This prompt will be used to generate an image.
Put the description between the image tags. The video shouldn't be longer than 30 seconds.

Example format:
${format.example}`;
}