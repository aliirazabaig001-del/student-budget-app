import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@skoolledger/ui';
import { ChevronDown, KeyRound, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useCurrentUser, useAuth } from '@/features/auth/auth-context';
import { initials } from '@/lib/format';

export function UserMenu() {
  const user = useCurrentUser();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // The local session is cleared regardless; nothing else to do.
    }
    toast.success('You have been signed out.');
    navigate('/login', { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Account menu"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-[#dfe8f3] text-[11px] font-extrabold text-[#31598a]">
          {initials(user.fullName)}
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block text-sm font-medium">{user.fullName}</span>
          <span className="block text-xs text-muted-foreground">
            {user.roles.map((r) => r.name).join(', ') || 'No role'}
          </span>
        </span>
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="font-medium">{user.fullName}</div>
          <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/change-password')}>
          <KeyRound /> Change password
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void handleLogout()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
