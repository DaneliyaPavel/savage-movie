/**
 * Компонент для управления массивом строк
 */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'

interface ArrayInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  label?: string
}

export function ArrayInput({
  value,
  onChange,
  placeholder = 'Добавить элемент',
  label,
}: ArrayInputProps) {
  const [newItem, setNewItem] = useState('')

  const addItem = () => {
    if (newItem.trim()) {
      onChange([...value, newItem.trim()])
      setNewItem('')
    }
  }

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, newValue: string) => {
    const updated = [...value]
    updated[index] = newValue
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder={placeholder}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addItem()
              }
            }}
            placeholder={placeholder}
          />
          <Button type="button" variant="outline" onClick={addItem}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
