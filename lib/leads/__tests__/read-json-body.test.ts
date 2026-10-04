// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { readJsonBody } from '../read-json-body'

const LIMIT = 1024

function jsonRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/test', { method: 'POST', body, headers })
}

/**
 * Тело без Content-Length (как chunked): поток отдаёт куски по chunkSize байт
 * и считает, сколько у него реально забрали.
 */
function chunkedRequest(
  chunkSize: number,
  totalChunks: number,
  headers: Record<string, string> = {}
) {
  const state = { pulled: 0, cancelled: false }
  const chunk = new Uint8Array(chunkSize).fill(0x20)
  // highWaterMark: 0 — поток отдаёт кусок только по запросу читателя, без упреждающей подкачки
  const stream = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        if (state.pulled >= totalChunks) {
          controller.close()
          return
        }
        state.pulled += 1
        controller.enqueue(chunk)
      },
      cancel() {
        state.cancelled = true
      },
    },
    { highWaterMark: 0 }
  )
  const request = new Request('http://localhost/api/test', {
    method: 'POST',
    headers,
    body: stream,
    duplex: 'half',
  } as RequestInit & { duplex: 'half' })
  return { request, state }
}

describe('readJsonBody', () => {
  it('разбирает обычный JSON-объект', async () => {
    const result = await readJsonBody(jsonRequest('{"name":"Иван","consent":true}'), LIMIT)
    expect(result).toEqual({ ok: true, body: { name: 'Иван', consent: true } })
  })

  it('пускает тело ровно в размер потолка', async () => {
    const filler = 'x'.repeat(LIMIT - '{"a":""}'.length)
    const body = `{"a":"${filler}"}`
    expect(new TextEncoder().encode(body).byteLength).toBe(LIMIT)
    const result = await readJsonBody(jsonRequest(body), LIMIT)
    expect(result.ok).toBe(true)
  })

  it('считает байты, а не символы: кириллица занимает по два', async () => {
    const body = JSON.stringify({ comment: 'я'.repeat(LIMIT) })
    const result = await readJsonBody(jsonRequest(body), LIMIT)
    expect(result).toMatchObject({ ok: false, status: 413 })
  })

  it('большой Content-Length даёт 413, не читая тело', async () => {
    const { request, state } = chunkedRequest(64, 4, {
      'content-length': String(100 * 1024 * 1024),
    })
    const result = await readJsonBody(request, LIMIT)

    expect(result).toMatchObject({ ok: false, status: 413 })
    expect(state.pulled).toBe(0)
  })

  it('без Content-Length (chunked) обрывает чтение, как только набралось больше потолка', async () => {
    // Поток на 100 МБ: если бы он читался целиком, pulled дошёл бы до 6400
    const { request, state } = chunkedRequest(16 * 1024, 6400)
    expect(request.headers.get('content-length')).toBeNull()

    const result = await readJsonBody(request, LIMIT)

    expect(result).toMatchObject({ ok: false, status: 413 })
    expect(state.pulled).toBeLessThanOrEqual(2)
    expect(state.cancelled).toBe(true)
  })

  it('заниженный Content-Length не обманывает счётчик при чтении', async () => {
    const { request, state } = chunkedRequest(16 * 1024, 6400, { 'content-length': '10' })

    const result = await readJsonBody(request, LIMIT)

    expect(result).toMatchObject({ ok: false, status: 413 })
    expect(state.pulled).toBeLessThanOrEqual(2)
  })

  it('непонятный Content-Length не мешает: размер всё равно считается при чтении', async () => {
    const ok = await readJsonBody(jsonRequest('{"a":1}', { 'content-length': 'abc' }), LIMIT)
    expect(ok).toEqual({ ok: true, body: { a: 1 } })
  })

  it.each([
    ['пустое тело', ''],
    ['битый JSON', '{"name": '],
    ['null', 'null'],
    ['число', '42'],
    ['строка', '"text"'],
    ['массив', '[1,2,3]'],
  ])('%s: 400, а не исключение', async (_label, body) => {
    const result = await readJsonBody(jsonRequest(body), LIMIT)
    expect(result).toEqual({ ok: false, status: 400, error: expect.any(String) })
  })

  it('запрос без тела даёт 400', async () => {
    const result = await readJsonBody(
      new Request('http://localhost/api/test', { method: 'POST' }),
      LIMIT
    )
    expect(result).toMatchObject({ ok: false, status: 400 })
  })

  it('обрыв соединения посреди тела даёт 400', async () => {
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.error(new Error('socket hang up'))
      },
    })
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      body: stream,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' })

    const result = await readJsonBody(request, LIMIT)
    expect(result).toMatchObject({ ok: false, status: 400 })
  })
})
