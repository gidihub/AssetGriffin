import Image from 'next/image'
import { LoginForm } from '@/components/auth/login-form'
import { LoginPromoCarousel } from '@/components/auth/login-promo-carousel'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; redirect?: string; mode?: string }>
}) {
  const params = await searchParams
  const initialMode = params.mode === 'signup' ? 'signup' : 'signin'

  return (
    <div className="auth-screen">
      <div className="auth-layout">
        <div className="auth-panel-form">
          <div className="auth-screen-inner">
            <header className="auth-brand">
              <div className="auth-brand-mark">
                <Image
                  src="/images/assetgriffin-logo.png"
                  alt=""
                  width={40}
                  height={40}
                  className="auth-brand-logo"
                />
              </div>
              <p className="auth-brand-name">AssetGriffin</p>
              <p className="auth-brand-tagline">Asset tracking that scales with you</p>
            </header>

            <div className="auth-card">
              <LoginForm
                redirect={params.redirect}
                error={params.error}
                message={params.message}
                initialMode={initialMode}
              />
            </div>
          </div>
        </div>

        <aside className="auth-panel-promo" aria-label="Product highlights">
          <div className="auth-panel-promo-glow" aria-hidden />
          <LoginPromoCarousel />
        </aside>
      </div>
    </div>
  )
}
