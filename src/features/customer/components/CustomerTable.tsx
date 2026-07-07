import { useState, type FormEvent } from 'react'
import { FiEdit2, FiRefreshCw } from 'react-icons/fi'
import Swal from 'sweetalert2'
import { useAuth } from '../../auth/hooks/useAuth'
import { useCustomers } from '../hooks/useCustomers'
import { updateCustomerRequest } from '../services/customerApi'
import type {
  CustomerAggregate,
  CustomerContact,
  UpdateCustomerPayload,
} from '../types/customer.types'
import './CustomerComponents.css'

type ValidationErrors = Record<string, string>

type EditState = {
  customer: {
    identification: string
    first_name: string
    last_name: string
    country: string
    city: string
    is_active: boolean
  }
  customer_contact: CustomerContact
}

export function CustomerTable() {
  const { accessToken } = useAuth()
  const { customers, pagination, page, search, isLoading, error, setPage, setSearch, reload } =
    useCustomers(accessToken)
  const [editingCustomer, setEditingCustomer] = useState<CustomerAggregate | null>(null)

  return (
    <section className="customer-page" aria-labelledby="customer-view-title">
      <header className="customer-page__header">
        <div>
          <p>Customer</p>
          <h2 id="customer-view-title">View customers</h2>
        </div>
        <button className="secondary-button" type="button" onClick={() => void reload()}>
          <FiRefreshCw aria-hidden="true" />
          Refresh
        </button>
      </header>

      <div className="table-toolbar">
        <label className="input-field table-search">
          <span>Search</span>
          <input
            type="search"
            value={search}
            maxLength={120}
            placeholder="Customer, business or tenant"
            onChange={(event) => {
              setPage(1)
              setSearch(event.target.value)
            }}
          />
        </label>
      </div>

      {error ? <p className="form-alert">{error}</p> : null}

      <div className="table-shell">
        <table className="customer-table">
          <thead>
            <tr>
              <th>Identification</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Business</th>
              <th>Location</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7}>Loading customers...</td>
              </tr>
            ) : null}
            {!isLoading && customers.length === 0 ? (
              <tr>
                <td colSpan={7}>No customers found.</td>
              </tr>
            ) : null}
            {customers.map((item) => {
              const firstBusiness = item.businesses[0]
              const customerName = `${item.customer.first_name} ${item.customer.last_name}`.trim()

              return (
                <tr key={item.customer.id}>
                  <td>{item.customer.identification}</td>
                  <td>{customerName}</td>
                  <td>
                    <span>{item.customer_contact.email}</span>
                    <small>{item.customer_contact.mobile_phone_number}</small>
                  </td>
                  <td>
                    <span>{firstBusiness?.business.the_name ?? 'N/A'}</span>
                    <small>{firstBusiness?.business.tenant_name ?? 'N/A'}</small>
                  </td>
                  <td>
                    <span>{item.customer.city}</span>
                    <small>{item.customer.country}</small>
                  </td>
                  <td>{item.customer.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button className="table-action" type="button" onClick={() => setEditingCustomer(item)}>
                      <FiEdit2 aria-hidden="true" />
                      Edit
                    </button>
                  </td>
                </tr>
              )
            })}
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

      {editingCustomer ? (
        <CustomerEditModal
          customerAggregate={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSaved={() => {
            setEditingCustomer(null)
            void reload()
          }}
        />
      ) : null}
    </section>
  )
}

function CustomerEditModal({
  customerAggregate,
  onClose,
  onSaved,
}: {
  customerAggregate: CustomerAggregate
  onClose: () => void
  onSaved: () => void
}) {
  const { accessToken } = useAuth()
  const [form, setForm] = useState<EditState>(() => toEditState(customerAggregate))
  const [isSaving, setIsSaving] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const validationErrors = validateEditForm(form, submitAttempted)

  function requestClose() {
    setIsClosing(true)
    window.setTimeout(onClose, 180)
  }

  function updateCustomer(field: keyof EditState['customer'], value: string | boolean) {
    const nextValue = typeof value === 'string' ? sanitizeCustomerValue(field, value) : value

    setForm((current) => ({
      ...current,
      customer: {
        ...current.customer,
        [field]: nextValue,
      },
    }))
  }

  function updateContact(field: keyof CustomerContact, value: string) {
    const nextValue = sanitizeContactValue(field, value)

    setForm((current) => ({
      ...current,
      customer_contact: {
        ...current.customer_contact,
        [field]: nextValue,
      },
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitAttempted(true)

    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    const submitErrors = validateEditForm(form, true)

    if (Object.keys(submitErrors).length > 0) {
      await Swal.fire('Formulario incompleto', 'Revisa los campos marcados en rojo antes de guardar.', 'warning')
      return
    }

    setIsSaving(true)

    try {
      await updateCustomerRequest(customerAggregate.customer.id, toUpdatePayload(form), { accessToken })
      await Swal.fire('Customer actualizado', 'Los cambios fueron guardados.', 'success')
      onSaved()
    } catch (error) {
      await Swal.fire(
        'No se pudo guardar',
        error instanceof Error ? error.message : 'Revisa los datos e intenta nuevamente.',
        'error',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={`modal-backdrop ${isClosing ? 'modal-backdrop--closing' : ''}`} role="presentation">
      <section
        className={`edit-modal ${isClosing ? 'edit-modal--closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-customer-title"
      >
        <header className="edit-modal__header">
          <div>
            <p>Action</p>
            <h3 id="edit-customer-title">Edit customer</h3>
          </div>
          <button className="secondary-button" type="button" onClick={requestClose}>
            Cancel
          </button>
        </header>

        <form className="customer-form" onSubmit={handleSubmit}>
          <fieldset className="form-section">
            <legend>Customer</legend>
            <div className="form-grid">
              <TextInput label="Identification" value={form.customer.identification} required error={validationErrors['customer.identification']} onChange={(value) => updateCustomer('identification', value)} />
              <TextInput label="First name" value={form.customer.first_name} required error={validationErrors['customer.first_name']} onChange={(value) => updateCustomer('first_name', value)} />
              <TextInput label="Last name" value={form.customer.last_name} required error={validationErrors['customer.last_name']} onChange={(value) => updateCustomer('last_name', value)} />
              <TextInput label="Country" value={form.customer.country} required error={validationErrors['customer.country']} onChange={(value) => updateCustomer('country', value)} />
              <TextInput label="City" value={form.customer.city} required error={validationErrors['customer.city']} onChange={(value) => updateCustomer('city', value)} />
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={form.customer.is_active}
                  onChange={(event) => updateCustomer('is_active', event.target.checked)}
                />
                Active customer
              </label>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Customer contact</legend>
            <div className="form-grid">
              <TextInput label="Mobile phone" value={form.customer_contact.mobile_phone_number} required error={validationErrors['customer_contact.mobile_phone_number']} onChange={(value) => updateContact('mobile_phone_number', value)} />
              <TextInput label="Base phone" value={form.customer_contact.base_phone_number} required error={validationErrors['customer_contact.base_phone_number']} onChange={(value) => updateContact('base_phone_number', value)} />
              <TextInput label="Email" type="email" value={form.customer_contact.email} required error={validationErrors['customer_contact.email']} onChange={(value) => updateContact('email', value)} />
            </div>
          </fieldset>

          <div className="form-actions">
            <button className="secondary-button" type="button" onClick={requestClose}>
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
  type = 'text',
  required = false,
  error,
  onChange,
}: {
  label: string
  value: string
  type?: string
  required?: boolean
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="input-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        aria-invalid={Boolean(error)}
        placeholder={getPlaceholder(label, type)}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  )
}

function getPlaceholder(label: string, type: string) {
  const examples: Record<string, string> = {
    Identification: 'Ej: 0999999999',
    'First name': 'Ej: Ada',
    'Last name': 'Ej: Lovelace',
    Country: 'Ej: Ecuador',
    City: 'Ej: Quito',
    'Mobile phone': 'Ej: 0988888888',
    'Base phone': 'Ej: 022222222 o N/A',
    Email: 'Ej: new-email@example.com',
  }

  return examples[label] ?? (type === 'email' ? 'Ej: user@example.com' : 'Escribe un valor')
}

function toEditState(customerAggregate: CustomerAggregate): EditState {
  return {
    customer: {
      identification: customerAggregate.customer.identification,
      first_name: customerAggregate.customer.first_name,
      last_name: customerAggregate.customer.last_name,
      country: customerAggregate.customer.country,
      city: customerAggregate.customer.city,
      is_active: customerAggregate.customer.is_active,
    },
    customer_contact: { ...customerAggregate.customer_contact },
  }
}

function toUpdatePayload(form: EditState): UpdateCustomerPayload {
  return {
    customer: {
      ...form.customer,
      identification: form.customer.identification.trim().toUpperCase(),
    },
    customer_contact: {
      ...form.customer_contact,
      email: form.customer_contact.email.trim().toLowerCase(),
    },
  }
}

function validateEditForm(form: EditState, includeRequired: boolean): ValidationErrors {
  const errors: ValidationErrors = {}

  validateText(errors, 'customer.identification', form.customer.identification, {
    includeRequired,
    label: 'Identification',
    pattern: /^[A-Za-z0-9]{1,15}$/,
    message: 'Solo letras y digitos, maximo 15 caracteres.',
  })
  validateLetters(errors, 'customer.first_name', form.customer.first_name, includeRequired, 'First name')
  validateLetters(errors, 'customer.last_name', form.customer.last_name, includeRequired, 'Last name')
  validateLetters(errors, 'customer.country', form.customer.country, includeRequired, 'Country')
  validateLetters(errors, 'customer.city', form.customer.city, includeRequired, 'City')
  validatePhone(errors, 'customer_contact.mobile_phone_number', form.customer_contact.mobile_phone_number, includeRequired)
  validateBasePhone(errors, 'customer_contact.base_phone_number', form.customer_contact.base_phone_number, includeRequired)
  validateEmail(errors, 'customer_contact.email', form.customer_contact.email, includeRequired)

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

function validateLetters(
  errors: ValidationErrors,
  path: string,
  value: string,
  includeRequired: boolean,
  label: string,
) {
  validateText(errors, path, value, {
    includeRequired,
    label,
    pattern: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/,
    message: 'Solo se permiten letras y espacios.',
  })
}

function validatePhone(
  errors: ValidationErrors,
  path: string,
  value: string,
  includeRequired: boolean,
  label = 'Mobile phone',
) {
  validateText(errors, path, value, {
    includeRequired,
    label,
    pattern: /^\d{1,15}$/,
    message: 'Solo digitos, maximo 15.',
  })
}

function validateBasePhone(errors: ValidationErrors, path: string, value: string, includeRequired: boolean) {
  validateText(errors, path, value, {
    includeRequired,
    label: 'Base phone',
    pattern: /^(N\/A|\d{1,15})$/,
    message: 'Usa N/A o solo digitos, maximo 15.',
  })
}

function validateEmail(errors: ValidationErrors, path: string, value: string, includeRequired: boolean) {
  validateText(errors, path, value, {
    includeRequired,
    label: 'Email',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    message: 'Ingresa un email valido.',
  })
}

function sanitizeCustomerValue(field: keyof EditState['customer'], value: string) {
  if (field === 'identification') {
    return value.replace(/[^A-Za-z0-9]/g, '').slice(0, 15)
  }

  if (['first_name', 'last_name', 'country', 'city'].includes(field)) {
    return onlyLetters(value)
  }

  return value
}

function sanitizeContactValue(field: keyof CustomerContact, value: string) {
  if (field === 'mobile_phone_number') {
    return onlyDigits(value, 15)
  }

  if (field === 'base_phone_number') {
    return sanitizeBasePhone(value)
  }

  return value
}

function onlyLetters(value: string) {
  return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü ]/g, '')
}

function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, '').slice(0, maxLength)
}

function sanitizeBasePhone(value: string) {
  const upperValue = value.toUpperCase()

  if ('N/A'.startsWith(upperValue)) {
    return upperValue
  }

  return onlyDigits(value, 15)
}
