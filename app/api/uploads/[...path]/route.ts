/**
 * API route для отдачи загруженных файлов
 * Отдает файлы из backend/uploads через Next.js
 */
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import { resolveSafeChildPath } from '@/lib/path-utils'

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'backend', 'uploads')
const UPLOAD_DIR_RESOLVED = path.resolve(UPLOAD_DIR)

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params
    const filePath = resolveSafeChildPath(UPLOAD_DIR_RESOLVED, pathArray)
    
    // Защита от path traversal
    if (!filePath) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Проверяем, что файл существует
    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 })
    }
    
    // Читаем файл
    const fileBuffer = await readFile(filePath)
    
    // Определяем content-type по расширению
    const ext = filePath.split('.').pop()?.toLowerCase()
    const contentType = getContentType(ext || '')
    
    // Возвращаем файл с правильными заголовками
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

function getContentType(ext: string): string {
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    pdf: 'application/pdf',
  }
  return types[ext] || 'application/octet-stream'
}
