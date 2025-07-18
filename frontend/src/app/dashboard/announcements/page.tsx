import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const announcements = [
    { id: 'ANNC-001', trainNo: '12951', trainName: 'Mumbai Rajdhani', platform: '1', type: 'Arrival', status: 'Playing', createdBy: 'operator1', scheduledAt: '2024-08-15 10:00' },
    { id: 'ANNC-002', trainNo: '22439', trainName: 'Vande Bharat EXP', platform: '4', type: 'Departure', status: 'Scheduled', createdBy: 'operator2', scheduledAt: '2024-08-15 10:15' },
    { id: 'ANNC-003', trainNo: '12002', trainName: 'Shatabdi EXP', platform: '3', type: 'Platform Change', status: 'Pending Approval', createdBy: 'operator1', scheduledAt: '2024-08-15 10:30' },
    { id: 'ANNC-004', trainNo: '12313', trainName: 'Sealdah Rajdhani', platform: '2', type: 'Arrival', status: 'Completed', createdBy: 'operator2', scheduledAt: '2024-08-15 09:45' },
    { id: 'ANNC-005', trainNo: '12417', trainName: 'Prayagraj EXP', platform: '5', type: 'Delay', status: 'Delayed', createdBy: 'operator1', scheduledAt: '2024-08-15 09:50' },
    { id: 'ANNC-006', trainNo: '12259', trainName: 'Duronto EXP', platform: '6', type: 'Departure', status: 'Scheduled', createdBy: 'operator2', scheduledAt: '2024-08-15 11:00' },
];

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    Playing: 'default',
    Scheduled: 'secondary',
    'Pending Approval': 'outline',
    Completed: 'secondary',
    Delayed: 'destructive',
}

export default function AnnouncementsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Announcements
          </h1>
          <p className="text-muted-foreground">
            Manage all train announcements here.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/announcements/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Announcement
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Announcements</CardTitle>
          <CardDescription>
            View, edit, and manage all scheduled and past announcements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Train</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Scheduled At</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((ann) => (
                <TableRow key={ann.id}>
                  <TableCell>
                    <div className="font-medium">{ann.trainNo}</div>
                    <div className="text-sm text-muted-foreground">{ann.trainName}</div>
                  </TableCell>
                  <TableCell>{ann.platform}</TableCell>
                  <TableCell>{ann.type}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[ann.status] || 'default'}>{ann.status}</Badge>
                  </TableCell>
                  <TableCell>{ann.createdBy}</TableCell>
                  <TableCell>{new Date(ann.scheduledAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
