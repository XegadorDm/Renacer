import { LoginForm } from '@/components/auth/login-form';
import { AuthLayout } from '@/components/auth/auth-layout';

export default function LoginPage() {
  return (
    <AuthLayout
      title="Bienvenido de Nuevo"
      description="Ingresa a tu cuenta para continuar."
    >
      <LoginForm />
    </AuthLayout>
  );
}
