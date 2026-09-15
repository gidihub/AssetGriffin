'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { login, signup } from '@/app/login/actions'

type LoginFormProps = {
  redirect?: string
  error?: string
  message?: string
  initialMode?: 'signin' | 'signup'
}

export function LoginForm({ redirect, error, message, initialMode = 'signin' }: LoginFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [showPassword, setShowPassword] = useState(false)

  const isSignup = mode === 'signup'

  return (
    <>
      <div className="auth-card-header">
        <h1 className="auth-card-title">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-card-subtitle">
          {isSignup ? 'Fill in your details to get started' : 'Sign in to your workspace'}
        </p>
      </div>

      {error && (
        <p className="auth-alert auth-alert-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="auth-alert auth-alert-info" role="status">
          {message}
        </p>
      )}

      <form className="auth-form">
        {redirect && <input type="hidden" name="redirect" value={redirect} />}

        <label className="auth-field">
          <span className="auth-label">Work email</span>
          <span className="auth-input-wrap">
            <Mail size={16} className="auth-input-icon" aria-hidden />
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              className="auth-input"
            />
          </span>
        </label>

        <label className="auth-field">
          <span className="auth-label">Password</span>
          <span className="auth-input-wrap">
            <Lock size={16} className="auth-input-icon" aria-hidden />
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder={isSignup ? 'Min. 6 characters' : '••••••••'}
              minLength={6}
              className="auth-input auth-input-password"
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
        </label>

        {isSignup ? (
          <button type="submit" formAction={signup} className="auth-submit">
            Create account
          </button>
        ) : (
          <button type="submit" formAction={login} className="auth-submit">
            Sign in
          </button>
        )}

        <p className="auth-footer">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <button type="button" className="auth-footer-link" onClick={() => setMode('signin')}>
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <button type="button" className="auth-footer-link" onClick={() => setMode('signup')}>
                Create one
              </button>
            </>
          )}
        </p>
      </form>
    </>
  )
}
