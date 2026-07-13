import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { FiEdit2, FiPlus, FiRefreshCw, FiSlash, FiUnlock } from 'react-icons/fi'
import { Tooltip } from 'react-tooltip'
import Swal from 'sweetalert2'
import { formatDate } from '../../../shared/utils/convertionDate'
import { useAuth } from '../../auth/hooks/useAuth'
import { useLogoutOnUnauthorized } from '../../auth/hooks/useLogoutOnUnauthorized'
import { useBusinessTypeCatalog } from '../hooks/useBusinessTypeCatalog'
import {
  createBusinessTypeRequest,
  updateBusinessTypeRequest,
  updateBusinessTypeStatusRequest,
} from '../services/categoryApi'
import type { BusinessTypeCatalogItem, CreateBusinessTypePayload } from '../types/category.types'
import './CategoryComponents.css'

type ValidationErrors = Record<string, string>

export function BusinessTypesTable() {
  const { accessToken, user } = useAuth()
  const logoutOnUnauthorized = useLogoutOnUnauthorized()
  const { businessTypes, pagination, page, search, isLoading, error, setPage, setSearch, reload } =
    useBusinessTypeCatalog(accessToken, logoutOnUnauthorized)
  const [isCreating, setIsCreating] = useState(false)
  const [editingBusinessType, setEditingBusinessType] = useState<BusinessTypeCatalogItem | null>(null)
  const canCreate = canAccessPermission(user, 'businesses.types.create')
  const canUpdate = canAccessPermission(user, 'businesses.types.update')
  const canUpdateStatus = canAccessPermission(user, 'businesses.types.status')

  async function toggleStatus(businessType: BusinessTypeCatalogItem) {
    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    const nextStatus = !businessType.is_active
    const action = nextStatus ? 'activar' : 'inactivar'
    const result = await Swal.fire({
      title: `${nextStatus ? 'Activar' : 'Inactivar'} business type`,
      text: `Seguro que quieres ${action} ${businessType.business_type}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Si, ${action}`,
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      await updateBusinessTypeStatusRequest(businessType.id, nextStatus, { accessToken })
      await Swal.fire(nextStatus ? 'Business type activado' : 'Business type inactivado', 'El estado fue actualizado.', 'success')
      await reload()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo actualizar', getBusinessTypeErrorMessage(requestError), 'error')
    }
  }

  return (
    <section className="category-page" aria-labelledby="business-types-title">
      <header className="category-page__header">
        <div>
          <p>Business</p>
          <h2 id="business-types-title">Business types</h2>
        </div>
        <div className="category-header-actions">
          <button className="secondary-button" type="button" onClick={() => void reload()}>
            <FiRefreshCw aria-hidden="true" />
            Refresh
          </button>
          {canCreate ? (
            <button className="primary-action" type="button" onClick={() => setIsCreating(true)}>
              <FiPlus aria-hidden="true" />
              Add business type
            </button>
          ) : null}
        </div>
      </header>

      <div className="category-toolbar">
        <label className="input-field category-search">
          <span>Search</span>
          <input
            type="search"
            value={search}
            maxLength={120}
            placeholder="Business type or description"
            onChange={(event) => {
              setPage(1)
              setSearch(event.target.value)
            }}
          />
        </label>
      </div>

      {error ? <p className="form-alert">{error}</p> : null}

      <div className="category-table-shell">
        <table className="category-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Business type</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6}>Loading business types...</td>
              </tr>
            ) : null}
            {!isLoading && businessTypes.length === 0 ? (
              <tr>
                <td colSpan={6}>No business types found.</td>
              </tr>
            ) : null}
            {businessTypes.map((businessType) => (
              <tr key={businessType.id}>
                <td>{businessType.id}</td>
                <td>{businessType.business_type}</td>
                <td>{businessType.short_description}</td>
                <td>{businessType.is_active ? 'Active' : 'Inactive'}</td>
                <td>{formatDate(businessType.created_at)}</td>
                <td>
                  <div className="category-actions">
                    {canUpdate ? (
                      <IconAction
                        label="Edit business type"
                        tooltipId={`edit-business-type-${businessType.id}`}
                        onClick={() => setEditingBusinessType(businessType)}
                      >
                        <FiEdit2 aria-hidden="true" />
                      </IconAction>
                    ) : null}
                    {canUpdateStatus ? (
                      <IconAction
                        label={businessType.is_active ? 'Inactivate business type' : 'Activate business type'}
                        tooltipId={`status-business-type-${businessType.id}`}
                        onClick={() => void toggleStatus(businessType)}
                      >
                        {businessType.is_active ? <FiSlash aria-hidden="true" /> : <FiUnlock aria-hidden="true" />}
                      </IconAction>
                    ) : null}
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
          Page {pagination.page} of {pagination.totalPages || 1} / {pagination.total} business types
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

      {isCreating ? (
        <BusinessTypeFormModal
          title="Add business type"
          onClose={() => setIsCreating(false)}
          onSaved={() => void reload()}
        />
      ) : null}
      {editingBusinessType ? (
        <BusinessTypeFormModal
          title="Edit business type"
          businessType={editingBusinessType}
          onClose={() => setEditingBusinessType(null)}
          onSaved={() => void reload()}
        />
      ) : null}
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
        className="category-action-button"
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

function BusinessTypeFormModal({
  title,
  businessType,
  onClose,
  onSaved,
}: {
  title: string
  businessType?: BusinessTypeCatalogItem
  onClose: () => void
  onSaved: () => void
}) {
  const { accessToken } = useAuth()
  const logoutOnUnauthorized = useLogoutOnUnauthorized()
  const [form, setForm] = useState<CreateBusinessTypePayload>({
    business_type: businessType?.business_type ?? '',
    short_description: businessType?.short_description ?? '',
  })
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const errors = useMemo(() => validateBusinessTypeForm(form, submitAttempted), [form, submitAttempted])

  function updateField(field: keyof CreateBusinessTypePayload, value: string) {
    setForm((current) => ({
      ...current,
      [field]: sanitizeBusinessTypeValue(field, value),
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitAttempted(true)

    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    const submitErrors = validateBusinessTypeForm(form, true)
    if (Object.keys(submitErrors).length > 0) {
      await Swal.fire('Formulario incompleto', 'Revisa los campos marcados en rojo.', 'warning')
      return
    }

    setIsSaving(true)

    try {
      const payload = normalizeBusinessTypePayload(form)

      if (businessType) {
        await updateBusinessTypeRequest(businessType.id, payload, { accessToken })
      } else {
        await createBusinessTypeRequest(payload, { accessToken })
      }

      await Swal.fire(businessType ? 'Business type actualizado' : 'Business type creado', 'Los cambios fueron guardados.', 'success')
      onSaved()
      onClose()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo guardar', getBusinessTypeErrorMessage(requestError), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="category-modal-backdrop category-modal-backdrop--form" role="presentation">
      <section className="category-modal category-modal--form" role="dialog" aria-modal="true" aria-labelledby="business-type-modal-title">
        <header className="category-modal__header">
          <div>
            <p>Business type</p>
            <h3 id="business-type-modal-title">{title}</h3>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
        </header>
        <form className="category-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <TextInput
              label="Business type"
              value={form.business_type}
              required
              error={errors.business_type}
              onChange={(value) => updateField('business_type', value)}
            />
            <TextInput
              label="Description"
              value={form.short_description}
              required
              error={errors.short_description}
              onChange={(value) => updateField('short_description', value)}
            />
          </div>
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

function validateBusinessTypeForm(form: CreateBusinessTypePayload, includeRequired: boolean) {
  const errors: ValidationErrors = {}

  validateText(errors, 'business_type', form.business_type, {
    includeRequired,
    label: 'Business type',
    maxLength: 255,
  })
  validateText(errors, 'short_description', form.short_description, {
    includeRequired,
    label: 'Description',
    maxLength: 500,
  })

  return errors
}

function validateText(
  errors: ValidationErrors,
  path: string,
  value: string,
  options: { includeRequired: boolean; label: string; maxLength: number },
) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    if (options.includeRequired) {
      errors[path] = `${options.label} es obligatorio.`
    }
    return
  }

  if (trimmedValue.length > options.maxLength) {
    errors[path] = `${options.label} debe tener maximo ${options.maxLength} caracteres.`
  }
}

function sanitizeBusinessTypeValue(field: keyof CreateBusinessTypePayload, value: string) {
  const maxLength = field === 'business_type' ? 255 : 500

  return value.slice(0, maxLength)
}

function normalizeBusinessTypePayload(form: CreateBusinessTypePayload) {
  return {
    business_type: form.business_type.trim(),
    short_description: form.short_description.trim(),
  }
}

function getPlaceholder(label: string) {
  const examples: Record<string, string> = {
    'Business type': 'Ej: SERVICES',
    Description: 'Ej: Service-based businesses',
  }

  return examples[label] ?? 'Escribe un valor'
}

function canAccessPermission(user: ReturnType<typeof useAuth>['user'], permission: string) {
  return Boolean(user?.hasAllPermissions || user?.permissions.includes(permission))
}

function getBusinessTypeErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Revisa tu conexion e intenta nuevamente.'
  }

  return error.message
}
