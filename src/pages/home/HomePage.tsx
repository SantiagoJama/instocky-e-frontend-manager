import { useMemo, useState } from 'react'
import { FiActivity, FiDatabase, FiMenu, FiShield } from 'react-icons/fi'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { navigationSections } from '../../features/dashboard/navigation'
import { CustomerPage } from '../customer/CustomerPage'
import { Sidebar } from '../../shared/components/sidebar/Sidebar'
import './HomePage.css'

const defaultPath = navigationSections[0]?.children[0]?.path ?? '/'

export function HomePage() {
  const { user } = useAuth()
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : ''
  const [activePath, setActivePath] = useState(defaultPath)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const activeItem = useMemo(() => {
    return navigationSections
      .flatMap((section) =>
        section.children.map((child) => ({
          ...child,
          sectionLabel: section.label,
        })),
      )
      .find((item) => item.path === activePath)
  }, [activePath])

  const pageContent = useMemo(() => {
    if (activePath === '/customer/create') {
      return <CustomerPage mode="create" />
    }

    if (activePath === '/customer/view') {
      return <CustomerPage mode="view" />
    }

    return <DashboardOverview activeLabel={activeItem ? `${activeItem.sectionLabel} / ${activeItem.label}` : 'Dashboard'} />
  }, [activeItem, activePath])

  function handleNavigate(path: string) {
    setActivePath(path)
    setIsSidebarOpen(false)
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        activePath={activePath}
        isOpen={isSidebarOpen}
        navigationSections={navigationSections}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      {isSidebarOpen ? (
        <button
          className="dashboard-backdrop"
          type="button"
          aria-label="Cerrar menu"
          onClick={() => setIsSidebarOpen(false)}
        />
      ) : null}

      <button
        className="dashboard-menu-trigger"
        type="button"
        aria-label="Abrir menu"
        onClick={() => setIsSidebarOpen(true)}
      >
        <FiMenu aria-hidden="true" />
      </button>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-header__eyebrow">{activeItem?.sectionLabel ?? 'Home'}</p>
            <h1>{activeItem?.label ?? 'Dashboard'}</h1>
          </div>
          <div className="dashboard-header__status" aria-label="Sesion activa">
            <span aria-hidden="true" />
            {fullName || user?.email}
          </div>
        </header>

        {pageContent}
      </main>
    </div>
  )
}

function DashboardOverview({ activeLabel }: { activeLabel: string }) {
  return (
    <>
      <section className="workspace-panel" aria-labelledby="workspace-title">
        <div>
          <p className="workspace-panel__eyebrow">Modulo seleccionado</p>
          <h2 id="workspace-title">{activeLabel}</h2>
          <p>
            Esta vista queda preparada para conectar tablas, formularios y acciones de cada feature
            sin mezclar la navegacion con la logica del modulo.
          </p>
        </div>
      </section>

      <section className="metric-grid" aria-label="Resumen operativo">
        <article className="metric-card">
          <FiDatabase aria-hidden="true" />
          <div>
            <span>Datos</span>
            <strong>Listos para API</strong>
          </div>
        </article>
        <article className="metric-card">
          <FiShield aria-hidden="true" />
          <div>
            <span>Acceso</span>
            <strong>Vista protegida</strong>
          </div>
        </article>
        <article className="metric-card">
          <FiActivity aria-hidden="true" />
          <div>
            <span>Estado</span>
            <strong>Operativo</strong>
          </div>
        </article>
      </section>
    </>
  )
}
