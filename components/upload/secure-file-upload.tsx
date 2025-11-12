'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface SecureFileUploadProps {
  acceptedTypes: string[]
  maxSizeMB: number
  onUploadComplete: (fileId: string) => void
  category: 'documents' | 'images'
  className?: string
}

/**
 * Componente de upload de archivos seguro
 *
 * Características de seguridad:
 * - Validación de tipo MIME del lado del cliente
 * - Validación de tamaño del lado del cliente
 * - Información visual de seguridad
 * - Progress bar durante upload
 * - Manejo de errores
 */
export function SecureFileUpload({
  acceptedTypes,
  maxSizeMB,
  onUploadComplete,
  category,
  className = '',
}: SecureFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return

    // Validaciones del lado del cliente
    const maxSizeBytes = maxSizeMB * 1024 * 1024

    if (file.size > maxSizeBytes) {
      toast.error(`El archivo es demasiado grande. Máximo: ${maxSizeMB} MB`)
      return
    }

    if (!acceptedTypes.includes(file.type)) {
      toast.error(
        `Tipo de archivo no permitido. Solo: ${acceptedTypes.join(', ')}`
      )
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('category', category)

      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/upload/documento', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al subir archivo')
      }

      toast.success('Archivo subido exitosamente')
      onUploadComplete(result.documento.id)

      // Limpiar
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al subir archivo')
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />

        {!selectedFile ? (
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-12 h-12 text-gray-400 mb-3"
            >
              <path
                fillRule="evenodd"
                d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm font-medium mb-1">
              Haz clic para seleccionar un archivo
            </p>
            <p className="text-xs text-gray-500">
              Máximo {maxSizeMB} MB • {acceptedTypes.join(', ')}
            </p>
          </label>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8 text-primary"
              >
                <path
                  fillRule="evenodd"
                  d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z"
                  clipRule="evenodd"
                />
                <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            {isUploading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-gray-500">Subiendo... {progress}%</p>
              </div>
            )}

            <div className="flex space-x-2 justify-center">
              <Button onClick={handleUpload} disabled={isUploading} size="sm">
                {isUploading ? 'Subiendo...' : 'Subir Archivo'}
              </Button>
              <Button
                onClick={() => {
                  setSelectedFile(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                variant="outline"
                size="sm"
                disabled={isUploading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Información de seguridad */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-800 dark:text-blue-200 flex items-start">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5"
          >
            <path
              fillRule="evenodd"
              d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            Todos los archivos son validados y escaneados antes de guardarse. Se
            genera un hash SHA-256 para verificar la integridad.
          </span>
        </p>
      </div>
    </div>
  )
}
