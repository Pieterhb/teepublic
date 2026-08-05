import { Suspense } from 'react';
import DesignsClient from './DesignsClient';

export default function DesignsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading designs…</div>}>
      <DesignsClient />
    </Suspense>
  );
}
