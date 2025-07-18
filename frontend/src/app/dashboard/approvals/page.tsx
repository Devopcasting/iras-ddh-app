'use client';

import { Check, X, TestTubeDiagonal } from 'lucide-react';
import Image from 'next/image';

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const pendingApprovals = [
  { id: 'ANNC-003', trainNo: '12002', trainName: 'Shatabdi EXP', platform: '3', type: 'Platform Change', submittedBy: 'operator1', submittedAt: '2024-08-15 10:25' },
  { id: 'ANNC-007', trainNo: '12801', trainName: 'Purushottam EXP', platform: '7', type: 'Arrival', submittedBy: 'operator2', submittedAt: '2024-08-15 10:40' },
  { id: 'ANNC-008', trainNo: '12397', trainName: 'Mahabodhi EXP', platform: '8', type: 'Delay', submittedBy: 'operator1', submittedAt: '2024-08-15 10:55' },
];

export default function ApprovalsPage() {
    const { toast } = useToast();
    
    const handleTestRun = (id: string) => {
        toast({
            title: "Test Run Initiated",
            description: `Announcement ${id} is now being tested on a designated screen.`,
        })
    }
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Announcement Approvals
        </h1>
        <p className="text-muted-foreground">
          Review and approve announcements submitted by operators.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pending Review</CardTitle>
          <CardDescription>
            These announcements require your approval before going live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Train Details</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApprovals.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.trainNo} ({item.trainName})</div>
                    <div className="text-sm text-muted-foreground">Platform {item.platform}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell>{item.submittedBy}</TableCell>
                  <TableCell>{new Date(item.submittedAt).toLocaleTimeString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="outline" size="sm">Preview</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className='font-headline'>Preview Announcement</DialogTitle>
                            <DialogDescription>
                              Review the details and ISL video before taking action.
                            </DialogDescription>
                          </DialogHeader>
                          <div className='grid gap-4 py-4'>
                            <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                                <Image
                                src="https://placehold.co/1280x720.png"
                                alt="ISL Video Preview"
                                width={1280}
                                height={720}
                                className="h-full w-full object-cover"
                                data-ai-hint="sign language video"
                                />
                            </div>
                            <div className='text-sm'>
                                <p><strong>Train:</strong> {item.trainNo} - {item.trainName}</p>
                                <p><strong>Platform:</strong> {item.platform}</p>
                                <p><strong>Type:</strong> {item.type}</p>
                                <p><strong>Message:</strong> "Attention passengers, train number {item.trainNo}, the {item.trainName}, will now arrive on platform {item.platform}."</p>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => handleTestRun(item.id)}> <TestTubeDiagonal className="mr-2 h-4 w-4" /> Test Run</Button>
                            <Button variant="destructive"><X className="mr-2 h-4 w-4" />Reject</Button>
                            <Button><Check className="mr-2 h-4 w-4" />Approve</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="destructive" size="icon"><X className="h-4 w-4"/></Button>
                      <Button size="icon" className='bg-green-600 hover:bg-green-700'><Check className="h-4 w-4"/></Button>
                    </div>
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
