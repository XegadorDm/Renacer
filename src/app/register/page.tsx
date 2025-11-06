import { RegisterForm } from '@/components/auth/register-form';
import { AuthLayout } from '@/components/auth/auth-layout';

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Solicitud de Registro"
      description="Completa el formulario para crear tu cuenta."
    >
      <RegisterForm />
    </AuthLayout>
  );
}
