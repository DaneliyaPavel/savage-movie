/**
 * API функции для загрузки файлов
 */
import { apiPost } from './client'

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

  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('access_token') 
    : null

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const response = await fetch(`${API_URL}/api/upload/image`, {
    method: 'POST',
    headers: token ? {
      'Authorization': `Bearer ${token}`,
    } : {},
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`,
    }))
    throw new Error(error.detail || 'Ошибка загрузки файла')
  }

  return response.json()
}

/**
 * Загрузить видео
 */
export async function uploadVideo(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('access_token') 
    : null

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const response = await fetch(`${API_URL}/api/upload/video`, {
    method: 'POST',
    headers: token ? {
      'Authorization': `Bearer ${token}`,
    } : {},
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`,
    }))
    throw new Error(error.detail || 'Ошибка загрузки файла')
  }

  return response.json()
}

/**
 * Загрузить несколько изображений
 */
export async function uploadImages(files: File[]): Promise<MultipleUploadResponse> {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })

  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('access_token') 
    : null

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const response = await fetch(`${API_URL}/api/upload/images`, {
    method: 'POST',
    headers: token ? {
      'Authorization': `Bearer ${token}`,
    } : {},
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`,
    }))
    throw new Error(error.detail || 'Ошибка загрузки файлов')
  }

  return response.json()
}
