export const APP_NAME = 'SkoolLedger';
export const APP_TAGLINE = 'Fees • Payroll • Inventory • Accounts';

/** Currencies offered in School Settings. ISO 4217 codes. */
export const SUPPORTED_CURRENCIES = [
  { code: 'PKR', label: 'Pakistani Rupee (PKR)' },
  { code: 'INR', label: 'Indian Rupee (INR)' },
  { code: 'BDT', label: 'Bangladeshi Taka (BDT)' },
  { code: 'AED', label: 'UAE Dirham (AED)' },
  { code: 'SAR', label: 'Saudi Riyal (SAR)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'EUR', label: 'Euro (EUR)' },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]['code'];

export const CURRENCY_CODES = SUPPORTED_CURRENCIES.map((c) => c.code) as [
  CurrencyCode,
  ...CurrencyCode[],
];

export const LOGO_UPLOAD = {
  /** Accepted image types. SVG is deliberately excluded (it can carry scripts). */
  mimeTypes: ['image/png', 'image/jpeg', 'image/webp'] as const,
  maxBytes: 1024 * 1024,
};

export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
};
