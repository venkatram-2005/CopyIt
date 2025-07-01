"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copyright } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAuthAction = async (action: 'signIn' | 'signUp') => {
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Firebase Not Configured",
        description: "Please provide Firebase configuration in your environment variables.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      if (action === 'signUp') {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: "Account Created",
          description: "You have successfully signed up. Redirecting...",
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/');
    } catch (e) {
      const err = e as AuthError;
      let friendlyMessage = "An error occurred. Please try again.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        friendlyMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email is already in use. Please sign in.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'The password is too weak. Please use at least 6 characters.';
      }

      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: friendlyMessage,
      });
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
          <CardDescription>Sign in to your account or create a new one</CardDescription>
        </CardHeader>
        <CardContent>
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
            <div className="flex flex-col space-y-2 pt-2">
              <Button onClick={() => handleAuthAction('signIn')} className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
              <Button onClick={() => handleAuthAction('signUp')} variant="outline" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing Up...' : 'Sign Up'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
