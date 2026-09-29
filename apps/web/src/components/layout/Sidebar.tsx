import { cn } from '@skoolledger/ui';
import { NavLink } from 'react-router';
import { NAVIGATION } from '@/app/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { BrandMark } from '../BrandMark';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useAuth();

  return (
    <nav aria-label="Main" className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-white/5 px-5">
        <BrandMark inverted />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {NAVIGATION.map((section, index) => {
          const items = section.items.filter(
            (item) => !item.permissions || can(...item.permissions),
          );
          if (items.length === 0) return null;
          return (
            <div key={section.title ?? index} className="mb-5">
              {section.title && (
                <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
                  {section.title}
                </div>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-sidebar-active font-medium text-white'
                            : 'hover:bg-white/5 hover:text-white',
                        )
                      }
                    >
                      <item.icon className="size-4 shrink-0 opacity-80" aria-hidden />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.comingSoon && (
                        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sidebar-muted">
                          Soon
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="border-t border-white/5 px-5 py-3 text-[11px] text-sidebar-muted">
        Version {__APP_VERSION__}
      </div>
    </nav>
  );
}
