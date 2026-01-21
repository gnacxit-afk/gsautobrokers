
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Logo } from '@/components/icons';
import { Car, Search, Banknote, Mail, Phone } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />
          <Button asChild>
            <Link href="/login">Acceder al Portal</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-white py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900">
              Encuentra, Financia y Compra Tu Vehículo Ideal
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-600">
              GS Autobrokers es una empresa de corretaje de vehículos que ayuda a los clientes a encontrar, financiar y comprar vehículos de acuerdo a sus necesidades y presupuesto.
            </p>
            <div className="mt-10">
              <Button size="lg" asChild>
                <Link href="/login">Acceder al Portal de Agentes</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">Nuestros Servicios</h2>
              <p className="text-muted-foreground mt-2">Asistencia integral en cada paso de tu compra.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader className="items-center text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Encontrar Vehículos</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-slate-600">
                  Te asistimos con la disponibilidad de vehículos, precios y opciones para encontrar el auto perfecto para ti.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="items-center text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Banknote className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Opciones de Financiamiento</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-slate-600">
                  Te ayudamos a asegurar las mejores opciones de financiamiento adaptadas al presupuesto de cada cliente.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="items-center text-center">
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Car className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Agendar Citas</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-slate-600">
                  Coordinamos la comunicación directa con el cliente para agendar citas y facilitar el proceso de compra.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact & Privacy Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 md:px-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              <div>
                <h3 className="text-2xl font-bold mb-4">Contáctanos</h3>
                <div className="space-y-4 text-slate-600">
                  <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-primary" />
                    <a href="mailto:ventas@esautobrokers.com" className="hover:underline">ventas@esautobrokers.com</a>
                  </div>
                  <div className="flex items-center gap-4">
                    <Phone className="h-5 w-5 text-primary" />
                    <a href="tel:+18324005373" className="hover:underline">+1 (832) 400-5373</a>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">Política de Privacidad</h3>
                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Lee nuestra política de privacidad</AccordionTrigger>
                    <AccordionContent className="text-slate-600 space-y-3 pt-2">
                      <p>GS Autobrokers se compromete a proteger la privacidad de sus clientes.</p>
                      <p>Recopilamos información personal solo cuando es proporcionada voluntariamente por los clientes con el fin de responder a consultas, proporcionar información sobre nuestros servicios y comunicarnos sobre los servicios de corretaje de vehículos.</p>
                      <p>La información personal no se vende, comparte ni distribuye a terceros, excepto cuando sea necesario para proporcionar nuestros servicios o cumplir con obligaciones legales.</p>
                      <p>Los clientes pueden solicitar acceso, corrección o eliminación de su información personal contactándonos en <a href="mailto:soporte@esautobrokers.com" className="text-primary hover:underline font-medium">soporte@esautobrokers.com</a>.</p>
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
          © 2026 GS Autobrokers. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
