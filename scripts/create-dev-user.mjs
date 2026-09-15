/**
 * Create a confirmed dev user without sending email (bypasses Supabase email rate limits).
 *
 * Usage:
 *   node --env-file=.env.local scripts/create-dev-user.mjs you@gmail.com
 *
 * Password is read from a hidden prompt (or DEV_USER_PASSWORD when non-interactive).
 */
import { stdin as input, stdout as output } from 'node:process'

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2]

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

if (!email) {
  console.error('Usage: node --env-file=.env.local scripts/create-dev-user.mjs <email>')
  process.exit(1)
}

function readPasswordHidden(prompt) {
  return new Promise((resolve) => {
    output.write(prompt)
    input.setRawMode(true)
    input.resume()
    input.setEncoding('utf8')

    let password = ''
    const finish = (value) => {
      input.setRawMode(false)
      input.pause()
      input.removeListener('data', onData)
      output.write('\n')
      resolve(value)
    }

    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\u0003') {
          input.setRawMode(false)
          input.pause()
          input.removeListener('data', onData)
          output.write('\n')
          process.exit(130)
        }

        if (char === '\r' || char === '\n') {
          finish(password)
          return
        }

        if (char === '\u007f') {
          if (password.length > 0) {
            password = password.slice(0, -1)
            output.write('\b \b')
          }
          continue
        }

        password += char
        output.write('*')
      }
    }

    input.on('data', onData)
  })
}

async function resolvePassword() {
  if (process.env.DEV_USER_PASSWORD) {
    return process.env.DEV_USER_PASSWORD
  }

  if (!input.isTTY) {
    console.error('Set DEV_USER_PASSWORD when running non-interactively.')
    process.exit(1)
  }

  const password = await readPasswordHidden('Password: ')
  const confirm = await readPasswordHidden('Confirm password: ')

  if (password !== confirm) {
    console.error('Passwords do not match.')
    process.exit(1)
  }

  return password
}

const password = await resolvePassword()

if (password.length < 6) {
  console.error('Password must be at least 6 characters.')
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})

if (error) {
  console.error('Failed to create user:', error.message)
  process.exit(1)
}

const userId = data.user?.id
if (!userId) {
  console.error('User was not returned from Supabase.')
  process.exit(1)
}

const { data: profile, error: profileError } = await admin
  .from('profiles')
  .select('organization_id, email')
  .eq('id', userId)
  .maybeSingle()

if (profileError) {
  console.error('User created but profile lookup failed:', profileError.message)
  process.exit(1)
}

console.log('Dev user ready.')
console.log(`  Email:    ${email}`)
console.log(`  User ID:  ${userId}`)
if (profile) {
  console.log(`  Org ID:   ${profile.organization_id}`)
}
console.log('\nSign in at http://localhost:3000/login')
