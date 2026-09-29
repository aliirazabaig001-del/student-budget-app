import { Button } from '@skoolledger/ui';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router';
import { logoUrl, useBranding } from '@/features/settings/api';
import { Sidebar } from './Sidebar';
import { UserMenu } from './UserMenu';

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: branding } = useBranding();

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-[272px] shrink-0 lg:block">
        <div className="fixed inset-y-0 w-[272px]">
          <Sidebar />
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[272px] shadow-xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-5 text-sidebar-foreground"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {branding?.hasLogo && (
              <img
                src={logoUrl(branding.logoUpdatedAt)}
                alt=""
                className="size-9 rounded object-contain"
              />
            )}
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold">{branding?.schoolName ?? ' '}</div>
              {branding?.campusName && (
                <div className="truncate text-xs text-muted-foreground">{branding.campusName}</div>
              )}
            </div>
          </div>
          <UserMenu />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
