import { cn } from '@skoolledger/ui';
import { ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router';
import { NAVIGATION } from '@/app/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { BrandMark } from '../BrandMark';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useAuth();

  return (
    <nav aria-label="Main" className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-[76px] shrink-0 items-center border-b border-sidebar-border px-5">
        <BrandMark inverted />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-5">
        {NAVIGATION.map((section, index) => {
          const items = section.items.filter(
            (item) => !item.permissions || can(...item.permissions),
          );
          if (items.length === 0) return null;
          return (
            <div key={section.title ?? index} className="mb-6">
              {section.title && (
                <div className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-sidebar-muted">
                  {section.title}
                </div>
              )}
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'group flex h-10 items-center gap-3 rounded-[7px] px-3 text-[12.5px] font-semibold transition-colors',
                          isActive
                            ? 'bg-sidebar-active text-[#18243b]'
                            : 'hover:bg-sidebar-hover hover:text-white',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className="size-[17px] shrink-0"
                            strokeWidth={isActive ? 2.2 : 1.8}
                            aria-hidden
                          />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.pending && (
                            <span
                              title="UI ready — backend module pending"
                              className={cn(
                                'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                                isActive ? 'bg-[#18243b]/10' : 'bg-white/5 text-sidebar-muted',
                              )}
                            >
                              Preview
                            </span>
                          )}
                          {isActive && !item.pending && (
                            <ChevronRight className="size-3.5" aria-hidden />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="border-t border-sidebar-border px-5 py-3 text-[10.5px] text-sidebar-muted">
        Version {__APP_VERSION__}
      </div>
    </nav>
  );
}
