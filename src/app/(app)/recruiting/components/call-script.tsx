
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
        content: "Hola [NOMBRE], mi nombre es [TU NOMBRE] y soy del equipo de adquisicion de asociados de GS AUTOBROKERS. Vi que aplicaste para el puesto de agente de ventas y mi objetivo es explicarte como funciona el modelo para validar si encajas. Si no es para ti, no pasa nada, lo decidimos y seguimos adelante, ¿tienes 5 minutos para que conversemos?" 
    },
    { 
        trigger: "2. Verificación de Interés", 
        content: "Genial. Solo para confirmar, no estamos contratando empleados. Trabajamos con asociados independientes que generan leads. El pago es por resultados, no por horas ni por tiempo conectado. Con nosotros tu eres libre de organizar tu tiempo y tu decides cuando es lo que ganas ¿Antes de continuar... hasta aqui todo claro?" 
    },
    { 
        trigger: "3. Diagnostico rapido", 
        content: "¿Actualmente trabajas o buscas ingresos extra? ¿Cuantas horas al dia podrias dedicarle? (Respuesta ideal:3, 4 o +5 horas). ¿Que haces normalmente en tu tiempo libre por las mañanas, tardes o noches? ¿Tienes algo de experiencia en ventas, marketing o copywriting? Cuéntame un poco sobre eso." 
    },
    { 
        trigger: "4. Motivación", 
        content: "Muchas personas entran porque se dan cuenta que estan en casa, con el celular en la mano, sin generar nada. Al ser parte de nuestro equipo, ese mismo tiempo se convierte dinero. No prometo facilidad, te prometo claridad e ingresos justos por lo que produzcas.¿Qué es lo que mas te atrae de esta posición en particular? ¿Como ser humano, que es lo que te motiva?" 
    },
    { 
        trigger: "5. Habilidades Clave y Disponibilidad", 
        content: "En ventas, la comunicación, negociación, la disciplina y el compromiso son clave. ¿Cómo te calificarías en una escala del 1 al 10 en estas cuatro áreas y por qué?. Nuestra capacitación requiere compromiso. ¿Tienes disponibilidad de tiempo para dedicarte a la formación y al trabajo?" 
    },
    { 
        trigger: "6. Aclaraciones", 
        content: "Esto no es multinivel, no reclutamos personas, no vendemos cursos, no compras productos, no inviertes. Tu eres parte de nuestro mecanismo de ventas, generas leads, el sistema vende y tu cobras comisiones por cada venta cerrada. ¿Tienes alguna duda?" 
    },
    { 
        trigger: "7. Expectativas Económicas", 
        content: "Este es un rol basado en comisiones, lo que significa que tu potencial de ingresos es alto, pero depende de tu rendimiento. No hay un salario fijo. Si un dia no generas ventas, ese dia no ganas. ¿Te sientes cómodo desarrollandote en unmodelo de compensación variable?" 
    },
    { 
        trigger: "8. Comparacion estrategica", 
        content: "Regularmente un empleo te paga por estar. Aqui tu ganas por producir. Cuando un empleo limita tus ingresos con nosotros tus ingresos depende de tu esfuerzo. No es mejor ni peor, es para cierto tipo de personas. No te atamos a un horario, con nosotros tu creas tu propio horario, lo que signifca que puedes generar ingresos desde donde sea y a la hora que sea, lo unico que necesitas es tu telefono celular y coneccion a internet. ¿Te condideras una persona que prefiere ganar su propio dinero a cualquier hora del dia o prefieres la estabilidad fija que un empleo regular te ofrece?" 
    },
    { 
        trigger: "9. Siguientes Pasos", 
        content: "Perfecto. Basado en esta llamada, considero que eres un buen candidato para avanzar al siguiente paso del proceso que consta de 1. Entrenamiento inicial 2. Acceso a las herramientas 3. Incias tus actividades. ¿Te gustaría proceder con esto?" 
    },
    { 
        trigger: "10. Cierre", 
        content: "Excelente, [NOMBRE]. Gracias por tu tiempo. Estaremos en contacto pronto atravez de Whatsapp para coordinar los siguientes pasos. ¡Que tengas un buen día!" 
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

    
