'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Play, Volume2, Megaphone, Clock, User, FileAudio, Settings, Zap } from 'lucide-react';
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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';

interface TemplatePlaceholder {
    id: number;
    template_id: number;
    placeholder_name: string;
    placeholder_type: string;
    is_required: boolean;
    default_value: string | null;
    description: string | null;
}

interface AnnouncementTemplate {
    id: number;
    title: string;
    category: string;
    template_text: string;
    audio_file_path: string | null;
    filename: string | null;
    file_size: number | null;
    duration: number | null;
    created_by: number;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
    creator: {
        id: number;
        username: string;
        email: string;
    } | null;
    placeholders: TemplatePlaceholder[];
}

interface GeneratedAnnouncement {
    id: number;
    template_id: number;
    title: string;
    final_text: string;
    audio_file_path: string | null;
    filename: string | null;
    file_size: number | null;
    duration: number | null;
    placeholder_values: string;
    created_by: number;
    station_code: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string | null;
    creator: {
        id: number;
        username: string;
        email: string;
    } | null;
    template: AnnouncementTemplate | null;
}

export default function TemplateAnnouncementsPage() {
    const [templates, setTemplates] = useState<AnnouncementTemplate[]>([]);
    const [generatedAnnouncements, setGeneratedAnnouncements] = useState<GeneratedAnnouncement[]>([]);
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
    const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<AnnouncementTemplate | null>(null);
    const [selectedTemplateForGeneration, setSelectedTemplateForGeneration] = useState<AnnouncementTemplate | null>(null);
    const [loading, setLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [playingAudio, setPlayingAudio] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState('templates');
    
    const [templateFormData, setTemplateFormData] = useState({
        title: '',
        category: 'arrival',
        template_text: '',
        placeholders: [] as Array<{
            placeholder_name: string;
            placeholder_type: string;
            is_required: boolean;
            default_value: string;
            description: string;
        }>
    });

    const [generationFormData, setGenerationFormData] = useState<Record<string, string>>({});
    
    const { toast } = useToast();
    const { token } = useAuth();

    // Fetch templates from API
    const fetchTemplates = async () => {
        try {
            const response = await fetch('http://localhost:8000/announcement-templates', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            } else {
                toast({
                    title: "Error",
                    description: "Failed to fetch announcement templates",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch announcement templates",
                variant: "destructive",
            });
        }
    };

    // Fetch generated announcements from API
    const fetchGeneratedAnnouncements = async () => {
        try {
            const response = await fetch('http://localhost:8000/generated-announcements', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setGeneratedAnnouncements(data);
            } else {
                toast({
                    title: "Error",
                    description: "Failed to fetch generated announcements",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch generated announcements",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        fetchTemplates();
        fetchGeneratedAnnouncements();
    }, [token]);

    const handleAddTemplate = () => {
        setCurrentTemplate(null);
        setTemplateFormData({
            title: '',
            category: 'arrival',
            template_text: '',
            placeholders: []
        });
        setIsTemplateDialogOpen(true);
    };

    const handleEditTemplate = (template: AnnouncementTemplate) => {
        setCurrentTemplate(template);
        setTemplateFormData({
            title: template.title,
            category: template.category,
            template_text: template.template_text,
            placeholders: template.placeholders.map(p => ({
                placeholder_name: p.placeholder_name,
                placeholder_type: p.placeholder_type,
                is_required: p.is_required,
                default_value: p.default_value || '',
                description: p.description || ''
            }))
        });
        setIsTemplateDialogOpen(true);
    };

    const handleDeleteTemplate = async (templateId: number) => {
        try {
            const response = await fetch(`http://localhost:8000/announcement-templates/${templateId}`, {
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
                    description: result.message || "Template deleted successfully",
                });
                fetchTemplates();
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.detail || "Failed to delete template",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete template",
                variant: "destructive",
            });
        }
    };

    const handleSaveTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!templateFormData.title.trim() || !templateFormData.template_text.trim()) {
            toast({
                title: "Validation Error",
                description: "Title and template text are required",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/announcement-templates', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(templateFormData),
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: currentTemplate ? "Template updated successfully" : "Template created successfully",
                });
                setIsTemplateDialogOpen(false);
                fetchTemplates();
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.detail || "Failed to save template",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save template",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateAnnouncement = (template: AnnouncementTemplate) => {
        setSelectedTemplateForGeneration(template);
        const initialValues: Record<string, string> = {};
        template.placeholders.forEach(p => {
            initialValues[p.placeholder_name] = p.default_value || '';
        });
        setGenerationFormData(initialValues);
        setIsGenerateDialogOpen(true);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedTemplateForGeneration) return;

        // Validate required placeholders
        const requiredPlaceholders = selectedTemplateForGeneration.placeholders.filter(p => p.is_required);
        for (const placeholder of requiredPlaceholders) {
            if (!generationFormData[placeholder.placeholder_name]?.trim()) {
                toast({
                    title: "Validation Error",
                    description: `${placeholder.placeholder_name} is required`,
                    variant: "destructive",
                });
                return;
            }
        }

        setIsGenerating(true);

        try {
            const response = await fetch('http://localhost:8000/announcements/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    template_id: selectedTemplateForGeneration.id,
                    placeholder_values: generationFormData,
                    title: `Generated from ${selectedTemplateForGeneration.title}`
                }),
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Announcement generated successfully",
                });
                setIsGenerateDialogOpen(false);
                fetchGeneratedAnnouncements();
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.detail || "Failed to generate announcement",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to generate announcement",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePlayAudio = async (templateId: number) => {
        if (playingAudio === templateId) {
            setPlayingAudio(null);
            return;
        }

        setPlayingAudio(templateId);
        
        try {
            const response = await fetch(`http://localhost:8000/announcement-templates/${templateId}/play`, {
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

    const addPlaceholder = () => {
        setTemplateFormData(prev => ({
            ...prev,
            placeholders: [...prev.placeholders, {
                placeholder_name: '',
                placeholder_type: 'text',
                is_required: true,
                default_value: '',
                description: ''
            }]
        }));
    };

    const removePlaceholder = (index: number) => {
        setTemplateFormData(prev => ({
            ...prev,
            placeholders: prev.placeholders.filter((_, i) => i !== index)
        }));
    };

    const updatePlaceholder = (index: number, field: string, value: any) => {
        setTemplateFormData(prev => ({
            ...prev,
            placeholders: prev.placeholders.map((p, i) => 
                i === index ? { ...p, [field]: value } : p
            )
        }));
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'arrival': 'bg-green-100 text-green-800',
            'departure': 'bg-blue-100 text-blue-800',
            'delay': 'bg-yellow-100 text-yellow-800',
            'platform_change': 'bg-orange-100 text-orange-800',
            'general': 'bg-gray-100 text-gray-800'
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
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
                        Template Announcements
                    </h1>
                    <p className="text-muted-foreground">
                        Create and manage announcement templates with dynamic placeholders.
                    </p>
                </div>
                <Button onClick={handleAddTemplate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="generated">Generated Announcements</TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Megaphone className="h-5 w-5" />
                                Announcement Templates
                            </CardTitle>
                            <CardDescription>
                                Pre-recorded announcement templates with placeholders for dynamic content.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {templates.length === 0 ? (
                                <div className="text-center py-8">
                                    <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
                                    <p className="text-muted-foreground">
                                        Create your first announcement template to get started.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {templates.map((template) => (
                                        <Card key={template.id} className="border">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <CardTitle className="text-lg">{template.title}</CardTitle>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge className={getCategoryColor(template.category)}>
                                                                {template.category.replace('_', ' ').toUpperCase()}
                                                            </Badge>
                                                            {template.audio_file_path && (
                                                                <Badge variant="outline" className="flex items-center gap-1">
                                                                    <FileAudio className="h-3 w-3" />
                                                                    Audio Available
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm text-muted-foreground">
                                                                {template.creator?.username || 'Unknown'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm text-muted-foreground">
                                                                {new Date(template.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleGenerateAnnouncement(template)}
                                                        >
                                                            <Zap className="mr-2 h-4 w-4" />
                                                            Generate
                                                        </Button>
                                                        {template.audio_file_path && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handlePlayAudio(template.id)}
                                                            >
                                                                {playingAudio === template.id ? (
                                                                    <Volume2 className="h-4 w-4 text-red-500" />
                                                                ) : (
                                                                    <Play className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleEditTemplate(template)}
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
                                                                        This action cannot be undone. This will permanently delete the template "{template.title}".
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDeleteTemplate(template.id)}
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
                                                    <h4 className="font-medium mb-2">Template Text:</h4>
                                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                                        {template.template_text}
                                                    </p>
                                                </div>
                                                
                                                {template.placeholders.length > 0 && (
                                                    <Accordion type="single" collapsible>
                                                        <AccordionItem value="placeholders">
                                                            <AccordionTrigger>
                                                                <span className="flex items-center gap-2">
                                                                    <Settings className="h-4 w-4" />
                                                                    Placeholders ({template.placeholders.length})
                                                                </span>
                                                            </AccordionTrigger>
                                                            <AccordionContent>
                                                                <div className="grid gap-2">
                                                                    {template.placeholders.map((placeholder) => (
                                                                        <div key={placeholder.id} className="flex items-center gap-2 p-2 border rounded">
                                                                            <Badge variant="outline">
                                                                                {placeholder.placeholder_name}
                                                                            </Badge>
                                                                            <span className="text-sm text-muted-foreground">
                                                                                ({placeholder.placeholder_type})
                                                                            </span>
                                                                            {placeholder.is_required && (
                                                                                <Badge variant="destructive" className="text-xs">
                                                                                    Required
                                                                                </Badge>
                                                                            )}
                                                                            {placeholder.description && (
                                                                                <span className="text-sm text-muted-foreground">
                                                                                    - {placeholder.description}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    </Accordion>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="generated" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                Generated Announcements
                            </CardTitle>
                            <CardDescription>
                                Announcements generated from templates with filled placeholders.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {generatedAnnouncements.length === 0 ? (
                                <div className="text-center py-8">
                                    <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Generated Announcements</h3>
                                    <p className="text-muted-foreground">
                                        Generate announcements from templates to see them here.
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Template</TableHead>
                                            <TableHead>Final Text</TableHead>
                                            <TableHead>Station</TableHead>
                                            <TableHead>Created By</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {generatedAnnouncements.map((announcement) => (
                                            <TableRow key={announcement.id}>
                                                <TableCell className="font-medium">{announcement.title}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {announcement.template?.title || 'Unknown'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs truncate" title={announcement.final_text}>
                                                        {announcement.final_text}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {announcement.station_code || 'N/A'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {announcement.creator?.username || 'Unknown'}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(announcement.created_at).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Template Creation/Edit Dialog */}
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline">
                            {currentTemplate ? 'Edit Template' : 'Create New Template'}
                        </DialogTitle>
                        <DialogDescription>
                            Create an announcement template with placeholders for dynamic content.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveTemplate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={templateFormData.title}
                                        onChange={(e) => setTemplateFormData({ ...templateFormData, title: e.target.value })}
                                        placeholder="Enter template title"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Select
                                        value={templateFormData.category}
                                        onValueChange={(value) => setTemplateFormData({ ...templateFormData, category: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="arrival">Arrival</SelectItem>
                                            <SelectItem value="departure">Departure</SelectItem>
                                            <SelectItem value="delay">Delay</SelectItem>
                                            <SelectItem value="platform_change">Platform Change</SelectItem>
                                            <SelectItem value="general">General</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="template_text">Template Text *</Label>
                                <Textarea
                                    id="template_text"
                                    value={templateFormData.template_text}
                                    onChange={(e) => setTemplateFormData({ ...templateFormData, template_text: e.target.value })}
                                    placeholder="Enter template text with placeholders like {train_number}, {platform_number}, etc."
                                    rows={4}
                                    required
                                />
                                <p className="text-sm text-muted-foreground">
                                    Use placeholders in curly braces like {'{train_number}'}, {'{platform_number}'}, {'{station_name}'}, etc.
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Placeholders</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addPlaceholder}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Placeholder
                                    </Button>
                                </div>
                                {templateFormData.placeholders.map((placeholder, index) => (
                                    <div key={index} className="grid grid-cols-6 gap-2 p-3 border rounded">
                                        <Input
                                            placeholder="Name"
                                            value={placeholder.placeholder_name}
                                            onChange={(e) => updatePlaceholder(index, 'placeholder_name', e.target.value)}
                                        />
                                        <Select
                                            value={placeholder.placeholder_type}
                                            onValueChange={(value) => updatePlaceholder(index, 'placeholder_type', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Text</SelectItem>
                                                <SelectItem value="number">Number</SelectItem>
                                                <SelectItem value="time">Time</SelectItem>
                                                <SelectItem value="station">Station</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            placeholder="Default Value"
                                            value={placeholder.default_value}
                                            onChange={(e) => updatePlaceholder(index, 'default_value', e.target.value)}
                                        />
                                        <Input
                                            placeholder="Description"
                                            value={placeholder.description}
                                            onChange={(e) => updatePlaceholder(index, 'description', e.target.value)}
                                        />
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`required-${index}`}
                                                checked={placeholder.is_required}
                                                onChange={(e) => updatePlaceholder(index, 'is_required', e.target.checked)}
                                            />
                                            <Label htmlFor={`required-${index}`} className="text-sm">Required</Label>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removePlaceholder(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Saving..." : (currentTemplate ? "Update Template" : "Create Template")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Generate Announcement Dialog */}
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-headline">
                            Generate Announcement
                        </DialogTitle>
                        <DialogDescription>
                            Fill in the placeholder values to generate an announcement.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTemplateForGeneration && (
                        <form onSubmit={handleGenerate}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Template: {selectedTemplateForGeneration.title}</Label>
                                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                        {selectedTemplateForGeneration.template_text}
                                    </p>
                                </div>
                                
                                {selectedTemplateForGeneration.placeholders.map((placeholder) => (
                                    <div key={placeholder.id} className="space-y-2">
                                        <Label htmlFor={placeholder.placeholder_name}>
                                            {placeholder.placeholder_name}
                                            {placeholder.is_required && <span className="text-red-500"> *</span>}
                                        </Label>
                                        <Input
                                            id={placeholder.placeholder_name}
                                            value={generationFormData[placeholder.placeholder_name] || ''}
                                            onChange={(e) => setGenerationFormData({
                                                ...generationFormData,
                                                [placeholder.placeholder_name]: e.target.value
                                            })}
                                            placeholder={placeholder.description || `Enter ${placeholder.placeholder_name}`}
                                            required={placeholder.is_required}
                                        />
                                    </div>
                                ))}
                                
                                <div className="space-y-2">
                                    <Label>Preview:</Label>
                                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                        {(() => {
                                            let preview = selectedTemplateForGeneration.template_text;
                                            Object.entries(generationFormData).forEach(([key, value]) => {
                                                preview = preview.replace(new RegExp(`{${key}}`, 'g'), value || `{${key}}`);
                                            });
                                            return preview;
                                        })()}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isGenerating}>
                                    {isGenerating ? "Generating..." : "Generate Announcement"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
} 