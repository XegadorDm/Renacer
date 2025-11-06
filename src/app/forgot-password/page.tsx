import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Restablecer Contraseña"
      description="Ingresa tu correo y te enviaremos un enlace para restablecerla."
    >
      <ForgotPasswordForm />
      <div className="mt-4 text-center">
        <Button variant="link" asChild>
            <Link href="/login">Volver al Login</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
