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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [trainCategories, setTrainCategories] = useState<{ [key: number]: string }>({});
  const [platformNumbers, setPlatformNumbers] = useState<{ [key: number]: string }>({});
  const [previousPlatformNumbers, setPreviousPlatformNumbers] = useState<{ [key: number]: string }>({});
  const [newPlatformNumbers, setNewPlatformNumbers] = useState<{ [key: number]: string }>({});
  const [isGeneratingISL, setIsGeneratingISL] = useState(false);
  const [islVideoUrl, setIslVideoUrl] = useState<string | null>(null);
  const [currentIslFilename, setCurrentIslFilename] = useState<string | null>(null);
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
        
        // Initialize categories for all trains (default to 'arrival')
        const initialCategories: { [key: number]: string } = {};
        const initialPlatformNumbers: { [key: number]: string } = {};
        const initialPreviousPlatformNumbers: { [key: number]: string } = {};
        const initialNewPlatformNumbers: { [key: number]: string } = {};
        data.forEach((train: Train) => {
          initialCategories[train.id] = 'arrival';
          // Initialize platform numbers from existing data
          const stationInfo = train.stations.find(station => station.station_code === user?.station_code);
          const platformNumber = stationInfo?.platform_number || '';
          initialPlatformNumbers[train.id] = platformNumber;
          // Don't set previous platform initially - let it be empty so it falls back to database value
          initialPreviousPlatformNumbers[train.id] = ''; // Initially empty
          initialNewPlatformNumbers[train.id] = ''; // Initially empty
        });
        setTrainCategories(initialCategories);
        setPlatformNumbers(initialPlatformNumbers);
        setPreviousPlatformNumbers(initialPreviousPlatformNumbers);
        setNewPlatformNumbers(initialNewPlatformNumbers);
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

  // Get platform number for a train (uses editable platform number if available)
  const getPlatformNumber = (train: Train) => {
    const editablePlatform = platformNumbers[train.id];
    if (editablePlatform) {
      return editablePlatform;
    }
    const stationInfo = getStationInfo(train);
    return stationInfo?.platform_number || '';
  };

  // Get previous platform number for a train
  const getPreviousPlatformNumber = (train: Train) => {
    const previousPlatform = previousPlatformNumbers[train.id];
    if (previousPlatform && previousPlatform !== '') {
      return previousPlatform;
    }
    // If no previous platform is stored, get the original platform from the database
    const stationInfo = getStationInfo(train);
    return stationInfo?.platform_number || '';
  };

  // Get new platform number for a train
  const getNewPlatformNumber = (train: Train) => {
    return newPlatformNumbers[train.id] || '';
  };

  // Filter trains based on search input
  const filteredTrains = trainSearch.trim() 
    ? trains.filter(train => train.train_number.includes(trainSearch.trim()))
    : trains;

      // Generate announcement text based on train information
    const generateAnnouncementText = async (train: Train, category: string = 'arrival') => {
      const platformNumber = getPlatformNumber(train) || 'N/A';
      const previousPlatformNumber = getPreviousPlatformNumber(train) || 'N/A';
      const newPlatformNumber = getNewPlatformNumber(train) || platformNumber; // Use new platform if available, otherwise current
      
      // Get the station master data to find the state and local language
      const stationMaster = stations.find(s => s.station_code === user?.station_code);
      const state = stationMaster?.state;
      const localLanguage = state ? stateToLanguage[state] : null;
    

    
      // Generate English announcement with separated train number and platform number (display version)
      const separatedTrainNumber = train.train_number.split('').join(' ');
      const separatedPlatformNumber = platformNumber.split('').join(' ');
      const separatedPreviousPlatformNumber = previousPlatformNumber.split('').join(' ');
      const separatedNewPlatformNumber = newPlatformNumber.split('').join(' ');
      console.log('Original train number:', train.train_number);
      console.log('Separated train number (display):', separatedTrainNumber);
      console.log('Current platform number:', platformNumber);
      console.log('Previous platform number:', previousPlatformNumber);
      console.log('New platform number:', newPlatformNumber);
      console.log('Previous platform from state:', previousPlatformNumbers[train.id]);
      console.log('Original platform from DB:', getStationInfo(train)?.platform_number);
      
      // Generate announcement text based on category
      let englishAnnouncement = '';
      switch (category) {
        case 'arrival':
          englishAnnouncement = `Attention please! Train number ${separatedTrainNumber} ${train.train_name} from ${train.start_station} to ${train.end_station} will arrive at platform number ${separatedPlatformNumber}. Thank you.`;
          break;
        case 'departure':
          englishAnnouncement = `Attention please! Train number ${separatedTrainNumber} ${train.train_name} from ${train.start_station} to ${train.end_station} will depart from platform number ${separatedPlatformNumber}. Thank you.`;
          break;
        case 'delay':
          englishAnnouncement = `Attention please! Train number ${separatedTrainNumber} ${train.train_name} from ${train.start_station} to ${train.end_station} is delayed and will arrive at platform number ${separatedPlatformNumber}. We apologize for the inconvenience. Thank you.`;
          break;
        case 'platform_change':
          englishAnnouncement = `Attention please! Train number ${separatedTrainNumber} ${train.train_name} from ${train.start_station} to ${train.end_station} will now arrive at platform number ${separatedNewPlatformNumber} instead of platform number ${separatedPreviousPlatformNumber}. Thank you.`;
          break;
        case 'general':
          englishAnnouncement = `Attention please! Important announcement for train number ${separatedTrainNumber} ${train.train_name} from ${train.start_station} to ${train.end_station} at platform number ${separatedPlatformNumber}. Thank you.`;
          break;
        default:
          englishAnnouncement = `Attention please! Train number ${separatedTrainNumber} ${train.train_name} from ${train.start_station} to ${train.end_station} will arrive at platform number ${separatedPlatformNumber}. Thank you.`;
      }

    // Special handling for station code "ALL" - use GCP translation API for Hindi, Marathi, and Gujarati
    if (user?.station_code === 'ALL') {
      try {
        // First, translate to Hindi using GCP API
        const hindiResponse = await fetch('http://localhost:8000/translate/announcement', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            english_text: englishAnnouncement,
            local_language: 'Marathi' // We'll use Marathi as local language to get both Hindi and Marathi
          }),
        });

        if (hindiResponse.ok) {
          const hindiTranslations = await hindiResponse.json();
          
          // Now translate to Gujarati
          const gujaratiResponse = await fetch('http://localhost:8000/translate/announcement', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              english_text: englishAnnouncement,
              local_language: 'Gujarati'
            }),
          });

          if (gujaratiResponse.ok) {
            const gujaratiTranslations = await gujaratiResponse.json();
            
            // Combine all languages for "ALL" station
            let fullAnnouncement = '';
            fullAnnouncement += `MARATHI:\n${hindiTranslations.local}\n\n`;
            fullAnnouncement += `GUJARATI:\n${gujaratiTranslations.local}\n\n`;
            fullAnnouncement += `ENGLISH:\n${englishAnnouncement}\n\n`;
            fullAnnouncement += `HINDI:\n${hindiTranslations.hindi}`;
            
            return fullAnnouncement;
          }
        }
      } catch (error) {
        console.error('GCP Translation API error for ALL station:', error);
      }
      
      // Fallback to hardcoded translations if GCP API fails
      console.log('Using fallback translations for ALL station');
      
      // Generate Hindi announcement
      let hindiAnnouncement = '';
      switch (category) {
        case 'arrival':
          hindiAnnouncement = `कृपया ध्यान दें! ट्रेन नंबर ${separatedTrainNumber} ${train.train_name} ${train.start_station} से ${train.end_station} तक प्लेटफॉर्म नंबर ${separatedPlatformNumber} पर आ रही है। धन्यवाद।`;
          break;
        case 'departure':
          hindiAnnouncement = `कृपया ध्यान दें! ट्रेन नंबर ${separatedTrainNumber} ${train.train_name} ${train.start_station} से ${train.end_station} तक प्लेटफॉर्म नंबर ${separatedPlatformNumber} से जा रही है। धन्यवाद।`;
          break;
        case 'delay':
          hindiAnnouncement = `कृपया ध्यान दें! ट्रेन नंबर ${separatedTrainNumber} ${train.train_name} ${train.start_station} से ${train.end_station} तक देरी से आ रही है और प्लेटफॉर्म नंबर ${separatedPlatformNumber} पर आएगी। असुविधा के लिए क्षमा चाहते हैं। धन्यवाद।`;
          break;
        case 'platform_change':
          hindiAnnouncement = `कृपया ध्यान दें! ट्रेन नंबर ${separatedTrainNumber} ${train.train_name} ${train.start_station} से ${train.end_station} तक अब प्लेटफॉर्म नंबर ${separatedNewPlatformNumber} पर आएगी प्लेटफॉर्म नंबर ${separatedPreviousPlatformNumber} की जगह। धन्यवाद।`;
          break;
        case 'general':
          hindiAnnouncement = `कृपया ध्यान दें! ट्रेन नंबर ${separatedTrainNumber} ${train.train_name} ${train.start_station} से ${train.end_station} तक के लिए महत्वपूर्ण घोषणा प्लेटफॉर्म नंबर ${separatedPlatformNumber} पर। धन्यवाद।`;
          break;
        default:
          hindiAnnouncement = `कृपया ध्यान दें! ट्रेन नंबर ${separatedTrainNumber} ${train.train_name} ${train.start_station} से ${train.end_station} तक प्लेटफॉर्म नंबर ${separatedPlatformNumber} पर आ रही है। धन्यवाद।`;
      }

      // Generate Marathi announcement
      let marathiAnnouncement = '';
      switch (category) {
        case 'arrival':
          marathiAnnouncement = `कृपया लक्ष द्या! ट्रेन क्रमांक ${separatedTrainNumber} ${train.train_name} ${train.start_station} पासून ${train.end_station} पर्यंत प्लॅटफॉर्म क्रमांक ${separatedPlatformNumber} वर येत आहे. धन्यवाद.`;
          break;
        case 'departure':
          marathiAnnouncement = `कृपया लक्ष द्या! ट्रेन क्रमांक ${separatedTrainNumber} ${train.train_name} ${train.start_station} पासून ${train.end_station} पर्यंत प्लॅटफॉर्म क्रमांक ${separatedPlatformNumber} वरून जात आहे. धन्यवाद.`;
          break;
        case 'delay':
          marathiAnnouncement = `कृपया लक्ष द्या! ट्रेन क्रमांक ${separatedTrainNumber} ${train.train_name} ${train.start_station} पासून ${train.end_station} पर्यंत उशीरा येत आहे आणि प्लॅटफॉर्म क्रमांक ${separatedPlatformNumber} वर येईल. गैरसोयीबद्दल क्षमस्व. धन्यवाद.`;
          break;
        case 'platform_change':
          marathiAnnouncement = `कृपया लक्ष द्या! ट्रेन क्रमांक ${separatedTrainNumber} ${train.train_name} ${train.start_station} पासून ${train.end_station} पर्यंत आता प्लॅटफॉर्म क्रमांक ${separatedNewPlatformNumber} वर येईल प्लॅटफॉर्म क्रमांक ${separatedPreviousPlatformNumber} ऐवजी. धन्यवाद.`;
          break;
        case 'general':
          marathiAnnouncement = `कृपया लक्ष द्या! ट्रेन क्रमांक ${separatedTrainNumber} ${train.train_name} ${train.start_station} पासून ${train.end_station} पर्यंत साठी महत्वाची घोषणा प्लॅटफॉर्म क्रमांक ${separatedPlatformNumber} वर. धन्यवाद.`;
          break;
        default:
          marathiAnnouncement = `कृपया लक्ष द्या! ट्रेन क्रमांक ${separatedTrainNumber} ${train.train_name} ${train.start_station} पासून ${train.end_station} पर्यंत प्लॅटफॉर्म क्रमांक ${separatedPlatformNumber} वर येत आहे. धन्यवाद.`;
      }

      // Generate Gujarati announcement
      let gujaratiAnnouncement = '';
      switch (category) {
        case 'arrival':
          gujaratiAnnouncement = `કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર ${separatedTrainNumber} ${train.train_name} ${train.start_station} થી ${train.end_station} સુધી પ્લેટફોર્મ નંબર ${separatedPlatformNumber} પર આવી રહી છે. આભાર.`;
          break;
        case 'departure':
          gujaratiAnnouncement = `કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર ${separatedTrainNumber} ${train.train_name} ${train.start_station} થી ${train.end_station} સુધી પ્લેટફોર્મ નંબર ${separatedPlatformNumber} થી જઈ રહી છે. આભાર.`;
          break;
        case 'delay':
          gujaratiAnnouncement = `કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર ${separatedTrainNumber} ${train.train_name} ${train.start_station} થી ${train.end_station} સુધી મોડી આવી રહી છે અને પ્લેટફોર્મ નંબર ${separatedPlatformNumber} પર આવશે. અગવડ માટે માફ કરશો. આભાર.`;
          break;
        case 'platform_change':
          gujaratiAnnouncement = `કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર ${separatedTrainNumber} ${train.train_name} ${train.start_station} થી ${train.end_station} સુધી હવે પ્લેટફોર્મ નંબર ${separatedNewPlatformNumber} પર આવશે પ્લેટફોર્મ નંબર ${separatedPreviousPlatformNumber} ની જગ્યાએ. આભાર.`;
          break;
        case 'general':
          gujaratiAnnouncement = `કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર ${separatedTrainNumber} ${train.train_name} ${train.start_station} થી ${train.end_station} સુધી માટે મહત્વપૂર્ણ જાહેરાત પ્લેટફોર્મ નંબર ${separatedPlatformNumber} પર. આભાર.`;
          break;
        default:
          gujaratiAnnouncement = `કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર ${separatedTrainNumber} ${train.train_name} ${train.start_station} થી ${train.end_station} સુધી પ્લેટફોર્મ નંબર ${separatedPlatformNumber} પર આવી રહી છે. આભાર.`;
      }

      // Combine all languages for "ALL" station
      let fullAnnouncement = '';
      fullAnnouncement += `MARATHI:\n${marathiAnnouncement}\n\n`;
      fullAnnouncement += `GUJARATI:\n${gujaratiAnnouncement}\n\n`;
      fullAnnouncement += `ENGLISH:\n${englishAnnouncement}\n\n`;
      fullAnnouncement += `HINDI:\n${hindiAnnouncement}`;
      
      return fullAnnouncement;
    }
    
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
    let hindiAnnouncement = '';
    switch (category) {
      case 'arrival':
        hindiAnnouncement = `कृपया ध्यान दें! ट्रेन नंबर ${separatedTrainNumber} ${train.train_name} ${train.start_station} से ${train.end_station} तक प्लेटफॉर्म नंबर ${separatedPlatformNumber} पर आ रही है। धन्यवाद।`;
        break;
      case 'departure':
        hindiAnnouncement = `कृपया ध्यान दें! ट्रेन नंबर ${separatedTrainNumber} ${train.train_name} ${train.start_station} से ${train.end_station} तक प्लेटफॉर्म नंबर ${separatedPlatformNumber} से जा रही है। धन्यवाद।`;
        break;
      case 'delay':
        hindiAnnouncement = `कृपया ध्यान दें! ट्रेन नंबर ${separatedTrainNumber} ${train.train_name} ${train.start_station} से ${train.end_station} तक देरी से आ रही है और प्लेटफॉर्म नंबर ${separatedPlatformNumber} पर आएगी। असुविधा के लिए क्षमा चाहते हैं। धन्यवाद।`;
        break;
      case 'platform_change':
        hindiAnnouncement = `कृपया ध्यान दें! ट्रेन नंबर ${separatedTrainNumber} ${train.train_name} ${train.start_station} से ${train.end_station} तक अब प्लेटफॉर्म नंबर ${separatedPlatformNumber} पर आएगी। कृपया प्लेटफॉर्म बदलाव का ध्यान रखें। धन्यवाद।`;
        break;
      case 'general':
        hindiAnnouncement = `कृपया ध्यान दें! ट्रेन नंबर ${separatedTrainNumber} ${train.train_name} ${train.start_station} से ${train.end_station} तक के लिए महत्वपूर्ण घोषणा प्लेटफॉर्म नंबर ${separatedPlatformNumber} पर। धन्यवाद।`;
        break;
      default:
        hindiAnnouncement = `कृपया ध्यान दें! ट्रेन नंबर ${separatedTrainNumber} ${train.train_name} ${train.start_station} से ${train.end_station} तक प्लेटफॉर्म नंबर ${separatedPlatformNumber} पर आ रही है। धन्यवाद।`;
    }
    
    let localLanguageAnnouncement = '';
    if (localLanguage) {
      // Generate local language announcement based on the language and category
      switch (localLanguage) {
        case 'Marathi':
          switch (category) {
            case 'arrival':
          localLanguageAnnouncement = `कृपया लक्ष द्या! ट्रेन क्रमांक ${separatedTrainNumber} ${train.train_name} ${train.start_station} पासून ${train.end_station} पर्यंत प्लॅटफॉर्म क्रमांक ${separatedPlatformNumber} वर येत आहे. धन्यवाद.`;
              break;
            case 'departure':
              localLanguageAnnouncement = `कृपया लक्ष द्या! ट्रेन क्रमांक ${separatedTrainNumber} ${train.train_name} ${train.start_station} पासून ${train.end_station} पर्यंत प्लॅटफॉर्म क्रमांक ${separatedPlatformNumber} वरून जात आहे. धन्यवाद.`;
              break;
            case 'delay':
              localLanguageAnnouncement = `कृपया लक्ष द्या! ट्रेन क्रमांक ${separatedTrainNumber} ${train.train_name} ${train.start_station} पासून ${train.end_station} पर्यंत उशीरा येत आहे आणि प्लॅटफॉर्म क्रमांक ${separatedPlatformNumber} वर येईल. गैरसोयीबद्दल क्षमस्व. धन्यवाद.`;
              break;
            case 'platform_change':
              localLanguageAnnouncement = `कृपया लक्ष द्या! ट्रेन क्रमांक ${separatedTrainNumber} ${train.train_name} ${train.start_station} पासून ${train.end_station} पर्यंत आता प्लॅटफॉर्म क्रमांक ${separatedPlatformNumber} वर येईल. कृपया प्लॅटफॉर्म बदल लक्षात घ्या. धन्यवाद.`;
              break;
            case 'general':
              localLanguageAnnouncement = `कृपया लक्ष द्या! ट्रेन क्रमांक ${separatedTrainNumber} ${train.train_name} ${train.start_station} पासून ${train.end_station} पर्यंत साठी महत्वाची घोषणा प्लॅटफॉर्म क्रमांक ${separatedPlatformNumber} वर. धन्यवाद.`;
              break;
            default:
              localLanguageAnnouncement = `कृपया लक्ष द्या! ट्रेन क्रमांक ${separatedTrainNumber} ${train.train_name} ${train.start_station} पासून ${train.end_station} पर्यंत प्लॅटफॉर्म क्रमांक ${separatedPlatformNumber} वर येत आहे. धन्यवाद.`;
          }
          break;
        case 'Gujarati':
          switch (category) {
            case 'arrival':
          localLanguageAnnouncement = `કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર ${separatedTrainNumber} ${train.train_name} ${train.start_station} થી ${train.end_station} સુધી પ્લેટફોર્મ નંબર ${separatedPlatformNumber} પર આવી રહી છે. આભાર.`;
              break;
            case 'departure':
              localLanguageAnnouncement = `કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર ${separatedTrainNumber} ${train.train_name} ${train.start_station} થી ${train.end_station} સુધી પ્લેટફોર્મ નંબર ${separatedPlatformNumber} થી જઈ રહી છે. આભાર.`;
              break;
            case 'delay':
              localLanguageAnnouncement = `કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર ${separatedTrainNumber} ${train.train_name} ${train.start_station} થી ${train.end_station} સુધી મોડી આવી રહી છે અને પ્લેટફોર્મ નંબર ${separatedPlatformNumber} પર આવશે. અગવડ માટે માફ કરશો. આભાર.`;
              break;
            case 'platform_change':
              localLanguageAnnouncement = `કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર ${separatedTrainNumber} ${train.train_name} ${train.start_station} થી ${train.end_station} સુધી હવે પ્લેટફોર્મ નંબર ${separatedPlatformNumber} પર આવશે. કૃપા કરીને પ્લેટફોર્મ બદલાવની નોંધ લો. આભાર.`;
              break;
            case 'general':
              localLanguageAnnouncement = `કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર ${separatedTrainNumber} ${train.train_name} ${train.start_station} થી ${train.end_station} સુધી માટે મહત્વપૂર્ણ જાહેરાત પ્લેટફોર્મ નંબર ${separatedPlatformNumber} પર. આભાર.`;
              break;
            default:
              localLanguageAnnouncement = `કૃપા કરીને ધ્યાન આપો! ટ્રેન નંબર ${separatedTrainNumber} ${train.train_name} ${train.start_station} થી ${train.end_station} સુધી પ્લેટફોર્મ નંબર ${separatedPlatformNumber} પર આવી રહી છે. આભાર.`;
          }
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
  const handleCreateAnnouncement = async (train: Train, category?: string) => {
    setSelectedTrain(train);
    const selectedCategory = category || 'arrival';
    const text = await generateAnnouncementText(train, selectedCategory);
    setAnnouncementText(text);
    setIsAnnouncementDialogOpen(true);
  };

  // Set category for a specific train
  const setTrainCategory = (trainId: number, category: string) => {
    setTrainCategories(prev => ({
      ...prev,
      [trainId]: category
    }));
  };

  const setPlatformNumber = (trainId: number, platformNumber: string) => {
    // Only store the previous platform number if it's different from the new one
    setPreviousPlatformNumbers(prev => {
      const currentPlatform = platformNumbers[trainId] || '';
      if (currentPlatform !== platformNumber && currentPlatform !== '') {
        return {
          ...prev,
          [trainId]: currentPlatform
        };
      }
      return prev;
    });
    
    setPlatformNumbers(prev => ({
      ...prev,
      [trainId]: platformNumber
    }));
  };

  const setNewPlatformNumber = (trainId: number, newPlatformNumber: string) => {
    setNewPlatformNumbers(prev => ({
      ...prev,
      [trainId]: newPlatformNumber
    }));
  };

  // Cleanup audio when dialog closes
  const handleDialogClose = (open: boolean) => {
    setIsAnnouncementDialogOpen(open);
    if (!open) {
      // Stop audio and cleanup when dialog closes
      stopAudio();
      // Clean up ISL video
      setIslVideoUrl(null);
      if (currentIslFilename) {
        deleteIslVideoFile(currentIslFilename);
        setCurrentIslFilename(null);
      }
      // Clean up all ISL video files after a short delay
      setTimeout(() => {
        cleanupIslVideoFiles();
      }, 1000);
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
    // Convert train number digits to words for better pronunciation
    const trainNumberWords = trainNumber.split('').map(digit => {
      const digitToWord: { [key: string]: string } = {
        '0': 'zero',
        '1': 'one',
        '2': 'two',
        '3': 'three',
        '4': 'four',
        '5': 'five',
        '6': 'six',
        '7': 'seven',
        '8': 'eight',
        '9': 'nine'
      };
      return digitToWord[digit] || digit;
    }).join(' ');
    
    // Create regex patterns for both the original train number and the separated version
    const originalTrainNumberRegex = new RegExp(`\\b${trainNumber}\\b`, 'g');
    const separatedTrainNumberRegex = new RegExp(`\\b${trainNumber.split('').join(' ')}\\b`, 'g');
    
    // Replace both formats of the train number with word representation
    let processedText = text.replace(originalTrainNumberRegex, trainNumberWords);
    processedText = processedText.replace(separatedTrainNumberRegex, trainNumberWords);
    
    // Debug logging to see what's being processed
    console.log('ensureSeparatedTrainNumbersEnglish - Original text:', text);
    console.log('ensureSeparatedTrainNumbersEnglish - Train number:', trainNumber);
    console.log('ensureSeparatedTrainNumbersEnglish - Train number words:', trainNumberWords);
    console.log('ensureSeparatedTrainNumbersEnglish - Processed text:', processedText);
    
    return processedText;
  };

  // Function to ensure train numbers are separated with spaces and zeros are pronounced correctly (for TTS)
  const ensureSeparatedTrainNumbers = (text: string, trainNumber: string) => {
    const separatedTrainNumber = trainNumber.split('').map(digit => {
      // Replace 0 with "zero" for proper pronunciation
      return digit === '0' ? 'zero' : digit;
    }).join(' ');
    
    // Use word boundaries to ensure we only replace the train number when it appears as a standalone number
    // This prevents replacing numbers that are part of other words (like in train names)
    const trainNumberRegex = new RegExp(`\\b${trainNumber}\\b`, 'g');
    return text.replace(trainNumberRegex, separatedTrainNumber);
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
    // Use word boundaries to ensure we only replace standalone "0" digits
    // This prevents replacing "0" that might be part of other words or train names
    const processedText = text.replace(/\b0\b/g, 'zero');
    
    // Debug logging to see what's being processed
    console.log('convertZeroDigitsToZero - Original text:', text);
    console.log('convertZeroDigitsToZero - Processed text:', processedText);
    
    return processedText;
  };

  // Function to convert digits to words for better pronunciation
  const convertDigitsToWords = (text: string) => {
    const digitToWord: { [key: string]: string } = {
      '0': 'zero',
      '1': 'one',
      '2': 'two',
      '3': 'three',
      '4': 'four',
      '5': 'five',
      '6': 'six',
      '7': 'seven',
      '8': 'eight',
      '9': 'nine'
    };
    
    // Replace each digit with its word representation
    let result = text;
    Object.entries(digitToWord).forEach(([digit, word]) => {
      result = result.replace(new RegExp(digit, 'g'), word);
    });
    
    return result;
  };

  // Improved text processing functions that only affect train numbers, not train names
  const processEnglishTextForAudio = (text: string, trainNumber: string) => {
    // Only process the train number, not the entire text
    if (!trainNumber) return text;
    
    // Convert train number digits to words for better pronunciation
    const trainNumberWords = trainNumber.split('').map(digit => {
      const digitToWord: { [key: string]: string } = {
        '0': 'zero',
        '1': 'one',
        '2': 'two',
        '3': 'three',
        '4': 'four',
        '5': 'five',
        '6': 'six',
        '7': 'seven',
        '8': 'eight',
        '9': 'nine'
      };
      return digitToWord[digit] || digit;
    }).join(' ');
    
    // Create regex patterns for both the original train number and the separated version
    const originalTrainNumberRegex = new RegExp(`\\b${trainNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    const separatedTrainNumberRegex = new RegExp(`\\b${trainNumber.split('').join(' ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    
    // Replace both formats of the train number with word representation
    let processedText = text.replace(originalTrainNumberRegex, trainNumberWords);
    processedText = processedText.replace(separatedTrainNumberRegex, trainNumberWords);
    
    console.log('processEnglishTextForAudio - Original text:', text);
    console.log('processEnglishTextForAudio - Train number:', trainNumber);
    console.log('processEnglishTextForAudio - Train number words:', trainNumberWords);
    console.log('processEnglishTextForAudio - Processed text:', processedText);
    
    return processedText;
  };

  const processHindiTextForAudio = (text: string, trainNumber: string) => {
    // Only process the train number, not the entire text
    if (!trainNumber) return text;
    
    // Create a more specific regex that only matches the exact train number
    const trainNumberRegex = new RegExp(`\\b${trainNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    
    // Separate the train number digits and convert to Hindi
    const separatedTrainNumber = trainNumber.split('').map(digit => {
      if (digit === '0') return 'शून्य';
      return convertDigitsToHindi(digit);
    }).join(' ');
    
    // Replace only the train number
    const processedText = text.replace(trainNumberRegex, separatedTrainNumber);
    
    console.log('processHindiTextForAudio - Original text:', text);
    console.log('processHindiTextForAudio - Train number:', trainNumber);
    console.log('processHindiTextForAudio - Processed text:', processedText);
    
    return processedText;
  };

  const processOtherLanguageTextForAudio = (text: string, trainNumber: string) => {
    // Only process the train number, not the entire text
    if (!trainNumber) return text;
    
    // Convert train number digits to words for better pronunciation
    const trainNumberWords = trainNumber.split('').map(digit => {
      const digitToWord: { [key: string]: string } = {
        '0': 'zero',
        '1': 'one',
        '2': 'two',
        '3': 'three',
        '4': 'four',
        '5': 'five',
        '6': 'six',
        '7': 'seven',
        '8': 'eight',
        '9': 'nine'
      };
      return digitToWord[digit] || digit;
    }).join(' ');
    
    // Create regex patterns for both the original train number and the separated version
    const originalTrainNumberRegex = new RegExp(`\\b${trainNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    const separatedTrainNumberRegex = new RegExp(`\\b${trainNumber.split('').join(' ').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    
    // Replace both formats of the train number with word representation
    let processedText = text.replace(originalTrainNumberRegex, trainNumberWords);
    processedText = processedText.replace(separatedTrainNumberRegex, trainNumberWords);
    
    console.log('processOtherLanguageTextForAudio - Original text:', text);
    console.log('processOtherLanguageTextForAudio - Train number:', trainNumber);
    console.log('processOtherLanguageTextForAudio - Train number words:', trainNumberWords);
    console.log('processOtherLanguageTextForAudio - Processed text:', processedText);
    
    return processedText;
  };

  // Extract language texts from announcement
  const extractLanguageTexts = () => {
    const stationMaster = stations.find(s => s.station_code === user?.station_code);
    const state = stationMaster?.state;
    const localLanguage = state ? stateToLanguage[state] : null;

    let localText = '';
    let englishText = '';
    let hindiText = '';
    let marathiText = '';
    let gujaratiText = '';

    // Special handling for "ALL" station code
    if (user?.station_code === 'ALL') {
      // Extract Marathi text
      marathiText = announcementText.split('\n\n').find(section => 
        section.startsWith('MARATHI:')
      )?.replace('MARATHI:', '').trim() || '';

      // Extract Gujarati text
      gujaratiText = announcementText.split('\n\n').find(section => 
        section.startsWith('GUJARATI:')
      )?.replace('GUJARATI:', '').trim() || '';

      // Extract English text
      englishText = announcementText.split('\n\n').find(section => 
        section.startsWith('ENGLISH:')
      )?.replace('ENGLISH:', '').trim() || '';

      // Extract Hindi text
      hindiText = announcementText.split('\n\n').find(section => 
        section.startsWith('HINDI:')
      )?.replace('HINDI:', '').trim() || '';

      return {
        localText: '', // Not used for ALL station
        englishText,
        hindiText,
        localLanguage: null, // Not used for ALL station
        marathiText,
        gujaratiText,
        isAllStation: true
      };
    } else {
      // Extract local language text for specific stations
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
        localLanguage,
        marathiText: '',
        gujaratiText: '',
        isAllStation: false
      };
    }
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
      const { localText, englishText, hindiText, localLanguage, marathiText, gujaratiText, isAllStation } = extractLanguageTexts();
      
      // Get the current train number for separation
      const currentTrainNumber = selectedTrain?.train_number || '';

      // Prepare request payload
      const requestPayload: any = {};

      if (isAllStation) {
        // For "ALL" station - handle all four languages
        // Only process train numbers, not train names or other text
        
        // Process text with improved functions that don't affect train names
        console.log('=== PROCESSING TEXT WITH IMPROVED FUNCTIONS ===');
        
        // For English: Only process train numbers, not train names
        const processedEnglishText = processEnglishTextForAudio(englishText, currentTrainNumber);
        
        // For other languages: Only process train numbers, not train names
        const processedHindiText = processHindiTextForAudio(hindiText, currentTrainNumber);
        const processedMarathiText = processOtherLanguageTextForAudio(marathiText, currentTrainNumber);
        const processedGujaratiText = processOtherLanguageTextForAudio(gujaratiText, currentTrainNumber);

        console.log('Processing audio for ALL station with 4 languages');
        console.log('Original English text:', englishText);
        console.log('Processed English text:', processedEnglishText);
        console.log('Train number being processed:', currentTrainNumber);
        console.log('Train name from data:', selectedTrain?.train_name);
        console.log('Marathi text:', processedMarathiText);
        console.log('Gujarati text:', processedGujaratiText);
        console.log('Hindi text:', processedHindiText);

        // Prepare payload with all languages
        requestPayload.marathi_text = processedMarathiText;
        requestPayload.gujarati_text = processedGujaratiText;
        requestPayload.english_text = processedEnglishText;
        requestPayload.hindi_text = processedHindiText;
        requestPayload.is_all_station = true;
      } else {
        // For specific stations - use existing logic
        // Use the improved function that only processes train numbers, not all zeros
        const processedEnglishText = processEnglishTextForAudio(englishText, currentTrainNumber);
        const processedHindiText = processHindiTextForAudio(hindiText, currentTrainNumber);
        const processedLocalText = localText ? processOtherLanguageTextForAudio(localText, currentTrainNumber) : '';

        console.log('Processing audio for specific station');
        console.log('Processed English text:', processedEnglishText);
        console.log('Processed Hindi text:', processedHindiText);

        requestPayload.english_text = processedEnglishText;
        requestPayload.hindi_text = processedHindiText;

        // Add local language if available
        if (processedLocalText && localLanguage && localLanguage !== 'Hindi') {
          requestPayload.local_text = processedLocalText;
          requestPayload.local_language = localLanguage;
        }
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
          console.log('Audio response URL:', audioResponse.url);
          console.log('Audio response status:', audioResponse.status);
          
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

        // Create audio element with the blob URL directly
        console.log('Creating audio element with blob URL:', audioObjectUrl);
        const audio = new Audio(audioObjectUrl);
        
        console.log('Created audio element');
        console.log('Audio element ready state:', audio.readyState);
        console.log('Audio element network state:', audio.networkState);
        console.log('Audio src attribute:', audio.src);
        console.log('Audio current src:', audio.currentSrc);
        
        // Set up event listeners
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
          // Clean up object URL first
          if (audioUrl && audioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
          }
          // Delete specific audio file from server when playback ends naturally
          if (currentAudioFilename) {
            deleteAudioFile(currentAudioFilename);
            setCurrentAudioFilename(null);
          }
          // Clean up all audio files after a short delay to avoid race conditions
          setTimeout(() => {
            cleanupAudioFiles();
          }, 1000);
        };

        // Load the audio explicitly
        audio.load();
        console.log('Audio load() called');

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
      } else if (response.status === 404) {
        // File doesn't exist, which is fine - it may have been cleaned up already
        console.log(`ℹ️ Audio file not found (already deleted): ${filename}`);
      } else {
        console.warn(`Failed to delete audio file: ${filename}, status: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error deleting audio file: ${error}`);
    }
  };

  // Clean up all audio files
  const cleanupAudioFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/audio/cleanup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`🧹 Cleaned up ${result.cleaned_count} audio files`);
      } else {
        console.warn('Failed to cleanup audio files');
      }
    } catch (error) {
      console.error(`Error cleaning up audio files: ${error}`);
    }
  };

  // Stop audio playback
  const stopAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setAudioElement(null);
    }
    // Clean up object URL first
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    // Delete audio file from server
    if (currentAudioFilename) {
      deleteAudioFile(currentAudioFilename);
      setCurrentAudioFilename(null);
    }
    // Clean up all audio files after a short delay
    setTimeout(() => {
      cleanupAudioFiles();
    }, 1000);
  };

  // Generate ISL video
  const handleGenerateISL = async () => {
    if (!announcementText.trim()) {
      toast({
        title: "Error",
        description: "No announcement text to generate ISL video",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingISL(true);
    
    try {
      // Extract English text for ISL generation
      const { englishText } = extractLanguageTexts();
      
      if (!englishText.trim()) {
        toast({
          title: "Error",
          description: "No English text found for ISL generation",
          variant: "destructive",
        });
        return;
      }

      // Call backend ISL generation API
      const response = await fetch('http://localhost:8000/generate-isl-video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          english_text: englishText
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ISL video: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Set video URL for playback
        const videoUrl = `http://localhost:8000${result.video_url}`;
        setIslVideoUrl(videoUrl);
        setCurrentIslFilename(result.filename);
        
        toast({
          title: "Success",
          description: "ISL video generated successfully",
        });
      } else {
        throw new Error("Failed to generate ISL video");
      }
      
    } catch (error) {
      console.error('Error generating ISL video:', error);
      toast({
        title: "Error",
        description: "Failed to generate ISL video",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingISL(false);
    }
  };

  // Delete ISL video file
  const deleteIslVideoFile = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:8000/isl-videos/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('ISL video file deleted successfully');
      } else {
        console.error('Failed to delete ISL video file');
      }
    } catch (error) {
      console.error('Error deleting ISL video file:', error);
    }
  };

  // Cleanup ISL video files
  const cleanupIslVideoFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/isl-videos/cleanup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('ISL video files cleaned up successfully');
      } else {
        console.error('Failed to cleanup ISL video files');
      }
    } catch (error) {
      console.error('Error cleaning up ISL video files:', error);
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
          {/* Train Search and Announcement Category */}
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
                  <TableHead>Category</TableHead>
                  <TableHead>Action</TableHead>
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
                        <div className="flex flex-col gap-1">
                          <Input
                            type="text"
                            value={getPlatformNumber(train)}
                            onChange={(e) => setPlatformNumber(train.id, e.target.value)}
                            className="w-20 text-center"
                            placeholder="Platform"
                          />
                          {/* Show new platform input when Platform Change is selected */}
                          {trainCategories[train.id] === 'platform_change' && (
                            <div className="flex flex-col gap-1">
                              <div className="text-xs text-muted-foreground text-center">New:</div>
                              <Input
                                type="text"
                                value={getNewPlatformNumber(train)}
                                onChange={(e) => setNewPlatformNumber(train.id, e.target.value)}
                                className="w-20 text-center h-7 text-xs"
                                placeholder="New"
                              />
                            </div>
                          )}
                          {/* Show previous platform if different from current */}
                          {getPreviousPlatformNumber(train) && 
                           getPreviousPlatformNumber(train) !== getPlatformNumber(train) && (
                            <div className="text-xs text-muted-foreground text-center">
                              Was: {getPreviousPlatformNumber(train)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={trainCategories[train.id] || 'arrival'} 
                          onValueChange={(value) => setTrainCategory(train.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="arrival">Arrival</SelectItem>
                            <SelectItem value="departure">Departure</SelectItem>
                            <SelectItem value="delay">Delay</SelectItem>
                            <SelectItem value="platform_change">Platform Change</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                            <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateAnnouncement(train, trainCategories[train.id] || 'arrival')}
                        >
                              Create Announcement
                        </Button>
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
                    <span className="font-medium">Platform:</span> {getPlatformNumber(selectedTrain)}
                  </div>
                  {/* Show new platform when Platform Change is selected */}
                  {trainCategories[selectedTrain.id] === 'platform_change' && (
                    <div>
                      <span className="font-medium">New Platform:</span> {getNewPlatformNumber(selectedTrain) || 'Not specified'}
                    </div>
                  )}
                </div>
              </div>



              {/* Multi-Language Announcement Text */}
              <div className="space-y-4">
                
                {/* Special handling for "ALL" station code - show Marathi and Gujarati */}
                {user?.station_code === 'ALL' && (
                  <>
                    {/* Marathi Section */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-purple-600">
                        Marathi
                      </Label>
                      <Textarea
                        value={(() => {
                          const marathiText = announcementText.split('\n\n').find(section => 
                            section.startsWith('MARATHI:')
                          )?.replace('MARATHI:', '').trim() || '';
                          return marathiText;
                        })()}
                        onChange={(e) => {
                          // Update the Marathi section in the full announcement
                          const sections = announcementText.split('\n\n');
                          const updatedSections = sections.map(section => {
                            if (section.startsWith('MARATHI:')) {
                              return `MARATHI:\n${e.target.value}`;
                            }
                            return section;
                          });
                          setAnnouncementText(updatedSections.join('\n\n'));
                        }}
                        className="min-h-[80px] resize-none border-purple-200 bg-purple-50"
                        placeholder="Marathi announcement text..."
                      />
                    </div>

                    {/* Gujarati Section */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-indigo-600">
                        Gujarati
                      </Label>
                      <Textarea
                        value={(() => {
                          const gujaratiText = announcementText.split('\n\n').find(section => 
                            section.startsWith('GUJARATI:')
                          )?.replace('GUJARATI:', '').trim() || '';
                          return gujaratiText;
                        })()}
                        onChange={(e) => {
                          // Update the Gujarati section in the full announcement
                          const sections = announcementText.split('\n\n');
                          const updatedSections = sections.map(section => {
                            if (section.startsWith('GUJARATI:')) {
                              return `GUJARATI:\n${e.target.value}`;
                            }
                            return section;
                          });
                          setAnnouncementText(updatedSections.join('\n\n'));
                        }}
                        className="min-h-[80px] resize-none border-indigo-200 bg-indigo-50"
                        placeholder="Gujarati announcement text..."
                      />
                    </div>
                  </>
                )}

                {/* Local Language Section for non-ALL stations */}
                {user?.station_code !== 'ALL' && (() => {
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
                  {islVideoUrl ? (
                    <div className="bg-black rounded-lg aspect-video overflow-hidden">
                      <video
                        src={islVideoUrl}
                        controls
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.error('Error loading ISL video:', e);
                          toast({
                            title: "Error",
                            description: "Failed to load ISL video",
                            variant: "destructive",
                          });
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-4xl mb-2">👋</div>
                        <p className="text-sm">ISL Video will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Right Panel Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleGenerateISL}
                    disabled={isGeneratingISL || !announcementText.trim()}
                  >
                    {isGeneratingISL ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Video className="mr-2 h-4 w-4" />
                    )}
                    {isGeneratingISL ? "Generating..." : "Generate ISL"}
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
