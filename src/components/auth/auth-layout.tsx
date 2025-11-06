import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/logo';

type AuthLayoutProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
};

export function AuthLayout({ title, description, children, footerContent }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mx-auto mb-4" prefetch={false}>
            <Logo className="h-12 w-12 text-primary" />
          </Link>
          <CardTitle className="text-3xl font-headline">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footerContent && <CardFooter>{footerContent}</CardFooter>}
      </Card>
    </div>
  );
}
