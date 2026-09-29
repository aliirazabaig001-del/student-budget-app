import { PERMISSIONS, type PermissionCode } from '@skoolledger/shared';
import {
  BarChart3,
  Boxes,
  FileText,
  Landmark,
  LayoutDashboard,
  type LucideIcon,
  Receipt,
  ScrollText,
  Settings,
  ShoppingCart,
  UserCog,
  Users,
  UserX,
  Wallet,
  WalletCards,
  Coins,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Hidden unless the user has all of these (the API enforces them too). */
  permissions?: PermissionCode[];
  /** Set for modules not built yet; shows a "Coming in next milestone" page. */
  comingSoon?: { milestone: number; summary: string };
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

/**
 * Single definition of the sidebar and of the placeholder routes for future
 * modules. When a module is built, remove its `comingSoon` entry and register
 * the real page in `router.tsx`.
 */
export const NAVIGATION: NavSection[] = [
  {
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
    title: 'Students & Fees',
    items: [
      {
        label: 'Students',
        path: '/students',
        icon: Users,
        comingSoon: {
          milestone: 2,
          summary: 'Student records, classes and sections, with Excel import.',
        },
      },
      {
        label: 'Fees',
        path: '/fees',
        icon: Coins,
        comingSoon: {
          milestone: 3,
          summary: 'Fee heads and fee structures per class, with discounts and concessions.',
        },
      },
      {
        label: 'Vouchers',
        path: '/vouchers',
        icon: FileText,
        comingSoon: {
          milestone: 5,
          summary: 'Branded, print-ready fee vouchers generated as PDF for every student.',
        },
      },
      {
        label: 'Payments',
        path: '/payments',
        icon: Receipt,
        comingSoon: {
          milestone: 6,
          summary: 'Fee collection, receipts and a complete ledger for every student.',
        },
      },
      {
        label: 'Defaulters',
        path: '/defaulters',
        icon: UserX,
        comingSoon: {
          milestone: 7,
          summary: 'Outstanding fee lists, ageing and fee recovery follow-up.',
        },
      },
    ],
  },
  {
    title: 'Staff',
    items: [
      {
        label: 'Payroll',
        path: '/payroll',
        icon: WalletCards,
        comingSoon: {
          milestone: 8,
          summary: 'Teacher and staff salaries, allowances, deductions and salary slips.',
        },
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        label: 'Expenses',
        path: '/expenses',
        icon: Wallet,
        comingSoon: { milestone: 9, summary: 'Expense recording with categories and approvals.' },
      },
      {
        label: 'Inventory',
        path: '/inventory',
        icon: Boxes,
        comingSoon: {
          milestone: 10,
          summary: 'Stock of books, uniforms and supplies with issue and receipt tracking.',
        },
      },
      {
        label: 'Purchases',
        path: '/purchases',
        icon: ShoppingCart,
        comingSoon: { milestone: 10, summary: 'Suppliers, purchase orders and supplier payments.' },
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        label: 'Accounts',
        path: '/accounts',
        icon: Landmark,
        comingSoon: { milestone: 9, summary: 'Cash and bank accounts, transfers and balances.' },
      },
      {
        label: 'Reports',
        path: '/reports',
        icon: BarChart3,
        comingSoon: {
          milestone: 11,
          summary: 'Financial reports: collections, income and expenditure, cash flow and more.',
        },
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users', path: '/users', icon: UserCog, permissions: [PERMISSIONS.USERS_READ] },
      {
        label: 'Audit Log',
        path: '/audit-log',
        icon: ScrollText,
        permissions: [PERMISSIONS.AUDIT_READ],
      },
      {
        label: 'Settings',
        path: '/settings',
        icon: Settings,
        permissions: [PERMISSIONS.SETTINGS_READ],
      },
    ],
  },
];

export const COMING_SOON_ITEMS = NAVIGATION.flatMap((section) => section.items).filter(
  (item): item is NavItem & Required<Pick<NavItem, 'comingSoon'>> => Boolean(item.comingSoon),
);
