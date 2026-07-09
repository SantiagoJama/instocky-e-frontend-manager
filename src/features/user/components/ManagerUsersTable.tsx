import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { FiEdit2, FiKey, FiPlus, FiRefreshCw, FiSlash, FiUnlock } from 'react-icons/fi'
import { Tooltip } from 'react-tooltip'
import Swal from 'sweetalert2'
import { useAuth } from '../../auth/hooks/useAuth'
import { useLogoutOnUnauthorized } from '../../auth/hooks/useLogoutOnUnauthorized'
import type { AuthUser } from '../../auth/types/auth.types'
import {
  assignPermissionToUserRequest,
  listPermissionsRequest,
  listUserPermissionsRequest,
  updateUserPermissionStatusRequest,
} from '../../permission/services/permissionApi'
import type { Permission, PermissionRole, UserPermission } from '../../permission/types/permission.types'
import { useManagerUsers } from '../hooks/useManagerUsers'
import {
  changeManagerUserPasswordRequest,
  createManagerUserRequest,
  updateManagerUserRequest,
  updateManagerUserStatusRequest,
} from '../services/userApi'
import type { ManagerUser, ManagerUserPayload, ManagerUserStatus } from '../types/user.types'
import { formatDate } from '../../../shared/utils/convertionDate'
import './UserComponents.css'

type ValidationErrors = Record<string, string>
type PermissionSelection = Record<string, boolean>

type ModalState =
  | { type: 'create' }
  | { type: 'edit'; user: ManagerUser }
  | { type: 'password'; user: ManagerUser }
  | null

const emptyCreateForm: ManagerUserPayload = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'support',
}

export function ManagerUsersTable() {
  const { accessToken, user: currentUser } = useAuth()
  const logoutOnUnauthorized = useLogoutOnUnauthorized()
  const { users, pagination, page, search, status, isLoading, error, setPage, setSearch, setStatus, reload } =
    useManagerUsers(accessToken, logoutOnUnauthorized)
  const [modal, setModal] = useState<ModalState>(null)
  const canCreateUsers = canUseManagerPermission(currentUser, 'users.create')
  const canUpdateUsers = canUseManagerPermission(currentUser, 'users.update')

  async function toggleStatus(user: ManagerUser) {
    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    if (!canUpdateUsers) {
      await Swal.fire('Permiso requerido', 'No tienes permiso para actualizar usuarios.', 'warning')
      return
    }

    const nextStatus = !user.isActive
    const action = nextStatus ? 'activar' : 'inactivar'
    const result = await Swal.fire({
      title: `${nextStatus ? 'Activar' : 'Inactivar'} usuario`,
      text: `Seguro que quieres ${action} ${user.email}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Si, ${action}`,
      cancelButtonText: 'Cancelar',
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      await updateManagerUserStatusRequest(user.id, nextStatus, { accessToken })
      await Swal.fire(nextStatus ? 'Usuario activado' : 'Usuario inactivado', 'El estado fue actualizado.', 'success')
      await reload()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo actualizar', getUserErrorMessage(requestError), 'error')
    }
  }

  return (
    <section className="user-page" aria-labelledby="manager-users-title">
      <header className="user-page__header">
        <div>
          <p>Manager</p>
          <h2 id="manager-users-title">View users</h2>
        </div>
        <div className="user-header-actions">
          <button className="secondary-button" type="button" onClick={() => void reload()}>
            <FiRefreshCw aria-hidden="true" />
            Refresh
          </button>
          {canCreateUsers ? (
            <button className="primary-action" type="button" onClick={() => setModal({ type: 'create' })}>
              <FiPlus aria-hidden="true" />
              Create user
            </button>
          ) : null}
        </div>
      </header>

      <div className="user-toolbar">
        <label className="input-field user-search">
          <span>Search</span>
          <input
            type="search"
            value={search}
            maxLength={120}
            placeholder="First name, last name or email"
            onChange={(event) => {
              setPage(1)
              setSearch(event.target.value)
            }}
          />
        </label>
        <label className="input-field user-status-filter">
          <span>Status</span>
          <select
            value={status}
            onChange={(event) => {
              setPage(1)
              setStatus(event.target.value as ManagerUserStatus)
            }}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      {error ? <p className="form-alert">{error}</p> : null}

      <div className="user-table-shell">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Password changed</th>
              <th>Last login</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9}>Loading users...</td>
              </tr>
            ) : null}
            {!isLoading && users.length === 0 ? (
              <tr>
                <td colSpan={9}>No users found.</td>
              </tr>
            ) : null}
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>
                  <span>
                    {user.firstName} {user.lastName}
                  </span>
                </td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.isActive ? 'Active' : 'Inactive'}</td>
                <td>{formatSafeDate(user.passwordChangedAt)}</td>
                <td>{formatSafeDate(user.lastLoginAt)}</td>
                <td>{formatSafeDate(user.createdAt)}</td>
                <td>
                  <div className="user-actions">
                    {canUpdateUsers ? (
                      <>
                        <IconAction label="Edit user" tooltipId={`edit-user-${user.id}`} onClick={() => setModal({ type: 'edit', user })}>
                          <FiEdit2 aria-hidden="true" />
                        </IconAction>
                        <IconAction
                          label={user.isActive ? 'Inactivate user' : 'Activate user'}
                          tooltipId={`status-user-${user.id}`}
                          onClick={() => void toggleStatus(user)}
                        >
                          {user.isActive ? <FiSlash aria-hidden="true" /> : <FiUnlock aria-hidden="true" />}
                        </IconAction>
                        <IconAction
                          label="Change password"
                          tooltipId={`password-user-${user.id}`}
                          onClick={() => setModal({ type: 'password', user })}
                        >
                          <FiKey aria-hidden="true" />
                        </IconAction>
                      </>
                    ) : (
                      <span className="user-action-empty">Read only</span>
                    )}
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

      {modal ? (
        <ManagerUserModal
          modal={modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
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
        className="user-action-button"
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

function ManagerUserModal({ modal, onClose, onSaved }: { modal: ModalState; onClose: () => void; onSaved: () => void }) {
  if (!modal) {
    return null
  }

  const title = modal.type === 'create' ? 'Create user' : modal.type === 'edit' ? 'Edit user' : 'Change password'

  return (
    <div className="user-modal-backdrop" role="presentation">
      <section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
        <header className="user-modal__header">
          <div>
            <p>Manager</p>
            <h3 id="user-modal-title">{title}</h3>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
        </header>
        {modal.type === 'create' ? <CreateUserForm onSaved={onSaved} onCancel={onClose} /> : null}
        {modal.type === 'edit' ? <EditUserForm user={modal.user} onSaved={onSaved} onCancel={onClose} /> : null}
        {modal.type === 'password' ? <PasswordForm user={modal.user} onSaved={onSaved} onCancel={onClose} /> : null}
      </section>
    </div>
  )
}

function CreateUserForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const { accessToken } = useAuth()
  const logoutOnUnauthorized = useLogoutOnUnauthorized()
  const [form, setForm] = useState<ManagerUserPayload>(emptyCreateForm)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { permissions, isLoading: isLoadingPermissions, error: permissionsError } = useActivePermissions(
    accessToken,
    logoutOnUnauthorized,
  )
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionSelection>({})
  const errors = useMemo(() => validateUserForm(form, submitAttempted, true), [form, submitAttempted])

  function updateField(field: keyof ManagerUserPayload, value: string) {
    setForm((current) => ({ ...current, [field]: sanitizeUserValue(field, value) }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitAttempted(true)

    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    const submitErrors = validateUserForm(form, true, true)
    if (Object.keys(submitErrors).length > 0) {
      await Swal.fire('Formulario incompleto', 'Revisa los campos marcados en rojo.', 'warning')
      return
    }

    setIsSaving(true)

    try {
      const response = await createManagerUserRequest(normalizeCreatePayload(form), { accessToken })
      const permissionIds = getSelectedPermissionIds(selectedPermissions, permissions, form.role)

      if (form.role !== 'admin') {
        await Promise.all(
          permissionIds.map((permissionId) =>
            assignPermissionToUserRequest(response.data.id, permissionId, { accessToken }),
          ),
        )
      }

      await Swal.fire('Usuario creado', 'El usuario manager fue creado correctamente.', 'success')
      onSaved()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo crear', getUserErrorMessage(requestError), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <UserFields form={form} errors={errors} includePassword onChange={updateField} />
      <PermissionSelector
        disabled={form.role === 'admin'}
        error={permissionsError}
        isLoading={isLoadingPermissions}
        permissions={permissions}
        targetRole={form.role}
        selectedPermissions={selectedPermissions}
        onToggle={(permissionId, isChecked) =>
          setSelectedPermissions((current) => ({ ...current, [permissionId]: isChecked }))
        }
      />
      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="primary-action" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function EditUserForm({ user, onSaved, onCancel }: { user: ManagerUser; onSaved: () => void; onCancel: () => void }) {
  const { accessToken } = useAuth()
  const logoutOnUnauthorized = useLogoutOnUnauthorized()
  const initialForm = useMemo(
    () => ({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      password: '',
    }),
    [user],
  )
  const [form, setForm] = useState<ManagerUserPayload>(initialForm)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { permissions, isLoading: isLoadingPermissions, error: permissionsError } = useActivePermissions(
    accessToken,
    logoutOnUnauthorized,
  )
  const {
    selectedPermissions,
    initialSelectedPermissions,
    userPermissionAssignments,
    setSelectedPermissions,
    isLoading: isLoadingUserPermissions,
    error: userPermissionsError,
  } = useUserPermissionSelection(user.id, accessToken, logoutOnUnauthorized)
  const errors = useMemo(() => validateUserForm(form, submitAttempted, false), [form, submitAttempted])
  const hasChanges = form.firstName !== initialForm.firstName || form.lastName !== initialForm.lastName || form.email !== initialForm.email
  const hasPermissionChanges = !arePermissionSelectionsEqual(selectedPermissions, initialSelectedPermissions)

  function updateField(field: keyof ManagerUserPayload, value: string) {
    if (field === 'role' || field === 'password') {
      return
    }

    setForm((current) => ({ ...current, [field]: sanitizeUserValue(field, value) }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitAttempted(true)

    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    if (!hasChanges && !hasPermissionChanges) {
      return
    }

    const submitErrors = validateUserForm(form, true, false)
    if (Object.keys(submitErrors).length > 0) {
      await Swal.fire('Formulario incompleto', 'Revisa los campos marcados en rojo.', 'warning')
      return
    }

    setIsSaving(true)

    try {
      if (hasChanges) {
        await updateManagerUserRequest(user.id, normalizeUpdatePayload(form), { accessToken })
      }

      if (hasPermissionChanges && user.role !== 'admin') {
        await saveUserPermissionChanges({
          accessToken,
          userId: user.id,
          selectedPermissions,
          initialSelectedPermissions,
          assignments: userPermissionAssignments,
        })
      }

      await Swal.fire('Usuario actualizado', 'Los cambios fueron guardados.', 'success')
      onSaved()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo guardar', getUserErrorMessage(requestError), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <UserFields form={form} errors={errors} readOnlyRole onChange={updateField} />
      <PermissionSelector
        disabled={form.role === 'admin'}
        error={permissionsError || userPermissionsError}
        isLoading={isLoadingPermissions || isLoadingUserPermissions}
        permissions={permissions}
        targetRole={form.role}
        selectedPermissions={selectedPermissions}
        onToggle={(permissionId, isChecked) =>
          setSelectedPermissions((current) => ({ ...current, [permissionId]: isChecked }))
        }
      />
      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="primary-action" type="submit" disabled={isSaving || (!hasChanges && !hasPermissionChanges)}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function PermissionSelector({
  permissions,
  selectedPermissions,
  isLoading,
  error,
  disabled,
  targetRole,
  onToggle,
}: {
  permissions: Permission[]
  targetRole: PermissionRole
  selectedPermissions: PermissionSelection
  isLoading: boolean
  error: string | null
  disabled: boolean
  onToggle: (permissionId: string, isChecked: boolean) => void
}) {
  const assignablePermissions = useMemo(
    () => permissions.filter((permission) => permission.allowedRoles.includes(targetRole)),
    [permissions, targetRole],
  )

  return (
    <fieldset className="user-permission-section">
      <legend>Permissions</legend>
      {disabled ? <p className="user-form-note">Admin has all permissions by rule.</p> : null}
      {error ? <p className="form-alert">{error}</p> : null}
      <div className="permission-option-grid">
        {isLoading ? <p>Loading permissions...</p> : null}
        {!isLoading && assignablePermissions.length === 0 ? <p>No active permissions found for this role.</p> : null}
        {assignablePermissions.map((permission) => (
          <label className="permission-option" key={permission.id}>
            <input
              type="checkbox"
              checked={Boolean(selectedPermissions[permission.id])}
              disabled={disabled}
              onChange={(event) => onToggle(permission.id, event.target.checked)}
            />
            <span>
              <strong>{permission.code}</strong>
              <small>{permission.name}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function PasswordForm({ user, onSaved, onCancel }: { user: ManagerUser; onSaved: () => void; onCancel: () => void }) {
  const { accessToken } = useAuth()
  const logoutOnUnauthorized = useLogoutOnUnauthorized()
  const [password, setPassword] = useState('')
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const errors = useMemo(() => validatePassword(password, submitAttempted), [password, submitAttempted])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitAttempted(true)

    if (!accessToken) {
      await Swal.fire('Sesion requerida', 'Inicia sesion nuevamente.', 'warning')
      return
    }

    const submitErrors = validatePassword(password, true)
    if (Object.keys(submitErrors).length > 0) {
      await Swal.fire('Password invalido', 'Revisa la contrasena ingresada.', 'warning')
      return
    }

    setIsSaving(true)

    try {
      await changeManagerUserPasswordRequest(user.id, password, { accessToken })
      await Swal.fire('Password actualizado', 'La contrasena fue cambiada correctamente.', 'success')
      onSaved()
    } catch (requestError) {
      logoutOnUnauthorized(requestError)
      await Swal.fire('No se pudo cambiar', getUserErrorMessage(requestError), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <p className="user-form-note">{user.email}</p>
      <TextInput
        label="Password"
        type="password"
        value={password}
        required
        error={errors.password}
        action={
          <button className="input-action" type="button" aria-label="Generate password" onClick={() => setPassword(createSecurePassword())}>
            <FiKey aria-hidden="true" />
          </button>
        }
        onChange={setPassword}
      />
      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="primary-action" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function UserFields({
  form,
  errors,
  includePassword = false,
  readOnlyRole = false,
  onChange,
}: {
  form: ManagerUserPayload
  errors: ValidationErrors
  includePassword?: boolean
  readOnlyRole?: boolean
  onChange: (field: keyof ManagerUserPayload, value: string) => void
}) {
  return (
    <div className="form-grid">
      <TextInput label="First name" value={form.firstName} required error={errors.firstName} onChange={(value) => onChange('firstName', value)} />
      <TextInput label="Last name" value={form.lastName} required error={errors.lastName} onChange={(value) => onChange('lastName', value)} />
      <TextInput label="Email" type="email" value={form.email} required error={errors.email} onChange={(value) => onChange('email', value)} />
      {includePassword ? (
        <TextInput
          label="Password"
          type="password"
          value={form.password}
          required
          error={errors.password}
          action={
            <button className="input-action" type="button" aria-label="Generate password" onClick={() => onChange('password', createSecurePassword())}>
              <FiKey aria-hidden="true" />
            </button>
          }
          onChange={(value) => onChange('password', value)}
        />
      ) : null}
      <label className="input-field">
        <span>Role</span>
        <select
          value={form.role}
          disabled={readOnlyRole}
          aria-invalid={Boolean(errors.role)}
          onChange={(event) => onChange('role', event.target.value)}
        >
          <option value="support">Support</option>
          <option value="admin">Admin</option>
        </select>
        {errors.role ? <small className="field-error">{errors.role}</small> : null}
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
          placeholder={getPlaceholder(label, type)}
          onChange={(event) => onChange(event.target.value)}
        />
        {action}
      </span>
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  )
}

function validateUserForm(form: ManagerUserPayload, includeRequired: boolean, includePassword: boolean) {
  const errors: ValidationErrors = {}
  validateLetters(errors, 'firstName', form.firstName, includeRequired, 'First name')
  validateLetters(errors, 'lastName', form.lastName, includeRequired, 'Last name')
  validateEmail(errors, 'email', form.email, includeRequired)

  if (includePassword) {
    Object.assign(errors, validatePassword(form.password, includeRequired))
  }

  if (form.role !== 'admin' && form.role !== 'support') {
    errors.role = 'Selecciona admin o support.'
  }

  return errors
}

function validatePassword(password: string, includeRequired: boolean) {
  const errors: ValidationErrors = {}
  validateText(errors, 'password', password, {
    includeRequired,
    label: 'Password',
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/,
    message: 'Debe tener 12+ caracteres, mayuscula, minuscula, numero y simbolo.',
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

function validateLetters(errors: ValidationErrors, path: string, value: string, includeRequired: boolean, label: string) {
  validateText(errors, path, value, {
    includeRequired,
    label,
    pattern: /^[\p{L} ]+$/u,
    message: 'Solo se permiten letras y espacios.',
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

function sanitizeUserValue(field: keyof ManagerUserPayload, value: string) {
  if (field === 'firstName' || field === 'lastName') {
    return value.replace(/[^\p{L} ]/gu, '')
  }

  if (field === 'email') {
    return value.replace(/\s/g, '').toLowerCase()
  }

  return value
}

function normalizeCreatePayload(form: ManagerUserPayload): ManagerUserPayload {
  return {
    ...form,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password.trim(),
  }
}

function normalizeUpdatePayload(form: ManagerUserPayload) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim().toLowerCase(),
  }
}

function useActivePermissions(accessToken: string | null, onUnauthorized: (error: unknown) => boolean) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) {
      return
    }

    let isMounted = true
    const currentAccessToken = accessToken

    async function loadPermissions() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await listPermissionsRequest({
          accessToken: currentAccessToken,
          page: 1,
          limit: 100,
          status: 'active',
        })

        if (isMounted) {
          setPermissions(response.data)
        }
      } catch (requestError) {
        onUnauthorized(requestError)

        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los permisos.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadPermissions()

    return () => {
      isMounted = false
    }
  }, [accessToken, onUnauthorized])

  return { permissions, isLoading, error }
}

function useUserPermissionSelection(
  userId: string,
  accessToken: string | null,
  onUnauthorized: (error: unknown) => boolean,
) {
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionSelection>({})
  const [initialSelectedPermissions, setInitialSelectedPermissions] = useState<PermissionSelection>({})
  const [userPermissionAssignments, setUserPermissionAssignments] = useState<UserPermission[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) {
      return
    }

    let isMounted = true
    const currentAccessToken = accessToken

    async function loadUserPermissions() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await listUserPermissionsRequest(userId, { accessToken: currentAccessToken })
        const selection = response.data.reduce<PermissionSelection>((current, assignment) => {
          current[assignment.permission.id] = assignment.isActive
          return current
        }, {})

        if (isMounted) {
          setUserPermissionAssignments(response.data)
          setSelectedPermissions(selection)
          setInitialSelectedPermissions(selection)
        }
      } catch (requestError) {
        onUnauthorized(requestError)

        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los permisos del usuario.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadUserPermissions()

    return () => {
      isMounted = false
    }
  }, [accessToken, onUnauthorized, userId])

  return {
    selectedPermissions,
    initialSelectedPermissions,
    userPermissionAssignments,
    setSelectedPermissions,
    isLoading,
    error,
  }
}

function getSelectedPermissionIds(selection: PermissionSelection, permissions: Permission[], targetRole: PermissionRole) {
  const assignablePermissionIds = new Set(
    permissions.filter((permission) => permission.allowedRoles.includes(targetRole)).map((permission) => permission.id),
  )

  return Object.entries(selection)
    .filter(([permissionId, isSelected]) => isSelected && assignablePermissionIds.has(permissionId))
    .map(([permissionId]) => permissionId)
}

function arePermissionSelectionsEqual(left: PermissionSelection, right: PermissionSelection) {
  const permissionIds = new Set([...Object.keys(left), ...Object.keys(right)])

  return [...permissionIds].every((permissionId) => Boolean(left[permissionId]) === Boolean(right[permissionId]))
}

async function saveUserPermissionChanges({
  accessToken,
  userId,
  selectedPermissions,
  initialSelectedPermissions,
  assignments,
}: {
  accessToken: string
  userId: string
  selectedPermissions: PermissionSelection
  initialSelectedPermissions: PermissionSelection
  assignments: UserPermission[]
}) {
  const permissionIds = new Set([...Object.keys(selectedPermissions), ...Object.keys(initialSelectedPermissions)])

  await Promise.all(
    [...permissionIds].map((permissionId) => {
      const nextValue = Boolean(selectedPermissions[permissionId])
      const previousValue = Boolean(initialSelectedPermissions[permissionId])

      if (nextValue === previousValue) {
        return Promise.resolve()
      }

      const assignment = assignments.find((item) => item.permission.id === permissionId)

      return assignment
        ? updateUserPermissionStatusRequest(userId, permissionId, nextValue, { accessToken })
        : assignPermissionToUserRequest(userId, permissionId, { accessToken })
    }),
  )
}

function createSecurePassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%*-_'
  const all = `${upper}${lower}${digits}${symbols}`
  const password = [randomChar(upper), randomChar(lower), randomChar(digits), randomChar(symbols)]

  while (password.length < 14) {
    password.push(randomChar(all))
  }

  return password.sort(() => crypto.getRandomValues(new Uint32Array(1))[0] - 2147483648).join('')
}

function randomChar(source: string) {
  const randomValue = crypto.getRandomValues(new Uint32Array(1))[0]
  return source[randomValue % source.length]
}

function getPlaceholder(label: string, type: string) {
  const examples: Record<string, string> = {
    'First name': 'Ej: Grace',
    'Last name': 'Ej: Hopper',
    Email: 'Ej: grace@example.com',
    Password: 'Ej: Secure-password1',
  }

  return examples[label] ?? (type === 'email' ? 'Ej: user@example.com' : 'Escribe un valor')
}

function formatSafeDate(value?: string | null) {
  return value ? formatDate(value) : 'N/A'
}

function getUserErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Revisa tu conexion e intenta nuevamente.'
  }

  return error.message
}

function canUseManagerPermission(user: AuthUser | null, permission: string) {
  return Boolean(user?.hasAllPermissions || user?.permissions.includes(permission))
}
