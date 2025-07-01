
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copyright, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const isFirebaseConfigured = !!auth;

  const handleSignIn = async () => {
    if (!isFirebaseConfigured) {
      toast({
        variant: "destructive",
        title: "Firebase Not Configured",
        description: "Please provide Firebase configuration to sign in.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (e) {
      const err = e as AuthError;
      let friendlyMessage = "An unexpected error occurred. Please try again.";
      
      switch (err.code) {
        case 'auth/invalid-credential':
          friendlyMessage = 'Invalid email or password.';
          break;
        case 'auth/user-disabled':
          friendlyMessage = 'This user account has been disabled.';
          break;
        case 'auth/user-not-found':
          friendlyMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          friendlyMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          friendlyMessage = 'Please enter a valid email address.';
          break;
        default:
          friendlyMessage = `An unexpected error occurred: ${err.code}`;
          break;
      }

      toast({
        variant: "destructive",
        title: "Authentication Error",
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
          <CardDescription>{isFirebaseConfigured ? "Sign in to your account" : "Demo Mode"}</CardDescription>
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
              <Button onClick={handleSignIn} className="w-full mt-2" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : 'Sign In'}
              </Button>
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-4 border rounded-md bg-muted/50">
               <h3 className="font-semibold text-foreground">Firebase Not Configured</h3>
               <p className="text-sm mt-2">
                The login form is disabled. Please provide Firebase credentials to enable authentication.
              </p>
              <Button onClick={() => router.push('/')} className="mt-4">View App Demo</Button>
            </div>
          )}
        </CardContent>
        {isFirebaseConfigured && (
            <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link href="/signup" className="font-semibold text-primary hover:underline">
                        Sign Up
                    </Link>
                </p>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
