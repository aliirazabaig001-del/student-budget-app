import { Badge, Card, CardContent } from '@skoolledger/ui';
import { Construction } from 'lucide-react';
import { PageHeader } from './PageHeader';

/**
 * Placeholder for modules scheduled in later milestones. It intentionally
 * shows no sample data so nobody mistakes it for working functionality.
 */
export function ComingSoonPage({
  title,
  milestone,
  summary,
}: {
  title: string;
  milestone: number;
  summary: string;
}) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <Construction className="size-8 text-muted-foreground" aria-hidden />
          <Badge variant="outline">Milestone {milestone}</Badge>
          <h2 className="text-lg font-semibold">Coming in next milestone</h2>
          <p className="max-w-md text-sm text-muted-foreground">{summary}</p>
        </CardContent>
      </Card>
    </>
  );
}
