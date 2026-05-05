/**
 * Триггер ревалидации Next.js ISR-кэша из админки.
 * Вызывать после успешной мутации (create/update/delete) сущностей,
 * которые отображаются на публичных страницах с `export const revalidate`.
 */
export async function revalidateAdminPaths(paths?: string[]): Promise<void> {
  try {
    await fetch('/api/admin/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paths && paths.length > 0 ? { paths } : {}),
    })
  } catch {
    // Не блокируем UX, если ревалидация не прошла — кэш всё равно
    // обновится по таймеру через `revalidate` секунд.
  }
}
