'use client';

import { useState } from 'react';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function NewAnnouncementPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoGenerated, setVideoGenerated] = useState(false);
  const { toast } = useToast();

  const handleGenerateVideo = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setVideoGenerated(true);
      toast({
        title: 'Video Generated',
        description: 'ISL video is ready for preview.',
      });
    }, 2000);
  };

  const handleSubmit = () => {
    toast({
        title: 'Submitted for Approval',
        description: 'The announcement has been sent to an administrator for review.',
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Create New Announcement
        </h1>
        <p className="text-muted-foreground">
          Fill in the details to schedule a new announcement.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Announcement Details</CardTitle>
              <CardDescription>
                All fields are required for scheduling.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="train-no">Train Number</Label>
                  <Input id="train-no" placeholder="e.g., 12951" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="train-name">Train Name</Label>
                  <Input id="train-name" placeholder="e.g., Mumbai Rajdhani" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Announcement Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arrival">Arrival</SelectItem>
                      <SelectItem value="departure">Departure</SelectItem>
                      <SelectItem value="delay">Delay</SelectItem>
                      <SelectItem value="platform-change">Platform Change</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(10)].map((_, i) => (
                        <SelectItem key={i} value={`${i + 1}`}>
                          Platform {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Use Template</Label>
                <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="std-arrival">Standard Arrival Announcement</SelectItem>
                      <SelectItem value="std-departure">Standard Departure Announcement</SelectItem>
                      <SelectItem value="delay-30">30-Minute Delay Announcement</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter the announcement message here or generate from template."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-date">Schedule Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-[280px] justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>ISL Video Generation</CardTitle>
              <CardDescription>
                Generate and preview the video.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {videoGenerated ? (
                <div className="space-y-4">
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
                  <p className="text-sm text-muted-foreground">
                    Preview of the generated Indian Sign Language video.
                  </p>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Video preview will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
           <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={handleGenerateVideo}
                disabled={isGenerating}
              >
                {isGenerating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {videoGenerated ? "Regenerate Video" : "Generate ISL Video"}
              </Button>
              <Button onClick={handleSubmit} disabled={!videoGenerated}>
                Submit for Approval
              </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
