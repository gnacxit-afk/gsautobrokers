
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { submitApplication } from '@/ai/flows/submit-application-flow';
import { Loader2, PartyPopper } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { scoreApplication } from '@/ai/flows/score-application-flow';
import type { ApplicationData } from '@/ai/flows/submit-application-flow';


const countries = {
  'El Salvador': [
    'Ahuachapán', 'Santa Ana', 'Sonsonate', 'Chalatenango', 'Cuscatlán', 'La Libertad',
    'San Salvador', 'La Paz', 'Cabañas', 'San Vicente', 'Usulután', 'San Miguel',
    'Morazán', 'La Unión'
  ],
};

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'El nombre completo es requerido.' }),
  email: z.string().email({ message: 'Por favor, introduce un correo válido.' }),
  whatsappNumber: z.string().min(8, { message: 'Por favor, introduce un número de WhatsApp válido.' }),
  country: z.string({ required_error: 'Por favor, selecciona tu país.' }),
  city: z.string({ required_error: 'Por favor, selecciona tu ciudad.' }),
  paymentModel: z.enum(['Sí, me siento cómodo ganando según resultados', 'No, busco sueldo fijo'], { required_error: 'Debes seleccionar una opción.' }),
  motivation: z.enum(['Generar ingresos adicionales', 'Desarrollarme en ventas y aumentar ingresos', 'Busco un empleo tradicional'], { required_error: 'Debes seleccionar una opción.' }),
  timeDedication: z.enum(['Menos de 1 hora', '1-2 horas', '2-4 horas', 'Más de 4 horas'], { required_error: 'Debes seleccionar una opción.' }),
  timeManagement: z.enum(['Trabajo con horarios fijos', 'Tengo horarios flexibles', 'Soy freelancer / independiente', 'No tengo estructura clara'], { required_error: 'Debes seleccionar una opción.' }),
  salesExperience: z.enum(['Sí', 'No, pero estoy dispuesto a aprender', 'No y no me interesa vender'], { required_error: 'Debes seleccionar una opción.' }),
  closingComfort: z.enum(['Muy cómodo', 'Cómodo', 'Poco cómodo', 'Nada cómodo'], { required_error: 'Debes seleccionar una opción.' }),
  tools: z.object({
    smartphone: z.boolean().default(false),
    internet: z.boolean().default(false),
    whatsapp: z.boolean().default(false),
    facebook: z.boolean().default(false),
  }),
  crmExperience: z.enum(['Sí', 'No, pero puedo aprender', 'No y no me interesa'], { required_error: 'Debes seleccionar una opción.' }),
  incomeModelAgreement: z.enum(['Sí, lo entiendo y estoy de acuerdo', 'No, prefiero algo seguro'], { required_error: 'Debes seleccionar una opción.' }),
  fitReason: z.string().min(10, { message: 'Por favor, elabora un poco más tu respuesta.' }),
});

export function ApplicationForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const firestore = useFirestore();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      whatsappNumber: '',
      tools: { smartphone: false, internet: false, whatsapp: false, facebook: false },
    },
  });
  const { toast } = useToast();

  const selectedCountry = form.watch('country');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const result = await submitApplication(values);
      if (result.success) {
        setIsSubmitted(true);
      } else {
        throw new Error(result.message || 'An unknown error occurred.');
      }
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error al Enviar',
        description: error.message || 'Ocurrió un error al procesar tu postulación. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  }
  
  if (isSubmitted) {
    return (
        <Card className="w-full">
            <CardContent className="p-10 text-center flex flex-col items-center">
                <PartyPopper className="h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">¡Gracias por tu aplicación!</h2>
                <p className="text-muted-foreground max-w-md">
                    Nuestro equipo revisará tu perfil y solo contactaremos a los candidatos que cumplan con los requisitos para una entrevista corta. Este proceso es selectivo y basado en desempeño.
                </p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Postulación de Candidato</CardTitle>
        <CardDescription>Completa el siguiente formulario para postularte al puesto de broker.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* SECCIÓN 1: Datos Básicos */}
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Datos Básicos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="fullName" render={({ field }) => ( <FormItem> <FormLabel>Nombre Completo</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Correo Electrónico</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <FormField control={form.control} name="whatsappNumber" render={({ field }) => ( <FormItem> <FormLabel>Número de WhatsApp</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="country" render={({ field }) => ( <FormItem> <FormLabel>País</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl> <SelectContent> {Object.keys(countries).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
                        <FormField control={form.control} name="city" render={({ field }) => ( <FormItem> <FormLabel>Ciudad</FormLabel> <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCountry}> <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl> <SelectContent> {(countries[selectedCountry as keyof typeof countries] || []).map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
                    </div>
                </div>
            </div>
            
            {/* SECCIÓN 2: Calificación */}
             <div className="space-y-6 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Perfil y Mentalidad</h3>
                 <FormField control={form.control} name="paymentModel" render={({ field }) => ( <FormItem> <FormLabel>Este rol es 100% independiente y por comisión. ¿Estás de acuerdo?</FormLabel> <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2"> <FormItem className="flex items-center space-x-2"> <FormControl><RadioGroupItem value="Sí, me siento cómodo ganando según resultados" /></FormControl> <FormLabel className="font-normal">Sí, me siento cómodo ganando según resultados</FormLabel> </FormItem> <FormItem className="flex items-center space-x-2"> <FormControl><RadioGroupItem value="No, busco sueldo fijo" /></FormControl> <FormLabel className="font-normal">No, busco sueldo fijo</FormLabel> </FormItem> </RadioGroup></FormControl> <FormMessage /> </FormItem> )}/>
                 <FormField control={form.control} name="motivation" render={({ field }) => ( <FormItem> <FormLabel>¿Cuál es tu principal motivación para aplicar?</FormLabel> <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1 pt-2"> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Generar ingresos adicionales" /></FormControl><FormLabel className="font-normal">Generar ingresos adicionales</FormLabel></FormItem> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Desarrollarme en ventas y aumentar ingresos" /></FormControl><FormLabel className="font-normal">Desarrollarme en ventas y aumentar ingresos</FormLabel></FormItem> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Busco un empleo tradicional" /></FormControl><FormLabel className="font-normal">Busco un empleo tradicional</FormLabel></FormItem> </RadioGroup></FormControl> <FormMessage /> </FormItem> )}/>
                 <FormField control={form.control} name="timeDedication" render={({ field }) => ( <FormItem> <FormLabel>¿Cuánto tiempo REAL puedes dedicarle al negocio por día?</FormLabel> <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1 pt-2"> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Menos de 1 hora" /></FormControl><FormLabel className="font-normal">Menos de 1 hora</FormLabel></FormItem> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="1-2 horas" /></FormControl><FormLabel className="font-normal">1–2 horas</FormLabel></FormItem> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="2-4 horas" /></FormControl><FormLabel className="font-normal">2–4 horas</FormLabel></FormItem> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Más de 4 horas" /></FormControl><FormLabel className="font-normal">Más de 4 horas</FormLabel></FormItem> </RadioGroup></FormControl> <FormMessage /> </FormItem> )}/>
                 <FormField control={form.control} name="timeManagement" render={({ field }) => ( <FormItem> <FormLabel>¿Cómo manejas tu tiempo actualmente?</FormLabel> <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1 pt-2"> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Trabajo con horarios fijos" /></FormControl><FormLabel className="font-normal">Trabajo con horarios fijos</FormLabel></FormItem> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Tengo horarios flexibles" /></FormControl><FormLabel className="font-normal">Tengo horarios flexibles</FormLabel></FormItem> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Soy freelancer / independiente" /></FormControl><FormLabel className="font-normal">Soy freelancer / independiente</FormLabel></FormItem> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="No tengo estructura clara" /></FormControl><FormLabel className="font-normal">No tengo estructura clara</FormLabel></FormItem> </RadioGroup></FormControl> <FormMessage /> </FormItem> )}/>
                 <FormField control={form.control} name="salesExperience" render={({ field }) => ( <FormItem> <FormLabel>¿Tienes experiencia previa en ventas o atención comercial?</FormLabel> <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1 pt-2"> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Sí" /></FormControl><FormLabel className="font-normal">Sí</FormLabel></FormItem> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="No, pero estoy dispuesto a aprender" /></FormControl><FormLabel className="font-normal">No, pero estoy dispuesto a aprender</FormLabel></FormItem> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="No y no me interesa vender" /></FormControl><FormLabel className="font-normal">No y no me interesa vender</FormLabel></FormItem> </RadioGroup></FormControl> <FormMessage /> </FormItem> )}/>
                 <FormField control={form.control} name="closingComfort" render={({ field }) => ( <FormItem> <FormLabel>¿Qué tan cómodo te sientes hablando con personas para cerrar ventas?</FormLabel> <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1 pt-2"> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Muy cómodo" /></FormControl><FormLabel className="font-normal">Muy cómodo</FormLabel></FormItem> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Cómodo" /></FormControl><FormLabel className="font-normal">Cómodo</FormLabel></FormItem> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Poco cómodo" /></FormControl><FormLabel className="font-normal">Poco cómodo</FormLabel></FormItem> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Nada cómodo" /></FormControl><FormLabel className="font-normal">Nada cómodo</FormLabel></FormItem> </RadioGroup></FormControl> <FormMessage /> </FormItem> )}/>
                <FormItem>
                  <FormLabel>¿Cuentas con las siguientes herramientas?</FormLabel>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <FormField control={form.control} name="tools.smartphone" render={({ field }) => ( <FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Teléfono inteligente</FormLabel></FormItem> )}/>
                    <FormField control={form.control} name="tools.internet" render={({ field }) => ( <FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Internet estable</FormLabel></FormItem> )}/>
                    <FormField control={form.control} name="tools.whatsapp" render={({ field }) => ( <FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">WhatsApp activo</FormLabel></FormItem> )}/>
                    <FormField control={form.control} name="tools.facebook" render={({ field }) => ( <FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Facebook activo</FormLabel></FormItem> )}/>
                  </div>
                   <FormMessage>{form.formState.errors.tools && 'Todas las herramientas son requeridas.'}</FormMessage>
                </FormItem>
                 <FormField control={form.control} name="crmExperience" render={({ field }) => ( <FormItem> <FormLabel>¿Has utilizado alguna vez un CRM o sistema de seguimiento?</FormLabel> <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1 pt-2"> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Sí" /></FormControl><FormLabel className="font-normal">Sí</FormLabel></FormItem> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="No, pero puedo aprender" /></FormControl><FormLabel className="font-normal">No, pero puedo aprender</FormLabel></FormItem> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="No y no me interesa" /></FormControl><FormLabel className="font-normal">No y no me interesa</FormLabel></FormItem> </RadioGroup></FormControl> <FormMessage /> </FormItem> )}/>
                 <FormField control={form.control} name="incomeModelAgreement" render={({ field }) => ( <FormItem> <FormLabel>En este modelo no hay ingreso garantizado. ¿Estás dispuesto a trabajar bajo esta lógica?</FormLabel> <FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4 pt-2"> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Sí, lo entiendo y estoy de acuerdo" /></FormControl><FormLabel className="font-normal">Sí, lo entiendo y estoy de acuerdo</FormLabel></FormItem> <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="No, prefiero algo seguro" /></FormControl><FormLabel className="font-normal">No, prefiero algo seguro</FormLabel></FormItem> </RadioGroup></FormControl> <FormMessage /> </FormItem> )}/>
                 <FormField control={form.control} name="fitReason" render={({ field }) => ( <FormItem> <FormLabel>En una frase corta, dinos por qué consideras que encajas en este modelo de trabajo:</FormLabel> <FormControl><Textarea {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
             </div>

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</> : 'Enviar Postulación'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
