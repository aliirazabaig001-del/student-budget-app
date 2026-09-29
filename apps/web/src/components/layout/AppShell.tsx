import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { navItemFor } from '@/app/navigation';
import { logoUrl, useBranding } from '@/features/settings/api';
import { Sidebar } from './Sidebar';
import { UserMenu } from './UserMenu';

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: branding } = useBranding();
  const { pathname } = useLocation();
  const pageLabel = navItemFor(pathname)?.label ?? 'Workspace';

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-[246px] shrink-0 lg:block">
        <div className="fixed inset-y-0 w-[246px]">
          <Sidebar />
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-[#18243b]/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[246px] shadow-xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-7 text-sidebar-foreground"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[76px] items-center gap-3 border-b border-border bg-[#f8fafc]/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            className="text-[#526178] lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {branding?.hasLogo && (
              <img
                src={logoUrl(branding.logoUpdatedAt)}
                alt=""
                className="size-9 rounded object-contain"
              />
            )}
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-[#8793a5]">
                {branding?.schoolName ?? ' '}
                {branding?.campusName ? ` · ${branding.campusName}` : ''}
              </p>
              <p className="mt-0.5 truncate font-display text-[18px] font-extrabold tracking-[-0.03em] text-primary">
                {pageLabel}
              </p>
            </div>
          </div>
          <UserMenu />
        </header>
        <main className="flex-1 p-5 lg:p-8">
          <div className="mx-auto max-w-[1540px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
