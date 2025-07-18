'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();

  const handleSaveChanges = () => {
    toast({
        title: 'Settings Saved',
        description: 'Your new settings have been applied.',
    })
  }
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account and notification settings.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>
              Update your password and manage security settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch id="2fa-switch" />
              <Label htmlFor="2fa-switch">Enable Two-Factor Authentication</Label>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveChanges}>Save Password</Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Choose how you want to be notified.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label>Notification Method</Label>
                <Select defaultValue="email">
                    <SelectTrigger>
                        <SelectValue placeholder="Select a method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2 pt-2">
                <Label className="font-medium">Email Notifications</Label>
                <div className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="approval-notif" defaultChecked/>
                        <Label htmlFor="approval-notif" className='font-normal'>Pending Approvals</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="feedback-notif" defaultChecked/>
                        <Label htmlFor="feedback-notif" className='font-normal'>New Feedback Received</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="system-notif" />
                        <Label htmlFor="system-notif" className='font-normal'>System Alerts</Label>
                    </div>
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveChanges}>Save Notifications</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
