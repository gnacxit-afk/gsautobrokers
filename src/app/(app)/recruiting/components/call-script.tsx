
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const scriptSteps = [
    { 
        trigger: "1. Saludo Inicial", 
        content: "Hola [NOMBRE], mi nombre es [TU NOMBRE] y soy del equipo de reclutamiento de GS Auto Brokers. Vi que aplicaste para el puesto de agente de ventas, ¿tienes 5 minutos para conversar?" 
    },
    { 
        trigger: "2. Verificación de Interés", 
        content: "Genial. Solo para confirmar, ¿sigues interesado en la oportunidad de convertirte en un broker de autos con nosotros?" 
    },
    { 
        trigger: "3. Experiencia Previa", 
        content: "¿Tienes alguna experiencia previa en ventas, ya sea de autos, seguros, o cualquier otro campo? Cuéntame un poco sobre eso." 
    },
    { 
        trigger: "4. Motivación", 
        content: "¿Qué te atrajo de esta posición en particular? ¿Qué te motiva a querer trabajar en ventas de autos?" 
    },
    { 
        trigger: "5. Habilidades Clave", 
        content: "En ventas, la comunicación y la negociación son clave. ¿Cómo te calificarías en una escala del 1 al 10 en estas dos áreas y por qué?" 
    },
    { 
        trigger: "6. Disponibilidad", 
        content: "Nuestra capacitación es intensiva y requiere compromiso. ¿Tienes disponibilidad de tiempo completo para dedicarte a la formación y al trabajo?" 
    },
    { 
        trigger: "7. Expectativas Económicas", 
        content: "Este es un rol basado en comisiones, lo que significa que tu potencial de ingresos es alto, pero depende de tu rendimiento. ¿Te sientes cómodo con un modelo de compensación variable?" 
    },
    { 
        trigger: "8. Preguntas del Candidato", 
        content: "¿Tienes alguna pregunta para mí sobre la empresa, el rol o el modelo de negocio?" 
    },
    { 
        trigger: "9. Siguientes Pasos", 
        content: "Perfecto. Basado en esta llamada, el siguiente paso sería una entrevista más a fondo con uno de nuestros supervisores. ¿Estarías disponible en los próximos días para eso?" 
    },
    { 
        trigger: "10. Cierre", 
        content: "Excelente, [NOMBRE]. Gracias por tu tiempo. Estaremos en contacto pronto para coordinar los siguientes pasos. ¡Que tengas un buen día!" 
    },
];

export function CallScript() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Script</CardTitle>
        <CardDescription>
          Use this script for the 5-minute filter call.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {scriptSteps.map((step, index) => (
            <AccordionItem value={`item-${index + 1}`} key={index}>
              <AccordionTrigger>{step.trigger}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {step.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

    
