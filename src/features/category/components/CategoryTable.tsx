import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { FiEdit2, FiList, FiPlus, FiRefreshCw, FiSlash, FiUnlock } from 'react-icons/fi'
import { Tooltip } from 'react-tooltip'
import Swal from 'sweetalert2'
import { formatDate } from '../../../shared/utils/convertionDate'
import { useAuth } from '../../auth/hooks/useAuth'
import { useLogoutOnUnauthorized } from '../../auth/hooks/useLogoutOnUnauthorized'
import { useBusinessTypes } from '../hooks/useBusinessTypes'
import {
  createBusinessCategoryRequest,
  updateBusinessCategoryRequest,
  updateBusinessCategoryStatusRequest,
} from '../services/categoryApi'
import type { BusinessType, CategoryTableItem, CreateBusinessCategoryPayload } from '../types/category.types'
import './CategoryComponents.css'

type ValidationErrors = Record<string, string>

export function CategoryTable() {
  const { accessToken, user } = useAuth()
  const logoutOnUnauthorized = useLogoutOnUnauthorized()
  const {
    businessTypes,
    pagination,
    page,
    search,
    isLoading,
    error,
    setPage,
    setSearch,
    reload,
  } = useBusinessTypes(accessToken, logoutOnUnauthorized)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryTableItem | null>(null)
  const [viewingBusinessTypeId, setViewingBusinessTypeId] = useState<string | null>(null)
  const canCreateCategory = canAccessPermission(user, 'businesses.categories.create')
  const viewingBusinessType = businessTypes.find((businessType) => businessType.id === viewingBusinessTypeId) ?? null

  async function toggleStatus(category: CategoryTableItem) {
    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    const nextStatus = !category.is_active
    const action = nextStatus ? 'activar' : 'inactivar'
    const result = await Swal.fire({
      title: `${nextStatus ? 'Activar' : 'Inactivar'} categoria`,
      text: `Seguro que quieres ${action} ${category.category}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Si, ${action}`,
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      await updateBusinessCategoryStatusRequest(category.business_type_id, category.id, nextStatus, { accessToken })
      await Swal.fire(nextStatus ? 'Categoria activada' : 'Categoria inactivada', 'El estado fue actualizado.', 'success')
      await reload()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo actualizar', getCategoryErrorMessage(requestError), 'error')
    }
  }

  return (
    <section className="category-page" aria-labelledby="categories-title">
      <header className="category-page__header">
        <div>
          <p>Business</p>
          <h2 id="categories-title">Categories</h2>
        </div>
        <div className="category-header-actions">
          <button className="secondary-button" type="button" onClick={() => void reload()}>
            <FiRefreshCw aria-hidden="true" />
            Refresh
          </button>
          {canCreateCategory ? (
            <button className="primary-action" type="button" onClick={() => setCreatingCategory(true)}>
              <FiPlus aria-hidden="true" />
              Add category
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
            placeholder="Category or business type"
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
              <th>Categories</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7}>Loading business types...</td>
              </tr>
            ) : null}
            {!isLoading && businessTypes.length === 0 ? (
              <tr>
                <td colSpan={7}>No business types found.</td>
              </tr>
            ) : null}
            {businessTypes.map((businessType) => (
              <tr key={businessType.id}>
                <td>{businessType.id}</td>
                <td>{businessType.business_type}</td>
                <td>{businessType.short_description}</td>
                <td>{businessType.categories.length}</td>
                <td>{businessType.is_active ? 'Active' : 'Inactive'}</td>
                <td>{formatDate(businessType.created_at)}</td>
                <td>
                  <div className="category-actions">
                    <IconAction
                      label="Show categories"
                      tooltipId={`show-categories-${businessType.id}`}
                      onClick={() => setViewingBusinessTypeId(businessType.id)}
                    >
                      <FiList aria-hidden="true" />
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

      {viewingBusinessType ? (
        <BusinessTypeCategoriesModal
          businessType={viewingBusinessType}
          onClose={() => setViewingBusinessTypeId(null)}
          onEditCategory={setEditingCategory}
          onToggleStatus={(category) => void toggleStatus(category)}
        />
      ) : null}
      {creatingCategory ? (
        <CategoryFormModal
          businessTypes={businessTypes}
          title="Add category"
          onClose={() => setCreatingCategory(false)}
          onSaved={() => void reload()}
        />
      ) : null}
      {editingCategory ? (
        <CategoryFormModal
          businessTypes={businessTypes}
          category={editingCategory}
          title="Edit category"
          onClose={() => setEditingCategory(null)}
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

function BusinessTypeCategoriesModal({
  businessType,
  onClose,
  onEditCategory,
  onToggleStatus,
}: {
  businessType: BusinessType
  onClose: () => void
  onEditCategory: (category: CategoryTableItem) => void
  onToggleStatus: (category: CategoryTableItem) => void
}) {
  const categories = businessType.categories.map((category) => ({
    ...category,
    business_type: businessType.business_type,
    business_type_description: businessType.short_description,
  }))

  return (
    <div className="category-modal-backdrop" role="presentation">
      <section className="category-modal category-modal--wide" role="dialog" aria-modal="true" aria-labelledby="business-type-categories-title">
        <header className="category-modal__header">
          <div>
            <p>Business type</p>
            <h3 id="business-type-categories-title">{businessType.business_type}</h3>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>
            Close
          </button>
        </header>

        <p className="category-modal-description">{businessType.short_description}</p>

        <div className="category-table-shell">
          <table className="category-table category-table--compact">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>IVA tax value</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6}>No categories found for this business type.</td>
                </tr>
              ) : null}
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.id}</td>
                  <td>{category.category}</td>
                  <td>{formatTaxValue(category.iva_tax_value)}%</td>
                  <td>{category.is_active ? 'Active' : 'Inactive'}</td>
                  <td>{formatDate(category.created_at)}</td>
                  <td>
                    <div className="category-actions">
                      <IconAction
                        label="Edit category"
                        tooltipId={`modal-edit-category-${category.id}`}
                        onClick={() => onEditCategory(category)}
                      >
                        <FiEdit2 aria-hidden="true" />
                      </IconAction>
                      <IconAction
                        label={category.is_active ? 'Inactivate category' : 'Activate category'}
                        tooltipId={`modal-status-category-${category.id}`}
                        onClick={() => onToggleStatus(category)}
                      >
                        {category.is_active ? <FiSlash aria-hidden="true" /> : <FiUnlock aria-hidden="true" />}
                      </IconAction>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function CategoryFormModal({
  businessTypes,
  category,
  title,
  onClose,
  onSaved,
}: {
  businessTypes: BusinessType[]
  category?: CategoryTableItem
  title: string
  onClose: () => void
  onSaved: () => void
}) {
  const { accessToken } = useAuth()
  const logoutOnUnauthorized = useLogoutOnUnauthorized()
  const {
    businessTypes: businessTypeOptions,
    isLoading: isLoadingBusinessTypeOptions,
    error: businessTypeOptionsError,
  } = useBusinessTypes(accessToken, logoutOnUnauthorized, { limit: 100 })
  const availableBusinessTypes = businessTypeOptions.length > 0 ? businessTypeOptions : businessTypes
  const [businessTypeId, setBusinessTypeId] = useState(category?.business_type_id ?? '')
  const [form, setForm] = useState<CreateBusinessCategoryPayload>({
    category: category?.category ?? '',
    iva_tax_value: category?.iva_tax_value ?? '',
  })
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const errors = useMemo(() => validateCategoryForm(form, businessTypeId, submitAttempted), [businessTypeId, form, submitAttempted])

  useEffect(() => {
    if (!category && !businessTypeId && availableBusinessTypes[0]) {
      setBusinessTypeId(availableBusinessTypes[0].id)
    }
  }, [availableBusinessTypes, businessTypeId, category])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitAttempted(true)

    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    const submitErrors = validateCategoryForm(form, businessTypeId, true)
    if (Object.keys(submitErrors).length > 0) {
      await Swal.fire('Formulario incompleto', 'Revisa los campos marcados en rojo.', 'warning')
      return
    }

    setIsSaving(true)

    try {
      const payload = normalizeCategoryPayload(form)

      if (category) {
        await updateBusinessCategoryRequest(category.business_type_id, category.id, payload, { accessToken })
      } else {
        await createBusinessCategoryRequest(businessTypeId, payload, { accessToken })
      }

      await Swal.fire(category ? 'Categoria actualizada' : 'Categoria creada', 'Los cambios fueron guardados.', 'success')
      onSaved()
      onClose()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo guardar', getCategoryErrorMessage(requestError), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="category-modal-backdrop category-modal-backdrop--form" role="presentation">
      <section className="category-modal category-modal--form" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
        <header className="category-modal__header">
          <div>
            <p>Business category</p>
            <h3 id="category-modal-title">{title}</h3>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
        </header>
        <form className="category-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <BusinessTypeCombobox
              value={businessTypeId}
              options={availableBusinessTypes}
              disabled={Boolean(category)}
              isLoading={isLoadingBusinessTypeOptions}
              loadError={businessTypeOptionsError}
              error={errors.businessTypeId}
              onChange={setBusinessTypeId}
            />
            <TextInput
              label="Category"
              value={form.category}
              required
              error={errors.category}
              onChange={(value) => updateField('category', value)}
            />
            <TextInput
              label="IVA tax value"
              value={form.iva_tax_value}
              required
              error={errors.iva_tax_value}
              onChange={(value) => updateField('iva_tax_value', value)}
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

  function updateField(field: keyof CreateBusinessCategoryPayload, value: string) {
    setForm((current) => ({
      ...current,
      [field]: sanitizeCategoryFormValue(field, value),
    }))
  }
}

function BusinessTypeCombobox({
  value,
  options,
  disabled = false,
  isLoading = false,
  loadError,
  error,
  onChange,
}: {
  value: string
  options: BusinessType[]
  disabled?: boolean
  isLoading?: boolean
  loadError?: string | null
  error?: string
  onChange: (value: string) => void
}) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const selectedType = options.find((type) => type.id === value)
  const normalizedSearch = search.trim().toLowerCase()
  const filteredTypes = options.filter((type) => {
    const searchableValue = `${type.business_type} ${type.short_description}`.toLowerCase()

    return searchableValue.includes(normalizedSearch)
  })

  function handleSelect(nextValue: string) {
    onChange(nextValue)
    setSearch('')
    setIsOpen(false)
  }

  return (
    <div className="input-field category-business-type-field">
      <span>Business type</span>
      <div className="category-business-type-combobox">
        <input
          type="search"
          value={isOpen && !disabled ? search : selectedType?.business_type ?? ''}
          disabled={disabled}
          required={!value}
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-invalid={Boolean(error)}
          placeholder="Search business type"
          onBlur={() => setIsOpen(false)}
          onChange={(event) => {
            setSearch(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            if (!disabled) {
              setSearch('')
              setIsOpen(true)
            }
          }}
        />
        {isOpen && !disabled ? (
          <div className="category-business-type-options" role="listbox">
            {isLoading ? <p className="category-business-type-empty">Loading business types...</p> : null}
            {!isLoading && filteredTypes.length > 0
              ? filteredTypes.map((type) => (
                  <button
                    className="category-business-type-option"
                    key={type.id}
                    type="button"
                    role="option"
                    aria-selected={type.id === value}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(type.id)}
                  >
                    <strong>{type.business_type}</strong>
                    <small>{type.short_description}</small>
                  </button>
                ))
              : null}
            {!isLoading && filteredTypes.length === 0 ? (
              <p className="category-business-type-empty">No business types found.</p>
            ) : null}
          </div>
        ) : null}
      </div>
      {loadError ? <small className="field-error">{loadError}</small> : null}
      {error ? <small className="field-error">{error}</small> : null}
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

function getPlaceholder(label: string) {
  const examples: Record<string, string> = {
    Category: 'Ej: Restaurants',
    'IVA tax value': 'Ej: 12.00',
  }

  return examples[label] ?? 'Escribe un valor'
}

function validateCategoryForm(form: CreateBusinessCategoryPayload, businessTypeId: string, includeRequired: boolean) {
  const errors: ValidationErrors = {}

  if (!businessTypeId && includeRequired) {
    errors.businessTypeId = 'Business type es obligatorio.'
  }

  validateText(errors, 'category', form.category, {
    includeRequired,
    label: 'Category',
    pattern: /^[\p{L}0-9 .,_/-]+$/u,
    message: 'Solo letras, numeros y puntuacion basica.',
  })
  validateTaxValue(errors, 'iva_tax_value', form.iva_tax_value, includeRequired)

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

function validateTaxValue(errors: ValidationErrors, path: string, value: string, includeRequired: boolean) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    if (includeRequired) {
      errors[path] = 'IVA tax value es obligatorio.'
    }
    return
  }

  if (!/^\d+(?:\.\d{1,2})?$/.test(trimmedValue)) {
    errors[path] = 'Usa un numero con maximo 2 decimales.'
  }
}

function sanitizeCategoryFormValue(field: keyof CreateBusinessCategoryPayload, value: string) {
  if (field === 'iva_tax_value') {
    return value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 12)
  }

  return value.replace(/[^\p{L}0-9 .,_/-]/gu, '').slice(0, 255)
}

function normalizeCategoryPayload(form: CreateBusinessCategoryPayload) {
  return {
    category: form.category.trim(),
    iva_tax_value: formatTaxValue(form.iva_tax_value),
  }
}

function formatTaxValue(value: string) {
  const numericValue = Number(value)

  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : value
}

function canAccessPermission(user: ReturnType<typeof useAuth>['user'], permission: string) {
  return Boolean(user?.hasAllPermissions || user?.permissions.includes(permission))
}

function getCategoryErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Revisa tu conexion e intenta nuevamente.'
  }

  return error.message
}
