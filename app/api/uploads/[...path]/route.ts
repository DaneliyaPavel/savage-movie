/**
 * API route для обслуживания загруженных файлов
 */
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = join(process.cwd(), 'backend', 'uploads', ...params.path)
    
    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 })
    }

    const file = await readFile(filePath)
    const ext = params.path[params.path.length - 1].split('.').pop()?.toLowerCase()
    
    const contentType: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
    }

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType[ext || ''] || 'application/octet-stream',
      },
    })
  } catch (error) {
    console.error('Ошибка чтения файла:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
