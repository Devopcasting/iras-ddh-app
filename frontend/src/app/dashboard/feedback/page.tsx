import { Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const tickets = [
    { id: 'FB-001', title: 'Incorrect sign for "delay"', status: 'Open', date: '2024-08-14' },
    { id: 'FB-002', title: 'Video freezes on Platform 3 screen', status: 'In Progress', date: '2024-08-13' },
    { id: 'FB-003', title: 'Text is not legible on SCR-005', status: 'Closed', date: '2024-08-12' },
]

export default function FeedbackPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Feedback & Reports
        </h1>
        <p className="text-muted-foreground">
          Report issues or provide feedback on the system.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Submit a Ticket</CardTitle>
            <CardDescription>
              Let us know if you encounter any issues.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="issue-type">Issue Type</Label>
              <Select>
                <SelectTrigger id="issue-type">
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="isl-video">ISL Video Error</SelectItem>
                  <SelectItem value="display-issue">Display/Screen Issue</SelectItem>
                  <SelectItem value="system-bug">System Bug</SelectItem>
                  <SelectItem value="general-feedback">General Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-id">Announcement ID (Optional)</Label>
              <Input
                id="announcement-id"
                placeholder="e.g., ANNC-003"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Please provide a detailed description of the issue."
                rows={5}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Submit Ticket
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Submitted Tickets</CardTitle>
            <CardDescription>A history of your submitted tickets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tickets.map(ticket => (
                <div key={ticket.id} className='flex items-center justify-between rounded-lg border p-3'>
                    <div>
                        <p className='font-medium'>{ticket.title}</p>
                        <p className='text-sm text-muted-foreground'>Ticket #{ticket.id} - Submitted on {ticket.date}</p>
                    </div>
                    <Badge variant={ticket.status === 'Open' ? 'destructive' : ticket.status === 'In Progress' ? 'outline' : 'secondary'}>{ticket.status}</Badge>
                </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
