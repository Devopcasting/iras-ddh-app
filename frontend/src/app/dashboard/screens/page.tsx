import { PlusCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const platforms = [
  { id: 1, screen: 'SCR-001', status: 'Active' },
  { id: 2, screen: 'SCR-004', status: 'Active' },
  { id: 3, screen: 'SCR-002', status: 'Active' },
  { id: 4, screen: null, status: 'Inactive' },
  { id: 5, screen: 'SCR-005', status: 'Active' },
  { id: 6, screen: 'SCR-003', status: 'Maintenance' },
];

const screens = [
  { id: 'SCR-001', name: 'Main Concourse Screen 1' },
  { id: 'SCR-002', name: 'Platform 3A Display' },
  { id: 'SCR-003', name: 'Platform 6B Display' },
  { id: 'SCR-004', name: 'Entry Hall Large Screen' },
  { id: 'SCR-005', name: 'Platform 5 Main Display' },
];

export default function ScreensPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Screen Management
          </h1>
          <p className="text-muted-foreground">
            Assign display screens to station platforms.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Platform
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => (
          <Card key={platform.id}>
            <CardHeader>
              <CardTitle className="font-headline">Platform {platform.id}</CardTitle>
              <CardDescription>
                Assign a screen for announcements on this platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor={`screen-select-${platform.id}`}>
                  Assigned Screen
                </Label>
                <Select defaultValue={platform.screen || 'none'}>
                  <SelectTrigger id={`screen-select-${platform.id}`}>
                    <SelectValue placeholder="Select a screen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {screens.map((screen) => (
                      <SelectItem key={screen.id} value={screen.id}>
                        {screen.name} ({screen.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <div className='flex items-center gap-2'>
                    <span className={`h-2 w-2 rounded-full ${platform.status === 'Active' ? 'bg-green-500' : platform.status === 'Maintenance' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <span className='text-sm text-muted-foreground'>{platform.status}</span>
                </div>
              <Button>Save</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
