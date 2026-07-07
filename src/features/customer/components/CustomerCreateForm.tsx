import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { FiKey, FiPlus, FiTrash2 } from 'react-icons/fi'
import Swal from 'sweetalert2'
import { useAuth } from '../../auth/hooks/useAuth'
import { useBusinessModules } from '../hooks/useBusinessModules'
import { createCustomerRequest } from '../services/customerApi'
import type {
  BusinessUserPayload,
  CreateBusinessPayload,
  CreateCustomerPayload,
} from '../types/customer.types'
import { CustomerApiError } from '../types/customer.types'
import './CustomerComponents.css'

const emptyUser: BusinessUserPayload = {
  first_name: '',
  last_name: '',
  user_name: '',
  user_password: '',
  rol: 'Admin',
}

type ValidationErrors = Record<string, string>

function createEmptyBusiness(): CreateBusinessPayload {
  return {
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
      monthly_payment: 35,
      how_many_users: 2,
      admin_user: 1,
      general_user: 1,
    },
  }
}

function createInitialForm(): CreateCustomerPayload {
  return {
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
    businesses: [createEmptyBusiness()],
  }
}

type CustomerSection = 'customer' | 'customer_contact'
type BusinessSection =
  | 'business'
  | 'business_location'
  | 'business_contact'
  | 'subscription'

export function CustomerCreateForm() {
  const { accessToken } = useAuth()
  const { modules, isLoading: isLoadingModules, error: modulesError } = useBusinessModules(accessToken)
  const [form, setForm] = useState<CreateCustomerPayload>(() => createInitialForm())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const selectedModuleCount = form.businesses.reduce(
    (count, business) => count + business.business_module.length,
    0,
  )
  const userLimitsMatch = useMemo(
    () =>
      form.businesses.every(
        (business) =>
          business.subscription.how_many_users ===
          business.subscription.admin_user + business.subscription.general_user,
      ),
    [form.businesses],
  )
  const validationErrors = useMemo(() => validateCreateForm(form, submitAttempted), [form, submitAttempted])

  function updateCustomerField(section: CustomerSection, field: string, value: string | boolean) {
    const nextValue = typeof value === 'string' ? sanitizeCustomerValue(section, field, value) : value

    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: nextValue,
      },
    }))
  }

  function updateBusinessField(
    businessIndex: number,
    section: BusinessSection,
    field: string,
    value: string | number | boolean,
  ) {
    const nextValue = typeof value === 'string' ? sanitizeBusinessValue(section, field, value) : value

    setForm((current) => ({
      ...current,
      businesses: current.businesses.map((business, index) =>
        index === businessIndex
          ? {
              ...business,
              [section]: {
                ...business[section],
                [field]: nextValue,
                ...(section === 'business' && field === 'the_name' && typeof nextValue === 'string'
                  ? { tenant_name: toTenantName(nextValue) }
                  : {}),
              },
            }
          : business,
      ),
    }))
  }

  function updateUser(businessIndex: number, userIndex: number, field: keyof BusinessUserPayload, value: string) {
    const nextValue = sanitizeUserValue(field, value)

    setForm((current) => ({
      ...current,
      businesses: current.businesses.map((business, index) =>
        index === businessIndex
          ? {
              ...business,
              business_user: business.business_user.map((user, currentUserIndex) =>
                currentUserIndex === userIndex ? { ...user, [field]: nextValue } : user,
              ),
            }
          : business,
      ),
    }))
  }

  function addBusiness() {
    setForm((current) => ({
      ...current,
      businesses: [...current.businesses, createEmptyBusiness()],
    }))
  }

  function removeBusiness(businessIndex: number) {
    setForm((current) => ({
      ...current,
      businesses:
        current.businesses.length === 1
          ? current.businesses
          : current.businesses.filter((_, index) => index !== businessIndex),
    }))
  }

  function addUser(businessIndex: number) {
    setForm((current) => ({
      ...current,
      businesses: current.businesses.map((business, index) =>
        index === businessIndex
          ? {
              ...business,
              business_user: [...business.business_user, { ...emptyUser, rol: 'General' }],
            }
          : business,
      ),
    }))
  }

  function generatePassword(businessIndex: number, userIndex: number) {
    updateUser(businessIndex, userIndex, 'user_password', createSecurePassword())
  }

  function removeUser(businessIndex: number, userIndex: number) {
    setForm((current) => ({
      ...current,
      businesses: current.businesses.map((business, index) =>
        index === businessIndex
          ? {
              ...business,
              business_user:
                business.business_user.length === 1
                  ? business.business_user
                  : business.business_user.filter((_, currentUserIndex) => currentUserIndex !== userIndex),
            }
          : business,
      ),
    }))
  }

  function toggleModule(businessIndex: number, moduleId: string, isChecked: boolean) {
    const numericModuleId = Number(moduleId)

    setForm((current) => ({
      ...current,
      businesses: current.businesses.map((business, index) =>
        index === businessIndex
          ? {
              ...business,
              business_module: isChecked
                ? [...new Set([...business.business_module, numericModuleId])]
                : business.business_module.filter((id) => id !== numericModuleId),
            }
          : business,
      ),
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitAttempted(true)

    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    const submitErrors = validateCreateForm(form, true)

    if (Object.keys(submitErrors).length > 0) {
      await Swal.fire('Formulario incompleto', 'Revisa los campos marcados en rojo antes de enviar.', 'warning')
      return
    }

    if (!userLimitsMatch) {
      await Swal.fire(
        'Usuarios invalidos',
        'En cada business, how_many_users debe ser igual a admin_user + general_user.',
        'warning',
      )
      return
    }

    if (form.businesses.some((business) => business.business_module.length === 0)) {
      await Swal.fire('Modulos requeridos', 'Selecciona al menos un modulo por business.', 'warning')
      return
    }

    setIsSubmitting(true)

    try {
      await createCustomerRequest(normalizeCreatePayload(form), { accessToken })
      await Swal.fire('Customer creado', 'La creacion completa fue procesada correctamente.', 'success')
      setForm(createInitialForm())
      setSubmitAttempted(false)
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
        <span>
          {form.businesses.length} business / {selectedModuleCount} modulos
        </span>
      </header>

      <form className="customer-form" onSubmit={handleSubmit}>
        <fieldset className="form-section">
          <legend>Customer</legend>
          <div className="form-grid">
            <TextInput label="Identification" value={form.customer.identification} required error={validationErrors['customer.identification']} onChange={(value) => updateCustomerField('customer', 'identification', value)} />
            <TextInput label="First name" value={form.customer.first_name} required error={validationErrors['customer.first_name']} onChange={(value) => updateCustomerField('customer', 'first_name', value)} />
            <TextInput label="Last name" value={form.customer.last_name} required error={validationErrors['customer.last_name']} onChange={(value) => updateCustomerField('customer', 'last_name', value)} />
            <TextInput label="Country" value={form.customer.country} required error={validationErrors['customer.country']} onChange={(value) => updateCustomerField('customer', 'country', value)} />
            <TextInput label="City" value={form.customer.city} required error={validationErrors['customer.city']} onChange={(value) => updateCustomerField('customer', 'city', value)} />
            <label className="check-field">
              <input
                type="checkbox"
                checked={form.customer.is_active}
                onChange={(event) => updateCustomerField('customer', 'is_active', event.target.checked)}
              />
              Active customer
            </label>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Customer contact</legend>
          <div className="form-grid">
            <TextInput label="Mobile phone" value={form.customer_contact.mobile_phone_number} required error={validationErrors['customer_contact.mobile_phone_number']} onChange={(value) => updateCustomerField('customer_contact', 'mobile_phone_number', value)} />
            <TextInput label="Base phone" value={form.customer_contact.base_phone_number} required error={validationErrors['customer_contact.base_phone_number']} onChange={(value) => updateCustomerField('customer_contact', 'base_phone_number', value)} />
            <TextInput label="Email" type="email" value={form.customer_contact.email} required error={validationErrors['customer_contact.email']} onChange={(value) => updateCustomerField('customer_contact', 'email', value)} />
          </div>
        </fieldset>

        <div className="business-stack">
          {form.businesses.map((businessItem, businessIndex) => {
            const businessLimitMatches =
              businessItem.subscription.how_many_users ===
              businessItem.subscription.admin_user + businessItem.subscription.general_user
            const businessPath = (path: string) => `businesses.${businessIndex}.${path}`

            return (
              <section className="business-card" key={businessIndex}>
                <header className="business-card__header">
                  <div>
                    <p>Business #{businessIndex + 1}</p>
                    <h3>{businessItem.business.the_name || 'New business'}</h3>
                  </div>
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={form.businesses.length === 1}
                    onClick={() => removeBusiness(businessIndex)}
                  >
                    <FiTrash2 aria-hidden="true" />
                    Remove business
                  </button>
                </header>

                <fieldset className="form-section">
                  <legend>Business</legend>
                  <div className="form-grid">
                    <TextInput label="RUC" value={businessItem.business.ruc} required error={validationErrors[businessPath('business.ruc')]} onChange={(value) => updateBusinessField(businessIndex, 'business', 'ruc', value)} />
                    <TextInput label="Name" value={businessItem.business.the_name} required error={validationErrors[businessPath('business.the_name')]} onChange={(value) => updateBusinessField(businessIndex, 'business', 'the_name', value)} />
                    <TextInput label="Business type" value={businessItem.business.business_type} required error={validationErrors[businessPath('business.business_type')]} onChange={(value) => updateBusinessField(businessIndex, 'business', 'business_type', value)} />
                    <TextInput label="Website" type="url" value={businessItem.business.website} required error={validationErrors[businessPath('business.website')]} onChange={(value) => updateBusinessField(businessIndex, 'business', 'website', value)} />
                    <TextInput label="Tenant name" value={businessItem.business.tenant_name} readOnly error={validationErrors[businessPath('business.tenant_name')]} onChange={(value) => updateBusinessField(businessIndex, 'business', 'tenant_name', value)} />
                    <label className="check-field">
                      <input
                        type="checkbox"
                        checked={businessItem.business.is_official_ruc}
                        onChange={(event) => updateBusinessField(businessIndex, 'business', 'is_official_ruc', event.target.checked)}
                      />
                      Official RUC
                    </label>
                  </div>
                </fieldset>

                <fieldset className="form-section">
                  <legend>Business location</legend>
                  <div className="form-grid">
                    <TextInput label="Country" value={businessItem.business_location.country} required error={validationErrors[businessPath('business_location.country')]} onChange={(value) => updateBusinessField(businessIndex, 'business_location', 'country', value)} />
                    <TextInput label="City" value={businessItem.business_location.city} required error={validationErrors[businessPath('business_location.city')]} onChange={(value) => updateBusinessField(businessIndex, 'business_location', 'city', value)} />
                    <TextInput label="Province" value={businessItem.business_location.province} required error={validationErrors[businessPath('business_location.province')]} onChange={(value) => updateBusinessField(businessIndex, 'business_location', 'province', value)} />
                    <TextInput label="Address 1" value={businessItem.business_location.address1} required error={validationErrors[businessPath('business_location.address1')]} onChange={(value) => updateBusinessField(businessIndex, 'business_location', 'address1', value)} />
                    <TextInput label="Address 2" value={businessItem.business_location.address2} required error={validationErrors[businessPath('business_location.address2')]} onChange={(value) => updateBusinessField(businessIndex, 'business_location', 'address2', value)} />
                  </div>
                </fieldset>

                <fieldset className="form-section">
                  <legend>Business contact</legend>
                  <div className="form-grid">
                    <TextInput label="Mobile phone" value={businessItem.business_contact.mobile_phone_number} required error={validationErrors[businessPath('business_contact.mobile_phone_number')]} onChange={(value) => updateBusinessField(businessIndex, 'business_contact', 'mobile_phone_number', value)} />
                    <TextInput label="Base phone" value={businessItem.business_contact.base_phone_number} required error={validationErrors[businessPath('business_contact.base_phone_number')]} onChange={(value) => updateBusinessField(businessIndex, 'business_contact', 'base_phone_number', value)} />
                    <TextInput label="Email" type="email" value={businessItem.business_contact.email} required error={validationErrors[businessPath('business_contact.email')]} onChange={(value) => updateBusinessField(businessIndex, 'business_contact', 'email', value)} />
                  </div>
                </fieldset>

                <fieldset className="form-section">
                  <legend>Modules</legend>
                  {modulesError ? <p className="form-alert">{modulesError}</p> : null}
                  {validationErrors[businessPath('business_module')] ? <p className="field-error">{validationErrors[businessPath('business_module')]}</p> : null}
                  <div className="module-grid">
                    {isLoadingModules ? <p>Cargando modulos...</p> : null}
                    {modules.map((module) => (
                      <label className="module-option" key={module.id}>
                        <input
                          type="checkbox"
                          checked={businessItem.business_module.includes(Number(module.id))}
                          onChange={(event) => toggleModule(businessIndex, module.id, event.target.checked)}
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
                    {businessItem.business_user.map((user, userIndex) => (
                      <div className="user-row" key={userIndex}>
                        <TextInput label="First name" value={user.first_name} required error={validationErrors[businessPath(`business_user.${userIndex}.first_name`)]} onChange={(value) => updateUser(businessIndex, userIndex, 'first_name', value)} />
                        <TextInput label="Last name" value={user.last_name} required error={validationErrors[businessPath(`business_user.${userIndex}.last_name`)]} onChange={(value) => updateUser(businessIndex, userIndex, 'last_name', value)} />
                        <TextInput label="User email" type="email" value={user.user_name} required error={validationErrors[businessPath(`business_user.${userIndex}.user_name`)]} onChange={(value) => updateUser(businessIndex, userIndex, 'user_name', value)} />
                        <TextInput
                          label="Password"
                          type="password"
                          value={user.user_password}
                          required
                          error={validationErrors[businessPath(`business_user.${userIndex}.user_password`)]}
                          action={
                            <button
                              className="input-action"
                              type="button"
                              aria-label="Generate password"
                              onClick={() => generatePassword(businessIndex, userIndex)}
                            >
                              <FiKey aria-hidden="true" />
                            </button>
                          }
                          onChange={(value) => updateUser(businessIndex, userIndex, 'user_password', value)}
                        />
                        <label className="input-field">
                          <span>Role</span>
                          <select value={user.rol} onChange={(event) => updateUser(businessIndex, userIndex, 'rol', event.target.value)}>
                            <option value="Admin">Admin</option>
                            <option value="General">General</option>
                          </select>
                        </label>
                        <button className="icon-action" type="button" aria-label="Remove user" onClick={() => removeUser(businessIndex, userIndex)}>
                          <FiTrash2 aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button className="secondary-button" type="button" onClick={() => addUser(businessIndex)}>
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
                        value={businessItem.subscription.subscription_type}
                        onChange={(event) => updateBusinessField(businessIndex, 'subscription', 'subscription_type', event.target.value)}
                      >
                        <option value="TRIAL">TRIAL</option>
                        <option value="MONTHLY">MONTHLY</option>
                      </select>
                    </label>
                    <NumberInput label="Trial days" value={businessItem.subscription.trial_days} min={1} max={365} error={validationErrors[businessPath('subscription.trial_days')]} onChange={(value) => updateBusinessField(businessIndex, 'subscription', 'trial_days', value)} />
                    <NumberInput label="Monthly payment" value={businessItem.subscription.monthly_payment} min={0} step="0.01" error={validationErrors[businessPath('subscription.monthly_payment')]} onChange={(value) => updateBusinessField(businessIndex, 'subscription', 'monthly_payment', value)} />
                    <NumberInput label="How many users" value={businessItem.subscription.how_many_users} min={1} error={validationErrors[businessPath('subscription.how_many_users')]} onChange={(value) => updateBusinessField(businessIndex, 'subscription', 'how_many_users', value)} />
                    <NumberInput label="Admin users" value={businessItem.subscription.admin_user} min={0} error={validationErrors[businessPath('subscription.admin_user')]} onChange={(value) => updateBusinessField(businessIndex, 'subscription', 'admin_user', value)} />
                    <NumberInput label="General users" value={businessItem.subscription.general_user} min={0} error={validationErrors[businessPath('subscription.general_user')]} onChange={(value) => updateBusinessField(businessIndex, 'subscription', 'general_user', value)} />
                  </div>
                  {!businessLimitMatches ? <p className="form-alert">how_many_users debe ser igual a admin_user + general_user.</p> : null}
                </fieldset>
              </section>
            )
          })}
        </div>

        <button className="secondary-button add-business-button" type="button" onClick={addBusiness}>
          <FiPlus aria-hidden="true" />
          Add business
        </button>

        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={() => setForm(createInitialForm())}>
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
  error,
  readOnly = false,
  action,
}: {
  label: string
  value: string
  type?: string
  required?: boolean
  error?: string
  readOnly?: boolean
  action?: ReactNode
  onChange: (value: string) => void
}) {
  return (
    <label className="input-field">
      <span>{label}</span>
      <span className={action ? 'input-with-action' : undefined}>
        <input
          type={type}
          value={value}
          required={required}
          readOnly={readOnly}
          aria-invalid={Boolean(error)}
          placeholder={getPlaceholder(label, type)}
          onChange={(event) => onChange(event.target.value)}
        />
        {action}
      </span>
      {error ? <small className="field-error">{error}</small> : null}
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
  error,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number | string
  error?: string
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
        aria-invalid={Boolean(error)}
        placeholder={getPlaceholder(label, 'number')}
        onChange={handleChange}
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
    'User email': 'Ej: grace@example.com',
    Password: 'Ej: Secure-password1',
    'Trial days': 'Ej: 21',
    'Monthly payment': 'Ej: 22.32',
    'How many users': 'Ej: 4',
    'Admin users': 'Ej: 1',
    'General users': 'Ej: 3',
  }

  return examples[label] ?? (type === 'email' ? 'Ej: user@example.com' : 'Escribe un valor')
}

function validateCreateForm(payload: CreateCustomerPayload, includeRequired: boolean): ValidationErrors {
  const errors: ValidationErrors = {}

  validateText(errors, 'customer.identification', payload.customer.identification, {
    includeRequired,
    label: 'Identification',
    pattern: /^[A-Za-z0-9]{1,15}$/,
    message: 'Solo letras y digitos, maximo 15 caracteres.',
  })
  validateLetters(errors, 'customer.first_name', payload.customer.first_name, includeRequired, 'First name')
  validateLetters(errors, 'customer.last_name', payload.customer.last_name, includeRequired, 'Last name')
  validateLetters(errors, 'customer.country', payload.customer.country, includeRequired, 'Country')
  validateLetters(errors, 'customer.city', payload.customer.city, includeRequired, 'City')
  validatePhone(errors, 'customer_contact.mobile_phone_number', payload.customer_contact.mobile_phone_number, includeRequired)
  validateBasePhone(errors, 'customer_contact.base_phone_number', payload.customer_contact.base_phone_number, includeRequired)
  validateEmail(errors, 'customer_contact.email', payload.customer_contact.email, includeRequired)

  payload.businesses.forEach((businessItem, businessIndex) => {
    const path = (field: string) => `businesses.${businessIndex}.${field}`

    validatePhone(errors, path('business.ruc'), businessItem.business.ruc, includeRequired, 'RUC')
    validateText(errors, path('business.the_name'), businessItem.business.the_name, {
      includeRequired,
      label: 'Business name',
      pattern: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 ]+$/,
      message: 'Solo letras, numeros y espacios.',
    })
    validateLetters(errors, path('business.business_type'), businessItem.business.business_type, includeRequired, 'Business type')
    validateWebsite(errors, path('business.website'), businessItem.business.website, includeRequired)
    validateText(errors, path('business.tenant_name'), businessItem.business.tenant_name, {
      includeRequired,
      label: 'Tenant name',
      pattern: /^[A-Za-z0-9_]+$/,
      message: 'Se genera automaticamente con letras, numeros y guion bajo.',
    })
    validateLetters(errors, path('business_location.country'), businessItem.business_location.country, includeRequired, 'Country')
    validateLetters(errors, path('business_location.city'), businessItem.business_location.city, includeRequired, 'City')
    validateLetters(errors, path('business_location.province'), businessItem.business_location.province, includeRequired, 'Province')
    validateAddress(errors, path('business_location.address1'), businessItem.business_location.address1, includeRequired, 'Address 1')
    validateAddress(errors, path('business_location.address2'), businessItem.business_location.address2, includeRequired, 'Address 2')
    validatePhone(errors, path('business_contact.mobile_phone_number'), businessItem.business_contact.mobile_phone_number, includeRequired)
    validateBasePhone(errors, path('business_contact.base_phone_number'), businessItem.business_contact.base_phone_number, includeRequired)
    validateEmail(errors, path('business_contact.email'), businessItem.business_contact.email, includeRequired)

    if (businessItem.business_module.length === 0) {
      errors[path('business_module')] = 'Selecciona al menos un modulo.'
    }

    businessItem.business_user.forEach((user, userIndex) => {
      validateLetters(errors, path(`business_user.${userIndex}.first_name`), user.first_name, includeRequired, 'First name')
      validateLetters(errors, path(`business_user.${userIndex}.last_name`), user.last_name, includeRequired, 'Last name')
      validateEmail(errors, path(`business_user.${userIndex}.user_name`), user.user_name, includeRequired)
      validateText(errors, path(`business_user.${userIndex}.user_password`), user.user_password, {
        includeRequired,
        label: 'Password',
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/,
        message: 'Debe tener 12+ caracteres, mayuscula, minuscula, numero y simbolo.',
      })
    })

    validateNumber(errors, path('subscription.trial_days'), businessItem.subscription.trial_days, 1, 365)
    validateNumber(errors, path('subscription.monthly_payment'), businessItem.subscription.monthly_payment, 0)
    validateNumber(errors, path('subscription.how_many_users'), businessItem.subscription.how_many_users, 1)
    validateNumber(errors, path('subscription.admin_user'), businessItem.subscription.admin_user, 0)
    validateNumber(errors, path('subscription.general_user'), businessItem.subscription.general_user, 0)

    if (
      businessItem.subscription.how_many_users !==
      businessItem.subscription.admin_user + businessItem.subscription.general_user
    ) {
      errors[path('subscription.how_many_users')] = 'Debe ser igual a admin users + general users.'
    }
  })

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

function validateWebsite(errors: ValidationErrors, path: string, value: string, includeRequired: boolean) {
  if (!value.trim()) {
    if (includeRequired) {
      errors[path] = 'Website es obligatorio.'
    }
    return
  }

  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      errors[path] = 'Usa una URL http o https.'
    }
  } catch {
    errors[path] = 'Ingresa una URL valida.'
  }
}

function validateAddress(
  errors: ValidationErrors,
  path: string,
  value: string,
  includeRequired: boolean,
  label: string,
) {
  validateText(errors, path, value, {
    includeRequired,
    label,
    pattern: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 .,\-/]+$/,
    message: 'Solo letras, numeros, espacios, punto, coma y guion.',
  })
}

function validateNumber(
  errors: ValidationErrors,
  path: string,
  value: number,
  min: number,
  max?: number,
) {
  if (!Number.isFinite(value) || value < min || (max !== undefined && value > max)) {
    errors[path] = max === undefined ? `Debe ser un numero mayor o igual a ${min}.` : `Debe estar entre ${min} y ${max}.`
  }
}

function sanitizeCustomerValue(section: CustomerSection, field: string, value: string) {
  if (section === 'customer' && field === 'identification') {
    return value.replace(/[^A-Za-z0-9]/g, '').slice(0, 15)
  }

  if (section === 'customer' && ['first_name', 'last_name', 'country', 'city'].includes(field)) {
    return onlyLetters(value)
  }

  if (section === 'customer_contact' && field === 'mobile_phone_number') {
    return onlyDigits(value, 15)
  }

  if (section === 'customer_contact' && field === 'base_phone_number') {
    return sanitizeBasePhone(value)
  }

  return value
}

function sanitizeBusinessValue(section: BusinessSection, field: string, value: string) {
  if (section === 'business' && field === 'ruc') {
    return onlyDigits(value, 15)
  }

  if (section === 'business' && field === 'the_name') {
    return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 ]/g, '')
  }

  if (section === 'business' && field === 'business_type') {
    return onlyLetters(value)
  }

  if (section === 'business' && field === 'tenant_name') {
    return toTenantName(value)
  }

  if (section === 'business_location' && ['country', 'city', 'province'].includes(field)) {
    return onlyLetters(value)
  }

  if (section === 'business_location' && ['address1', 'address2'].includes(field)) {
    return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 .,\-/]/g, '')
  }

  if (section === 'business_contact' && field === 'mobile_phone_number') {
    return onlyDigits(value, 15)
  }

  if (section === 'business_contact' && field === 'base_phone_number') {
    return sanitizeBasePhone(value)
  }

  return value
}

function sanitizeUserValue(field: keyof BusinessUserPayload, value: string) {
  if (field === 'first_name' || field === 'last_name') {
    return onlyLetters(value)
  }

  if (field === 'user_name') {
    return value.replace(/\s/g, '').toLowerCase()
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

function toTenantName(value: string) {
  return value.trim().replace(/\s+/g, '_')
}

function createSecurePassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%*-_'
  const all = `${upper}${lower}${digits}${symbols}`
  const requiredChars = [
    randomChar(upper),
    randomChar(lower),
    randomChar(digits),
    randomChar(symbols),
  ]

  while (requiredChars.length < 14) {
    requiredChars.push(randomChar(all))
  }

  return requiredChars.sort(() => crypto.getRandomValues(new Uint32Array(1))[0] - 2147483648).join('')
}

function randomChar(source: string) {
  const randomValue = crypto.getRandomValues(new Uint32Array(1))[0]
  return source[randomValue % source.length]
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
    businesses: payload.businesses.map((businessItem) => ({
      ...businessItem,
      business: {
        ...businessItem.business,
        ruc: businessItem.business.ruc.trim(),
        tenant_name: businessItem.business.tenant_name.trim(),
      },
      business_contact: {
        ...businessItem.business_contact,
        email: businessItem.business_contact.email.trim().toLowerCase(),
      },
      business_user: businessItem.business_user.map((user) => ({
        ...user,
        user_name: user.user_name.trim().toLowerCase(),
      })),
    })),
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
