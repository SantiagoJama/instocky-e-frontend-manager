import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { FiPlus, FiRefreshCw, FiSlash, FiUnlock } from 'react-icons/fi'
import { Tooltip } from 'react-tooltip'
import Swal from 'sweetalert2'
import { useAuth } from '../../auth/hooks/useAuth'
import { useLogoutOnUnauthorized } from '../../auth/hooks/useLogoutOnUnauthorized'
import { usePermissions } from '../hooks/usePermissions'
import { createPermissionRequest, updatePermissionStatusRequest } from '../services/permissionApi'
import type { CreatePermissionPayload, Permission, PermissionRole, PermissionStatus } from '../types/permission.types'
import { formatDate } from '../../../shared/utils/convertionDate'
import './PermissionComponents.css'

type ValidationErrors = Record<string, string>

const emptyPermission: CreatePermissionPayload = {
  code: '',
  name: '',
  description: '',
  allowedRoles: ['admin'],
}

export function PermissionsTable() {
  const { accessToken } = useAuth()
  const logoutOnUnauthorized = useLogoutOnUnauthorized()
  const { permissions, pagination, page, search, status, isLoading, error, setPage, setSearch, setStatus, reload } =
    usePermissions(accessToken, logoutOnUnauthorized)
  const [isCreating, setIsCreating] = useState(false)

  async function toggleStatus(permission: Permission) {
    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    const nextStatus = !permission.isActive
    const action = nextStatus ? 'activar' : 'inactivar'
    const result = await Swal.fire({
      title: `${nextStatus ? 'Activar' : 'Inactivar'} permiso`,
      text: `Seguro que quieres ${action} ${permission.code}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Si, ${action}`,
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      await updatePermissionStatusRequest(permission.id, nextStatus, { accessToken })
      await Swal.fire(nextStatus ? 'Permiso activado' : 'Permiso inactivado', 'El estado fue actualizado.', 'success')
      await reload()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo actualizar', getPermissionErrorMessage(requestError), 'error')
    }
  }

  return (
    <section className="permission-page" aria-labelledby="permissions-title">
      <header className="permission-page__header">
        <div>
          <p>Manager</p>
          <h2 id="permissions-title">Permissions</h2>
        </div>
        <div className="permission-header-actions">
          <button className="secondary-button" type="button" onClick={() => void reload()}>
            <FiRefreshCw aria-hidden="true" />
            Refresh
          </button>
          <button className="primary-action" type="button" onClick={() => setIsCreating(true)}>
            <FiPlus aria-hidden="true" />
            Create permission
          </button>
        </div>
      </header>

      <div className="permission-toolbar">
        <label className="input-field permission-search">
          <span>Search</span>
          <input
            type="search"
            value={search}
            maxLength={120}
            placeholder="Code, name or description"
            onChange={(event) => {
              setPage(1)
              setSearch(event.target.value)
            }}
          />
        </label>
        <label className="input-field permission-status-filter">
          <span>Status</span>
          <select
            value={status}
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value as PermissionStatus)
            }}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      {error ? <p className="form-alert">{error}</p> : null}

      <div className="permission-table-shell">
        <table className="permission-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Code</th>
              <th>Name</th>
              <th>Description</th>
              <th>Allowed roles</th>
              <th>Status</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9}>Loading permissions...</td>
              </tr>
            ) : null}
            {!isLoading && permissions.length === 0 ? (
              <tr>
                <td colSpan={9}>No permissions found.</td>
              </tr>
            ) : null}
            {permissions.map((permission) => (
              <tr key={permission.id}>
                <td>{permission.id}</td>
                <td>{permission.code}</td>
                <td>{permission.name}</td>
                <td>{permission.description}</td>
                <td>{formatAllowedRoles(permission.allowedRoles)}</td>
                <td>{permission.isActive ? 'Active' : 'Inactive'}</td>
                <td>{formatSafeDate(permission.createdAt)}</td>
                <td>{formatSafeDate(permission.updatedAt)}</td>
                <td>
                  <div className="permission-actions">
                    <IconAction
                      label={permission.isActive ? 'Inactivate permission' : 'Activate permission'}
                      tooltipId={`status-permission-${permission.id}`}
                      onClick={() => void toggleStatus(permission)}
                    >
                      {permission.isActive ? <FiSlash aria-hidden="true" /> : <FiUnlock aria-hidden="true" />}
                    </IconAction>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-row">
        <button className="secondary-button" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.totalPages || 1}
        </span>
        <button
          className="secondary-button"
          type="button"
          disabled={page >= pagination.totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>

      {isCreating ? <CreatePermissionModal onClose={() => setIsCreating(false)} onSaved={() => void reload()} /> : null}
    </section>
  )
}

function IconAction({
  label,
  tooltipId,
  onClick,
  children,
}: {
  label: string
  tooltipId: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <>
      <button
        className="permission-action-button"
        type="button"
        aria-label={label}
        data-tooltip-id={tooltipId}
        data-tooltip-content={label}
        onClick={onClick}
      >
        {children}
      </button>
      <Tooltip id={tooltipId} />
    </>
  )
}

function CreatePermissionModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { accessToken } = useAuth()
  const logoutOnUnauthorized = useLogoutOnUnauthorized()
  const [form, setForm] = useState<CreatePermissionPayload>(emptyPermission)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const errors = useMemo(() => validatePermissionForm(form, submitAttempted), [form, submitAttempted])

  function updateField(field: keyof CreatePermissionPayload, value: string) {
    setForm((current) => ({
      ...current,
      [field]: sanitizePermissionValue(field, value),
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitAttempted(true)

    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    const submitErrors = validatePermissionForm(form, true)
    if (Object.keys(submitErrors).length > 0) {
      await Swal.fire('Formulario incompleto', 'Revisa los campos marcados en rojo.', 'warning')
      return
    }

    setIsSaving(true)

    try {
      await createPermissionRequest(normalizePermissionPayload(form), { accessToken })
      await Swal.fire('Permiso creado', 'El permiso fue creado correctamente.', 'success')
      onSaved()
      onClose()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo crear', getPermissionErrorMessage(requestError), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="permission-modal-backdrop" role="presentation">
      <section className="permission-modal" role="dialog" aria-modal="true" aria-labelledby="permission-modal-title">
        <header className="permission-modal__header">
          <div>
            <p>Permission</p>
            <h3 id="permission-modal-title">Create permission</h3>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
        </header>
        <form className="permission-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <TextInput label="Code" value={form.code} required error={errors.code} onChange={(value) => updateField('code', value)} />
            <TextInput label="Name" value={form.name} required error={errors.name} onChange={(value) => updateField('name', value)} />
            <TextInput label="Description" value={form.description} required error={errors.description} onChange={(value) => updateField('description', value)} />
          </div>
          <fieldset className="role-section">
            <legend>Allowed roles</legend>
            {errors.allowedRoles ? <small className="field-error">{errors.allowedRoles}</small> : null}
            <div className="role-option-grid">
              {(['admin', 'support'] satisfies PermissionRole[]).map((role) => (
                <label className="role-option" key={role}>
                  <input
                    type="checkbox"
                    checked={form.allowedRoles.includes(role)}
                    onChange={(event) => updateAllowedRole(role, event.target.checked)}
                  />
                  <span>{role}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="form-actions">
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-action" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )

  function updateAllowedRole(role: PermissionRole, isChecked: boolean) {
    setForm((current) => ({
      ...current,
      allowedRoles: isChecked
        ? [...new Set([...current.allowedRoles, role])]
        : current.allowedRoles.filter((currentRole) => currentRole !== role),
    }))
  }
}

function TextInput({
  label,
  value,
  onChange,
  required = false,
  error,
}: {
  label: string
  value: string
  required?: boolean
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="input-field">
      <span>{label}</span>
      <input
        type="text"
        value={value}
        required={required}
        aria-invalid={Boolean(error)}
        placeholder={getPlaceholder(label)}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  )
}

function validatePermissionForm(form: CreatePermissionPayload, includeRequired: boolean) {
  const errors: ValidationErrors = {}
  validateText(errors, 'code', form.code, {
    includeRequired,
    label: 'Code',
    pattern: /^[a-z]+(?:[._-][a-z]+)*$/,
    message: 'Usa un codigo como customers.read.',
  })
  validateText(errors, 'name', form.name, {
    includeRequired,
    label: 'Name',
    pattern: /^[\p{L}0-9 .,_-]+$/u,
    message: 'Solo letras, numeros y puntuacion basica.',
  })
  validateText(errors, 'description', form.description, {
    includeRequired,
    label: 'Description',
    pattern: /^[\p{L}0-9 .,:;,_()/-]+$/u,
    message: 'Solo letras, numeros y puntuacion basica.',
  })
  if (form.allowedRoles.length === 0) {
    errors.allowedRoles = 'Selecciona al menos un rol.'
  }
  return errors
}

function validateText(
  errors: ValidationErrors,
  path: string,
  value: string,
  options: { includeRequired: boolean; label: string; pattern: RegExp; message: string },
) {
  if (!value.trim()) {
    if (options.includeRequired) {
      errors[path] = `${options.label} es obligatorio.`
    }
    return
  }

  if (!options.pattern.test(value.trim())) {
    errors[path] = options.message
  }
}

function sanitizePermissionValue(field: keyof CreatePermissionPayload, value: string) {
  if (field === 'code') {
    return value.replace(/\s/g, '').toLowerCase()
  }

  return value
}

function normalizePermissionPayload(form: CreatePermissionPayload) {
  return {
    code: form.code.trim().toLowerCase(),
    name: form.name.trim(),
    description: form.description.trim(),
    allowedRoles: form.allowedRoles,
  }
}

function formatAllowedRoles(roles: PermissionRole[]) {
  return roles.length ? roles.join(', ') : 'N/A'
}

function getPlaceholder(label: string) {
  const examples: Record<string, string> = {
    Code: 'Ej: reports.read',
    Name: 'Ej: Read reports',
    Description: 'Ej: Allows reading reports.',
  }

  return examples[label] ?? 'Escribe un valor'
}

function formatSafeDate(value?: string | null) {
  return value ? formatDate(value) : 'N/A'
}

function getPermissionErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Revisa tu conexion e intenta nuevamente.'
  }

  return error.message
}
