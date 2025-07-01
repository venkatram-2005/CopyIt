
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copyright } from 'lucide-react';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const isFirebaseConfigured = !!auth;

  const handleSignUp = async () => {
    if (!isFirebaseConfigured) {
      toast({
        variant: "destructive",
        title: "Firebase Not Configured",
        description: "Please provide Firebase configuration to create an account.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "Account Created",
        description: "You have successfully signed up. Redirecting to sign in...",
      });
      router.push('/login');
    } catch (e) {
      const err = e as AuthError;
      let friendlyMessage = "An error occurred. Please try again.";

      switch (err.code) {
        case 'auth/email-already-in-use':
          friendlyMessage = 'This email is already in use. Please sign in.';
          break;
        case 'auth/weak-password':
          friendlyMessage = 'The password is too weak. Please use at least 6 characters.';
          break;
        case 'auth/invalid-email':
          friendlyMessage = 'Please enter a valid email address.';
          break;
        case 'auth/operation-not-allowed':
          friendlyMessage = 'Sign up is currently disabled. Please check your Firebase console settings.';
          break;
        default:
          friendlyMessage = `An unexpected error occurred. (Code: ${err.code})`;
          break;
      }

      toast({
        variant: "destructive",
        title: "Sign Up Error",
        description: friendlyMessage,
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
             <Copyright className="h-8 w-8 mr-2 text-primary" />
             <CardTitle className="text-3xl font-bold">CopyIt</CardTitle>
          </div>
          <CardDescription>{isFirebaseConfigured ? "Create a new account to get started" : "Demo Mode"}</CardDescription>
        </CardHeader>
        <CardContent>
          {isFirebaseConfigured ? (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button onClick={handleSignUp} className="w-full mt-2" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          ) : (
             <div className="text-center text-muted-foreground p-4 border rounded-md bg-muted/50">
               <h3 className="font-semibold text-foreground">Firebase Not Configured</h3>
               <p className="text-sm mt-2">
                Sign up is disabled. Please provide Firebase credentials to enable authentication.
              </p>
              <Button onClick={() => router.push('/')} className="mt-4">View App Demo</Button>
            </div>
          )}
        </CardContent>
        {isFirebaseConfigured && (
            <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="font-semibold text-primary hover:underline">
                        Sign In
                    </Link>
                </p>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
