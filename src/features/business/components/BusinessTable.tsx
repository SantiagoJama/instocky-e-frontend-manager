import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  FiCreditCard,
  FiEdit2,
  FiFileText,
  FiKey,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiSlash,
  FiUnlock,
  FiUsers,
} from 'react-icons/fi'
import { Tooltip } from 'react-tooltip'
import Swal from 'sweetalert2'
import { useAuth } from '../../auth/hooks/useAuth'
import { useLogoutOnUnauthorized } from '../../auth/hooks/useLogoutOnUnauthorized'
import { useBusinesses } from '../hooks/useBusinesses'
import {
  addBusinessModuleRequest,
  changeBusinessUserPasswordRequest,
  createBusinessUserRequest,
  listAvailableBusinessModulesRequest,
  updateBusinessModuleStatusRequest,
  updateBusinessRequest,
  updateBusinessStatusRequest,
  updateBusinessUserStatusRequest,
  updateBusinessUserRequest,
} from '../services/businessApi'
import type {
  AvailableBusinessModule,
  BusinessAggregate,
  BusinessContact,
  BusinessLocation,
  BusinessModule,
  BusinessUser,
  BusinessUserPayload,
} from '../types/business.types'
import {
  createSecurePassword,
  getBusinessPlaceholder,
  normalizeBusinessEditPayload,
  normalizeBusinessUserPayload,
  sanitizeBusinessUserValue,
  sanitizeBusinessValue,
  toTenantName,
  validateBusinessEditForm,
  validateBusinessUserForm,
  validatePasswordForm,
  type BusinessEditForm as BusinessEditFormState,
  type ValidationErrors,
} from '../utils/businessForm'
import { formatDate } from '../../../shared/utils/convertionDate'
import './BusinessComponents.css'

type BusinessModalType = 'payments' | 'users' | 'modules' | 'subscription' | 'update'

type ActiveModal = {
  type: BusinessModalType
  business: BusinessAggregate
}

const emptyUserForm: Required<BusinessUserPayload> = {
  first_name: '',
  last_name: '',
  user_name: '',
  user_password: '',
  rol: 'General',
}

export function BusinessTable() {
  const { accessToken } = useAuth()
  const logoutOnUnauthorized = useLogoutOnUnauthorized()
  const { businesses, pagination, page, search, isLoading, error, setPage, setSearch, reload } =
    useBusinesses(accessToken, logoutOnUnauthorized)
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null)

  async function toggleBusinessStatus(business: BusinessAggregate) {
    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    const nextStatus = !business.business.is_active
    const action = nextStatus ? 'activar' : 'inactivar'
    const result = await Swal.fire({
      title: `${nextStatus ? 'Activar' : 'Inactivar'} business`,
      text: `Seguro que quieres ${action} ${business.business.the_name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Si, ${action}`,
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      await updateBusinessStatusRequest(business.business.id, nextStatus, { accessToken })
      await Swal.fire(
        nextStatus ? 'Business activado' : 'Business inactivado',
        'El estado fue actualizado correctamente.',
        'success',
      )
      await reload()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo actualizar', getBusinessErrorMessage(requestError), 'error')
    }
  }

  return (
    <section className="business-page" aria-labelledby="business-view-title">
      <header className="business-page__header">
        <div>
          <p>Business</p>
          <h2 id="business-view-title">View businesses</h2>
        </div>
        <button className="secondary-button" type="button" onClick={() => void reload()}>
          <FiRefreshCw aria-hidden="true" />
          Refresh
        </button>
      </header>

      <div className="business-toolbar">
        <label className="input-field business-search">
          <span>Search</span>
          <input
            type="search"
            value={search}
            maxLength={120}
            placeholder="RUC or business name"
            onChange={(event) => {
              setPage(1)
              setSearch(event.target.value)
            }}
          />
        </label>
      </div>

      {error ? <p className="form-alert">{error}</p> : null}

      <div className="business-table-shell">
        <table className="business-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Contact</th>
              <th>Location</th>
              <th>RUC</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8}>Loading businesses...</td>
              </tr>
            ) : null}
            {!isLoading && businesses.length === 0 ? (
              <tr>
                <td colSpan={8}>No businesses found.</td>
              </tr>
            ) : null}
            {businesses.map((item) => (
              <tr key={item.business.id}>
                <td>
                  <span>{item.business.the_name}</span>
                  <small>{item.business.business_type}</small>
                </td>
                <td>
                  <span>{item.business_contact.email}</span>
                  <small>{item.business_contact.mobile_phone_number}</small>
                </td>
                <td>
                  <span>
                    {item.business_location.city}, {item.business_location.province}
                  </span>
                  <small>{item.business_location.address1}</small>
                </td>
                <td>{item.business.ruc}</td>
                <td>{item.business.is_active ? 'Active' : 'Inactive'}</td>
                <td>{formatSafeDate(item.business.created_at)}</td>
                <td>
                  <div className="business-actions">
                    <IconAction
                      label="Show payments"
                      tooltipId={`payments-${item.business.id}`}
                      onClick={() => setActiveModal({ type: 'payments', business: item })}
                    >
                      <FiCreditCard aria-hidden="true" />
                    </IconAction>
                    <IconAction
                      label="Show business users"
                      tooltipId={`users-${item.business.id}`}
                      onClick={() => setActiveModal({ type: 'users', business: item })}
                    >
                      <FiUsers aria-hidden="true" />
                    </IconAction>
                    <IconAction
                      label="Show business modules"
                      tooltipId={`modules-${item.business.id}`}
                      onClick={() => setActiveModal({ type: 'modules', business: item })}
                    >
                      <FiPackage aria-hidden="true" />
                    </IconAction>
                    <IconAction
                      label="Show subscription"
                      tooltipId={`subscription-${item.business.id}`}
                      onClick={() => setActiveModal({ type: 'subscription', business: item })}
                    >
                      <FiFileText aria-hidden="true" />
                    </IconAction>
                    <IconAction
                      label="Update business"
                      tooltipId={`update-${item.business.id}`}
                      onClick={() => setActiveModal({ type: 'update', business: item })}
                    >
                      <FiEdit2 aria-hidden="true" />
                    </IconAction>
                    <IconAction
                      label={item.business.is_active ? 'Inactivate business' : 'Activate business'}
                      tooltipId={`status-${item.business.id}`}
                      onClick={() => void toggleBusinessStatus(item)}
                    >
                      {item.business.is_active ? <FiSlash aria-hidden="true" /> : <FiUnlock aria-hidden="true" />}
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

      {activeModal ? (
        <BusinessInfoModal
          modal={activeModal}
          onClose={() => setActiveModal(null)}
          onChanged={(business) => {
            if (business) {
              setActiveModal({ type: activeModal.type, business })
            }
            void reload()
          }}
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
        className="business-action-button"
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

function BusinessInfoModal({
  modal,
  onClose,
  onChanged,
}: {
  modal: ActiveModal
  onClose: () => void
  onChanged: (business?: BusinessAggregate) => void
}) {
  const [isClosing, setIsClosing] = useState(false)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [isAddingModule, setIsAddingModule] = useState(false)
  const title = {
    payments: 'Payments',
    users: 'Business users',
    modules: 'Business modules',
    subscription: 'Subscription',
    update: 'Update business',
  }[modal.type]

  function requestClose() {
    setIsClosing(true)
    window.setTimeout(onClose, 180)
  }

  return (
    <div className={`business-modal-backdrop ${isClosing ? 'business-modal-backdrop--closing' : ''}`} role="presentation">
      <section
        className={`business-modal ${isClosing ? 'business-modal--closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="business-modal-title"
      >
        <header className="business-modal__header">
          <div>
            <p>{modal.business.business.the_name}</p>
            <h3 id="business-modal-title">{title}</h3>
          </div>
          <div className="business-modal__actions">
            {modal.type === 'users' ? (
              <button className="primary-action" type="button" onClick={() => setIsAddingUser(true)}>
                <FiPlus aria-hidden="true" />
                Add new user
              </button>
            ) : null}
            {modal.type === 'modules' ? (
              <button className="primary-action" type="button" onClick={() => setIsAddingModule(true)}>
                <FiPlus aria-hidden="true" />
                Add module
              </button>
            ) : null}
            <button className="secondary-button" type="button" onClick={requestClose}>
              Close
            </button>
          </div>
        </header>
        <div className="business-modal__content">
          {renderModalContent({
            modal,
            onChanged,
            onClose: requestClose,
            isAddingUser,
            setIsAddingUser,
            isAddingModule,
            setIsAddingModule,
          })}
        </div>
      </section>
    </div>
  )
}

function renderModalContent({
  modal,
  onChanged,
  onClose,
  isAddingUser,
  setIsAddingUser,
  isAddingModule,
  setIsAddingModule,
}: {
  modal: ActiveModal
  onChanged: (business?: BusinessAggregate) => void
  onClose: () => void
  isAddingUser: boolean
  setIsAddingUser: (isAdding: boolean) => void
  isAddingModule: boolean
  setIsAddingModule: (isAdding: boolean) => void
}) {
  if (modal.type === 'payments') {
    return modal.business.payments.length ? (
      <div className="info-list">
        {modal.business.payments.map((payment) => (
          <article className="info-card" key={payment.id}>
            <h4>
              {payment.the_provider} / {payment.event_name}
            </h4>
            <dl>
              <InfoRow label="Status" value={payment.the_status} />
              <InfoRow label="Amount" value={`${Number(payment.amount_in_cents) / 100} ${payment.currency}`} />
              <InfoRow label="Refunded" value={`${Number(payment.refunded_amount_in_cents) / 100} ${payment.currency}`} />
              <InfoRow label="Resource" value={`${payment.external_resource_type} #${payment.external_resource_id}`} />
              <InfoRow label="Test mode" value={payment.is_test_mode ? 'Yes' : 'No'} />
              <InfoRow label="Received" value={formatSafeDate(payment.received_at)} />
            </dl>
          </article>
        ))}
      </div>
    ) : (
      <p>No payments found.</p>
    )
  }

  if (modal.type === 'users') {
    return (
      <BusinessUsersPanel
        businessAggregate={modal.business}
        isAdding={isAddingUser}
        setIsAdding={setIsAddingUser}
        onChanged={onChanged}
      />
    )
  }

  if (modal.type === 'modules') {
    return (
      <BusinessModulesPanel
        businessAggregate={modal.business}
        isAdding={isAddingModule}
        setIsAdding={setIsAddingModule}
        onChanged={onChanged}
      />
    )
  }

  if (modal.type === 'update') {
    return <BusinessEditFormModal businessAggregate={modal.business} onSaved={onChanged} onClose={onClose} />
  }

  if (!modal.business.subscription) {
    return <p>No subscription found.</p>
  }

  return (
    <article className="info-card subscription-card">
      <h4>Details</h4>
      <dl>
        <InfoRow label="Type" value={modal.business.subscription.subscription_type} />
        <InfoRow label="Trial start" value={formatSafeDate(modal.business.subscription.trial_start)} />
        <InfoRow label="Trial end" value={formatSafeDate(modal.business.subscription.trial_end)} />
        <InfoRow label="Trial days" value={String(modal.business.subscription.trial_days)} />
        <InfoRow label="Monthly start" value={formatSafeDate(modal.business.subscription.monthly_start)} />
        <InfoRow label="End subscription" value={formatSafeDate(modal.business.subscription.end_subscription)} />
        <InfoRow label="Monthly payment" value={modal.business.subscription.monthly_payment} />
        <InfoRow label="Users" value={String(modal.business.subscription.how_many_users)} />
        <InfoRow label="Admin users" value={String(modal.business.subscription.admin_user)} />
        <InfoRow label="General users" value={String(modal.business.subscription.general_user)} />
        <InfoRow label="Status" value={modal.business.subscription.subscription_status ? 'Active' : 'Inactive'} />
        <InfoRow label="Created" value={formatSafeDate(modal.business.subscription.created_at)} />
      </dl>
    </article>
  )
}

function BusinessModulesPanel({
  businessAggregate,
  isAdding,
  setIsAdding,
  onChanged,
}: {
  businessAggregate: BusinessAggregate
  isAdding: boolean
  setIsAdding: (isAdding: boolean) => void
  onChanged: (business?: BusinessAggregate) => void
}) {
  const { accessToken } = useAuth()
  const logoutOnUnauthorized = useLogoutOnUnauthorized()
  const [modules, setModules] = useState(businessAggregate.business_modules)
  const [availableModules, setAvailableModules] = useState<AvailableBusinessModule[]>([])
  const [selectedModuleId, setSelectedModuleId] = useState('')
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false)
  const [availableError, setAvailableError] = useState<string | null>(null)
  const [savingModuleId, setSavingModuleId] = useState<string | null>(null)
  const addableModules = useMemo(() => {
    const activeModuleIds = new Set(modules.filter((businessModule) => businessModule.is_active).map((item) => item.id))

    return availableModules.filter((businessModule) => !activeModuleIds.has(businessModule.id))
  }, [availableModules, modules])
  const selectedAddModuleId =
    selectedModuleId && addableModules.some((businessModule) => businessModule.id === selectedModuleId)
      ? selectedModuleId
      : addableModules[0]?.id || ''

  useEffect(() => {
    if (!isAdding || !accessToken) {
      return
    }

    let isMounted = true
    const currentAccessToken = accessToken

    async function loadAvailableModules() {
      setIsLoadingAvailable(true)
      setAvailableError(null)

      try {
        const response = await listAvailableBusinessModulesRequest({ accessToken: currentAccessToken })

        if (isMounted) {
          setAvailableModules(response.data)
        }
      } catch (requestError) {
        logoutOnUnauthorized(requestError)

        if (isMounted) {
          setAvailableError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los modulos.')
        }
      } finally {
        if (isMounted) {
          setIsLoadingAvailable(false)
        }
      }
    }

    void loadAvailableModules()

    return () => {
      isMounted = false
    }
  }, [accessToken, isAdding, logoutOnUnauthorized])

  async function toggleModuleStatus(businessModule: BusinessModule) {
    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    const nextStatus = !businessModule.is_active
    const actionLabel = nextStatus ? 'activar' : 'inactivar'
    const result = await Swal.fire({
      title: `${nextStatus ? 'Activar' : 'Inactivar'} modulo`,
      text: `Seguro que quieres ${actionLabel} ${businessModule.module_name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Si, ${actionLabel}`,
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) {
      return
    }

    setSavingModuleId(businessModule.id)

    try {
      const response = await updateBusinessModuleStatusRequest(
        businessAggregate.business.id,
        businessModule.id,
        nextStatus,
        { accessToken },
      )
      setModules((current) => current.map((item) => (item.id === businessModule.id ? response.data : item)))
      await Swal.fire(
        nextStatus ? 'Modulo activado' : 'Modulo inactivado',
        `El modulo fue ${nextStatus ? 'activado' : 'inactivado'} correctamente.`,
        'success',
      )
      onChanged()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo actualizar', getBusinessErrorMessage(requestError), 'error')
    } finally {
      setSavingModuleId(null)
    }
  }

  async function addModule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    if (!selectedAddModuleId) {
      await Swal.fire('Modulo requerido', 'Selecciona un modulo para agregar.', 'warning')
      return
    }

    const selectedModule = availableModules.find((businessModule) => businessModule.id === selectedAddModuleId)
    const result = await Swal.fire({
      title: 'Agregar modulo',
      text: `Seguro que quieres agregar ${selectedModule?.module_name ?? 'este modulo'} al business?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si, agregar',
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) {
      return
    }

    setSavingModuleId(selectedAddModuleId)

    try {
      const response = await addBusinessModuleRequest(businessAggregate.business.id, selectedAddModuleId, { accessToken })

      setModules((current) => {
        const moduleExists = current.some((businessModule) => businessModule.id === response.data.id)

        return moduleExists
          ? current.map((businessModule) => (businessModule.id === response.data.id ? response.data : businessModule))
          : [...current, response.data]
      })
      setSelectedModuleId('')
      setIsAdding(false)
      await Swal.fire('Modulo agregado', 'El modulo fue agregado correctamente.', 'success')
      onChanged()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo agregar', getBusinessErrorMessage(requestError), 'error')
    } finally {
      setSavingModuleId(null)
    }
  }

  return (
    <div className="business-modules-panel">
      {isAdding ? (
        <form className="inline-form-card" onSubmit={addModule}>
          <h4>Add module</h4>
          {availableError ? <p className="form-alert">{availableError}</p> : null}
          <label className="input-field">
            <span>Available module</span>
            <select
              value={selectedAddModuleId}
              disabled={isLoadingAvailable || addableModules.length === 0}
              onChange={(event) => setSelectedModuleId(event.target.value)}
            >
              <option value="">
                {isLoadingAvailable
                  ? 'Loading modules...'
                  : addableModules.length
                    ? 'Select a module'
                    : 'No modules available'}
              </option>
              {addableModules.map((businessModule) => (
                <option value={businessModule.id} key={businessModule.id}>
                  {businessModule.module_name}
                </option>
              ))}
            </select>
          </label>
          {selectedAddModuleId ? (
            <p className="module-helper">
              {availableModules.find((businessModule) => businessModule.id === selectedAddModuleId)?.module_description}
            </p>
          ) : null}
          <div className="inline-actions">
            <button className="secondary-button" type="button" onClick={() => setIsAdding(false)}>
              Cancel
            </button>
            <button className="primary-action" type="submit" disabled={!selectedAddModuleId || Boolean(savingModuleId)}>
              {savingModuleId === selectedAddModuleId ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      ) : null}

      {modules.length ? (
        <div className="info-list">
          {modules.map((businessModule) => (
            <article className="info-card" key={businessModule.id}>
              <div className="info-card__header">
                <div>
                  <h4>{businessModule.module_name}</h4>
                  <small>{businessModule.is_active ? 'Active' : 'Inactive'}</small>
                </div>
                <button
                  className={`secondary-button ${businessModule.is_active ? 'danger-button' : ''}`}
                  type="button"
                  disabled={savingModuleId === businessModule.id}
                  onClick={() => void toggleModuleStatus(businessModule)}
                >
                  {savingModuleId === businessModule.id
                    ? 'Saving...'
                    : businessModule.is_active
                      ? 'Inactivate module'
                      : 'Activate module'}
                </button>
              </div>
              <p>{businessModule.module_description}</p>
              <small>{formatSafeDate(businessModule.created_at)}</small>
            </article>
          ))}
        </div>
      ) : (
        <p>No business modules found.</p>
      )}
    </div>
  )
}

function BusinessUsersPanel({
  businessAggregate,
  isAdding,
  setIsAdding,
  onChanged,
}: {
  businessAggregate: BusinessAggregate
  isAdding: boolean
  setIsAdding: (isAdding: boolean) => void
  onChanged: (business?: BusinessAggregate) => void
}) {
  const { accessToken } = useAuth()
  const logoutOnUnauthorized = useLogoutOnUnauthorized()
  const [users, setUsers] = useState(businessAggregate.business_users)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<BusinessUserPayload | null>(null)
  const [editErrors, setEditErrors] = useState<ValidationErrors>({})
  const [addForm, setAddForm] = useState<Required<BusinessUserPayload>>({ ...emptyUserForm })
  const [addErrors, setAddErrors] = useState<ValidationErrors>({})
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<ValidationErrors>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  function openEdit(user: BusinessUser) {
    setEditingUserId(user.id)
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name,
      user_name: user.user_name,
      rol: user.rol,
    })
    setEditErrors({})
  }

  function updateEdit(field: keyof BusinessUserPayload, value: string) {
    if (!editForm) {
      return
    }

    const nextForm = {
      ...editForm,
      [field]: field === 'rol' ? value : sanitizeBusinessUserValue(field, value),
    } as BusinessUserPayload

    setEditForm(nextForm)
    setEditErrors(validateBusinessUserForm(nextForm, false, { includePassword: false }))
  }

  function updateAdd(field: keyof BusinessUserPayload, value: string) {
    const nextForm = {
      ...addForm,
      [field]: field === 'rol' ? value : sanitizeBusinessUserValue(field, value),
    } as Required<BusinessUserPayload>

    setAddForm(nextForm)
    setAddErrors(validateBusinessUserForm(nextForm, false, { includePassword: true }))
  }

  async function saveEdit(userId: string) {
    if (!accessToken || !editForm) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    const errors = validateBusinessUserForm(editForm, true, { includePassword: false })
    setEditErrors(errors)

    if (Object.keys(errors).length > 0) {
      await Swal.fire('Formulario incompleto', 'Revisa los campos marcados en rojo.', 'warning')
      return
    }

    setSavingId(userId)
    try {
      const response = await updateBusinessUserRequest(
        businessAggregate.business.id,
        userId,
        normalizeBusinessUserPayload(editForm),
        { accessToken },
      )
      setUsers((current) => current.map((user) => (user.id === userId ? response.data : user)))
      setEditingUserId(null)
      setEditForm(null)
      await Swal.fire('Usuario actualizado', 'Los cambios fueron guardados.', 'success')
      onChanged()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo guardar', getBusinessErrorMessage(requestError), 'error')
    } finally {
      setSavingId(null)
    }
  }

  async function saveAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsAdding(true)

    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    const errors = validateBusinessUserForm(addForm, true, { includePassword: true })
    setAddErrors(errors)

    if (Object.keys(errors).length > 0) {
      await Swal.fire('Formulario incompleto', 'Revisa los campos marcados en rojo.', 'warning')
      return
    }

    try {
      const response = await createBusinessUserRequest(
        businessAggregate.business.id,
        normalizeBusinessUserPayload(addForm),
        { accessToken },
      )
      setUsers((current) => [...current, response.data])
      setAddForm({ ...emptyUserForm })
      setAddErrors({})
      setIsAdding(false)
      await Swal.fire('Usuario creado', 'El usuario fue agregado correctamente.', 'success')
      onChanged()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo crear', getBusinessErrorMessage(requestError), 'error')
    }
  }

  async function toggleUserStatus(user: BusinessUser) {
    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    const nextStatus = !user.is_active
    const action = nextStatus ? 'activar' : 'inactivar'
    const result = await Swal.fire({
      title: `${nextStatus ? 'Activar' : 'Inactivar'} usuario`,
      text: `Seguro que quieres ${action} ${user.first_name} ${user.last_name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Si, ${action}`,
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      const response = await updateBusinessUserStatusRequest(businessAggregate.business.id, user.id, nextStatus, {
        accessToken,
      })
      setUsers((current) => current.map((currentUser) => (currentUser.id === user.id ? response.data : currentUser)))
      await Swal.fire(
        nextStatus ? 'Usuario activado' : 'Usuario inactivado',
        'El estado fue actualizado correctamente.',
        'success',
      )
      onChanged()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo actualizar', getBusinessErrorMessage(requestError), 'error')
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accessToken || !passwordUserId) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    const errors = validatePasswordForm(password, true)
    setPasswordErrors(errors)

    if (Object.keys(errors).length > 0) {
      await Swal.fire('Password invalido', 'Revisa la contrasena ingresada.', 'warning')
      return
    }

    try {
      const response = await changeBusinessUserPasswordRequest(
        businessAggregate.business.id,
        passwordUserId,
        password,
        { accessToken },
      )
      setUsers((current) => current.map((user) => (user.id === passwordUserId ? response.data : user)))
      setPasswordUserId(null)
      setPassword('')
      setPasswordErrors({})
      await Swal.fire('Password actualizado', 'La contrasena fue cambiada correctamente.', 'success')
      onChanged()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo cambiar', getBusinessErrorMessage(requestError), 'error')
    }
  }

  return (
    <div className="business-users-panel">
      {isAdding ? (
        <form id="business-user-create-form" className="inline-form-card" onSubmit={saveAdd}>
          <h4>Add new user</h4>
          <UserFormFields
            form={addForm}
            errors={addErrors}
            includePassword
            onGeneratePassword={() => updateAdd('user_password', createSecurePassword())}
            onChange={updateAdd}
          />
          <div className="inline-actions">
            <button className="secondary-button" type="button" onClick={() => setIsAdding(false)}>
              Cancel
            </button>
            <button className="primary-action" type="submit">
              Save
            </button>
          </div>
        </form>
      ) : null}

      {passwordUserId ? (
        <form className="inline-form-card" onSubmit={savePassword}>
          <h4>Change password</h4>
          <TextInput
            label="New password"
            type="password"
            value={password}
            required
            error={passwordErrors.password}
            action={
              <button
                className="input-action"
                type="button"
                aria-label="Generate password"
                onClick={() => setPassword(createSecurePassword())}
              >
                <FiKey aria-hidden="true" />
              </button>
            }
            onChange={(value) => {
              setPassword(value)
              setPasswordErrors(validatePasswordForm(value, false))
            }}
          />
          <div className="inline-actions">
            <button className="secondary-button" type="button" onClick={() => setPasswordUserId(null)}>
              Cancel
            </button>
            <button className="primary-action" type="submit">
              Save
            </button>
          </div>
        </form>
      ) : null}

      {users.length ? (
        <div className="info-list">
          {users.map((user) => (
            <article className="info-card user-info-card" key={user.id}>
              {editingUserId === user.id && editForm ? (
                <>
                  <UserFormFields form={editForm} errors={editErrors} onChange={updateEdit} />
                  <div className="inline-actions">
                    <button className="secondary-button" type="button" onClick={() => setEditingUserId(null)}>
                      Cancel
                    </button>
                    <button
                      className="primary-action"
                      type="button"
                      disabled={savingId === user.id}
                      onClick={() => void saveEdit(user.id)}
                    >
                      {savingId === user.id ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="info-card__header">
                    <h4>
                      {user.first_name} {user.last_name}
                    </h4>
                    <div className="inline-actions">
                      <button className="secondary-button" type="button" onClick={() => openEdit(user)}>
                        Edit user
                      </button>
                      <button className="secondary-button" type="button" onClick={() => setPasswordUserId(user.id)}>
                        Change password
                      </button>
                      <button
                        className={`secondary-button ${user.is_active ? 'danger-button' : ''}`}
                        type="button"
                        onClick={() => void toggleUserStatus(user)}
                      >
                        {user.is_active ? 'Inactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                  <dl>
                    <InfoRow label="Email" value={user.user_name} />
                    <InfoRow label="Role" value={user.rol} />
                    <InfoRow label="Status" value={user.is_active ? 'Active' : 'Inactive'} />
                    <InfoRow label="Created" value={formatSafeDate(user.created_at)} />
                  </dl>
                </>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p>No business users found.</p>
      )}
    </div>
  )
}

function BusinessEditFormModal({
  businessAggregate,
  onSaved,
  onClose,
}: {
  businessAggregate: BusinessAggregate
  onSaved: (business?: BusinessAggregate) => void
  onClose: () => void
}) {
  const { accessToken } = useAuth()
  const logoutOnUnauthorized = useLogoutOnUnauthorized()
  const [form, setForm] = useState<BusinessEditFormState>(() => toBusinessEditForm(businessAggregate))
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  function updateField(section: keyof BusinessEditFormState, field: string, value: string | boolean) {
    const nextValue = typeof value === 'string' ? sanitizeBusinessValue(section, field, value) : value

    setForm((current) => {
      const nextForm = {
        ...current,
        [section]: {
          ...current[section],
          [field]: nextValue,
          ...(section === 'business' && field === 'the_name' && typeof nextValue === 'string'
            ? { tenant_name: toTenantName(nextValue) }
            : {}),
        },
      }
      setErrors(validateBusinessEditForm(nextForm, false))
      return nextForm
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    const submitErrors = validateBusinessEditForm(form, true)
    setErrors(submitErrors)

    if (Object.keys(submitErrors).length > 0) {
      await Swal.fire('Formulario incompleto', 'Revisa los campos marcados en rojo.', 'warning')
      return
    }

    setIsSaving(true)

    try {
      const response = await updateBusinessRequest(
        businessAggregate.business.id,
        normalizeBusinessEditPayload(form),
        { accessToken },
      )
      await Swal.fire('Business actualizado', 'Los cambios fueron guardados.', 'success')
      onSaved(response.data)
      onClose()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo guardar', getBusinessErrorMessage(requestError), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="business-edit-form" onSubmit={handleSubmit}>
      <fieldset className="form-section">
        <legend>Business</legend>
        <div className="form-grid">
          <TextInput label="RUC" value={form.business.ruc ?? ''} required error={errors['business.ruc']} onChange={(value) => updateField('business', 'ruc', value)} />
          <TextInput label="Name" value={form.business.the_name ?? ''} required error={errors['business.the_name']} onChange={(value) => updateField('business', 'the_name', value)} />
          <TextInput label="Business type" value={form.business.business_type ?? ''} required error={errors['business.business_type']} onChange={(value) => updateField('business', 'business_type', value)} />
          <TextInput label="Website" value={form.business.website ?? ''} required error={errors['business.website']} onChange={(value) => updateField('business', 'website', value)} />
          <label className="check-field">
            <input
              type="checkbox"
              checked={Boolean(form.business.is_official_ruc)}
              onChange={(event) => updateField('business', 'is_official_ruc', event.target.checked)}
            />
            Official RUC
          </label>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Business location</legend>
        <div className="form-grid">
          <TextInput label="Country" value={form.business_location.country ?? ''} required error={errors['business_location.country']} onChange={(value) => updateField('business_location', 'country', value)} />
          <TextInput label="City" value={form.business_location.city ?? ''} required error={errors['business_location.city']} onChange={(value) => updateField('business_location', 'city', value)} />
          <TextInput label="Province" value={form.business_location.province ?? ''} required error={errors['business_location.province']} onChange={(value) => updateField('business_location', 'province', value)} />
          <TextInput label="Address 1" value={form.business_location.address1 ?? ''} required error={errors['business_location.address1']} onChange={(value) => updateField('business_location', 'address1', value)} />
          <TextInput label="Address 2" value={form.business_location.address2 ?? ''} required error={errors['business_location.address2']} onChange={(value) => updateField('business_location', 'address2', value)} />
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend>Business contact</legend>
        <div className="form-grid">
          <TextInput label="Mobile phone" value={form.business_contact.mobile_phone_number ?? ''} required error={errors['business_contact.mobile_phone_number']} onChange={(value) => updateField('business_contact', 'mobile_phone_number', value)} />
          <TextInput label="Base phone" value={form.business_contact.base_phone_number ?? ''} required error={errors['business_contact.base_phone_number']} onChange={(value) => updateField('business_contact', 'base_phone_number', value)} />
          <TextInput label="Email" type="email" value={form.business_contact.email ?? ''} required error={errors['business_contact.email']} onChange={(value) => updateField('business_contact', 'email', value)} />
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
  )
}

function UserFormFields({
  form,
  errors,
  includePassword = false,
  onGeneratePassword,
  onChange,
}: {
  form: BusinessUserPayload
  errors: ValidationErrors
  includePassword?: boolean
  onGeneratePassword?: () => void
  onChange: (field: keyof BusinessUserPayload, value: string) => void
}) {
  return (
    <div className="form-grid">
      <TextInput label="First name" value={form.first_name} required error={errors.first_name} onChange={(value) => onChange('first_name', value)} />
      <TextInput label="Last name" value={form.last_name} required error={errors.last_name} onChange={(value) => onChange('last_name', value)} />
      <TextInput label="User email" type="email" value={form.user_name} required error={errors.user_name} onChange={(value) => onChange('user_name', value)} />
      {includePassword ? (
        <TextInput
          label="Password"
          type="password"
          value={form.user_password ?? ''}
          required
          error={errors.user_password}
          action={
            <button className="input-action" type="button" aria-label="Generate password" onClick={onGeneratePassword}>
              <FiKey aria-hidden="true" />
            </button>
          }
          onChange={(value) => onChange('user_password', value)}
        />
      ) : null}
      <label className="input-field">
        <span>Role</span>
        <select value={form.rol} aria-invalid={Boolean(errors.rol)} onChange={(event) => onChange('rol', event.target.value)}>
          <option value="Admin">Admin</option>
          <option value="General">General</option>
        </select>
        {errors.rol ? <small className="field-error">{errors.rol}</small> : null}
      </label>
    </div>
  )
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  error,
  action,
}: {
  label: string
  value: string
  type?: string
  required?: boolean
  error?: string
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
          aria-invalid={Boolean(error)}
          placeholder={getBusinessPlaceholder(label, type)}
          onChange={(event) => onChange(event.target.value)}
        />
        {action}
      </span>
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value || 'N/A'}</dd>
    </>
  )
}

function toBusinessEditForm(businessAggregate: BusinessAggregate): BusinessEditFormState {
  return {
    business: {
      ruc: businessAggregate.business.ruc,
      the_name: businessAggregate.business.the_name,
      business_type: businessAggregate.business.business_type,
      website: businessAggregate.business.website,
      is_official_ruc: businessAggregate.business.is_official_ruc,
      tenant_name: businessAggregate.business.tenant_name,
    },
    business_location: pickLocation(businessAggregate.business_location),
    business_contact: pickContact(businessAggregate.business_contact),
  }
}

function pickLocation(location: BusinessLocation) {
  return {
    country: location.country,
    city: location.city,
    province: location.province,
    address1: location.address1,
    address2: location.address2,
  }
}

function pickContact(contact: BusinessContact) {
  return {
    mobile_phone_number: contact.mobile_phone_number,
    base_phone_number: contact.base_phone_number || 'N/A',
    email: contact.email,
  }
}

function formatSafeDate(value?: string | null) {
  return value ? formatDate(value) : 'N/A'
}

function getBusinessErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Revisa tu conexion e intenta nuevamente.'
  }

  return error.message
}
