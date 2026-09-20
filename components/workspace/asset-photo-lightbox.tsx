'use client'

import { useState } from 'react'
import { X, ZoomIn, ZoomOut } from 'lucide-react'
import { useAccessibleDialog } from '@/lib/use-accessible-dialog'

export function AssetPhotoLightbox({
  src,
  alt,
  onClose,
}: {
  src: string
  alt: string
  onClose: () => void
}) {
  const [zoomed, setZoomed] = useState(false)
  const dialogRef = useAccessibleDialog(onClose)

  return (
    <div
      className="modal-backdrop asset-photo-lightbox-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        className="asset-photo-lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="Photo preview"
        tabIndex={-1}
      >
        <div className="asset-photo-lightbox-toolbar">
          <button
            type="button"
            className="asset-photo-lightbox-zoom"
            aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
            onClick={() => setZoomed((current) => !current)}
          >
            {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
          </button>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close photo preview">
            <X size={18} />
          </button>
        </div>
        <div className={`asset-photo-lightbox-stage${zoomed ? ' is-zoomed' : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} />
        </div>
      </div>
    </div>
  )
}
