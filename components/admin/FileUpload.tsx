/**
 * Компонент для загрузки файлов
 */
'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadImage, uploadVideo, uploadImages } from '@/lib/api/upload'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onUpload?: (url: string) => void
  onMultipleUpload?: (urls: string[]) => void
  accept?: string
  multiple?: boolean
  type?: 'image' | 'video' | 'images'
  className?: string
  existingFiles?: string[]
  onRemove?: (url: string) => void
}

function ExistingFilePreviewImage({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false)

  return (
    <Image
      src={hasError ? '/placeholder.svg' : src}
      alt={alt}
      width={640}
      height={256}
      className="w-full h-32 object-cover rounded-lg border border-border"
      onError={() => setHasError(true)}
    />
  )
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

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return
    const firstFile = files[0]
    if (!firstFile) return
    
    setIsUploading(true)
    setUploadProgress(0)

    try {
      if (type === 'images' && multiple && files.length > 1) {
        // Множественная загрузка изображений - все сразу пачкой
        const response = await uploadImages(files)
        if (onMultipleUpload && 'files' in response) {
          onMultipleUpload(response.files.map(f => f.url))
        }
      } else if (type === 'images' && multiple && files.length === 1) {
        // Одно изображение при множественной загрузке
        const response = await uploadImage(firstFile)
        if (onMultipleUpload && 'url' in response) {
          onMultipleUpload([response.url])
        } else if (onUpload && 'url' in response) {
          onUpload(response.url)
        }
      } else if (type === 'video') {
        // Видео - только один файл
        const response = await uploadVideo(firstFile)
        if ('url' in response) {
          if (onUpload) onUpload(response.url)
          else if (onMultipleUpload) onMultipleUpload([response.url])
        }
      } else {
        // Одно изображение
        const response = await uploadImage(firstFile)
        if ('url' in response) {
          if (onUpload) onUpload(response.url)
          else if (onMultipleUpload) onMultipleUpload([response.url])
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
      // Фильтруем только изображения если type === 'images'
      const filteredFiles = type === 'images' 
        ? files.filter(f => f.type.startsWith('image/'))
        : files
      
      if (filteredFiles.length > 0) {
        handleFiles(filteredFiles)
      }
    }
  }, [handleFiles, type])

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
      // Фильтруем только изображения если type === 'images'
      const filteredFiles = type === 'images' 
        ? files.filter(f => f.type.startsWith('image/'))
        : files
      
      if (filteredFiles.length > 0) {
        handleFiles(filteredFiles)
      }
    }
    
    // Сбрасываем input чтобы можно было загрузить те же файлы снова
    e.target.value = ''
  }, [handleFiles, type])

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
                <ExistingFilePreviewImage
                  src={url.startsWith('http') ? url : url.startsWith('/') ? url : `/${url}`}
                  alt={`Upload ${index + 1}`}
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
              <p className="text-sm text-muted-foreground">Загрузка на сервер...</p>
              {uploadProgress > 0 && (
                <div className="w-full max-w-xs">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {multiple && type === 'images' 
                  ? 'Перетащите до 5 изображений сюда или нажмите для выбора'
                  : `Перетащите файл${multiple ? 'ы' : ''} сюда или нажмите для выбора`}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {multiple && type === 'images' 
                  ? 'Можно выбрать несколько файлов сразу (Ctrl/Cmd + клик) или перетащить папку'
                  : 'Файлы загружаются на сервер и сохраняются локально'}
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
