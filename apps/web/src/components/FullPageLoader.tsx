import { Spinner } from '@skoolledger/ui';
import { BrandMark } from './BrandMark';

export function FullPageLoader() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <BrandMark />
      <Spinner label="Loading SkoolLedger" />
    </div>
  );
}
