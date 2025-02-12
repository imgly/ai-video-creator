'use client'

import { useState, useEffect, useRef } from 'react'
import { generateVideoScript } from '../utils/api'
import CreativeEngine from '@cesdk/engine';
import { createVideo } from '../utils/videoProcessor'
import EditorModal from '../components/EditorModal'

interface VideoElement {
  text: string;
  imageUrl: string;
}

interface VideoUrls {
  videoUrl: string;
  sceneData: string;
}

export default function Home() {
  const [inputValue, setInputValue] = useState('')
  const [response, setResponse] = useState<VideoElement[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [engineStatus, setEngineStatus] = useState<'idle' | 'initializing' | 'ready' | 'error'>('idle')
  const engineRef = useRef<any>(null)
  const engineInitializedRef = useRef(false)
  const [videoUrls, setVideoUrls] = useState<VideoUrls | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  useEffect(() => {
    const initEngine = async () => {
      if (typeof window === 'undefined' || engineInitializedRef.current) {
        return;
      }

      try {
        setEngineStatus('initializing')
        console.log('Initializing CreativeEngine...')

        const config = {
          license: 'A-O53TWXK5bfyconUx7e53S5YU7DzjuGpMAH5vvKjLd0zBa6IhsoF7zChy1uCVbj',
          userId: 'guides-user',
          baseURL: 'https://cdn.img.ly/packages/imgly/cesdk-engine/1.44.0/assets',
        }


        const engine = await CreativeEngine.init(config)
        engineRef.current = engine

        const container = document.getElementById('cesdk_container')
        if (container) {
          container.innerHTML = ''
          container.append(engine.element)
        }

        engineInitializedRef.current = true
        setEngineStatus('ready')
        console.log('CreativeEngine initialized successfully')
      } catch (error) {
        console.error('Error initializing CreativeEngine:', error)
        setEngineStatus('error')
      }
    }

    initEngine()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      const result = await generateVideoScript(inputValue)
      setResponse(result)

      // Only try to create video if engine is ready
      if (engineStatus === 'ready' && engineRef.current) {
        try {
          const urls = await createVideo(engineRef.current, result)
          setVideoUrls(urls)
        } catch (err) {
          console.error('Error creating video:', err)
          setError('Failed to create video')
        }
      }
    } catch (err) {
      setError('Failed to get response')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <form onSubmit={handleSubmit} className="flex gap-2 items-center w-full max-w-[450px]">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter your video topic"
          className="flex-1 p-2 border rounded text-[hsl(208,12%,28%)] placeholder:text-[hsl(208,12%,60%)] border-[hsl(208,12%,80%)]"
        />
        <button
          disabled={isLoading}
          className="p-2 px-4 w-[160px] bg-[hsl(208,12%,28%)] hover:bg-[hsl(208,12%,22%)] text-[hsl(200,11%,95%)] disabled:text-[hsl(208,12%,50%)] rounded disabled:bg-gray-300 transition-colors text-center"
        >
          {isLoading ? 'Generating...' : 'Generate Video'}
        </button>
      </form>
      {/* Add container for Creative Engine */}
      <div 
        id="cesdk_container" 
        className="bg-gray-100 invisible rounded-lg mt-8"
      />
      {/* Status indicator */}
      {engineStatus === 'initializing' && (
        <p className="text-blue-500">Initializing Creative Engine...</p>
      )}
      {engineStatus === 'error' && (
        <p className="text-red-500">Failed to initialize Creative Engine</p>
      )}
      {videoUrls && (
        <div className="w-300 max-w-md mt-4">
          <video 
            src={videoUrls.videoUrl}
            controls
            className="w-full rounded-lg shadow-lg"
          />
          <button
            onClick={() => setIsEditorOpen(true)}
            className="w-full mt-2 p-2 bg-[hsl(221,100%,80%)] text-[hsl(208,14%,18%)] rounded hover:bg-[hsl(221,100%,85%)]"
          >
            Open in Editor
          </button>
          <EditorModal
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            sceneData={videoUrls.sceneData}
          />
        </div>
      )}
    </div>
  )
}
