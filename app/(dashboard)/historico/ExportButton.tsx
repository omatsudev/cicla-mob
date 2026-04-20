'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { exportCsvAction } from '@/app/(dashboard)/historico/actions'

export function ExportButton() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleExport() {
    setIsLoading(true)
    const result = await exportCsvAction()

    if (result.csv) {
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cicla-mob-historico-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }

    setIsLoading(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={isLoading}
      className="flex items-center gap-1.5 text-xs text-rose-600 border border-rose-200 rounded-xl px-3 py-2 hover:bg-rose-50 transition disabled:opacity-60"
    >
      <Download size={14} />
      {isLoading ? 'Exportando…' : 'Exportar CSV'}
    </button>
  )
}
