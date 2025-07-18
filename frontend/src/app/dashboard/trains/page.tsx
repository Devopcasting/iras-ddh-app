'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, Train, Upload, Download } from 'lucide-react';
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';

interface Station {
    id: number;
    station_name: string;
    station_code: string;
    platform_number: string;
    sequence_order: number;
}

interface Train {
    id: number;
    train_number: string;
    train_name: string;
    start_station: string;
    end_station: string;
    created_at: string;
    updated_at: string | null;
    stations: Station[];
}

// Example Excel structure for import (row-per-station):
// | Train Number | Train Name         | Starting from   | End Point    | Stations | Station Code | Station Name     | Platform Number |
// |--------------|--------------------|-----------------|-------------|----------|--------------|------------------|-----------------|
// | 20901 VANDE BHARAT EXP | VANDE BHARAT EXP | MUMBAI CENTRAL | GANDHINAGAR | 1 | MMCT | MUMBAI CENTRAL | 5 |
// | 20901 VANDE BHARAT EXP | VANDE BHARAT EXP | MUMBAI CENTRAL | GANDHINAGAR | 2 | BVI  | BORIVALI       | 2 |
// | 20901 VANDE BHARAT EXP | VANDE BHARAT EXP | MUMBAI CENTRAL | GANDHINAGAR | 3 | VAPI | VAPI           | 1 |
// ...

export default function TrainsPage() {
    const [trains, setTrains] = useState<Train[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();
    const [importLoading, setImportLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editTrain, setEditTrain] = useState<Train | null>(null);

    // Check if user is admin
    if (user?.role !== 'admin') {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
                        <CardDescription className="text-center">
                            Only administrators can access train management.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    useEffect(() => {
        fetchTrains();
    }, []);

    const fetchTrains = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/trains', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTrains(data);
            } else {
                toast({
                    title: "Error",
                    description: "Failed to fetch trains",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch trains",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const deleteTrain = async (trainId: number) => {
        if (!confirm('Are you sure you want to delete this train?')) {
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:8000/trains/${trainId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Train deleted successfully",
                });
                fetchTrains();
            } else {
                toast({
                    title: "Error",
                    description: "Failed to delete train",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete train",
                variant: "destructive",
            });
        }
    };

    // Excel Import Functions
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                if (jsonData.length === 0) {
                    toast({
                        title: "Error",
                        description: "Excel file is empty or has no data",
                        variant: "destructive",
                    });
                    return;
                }
                const processedTrains = processExcelData(jsonData);
                if (processedTrains.length > 0) {
                    importTrains(processedTrains);
                }
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to read Excel file. Please check the file format.",
                    variant: "destructive",
                });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const processExcelData = (data: any[]): Array<any> => {
        // Group rows by train number
        const trainMap: Record<string, any> = {};
        const errors: string[] = [];
        data.forEach((row, index) => {
            const trainNumber = row['Train Number'] || row['train_number'] || row['TrainNumber'] || row['TRAIN_NUMBER'];
            const trainName = row['Train Name'] || row['train_name'] || row['TrainName'] || row['TRAIN_NAME'];
            const startStation = row['Starting from'] || row['Start Station'] || row['start_station'] || row['STARTING FROM'];
            const endStation = row['End Point'] || row['End Station'] || row['end_station'] || row['END POINT'];
            const stationSeq = row['Stations'] || row['stations'] || row['STATIONS'] || row['Sequence'] || row['SEQUENCE'];
            const stationCode = row['Station Code'] || row['station_code'] || row['STATION CODE'];
            const stationName = row['Station Name'] || row['station_name'] || row['STATION NAME'];
            const platformNumber = row['Platform Number'] || row['platform_number'] || row['PLATFORM NUMBER'];
            if (!trainNumber || !trainName || !startStation || !endStation || !stationSeq || !stationCode) {
                errors.push(`Row ${index + 2}: Missing required fields`);
                return;
            }
            const trainKey = String(trainNumber).trim();
            if (!trainMap[trainKey]) {
                trainMap[trainKey] = {
                    train_number: trainKey,
                    train_name: String(trainName).trim(),
                    start_station: String(startStation).trim().toUpperCase(),
                    end_station: String(endStation).trim().toUpperCase(),
                    stations: [],
                };
            }
            trainMap[trainKey].stations.push({
                station_name: stationName ? String(stationName).trim() : '',
                station_code: String(stationCode).trim().toUpperCase(),
                platform_number: platformNumber ? String(platformNumber).trim() : '',
                sequence_order: Number(stationSeq),
            });
        });
        if (errors.length > 0) {
            toast({
                title: "Validation Errors",
                description: `Found ${errors.length} errors in Excel file. Please fix and try again.`,
                variant: "destructive",
            });
            console.error('Excel validation errors:', errors);
            return [];
        }
        return Object.values(trainMap);
    };

    const importTrains = async (trainsData: Array<any>) => {
        setImportLoading(true);
        let successCount = 0;
        let errorCount = 0;
        const token = localStorage.getItem('accessToken');
        for (const trainData of trainsData) {
            try {
                const response = await fetch('http://localhost:8000/trains', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(trainData),
                });
                if (response.ok) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                errorCount++;
            }
        }
        setImportLoading(false);
        if (successCount > 0) {
            toast({
                title: "Import Successful",
                description: `Successfully imported ${successCount} trains${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
            });
            fetchTrains();
        } else {
            toast({
                title: "Import Failed",
                description: "No trains were imported. Please check your data.",
                variant: "destructive",
            });
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const downloadTemplate = () => {
        const templateData = [
            { 'Train Number': '20901 VANDE BHARAT EXP', 'Train Name': 'VANDE BHARAT EXP', 'Starting from': 'MUMBAI CENTRAL', 'End Point': 'GANDHINAGAR', 'Stations': 1, 'Station Code': 'MMCT', 'Station Name': 'MUMBAI CENTRAL', 'Platform Number': 5 },
            { 'Train Number': '20901 VANDE BHARAT EXP', 'Train Name': 'VANDE BHARAT EXP', 'Starting from': 'MUMBAI CENTRAL', 'End Point': 'GANDHINAGAR', 'Stations': 2, 'Station Code': 'BVI', 'Station Name': 'BORIVALI', 'Platform Number': 2 },
            { 'Train Number': '20901 VANDE BHARAT EXP', 'Train Name': 'VANDE BHARAT EXP', 'Starting from': 'MUMBAI CENTRAL', 'End Point': 'GANDHINAGAR', 'Stations': 3, 'Station Code': 'VAPI', 'Station Name': 'VAPI', 'Platform Number': 1 },
            { 'Train Number': '20901 VANDE BHARAT EXP', 'Train Name': 'VANDE BHARAT EXP', 'Starting from': 'MUMBAI CENTRAL', 'End Point': 'GANDHINAGAR', 'Stations': 4, 'Station Code': 'ST', 'Station Name': 'SURAT', 'Platform Number': 1 },
        ];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Trains');
        worksheet['!cols'] = [ { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 15 } ];
        XLSX.writeFile(workbook, 'train_import_template.xlsx');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading trains...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                        Train Timetable Management
                    </h1>
                    <p className="text-muted-foreground">
                        Manage train schedules and station information.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={downloadTemplate}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Template
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importLoading}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        {importLoading ? "Importing..." : "Import Excel"}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Train
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add New Train</DialogTitle>
                                <DialogDescription>
                                    Enter train details and add all stations along the route.
                                </DialogDescription>
                            </DialogHeader>
                            <AddTrainForm onSuccess={fetchTrains} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Trains</CardTitle>
                    <CardDescription>
                        View and manage all train timetables in the system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {trains.length === 0 ? (
                        <div className="text-center py-8">
                            <Train className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No trains found</h3>
                            <p className="text-muted-foreground">
                                Add your first train to get started.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Train Number</TableHead>
                                    <TableHead>Train Name</TableHead>
                                    <TableHead>Route</TableHead>
                                    <TableHead>Stations</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trains.map((train) => (
                                    <TableRow key={train.id}>
                                        <TableCell>
                                            <div className="font-medium">{train.train_number}</div>
                                        </TableCell>
                                        <TableCell>{train.train_name}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div>{train.start_station}</div>
                                                <div className="text-muted-foreground">to</div>
                                                <div>{train.end_station}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {train.stations.length} stations
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(train.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setEditTrain(train);
                                                                setEditDialogOpen(true);
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>Edit Train</DialogTitle>
                                                            <DialogDescription>
                                                                Update train details and stations.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        {editTrain && (
                                                            <EditTrainForm
                                                                train={editTrain}
                                                                onSuccess={() => {
                                                                    setEditDialogOpen(false);
                                                                    setEditTrain(null);
                                                                    fetchTrains();
                                                                }}
                                                            />
                                                        )}
                                                    </DialogContent>
                                                </Dialog>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteTrain(train.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
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

// Add Train Form Component
function AddTrainForm({ onSuccess }: { onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        train_number: '',
        train_name: '',
        start_station: '',
        end_station: '',
    });
    const [stations, setStations] = useState<Array<{
        station_name: string;
        station_code: string;
        platform_number: string;
        sequence_order: number;
    }>>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const addStation = () => {
        setStations([
            ...stations,
            {
                station_name: '',
                station_code: '',
                platform_number: '',
                sequence_order: stations.length + 1,
            },
        ]);
    };

    const removeStation = (index: number) => {
        setStations(stations.filter((_, i) => i !== index));
        // Update sequence order
        setStations(prev => prev.map((station, i) => ({ ...station, sequence_order: i + 1 })));
    };

    const updateStation = (index: number, field: string, value: string) => {
        setStations(prev => prev.map((station, i) =>
            i === index ? { ...station, [field]: value } : station
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.train_number || !formData.train_name || !formData.start_station || !formData.end_station) {
            toast({
                title: "Error",
                description: "Please fill in all train details",
                variant: "destructive",
            });
            return;
        }

        if (stations.length === 0) {
            toast({
                title: "Error",
                description: "Please add at least one station",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch('http://localhost:8000/trains', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    stations: stations,
                }),
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Train added successfully",
                });
                onSuccess();
                // Reset form
                setFormData({
                    train_number: '',
                    train_name: '',
                    start_station: '',
                    end_station: '',
                });
                setStations([]);
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.detail || "Failed to add train",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to add train",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Train Number</label>
                    <input
                        type="text"
                        value={formData.train_number}
                        onChange={(e) => setFormData({ ...formData, train_number: e.target.value })}
                        className="w-full p-2 border rounded-md"
                        placeholder="e.g., 12951"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Train Name</label>
                    <input
                        type="text"
                        value={formData.train_name}
                        onChange={(e) => setFormData({ ...formData, train_name: e.target.value })}
                        className="w-full p-2 border rounded-md"
                        placeholder="e.g., Mumbai Rajdhani"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Start Station</label>
                    <input
                        type="text"
                        value={formData.start_station}
                        onChange={(e) => setFormData({ ...formData, start_station: e.target.value })}
                        className="w-full p-2 border rounded-md"
                        placeholder="e.g., Mumbai Central"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">End Station</label>
                    <input
                        type="text"
                        value={formData.end_station}
                        onChange={(e) => setFormData({ ...formData, end_station: e.target.value })}
                        className="w-full p-2 border rounded-md"
                        placeholder="e.g., New Delhi"
                        required
                    />
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Stations</h3>
                    <Button type="button" onClick={addStation} variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Station
                    </Button>
                </div>

                {stations.map((station, index) => (
                    <div key={index} className="border rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">Station {index + 1}</h4>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeStation(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium">Station Name</label>
                                <input
                                    type="text"
                                    value={station.station_name}
                                    onChange={(e) => updateStation(index, 'station_name', e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Station name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Station Code</label>
                                <input
                                    type="text"
                                    value={station.station_code}
                                    onChange={(e) => updateStation(index, 'station_code', e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="e.g., NDLS, BCT"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Platform</label>
                                <input
                                    type="text"
                                    value={station.platform_number}
                                    onChange={(e) => updateStation(index, 'platform_number', e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Platform number"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-2">
                <Button type="submit" disabled={loading}>
                    {loading ? "Adding Train..." : "Add Train"}
                </Button>
            </div>
        </form>
    );
}

// Train Details Component
function TrainDetails({ train }: { train: Train }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-muted-foreground">Train Number</label>
                    <p className="text-lg font-semibold">{train.train_number}</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground">Train Name</label>
                    <p className="text-lg font-semibold">{train.train_name}</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground">Start Station</label>
                    <p className="text-lg">{train.start_station}</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-muted-foreground">End Station</label>
                    <p className="text-lg">{train.end_station}</p>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-6">Train Route</h3>
                <div className="relative">
                    {/* Train Track Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                    <div className="space-y-0">
                        {train.stations
                            .sort((a, b) => a.sequence_order - b.sequence_order)
                            .map((station, index) => (
                                <div key={station.id} className="relative">
                                    {/* Station Circle */}
                                    <div className="flex items-center mb-6">
                                        <div className="relative z-10 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg border-4 border-white">
                                            {station.sequence_order}
                                        </div>

                                        {/* Station Info */}
                                        <div className="ml-6 flex-1">
                                            <div className="bg-white border rounded-lg p-4 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-semibold text-lg text-gray-900">{station.station_name}</h4>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {station.station_code}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                    <p className="text-sm text-gray-600">
                                                        Platform {station.platform_number}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connection Line (except for last station) */}
                                    {index < train.stations.length - 1 && (
                                        <div className="absolute left-6 top-12 w-0.5 h-6 bg-gray-300"></div>
                                    )}
                                </div>
                            ))}
                    </div>

                    {/* Train Icon at Start */}
                    <div className="absolute -left-2 top-0 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>

                    {/* Destination Icon at End */}
                    <div className="absolute -left-2 bottom-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                </div>

                {/* Route Summary */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span className="font-medium text-gray-700">{train.start_station}</span>
                        </div>
                        <div className="flex-1 mx-4 h-0.5 bg-gray-300"></div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="font-medium text-gray-700">{train.end_station}</span>
                        </div>
                    </div>
                    <p className="text-center text-sm text-gray-500 mt-2">
                        {train.stations.length} stations • {train.stations.length - 1} segments
                    </p>
                </div>
            </div>
        </div>
    );
} 

function EditTrainForm({ train, onSuccess }: { train: Train; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        train_number: train.train_number,
        train_name: train.train_name,
        start_station: train.start_station,
        end_station: train.end_station,
    });
    const [stations, setStations] = useState<Array<{
        id?: number;
        station_name: string;
        station_code: string;
        platform_number: string;
        sequence_order: number;
    }>>(train.stations.map(s => ({ ...s })));
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const addStation = () => {
        setStations([
            ...stations,
            {
                station_name: '',
                station_code: '',
                platform_number: '',
                sequence_order: stations.length + 1,
            },
        ]);
    };

    const removeStation = (index: number) => {
        setStations(stations.filter((_, i) => i !== index));
        setStations(prev => prev.map((station, i) => ({ ...station, sequence_order: i + 1 })));
    };

    const updateStation = (index: number, field: string, value: string) => {
        setStations(prev => prev.map((station, i) =>
            i === index ? { ...station, [field]: value } : station
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.train_number || !formData.train_name || !formData.start_station || !formData.end_station) {
            toast({
                title: "Error",
                description: "Please fill in all train details",
                variant: "destructive",
            });
            return;
        }
        if (stations.length === 0) {
            toast({
                title: "Error",
                description: "Please add at least one station",
                variant: "destructive",
            });
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`http://localhost:8000/trains/${train.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    train_name: formData.train_name,
                    start_station: formData.start_station,
                    end_station: formData.end_station,
                    stations: stations,
                }),
            });
            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Train updated successfully",
                });
                onSuccess();
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.detail || "Failed to update train",
                    variant: "destructive",
                });
            }
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to update train",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Train Number</label>
                    <input
                        type="text"
                        value={formData.train_number}
                        onChange={(e) => setFormData({ ...formData, train_number: e.target.value })}
                        className="w-full p-2 border rounded-md"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Train Name</label>
                    <input
                        type="text"
                        value={formData.train_name}
                        onChange={(e) => setFormData({ ...formData, train_name: e.target.value })}
                        className="w-full p-2 border rounded-md"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Start Station</label>
                    <input
                        type="text"
                        value={formData.start_station}
                        onChange={(e) => setFormData({ ...formData, start_station: e.target.value })}
                        className="w-full p-2 border rounded-md"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">End Station</label>
                    <input
                        type="text"
                        value={formData.end_station}
                        onChange={(e) => setFormData({ ...formData, end_station: e.target.value })}
                        className="w-full p-2 border rounded-md"
                        required
                    />
                </div>
            </div>
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Stations</h3>
                    <Button type="button" onClick={addStation} variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Station
                    </Button>
                </div>
                {stations.map((station, index) => (
                    <div key={index} className="border rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">Station {index + 1}</h4>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeStation(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium">Station Name</label>
                                <input
                                    type="text"
                                    value={station.station_name}
                                    onChange={(e) => updateStation(index, 'station_name', e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Station Code</label>
                                <input
                                    type="text"
                                    value={station.station_code}
                                    onChange={(e) => updateStation(index, 'station_code', e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Platform</label>
                                <input
                                    type="text"
                                    value={station.platform_number}
                                    onChange={(e) => updateStation(index, 'platform_number', e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-end gap-2">
                <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    );
} 