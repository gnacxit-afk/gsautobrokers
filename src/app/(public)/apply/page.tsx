
import { ShoppingBag } from 'lucide-react';
import { ApplicationForm } from '@/components/candidates/application-form';

export default function ApplyPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 font-sans">
      <main className="flex w-full max-w-2xl flex-col items-center">
        <div className="mb-6 flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-slate-700" />
          <h1 className="text-2xl font-bold text-slate-800">
            GS AUTOBROKERS
          </h1>
        </div>
        
        <ApplicationForm />
        
        <footer className="mt-8 text-center text-xs text-slate-500">
          <p>Nuestro sistema filtra, nuestro equipo ejecuta, los resultados deciden.</p>
        </footer>
      </main>
    </div>
  );
}
