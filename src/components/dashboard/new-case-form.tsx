'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { Checkbox } from '../ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Case } from '@/lib/case-schema';
import { useEffect, useState } from 'react';

const formSchema = z.object({
  firstName: z.string()
    .min(1, 'El nombre es requerido.')
    .regex(/^[a-zA-Z\s]+$/, 'El nombre solo puede contener letras y espacios.'),
  lastName: z.string()
    .min(1, 'El apellido es requerido.')
    .regex(/^[a-zA-Z\s]+$/, 'El apellido solo puede contener letras y espacios.'),
  documentId: z.string()
    .min(5, 'Documento de identidad es requerido.')
    .regex(/^[0-9]+$/, 'El documento solo puede contener números.'),
  internalId: z.string().optional(),
  ethnicGroup: z.string().min(1, 'Grupo étnico es requerido.'),
  maritalStatus: z.string().min(1, 'Estado civil es requerido.'),
  gender: z.string().min(1, 'Sexo es requerido.'),
  birthDate: z.date({ required_error: 'Fecha de nacimiento es requerida.'}),
  address: z.string().min(1, 'Dirección es requerida.'),
  municipality: z.string().min(1, 'El municipio es requerido.'),
  department: z.string().min(1, 'Departamento es requerido.'),
  phone1: z.string()
    .min(7, 'Celular 1 es requerido.')
    .regex(/^[0-9]+$/, 'El celular solo puede contener números.'),
  phone2: z.string()
    .regex(/^[0-9]*$/, 'El celular solo puede contener números.')
    .optional()
    .or(z.literal('')),
  displacementType: z.string().min(1, 'Tipo de desplazamiento es requerido.'),
  disability: z.string().min(1, 'Discapacidad es requerida.'),
  age: z.coerce.number().min(0, 'Edad es requerida.'),
  isElderly: z.boolean().default(false),
  householdMembers: z.coerce.number().min(1, 'Cantidad es requerida.'),
  testimony: z.string().min(10, 'El testimonio es requerido (mínimo 10 caracteres).'),
});

type NewCaseFormProps = {
  caseData?: Case & { id: string };
};

export function NewCaseForm({ caseData }: NewCaseFormProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditMode = !!caseData;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      documentId: '',
      internalId: `INT-${Math.floor(1000 + Math.random() * 9000)}`,
      ethnicGroup: '',
      maritalStatus: '',
      gender: '',
      address: '',
      municipality: '',
      department: 'Cauca',
      phone1: '',
      phone2: '',
      displacementType: '',
      disability: '',
      age: 0,
      isElderly: false,
      householdMembers: 1,
      testimony: '',
    },
  });

  useEffect(() => {
    if (caseData) {
      form.reset({
        ...caseData,
        birthDate: new Date(caseData.birthDate),
        phone1: caseData.phone1 || '',
        phone2: caseData.phone2 || '',
      });
    }
  }, [caseData, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "No estás autenticado o el servicio no está disponible.",
        });
        return;
    };

    setIsSubmitting(true);
    
    try {
        if (isEditMode && caseData) {
            const caseDocRef = doc(firestore, 'cases', caseData.id);
            const updatedData = {
                ...values,
                birthDate: values.birthDate.toISOString(),
                status: caseData.status || "Sin novedad",
                createdAt: caseData.createdAt || new Date().toISOString(),
                members: caseData.members
            };
            setDocumentNonBlocking(caseDocRef, updatedData, { merge: true });
            toast({
                title: "Caso Actualizado",
                description: `El caso para ${values.firstName} ${values.lastName} ha sido actualizado.`,
            });
            router.push(`/dashboard/cases/${caseData.id}`);
        } else {
            const casesCollection = collection(firestore, 'cases');
            const newCaseData = {
                ...values,
                birthDate: values.birthDate.toISOString(),
                id: '', 
                caseNumber: `CAS-${Date.now()}`,
                status: "Sin novedad",
                createdAt: new Date().toISOString(), // Marca de tiempo exacta del registro
                userId: user.uid,
                members: { 
                    [user.uid]: 'owner'
                }
            };
            addDocumentNonBlocking(casesCollection, newCaseData);
            toast({
                title: "Caso Guardado Exitosamente",
                description: `El caso para ${values.firstName} ${values.lastName} ha sido creado.`,
            });
            router.push(`/dashboard/cases?location=${values.municipality}`);
        }
    } catch (e) {
        toast({
            variant: "destructive",
            title: "Error al guardar",
            description: "No se pudo procesar la solicitud."
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const formFields = [
    { name: 'firstName', label: 'Nombres', component: Input, placeholder: 'Nombres completos' },
    { name: 'lastName', label: 'Apellidos', component: Input, placeholder: 'Apellidos completos' },
    { name: 'documentId', label: 'Documento de identidad', component: Input, placeholder: 'Número de documento' },
    { name: 'internalId', label: 'ID Interno', component: Input, props: { disabled: true } },
    { name: 'ethnicGroup', label: 'Grupo étnico', component: Select, options: ['Indígena', 'Afrocolombiano', 'Raizal', 'Palenquero', 'Gitano', 'Mestizo', 'Ninguno'] },
    { name: 'maritalStatus', label: 'Estado civil', component: Select, options: ['Soltero/a', 'Casado/a', 'Unión libre', 'Viudo/a', 'Separado/a'] },
    { name: 'gender', label: 'Sexo', component: Select, options: ['Masculino', 'Femenino', 'Otro'] },
    { name: 'birthDate', label: 'Fecha de nacimiento', component: 'datepicker' },
    { name: 'address', label: 'Dirección / Vereda / Corregimiento', component: Input, placeholder: 'Ej: Vereda La Esperanza' },
    { name: 'municipality', label: 'Municipio', component: Select, options: ['Suárez', 'Piendamó', 'Morales'] },
    { name: 'department', label: 'Departamento', component: Input, props: { disabled: true } },
    { name: 'phone1', label: 'Celular 1', component: Input, type: 'tel' },
    { name: 'phone2', label: 'Celular 2 (Opcional)', component: Input, type: 'tel' },
    { name: 'displacementType', label: 'Tipo de desplazamiento', component: Select, options: ['Individual', 'Familiar', 'Masivo'] },
    { name: 'disability', label: 'Discapacidad', component: Select, options: ['Física', 'Visual', 'Auditiva', 'Intelectual', 'Psicosocial', 'Múltiple', 'Ninguna'] },
    { name: 'age', label: 'Edad', component: Input, type: 'number' },
    { name: 'isElderly', label: 'Adulto mayor', component: 'checkbox', description: 'Marcar si la persona es adulto mayor.' },
    { name: 'householdMembers', label: 'Personas en caracterización', component: Input, type: 'number' },
  ]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 md:space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 md:gap-y-6">
          {formFields.map((fieldConfig) => (
            <FormField
              key={fieldConfig.name}
              control={form.control}
              name={fieldConfig.name as any}
              render={({ field }) => (
                <FormItem className="space-y-1 md:space-y-2">
                  <FormLabel className="text-sm font-semibold">{fieldConfig.label}</FormLabel>
                  <FormControl>
                    {fieldConfig.component === 'datepicker' ? (
                       <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal h-10 px-3",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            captionLayout="dropdown-buttons"
                            fromYear={1920}
                            toYear={new Date().getFullYear()}
                            className="p-3"
                          />
                        </PopoverContent>
                      </Popover>
                    ) : fieldConfig.component === Select ? (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {fieldConfig.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : fieldConfig.component === 'checkbox' ? (
                        <div className="flex items-center space-x-2 h-10 bg-muted/20 px-3 rounded-md border border-dashed border-muted">
                            <Checkbox id={fieldConfig.name} checked={field.value} onCheckedChange={field.onChange} />
                            <label htmlFor={fieldConfig.name} className="text-xs font-medium leading-none text-muted-foreground cursor-pointer">
                                {fieldConfig.description}
                            </label>
                        </div>
                    ) : (
                      <Input
                        type={fieldConfig.type || 'text'}
                        placeholder={fieldConfig.placeholder || ''}
                        className="h-10"
                        {...fieldConfig.props}
                        {...field}
                      />
                    )}
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
          ))}
        </div>
        <FormField
            control={form.control}
            name="testimony"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-semibold">Testimonio Detallado</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe brevemente la situación, hechos y necesidades..." 
                    {...field} 
                    className="min-h-[150px] resize-none" 
                  />
                </FormControl>
                <FormDescription className="text-xs italic">
                  * Este relato es fundamental para la caracterización del caso.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                isEditMode ? 'Guardar Cambios' : 'Registrar Caso'
              )}
            </Button>
        </div>
      </form>
    </Form>
  );
}