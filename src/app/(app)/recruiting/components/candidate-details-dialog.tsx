
'use client';

import type { Candidate } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Star, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CandidateDetailsDialogProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-2 py-2 border-b">
        <dt className="text-sm font-medium text-muted-foreground col-span-1">{label}</dt>
        <dd className="text-sm col-span-2 font-medium text-slate-700">{value || 'N/A'}</dd>
    </div>
);

export function CandidateDetailsDialog({ candidate, open, onOpenChange }: CandidateDetailsDialogProps) {
  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{candidate.fullName}</DialogTitle>
          <DialogDescription>
            {candidate.email} &bull; {candidate.whatsappNumber}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="py-4 space-y-6">
                
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                           <Bot size={18} className="text-primary"/> AI Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">AI Score</p>
                                <p className="text-2xl font-bold">{candidate.score || 'N/A'}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-sm font-medium text-muted-foreground">AI Status</p>
                                <p className="text-lg font-bold">{candidate.statusReason || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                             <p className="text-sm font-medium text-muted-foreground">Reasoning</p>
                             <p className="text-sm p-3 bg-slate-50 rounded-md border">{candidate.aiAnalysis || 'No analysis available.'}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                       <CardTitle className="flex items-center gap-2 text-lg">
                           <Info size={18} className="text-primary"/> Application Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="space-y-1">
                           <DetailItem label="Motivation" value={candidate.motivation} />
                           <DetailItem label="Payment Model" value={candidate.paymentModel} />
                           <DetailItem label="Time Dedication" value={candidate.timeDedication} />
                           <DetailItem label="Time Management" value={candidate.timeManagement} />
                           <DetailItem label="Sales Experience" value={candidate.salesExperience} />
                           <DetailItem label="Closing Comfort" value={candidate.closingComfort} />
                           <DetailItem label="CRM Experience" value={candidate.crmExperience} />
                           <DetailItem label="Income Agreement" value={candidate.incomeModelAgreement} />
                           <DetailItem label="Tools" value={
                               <div className="flex flex-wrap gap-2">
                                   {candidate.tools?.smartphone && <Badge variant="secondary">Smartphone</Badge>}
                                   {candidate.tools?.internet && <Badge variant="secondary">Internet</Badge>}
                                   {candidate.tools?.whatsapp && <Badge variant="secondary">WhatsApp</Badge>}
                                   {candidate.tools?.facebook && <Badge variant="secondary">Facebook</Badge>}
                               </div>
                           } />
                            <DetailItem label="Fit Reason" value={<p className="italic">"{candidate.fitReason}"</p>} />
                        </dl>
                    </CardContent>
                </Card>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
