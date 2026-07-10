import { useMemo, useState } from 'react'
import { FiActivity, FiDatabase, FiMenu, FiShield } from 'react-icons/fi'
import { useAuth } from '../../features/auth/hooks/useAuth'
import type { AuthUser } from '../../features/auth/types/auth.types'
import { navigationSections } from '../../features/dashboard/navigation'
import { BusinessPage } from '../business/BusinessPage'
import { CustomerPage } from '../customer/CustomerPage'
import { LogsPage } from '../logs/LogsPage'
import { PermissionPage } from '../permission/PermissionPage'
import { UserPage } from '../user/UserPage'
import { Sidebar } from '../../shared/components/sidebar/Sidebar'
import './HomePage.css'

export function HomePage() {
  const { user } = useAuth()
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : ''
  const visibleNavigationSections = useMemo(() => getVisibleNavigationSections(user), [user])
  const defaultPath = visibleNavigationSections[0]?.children[0]?.path ?? '/'
  const [activePath, setActivePath] = useState(defaultPath)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const effectiveActivePath = useMemo(() => {
    const isActivePathVisible = visibleNavigationSections.some((section) =>
      section.children.some((child) => child.path === activePath),
    )

    return isActivePathVisible ? activePath : defaultPath
  }, [activePath, defaultPath, visibleNavigationSections])

  const activeItem = useMemo(() => {
    return visibleNavigationSections
      .flatMap((section) =>
        section.children.map((child) => ({
          ...child,
          sectionLabel: section.label,
        })),
      )
      .find((item) => item.path === effectiveActivePath)
  }, [effectiveActivePath, visibleNavigationSections])

  const pageContent = useMemo(() => {
    if (effectiveActivePath === '/customer/create') {
      return <CustomerPage mode="create" />
    }

    if (effectiveActivePath === '/customer/view') {
      return <CustomerPage mode="view" />
    }

    if (effectiveActivePath === '/business/view') {
      return <BusinessPage />
    }

    if (effectiveActivePath === '/manager/view') {
      return <UserPage />
    }

    if (effectiveActivePath === '/manager/permissions') {
      return <PermissionPage />
    }

    if (effectiveActivePath === '/manager/logs') {
      return <LogsPage />
    }

    return <DashboardOverview activeLabel={activeItem ? `${activeItem.sectionLabel} / ${activeItem.label}` : 'Dashboard'} />
  }, [activeItem, effectiveActivePath])

  function handleNavigate(path: string) {
    setActivePath(path)
    setIsSidebarOpen(false)
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        activePath={effectiveActivePath}
        isOpen={isSidebarOpen}
        navigationSections={visibleNavigationSections}
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

function getVisibleNavigationSections(user: AuthUser | null) {
  if (!user) {
    return []
  }

  return navigationSections
    .map((section) => ({
      ...section,
      children: section.children.filter((child) => canAccessPermission(user, child.permission)),
    }))
    .filter((section) => section.children.length > 0)
}

function canAccessPermission(user: AuthUser, permission: string) {
  return user.hasAllPermissions || user.permissions.includes(permission)
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
