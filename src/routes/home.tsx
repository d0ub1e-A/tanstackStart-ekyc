import { createFileRoute, Link } from '@tanstack/react-router';
import { UserCheck, RotateCcw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/home')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <p className="text-muted-foreground">
            Your identity has been verified successfully.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2 text-left">
            <p className="text-sm font-medium">
              Verification Status:{' '}
              <span className="text-green-600 dark:text-green-400">
                VERIFIED
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              You now have access to verified features.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              className={`${buttonVariants({ variant: 'outline' })}`}
              to="/verify"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Verify Another
            </Link>
            <Button>Continue to App</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
