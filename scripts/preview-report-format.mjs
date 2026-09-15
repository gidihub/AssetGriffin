/**
 * Renders a sample CSV + PDF straight from the report builders so currency and
 * date formatting can be eyeballed without spending an AI credit.
 *
 *   pnpm tsx scripts/preview-report-format.mjs
 */
import { writeFileSync } from 'node:fs'

import { buildCsv, buildPdf } from '../lib/griffineye-agent/reports.ts'

const table = {
  columns: [
    { key: 'asset_tag', header: 'Asset tag' },
    { key: 'name', header: 'Name' },
    { key: 'category', header: 'Category' },
    { key: 'purchase_date', header: 'Purchased' },
    { key: 'value', header: 'Value' },
  ],
  rows: [
    { asset_tag: 'NST-1000', name: 'Ames 948-C Dolly', category: 'Equipment', purchase_date: '2024-03-15', value: 2980 },
    { asset_tag: 'NST-1001', name: 'Dell Latitude 5540', category: 'Laptop', purchase_date: '2025-11-02', value: 210 },
    { asset_tag: 'NST-1002', name: 'Genie S-65 Boom Lift', category: 'Equipment', purchase_date: '2023-07-21', value: 1250000 },
    { asset_tag: 'NST-1003', name: 'Unpriced spare', category: 'Equipment', purchase_date: null, value: null },
  ],
}

const meta = {
  title: 'Equipment purchase values',
  question: 'give me a PDF of equipment with purchase values',
  organizationName: 'Northstar Utilities',
}

writeFileSync('/tmp/report-preview.csv', buildCsv(table))
writeFileSync('/tmp/report-preview.pdf', Buffer.from(await buildPdf(table, meta)))

console.log('CSV:\n' + buildCsv(table))
console.log('\nPDF written to /tmp/report-preview.pdf')
