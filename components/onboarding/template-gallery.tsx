'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, Compass, Sparkles, Upload, X } from 'lucide-react'
import { onboardingTemplates, matchTemplateFromPrompt, type OnboardingTemplate } from '@/lib/onboarding-templates'
import type { OnboardingTemplateId } from '@/lib/workspace-data'

export function TemplateGallery({
  onSelectTemplate,
  onUploadClick,
  onSkip,
}: {
  onSelectTemplate: (templateId: OnboardingTemplateId) => void
  onUploadClick: () => void
  onSkip: () => void
}) {
  const [showGriffinEye, setShowGriffinEye] = useState(false)

  return (
    <div className="onboarding-screen">
      <div className="onboarding-inner">
        <div className="onboarding-header">
          <div className="onboarding-brand">
            <Image src="/images/assetgriffin-logo.png" alt="AssetGriffin logo" width={28} height={28} className="brand-mark-image" />
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
            <div className="onboarding-action-icon coral"><Compass size={20} /></div>
            <h2>Build with GriffinEye</h2>
            <p>Describe your ideal setup and let GriffinEye configure your account.</p>
            <button className="button primary small" onClick={() => setShowGriffinEye(true)}><Sparkles size={14} /> Use GriffinEye</button>
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
          onApply={(templateId) => {
            setShowGriffinEye(false)
            onSelectTemplate(templateId)
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

function GriffinEyeModal({ onClose, onApply }: { onClose: () => void; onApply: (templateId: OnboardingTemplateId) => void }) {
  const [prompt, setPrompt] = useState('')

  function handleSubmit() {
    if (!prompt.trim()) return
    const match = matchTemplateFromPrompt(prompt)
    onApply(match.id)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="griffin-eye-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">GRIFFINEYE</span>
            <h2 id="griffin-eye-title">Describe your ideal setup</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
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
            <Compass size={16} />
            <span><strong>GriffinEye matches you to the closest template.</strong> You can fine-tune categories and records after setup.</span>
          </div>
          <button className="button primary full-width" onClick={handleSubmit} disabled={!prompt.trim()}><Check size={16} /> Configure my account</button>
        </div>
      </div>
    </div>
  )
}
