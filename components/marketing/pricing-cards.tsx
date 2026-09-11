"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import {
  ANNUAL_DISCOUNT_PERCENT,
  currencies,
  flagEmoji,
  formatCurrencyAmount,
  getCountryName,
  getCurrency,
  getDefaultCurrencyForCountry,
  getPriceForCountry,
  type BillingPeriod,
  type PlanKey,
} from "@/lib/pricing-data"

interface StaticTier {
  key: "free" | "enterprise"
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  highlighted: boolean
}

const freeTier: StaticTier = {
  key: "free",
  name: "Free",
  price: "$0",
  period: "forever",
  description: "Up to 250 assets, unlimited users",
  features: ["Up to 250 assets", "Unlimited users", "Mobile scanning", "Basic reporting"],
  cta: "Start free",
  highlighted: false,
}

const enterpriseTier: StaticTier = {
  key: "enterprise",
  name: "Enterprise",
  price: "Custom",
  period: "",
  description: "Unlimited assets, dedicated support",
  features: ["Unlimited assets", "Unlimited users", "Dedicated support", "Custom onboarding", "SSO & advanced security"],
  cta: "Contact sales",
  highlighted: false,
}

const pppPlans: {
  key: PlanKey
  name: string
  description: string
  features: string[]
  highlighted: boolean
}[] = [
  {
    key: "growth",
    name: "Growth",
    description: "Up to 2,500 assets, unlimited users",
    features: ["Up to 2,500 assets", "Unlimited users", "Maintenance scheduling", "Inspection checklists", "Integrations"],
    highlighted: true,
  },
  {
    key: "scale",
    name: "Scale",
    description: "Up to 25,000 assets, unlimited users",
    features: ["Up to 25,000 assets", "Unlimited users", "Full audit trail", "Scheduled reporting", "Priority support"],
    highlighted: false,
  },
]

export function PricingCards({ initialCountryCode }: { initialCountryCode: string | null }) {
  // The PPP tier itself is derived once, server-side, from `initialCountryCode`
  // (geolocation) and is never recomputed from user input — see pricing-data.ts.
  // Currency is purely a display preference and defaults to whatever currency
  // matches the visitor's detected country. Billing period is a pure UI choice
  // that changes which stacked discount (annual, on top of PPP) is shown.
  const defaultCurrencyCode = useMemo(() => getDefaultCurrencyForCountry(initialCountryCode), [initialCountryCode])
  const [currencyCode, setCurrencyCode] = useState<string>(defaultCurrencyCode)
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly")
  const detectedCountryName = useMemo(() => getCountryName(initialCountryCode), [initialCountryCode])
  const selectedCurrency = getCurrency(currencyCode)
  const hasPppDiscount = getPriceForCountry("growth", initialCountryCode, "monthly").tier.discountPercent > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <ToggleGroup
            value={[billingPeriod]}
            onValueChange={(value) => setBillingPeriod((value[0] as BillingPeriod) ?? "monthly")}
            className="rounded-full border border-border bg-background p-1"
          >
            <ToggleGroupItem
              value="monthly"
              className="rounded-full px-4 text-sm font-semibold text-muted-foreground hover:bg-transparent data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm"
            >
              Monthly
            </ToggleGroupItem>
            <ToggleGroupItem
              value="annual"
              className="gap-2 rounded-full px-4 text-sm font-semibold text-muted-foreground hover:bg-transparent data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm"
            >
              Annual
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {ANNUAL_DISCOUNT_PERCENT}% off
              </Badge>
            </ToggleGroupItem>
          </ToggleGroup>

          <Select value={currencyCode} onValueChange={(value) => setCurrencyCode(value as string)}>
            <SelectTrigger id="pricing-currency" size="sm" className="w-28 rounded-full">
              <SelectValue placeholder="USD">
                {() => (
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden="true">{flagEmoji(selectedCurrency.flagCountry)}</span>
                    <span>{selectedCurrency.code}</span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-64">
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <span className="flex w-full items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden="true">{flagEmoji(currency.flagCountry)}</span>
                      <span className="font-medium">{currency.code}</span>
                    </span>
                    <span className="text-muted-foreground">{currency.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          All prices in {currencyCode} &middot; Billed {billingPeriod === "annual" ? "annually" : "monthly"}
          <br />
          Prices reflect your local purchasing power (PPP pricing){hasPppDiscount && detectedCountryName ? ` for ${detectedCountryName}` : ""}.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <PricingCard tier={freeTier} />

        {pppPlans.map((plan) => {
          const { monthlyEquivalent, annualTotal } = getPriceForCountry(plan.key, initialCountryCode, billingPeriod)
          return (
            <PricingCard
              key={plan.key}
              tier={{
                key: plan.key,
                name: plan.name,
                price: formatCurrencyAmount(monthlyEquivalent, currencyCode),
                period: "/mo",
                description: plan.description,
                features: plan.features,
                cta: "Start free",
                highlighted: plan.highlighted,
              }}
              caption={
                billingPeriod === "annual" ? (
                  <>Billed annually at {formatCurrencyAmount(annualTotal, currencyCode)}</>
                ) : (
                  <>Billed monthly, cancel anytime</>
                )
              }
            />
          )
        })}

        <PricingCard tier={enterpriseTier} />
      </div>
    </div>
  )
}

function PricingCard({
  tier,
  caption,
}: {
  tier: StaticTier | (Omit<StaticTier, "key"> & { key: PlanKey })
  caption?: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-2xl border p-6",
        tier.highlighted ? "border-primary bg-card shadow-[0_16px_40px_-20px_rgba(47,163,145,0.45)]" : "border-border bg-card",
      )}
    >
      <div>
        {tier.highlighted && (
          <span className="mb-3 inline-block rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground">
            Most popular
          </span>
        )}
        <h3 className="text-base font-bold text-foreground">{tier.name}</h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">{tier.price}</span>
          {tier.period && <span className="text-sm font-semibold text-muted-foreground">{tier.period}</span>}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{tier.description}</p>
        {caption && <p className="mt-1 text-[11px] text-muted-foreground/80">{caption}</p>}
      </div>

      <ul className="flex flex-1 flex-col gap-2.5">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
            <Check size={16} className="mt-0.5 flex-shrink-0 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        render={<Link href={tier.cta === "Contact sales" ? "#compare" : "/app"} />}
        nativeButton={false}
        size="lg"
        variant={tier.highlighted ? "default" : "outline"}
        className="h-11 w-full rounded-lg border-border text-sm font-semibold"
      >
        {tier.cta}
      </Button>
    </div>
  )
}
