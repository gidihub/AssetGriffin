'use client'

import { GriffinEyeUsageIndicator } from '@/components/workspace/griffineye-usage-indicator'
import { GRIFFIN_SCAN_OVERAGE_RATE_USD } from '@/lib/griffin-scan-allowances'

export function GriffinBillingCredits() {
  return (
    <div className="settings-card" style={{ marginTop: 18 }}>
      <div className="settings-card-header">
        <div>
          <h2>GriffinEye scans</h2>
          <p>
            Photo scans, assistant questions, and spreadsheet extraction share one monthly allowance.
            Paid plans continue at ${GRIFFIN_SCAN_OVERAGE_RATE_USD.toFixed(2)} per scan after the included amount.
          </p>
        </div>
      </div>
      <div className="settings-card-body">
        <GriffinEyeUsageIndicator showOverage />
      </div>
    </div>
  )
}
