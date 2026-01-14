
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
import type { Application } from '@/lib/types';

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'El nombre completo debe tener al menos 2 caracteres.' }),
  whatsappNumber: z.string().min(8, { message: 'Por favor, introduce un número de WhatsApp válido.' }),
  email: z.string().email({ message: 'Por favor, introduce una dirección de correo electrónico válida.' }),
  city: z.string().min(2, { message: 'Por favor, introduce tu ciudad.' }),
  acceptsCommission: z.boolean().refine(val => val === true, {
    message: 'Debes aceptar el modelo basado en comisiones para postularte.',
  }),
  availableHours: z.string({ required_error: 'Por favor, selecciona tu disponibilidad.' }),
  comfortableWithSales: z.enum(['yes', 'no'], {
    required_error: 'Debes seleccionar una opción.',
  }),
  salesExperienceDescription: z.string().optional(),
  motivation: z.string().min(10, { message: 'La motivación debe tener al menos 10 caracteres.' }),
});

export function ApplicationForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      whatsappNumber: '',
      email: '',
      city: '',
      acceptsCommission: false,
      salesExperienceDescription: '',
    },
  });
  const { toast } = useToast();
  const firestore = useFirestore();

  const watchComfortableWithSales = form.watch('comfortableWithSales');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) {
      toast({
        title: 'Error',
        description: 'La conexión con la base de datos no está disponible.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const now = new Date();
      // Data to be saved in the public-facing collection
      const publicApplicationData = {
        ...values,
        source: 'Organic',
        appliedDate: serverTimestamp(),
      };

      // Use the new public collection for submissions
      await addDoc(collection(firestore, 'publicApplications'), publicApplicationData);

      toast({
        title: '¡Postulación Enviada!',
        description: 'Gracias por postularte. Nos pondremos en contacto contigo en breve.',
      });
      form.reset();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error al Enviar',
        description: 'Ocurrió un error al enviar tu postulación. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="+503 1234 5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="juan.perez@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad y País</FormLabel>
                    <FormControl>
                      <Input placeholder="San Salvador, El Salvador" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="availableHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disponibilidad de Tiempo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tu disponibilidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 hora</SelectItem>
                      <SelectItem value="2">2 horas</SelectItem>
                      <SelectItem value="3">3 horas</SelectItem>
                      <SelectItem value="4">4 horas</SelectItem>
                      <SelectItem value="5+">+5 horas</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comfortableWithSales"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>¿Te sientes cómodo en un rol de ventas 100% basado en comisiones?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="yes" />
                        </FormControl>
                        <FormLabel className="font-normal">Sí</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="no" />
                        </FormControl>
                        <FormLabel className="font-normal">No</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {watchComfortableWithSales === 'yes' && (
              <FormField
                control={form.control}
                name="salesExperienceDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Describe brevemente tu experiencia en ventas (si la tienes)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ej: vendí autos durante 2 años, trabajé en retail, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="motivation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>¿Por qué quieres ser un broker de autos con GS AUTOBROKERS?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cuéntanos tu motivación..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acceptsCommission"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                     Entiendo y acepto que este es un rol 100% basado en comisiones.
                    </FormLabel>
                     <FormDescription>
                        Tus ganancias están directamente ligadas a tu rendimiento.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Enviando...' : 'Enviar Postulación'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
