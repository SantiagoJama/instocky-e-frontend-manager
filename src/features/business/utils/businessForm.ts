import type {
  BusinessContact,
  BusinessUserPayload,
  UpdateBusinessPayload,
} from '../types/business.types'
import { z } from 'zod'

export type ValidationErrors = Record<string, string>

export type BusinessEditForm = Required<UpdateBusinessPayload>

function numericTextSchema(label: string, maxLength: number) {
  return z.string()
    .trim()
    .min(1, `${label} es obligatorio.`)
    .regex(/^\d+$/, 'Solo se permiten digitos.')
    .max(maxLength, `Maximo ${maxLength} digitos.`)
}

function lettersSchema(label: string) {
  return z.string()
    .trim()
    .min(1, `${label} es obligatorio.`)
    .regex(/^[\p{L}\p{M} ]+$/u, 'Solo se permiten letras y espacios.')
}

const rucSchema = z.string()
  .trim()
  .min(1, 'RUC es obligatorio.')
  .regex(/^\d+$/, 'Solo se permiten digitos.')
  .min(10, 'Minimo 10 digitos.')
  .max(13, 'Maximo 13 digitos.')

const phoneSchema = numericTextSchema('Mobile phone', 10)
const businessNameSchema = z.string()
  .trim()
  .min(1, 'Business name es obligatorio.')
  .regex(/^[\p{L}\p{M}0-9 ]+$/u, 'Solo se permiten letras, numeros y espacios.')
const websiteSchema = z.string()
  .trim()
  .min(1, 'Website es obligatorio.')
  .regex(
    /^(https?:\/\/)?(www\.)?[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z]{2,})+(?:[/?#][^\s]*)?$/,
    'Ingresa un website valido, por ejemplo www.example.com.ec.',
  )
const tenantNameSchema = z.string()
  .trim()
  .min(1, 'Tenant name es obligatorio.')
  .regex(/^[A-Za-z0-9_]+$/, 'Solo letras, numeros y guion bajo.')
const requiredAddressSchema = z.string()
  .trim()
  .min(1, 'Address 1 es obligatorio.')
  .max(500, 'Maximo 500 caracteres.')
const optionalAddressSchema = z.string()
  .trim()
  .max(500, 'Maximo 500 caracteres.')
const basePhoneSchema = z.string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => value === '' || value === 'N/A' || /^\d{1,10}$/.test(value), {
    message: 'Usa N/A o solo digitos, maximo 10.',
  })
const emailSchema = z.string()
  .trim()
  .min(1, 'Email es obligatorio.')
  .email('Ingresa un email valido.')

export function validateBusinessEditForm(form: BusinessEditForm, includeRequired: boolean) {
  const errors: ValidationErrors = {}

  validatePhone(errors, 'business.ruc', form.business.ruc ?? '', includeRequired, 'RUC')
  validateText(errors, 'business.the_name', form.business.the_name ?? '', {
    includeRequired,
    label: 'Business name',
    pattern: /^[\p{L}0-9 ]+$/u,
    message: 'Solo letras, numeros y espacios.',
  })
  validateLetters(errors, 'business.business_type', form.business.business_type ?? '', includeRequired, 'Business type')
  validateWebsite(errors, 'business.website', form.business.website ?? '', includeRequired)
  validateText(errors, 'business.tenant_name', form.business.tenant_name ?? '', {
    includeRequired,
    label: 'Tenant name',
    pattern: /^[A-Za-z0-9_]+$/,
    message: 'Solo letras, numeros y guion bajo.',
  })
  validateLetters(errors, 'business_location.country', form.business_location.country ?? '', includeRequired, 'Country')
  validateLetters(errors, 'business_location.city', form.business_location.city ?? '', includeRequired, 'City')
  validateLetters(errors, 'business_location.province', form.business_location.province ?? '', includeRequired, 'Province')
  validateAddress(errors, 'business_location.address1', form.business_location.address1 ?? '', includeRequired, 'Address 1')
  validateAddress(errors, 'business_location.address2', form.business_location.address2 ?? '', includeRequired, 'Address 2')
  validatePhone(
    errors,
    'business_contact.mobile_phone_number',
    form.business_contact.mobile_phone_number ?? '',
    includeRequired,
  )
  validateBasePhone(
    errors,
    'business_contact.base_phone_number',
    form.business_contact.base_phone_number ?? '',
    false,
  )
  validateEmail(errors, 'business_contact.email', form.business_contact.email ?? '', includeRequired)
  validateZodField(errors, 'business.ruc', form.business.ruc ?? '', rucSchema, includeRequired)
  validateZodField(errors, 'business.the_name', form.business.the_name ?? '', businessNameSchema, includeRequired)
  validateZodField(errors, 'business.website', form.business.website ?? '', websiteSchema, includeRequired)
  validateZodField(errors, 'business.tenant_name', form.business.tenant_name ?? '', tenantNameSchema, includeRequired)
  validateZodField(errors, 'business_location.country', form.business_location.country ?? '', lettersSchema('Country'), includeRequired)
  validateZodField(errors, 'business_location.city', form.business_location.city ?? '', lettersSchema('City'), includeRequired)
  validateZodField(errors, 'business_location.province', form.business_location.province ?? '', lettersSchema('Province'), includeRequired)
  validateZodField(errors, 'business_location.address1', form.business_location.address1 ?? '', requiredAddressSchema, includeRequired)
  validateZodField(errors, 'business_location.address2', form.business_location.address2 ?? '', optionalAddressSchema, true)
  validateZodField(
    errors,
    'business_contact.mobile_phone_number',
    form.business_contact.mobile_phone_number ?? '',
    phoneSchema,
    includeRequired,
  )
  validateZodField(
    errors,
    'business_contact.base_phone_number',
    form.business_contact.base_phone_number ?? '',
    basePhoneSchema,
    true,
  )
  validateZodField(errors, 'business_contact.email', form.business_contact.email ?? '', emailSchema, includeRequired)

  return errors
}

export function validateBusinessUserForm(
  user: BusinessUserPayload,
  includeRequired: boolean,
  options: { includePassword: boolean },
) {
  const errors: ValidationErrors = {}

  validateLetters(errors, 'first_name', user.first_name, includeRequired, 'First name')
  validateLetters(errors, 'last_name', user.last_name, includeRequired, 'Last name')
  validateEmail(errors, 'user_name', user.user_name, includeRequired)

  if (options.includePassword) {
    validatePassword(errors, 'user_password', user.user_password ?? '', includeRequired)
  }

  if (user.rol !== 'Admin' && user.rol !== 'General') {
    errors.rol = 'Selecciona Admin o General.'
  }

  return errors
}

export function validatePasswordForm(password: string, includeRequired: boolean) {
  const errors: ValidationErrors = {}
  validatePassword(errors, 'password', password, includeRequired)
  return errors
}

export function sanitizeBusinessValue(section: keyof BusinessEditForm, field: string, value: string) {
  if (section === 'business' && field === 'ruc') {
    return onlyDigits(value, 13)
  }

  if (section === 'business' && field === 'the_name') {
    return value.replace(/[^\p{L}0-9 ]/gu, '')
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
    return value.slice(0, 500)
  }

  if (section === 'business_contact' && field === 'mobile_phone_number') {
    return onlyDigits(value, 10)
  }

  if (section === 'business_contact' && field === 'base_phone_number') {
    return sanitizeBasePhone(value)
  }

  return value
}

export function sanitizeBusinessUserValue(field: keyof BusinessUserPayload, value: string) {
  if (field === 'first_name' || field === 'last_name') {
    return onlyLetters(value)
  }

  if (field === 'user_name') {
    return value.replace(/\s/g, '').toLowerCase()
  }

  return value
}

export function toTenantName(value: string) {
  return value.trim().replace(/\s+/g, '_').toLowerCase()
}

export function createSecurePassword() {
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

export function normalizeBusinessEditPayload(form: BusinessEditForm): UpdateBusinessPayload {
  return {
    business: {
      ...form.business,
      ruc: form.business.ruc?.trim(),
      the_name: form.business.the_name?.trim(),
      business_type: form.business.business_type?.trim(),
      website: form.business.website?.trim(),
      tenant_name: form.business.tenant_name ? toTenantName(form.business.tenant_name) : form.business.tenant_name,
    },
    business_location: {
      ...form.business_location,
      country: form.business_location.country?.trim(),
      city: form.business_location.city?.trim(),
      province: form.business_location.province?.trim(),
      address1: form.business_location.address1?.trim(),
      address2: normalizeOptionalDefault(form.business_location.address2 ?? ''),
    },
    business_contact: normalizeBusinessContact(form.business_contact),
  }
}

export function normalizeBusinessUserPayload<T extends BusinessUserPayload>(user: T): T {
  return {
    ...user,
    first_name: user.first_name.trim(),
    last_name: user.last_name.trim(),
    user_name: user.user_name.trim().toLowerCase(),
    user_password: user.user_password?.trim(),
  }
}

export function getBusinessPlaceholder(label: string, type = 'text') {
  const examples: Record<string, string> = {
    RUC: 'Ej: 0999999999001',
    Name: 'Ej: Comercio Agil',
    'Business type': 'Ej: Retail',
    Website: 'Ej: www.example.com.ec',
    'Tenant name': 'Ej: comercio_agil',
    Country: 'Ej: Ecuador',
    City: 'Ej: Guayaquil',
    Province: 'Ej: Guayas',
    'Address 1': 'Ej: Avenida 10 / Sur',
    'Address 2': 'Ej: Oficina 301 o N/A',
    'Mobile phone': 'Ej: 0999999999',
    'Base phone': 'Ej: 022222222 o N/A',
    Email: 'Ej: negocio@example.com',
    'First name': 'Ej: Grace',
    'Last name': 'Ej: Hopper',
    'User email': 'Ej: grace@example.com',
    Password: 'Ej: Secure-password3',
    'New password': 'Ej: Secure-password4',
  }

  return examples[label] ?? (type === 'email' ? 'Ej: user@example.com' : 'Escribe un valor')
}

function normalizeBusinessContact(contact: Partial<BusinessContact>) {
  return {
    mobile_phone_number: contact.mobile_phone_number?.trim(),
    base_phone_number: normalizeOptionalDefault(contact.base_phone_number ?? ''),
    email: contact.email?.trim().toLowerCase(),
  }
}

function normalizeOptionalDefault(value: string) {
  return value.trim() || 'N/A'
}

function validateZodField(
  errors: ValidationErrors,
  path: string,
  value: unknown,
  schema: z.ZodType,
  includeRequired: boolean,
) {
  if (!includeRequired && typeof value === 'string' && !value.trim()) {
    delete errors[path]
    return
  }

  const result = schema.safeParse(value)
  if (result.success) {
    delete errors[path]
    return
  }

  errors[path] = result.error.issues[0]?.message ?? 'Valor invalido.'
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
    pattern: /^\d{1,10}$/,
    message: 'Solo digitos, maximo 10.',
  })
}

function validateBasePhone(errors: ValidationErrors, path: string, value: string, includeRequired: boolean) {
  validateText(errors, path, value, {
    includeRequired,
    label: 'Base phone',
    pattern: /^(N\/A|\d{1,10})$/,
    message: 'Usa N/A o solo digitos, maximo 10.',
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
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    if (includeRequired) {
      errors[path] = 'Website es obligatorio.'
    }
    return
  }

  const websitePattern =
    /^(https?:\/\/)?(www\.)?[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z]{2,})+(?:[/?#][^\s]*)?$/

  if (!websitePattern.test(trimmedValue)) {
    errors[path] = 'Ingresa un website valido, por ejemplo www.example.com.ec.'
  }
}

function validateAddress(errors: ValidationErrors, path: string, value: string, includeRequired: boolean, label: string) {
  validateText(errors, path, value, {
    includeRequired,
    label,
    pattern: /^[\p{L}0-9 .,\-/]+$/u,
    message: 'Solo letras, numeros, espacios, punto, coma y guion.',
  })
}

function validatePassword(errors: ValidationErrors, path: string, value: string, includeRequired: boolean) {
  validateText(errors, path, value, {
    includeRequired,
    label: 'Password',
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/,
    message: 'Debe tener 12+ caracteres, mayuscula, minuscula, numero y simbolo.',
  })
}

function onlyLetters(value: string) {
  return value.replace(/[^\p{L} ]/gu, '')
}

function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, '').slice(0, maxLength)
}

function sanitizeBasePhone(value: string) {
  const upperValue = value.toUpperCase()

  if ('N/A'.startsWith(upperValue)) {
    return upperValue
  }

  return onlyDigits(value, 10)
}

function randomChar(source: string) {
  const randomValue = crypto.getRandomValues(new Uint32Array(1))[0]
  return source[randomValue % source.length]
}
