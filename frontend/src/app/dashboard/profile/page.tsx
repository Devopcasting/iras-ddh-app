'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

const userDetails: {
  [key: string]: { name: string; email: string; fallback: string };
} = {
  admin: {
    name: 'Admin User',
    email: 'admin@indianrail.gov.in',
    fallback: 'AD',
  },
  operator: {
    name: 'Operator User',
    email: 'operator@indianrail.gov.in',
    fallback: 'OP',
  },
};

export default function ProfilePage() {
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      setUserRole(role || 'operator');
    }
  }, []);

  const currentUser = userDetails[userRole] || userDetails.operator;

  if (!userRole) {
    return null; // or a loading skeleton
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          My Profile
        </h1>
        <p className="text-muted-foreground">
          View and manage your account details.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            This is your profile information. It cannot be edited here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={`https://placehold.co/100x100.png?text=${currentUser.fallback}`}
                alt={`@${currentUser.name}`}
              />
              <AvatarFallback>{currentUser.fallback}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{currentUser.name}</h2>
              <p className="text-muted-foreground">{currentUser.email}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={currentUser.name} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={currentUser.email} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value="************"
                readOnly
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
