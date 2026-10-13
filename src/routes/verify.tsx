import { createFileRoute } from '@tanstack/react-router';
import { VerificationWizard } from '@/components/verification/verification-wizard';

export const Route = createFileRoute('/verify')({
  component: VerifyPage,
});

function VerifyPage() {
  return <VerificationWizard />;
}
