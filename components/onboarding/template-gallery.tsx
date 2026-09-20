'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ASSET_GRIFFIN_LOGO } from '@/lib/brand-assets'
import { Check, Upload, X } from 'lucide-react'
import { GriffinEyeIcon } from '@/components/griffineye/griffineye-icon'
import { GriffinEyeThinking } from '@/components/griffineye/griffineye-thinking'
import { onboardingTemplates, matchTemplateFromPrompt, type OnboardingTemplate } from '@/lib/onboarding-templates'
import type { OnboardingTemplateId } from '@/lib/onboarding-templates'

export function TemplateGallery({
  onSelectTemplate,
  onGriffinEyeApply,
  onUploadClick,
  onSkip,
}: {
  onSelectTemplate: (templateId: OnboardingTemplateId) => void
  onGriffinEyeApply: (templateId: OnboardingTemplateId, templateTitle: string) => void
  onUploadClick: () => void
  onSkip: () => void
}) {
  const [showGriffinEye, setShowGriffinEye] = useState(false)

  return (
    <div className="onboarding-screen">
      <div className="onboarding-inner">
        <div className="onboarding-header">
          <div className="onboarding-brand">
            <Image src={ASSET_GRIFFIN_LOGO} alt="AssetGriffin logo" width={28} height={28} className="brand-mark-image" />
            <span>assetgriffin</span>
          </div>
          <button className="text-button" onClick={onSkip}>Skip for now</button>
        </div>

        <div className="onboarding-heading">
          <h1>Welcome to AssetGriffin</h1>
          <p>Choose a starting point for your workspace. You can change this at any time from Settings.</p>
        </div>

        <div className="onboarding-action-cards">
          <div className="onboarding-action-card">
            <div className="onboarding-action-icon coral"><GriffinEyeIcon size={20} /></div>
            <h2>Build with GriffinEye</h2>
            <p>Describe your ideal setup and let GriffinEye configure your account.</p>
            <button className="button primary small" onClick={() => setShowGriffinEye(true)}><GriffinEyeIcon size={14} /> Use GriffinEye</button>
          </div>
          <div className="onboarding-action-card">
            <div className="onboarding-action-icon teal"><Upload size={20} /></div>
            <h2>Use your own data</h2>
            <p>Upload a spreadsheet to build your account.</p>
            <button className="button secondary small" onClick={onUploadClick}><Upload size={14} /> Upload</button>
          </div>
        </div>

        <div className="onboarding-templates-heading">
          <h2>Or start from a template</h2>
          <p>Pre-configured categories and sample records tailored to your industry.</p>
        </div>

        <div className="onboarding-template-grid">
          {onboardingTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} onUse={() => onSelectTemplate(template.id)} />
          ))}
        </div>
      </div>

      {showGriffinEye && (
        <GriffinEyeModal
          onClose={() => setShowGriffinEye(false)}
          onApply={(templateId, templateTitle) => {
            setShowGriffinEye(false)
            onGriffinEyeApply(templateId, templateTitle)
          }}
        />
      )}
    </div>
  )
}

function TemplateCard({ template, onUse }: { template: OnboardingTemplate; onUse: () => void }) {
  return (
    <div className="onboarding-template-card">
      <div className="onboarding-template-image">
        <Image src={template.image} alt={`${template.title} template preview`} fill sizes="280px" style={{ objectFit: 'cover' }} />
      </div>
      <div className="onboarding-template-body">
        <h3>{template.title}</h3>
        <p>{template.description}</p>
        <div className="onboarding-template-tags">
          {template.tags.map((tag) => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
        </div>
        <button className="button secondary small onboarding-template-cta" onClick={onUse}>Use this template</button>
      </div>
    </div>
  )
}

function GriffinEyeModal({
  onClose,
  onApply,
}: {
  onClose: () => void
  onApply: (templateId: OnboardingTemplateId, templateTitle: string) => void
}) {
  const [prompt, setPrompt] = useState('')
  const [thinking, setThinking] = useState(false)
  const cancelledRef = useRef(false)
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    cancelledRef.current = false
    return () => {
      cancelledRef.current = true
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current)
    }
  }, [])

  function handleClose() {
    cancelledRef.current = true
    if (submitTimerRef.current) clearTimeout(submitTimerRef.current)
    setThinking(false)
    onClose()
  }

  async function handleSubmit() {
    if (!prompt.trim() || thinking) return
    setThinking(true)
    await new Promise<void>((resolve) => {
      submitTimerRef.current = setTimeout(resolve, 1200 + Math.random() * 800)
    })
    if (cancelledRef.current) return
    const match = matchTemplateFromPrompt(prompt)
    onApply(match.id, match.title)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && handleClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="griffin-eye-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">GRIFFINEYE</span>
            <h2 id="griffin-eye-title">Describe your ideal setup</h2>
          </div>
          <button className="close-button" onClick={handleClose} aria-label="Close dialog"><X size={18} /></button>
        </div>
        <div className="modal-body">
          <label className="griffin-eye-label">
            What are you tracking, and who uses it?
            <textarea
              className="griffin-eye-textarea"
              rows={4}
              placeholder="e.g. We're a mid-size fire department tracking apparatus, SCBA gear, and grant-funded equipment across two stations."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </label>
          <div className="workflow-note">
            <GriffinEyeIcon size={16} />
            <span><strong>GriffinEye matches you to the closest template.</strong> You can fine-tune categories and records after setup.</span>
          </div>
          {thinking && <GriffinEyeThinking message="GriffinEye is matching your setup…" />}
          <button className="button primary full-width" onClick={handleSubmit} disabled={!prompt.trim() || thinking}>
            <Check size={16} /> Configure my account
          </button>
        </div>
      </div>
    </div>
  )
}
