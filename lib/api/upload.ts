/**
 * API функции для загрузки файлов
 */
import { apiPostForm } from './client'

export interface UploadResponse {
  url: string
  filename: string
  size: number
  content_type: string
}

export interface MultipleUploadResponse {
  files: UploadResponse[]
}

/**
 * Загрузить изображение
 */
export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  return apiPostForm<UploadResponse>('/api/upload/image', formData)
}

/**
 * Загрузить видео
 */
export async function uploadVideo(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  return apiPostForm<UploadResponse>('/api/upload/video', formData)
}

/**
 * Загрузить несколько изображений
 */
export async function uploadImages(files: File[]): Promise<MultipleUploadResponse> {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })
  return apiPostForm<MultipleUploadResponse>('/api/upload/images', formData)
}
