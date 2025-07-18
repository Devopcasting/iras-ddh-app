'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !role) {
      toast({
        title: "Error",
        description: "Please enter email, password and select a role",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await login({
        email,
        password,
        role
      });
      toast({
        title: "Success",
        description: "Login successful!",
      });
      router.push('/dashboard');
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-background">
      {/* Left Panel - Information */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground flex-col justify-center items-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <h1 className="font-headline text-6xl font-bold text-primary-foreground">
                IRAS-DHH
              </h1>
            </div>
            <h2 className="font-headline text-3xl font-bold leading-tight">
              Indian Railway<br />
              Announcement System<br />
              For Deaf and Hard of Hearing
            </h2>
            <p className="text-lg text-primary-foreground/90 leading-relaxed">
              Accessible railway information system designed for inclusive communication
            </p>
          </div>

          <div className="space-y-4 pt-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
              <span className="text-lg">Visual announcements</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
              <span className="text-lg">Real-time train information</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
              <span className="text-lg">Accessible interface design</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mb-4 flex items-center justify-center gap-2 lg:hidden">
                <div className="relative h-8 w-8">
                  <Image
                    src="/images/logo.png"
                    alt="IRAS-DHH Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <CardTitle className="font-headline text-2xl lg:text-3xl">
                Welcome Back
              </CardTitle>
              <CardDescription>
                Login to your account to manage announcements
              </CardDescription>

            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-medium">Login as</Label>
                  <RadioGroup
                    value={role}
                    onValueChange={handleRoleChange}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="admin" id="admin" />
                      <Label htmlFor="admin" className="flex items-center gap-2 cursor-pointer">
                        <span className="font-medium">Admin</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="operator" id="operator" />
                      <Label htmlFor="operator" className="flex items-center gap-2 cursor-pointer">
                        <span className="font-medium">Operator</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
