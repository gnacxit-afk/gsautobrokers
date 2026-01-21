import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Logo } from '@/components/icons';
import { Car, Search, Banknote, Mail, Phone, MessageCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />
          <Button asChild>
            <Link href="/login">Agent Portal</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-white py-12 md:py-20">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="flex justify-center mb-6">
              <Logo width={500} height={138} />
            </div>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-600">
              GS Autobrokers is a vehicle brokerage company that helps customers find, finance, and purchase vehicles according to their needs and budget.
            </p>
            <div className="mt-10">
              <Button size="lg" asChild>
                <Link href="/login">Access Agent Portal</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Our Services</h2>
              <p className="text-muted-foreground mt-2">We assist clients with vehicle availability, pricing, financing options, and appointment scheduling through direct customer communication.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader className="items-center text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Find Vehicles</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-slate-600">
                  We assist with vehicle availability and pricing to find the perfect car for you.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="items-center text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Banknote className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Financing Options</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-slate-600">
                  We help you secure the best financing options tailored to each client's budget.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="items-center text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Car className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Schedule Appointments</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-slate-600">
                  We coordinate direct communication to facilitate the buying process.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Compliance and Contact Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              <div>
                <h3 className="text-2xl font-bold mb-4">Contact & Compliance</h3>
                <div className="space-y-6 text-slate-600">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full mt-1">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Customer Communication</h4>
                      <p className="text-sm">We use WhatsApp to communicate directly with customers who contact us requesting information about our services. Messages are sent only in response to customer inquiries or with explicit customer consent. We do not send unsolicited or bulk messages.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                     <div className="bg-primary/10 p-2 rounded-full mt-1">
                        <Mail className="h-5 w-5 text-primary" />
                     </div>
                     <div>
                        <h4 className="font-semibold text-slate-800">Business Email</h4>
                        <a href="mailto:ventas@esautobrokers.com" className="text-sm hover:underline">ventas@esautobrokers.com</a>
                     </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full mt-1">
                        <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-800">Contact Phone Number</h4>
                        <a href="tel:+18324005373" className="text-sm hover:underline">+1 832 400 5373</a>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">Privacy Policy</h3>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Read our Privacy Policy</AccordionTrigger>
                    <AccordionContent className="text-slate-600 space-y-3 pt-2">
                      <p>GS Autobrokers is committed to protecting the privacy of its customers.</p>
                      <p>We collect personal information only when voluntarily provided by customers for the purpose of responding to inquiries, providing information about our services, and communicating regarding vehicle brokerage services.</p>
                      <p>Personal information is not sold, shared, or distributed to third parties except when required to provide our services or comply with legal obligations.</p>
                      <p>Customers may request access, correction, or deletion of their personal information by contacting us at <a href="mailto:soporte@esautobrokers.com" className="text-primary hover:underline font-medium">soporte@esautobrokers.com</a>.</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6">
        <div className="container mx-auto px-4 md:px-6 text-center text-sm">
          © 2026 GS Autobrokers. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
