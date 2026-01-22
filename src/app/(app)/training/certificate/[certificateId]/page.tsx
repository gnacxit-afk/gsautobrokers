
'use client';

import { useParams } from "next/navigation";

export default function CertificatePage() {
  const params = useParams();
  const certificateId = params.certificateId as string;

  return (
    <div>
      <h1 className="text-2xl font-bold">Certificate of Completion</h1>
      <p className="text-muted-foreground">Viewing certificate: {certificateId}</p>
      {/* Certificate viewer will go here */}
    </div>
  );
}

    