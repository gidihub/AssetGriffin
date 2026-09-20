#!/usr/bin/env node
/**
 * Regenerate favicon variants from public/images/assetgriffin-logo.png
 * Run: python3 scripts/generate-favicon-variants.py
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const py = spawnSync('python3', [path.join(scriptDir, 'generate-favicon-variants.py')], {
  stdio: 'inherit',
})
process.exit(py.status ?? 1)
