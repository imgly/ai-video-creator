import { useRef, useEffect } from 'react'
import CreativeEditorSDK from '@cesdk/cesdk-js'

interface EditorModalProps {
  isOpen: boolean
  onClose: () => void
  sceneData: string
}

export default function EditorModal({ isOpen, onClose, sceneData }: EditorModalProps) {
  const editorRef = useRef<any>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && !editorRef.current) {
      const initEditor = async () => {
        const config = {
          license: 'A-O53TWXK5bfyconUx7e53S5YU7DzjuGpMAH5vvKjLd0zBa6IhsoF7zChy1uCVbj',
          userId: 'guides-user',
          theme: 'dark',
          baseURL: 'https://cdn.img.ly/packages/imgly/cesdk-js/1.44.0/assets',
          role: 'Creator',
          ui: {
            elements: {
              view: 'default',
              panels: {
              },
              navigation: {
                position: 'top',
                action: {
                  save: true,
                  load: true,
                  close: true,
                  download: true,
                  export: true
                }
              },
              dock: {
                iconSize: 'normal', // 'large' or 'normal'
                hideLabels: true // false or true
              }
            }
          },
          callbacks: {
            onUpload: 'local',
            onSave: (scene: string) => {
              const element = document.createElement('a')
              const base64Data = btoa(unescape(encodeURIComponent(scene)))
              element.setAttribute(
                'href',
                `data:application/octet-stream;base64,${base64Data}`
              )
              element.setAttribute(
                'download',
                `video-${new Date().toISOString()}.scene`
              )
              element.style.display = 'none'
              document.body.appendChild(element)
              element.click()
              document.body.removeChild(element)
            },
            onClose: () => {
              onClose();
            },
            onLoad: 'upload',
            onDownload: 'download',
            onExport: 'download'
          }
        }

        const editor = await CreativeEditorSDK.create('#editor_container', config)
        editorRef.current = editor
        
        editor.addDefaultAssetSources()
        editor.addDemoAssetSources({ sceneMode: 'Video' })
        editor.ui.setBackgroundTrackAssetLibraryEntries(['ly.img.image', 'ly.img.video'])
        editor.feature.enable('ly.img.placeholder', false);
        editor.feature.enable('ly.img.preview', false);
        // Load scene data
        try {
          const response = await fetch(sceneData)
          const sceneString = await response.text()
          await editor.loadFromString(sceneString)
        } catch (error) {
          console.error('Error loading scene:', error)
        }
      }

      initEditor()
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose()
        editorRef.current = null
      }
    }
  }, [isOpen, sceneData])

  if (!isOpen) return null

  return (
    <div 
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        hsl(207 18% 10%) backdrop-blur-xl
        transition-all duration-300 ease-in-out
        ${isOpen ? 'opacity-100 backdrop-blur-xl' : 'opacity-0 backdrop-blur-none pointer-events-none'}
      `}
    >
      <div className="bg-white w-[120vw] max-w-[800px] max-h-[1200px] rounded-lg overflow-hidden">
        <div id="editor_container" className=" w-full h-[calc(90vh-20px)]" />
      </div>
    </div>
  )
}