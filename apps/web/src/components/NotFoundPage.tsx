import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-lg font-semibold">Page not found</h1>
      <Link to="/" className="mt-2 inline-block text-sm text-primary underline">
        Back to dashboard
      </Link>
    </div>
  );
}
