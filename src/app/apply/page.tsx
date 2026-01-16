
import { ApplicationForm } from '@/components/candidates/application-form';
import { Logo } from '@/components/icons';

export default function ApplyPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-start bg-slate-50 p-4 sm:p-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex justify-center py-8">
            <Logo />
        </div>
        <ApplicationForm />
      </div>
    </div>
  );
}
