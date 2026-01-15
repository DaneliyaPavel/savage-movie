/**
 * Компонент таблицы данных с поиском и действиями
 */
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Search } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  searchable?: boolean
  searchPlaceholder?: string
  getRowId: (item: T) => string
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onEdit,
  onDelete,
  searchable = true,
  searchPlaceholder = 'Поиск...',
  getRowId,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredData = searchable
    ? data.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : data

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)}>{column.label}</TableHead>
              ))}
              {(onEdit || onDelete) && <TableHead className="w-[100px]">Действия</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="text-center text-muted-foreground">
                  Нет данных
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={getRowId(item)}>
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {column.render
                        ? column.render(item)
                        : String(item[column.key as keyof T] ?? '')}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete) && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(item)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(item)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
