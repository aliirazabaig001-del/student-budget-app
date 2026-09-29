import { LOGO_UPLOAD } from '@skoolledger/shared';

export const ACCEPTED_LOGO_TYPES = LOGO_UPLOAD.mimeTypes.join(',');
export const MAX_LOGO_KB = Math.round(LOGO_UPLOAD.maxBytes / 1024);

/** Checks type and size before uploading. The server re-checks the actual bytes. */
export function validateLogoFile(file: File): string | null {
  if (!(LOGO_UPLOAD.mimeTypes as readonly string[]).includes(file.type)) {
    return 'Please choose a PNG, JPEG or WebP image.';
  }
  if (file.size > LOGO_UPLOAD.maxBytes) return `The logo must be smaller than ${MAX_LOGO_KB} KB.`;
  return null;
}
