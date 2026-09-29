import { PERMISSIONS, type SchoolSettingsDto } from '@skoolledger/shared';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@skoolledger/ui';
import { ImageOff, Trash2, Upload } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/auth-context';
import { errorMessage } from '@/lib/api-client';
import { logoUrl, useRemoveLogo, useUploadLogo } from './api';
import { ACCEPTED_LOGO_TYPES, MAX_LOGO_KB, validateLogoFile } from './logo-validation';

export function LogoCard({ settings }: { settings: SchoolSettingsDto }) {
  const { can } = useAuth();
  const canEdit = can(PERMISSIONS.SETTINGS_UPDATE);
  const upload = useUploadLogo();
  const remove = useRemoveLogo();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const onFileChosen = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const problem = validateLogoFile(file);
    if (problem) return setError(problem);

    setError(null);
    try {
      await upload.mutateAsync(file);
      toast.success('Logo updated.');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const onRemove = async () => {
    setError(null);
    try {
      await remove.mutateAsync();
      toast.success('Logo removed.');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>School logo</CardTitle>
        <CardDescription>
          PNG, JPEG or WebP, up to {MAX_LOGO_KB} KB. A square image works best.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex aspect-square w-full max-w-56 items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-muted/40">
          {settings.hasLogo ? (
            <img
              src={logoUrl(settings.logoUpdatedAt)}
              alt={`${settings.schoolName} logo`}
              className="size-full object-contain p-3"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageOff className="size-8" aria-hidden />
              <span className="text-xs">No logo uploaded</span>
            </div>
          )}
        </div>

        {error && <Alert variant="destructive" title={error} />}

        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_LOGO_TYPES}
              className="hidden"
              onChange={(e) => void onFileChosen(e)}
              data-testid="logo-input"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              loading={upload.isPending}
            >
              <Upload /> {settings.hasLogo ? 'Replace logo' : 'Upload logo'}
            </Button>
            {settings.hasLogo && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => void onRemove()}
                loading={remove.isPending}
              >
                <Trash2 /> Remove
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
