'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Play, Volume2, FileAudio, Clock, User } from 'lucide-react';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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

interface AudioFile {
    id: number;
    title: string;
    description: string | null;
    filename: string;
    file_path: string;
    file_size: number | null;
    duration: number | null;
    language: string;
    text_content: string;
    created_by: number;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
    creator: {
        id: number;
        username: string;
        email: string;
    } | null;
}

export default function AudioFilesPage() {
    const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentAudioFile, setCurrentAudioFile] = useState<AudioFile | null>(null);
    const [loading, setLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [playingAudio, setPlayingAudio] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        language: 'English',
        text_content: '',
    });
    const { toast } = useToast();
    const { token } = useAuth();

    // Fetch audio files from API
    const fetchAudioFiles = async () => {
        try {
            const response = await fetch('http://localhost:8000/audio-files', {
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
                    description: "Failed to fetch audio files",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch audio files",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        fetchAudioFiles();
    }, [token]);

    const handleEdit = (audioFile: AudioFile) => {
        setCurrentAudioFile(audioFile);
        setFormData({
            title: audioFile.title,
            description: audioFile.description || '',
            language: audioFile.language,
            text_content: audioFile.text_content,
        });
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setCurrentAudioFile(null);
        setFormData({
            title: '',
            description: '',
            language: 'English',
            text_content: '',
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (audioId: number) => {
        try {
            const response = await fetch(`http://localhost:8000/audio-files/${audioId}`, {
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
                    description: result.message || "Audio file deleted successfully",
                });
                fetchAudioFiles();
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.detail || "Failed to delete audio file",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete audio file",
                variant: "destructive",
            });
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.title.trim() || !formData.text_content.trim()) {
            toast({
                title: "Validation Error",
                description: "Title and text content are required",
                variant: "destructive",
            });
            return;
        }

        setIsGenerating(true);

        try {
            const response = await fetch('http://localhost:8000/audio-files', {
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
                    description: "Audio file created successfully",
                });
                setIsDialogOpen(false);
                fetchAudioFiles();
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.detail || "Failed to create audio file",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create audio file",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePlayAudio = async (audioId: number) => {
        if (playingAudio === audioId) {
            setPlayingAudio(null);
            return;
        }

        setPlayingAudio(audioId);
        
        try {
            const response = await fetch(`http://localhost:8000/audio-files/${audioId}/play`, {
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

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                        Audio File Management
                    </h1>
                    <p className="text-muted-foreground">
                        Create, manage, and organize audio files generated from text.
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
                                Create New Audio File
                            </DialogTitle>
                            <DialogDescription>
                                Enter text content and settings to generate an audio file.
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
                                    <Label htmlFor="language">Language *</Label>
                                    <Select
                                        value={formData.language}
                                        onValueChange={(value) => setFormData({ ...formData, language: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="English">English</SelectItem>
                                            <SelectItem value="Hindi">Hindi</SelectItem>
                                            <SelectItem value="Marathi">Marathi</SelectItem>
                                            <SelectItem value="Gujarati">Gujarati</SelectItem>
                                            <SelectItem value="Tamil">Tamil</SelectItem>
                                            <SelectItem value="Telugu">Telugu</SelectItem>
                                            <SelectItem value="Kannada">Kannada</SelectItem>
                                            <SelectItem value="Malayalam">Malayalam</SelectItem>
                                            <SelectItem value="Bengali">Bengali</SelectItem>
                                            <SelectItem value="Punjabi">Punjabi</SelectItem>
                                            <SelectItem value="Odia">Odia</SelectItem>
                                            <SelectItem value="Assamese">Assamese</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="text_content">Text Content *</Label>
                                    <Textarea
                                        id="text_content"
                                        value={formData.text_content}
                                        onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                                        placeholder="Enter text to convert to audio"
                                        rows={4}
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isGenerating}>
                                    {isGenerating ? (
                                        <>
                                            <Volume2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Volume2 className="mr-2 h-4 w-4" />
                                            Generate Audio
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
                        <FileAudio className="h-5 w-5" />
                        Audio Files
                    </CardTitle>
                    <CardDescription>
                        A list of all generated audio files with their details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {audioFiles.length === 0 ? (
                        <div className="text-center py-8">
                            <FileAudio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Audio Files</h3>
                            <p className="text-muted-foreground">
                                Create your first audio file to get started.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Language</TableHead>
                                    <TableHead>File Size</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Created By</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>
                                        <span className="sr-only">Actions</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {audioFiles.map((audioFile) => (
                                    <TableRow key={audioFile.id}>
                                        <TableCell className="font-medium">
                                            <div>
                                                <p className="font-medium">{audioFile.title}</p>
                                                {audioFile.description && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {audioFile.description}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {audioFile.language}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {formatFileSize(audioFile.file_size)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {formatDuration(audioFile.duration)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    {audioFile.creator?.username || 'Unknown'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(audioFile.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handlePlayAudio(audioFile.id)}
                                                >
                                                    {playingAudio === audioFile.id ? (
                                                        <Volume2 className="h-4 w-4 text-red-500" />
                                                    ) : (
                                                        <Play className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleEdit(audioFile)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
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
                                                                This action cannot be undone. This will permanently delete the audio file "{audioFile.title}".
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
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 