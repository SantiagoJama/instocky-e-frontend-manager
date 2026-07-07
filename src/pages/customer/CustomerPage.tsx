import { CustomerCreateForm } from '../../features/customer/components/CustomerCreateForm'
import { CustomerTable } from '../../features/customer/components/CustomerTable'

type CustomerPageProps = {
  mode: 'create' | 'view'
}

export function CustomerPage({ mode }: CustomerPageProps) {
  return mode === 'create' ? <CustomerCreateForm /> : <CustomerTable />
}
