import { VideoMetadata, VideoBlock } from './xmlProcessor';

interface AudioSegment {
  text: string | null;
  audioUrl: string | null;
  time: number;
  duration: number;
  short?: string;
}

interface ImageSegment {
  description: string | null;
  url: string | null;
}

export async function createVideo(engine: any, videoData: VideoMetadata) {

  // Create video scene, page and tracks for video, audio and text
  const scene = await engine.scene.createVideo();
  const page = engine.block.create('page');
  engine.block.appendChild(scene, page);

  const videotrack = engine.block.create('track');
  engine.block.appendChild(page, videotrack);

  // Set video track as a background track by connecting the page duration to the video track
  engine.block.setAlwaysOnBottom(videotrack, true);
  engine.block.setPageDurationSource(page, videotrack);

  const audiotrack = engine.block.create('track');
  const texttrack = engine.block.create('track');
  
  engine.block.appendChild(page, audiotrack);
  engine.block.appendChild(page, texttrack);

  engine.block.bringToFront(texttrack);

  const videoWidth = 1080;
  const videoHeight = 1920;
  let textOffset = 0;

  engine.block.setWidth(page, videoWidth);
  engine.block.setHeight(page, videoHeight);

  // Process each block
  for (const block of videoData.blocks) {
    // Add audio
    const audio = engine.block.create('audio');
    engine.block.appendChild(audiotrack, audio);
    engine.block.setString(audio, 'audio/fileURI', block.audioUrl);
    engine.block.setTimeOffset(audio, block.startTime);
    engine.block.setDuration(audio, block.duration);
    engine.block.setLooping(audio, false);

    // Add text
    const textBlock = engine.block.create('text');
    engine.block.appendChild(texttrack, textBlock);
    engine.block.setDuration(textBlock, block.duration);
    engine.block.replaceText(textBlock, block.text);

    // Style text
    engine.block.setEnum(textBlock, 'text/horizontalAlignment', 'Center');
    engine.block.setFloat(textBlock, 'text/fontSize', 16);
    engine.block.setTextColor(textBlock, { r: 1, g: 1.0, b: 1.0, a: 1.0 });
    engine.block.setHeightMode(textBlock, 'Auto');

    // Add shadows for better readibility
    engine.block.setDropShadowEnabled(textBlock, true);
    engine.block.setDropShadowColor(textBlock, { r: 0, g: 0, b: 0, a: 1.0 })
    engine.block.setDropShadowOffsetX(textBlock, 5);
    engine.block.setDropShadowOffsetY(textBlock, 5);
    engine.block.setDropShadowBlurRadiusX(textBlock, 5);
    engine.block.setDropShadowBlurRadiusY(textBlock, 5);

    // Add text animation
    const popAnimation = engine.block.createAnimation('pop');
    engine.block.setInAnimation(textBlock, popAnimation);

    // Position text
    engine.block.setPositionX(textBlock, 40);
    engine.block.setWidth(textBlock, videoWidth - 80);
    engine.block.setPositionY(textBlock, 750);

    if (block.imageUrl) {
      const image = engine.block.create('graphic');
      
      engine.block.setShape(image, engine.block.createShape('rect'));
      engine.block.setWidth(image, videoWidth);
      engine.block.setHeight(image, videoHeight);
      engine.block.setPositionX(image, 0);
      engine.block.setPositionY(image, 0);

      const imageFill = engine.block.createFill('image');
      const sourceSet = [{
        uri: block.imageUrl,
        width: videoWidth,
        height: videoWidth * 3/4
      }];
      engine.block.setSourceSet(imageFill, 'fill/image/sourceSet', sourceSet);
      engine.block.setFill(image, imageFill);

      engine.block.appendChild(videotrack, image);
      engine.block.setTimeOffset(image, block.startTime);
      engine.block.setDuration(image, block.duration);

      const imageZoomAnimation = engine.block.createAnimation('crop_zoom');
      engine.block.setInAnimation(image, imageZoomAnimation);
      engine.block.setDuration(imageZoomAnimation, block.duration)
      engine.block.setBool(imageZoomAnimation, 'animation/crop_zoom/fade', false)
      
    }
  }

  // Export video
  const progressCallback = (renderedFrames: number, encodedFrames: number, totalFrames: number) => {
    console.log(`Progress: ${Math.round((encodedFrames / totalFrames) * 100)}%`);
  };

  const blob = await engine.block.exportVideo(
    page,
    'video/mp4',
    progressCallback,
    {}
  );

  // Save scene to string
  const sceneData = await engine.scene.saveToString();
  
  // Create scene blob
  const sceneBlob = new Blob([sceneData], {
    type: 'text/plain'
  });

  return {
    videoUrl: URL.createObjectURL(blob),
    sceneData: URL.createObjectURL(sceneBlob)
  };
}