'use client'

import { Search } from 'lucide-react'
import {
  audits,
  inspections,
  locations,
  maintenance,
  people,
  previewAssets,
  reports,
} from '@/lib/workspace-data'
import { SettingsSection } from '@/components/workspace/settings-pages'

function PreviewTable({
  title,
  subtitle,
  columns,
  rows,
}: {
  title: string
  subtitle: string
  columns: string[]
  rows: string[][]
}) {
  return (
    <div className="panel assets-panel">
      <div className="panel-header assets-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="table-toolbar">
        <div className="search-wrap">
          <Search size={16} />
          <input readOnly placeholder="Search…" />
        </div>
      </div>
      <div className="asset-table-wrap">
        <table className="asset-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 6).map((row) => (
              <tr key={row.join('-')}>
                {row.map((cell, index) => (
                  <td key={`${row[0]}-${index}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function noop() {}

export function MarketingAssetsPreview() {
  return (
    <PreviewTable
      title="Assets"
      subtitle="Everything your company owns, in one accountable view."
      columns={['Asset', 'Tag / serial', 'Assigned to', 'Location', 'Status']}
      rows={previewAssets.map((asset) => [
        asset.name,
        asset.serial || asset.id,
        asset.assignedTo,
        asset.location,
        asset.status,
      ])}
    />
  )
}

export function MarketingPeoplePreview() {
  return (
    <PreviewTable
      title="People & teams"
      subtitle="Who has what, and when they last checked out."
      columns={['Name', 'Team', 'Role', 'Department', 'Status']}
      rows={people.map((person) => [person.name, person.team, person.role, person.department, person.status])}
    />
  )
}

export function MarketingLocationsPreview() {
  return (
    <PreviewTable
      title="Locations"
      subtitle="Sites, warehouses, and job locations."
      columns={['Name', 'Type', 'Manager', 'Last audit']}
      rows={locations.map((location) => [location.name, location.type, location.manager, location.lastAudit])}
    />
  )
}

export function MarketingMaintenancePreview() {
  return (
    <PreviewTable
      title="Maintenance"
      subtitle="Open work orders and repair history."
      columns={['Asset', 'Issue', 'Priority', 'Technician', 'Status']}
      rows={maintenance.map((item) => [item.asset, item.issueType, item.priority, item.technician, item.status])}
    />
  )
}

export function MarketingAuditsPreview() {
  return (
    <PreviewTable
      title="Audits"
      subtitle="Physical inventory counts and reconciliation."
      columns={['Name', 'Scope', 'Auditor', 'Status']}
      rows={audits.map((audit) => [audit.name, audit.scope, audit.auditor, audit.status])}
    />
  )
}

export function MarketingInspectionsPreview() {
  return (
    <PreviewTable
      title="Inspections"
      subtitle="Scheduled checks with pass/fail checklists."
      columns={['Asset', 'Inspector', 'Due date', 'Status']}
      rows={inspections.map((item) => [item.asset, item.assignedInspector, item.dueDate, item.status])}
    />
  )
}

export function MarketingReportsPreview() {
  return (
    <PreviewTable
      title="Reports"
      subtitle="Saved exports and scheduled summaries."
      columns={['Name', 'Type', 'Last run', 'Owner']}
      rows={reports.map((report) => [report.name, report.type, report.lastRun, report.owner])}
    />
  )
}

export function MarketingAuditLogPreview() {
  return <SettingsSection section="Audit log" onAnnounce={noop} />
}

export function MarketingRolesPreview() {
  return <SettingsSection section="Roles & permissions" onAnnounce={noop} />
}
