import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-xl font-semibold">Sign in to AssetGriffin</h1>
        <p className="text-sm text-muted-foreground">
          Use your email and password, or create a new account below.
        </p>
      </div>

      {params.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {params.error}
        </p>
      )}
      {params.message && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">{params.message}</p>
      )}

      <form className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </label>

        <div className="mt-2 flex gap-2">
          <button
            formAction={login}
            className="h-8 flex-1 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Log in
          </button>
          <button
            formAction={signup}
            className="h-8 flex-1 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  )
}
