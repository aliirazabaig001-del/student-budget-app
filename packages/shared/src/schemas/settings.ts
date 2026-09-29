import { z } from 'zod';
import { CURRENCY_CODES } from '../constants';
import { optionalText, requiredText } from './common';

const phonePattern = /^[+0-9][0-9\s-]{5,19}$/;

const optionalPhone = (label: string) =>
  optionalText(20).refine((v) => v === null || phonePattern.test(v), {
    message: `${label} may contain digits, spaces, dashes and a leading +`,
  });

/** IBAN: 2 letters, 2 digits, then 11–30 alphanumerics. Spaces are ignored. */
const ibanSchema = z
  .string()
  .nullish()
  .transform((v) => (v ? v.replace(/\s+/g, '').toUpperCase() : null))
  .refine((v) => v === null || /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(v), {
    message: 'Enter a valid IBAN (e.g. PK36SCBL0000001123456702)',
  });

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || z.string().email().safeParse(v).success, {
    message: 'Enter a valid email address',
  });

export const schoolSettingsSchema = z.object({
  schoolName: requiredText('School name', 150),
  campusName: optionalText(150),
  address: optionalText(500),
  phone: optionalPhone('Phone'),
  email: optionalEmail,
  currency: z.enum(CURRENCY_CODES, {
    errorMap: () => ({ message: 'Select a supported currency' }),
  }),
  academicSession: optionalText(20),
  bankName: optionalText(120),
  accountTitle: optionalText(150),
  accountNumber: optionalText(40).refine((v) => v === null || /^[0-9\s-]+$/.test(v), {
    message: 'Account number may contain digits, spaces and dashes',
  }),
  iban: ibanSchema,
  jazzCash: optionalPhone('JazzCash number'),
  easypaisa: optionalPhone('Easypaisa number'),
});

export type SchoolSettingsInput = z.input<typeof schoolSettingsSchema>;
export type SchoolSettingsValues = z.output<typeof schoolSettingsSchema>;
