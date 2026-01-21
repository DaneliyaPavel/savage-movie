/**
 * Filter Chips в премиум стиле Freshman.tv
 * Минималистичные чипы для фильтрации проектов
 */
'use client'

import { motion } from 'framer-motion'

interface FilterChipProps {
  label: string
  isActive: boolean
  onClick: () => void
}

export function FilterChip({ label, isActive, onClick }: FilterChipProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative px-4 py-2 text-sm md:text-base font-medium transition-colors"
    >
      <span className={`relative z-10 ${isActive ? 'text-[#FFFFFF]' : 'text-[#FFFFFF]/60'}`}>
        {label}
      </span>
      {/* Подчеркивание для активного состояния */}
      {isActive && (
        <motion.div
          layoutId="activeFilter"
          className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#ff2936]"
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      {/* Hover подчеркивание */}
      {!isActive && (
        <motion.div
          className="absolute bottom-0 left-0 h-[1px] bg-[#FFFFFF]/30"
          initial={{ width: 0 }}
          whileHover={{ width: '100%' }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  )
}

interface FilterChipsProps {
  filters: { value: string; label: string }[]
  activeFilter: string
  onFilterChange: (value: string) => void
}

export function FilterChips({ filters, activeFilter, onFilterChange }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 md:gap-4 items-center">
      {filters.map((filter) => (
        <FilterChip
          key={filter.value}
          label={filter.label}
          isActive={activeFilter === filter.value}
          onClick={() => onFilterChange(filter.value)}
        />
      ))}
    </div>
  )
}
