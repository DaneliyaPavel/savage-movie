/**
 * Компонент для загрузки файлов
 */
'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadImage, uploadVideo, uploadImages, type UploadResponse } from '@/lib/api/upload'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onUpload: (url: string) => void
  onMultipleUpload?: (urls: string[]) => void
  accept?: string
  multiple?: boolean
  type?: 'image' | 'video' | 'images'
  className?: string
  existingFiles?: string[]
  onRemove?: (url: string) => void
}

export function FileUpload({
  onUpload,
  onMultipleUpload,
  accept,
  multiple = false,
  type = 'image',
  className,
  existingFiles = [],
  onRemove,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFile = useCallback(async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      let response: UploadResponse | { files: UploadResponse[] }

      if (type === 'images' && multiple) {
        // Множественная загрузка изображений
        const files = Array.from((document.getElementById('file-input') as HTMLInputElement)?.files || [])
        response = await uploadImages(files)
        if (onMultipleUpload && 'files' in response) {
          onMultipleUpload(response.files.map(f => f.url))
        }
      } else if (type === 'video') {
        response = await uploadVideo(file)
        if ('url' in response) {
          onUpload(response.url)
        }
      } else {
        response = await uploadImage(file)
        if ('url' in response) {
          onUpload(response.url)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки файла:', error)
      alert(error instanceof Error ? error.message : 'Ошибка загрузки файла')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [type, multiple, onUpload, onMultipleUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      if (multiple && type === 'images') {
        files.forEach(file => handleFile(file))
      } else {
        handleFile(files[0])
      }
    }
  }, [handleFile, multiple, type])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      if (multiple && type === 'images') {
        files.forEach(file => handleFile(file))
      } else {
        handleFile(files[0])
      }
    }
  }, [handleFile, multiple, type])

  const defaultAccept = type === 'video' 
    ? 'video/mp4,video/quicktime,video/x-msvideo'
    : 'image/jpeg,image/png,image/webp'

  return (
    <div className={cn('space-y-4', className)}>
      {/* Существующие файлы */}
      {existingFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {existingFiles.map((url, index) => (
            <div key={index} className="relative group">
              {type === 'image' || type === 'images' ? (
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-border"
                />
              ) : (
                <div className="w-full h-32 bg-muted rounded-lg border border-border flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">Video</span>
                </div>
              )}
              {onRemove && (
                <button
                  onClick={() => onRemove(url)}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Зона загрузки */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-border',
          isUploading && 'opacity-50 pointer-events-none'
        )}
      >
        <input
          id="file-input"
          type="file"
          accept={accept || defaultAccept}
          multiple={multiple && type === 'images'}
          onChange={handleFileInput}
          className="hidden"
        />
        <label htmlFor="file-input" className="cursor-pointer">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Загрузка...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Перетащите файл{multiple ? 'ы' : ''} сюда или нажмите для выбора
              </p>
              <Button type="button" variant="outline" size="sm">
                Выбрать файл{multiple ? 'ы' : ''}
              </Button>
            </div>
          )}
        </label>
      </div>
    </div>
  )
}
