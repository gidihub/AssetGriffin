export type AssetStatus = 'In use' | 'In maintenance' | 'Retired' | 'Available'

export type LifecycleStage = 'Procurement' | 'Deployed' | 'In Maintenance' | 'Retired/Disposed'

export type SubscriptionTier = 'free' | 'growth' | 'scale' | 'enterprise'

export type DbOrganization = {
  id: string
  name: string
  subscription_tier: SubscriptionTier
  griffin_vision_credits_balance: number
  stripe_customer_id: string | null
  created_at: string
}

export type DbAiUsageLog = {
  id: string
  organization_id: string
  usage_type: 'griffin_vision_photo'
  billing_source: 'tier_allowance' | 'purchased_credit'
  created_at: string
}

export type DbAiCreditTransaction = {
  id: string
  organization_id: string
  transaction_type: 'purchase' | 'consumption'
  credits_delta: number
  credits_balance_after: number
  pack_key: 'starter' | 'standard' | 'bulk' | null
  amount_cents: number | null
  currency: string
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  ai_usage_log_id: string | null
  created_at: string
}

export type DbProfile = {
  id: string
  organization_id: string
  email: string
  full_name: string | null
  role: 'owner' | 'admin' | 'member'
  created_at: string
}

export type DbAsset = {
  id: string
  organization_id: string
  asset_tag: string
  name: string
  category: string
  assigned_to: string
  location: string
  status: AssetStatus
  purchase_date: string | null
  serial: string
  warranty_expiration: string | null
  depreciation_value: string
  purchase_value: number | null
  notes: string
  lifecycle_stage: LifecycleStage
  lifecycle_dates: Record<string, string>
  it_details: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type DbAssetInsert = Omit<DbAsset, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
}

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'status'
  | 'checkbox'
  | 'relation'
  | 'json'

export type DbGroup = {
  id: string
  organization_id: string
  name: string
  icon: string
  slug: string
  sort_order: number
  created_at: string
}

export type DbField = {
  id: string
  group_id: string
  key: string
  label: string
  type: FieldType
  options: Record<string, unknown>
  sort_order: number
  required: boolean
  created_at: string
}

export type DbRecord = {
  id: string
  group_id: string
  organization_id: string
  data: Record<string, unknown>
  created_at: string
  updated_at: string
  created_by: string | null
}
