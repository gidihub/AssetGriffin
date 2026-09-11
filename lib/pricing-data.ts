/**
 * Purchasing power parity (PPP) pricing data for the Growth and Scale plans.
 *
 * Free is always $0 and Enterprise is always custom/"Contact us" — neither is
 * ever PPP-adjusted, so they are intentionally excluded from `basePrices`
 * and `getPriceForCountry`.
 *
 * PPP tier is server-detected only, never user-editable:
 * The tier/discount for a visitor is derived exclusively from the country
 * code the server detects (e.g. Vercel's `x-vercel-ip-country` header) and
 * is never exposed as a "pick your region" control — a visitor cannot
 * select a cheaper country to unlock a discount they are not eligible for.
 * The currency selector in the UI only changes which currency the *same*
 * USD-denominated price is displayed in; it never changes the PPP tier or
 * the underlying price.
 *
 * IMPORTANT — display only, not enforcement:
 * The prices computed here are for on-page display so visitors can see an
 * accurate estimate before checkout. They are NOT the source of truth for
 * what a customer is actually charged. The billing/checkout backend MUST
 * independently re-verify PPP eligibility against the customer's billing
 * address / card-issuing country at the time of purchase, and MUST NOT
 * trust a country code supplied by the client (query param, geolocation
 * header) as the basis for the charged price. Without that server-side
 * check, a visitor could spoof their detected country and pay a discounted
 * price regardless of where they actually bill from — this is a known
 * region-shopping abuse vector and is explicitly out of scope for this
 * pricing-page UI.
 *
 * The country lists below are a starting classification aligned to the
 * product spec's named examples (e.g. "Eastern Europe (Poland, Czechia,
 * Hungary, Romania)", "most of Sub-Saharan Africa"). Real-world income
 * classifications (World Bank, IMF) change annually and some countries
 * could reasonably sit in more than one bucket — Tier 3's "most of
 * Sub-Saharan Africa" and Tier 4's "World Bank low-income" both include many
 * African countries, so low-income Sub-Saharan African countries were
 * placed in Tier 4 only, and lower-middle-income ones in Tier 3, to avoid a
 * country appearing in two tiers at once. Finance/legal should review and
 * expand these lists before relying on them for real discounting.
 */

export type PlanKey = "growth" | "scale"

export type BillingPeriod = "monthly" | "annual"

/** Discount applied when a customer pays annually instead of monthly. Stacks on top of (i.e. applies after) any PPP discount. */
export const ANNUAL_DISCOUNT_PERCENT = 25

export type PppTierName = "tier1" | "tier2" | "tier3" | "tier4"

export interface PppTier {
  tierName: PppTierName
  /** Human-readable label used only in internal/dev contexts, never shown as a user-facing selector. */
  label: string
  discountPercent: number
  /** ISO 3166-1 alpha-2 country codes. */
  countries: string[]
}

/** Base (Tier 1 / full price) monthly prices in USD, billed monthly. */
export const baseMonthlyPrices: Record<PlanKey, number> = {
  growth: 39,
  scale: 79,
}

export const pppTiers: PppTier[] = [
  {
    tierName: "tier1",
    label: "Tier 1 — standard pricing",
    discountPercent: 0,
    countries: [
      "US", "GB", "CA", "AU", "NZ", // US, UK, Canada, Australia, New Zealand
      "DE", "FR", "NL", "BE", "AT", "CH", "IE", "LU", "SE", "DK", "NO", "FI", "IS", // Western Europe
      "JP", "SG", "KR", // Japan, Singapore, South Korea
    ],
  },
  {
    tierName: "tier2",
    label: "Tier 2 — 35% off",
    discountPercent: 35,
    countries: [
      "PL", "CZ", "HU", "RO", // Eastern Europe
      "MX", "CL", "AR", // Latin America
      "MY", // Malaysia
      "TR", // Turkey
      "AE", // UAE
    ],
  },
  {
    tierName: "tier3",
    label: "Tier 3 — 55% off",
    discountPercent: 55,
    countries: [
      "IN", "PH", "VN", "ID", // India, Philippines, Vietnam, Indonesia
      "EG", "PK", "BD", // Egypt, Pakistan, Bangladesh
      // Lower-middle-income Sub-Saharan Africa (see file header re: overlap with Tier 4)
      "NG", "KE", "GH", "TZ", "ZM", "SN", "CM", "CI", "ZW", "AO",
    ],
  },
  {
    tierName: "tier4",
    label: "Tier 4 — 70% off",
    discountPercent: 70,
    countries: [
      // World Bank low-income economies (review/update against the latest WB list)
      "AF", "BI", "BF", "CF", "TD", "CD", "ER", "ET", "GM", "GN", "GW",
      "KP", "LR", "MG", "MW", "ML", "MZ", "NE", "RW", "SL", "SO", "SS",
      "SD", "SY", "TG", "UG", "YE",
    ],
  },
]

/** Country code → display name, used only to name-drop the detected country in caption copy (e.g. "Local pricing for Nigeria"). Not a selectable list. */
export const countryDirectory: { code: string; name: string }[] = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" },
  { code: "CH", name: "Switzerland" },
  { code: "IE", name: "Ireland" },
  { code: "LU", name: "Luxembourg" },
  { code: "SE", name: "Sweden" },
  { code: "DK", name: "Denmark" },
  { code: "NO", name: "Norway" },
  { code: "FI", name: "Finland" },
  { code: "IS", name: "Iceland" },
  { code: "JP", name: "Japan" },
  { code: "SG", name: "Singapore" },
  { code: "KR", name: "South Korea" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czechia" },
  { code: "HU", name: "Hungary" },
  { code: "RO", name: "Romania" },
  { code: "MX", name: "Mexico" },
  { code: "CL", name: "Chile" },
  { code: "AR", name: "Argentina" },
  { code: "MY", name: "Malaysia" },
  { code: "TR", name: "Turkey" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "IN", name: "India" },
  { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" },
  { code: "ID", name: "Indonesia" },
  { code: "EG", name: "Egypt" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "GH", name: "Ghana" },
  { code: "TZ", name: "Tanzania" },
  { code: "ZM", name: "Zambia" },
  { code: "SN", name: "Senegal" },
  { code: "CM", name: "Cameroon" },
  { code: "CI", name: "C\u00f4te d\u2019Ivoire" },
  { code: "ZW", name: "Zimbabwe" },
  { code: "AO", name: "Angola" },
  { code: "AF", name: "Afghanistan" },
  { code: "ET", name: "Ethiopia" },
  { code: "UG", name: "Uganda" },
  { code: "MZ", name: "Mozambique" },
  { code: "ML", name: "Mali" },
  { code: "MW", name: "Malawi" },
  { code: "RW", name: "Rwanda" },
  { code: "SD", name: "Sudan" },
  { code: "SY", name: "Syria" },
  { code: "YE", name: "Yemen" },
]

const countryNameByCode = new Map(countryDirectory.map((c) => [c.code, c.name]))

export function getCountryName(countryCode: string | null | undefined): string | null {
  if (!countryCode) return null
  return countryNameByCode.get(countryCode.toUpperCase()) ?? null
}

/** Looks up the PPP tier for a given country code, defaulting to Tier 1 (standard pricing) if unknown. */
export function getPppTierForCountry(countryCode: string | null | undefined): PppTier {
  const upper = countryCode?.toUpperCase()
  if (upper) {
    const match = pppTiers.find((tier) => tier.countries.includes(upper))
    if (match) return match
  }
  return pppTiers[0]
}

/**
 * Returns the display price (USD) and PPP tier for a plan in a given country and billing period.
 * `countryCode` must come from server-side geolocation, never a client-editable value.
 * Display only — see the file header for why this must be re-verified server-side at checkout.
 *
 * The annual discount (`ANNUAL_DISCOUNT_PERCENT`) and the PPP discount stack: a Tier 3 customer
 * paying annually gets both the PPP discount and the annual discount off the base monthly price.
 */
export function getPriceForCountry(planKey: PlanKey, countryCode: string | null | undefined, billingPeriod: BillingPeriod) {
  const tier = getPppTierForCountry(countryCode)
  const baseMonthly = baseMonthlyPrices[planKey]
  const pppAdjustedMonthly = baseMonthly * (1 - tier.discountPercent / 100)
  const monthlyEquivalent =
    billingPeriod === "annual"
      ? Math.round(pppAdjustedMonthly * (1 - ANNUAL_DISCOUNT_PERCENT / 100))
      : Math.round(pppAdjustedMonthly)
  const annualTotal = monthlyEquivalent * 12
  return { monthlyEquivalent, annualTotal, tier }
}

/**
 * Currency display data.
 *
 * This is purely cosmetic: it lets a visitor view the (already PPP-adjusted)
 * USD price in a currency they recognize. It never changes the price a
 * customer is charged — actual billing happens in USD (or whatever currency
 * the payment processor settles in) regardless of what is shown here.
 *
 * `usdRate` values are indicative approximations for display purposes only
 * and are NOT live exchange rates. They should be reviewed and refreshed
 * periodically (or replaced with a real FX data source) — do not use them
 * for anything that touches actual money movement.
 */
export interface Currency {
  code: string
  name: string
  /** ISO 3166-1 alpha-2 code of a representative country, used to render a flag emoji. */
  flagCountry: string
  /** Units of this currency per 1 USD (indicative, display only). */
  usdRate: number
}

export const currencies: Currency[] = [
  { code: "USD", name: "US Dollar", flagCountry: "US", usdRate: 1 },
  { code: "EUR", name: "Euro", flagCountry: "EU", usdRate: 0.92 },
  { code: "GBP", name: "British Pound", flagCountry: "GB", usdRate: 0.79 },
  { code: "CAD", name: "Canadian Dollar", flagCountry: "CA", usdRate: 1.36 },
  { code: "AUD", name: "Australian Dollar", flagCountry: "AU", usdRate: 1.52 },
  { code: "NZD", name: "New Zealand Dollar", flagCountry: "NZ", usdRate: 1.66 },
  { code: "CHF", name: "Swiss Franc", flagCountry: "CH", usdRate: 0.88 },
  { code: "SEK", name: "Swedish Krona", flagCountry: "SE", usdRate: 10.4 },
  { code: "DKK", name: "Danish Krone", flagCountry: "DK", usdRate: 6.9 },
  { code: "NOK", name: "Norwegian Krone", flagCountry: "NO", usdRate: 10.6 },
  { code: "ISK", name: "Icelandic Krona", flagCountry: "IS", usdRate: 137 },
  { code: "JPY", name: "Japanese Yen", flagCountry: "JP", usdRate: 149 },
  { code: "SGD", name: "Singapore Dollar", flagCountry: "SG", usdRate: 1.34 },
  { code: "KRW", name: "South Korean Won", flagCountry: "KR", usdRate: 1370 },
  { code: "PLN", name: "Polish Zloty", flagCountry: "PL", usdRate: 4.0 },
  { code: "CZK", name: "Czech Koruna", flagCountry: "CZ", usdRate: 23 },
  { code: "HUF", name: "Hungarian Forint", flagCountry: "HU", usdRate: 360 },
  { code: "RON", name: "Romanian Leu", flagCountry: "RO", usdRate: 4.6 },
  { code: "MXN", name: "Mexican Peso", flagCountry: "MX", usdRate: 17 },
  { code: "CLP", name: "Chilean Peso", flagCountry: "CL", usdRate: 940 },
  { code: "ARS", name: "Argentine Peso", flagCountry: "AR", usdRate: 900 },
  { code: "MYR", name: "Malaysian Ringgit", flagCountry: "MY", usdRate: 4.7 },
  { code: "TRY", name: "Turkish Lira", flagCountry: "TR", usdRate: 34 },
  { code: "AED", name: "UAE Dirham", flagCountry: "AE", usdRate: 3.67 },
  { code: "INR", name: "Indian Rupee", flagCountry: "IN", usdRate: 83 },
  { code: "PHP", name: "Philippine Peso", flagCountry: "PH", usdRate: 56 },
  { code: "VND", name: "Vietnamese Dong", flagCountry: "VN", usdRate: 24500 },
  { code: "IDR", name: "Indonesian Rupiah", flagCountry: "ID", usdRate: 15600 },
  { code: "EGP", name: "Egyptian Pound", flagCountry: "EG", usdRate: 48 },
  { code: "PKR", name: "Pakistani Rupee", flagCountry: "PK", usdRate: 278 },
  { code: "BDT", name: "Bangladeshi Taka", flagCountry: "BD", usdRate: 117 },
  { code: "NGN", name: "Nigerian Naira", flagCountry: "NG", usdRate: 1550 },
  { code: "KES", name: "Kenyan Shilling", flagCountry: "KE", usdRate: 129 },
  { code: "GHS", name: "Ghanaian Cedi", flagCountry: "GH", usdRate: 15.5 },
  { code: "UGX", name: "Ugandan Shilling", flagCountry: "UG", usdRate: 3700 },
  { code: "TZS", name: "Tanzanian Shilling", flagCountry: "TZ", usdRate: 2600 },
  { code: "XOF", name: "West African CFA", flagCountry: "SN", usdRate: 600 },
  { code: "ETB", name: "Ethiopian Birr", flagCountry: "ET", usdRate: 123 },
  { code: "RWF", name: "Rwandan Franc", flagCountry: "RW", usdRate: 1300 },
  { code: "ZAR", name: "South African Rand", flagCountry: "ZA", usdRate: 18.3 },
]

const currencyByCode = new Map(currencies.map((c) => [c.code, c]))

/**
 * Country code → default display currency. Only covers countries whose
 * currency has a reasonably stable, well-known rate we can show with
 * confidence (see `currencies` above). Countries not listed here (mostly
 * economies with extreme currency volatility, like AFN, SYP, YER, ZWL)
 * intentionally fall back to USD rather than show a stale, misleading rate.
 */
const countryToCurrency: Record<string, string> = {
  US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", NZ: "NZD",
  DE: "EUR", FR: "EUR", NL: "EUR", BE: "EUR", AT: "EUR", IE: "EUR", LU: "EUR", FI: "EUR",
  CH: "CHF", SE: "SEK", DK: "DKK", NO: "NOK", IS: "ISK", JP: "JPY", SG: "SGD", KR: "KRW",
  PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON", MX: "MXN", CL: "CLP", AR: "ARS", MY: "MYR", TR: "TRY", AE: "AED",
  IN: "INR", PH: "PHP", VN: "VND", ID: "IDR", EG: "EGP", PK: "PKR", BD: "BDT",
  NG: "NGN", KE: "KES", GH: "GHS", UG: "UGX", TZ: "TZS", SN: "XOF", CI: "XOF", BF: "XOF", GW: "XOF", ML: "XOF", NE: "XOF", TG: "XOF",
  ET: "ETB", RW: "RWF", ZA: "ZAR",
}

/** Best-effort default display currency for a detected country, falling back to USD. */
export function getDefaultCurrencyForCountry(countryCode: string | null | undefined): string {
  const upper = countryCode?.toUpperCase()
  if (upper && countryToCurrency[upper]) return countryToCurrency[upper]
  return "USD"
}

export function getCurrency(code: string): Currency {
  return currencyByCode.get(code) ?? currencyByCode.get("USD")!
}

/** Converts a USD amount to the given currency using the indicative display rate. */
export function convertFromUsd(amountUsd: number, currencyCode: string): number {
  const currency = getCurrency(currencyCode)
  return amountUsd * currency.usdRate
}

/** Formats a USD amount in the given display currency, e.g. 140 USD → "₦217,000". */
export function formatCurrencyAmount(amountUsd: number, currencyCode: string): string {
  const converted = convertFromUsd(amountUsd, currencyCode)
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(converted)
  } catch {
    // Fall back to USD if Intl doesn't recognize the code in this runtime's ICU data.
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountUsd)
  }
}

/** Renders a flag emoji from an ISO 3166-1 alpha-2 code (e.g. "NG" → 🇳🇬). "EU" is also supported for the Euro. */
export function flagEmoji(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}
