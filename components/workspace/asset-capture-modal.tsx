'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ImagePlus, QrCode, ScanLine, X } from 'lucide-react'
import { GriffinEyeIcon } from '@/components/griffineye/griffineye-icon'
import { GriffinEyeIntakeModal } from '@/components/workspace/griffineye-intake-modal'
import type { AssetIntakeDraft } from '@/lib/griffineye-intake'
import type { AssetRecord } from '@/lib/workspace-data'

type Mode = 'choose' | 'scan' | 'photo'

type ScanPhase = 'scanning' | 'found' | 'no_match' | 'unsupported'

type DetectedBarcode = {
  rawValue?: string
}

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>
}

declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike
  }
}

function findAssetByScanValue(assets: AssetRecord[], value: string): AssetRecord | null {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null

  return (
    assets.find((asset) => {
      const candidates = [asset.id, asset.serial].filter(Boolean)
      return candidates.some((candidate) => candidate.toLowerCase() === normalized)
    }) ?? null
  )
}

function ScanAssetModal({
  assets,
  onFound,
}: {
  assets: AssetRecord[]
  onFound: (asset: AssetRecord) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const assetsRef = useRef(assets)
  const onFoundRef = useRef(onFound)
  const [phase, setPhase] = useState<ScanPhase>('scanning')
  const [message, setMessage] = useState('Point your camera at a barcode or QR label.')

  assetsRef.current = assets
  onFoundRef.current = onFound

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null
    let detectTimer: number | undefined
    let foundTimer: number | undefined

    async function startScanning() {
      if (typeof window === 'undefined' || !('BarcodeDetector' in window)) {
        setPhase('unsupported')
        setMessage('Barcode scanning is not supported in this browser. Use photo intake instead.')
        return
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        const video = videoRef.current
        if (!video) return

        video.srcObject = stream
        await video.play()

        const Detector = window.BarcodeDetector
        if (!Detector) return
        const detector = new Detector({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8'] })

        detectTimer = window.setInterval(async () => {
          if (cancelled || !video.videoWidth) return

          try {
            const barcodes = await detector.detect(video)
            const rawValue = barcodes[0]?.rawValue
            if (!rawValue) return

            const matched = findAssetByScanValue(assetsRef.current, rawValue)
            if (!matched) {
              window.clearInterval(detectTimer)
              setPhase('no_match')
              setMessage(`Scanned “${rawValue}”, but no matching asset tag or serial was found.`)
              return
            }

            window.clearInterval(detectTimer)
            setPhase('found')
            foundTimer = window.setTimeout(() => onFoundRef.current(matched), 700)
          } catch {
            // Ignore transient detection errors and keep scanning.
          }
        }, 500)
      } catch {
        setPhase('unsupported')
        setMessage('Camera access is required to scan asset labels.')
      }
    }

    void startScanning()

    return () => {
      cancelled = true
      if (detectTimer) window.clearInterval(detectTimer)
      if (foundTimer) window.clearTimeout(foundTimer)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return (
    <div className="scan-modal-body">
      <div className="scan-viewfinder">
        <span className="scan-corner tl" />
        <span className="scan-corner tr" />
        <span className="scan-corner bl" />
        <span className="scan-corner br" />
        {phase === 'scanning' ? (
          <>
            <video ref={videoRef} className="scan-video" playsInline muted />
            <ScanLine size={44} strokeWidth={1.3} />
          </>
        ) : phase === 'found' ? (
          <CheckCircle2 size={44} color="#1E7B34" strokeWidth={1.3} />
        ) : (
          <ScanLine size={44} strokeWidth={1.3} />
        )}
      </div>
      <div className="scan-status">
        {phase === 'scanning' ? (
          <>
            <strong>
              <span className="scan-pulse" />
              Scanning for barcode or QR code...
            </strong>
            Point any phone camera at the asset label.
          </>
        ) : phase === 'found' ? (
          <>
            <strong>Match found</strong>
            Opening asset record...
          </>
        ) : (
          <>
            <strong>{phase === 'no_match' ? 'No matching asset' : 'Scanner unavailable'}</strong>
            {message}
          </>
        )}
      </div>
    </div>
  )
}

export function AssetCaptureModal({
  initialMode = 'choose',
  onClose,
  onPhotoComplete,
  onScanFound,
  onOpenSpreadsheetImport,
  assets,
}: {
  title?: string
  initialMode?: Mode
  onClose: () => void
  onPhotoComplete: (draft: AssetIntakeDraft) => Promise<void>
  onScanFound: (asset: AssetRecord) => void
  onOpenSpreadsheetImport?: () => void
  assets: AssetRecord[]
}) {
  const [mode, setMode] = useState<Mode>(initialMode)

  const eyebrow =
    mode === 'choose' ? 'ADD ASSET' : mode === 'scan' ? 'SCAN ASSET' : 'GRIFFINEYE INTAKE'

  const heading =
    mode === 'choose'
      ? 'How would you like to add this asset?'
      : mode === 'scan'
        ? 'Point your camera at a label'
        : 'Photograph the device'

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="asset-capture-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2 id="asset-capture-title">{heading}</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {mode === 'choose' ? (
          <div className="modal-body">
            <div className="capture-choice-grid">
              <button type="button" className="capture-choice-card" onClick={() => setMode('scan')}>
                <QrCode size={24} />
                <strong>Scan barcode</strong>
                <span>For tagged assets with a barcode or QR label.</span>
              </button>
              <button type="button" className="capture-choice-card" onClick={() => setMode('photo')}>
                <span className="capture-choice-griffineye">
                  <GriffinEyeIcon size={24} />
                </span>
                <strong>Take a photo</strong>
                <span>GriffinEye reads the device and suggests fields for your review.</span>
              </button>
            </div>
            <div className="workflow-note">
              <ImagePlus size={16} />
              <span>Use scan for existing tags. Use a photo for new or untagged equipment.</span>
            </div>
          </div>
        ) : mode === 'scan' ? (
          <>
            <ScanAssetModal
              assets={assets}
              onFound={(asset) => {
                onScanFound(asset)
                onClose()
              }}
            />
            <div className="modal-body" style={{ paddingTop: 0 }}>
              <button type="button" className="button secondary small full-width" onClick={() => setMode('photo')}>
                <GriffinEyeIcon size={15} /> Use photo intake instead
              </button>
            </div>
          </>
        ) : (
          <>
            <GriffinEyeIntakeModal
              onComplete={onPhotoComplete}
              onOpenSpreadsheetImport={onOpenSpreadsheetImport}
            />
            <div className="modal-body" style={{ paddingTop: 0 }}>
              <button type="button" className="button secondary small full-width" onClick={() => setMode('scan')}>
                <QrCode size={15} /> Scan barcode instead
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
