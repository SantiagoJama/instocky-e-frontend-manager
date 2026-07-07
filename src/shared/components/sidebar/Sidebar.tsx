import { FiLogOut, FiX } from 'react-icons/fi'
import { Tooltip } from 'react-tooltip'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import type { NavigationSection } from '../../../features/dashboard/navigation'

type SidebarProps = {
  activePath: string
  isOpen: boolean
  navigationSections: NavigationSection[]
  onClose: () => void
  onNavigate: (path: string) => void
}

export function Sidebar({
  activePath,
  isOpen,
  navigationSections,
  onClose,
  onNavigate,
}: SidebarProps) {
  const { logout, user } = useAuth()
  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : ''
  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}` : ''

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} aria-label="Menu principal">
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <span className="sidebar__brand-mark" aria-hidden="true">
            IM
          </span>
          <div>
            <strong>Instocky</strong>
            <span>Manager</span>
          </div>
        </div>
        <button className="sidebar__close" type="button" aria-label="Cerrar menu" onClick={onClose}>
          <FiX aria-hidden="true" />
        </button>
      </div>

      <nav className="sidebar__nav">
        {navigationSections.map((section) => {
          const SectionIcon = section.icon

          return (
            <section className="sidebar__section" key={section.id}>
              <div className="sidebar__section-title">
                <SectionIcon aria-hidden="true" />
                <span>{section.label}</span>
              </div>

              <div className="sidebar__items">
                {section.children.map((item) => {
                  const ItemIcon = item.icon
                  const isActive = activePath === item.path

                  return (
                    <button
                      className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
                      type="button"
                      key={item.id}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => onNavigate(item.path)}
                    >
                      <ItemIcon aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <span className="sidebar__avatar" aria-hidden="true">
            {initials.toUpperCase()}
          </span>
          <div>
            <strong>{fullName}</strong>
            <span>{user?.role}</span>
          </div>
        </div>
        <button
          className="sidebar__logout"
          type="button"
          data-tooltip-id="logout-tooltip"
          data-tooltip-content="Cerrar sesion"
          aria-label="Cerrar sesion"
          onClick={() => void logout()}
        >
          <FiLogOut aria-hidden="true" />
        </button>
        <Tooltip id="logout-tooltip" />
      </div>
    </aside>
  )
}
