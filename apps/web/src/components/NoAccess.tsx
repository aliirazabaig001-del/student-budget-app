import { Button, Card, CardContent } from '@skoolledger/ui';
import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router';

export function NoAccess() {
  return (
    <Card className="mx-auto mt-10 max-w-md text-center">
      <CardContent className="flex flex-col items-center gap-3 p-8">
        <ShieldOff className="size-8 text-muted-foreground" aria-hidden />
        <h2 className="text-lg font-semibold">You do not have access to this page</h2>
        <p className="text-sm text-muted-foreground">
          Ask your School Admin to grant you the required permission.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
