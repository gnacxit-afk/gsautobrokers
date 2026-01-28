
'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Certificate, Course, Staff } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isValid } from 'date-fns';
import { Award, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/icons';

export default function CertificatePage() {
  const params = useParams();
  const certificateId = params.certificateId as string;
  const firestore = useFirestore();

  const certificateRef = useMemo(() => 
    firestore && certificateId ? doc(firestore, 'certificates', certificateId) : null,
    [firestore, certificateId]
  );
  const { data: certificate, loading: certLoading } = useDoc<Certificate>(certificateRef);

  const courseRef = useMemo(() => 
    firestore && certificate?.courseId ? doc(firestore, 'courses', certificate.courseId) : null,
    [firestore, certificate]
  );
  const { data: course, loading: courseLoading } = useDoc<Course>(courseRef);

  const userRef = useMemo(() =>
    firestore && certificate?.userId ? doc(firestore, 'staff', certificate.userId) : null,
    [firestore, certificate]
  );
  const { data: user, loading: userLoading } = useDoc<Staff>(userRef);
  
  const loading = certLoading || courseLoading || userLoading;

  const renderDate = (date: any) => {
    if (!date) return 'N/A';
    const jsDate = date.toDate ? date.toDate() : new Date(date);
    return isValid(jsDate) ? format(jsDate, "MMMM d, yyyy") : 'Invalid Date';
  };
  
  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="w-full max-w-4xl p-8 space-y-8">
                <Skeleton className="h-16 w-1/3 mx-auto" />
                <Skeleton className="h-8 w-1/2 mx-auto" />
                <Skeleton className="h-12 w-3/4 mx-auto" />
                <Skeleton className="h-8 w-1/2 mx-auto" />
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
    )
  }

  if (!certificate) {
      return (
           <div className="flex items-center justify-center min-h-screen bg-slate-50 text-center">
              <div>
                <h2 className="text-2xl font-bold text-destructive">Certificate Not Found</h2>
                <p className="text-muted-foreground">The verification link may be invalid or the certificate has been removed.</p>
              </div>
            </div>
      )
  }


  return (
    <main className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl border-4 border-primary/20 p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute -top-20 -left-20 text-primary/5 opacity-50 text-[20rem] -rotate-12">
                <Award />
            </div>
             <div className="absolute -bottom-20 -right-20 text-primary/5 opacity-50 text-[20rem] rotate-12">
                <ShieldCheck />
            </div>
            <div className="relative z-10">
                <header className="mb-8">
                    <div className="flex justify-center mb-4">
                        <Logo />
                    </div>
                    <h1 className="text-5xl font-black text-primary tracking-tight">Certificate of Completion</h1>
                    <p className="text-slate-500 mt-2">This certificate is proudly awarded to</p>
                </header>

                <section className="mb-10">
                    <h2 className="text-4xl font-extrabold text-slate-800">{user?.name || '...'}</h2>
                </section>

                <section className="mb-12">
                    <p className="text-slate-500">for successfully completing the course</p>
                    <h3 className="text-3xl font-bold text-slate-700 mt-2">"{course?.title || '...'}"</h3>
                </section>

                <footer className="border-t-2 border-slate-200 pt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="text-left">
                            <p className="font-bold text-slate-600">Date of Issue</p>
                            <p className="text-slate-500">{renderDate(certificate.issuedAt)}</p>
                        </div>
                         <div className="text-left md:text-right">
                            <p className="font-bold text-slate-600">Verification Code</p>
                            <p className="text-slate-500 font-mono text-xs">{certificate.verificationCode}</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    </main>
  );
}
