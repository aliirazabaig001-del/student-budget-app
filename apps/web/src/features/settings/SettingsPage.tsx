import { zodResolver } from '@hookform/resolvers/zod';
import {
  PERMISSIONS,
  SUPPORTED_CURRENCIES,
  schoolSettingsSchema,
  type SchoolSettingsDto,
  type SchoolSettingsInput,
  type SchoolSettingsValues,
} from '@skoolledger/shared';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  NativeSelect,
  Skeleton,
  Textarea,
} from '@skoolledger/ui';
import { type InputHTMLAttributes, type ReactNode, useEffect, useState } from 'react';
import { useForm, type UseFormRegister, type FieldErrors } from 'react-hook-form';
import { toast } from 'sonner';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/features/auth/auth-context';
import { applyServerErrors } from '@/lib/form-errors';
import { formatDateTime } from '@/lib/format';
import { useSchoolSettings, useUpdateSchoolSettings } from './api';
import { LogoCard } from './LogoCard';

type FormValues = SchoolSettingsInput;

function toFormValues(dto: SchoolSettingsDto): FormValues {
  return {
    schoolName: dto.schoolName,
    campusName: dto.campusName ?? '',
    address: dto.address ?? '',
    phone: dto.phone ?? '',
    email: dto.email ?? '',
    currency: dto.currency as FormValues['currency'],
    academicSession: dto.academicSession ?? '',
    bankName: dto.bankName ?? '',
    accountTitle: dto.accountTitle ?? '',
    accountNumber: dto.accountNumber ?? '',
    iban: dto.iban ?? '',
    jazzCash: dto.jazzCash ?? '',
    easypaisa: dto.easypaisa ?? '',
  };
}

export function SettingsPage() {
  const { data, isLoading, isError, error, refetch } = useSchoolSettings();

  return (
    <>
      <PageHeader
        title="School Settings"
        description="Branding, contact and payment details used across SkoolLedger, including on fee vouchers."
      />
      {isLoading ? (
        <SettingsSkeleton />
      ) : isError || !data ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <SettingsForm settings={data} />
          <div>
            <LogoCard settings={data} />
          </div>
        </div>
      )}
    </>
  );
}

function SettingsForm({ settings }: { settings: SchoolSettingsDto }) {
  const { can } = useAuth();
  const canEdit = can(PERMISSIONS.SETTINGS_UPDATE);
  const update = useUpdateSchoolSettings();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues, unknown, SchoolSettingsValues>({
    resolver: zodResolver(schoolSettingsSchema),
    defaultValues: toFormValues(settings),
  });

  useEffect(() => reset(toFormValues(settings)), [settings, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await update.mutateAsync(values);
      toast.success('School settings saved.');
    } catch (err) {
      setFormError(applyServerErrors(err, setError));
    }
  });

  const field = (name: keyof FormValues) => ({ register, errors, name });

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={!canEdit || isSubmitting} className="space-y-6">
        {!canEdit && (
          <Alert variant="info" title="View only">
            You can view these settings but not change them.
          </Alert>
        )}
        {formError && <Alert variant="destructive" title={formError} />}

        <Section
          title="School profile"
          description="Shown on the sign-in page, reports and vouchers."
        >
          <TextField
            {...field('schoolName')}
            label="School name"
            required
            className="sm:col-span-2"
          />
          <TextField {...field('campusName')} label="Campus name" placeholder="e.g. Main Campus" />
          <TextField
            {...field('phone')}
            label="Phone"
            placeholder="e.g. 042-35123456"
            inputMode="tel"
          />
          <TextField
            {...field('email')}
            label="Email"
            type="email"
            placeholder="office@school.edu.pk"
          />
          <FormField
            id="address"
            label="Address"
            error={errors.address?.message}
            className="sm:col-span-2"
          >
            <Textarea rows={2} {...register('address')} />
          </FormField>
        </Section>

        <Section title="Academic & currency">
          <FormField id="currency" label="Currency" required error={errors.currency?.message}>
            <NativeSelect {...register('currency')}>
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <TextField
            {...field('academicSession')}
            label="Academic session"
            placeholder="e.g. 2026-2027"
          />
        </Section>

        <Section
          title="Bank & mobile wallets"
          description="Payment details printed on fee vouchers so parents know where to pay."
        >
          <TextField {...field('bankName')} label="Bank name" placeholder="e.g. Meezan Bank" />
          <TextField {...field('accountTitle')} label="Account title" />
          <TextField {...field('accountNumber')} label="Account number" inputMode="numeric" />
          <TextField {...field('iban')} label="IBAN" placeholder="PK36 SCBL 0000 0011 2345 6702" />
          <TextField
            {...field('jazzCash')}
            label="JazzCash"
            placeholder="03XX-XXXXXXX"
            inputMode="tel"
          />
          <TextField
            {...field('easypaisa')}
            label="Easypaisa"
            placeholder="03XX-XXXXXXX"
            inputMode="tel"
          />
        </Section>
      </fieldset>

      {canEdit && (
        <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-3 border-t border-border bg-background/95 py-4 backdrop-blur">
          <span className="text-xs text-muted-foreground">
            Last saved {formatDateTime(settings.updatedAt)}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty || isSubmitting}
              onClick={() => reset(toFormValues(settings))}
            >
              Discard changes
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              Save settings
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

function TextField({
  register,
  errors,
  name,
  label,
  required,
  className,
  ...inputProps
}: {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  name: keyof FormValues;
  label: string;
  required?: boolean;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>) {
  return (
    <FormField
      id={name}
      label={label}
      required={required}
      error={errors[name]?.message}
      className={className}
    >
      <Input {...inputProps} {...register(name)} />
    </FormField>
  );
}

function SettingsSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </CardContent>
        <CardFooter />
      </Card>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
