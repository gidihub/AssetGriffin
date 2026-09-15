import type OpenAI from 'openai'

/**
 * Filter shape shared by the asset-reading tools. Values are matched
 * case-insensitively and by substring, so "laptop" finds "Computers" only if
 * that word appears — the data dictionary in the system prompt tells the model
 * the real values to use.
 */
const assetFilters = {
  type: 'object',
  description: 'Filters applied to the organization\u2019s assets. Omit to match everything.',
  properties: {
    category: {
      type: 'array',
      items: { type: 'string' },
      description: 'Asset categories to include. Use the exact values listed in the data dictionary.',
    },
    location: {
      type: 'array',
      items: { type: 'string' },
      description: 'Locations to include. Use the exact values listed in the data dictionary.',
    },
    status: {
      type: 'array',
      items: { type: 'string', enum: ['In use', 'In maintenance', 'Retired', 'Available'] },
      description: 'Asset statuses to include.',
    },
    assigned_to: {
      type: 'array',
      items: { type: 'string' },
      description: 'Assigned owners, teams, or people to include.',
    },
    lifecycle_stage: {
      type: 'array',
      items: { type: 'string', enum: ['Procurement', 'Deployed', 'In Maintenance', 'Retired/Disposed'] },
      description: 'Lifecycle stages to include.',
    },
    purchase_date_from: { type: 'string', description: 'Earliest purchase date, as YYYY-MM-DD.' },
    purchase_date_to: { type: 'string', description: 'Latest purchase date, as YYYY-MM-DD.' },
    warranty_expiration_from: { type: 'string', description: 'Earliest warranty expiry, as YYYY-MM-DD.' },
    warranty_expiration_to: { type: 'string', description: 'Latest warranty expiry, as YYYY-MM-DD.' },
    min_value: { type: 'number', description: 'Minimum purchase value.' },
    max_value: { type: 'number', description: 'Maximum purchase value.' },
    unassigned_only: { type: 'boolean', description: 'Only assets with no assigned owner.' },
    text_search: {
      type: 'string',
      description: 'Free-text match across name, asset tag, serial, notes, category, owner, and location.',
    },
  },
} as const

const GAP_FIELDS = [
  'serial',
  'location',
  'assigned_to',
  'purchase_date',
  'warranty_expiration',
  'purchase_value',
  'notes',
  'category',
]

export const GRIFFINEYE_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'count_assets',
      description:
        'Count assets matching filters. Use this for "how many" questions instead of fetching rows and counting them.',
      parameters: {
        type: 'object',
        properties: { filters: assetFilters },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_assets',
      description:
        'Return the asset records matching filters. Use when the user wants to see the actual records, not just a number.',
      parameters: {
        type: 'object',
        properties: {
          filters: assetFilters,
          sort_by: {
            type: 'string',
            enum: [
              'name',
              'category',
              'location',
              'status',
              'assigned_to',
              'purchase_date',
              'purchase_value',
              'warranty_expiration',
              'created_at',
              'updated_at',
            ],
          },
          direction: { type: 'string', enum: ['asc', 'desc'] },
          limit: { type: 'number', description: 'Max rows to return (default 50, max 200).' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'rank_by',
      description:
        'Group assets and rank the groups. Answers "who has the most assets" (group_by assigned_to, dimension count) or "which location holds the most expensive equipment" (group_by location, dimension total_value).',
      parameters: {
        type: 'object',
        properties: {
          group_by: {
            type: 'string',
            enum: ['assigned_to', 'location', 'category', 'status', 'lifecycle_stage'],
            description: 'The dimension to group by.',
          },
          dimension: {
            type: 'string',
            enum: ['count', 'total_value', 'average_value'],
            description: 'The metric to rank groups on.',
          },
          direction: { type: 'string', enum: ['asc', 'desc'], description: 'desc for "most", asc for "least".' },
          limit: { type: 'number', description: 'Number of groups to return (default 10).' },
          filters: assetFilters,
        },
        required: ['group_by'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'assets_by_recency',
      description:
        'Time-based queries on record timestamps. Use field created_at with direction within for "added in the last 30 days", and field updated_at with direction not_within for "not touched in 6 months".',
      parameters: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            enum: ['created_at', 'updated_at'],
            description: 'created_at for when the record was added, updated_at for when it last changed.',
          },
          direction: {
            type: 'string',
            enum: ['within', 'not_within'],
            description: 'within = inside the window; not_within = older than the window.',
          },
          days: { type: 'number', description: 'Size of the window in days.' },
          limit: { type: 'number', description: 'Max rows to return (default 50, max 200).' },
          filters: assetFilters,
        },
        required: ['field', 'direction', 'days'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_data_gaps',
      description:
        'Data hygiene checks. Omit field to get a ranked summary of which fields are most often blank; pass a field to list the specific records missing it.',
      parameters: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            enum: GAP_FIELDS,
            description: 'Field to list incomplete records for. Omit for an across-the-board summary.',
          },
          limit: { type: 'number', description: 'Max rows when a field is given (default 50, max 200).' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_schema_info',
      description:
        'List custom field definitions on workspace groups (e.g. Assets). Use only when the user explicitly asks what fields exist. Do not use for greetings or workspace summaries.',
      parameters: {
        type: 'object',
        properties: {
          table: {
            type: 'string',
            description: 'Limit to one group, e.g. assets. Omit to list fields on every group.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_change_history',
      description:
        'Query the audit log for change history. Answers "what was updated via import last week" (source: import, days: 7) or "what changed manually today" (source: manual, days: 1). Apply the narrowest single filter that answers the question — category and source are independent, so combining them often matches nothing. If a call returns no events, read the returned list of available category/source combinations and try again with a corrected filter before concluding nothing happened.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['record', 'user', 'import', 'ai'],
            description:
              'Which sub-log to read. Use only when the user asks about a whole log ("show me user activity"), not to describe how a change happened.',
          },
          source: {
            type: 'string',
            enum: ['manual', 'import', 'griffineye', 'system', 'api'],
            description:
              'How the change was made. Use this alone for "via import", "manually", or "by GriffinEye" questions — do not also set category.',
          },
          actor: { type: 'string', description: 'Filter by who performed the action.' },
          entity_label: { type: 'string', description: 'Filter by the affected record\u2019s name or tag.' },
          days: { type: 'number', description: 'Only events within this many days.' },
          limit: { type: 'number', description: 'Max events to return (default 50, max 200).' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_report',
      description:
        'Turn the results you have already retrieved into a downloadable CSV or PDF file. Call a query tool first — this packages that result, it does not fetch data. Use it when the user asks for an export, a file, a download, or a report of a filtered or combined result. Do not use it when the user simply wants every asset with no filtering: the Assets page has its own Export button, so point them there instead.',
      parameters: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['csv', 'pdf'],
            description:
              'csv for data the user will open in a spreadsheet, pdf for something they will read, print, or send on. Default to csv unless the user asks for a PDF, a summary, or something shareable.',
          },
          title: {
            type: 'string',
            description:
              'Short descriptive report title shown in the PDF header and used for the filename, e.g. "Assets missing serial numbers".',
          },
        },
        required: ['format', 'title'],
      },
    },
  },
]
