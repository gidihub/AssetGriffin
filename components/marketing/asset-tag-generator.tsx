'use client'

import { useEffect, useState } from 'react'
import { Printer, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

const DEFAULT_TAG_CODE = 'AGF-10482'

function randomTagCode() {
  const digits = Math.floor(10000 + Math.random() * 90000)
  return `AGF-${digits}`
}

export function AssetTagGenerator() {
  const [assetName, setAssetName] = useState('Dell Latitude 5440')
  const [category, setCategory] = useState('IT Equipment')
  const [tagCode, setTagCode] = useState(DEFAULT_TAG_CODE)

  // Generate the initial random code only after mount, so the server-rendered
  // HTML and the first client render match and hydration doesn't fail.
  useEffect(() => {
    setTagCode(randomTagCode())
  }, [])

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base text-foreground">Asset details</h2>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">Asset name</span>
            <input
              type="text"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">Category</span>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">Tag code</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagCode}
                onChange={(e) => setTagCode(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm text-foreground outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setTagCode(randomTagCode())}
                className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary"
                aria-label="Generate a new tag code"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </label>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-border bg-secondary p-6">
        <div id="asset-tag-preview" className="w-full max-w-[280px] rounded-xl border-2 border-foreground bg-card p-5 text-center shadow-sm">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-primary">AssetGriffin</p>
          <p className="mt-3 text-sm leading-tight text-foreground">{assetName || 'Untitled asset'}</p>
          <p className="mt-1 text-xs text-muted-foreground">{category || 'Uncategorized'}</p>
          <p className="mt-4 font-mono text-lg tracking-wider text-foreground">{tagCode}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-lg border-border text-sm font-medium"
          onClick={() => window.print()}
        >
          <Printer size={16} /> Print tag
        </Button>
      </div>
    </div>
  )
}
