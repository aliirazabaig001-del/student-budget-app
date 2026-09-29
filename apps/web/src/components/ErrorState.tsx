import { Alert, Button } from '@skoolledger/ui';
import { errorMessage } from '@/lib/api-client';

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Alert variant="destructive" title="Could not load this information">
      <p>{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Alert>
  );
}
