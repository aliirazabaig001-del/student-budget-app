import { PERMISSIONS, type PermissionCode } from '@skoolledger/shared';
import {
  AlertCircle,
  BriefcaseBusiness,
  Boxes,
  Calculator,
  CircleDollarSign,
  CreditCard,
  FileBarChart,
  GraduationCap,
  History,
  LayoutDashboard,
  type LucideIcon,
  Package,
  Receipt,
  Settings,
  Users,
  WalletCards,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Hidden unless the user has all of these (the API enforces them too). */
  permissions?: PermissionCode[];
  /**
   * Set for modules whose screen is designed but whose backend is not built
   * yet. The page renders as a clearly-labelled preview with sample data.
   */
  pending?: { milestone: number; summary: string };
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

/**
 * Single definition of the sidebar. When a module's backend is built, remove
 * its `pending` entry and connect its page to the real API.
 */
export const NAVIGATION: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        path: '/',
        icon: LayoutDashboard,
        permissions: [PERMISSIONS.DASHBOARD_VIEW],
      },
    ],
  },
  {
    title: 'Students & fees',
    items: [
      {
        label: 'Students',
        path: '/students',
        icon: GraduationCap,
        pending: {
          milestone: 2,
          summary: 'Student records, classes and sections, with Excel import.',
        },
      },
      {
        label: 'Fees',
        path: '/fees',
        icon: WalletCards,
        pending: {
          milestone: 3,
          summary: 'Fee heads and fee structures per class, with discounts and concessions.',
        },
      },
      {
        label: 'Vouchers',
        path: '/vouchers',
        icon: Receipt,
        pending: {
          milestone: 5,
          summary: 'Branded, print-ready fee vouchers generated as PDF for every student.',
        },
      },
      {
        label: 'Payments',
        path: '/payments',
        icon: CreditCard,
        pending: {
          milestone: 6,
          summary: 'Fee collection, receipts and a complete ledger for every student.',
        },
      },
      {
        label: 'Defaulters',
        path: '/defaulters',
        icon: AlertCircle,
        pending: {
          milestone: 7,
          summary: 'Outstanding fee lists, ageing and fee recovery follow-up.',
        },
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        label: 'Payroll',
        path: '/payroll',
        icon: BriefcaseBusiness,
        pending: {
          milestone: 8,
          summary: 'Teacher and staff salaries, allowances, deductions and salary slips.',
        },
      },
      {
        label: 'Expenses',
        path: '/expenses',
        icon: Calculator,
        pending: { milestone: 9, summary: 'Expense recording with categories and approvals.' },
      },
      {
        label: 'Inventory',
        path: '/inventory',
        icon: Boxes,
        pending: {
          milestone: 10,
          summary: 'Stock of books, uniforms and supplies with issue and receipt tracking.',
        },
      },
      {
        label: 'Purchases',
        path: '/purchases',
        icon: Package,
        pending: { milestone: 10, summary: 'Suppliers, purchase orders and supplier payments.' },
      },
    ],
  },
  {
    title: 'Finance & control',
    items: [
      {
        label: 'Accounts',
        path: '/accounts',
        icon: CircleDollarSign,
        pending: { milestone: 9, summary: 'Cash and bank accounts, transfers and balances.' },
      },
      {
        label: 'Reports',
        path: '/reports',
        icon: FileBarChart,
        pending: {
          milestone: 11,
          summary: 'Financial reports: collections, income and expenditure, cash flow and more.',
        },
      },
      {
        label: 'Audit Log',
        path: '/audit-log',
        icon: History,
        permissions: [PERMISSIONS.AUDIT_READ],
      },
      { label: 'Users', path: '/users', icon: Users, permissions: [PERMISSIONS.USERS_READ] },
      {
        label: 'Settings',
        path: '/settings',
        icon: Settings,
        permissions: [PERMISSIONS.SETTINGS_READ],
      },
    ],
  },
];

export const ALL_NAV_ITEMS = NAVIGATION.flatMap((section) => section.items);

export const PENDING_ITEMS = ALL_NAV_ITEMS.filter(
  (item): item is NavItem & Required<Pick<NavItem, 'pending'>> => Boolean(item.pending),
);

/** Looks up the nav entry for a path (used for the header title). */
export function navItemFor(pathname: string): NavItem | undefined {
  return ALL_NAV_ITEMS.find((item) =>
    item.path === '/' ? pathname === '/' : pathname.startsWith(item.path),
  );
}
