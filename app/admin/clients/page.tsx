'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/admin/DataTable'
import { getClients, deleteClient, type Client } from '@/lib/api/clients'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Link from 'next/link'

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  useEffect(() => { loadClients() }, [])

  const loadClients = async () => {
    try {
      setClients(await getClients())
    } catch (error) {
      console.error('Ошибка загрузки клиентов:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!clientToDelete) return
    try {
      await deleteClient(clientToDelete.id)
      setClients(clients.filter(c => c.id !== clientToDelete.id))
      setDeleteDialogOpen(false)
      setClientToDelete(null)
    } catch (error) {
      alert('Ошибка удаления клиента')
    }
  }

  const columns = [
    { key: 'name', label: 'Название' },
    { key: 'description', label: 'Описание', render: (c: Client) => c.description || '-' },
    { key: 'order', label: 'Порядок' },
  ]

  if (loading) return <div className="p-8">Загрузка...</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-3xl font-bold mb-2">Клиенты</h1><p className="text-muted-foreground">Управление клиентами</p></div>
        <Link href="/admin/clients/new"><Button><Plus className="w-4 h-4 mr-2" />Добавить</Button></Link>
      </div>
      <DataTable data={clients} columns={columns} onEdit={(c) => router.push(`/admin/clients/${c.id}/edit`)} onDelete={(c) => { setClientToDelete(c); setDeleteDialogOpen(true) }} getRowId={(c) => c.id} />
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Удалить клиента?</DialogTitle><DialogDescription>Вы уверены? Это действие нельзя отменить.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Отмена</Button><Button variant="destructive" onClick={handleDelete}>Удалить</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
