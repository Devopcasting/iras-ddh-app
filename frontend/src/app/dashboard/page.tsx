'use client';

import { useState, useEffect } from 'react';
import {
  MoreHorizontal,
  Megaphone,
  Hourglass,
  Monitor,
  TrainTrack,
  Train,
  MapPin,
  Clock,
  Calendar,
  Copy,
  Volume2,
  Video,
  Loader2,
  Search,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface TrainStation {
    id: number;
    station_name: string;
    station_code: string;
    platform_number: string;
    sequence_order: number;
}

interface Station {
    id: number;
    station_name: string;
    station_code: string;
    city?: string;
    state?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
}

interface Train {
    id: number;
    train_number: string;
    train_name: string;
    start_station: string;
    end_station: string;
    created_at: string;
    updated_at: string | null;
    stations: TrainStation[];
}

const announcements = [
  {
    trainNo: '12951',
    trainName: 'Mumbai Rajdhani',
    platform: '1',
    status: 'Playing',
    scheduledAt: '10:00 AM',
  },
  {
    trainNo: '22439',
    trainName: 'Vande Bharat EXP',
    platform: '4',
    status: 'Scheduled',
    scheduledAt: '10:15 AM',
  },
  {
    trainNo: '12002',
    trainName: 'Shatabdi EXP',
    platform: '3',
    status: 'Pending Approval',
    scheduledAt: '10:30 AM',
  },
  {
    trainNo: '12313',
    trainName: 'Sealdah Rajdhani',
    platform: '2',
    status: 'Completed',
    scheduledAt: '09:45 AM',
  },
  {
    trainNo: '12417',
    trainName: 'Prayagraj EXP',
    platform: '5',
    status: 'Delayed',
    scheduledAt: '09:50 AM',
  },
];

const statusVariant: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
    Playing: 'default',
    Scheduled: 'secondary',
    'Pending Approval': 'outline',
    Completed: 'secondary',
    Delayed: 'destructive',
}

export default function DashboardPage() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
  const [announcementText, setAnnouncementText] = useState('');
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [currentAudioFilename, setCurrentAudioFilename] = useState<string | null>(null);
  const [trainSearch, setTrainSearch] = useState('');
  const { user, token } = useAuth();
  const { toast } = useToast();

  // State to Language mapping for announcements (will be fetched from database)
  const [stateToLanguage, setStateToLanguage] = useState<{ [key: string]: string }>({});

  // Fetch state-language mappings from API
  const fetchStateLanguageMappings = async () => {
    try {
      const response = await fetch('http://localhost:8000/state-language-mappings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const mapping: { [key: string]: string } = {};
        data.forEach((item: any) => {
          mapping[item.state] = item.language;
        });
        setStateToLanguage(mapping);
      } else {
        console.error('Failed to fetch state-language mappings');
      }
    } catch (error) {
      console.error('Error fetching state-language mappings:', error);
    }
  };

  // Fetch stations from API
  const fetchStations = async () => {
    try {
      const response = await fetch('http://localhost:8000/stations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStations(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch stations",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch stations",
        variant: "destructive",
      });
    }
  };

  // Get trains for the operator's station
  const fetchTrainsForStation = async () => {
    if (!user?.station_code) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/trains/station/${user.station_code}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTrains(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch trains for your station",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch trains for your station",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
    fetchStateLanguageMappings();
    fetchTrainsForStation();
  }, [user, token]);

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
      // Clean up object URL
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
      // Delete audio file from server
      if (currentAudioFilename) {
        deleteAudioFile(currentAudioFilename);
      }
    };
  }, [audioElement, audioUrl, currentAudioFilename]);

  // Get station info for the operator's station
  const getStationInfo = (train: Train) => {
    if (user?.station_code?.toUpperCase() === 'ALL') {
      // For "ALL" assignment, return the first station of the train
      return train.stations[0];
    }
    return train.stations.find(station => station.station_code === user?.station_code);
  };

  // Filter trains based on search input
  const filteredTrains = trainSearch.trim() 
    ? trains.filter(train => train.train_number.includes(trainSearch.trim()))
    : trains;

  // Generate announcement text based on train information
  const generateAnnouncementText = async (train: Train) => {
    const stationInfo = getStationInfo(train);
    const platformNumber = stationInfo?.platform_number || 'N/A';
    
    // Get the station master data to find the state and local language
    const stationMaster = stations.find(s => s.station_code === user?.station_code);
    const state = stationMaster?.state;
    const localLanguage = state ? stateToLanguage[state] : null;
    

    
    // Generate English announcement with separated train number and platform number (display version)
    const separatedTrainNumber = train.train_number.split('').join(' ');
    const separatedPlatformNumber = platformNumber.split('').join(' ');
    console.log('Original train number:', train.train_number);
    console.log('Separated train number (display):', separatedTrainNumber);
    const englishAnnouncement = `Attention please! Train number ${separatedTrainNumber} ${train.train_name} from ${train.start_station} to ${train.end_station} will arrive at platform number ${separatedPlatformNumber}. Thank you.`;
    
    // Check if local language is supported for translation
    const supportedLanguages = ['Gujarati', 'Marathi'];
    const isSupported = localLanguage && supportedLanguages.includes(localLanguage);
    
    if (isSupported) {
      try {
        // Use translation API
        const response = await fetch('http://localhost:8000/translate/announcement', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            english_text: englishAnnouncement,
            local_language: localLanguage
          }),
        });

        if (response.ok) {
          const translations = await response.json();
          
          // Combine all languages with local language on top
          let fullAnnouncement = '';
          
          // Local language first
          if (translations.local) {
            fullAnnouncement += `${localLanguage.toUpperCase()}:\n${translations.local}\n\n`;
          }
          
          // Then English and Hindi
          fullAnnouncement += `ENGLISH:\n${translations.english}\n\nHINDI:\n${translations.hindi}`;
          
          return fullAnnouncement;
        } else {
          console.error('Translation API failed:', response.status);
        }
      } catch (error) {
        console.error('Translation API error:', error);
      }
    }
    
    // Fallback to hardcoded translations for unsupported languages or API failures
    const hindiAnnouncement = `कृपया ध्यान दें! ट्रेन नंबर ${separatedTrainNumber} ${train.train_name} ${train.start_station} से ${train.end_station} तक प्लेटफॉर्म नंबर ${separatedPlatformNumber} पर आ रही है। धन्यवाद।`;
    
    let localLanguageAnnouncement = '';
    if (localLanguage) {
      // Generate local language announcement based on the language
      switch (localLanguage) {
        case 'Marathi':
          localLanguageAnnouncement = `कृपया लक्ष द्या! ट्रेन क्रमांक ${separatedTrainNumber} ${train.train_name} ${train.start_station} पासून ${train.end_station} पर्यंत प्लॅटफॉर्म क्रमांक ${separatedPlatformNumber} वर येत आहे. धन्यवाद.`;
          break;
        case 'Gujarati':
          localLanguageAnnouncement = `કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર ${separatedTrainNumber} ${train.train_name} ${train.start_station} થી ${train.end_station} સુધી પ્લેટફોર્મ નંબર ${separatedPlatformNumber} પર આવી રહી છે. આભાર.`;
          break;
        default:
          // For other languages, use English as fallback
          localLanguageAnnouncement = englishAnnouncement;
      }
    }
    
    // Combine all languages with local language on top
    let fullAnnouncement = '';
    
    // Always include local language first (if available and different from Hindi)
    if (localLanguageAnnouncement && localLanguage && localLanguage !== 'Hindi') {
      fullAnnouncement += `${localLanguage.toUpperCase()}:\n${localLanguageAnnouncement}\n\n`;
    }
    
    // Then include English and Hindi
    fullAnnouncement += `ENGLISH:\n${englishAnnouncement}\n\nHINDI:\n${hindiAnnouncement}`;
    
    return fullAnnouncement;
  };

  // Handle create announcement
  const handleCreateAnnouncement = async (train: Train) => {
    setSelectedTrain(train);
    const text = await generateAnnouncementText(train);
    setAnnouncementText(text);
    setIsAnnouncementDialogOpen(true);
  };

  // Cleanup audio when dialog closes
  const handleDialogClose = (open: boolean) => {
    setIsAnnouncementDialogOpen(open);
    if (!open) {
      // Stop audio and cleanup when dialog closes
      stopAudio();
    }
  };

  // Copy announcement text to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(announcementText);
      toast({
        title: "Copied!",
        description: "Announcement text copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  // Function to convert digits to Hindi words
  const convertDigitsToHindi = (text: string) => {
    const digitToHindi: { [key: string]: string } = {
      '0': 'शून्य',
      '1': 'एक',
      '2': 'दो',
      '3': 'तीन',
      '4': 'चार',
      '5': 'पांच',
      '6': 'छह',
      '7': 'सात',
      '8': 'आठ',
      '9': 'नौ'
    };
    
    // Replace each digit with its Hindi word
    let result = text;
    Object.entries(digitToHindi).forEach(([digit, hindiWord]) => {
      result = result.replace(new RegExp(digit, 'g'), hindiWord);
    });
    
    return result;
  };

  // Function to ensure train numbers are separated with spaces for English TTS
  const ensureSeparatedTrainNumbersEnglish = (text: string, trainNumber: string) => {
    const separatedTrainNumber = trainNumber.split('').map(digit => {
      // Replace 0 with "zero" for English TTS (proper pronunciation)
      return digit === '0' ? 'zero' : digit;
    }).join(' ');
    // Replace any occurrence of the train number with the separated version
    return text.replace(new RegExp(trainNumber, 'g'), separatedTrainNumber);
  };

  // Function to ensure train numbers are separated with spaces and zeros are pronounced correctly (for TTS)
  const ensureSeparatedTrainNumbers = (text: string, trainNumber: string) => {
    const separatedTrainNumber = trainNumber.split('').map(digit => {
      // Replace 0 with "zero" for proper pronunciation
      return digit === '0' ? 'zero' : digit;
    }).join(' ');
    // Replace any occurrence of the train number with the separated version
    return text.replace(new RegExp(trainNumber, 'g'), separatedTrainNumber);
  };

  // Function to convert "zero" to "oh" for English TTS (to avoid "O" pronunciation)
  const convertZeroToOh = (text: string) => {
    return text.replace(/zero/g, 'oh');
  };

  // Function to convert "zero" to "shunya" for Hindi TTS
  const convertZeroToShunya = (text: string) => {
    return text.replace(/zero/g, 'शून्य');
  };

  // Function to convert all "0" digits to "zero" in English text for TTS
  const convertZeroDigitsToZero = (text: string) => {
    return text.replace(/0/g, 'zero');
  };

  // Extract language texts from announcement
  const extractLanguageTexts = () => {
    const stationMaster = stations.find(s => s.station_code === user?.station_code);
    const state = stationMaster?.state;
    const localLanguage = state ? stateToLanguage[state] : null;

    let localText = '';
    let englishText = '';
    let hindiText = '';

    // Extract local language text
    if (localLanguage && localLanguage !== 'Hindi') {
      localText = announcementText.split('\n\n').find(section => 
        section.startsWith(localLanguage.toUpperCase() + ':')
      )?.replace(localLanguage.toUpperCase() + ':', '').trim() || '';
    }

    // Extract English text
    englishText = announcementText.split('\n\n').find(section => 
      section.startsWith('ENGLISH:')
    )?.replace('ENGLISH:', '').trim() || '';

    // Extract Hindi text
    hindiText = announcementText.split('\n\n').find(section => 
      section.startsWith('HINDI:')
    )?.replace('HINDI:', '').trim() || '';

    return {
      localText,
      englishText,
      hindiText,
      localLanguage
    };
  };

  // Generate and play audio
  const handlePreviewAudio = async () => {
    if (!announcementText.trim()) {
      toast({
        title: "Error",
        description: "No announcement text to preview",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAudio(true);
    
    try {
      const { localText, englishText, hindiText, localLanguage } = extractLanguageTexts();
      
      // Get the current train number for separation
      const currentTrainNumber = selectedTrain?.train_number || '';

      // Ensure train numbers are separated in all languages and convert 0 to zero
      const processedEnglishText = convertZeroDigitsToZero(ensureSeparatedTrainNumbersEnglish(englishText, currentTrainNumber));
      
      // For Hindi, convert digits to Hindi words and "zero" to "shunya" for better pronunciation
      const processedHindiText = convertZeroToShunya(convertDigitsToHindi(ensureSeparatedTrainNumbers(hindiText, currentTrainNumber)));
      
      const processedLocalText = localText ? ensureSeparatedTrainNumbers(localText, currentTrainNumber) : '';

      console.log('Processed Hindi text:', processedHindiText);

      // Prepare request payload
      const requestPayload: any = {
        english_text: processedEnglishText,
        hindi_text: processedHindiText
      };

      // Add local language if available
      if (processedLocalText && localLanguage && localLanguage !== 'Hindi') {
        requestPayload.local_text = processedLocalText;
        requestPayload.local_language = localLanguage;
      }

      // Call backend audio generation API
      const response = await fetch('http://localhost:8000/generate-audio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.statusText}`);
      }

      const result = await response.json();
      
              if (result.success) {
          // Extract filename from the audio URL
          const filename = result.audio_url.split('/').pop();
          setCurrentAudioFilename(filename);
          
          // Fetch audio with authentication headers
          const audioResponse = await fetch(`http://localhost:8000${result.audio_url}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!audioResponse.ok) {
            throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`);
          }

          console.log('Audio response status:', audioResponse.status);
          console.log('Audio response headers:', Object.fromEntries(audioResponse.headers.entries()));

          // Convert to blob and create object URL
          const audioBlob = await audioResponse.blob();
          console.log('Audio blob size:', audioBlob.size, 'bytes');
          console.log('Audio blob type:', audioBlob.type);
          
          // Check if blob is valid
          if (audioBlob.size === 0) {
            throw new Error('Audio blob is empty');
          }
          
          if (!audioBlob.type.includes('audio/')) {
            console.warn('Audio blob type is not audio:', audioBlob.type);
          }
          
          const audioObjectUrl = URL.createObjectURL(audioBlob);
          console.log('Created object URL:', audioObjectUrl);
          setAudioUrl(audioObjectUrl);

        // Create and play audio element
        const audio = new Audio();
        
        audio.onloadstart = () => {
          console.log('Audio loading started');
        };
        
        audio.onprogress = () => {
          console.log('Audio loading progress');
        };
        
        audio.oncanplay = () => {
          console.log('Audio can play, attempting to play');
          audio.play().then(() => {
            console.log('Audio playback started successfully');
            setAudioElement(audio);
          }).catch((playError) => {
            console.error('Failed to start audio playback:', playError);
            toast({
              title: "Error",
              description: "Failed to start audio playback",
              variant: "destructive",
            });
          });
        };
        
        audio.onloadeddata = () => {
          console.log('Audio data loaded');
        };
        
        audio.onloadedmetadata = () => {
          console.log('Audio metadata loaded, duration:', audio.duration);
        };
        
        audio.onerror = (event) => {
          console.error('Audio playback error:', event);
          console.error('Audio error details:', audio.error);
          console.error('Audio error code:', audio.error?.code);
          console.error('Audio error message:', audio.error?.message);
          console.error('Audio ready state:', audio.readyState);
          console.error('Audio network state:', audio.networkState);
          console.error('Audio current src:', audio.currentSrc);
          console.error('Audio src attribute:', audio.src);
          
          let errorMessage = 'Unknown error';
          if (audio.error) {
            switch (audio.error.code) {
              case MediaError.MEDIA_ERR_ABORTED:
                errorMessage = 'Audio playback was aborted';
                break;
              case MediaError.MEDIA_ERR_NETWORK:
                errorMessage = 'Network error while loading audio';
                break;
              case MediaError.MEDIA_ERR_DECODE:
                errorMessage = 'Audio decoding error - unsupported format';
                break;
              case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = 'Audio format not supported by browser';
                break;
              default:
                errorMessage = audio.error.message || 'Unknown audio error';
            }
          }
          
          toast({
            title: "Error",
            description: `Failed to play audio: ${errorMessage}`,
            variant: "destructive",
          });
        };
        
        audio.onended = () => {
          console.log('Audio playback ended');
          setAudioElement(null);
          // Delete audio file from server when playback ends naturally
          if (currentAudioFilename) {
            deleteAudioFile(currentAudioFilename);
            setCurrentAudioFilename(null);
          }
          // Clean up object URL
          if (audioUrl && audioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
          }
        };

        // Set the source and load the audio
        console.log('Setting audio src to:', audioObjectUrl);
        audio.src = audioObjectUrl;
        
        // Load the audio explicitly
        audio.load();

        toast({
          title: "Audio Generated",
          description: "Multi-language audio is now playing",
        });
      } else {
        throw new Error(result.message || 'Failed to generate audio');
      }
    } catch (error) {
      console.error('Audio generation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate audio",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Delete audio file from server
  const deleteAudioFile = async (filename: string) => {
    if (!filename) return;
    
    try {
      const response = await fetch(`http://localhost:8000/audio/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        console.log(`🗑️ Deleted audio file: ${filename}`);
      } else {
        console.warn(`Failed to delete audio file: ${filename}`);
      }
    } catch (error) {
      console.error(`Error deleting audio file: ${error}`);
    }
  };

  // Stop audio playback
  const stopAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setAudioElement(null);
    }
    // Clean up object URL
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    // Delete audio file from server
    if (currentAudioFilename) {
      deleteAudioFile(currentAudioFilename);
      setCurrentAudioFilename(null);
    }
  };

  // Show admin dashboard
  if (user?.role === 'admin') {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time overview of announcements and system status.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Announcements
              </CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Hourglass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+5</div>
              <p className="text-xs text-muted-foreground">Awaiting admin review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live on Screen</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Across all platforms</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Screens</CardTitle>
              <TrainTrack className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">Total screens online</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
            <CardDescription>
              A list of the most recent announcements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Train</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled At</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((announcement) => (
                  <TableRow key={announcement.trainNo}>
                    <TableCell>
                      <div className="font-medium">{announcement.trainNo}</div>
                      <div className="text-sm text-muted-foreground">
                        {announcement.trainName}
                      </div>
                    </TableCell>
                    <TableCell>{announcement.platform}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[announcement.status] || 'default'}>{announcement.status}</Badge>
                    </TableCell>
                    <TableCell>{announcement.scheduledAt}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Cancel</DropdownMenuItem>
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

  // Show operator dashboard with station timetable
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Station Dashboard
        </h1>
        <p className="text-muted-foreground">
          {user?.station_code?.toUpperCase() === 'ALL' 
            ? 'Station timetable for announcements across all stations (you have access to all routes).'
            : `Station timetable for announcements at ${user?.station_code || 'your station'}.`
          }
        </p>
      </div>

      {/* Station Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Station Code
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.station_code?.toUpperCase() === 'ALL' ? '🌐 ALL' : (user?.station_code || 'N/A')}
            </div>
            <p className="text-xs text-muted-foreground">
              {user?.station_code?.toUpperCase() === 'ALL' ? 'Access to all stations' : 'Your assigned station'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trains</CardTitle>
            <Train className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : trains.length}</div>
            <p className="text-xs text-muted-foreground">Passing through today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Routes</CardTitle>
            <TrainTrack className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : new Set(trains.map(t => `${t.start_station}-${t.end_station}`)).size}
            </div>
            <p className="text-xs text-muted-foreground">Different routes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">Station operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Station Timetable for Announcements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Train className="h-5 w-5" />
                Station Timetable for Announcements
              </CardTitle>
              <CardDescription>
                {user?.station_code?.toUpperCase() === 'ALL'
                  ? 'All trains across all stations - Use this information for announcements'
                  : `Trains passing through ${user?.station_code} - Use this information for announcements`
                }
              </CardDescription>
            </div>
            <Button onClick={fetchTrainsForStation} variant="outline" disabled={loading}>
              <Clock className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Train Search */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Search Train:</span>
              </div>
              <div className="w-48">
                <Input
                  type="text"
                  placeholder="Enter 5-digit train number (e.g., 12951)"
                  value={trainSearch}
                  onChange={(e) => setTrainSearch(e.target.value)}
                  maxLength={5}
                  className="font-mono"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTrainSearch('')}
                disabled={!trainSearch.trim()}
              >
                Clear
              </Button>
            </div>
            {trainSearch.trim() && filteredTrains.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2 ml-6">
                No train found with number "{trainSearch.trim()}"
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading station timetable...</p>
              </div>
            </div>
          ) : !user?.station_code ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Station Assigned</h3>
              <p className="text-muted-foreground">
                You are not assigned to any station. Contact your administrator.
              </p>
            </div>
          ) : filteredTrains.length === 0 ? (
            <div className="text-center py-8">
              <Train className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {trainSearch.trim() ? 'No Matching Trains Found' : 'No Trains Found'}
              </h3>
              <p className="text-muted-foreground">
                {trainSearch.trim() 
                  ? `No trains found with number "${trainSearch.trim()}"`
                  : 'No trains are currently scheduled to pass through your station.'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Train Number</TableHead>
                  <TableHead>Train Name</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Sequence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrains.map((train) => {
                  const stationInfo = getStationInfo(train);
                  return (
                    <TableRow key={train.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Train className="h-4 w-4 text-primary" />
                          {train.train_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{train.train_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {train.start_station} → {train.end_station}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {train.start_station}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="outline">
                            {train.end_station}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          Platform {stationInfo?.platform_number || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Stop {stationInfo?.sequence_order || 'N/A'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            of {train.stations.length}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Scheduled
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCreateAnnouncement(train)}>
                              Create Announcement
                            </DropdownMenuItem>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Mark as Delayed</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>



      {/* Create Announcement Dialog */}
      <Dialog open={isAnnouncementDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Create Announcement
            </DialogTitle>
          </DialogHeader>
          
          {selectedTrain && (
            <div className="grid grid-cols-2 gap-6">
              {/* Left Panel - Announcement Text */}
              <div className="space-y-6">
              {/* Train Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Train Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Train Number:</span> {selectedTrain.train_number}
                  </div>
                  <div>
                    <span className="font-medium">Train Name:</span> {selectedTrain.train_name}
                  </div>
                  <div>
                    <span className="font-medium">Route:</span> {selectedTrain.start_station} → {selectedTrain.end_station}
                  </div>
                  <div>
                    <span className="font-medium">Platform:</span> {getStationInfo(selectedTrain)?.platform_number || 'N/A'}
                  </div>
                </div>
              </div>



              {/* Multi-Language Announcement Text */}
              <div className="space-y-4">
                
                {/* Local Language Section */}
                {(() => {
                  const stationMaster = stations.find(s => s.station_code === user?.station_code);
                  const state = stationMaster?.state;
                  const localLanguage = state ? stateToLanguage[state] : null;
                  

                  
                  if (localLanguage && localLanguage !== 'Hindi') {
                    const localText = announcementText.split('\n\n').find(section => 
                      section.startsWith(localLanguage.toUpperCase() + ':')
                    )?.replace(localLanguage.toUpperCase() + ':', '').trim() || '';
                    

                    
                    return (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-blue-600">
                          {localLanguage}
                        </Label>
                        <Textarea
                          value={localText}
                          onChange={(e) => {
                            // Update the local language section in the full announcement
                            const sections = announcementText.split('\n\n');
                            const updatedSections = sections.map(section => {
                              if (section.startsWith(localLanguage.toUpperCase() + ':')) {
                                return `${localLanguage.toUpperCase()}:\n${e.target.value}`;
                              }
                              return section;
                            });
                            setAnnouncementText(updatedSections.join('\n\n'));
                          }}
                          className="min-h-[80px] resize-none border-blue-200 bg-blue-50"
                          placeholder={`${localLanguage} announcement text...`}
                        />
                      </div>
                    );
                  } else {

                  }
                  return null;
                })()}
                
                {/* English Section */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-green-600">
                    English
                  </Label>
                  <Textarea
                    value={(() => {
                      const englishText = announcementText.split('\n\n').find(section => 
                        section.startsWith('ENGLISH:')
                      )?.replace('ENGLISH:', '').trim() || '';
                      return englishText;
                    })()}
                    onChange={(e) => {
                      // Update the English section in the full announcement
                      const sections = announcementText.split('\n\n');
                      const updatedSections = sections.map(section => {
                        if (section.startsWith('ENGLISH:')) {
                          return `ENGLISH:\n${e.target.value}`;
                        }
                        return section;
                      });
                      setAnnouncementText(updatedSections.join('\n\n'));
                    }}
                    className="min-h-[80px] resize-none border-green-200 bg-green-50"
                    placeholder="English announcement text..."
                  />
                </div>
                
                {/* Hindi Section */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-orange-600">
                    Hindi
                  </Label>
                  <Textarea
                    value={(() => {
                      const hindiText = announcementText.split('\n\n').find(section => 
                        section.startsWith('HINDI:')
                      )?.replace('HINDI:', '').trim() || '';
                      return hindiText;
                    })()}
                    onChange={(e) => {
                      // Update the Hindi section in the full announcement
                      const sections = announcementText.split('\n\n');
                      const updatedSections = sections.map(section => {
                        if (section.startsWith('HINDI:')) {
                          return `HINDI:\n${e.target.value}`;
                        }
                        return section;
                      });
                      setAnnouncementText(updatedSections.join('\n\n'));
                    }}
                    className="min-h-[80px] resize-none border-orange-200 bg-orange-50"
                    placeholder="Hindi announcement text..."
                  />
                </div>
                

              </div>

                {/* Left Panel Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={copyToClipboard}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Text
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handlePreviewAudio}
                    disabled={isGeneratingAudio || !announcementText.trim()}
                  >
                    {isGeneratingAudio ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : audioElement ? (
                      <Volume2 className="mr-2 h-4 w-4 text-red-500" />
                    ) : (
                      <Volume2 className="mr-2 h-4 w-4" />
                    )}
                    {isGeneratingAudio ? "Generating..." : audioElement ? "Playing..." : "Preview Audio"}
                  </Button>
                  {audioElement && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={stopAudio}
                      className="text-red-600 hover:text-red-700"
                    >
                      Stop
                    </Button>
                  )}
                </div>
              </div>

              {/* Right Panel - ISL Video */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Generated ISL Video</h4>
                  <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-4xl mb-2">👋</div>
                      <p className="text-sm">ISL Video will appear here</p>
                    </div>
                  </div>
                </div>
                
                {/* Right Panel Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="flex-1">
                    <Video className="mr-2 h-4 w-4" />
                    Generate ISL
                  </Button>
                  <Button className="flex-1">
                    <Megaphone className="mr-2 h-4 w-4" />
                    Send Announcement
                  </Button>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => setIsAnnouncementDialogOpen(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
