/**
 * FICTIONAL SAMPLE DATA — for "UI ready — backend module pending" screens only.
 * Nothing here is read from or written to the SkoolLedger API. See README.md.
 */

export const sampleStudents = [
  {
    id: 'S-1',
    name: 'Aarav Mehta',
    admission: 'SL-2024-084',
    className: 'Grade 8',
    section: 'A',
    guardian: 'Rohan Mehta',
    phone: '+92 301 778 2214',
    status: 'Active',
    balance: 0,
  },
  {
    id: 'S-2',
    name: 'Mira Shah',
    admission: 'SL-2024-087',
    className: 'Grade 7',
    section: 'B',
    guardian: 'Nadia Shah',
    phone: '+92 321 451 9062',
    status: 'Active',
    balance: 12500,
  },
  {
    id: 'S-3',
    name: 'Zayan Farooq',
    admission: 'SL-2024-095',
    className: 'Grade 9',
    section: 'A',
    guardian: 'Hassan Farooq',
    phone: '+92 333 807 1148',
    status: 'Active',
    balance: 7200,
  },
  {
    id: 'S-4',
    name: 'Anaya Rao',
    admission: 'SL-2024-100',
    className: 'Grade 6',
    section: 'C',
    guardian: 'Kiran Rao',
    phone: '+92 300 613 3990',
    status: 'Active',
    balance: 0,
  },
  {
    id: 'S-5',
    name: 'Hamza Siddiqui',
    admission: 'SL-2024-108',
    className: 'Grade 10',
    section: 'A',
    guardian: 'Sana Siddiqui',
    phone: '+92 322 182 4456',
    status: 'On hold',
    balance: 28900,
  },
  {
    id: 'S-6',
    name: 'Ibrahim Khan',
    admission: 'SL-2024-117',
    className: 'Grade 5',
    section: 'B',
    guardian: 'Ayesha Khan',
    phone: '+92 312 712 6401',
    status: 'Active',
    balance: 4600,
  },
] as const;

export const sampleFeeHeads = [
  { name: 'Tuition fee', className: 'All grades', amount: 18500, frequency: 'Monthly' },
  { name: 'Transport', className: 'Grades 1–10', amount: 4500, frequency: 'Monthly' },
  { name: 'Annual resource fee', className: 'All grades', amount: 12000, frequency: 'Annual' },
  { name: 'Technology lab', className: 'Grades 6–10', amount: 2200, frequency: 'Termly' },
] as const;

export interface SampleVoucher {
  number: string;
  month: string;
  dueDate: string;
  student: string;
  className: string;
  tuition: number;
  transport: number;
  arrears: number;
  discount: number;
  total: number;
}

export const sampleVouchers: SampleVoucher[] = [
  {
    number: 'SLV-SAMPLE-084',
    month: 'March',
    dueDate: '10 March',
    student: 'Aarav Mehta',
    className: 'Grade 8 — A',
    tuition: 18500,
    transport: 4500,
    arrears: 0,
    discount: 1000,
    total: 22000,
  },
  {
    number: 'SLV-SAMPLE-087',
    month: 'March',
    dueDate: '10 March',
    student: 'Mira Shah',
    className: 'Grade 7 — B',
    tuition: 18500,
    transport: 4500,
    arrears: 12500,
    discount: 0,
    total: 35500,
  },
  {
    number: 'SLV-SAMPLE-095',
    month: 'March',
    dueDate: '10 March',
    student: 'Zayan Farooq',
    className: 'Grade 9 — A',
    tuition: 18500,
    transport: 0,
    arrears: 7200,
    discount: 0,
    total: 25700,
  },
];

export const samplePayments = [
  {
    student: 'Aarav Mehta',
    invoice: 'SLV-SAMPLE-084',
    amount: 22000,
    date: '04 Mar',
    method: 'Bank transfer',
    reference: 'REF-0001',
  },
  {
    student: 'Anaya Rao',
    invoice: 'SLV-SAMPLE-100',
    amount: 23000,
    date: '03 Mar',
    method: 'Cash',
    reference: 'REF-0002',
  },
  {
    student: 'Ibrahim Khan',
    invoice: 'SLV-SAMPLE-117',
    amount: 14200,
    date: '28 Feb',
    method: 'Bank transfer',
    reference: 'REF-0003',
  },
] as const;

export const sampleDefaulters = [
  {
    student: 'Hamza Siddiqui',
    className: 'Grade 10 — A',
    guardian: 'Sana Siddiqui',
    phone: '+92 322 182 4456',
    due: 28900,
    lastPayment: '12 Dec',
    days: 82,
    status: 'High risk',
  },
  {
    student: 'Mira Shah',
    className: 'Grade 7 — B',
    guardian: 'Nadia Shah',
    phone: '+92 321 451 9062',
    due: 12500,
    lastPayment: '06 Jan',
    days: 57,
    status: 'Follow up',
  },
  {
    student: 'Ibrahim Khan',
    className: 'Grade 5 — B',
    guardian: 'Ayesha Khan',
    phone: '+92 312 712 6401',
    due: 4600,
    lastPayment: '12 Feb',
    days: 20,
    status: 'Monitor',
  },
] as const;

export const sampleStaff = [
  {
    name: 'Naila Hussain',
    role: 'Primary teacher',
    base: 118000,
    allowances: 12000,
    deductions: 8000,
    advances: 0,
    net: 122000,
  },
  {
    name: 'Farhan Qureshi',
    role: 'Operations manager',
    base: 165000,
    allowances: 18000,
    deductions: 14500,
    advances: 12000,
    net: 156500,
  },
  {
    name: 'Sadia Malik',
    role: 'Accounts officer',
    base: 98000,
    allowances: 8500,
    deductions: 6500,
    advances: 0,
    net: 100000,
  },
] as const;

export const sampleExpenses = [
  {
    category: 'Utilities',
    vendor: 'Sample Electric Co.',
    date: '05 Mar',
    amount: 184500,
    method: 'Bank transfer',
  },
  {
    category: 'Repairs',
    vendor: 'Sample Facilities',
    date: '04 Mar',
    amount: 37800,
    method: 'Cash',
  },
  {
    category: 'Teaching supplies',
    vendor: 'Paper & Board Co.',
    date: '02 Mar',
    amount: 24650,
    method: 'Bank transfer',
  },
] as const;

export const sampleInventory = [
  {
    item: 'A4 copy paper',
    category: 'Stationery',
    quantity: 34,
    reorder: 20,
    supplier: 'Paper & Board Co.',
    unit: 1280,
  },
  {
    item: 'Whiteboard markers',
    category: 'Classroom',
    quantity: 12,
    reorder: 24,
    supplier: 'EduMart Supplies',
    unit: 480,
  },
  {
    item: 'First aid refill kit',
    category: 'Safety',
    quantity: 3,
    reorder: 6,
    supplier: 'MedSupply',
    unit: 4200,
  },
] as const;

export const samplePurchases = [
  {
    supplier: 'Paper & Board Co.',
    order: 'PO-SAMPLE-019',
    date: '02 Mar',
    total: 24650,
    paid: 24650,
    status: 'Paid',
  },
  {
    supplier: 'EduMart Supplies',
    order: 'PO-SAMPLE-017',
    date: '28 Feb',
    total: 58400,
    paid: 30000,
    status: 'Part paid',
  },
  {
    supplier: 'Printline Systems',
    order: 'PO-SAMPLE-012',
    date: '18 Feb',
    total: 86000,
    paid: 0,
    status: 'Due',
  },
] as const;

export const sampleCashMovement = [
  { month: 'Oct', income: 3.2, expenses: 1.4 },
  { month: 'Nov', income: 3.6, expenses: 1.6 },
  { month: 'Dec', income: 3.3, expenses: 1.8 },
  { month: 'Jan', income: 4.1, expenses: 1.7 },
  { month: 'Feb', income: 4.3, expenses: 1.9 },
  { month: 'Mar', income: 3.8, expenses: 2.0 },
];

/** Display helper for sample amounts only. */
export const sampleMoney = (value: number) => `PKR ${value.toLocaleString('en-PK')}`;
