'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Play, Volume2, Languages, Clock, User, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

interface MultiLanguageAudioVersion {
    id: number;
    parent_audio_id: number;
    language_code: string;
    language_name: string;
    translated_text: string;
    filename: string;
    file_path: string;
    file_size: number | null;
    duration: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
}

interface MultiLanguageAudioFile {
    id: number;
    title: string;
    description: string | null;
    original_text: string;
    created_by: number;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
    creator: {
        id: number;
        username: string;
        email: string;
    } | null;
    language_versions: MultiLanguageAudioVersion[];
}

export default function MultiLanguageAudioPage() {
    const [audioFiles, setAudioFiles] = useState<MultiLanguageAudioFile[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [playingAudio, setPlayingAudio] = useState<{audioId: number, languageCode: string} | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        original_text: '',
    });
    const { toast } = useToast();
    const { token } = useAuth();

    // Fetch multi-language audio files from API
    const fetchAudioFiles = async () => {
        try {
            const response = await fetch('http://localhost:8000/multi-language-audio', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setAudioFiles(data);
            } else {
                toast({
                    title: "Error",
                    description: "Failed to fetch multi-language audio files",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch multi-language audio files",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        fetchAudioFiles();
    }, [token]);

    const handleAddNew = () => {
        setFormData({
            title: '',
            description: '',
            original_text: '',
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (audioId: number) => {
        try {
            const response = await fetch(`http://localhost:8000/multi-language-audio/${audioId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                toast({
                    title: "Success",
                    description: result.message || "Multi-language audio file deleted successfully",
                });
                fetchAudioFiles();
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.detail || "Failed to delete multi-language audio file",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete multi-language audio file",
                variant: "destructive",
            });
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title.trim() || !formData.original_text.trim()) {
            toast({
                title: "Validation Error",
                description: "Title and text content are required",
                variant: "destructive",
            });
            return;
        }

        setIsGenerating(true);

        try {
            const response = await fetch('http://localhost:8000/multi-language-audio', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Multi-language audio files created successfully",
                });
                setIsDialogOpen(false);
                fetchAudioFiles();
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.detail || "Failed to create multi-language audio files",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create multi-language audio files",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePlayAudio = async (audioId: number, languageCode: string) => {
        const currentPlaying = `${audioId}-${languageCode}`;
        if (playingAudio && playingAudio.audioId === audioId && playingAudio.languageCode === languageCode) {
            setPlayingAudio(null);
            return;
        }

        setPlayingAudio({ audioId, languageCode });
        
        try {
            const response = await fetch(`http://localhost:8000/multi-language-audio/${audioId}/play/${languageCode}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                
                audio.onended = () => {
                    setPlayingAudio(null);
                    URL.revokeObjectURL(audioUrl);
                };
                
                audio.onerror = () => {
                    setPlayingAudio(null);
                    URL.revokeObjectURL(audioUrl);
                    toast({
                        title: "Error",
                        description: "Failed to play audio",
                        variant: "destructive",
                    });
                };
                
                await audio.play();
            } else {
                setPlayingAudio(null);
                toast({
                    title: "Error",
                    description: "Failed to play audio",
                    variant: "destructive",
                });
            }
        } catch (error) {
            setPlayingAudio(null);
            toast({
                title: "Error",
                description: "Failed to play audio",
                variant: "destructive",
            });
        }
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return 'Unknown';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return 'Unknown';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getLanguageFlag = (languageCode: string) => {
        const flags: { [key: string]: string } = {
            'en': '🇺🇸',
            'hi': '🇮🇳',
            'mr': '🇮🇳',
            'gu': '🇮🇳'
        };
        return flags[languageCode] || '🌐';
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                        Audio Management
                    </h1>
                    <p className="text-muted-foreground">
                        Create audio files in multiple languages from English text input.
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleAddNew}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Audio File
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-headline">
                                Create Multi-Language Audio Files
                            </DialogTitle>
                            <DialogDescription>
                                Enter English text to automatically generate audio in English, Hindi, Marathi, and Gujarati.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSave}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Enter audio file title"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Enter description (optional)"
                                        rows={2}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="original_text">English Text *</Label>
                                    <Textarea
                                        id="original_text"
                                        value={formData.original_text}
                                        onChange={(e) => setFormData({ ...formData, original_text: e.target.value })}
                                        placeholder="Enter English text to translate and convert to audio"
                                        rows={4}
                                        required
                                    />
                                </div>
                                <div className="bg-muted p-3 rounded-md">
                                    <p className="text-sm text-muted-foreground">
                                        <Globe className="inline mr-2 h-4 w-4" />
                                        This will automatically create audio files in:
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant="outline">English</Badge>
                                        <Badge variant="outline">Hindi</Badge>
                                        <Badge variant="outline">Marathi</Badge>
                                        <Badge variant="outline">Gujarati</Badge>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isGenerating}>
                                    {isGenerating ? (
                                        <>
                                            <Languages className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Languages className="mr-2 h-4 w-4" />
                                            Generate Multi-Language Audio
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                    <Languages className="h-5 w-5" />
                    Audio Files
                </CardTitle>
                    <CardDescription>
                        A list of all multi-language audio files with their translations and audio versions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {audioFiles.length === 0 ? (
                        <div className="text-center py-8">
                            <Languages className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Multi-Language Audio Files</h3>
                            <p className="text-muted-foreground">
                                Create your first multi-language audio file to get started.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {audioFiles.map((audioFile) => (
                                <Card key={audioFile.id} className="border">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg">{audioFile.title}</CardTitle>
                                                {audioFile.description && (
                                                    <CardDescription>{audioFile.description}</CardDescription>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground">
                                                        {audioFile.creator?.username || 'Unknown'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground">
                                                        {new Date(audioFile.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button size="sm" variant="ghost">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the multi-language audio file "{audioFile.title}" and all its language versions.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(audioFile.id)}
                                                                className="bg-destructive hover:bg-destructive/90"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="mb-4">
                                            <h4 className="font-medium mb-2">Original English Text:</h4>
                                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                                {audioFile.original_text}
                                            </p>
                                        </div>
                                        
                                        <Accordion type="single" collapsible>
                                            <AccordionItem value="translations">
                                                <AccordionTrigger>
                                                    <span className="flex items-center gap-2">
                                                        <Globe className="h-4 w-4" />
                                                        Language Versions ({audioFile.language_versions.length})
                                                    </span>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="grid gap-4">
                                                        {audioFile.language_versions.map((version) => (
                                                            <div key={version.id} className="border rounded-lg p-4">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-lg">
                                                                            {getLanguageFlag(version.language_code)}
                                                                        </span>
                                                                        <Badge variant="outline">
                                                                            {version.language_name}
                                                                        </Badge>
                                                                        <span className="text-sm text-muted-foreground">
                                                                            ({version.language_code})
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm text-muted-foreground">
                                                                            {formatFileSize(version.file_size)}
                                                                        </span>
                                                                        <span className="text-sm text-muted-foreground">
                                                                            {formatDuration(version.duration)}
                                                                        </span>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handlePlayAudio(audioFile.id, version.language_code)}
                                                                        >
                                                                            {playingAudio && playingAudio.audioId === audioFile.id && playingAudio.languageCode === version.language_code ? (
                                                                                <Volume2 className="h-4 w-4 text-red-500" />
                                                                            ) : (
                                                                                <Play className="h-4 w-4" />
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h5 className="font-medium mb-2">Translated Text:</h5>
                                                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                                                        {version.translated_text}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 