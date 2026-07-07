import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import Swal from 'sweetalert2'
import { useAuth } from '../../auth/hooks/useAuth'
import { useBusinessModules } from '../hooks/useBusinessModules'
import { createCustomerRequest } from '../services/customerApi'
import type { BusinessUserPayload, CreateCustomerPayload } from '../types/customer.types'
import { CustomerApiError } from '../types/customer.types'
import './CustomerComponents.css'

const emptyUser: BusinessUserPayload = {
  first_name: '',
  last_name: '',
  user_name: '',
  user_password: '',
  rol: 'Admin',
}

const initialForm: CreateCustomerPayload = {
  customer: {
    identification: '',
    first_name: '',
    last_name: '',
    country: 'Ecuador',
    city: '',
    is_active: true,
  },
  customer_contact: {
    mobile_phone_number: '',
    base_phone_number: 'N/A',
    email: '',
  },
  business: {
    ruc: '',
    the_name: '',
    business_type: '',
    website: '',
    is_official_ruc: true,
    tenant_name: '',
  },
  business_location: {
    country: 'Ecuador',
    city: '',
    province: '',
    address1: '',
    address2: 'N/A',
  },
  business_contact: {
    mobile_phone_number: '',
    base_phone_number: '',
    email: '',
  },
  business_module: [],
  business_user: [{ ...emptyUser }],
  subscription: {
    subscription_type: 'TRIAL',
    trial_days: 21,
    monthly_payment: 0,
    how_many_users: 1,
    admin_user: 1,
    general_user: 0,
  },
}

type FieldSection = keyof Pick<
  CreateCustomerPayload,
  'customer' | 'customer_contact' | 'business' | 'business_location' | 'business_contact' | 'subscription'
>

export function CustomerCreateForm() {
  const { accessToken } = useAuth()
  const { modules, isLoading: isLoadingModules, error: modulesError } = useBusinessModules(accessToken)
  const [form, setForm] = useState<CreateCustomerPayload>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedModuleCount = form.business_module.length
  const userLimitMatches = useMemo(
    () => form.subscription.how_many_users === form.subscription.admin_user + form.subscription.general_user,
    [form.subscription.admin_user, form.subscription.general_user, form.subscription.how_many_users],
  )

  function updateSectionField(section: FieldSection, field: string, value: string | number | boolean) {
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }))
  }

  function updateUser(index: number, field: keyof BusinessUserPayload, value: string) {
    setForm((current) => ({
      ...current,
      business_user: current.business_user.map((user, userIndex) =>
        userIndex === index ? { ...user, [field]: value } : user,
      ),
    }))
  }

  function addUser() {
    setForm((current) => ({
      ...current,
      business_user: [...current.business_user, { ...emptyUser, rol: 'General' }],
    }))
  }

  function removeUser(index: number) {
    setForm((current) => ({
      ...current,
      business_user:
        current.business_user.length === 1
          ? current.business_user
          : current.business_user.filter((_, userIndex) => userIndex !== index),
    }))
  }

  function toggleModule(moduleId: string, isChecked: boolean) {
    const numericModuleId = Number(moduleId)

    setForm((current) => ({
      ...current,
      business_module: isChecked
        ? [...new Set([...current.business_module, numericModuleId])]
        : current.business_module.filter((id) => id !== numericModuleId),
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    if (!userLimitMatches) {
      await Swal.fire(
        'Usuarios invalidos',
        'El total de usuarios debe ser igual a admin_user + general_user.',
        'warning',
      )
      return
    }

    if (form.business_module.length === 0) {
      await Swal.fire('Modulos requeridos', 'Selecciona al menos un modulo para el business.', 'warning')
      return
    }

    setIsSubmitting(true)

    try {
      await createCustomerRequest(normalizeCreatePayload(form), { accessToken })
      await Swal.fire('Customer creado', 'La creacion completa fue procesada correctamente.', 'success')
      setForm(initialForm)
    } catch (error) {
      await Swal.fire('No se pudo crear', getCustomerErrorMessage(error), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="customer-page" aria-labelledby="customer-create-title">
      <header className="customer-page__header">
        <div>
          <p>Customer</p>
          <h2 id="customer-create-title">Create customer</h2>
        </div>
        <span>{selectedModuleCount} modulos seleccionados</span>
      </header>

      <form className="customer-form" onSubmit={handleSubmit}>
        <fieldset className="form-section">
          <legend>Customer</legend>
          <div className="form-grid">
            <TextInput label="Identification" value={form.customer.identification} required onChange={(value) => updateSectionField('customer', 'identification', value)} />
            <TextInput label="First name" value={form.customer.first_name} required onChange={(value) => updateSectionField('customer', 'first_name', value)} />
            <TextInput label="Last name" value={form.customer.last_name} required onChange={(value) => updateSectionField('customer', 'last_name', value)} />
            <TextInput label="Country" value={form.customer.country} required onChange={(value) => updateSectionField('customer', 'country', value)} />
            <TextInput label="City" value={form.customer.city} required onChange={(value) => updateSectionField('customer', 'city', value)} />
            <label className="check-field">
              <input
                type="checkbox"
                checked={form.customer.is_active}
                onChange={(event) => updateSectionField('customer', 'is_active', event.target.checked)}
              />
              Active customer
            </label>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Customer contact</legend>
          <div className="form-grid">
            <TextInput label="Mobile phone" value={form.customer_contact.mobile_phone_number} required onChange={(value) => updateSectionField('customer_contact', 'mobile_phone_number', value)} />
            <TextInput label="Base phone" value={form.customer_contact.base_phone_number} required onChange={(value) => updateSectionField('customer_contact', 'base_phone_number', value)} />
            <TextInput label="Email" type="email" value={form.customer_contact.email} required onChange={(value) => updateSectionField('customer_contact', 'email', value)} />
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Business</legend>
          <div className="form-grid">
            <TextInput label="RUC" value={form.business.ruc} required onChange={(value) => updateSectionField('business', 'ruc', value)} />
            <TextInput label="Name" value={form.business.the_name} required onChange={(value) => updateSectionField('business', 'the_name', value)} />
            <TextInput label="Business type" value={form.business.business_type} required onChange={(value) => updateSectionField('business', 'business_type', value)} />
            <TextInput label="Website" type="url" value={form.business.website} required onChange={(value) => updateSectionField('business', 'website', value)} />
            <TextInput label="Tenant name" value={form.business.tenant_name} onChange={(value) => updateSectionField('business', 'tenant_name', value)} />
            <label className="check-field">
              <input
                type="checkbox"
                checked={form.business.is_official_ruc}
                onChange={(event) => updateSectionField('business', 'is_official_ruc', event.target.checked)}
              />
              Official RUC
            </label>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Business location</legend>
          <div className="form-grid">
            <TextInput label="Country" value={form.business_location.country} required onChange={(value) => updateSectionField('business_location', 'country', value)} />
            <TextInput label="City" value={form.business_location.city} required onChange={(value) => updateSectionField('business_location', 'city', value)} />
            <TextInput label="Province" value={form.business_location.province} required onChange={(value) => updateSectionField('business_location', 'province', value)} />
            <TextInput label="Address 1" value={form.business_location.address1} required onChange={(value) => updateSectionField('business_location', 'address1', value)} />
            <TextInput label="Address 2" value={form.business_location.address2} required onChange={(value) => updateSectionField('business_location', 'address2', value)} />
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Business contact</legend>
          <div className="form-grid">
            <TextInput label="Mobile phone" value={form.business_contact.mobile_phone_number} required onChange={(value) => updateSectionField('business_contact', 'mobile_phone_number', value)} />
            <TextInput label="Base phone" value={form.business_contact.base_phone_number} required onChange={(value) => updateSectionField('business_contact', 'base_phone_number', value)} />
            <TextInput label="Email" type="email" value={form.business_contact.email} required onChange={(value) => updateSectionField('business_contact', 'email', value)} />
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Modules</legend>
          {modulesError ? <p className="form-alert">{modulesError}</p> : null}
          <div className="module-grid">
            {isLoadingModules ? <p>Cargando modulos...</p> : null}
            {modules.map((module) => (
              <label className="module-option" key={module.id}>
                <input
                  type="checkbox"
                  checked={form.business_module.includes(Number(module.id))}
                  onChange={(event) => toggleModule(module.id, event.target.checked)}
                />
                <span>
                  <strong>{module.module_name}</strong>
                  <small>{module.module_description}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Business users</legend>
          <div className="user-list">
            {form.business_user.map((user, index) => (
              <div className="user-row" key={index}>
                <TextInput label="First name" value={user.first_name} required onChange={(value) => updateUser(index, 'first_name', value)} />
                <TextInput label="Last name" value={user.last_name} required onChange={(value) => updateUser(index, 'last_name', value)} />
                <TextInput label="Username" value={user.user_name} required onChange={(value) => updateUser(index, 'user_name', value)} />
                <TextInput label="Password" type="password" value={user.user_password} required onChange={(value) => updateUser(index, 'user_password', value)} />
                <label className="input-field">
                  <span>Role</span>
                  <select value={user.rol} onChange={(event) => updateUser(index, 'rol', event.target.value)}>
                    <option value="Admin">Admin</option>
                    <option value="General">General</option>
                  </select>
                </label>
                <button className="icon-action" type="button" aria-label="Remove user" onClick={() => removeUser(index)}>
                  <FiTrash2 aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
          <button className="secondary-button" type="button" onClick={addUser}>
            <FiPlus aria-hidden="true" />
            Add user
          </button>
        </fieldset>

        <fieldset className="form-section">
          <legend>Subscription</legend>
          <div className="form-grid">
            <label className="input-field">
              <span>Type</span>
              <select
                value={form.subscription.subscription_type}
                onChange={(event) => updateSectionField('subscription', 'subscription_type', event.target.value)}
              >
                <option value="TRIAL">TRIAL</option>
                <option value="MONTHLY">MONTHLY</option>
              </select>
            </label>
            <NumberInput label="Trial days" value={form.subscription.trial_days} min={1} max={365} onChange={(value) => updateSectionField('subscription', 'trial_days', value)} />
            <NumberInput label="Monthly payment" value={form.subscription.monthly_payment} min={0} step="0.01" onChange={(value) => updateSectionField('subscription', 'monthly_payment', value)} />
            <NumberInput label="How many users" value={form.subscription.how_many_users} min={1} onChange={(value) => updateSectionField('subscription', 'how_many_users', value)} />
            <NumberInput label="Admin users" value={form.subscription.admin_user} min={0} onChange={(value) => updateSectionField('subscription', 'admin_user', value)} />
            <NumberInput label="General users" value={form.subscription.general_user} min={0} onChange={(value) => updateSectionField('subscription', 'general_user', value)} />
          </div>
          {!userLimitMatches ? <p className="form-alert">how_many_users debe ser igual a admin_user + general_user.</p> : null}
        </fieldset>

        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={() => setForm(initialForm)}>
            Reset
          </button>
          <button className="primary-action" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create customer'}
          </button>
        </div>
      </form>
    </section>
  )
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  type?: string
  required?: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="input-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={getPlaceholder(label, type)}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number | string
  onChange: (value: number) => void
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(Number(event.target.value))
  }

  return (
    <label className="input-field">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        placeholder={getPlaceholder(label, 'number')}
        onChange={handleChange}
      />
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
    'Mobile phone': 'Ej: 0999999999',
    'Base phone': 'Ej: 022222222 o N/A',
    Email: 'Ej: ada@example.com',
    RUC: 'Ej: 0999999999001',
    Name: 'Ej: Comercio Agil',
    'Business type': 'Ej: Retail',
    Website: 'Ej: https://example.com',
    'Tenant name': 'Ej: comercio_agil',
    Province: 'Ej: Pichincha',
    'Address 1': 'Ej: Avenida 10 / Norte',
    'Address 2': 'Ej: Oficina 301 o N/A',
    Username: 'Ej: grace admin',
    Password: 'Ej: Secure-password1',
    'Trial days': 'Ej: 21',
    'Monthly payment': 'Ej: 22.32',
    'How many users': 'Ej: 4',
    'Admin users': 'Ej: 1',
    'General users': 'Ej: 3',
  }

  return examples[label] ?? (type === 'email' ? 'Ej: user@example.com' : 'Escribe un valor')
}

function normalizeCreatePayload(payload: CreateCustomerPayload): CreateCustomerPayload {
  return {
    ...payload,
    customer: {
      ...payload.customer,
      identification: payload.customer.identification.trim().toUpperCase(),
    },
    customer_contact: {
      ...payload.customer_contact,
      email: payload.customer_contact.email.trim().toLowerCase(),
    },
    business: {
      ...payload.business,
      ruc: payload.business.ruc.trim(),
      tenant_name: payload.business.tenant_name.trim(),
    },
    business_contact: {
      ...payload.business_contact,
      email: payload.business_contact.email.trim().toLowerCase(),
    },
  }
}

function getCustomerErrorMessage(error: unknown) {
  if (!(error instanceof CustomerApiError)) {
    return 'Revisa tu conexion e intenta nuevamente.'
  }

  if (error.status === 401) {
    return 'La sesion expiro o el token no es valido.'
  }

  if (error.status === 403) {
    return 'Tu usuario no tiene permisos de administrador.'
  }

  if (error.status === 409) {
    return error.message || 'Ya existe un registro con esos datos.'
  }

  if (error.code === 'VALIDATION_ERROR') {
    return 'Revisa los campos del formulario. El backend rechazo uno o mas valores.'
  }

  return error.message
}
