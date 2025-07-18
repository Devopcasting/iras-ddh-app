'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, MapPin, Building, Upload, Download, Globe, Trash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

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

// State to Language mapping for announcements
const stateToLanguage: { [key: string]: string } = {
    'Maharashtra': 'Marathi',
    'Gujarat': 'Gujarati',
    'Delhi': 'Hindi',
    'Karnataka': 'Kannada',
    'Tamil Nadu': 'Tamil',
    'Kerala': 'Malayalam',
    'Andhra Pradesh': 'Telugu',
    'Telangana': 'Telugu',
    'West Bengal': 'Bengali',
    'Odisha': 'Odia',
    'Assam': 'Assamese',
    'Punjab': 'Punjabi',
    'Haryana': 'Hindi',
    'Uttar Pradesh': 'Hindi',
    'Madhya Pradesh': 'Hindi',
    'Rajasthan': 'Hindi',
    'Bihar': 'Hindi',
    'Jharkhand': 'Hindi',
    'Chhattisgarh': 'Hindi',
    'Uttarakhand': 'Hindi',
    'Himachal Pradesh': 'Hindi',
    'Jammu and Kashmir': 'Kashmiri',
    'Goa': 'Konkani',
    'Mizoram': 'Mizo',
    'Manipur': 'Manipuri',
    'Meghalaya': 'Khasi',
    'Nagaland': 'Naga',
    'Tripura': 'Bengali',
    'Sikkim': 'Nepali',
    'Arunachal Pradesh': 'English',
    'Chandigarh': 'Hindi',
    'Dadra and Nagar Haveli': 'Gujarati',
    'Daman and Diu': 'Gujarati',
    'Lakshadweep': 'Malayalam',
    'Puducherry': 'Tamil',
    'Andaman and Nicobar Islands': 'Hindi',
};

export default function StationsPage() {
    const [stations, setStations] = useState<Station[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentStation, setCurrentStation] = useState<Station | null>(null);
    const [loading, setLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [clearAllLoading, setClearAllLoading] = useState(false);
    const [formData, setFormData] = useState({
        station_name: '',
        station_code: '',
        state: 'none',
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const { token } = useAuth();

    // Helper function to safely extract error message
    const getErrorMessage = (error: any): string => {
        if (typeof error === 'string') {
            return error;
        }
        if (error && typeof error === 'object') {
            if (typeof error.detail === 'string') {
                return error.detail;
            }
            if (typeof error.message === 'string') {
                return error.message;
            }
        }
        return "An error occurred";
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

    useEffect(() => {
        fetchStations();
    }, [token]);

    const handleEdit = (station: Station) => {
        setCurrentStation(station);
        setFormData({
            station_name: station.station_name,
            station_code: station.station_code,
            state: station.state || 'none',
        });
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setCurrentStation(null);
        setFormData({
            station_name: '',
            station_code: '',
            state: 'none',
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (stationId: number) => {
        try {
            const response = await fetch(`http://localhost:8000/stations/${stationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Station deactivated successfully",
                });
                fetchStations();
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: error.detail || "Failed to delete station",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete station",
                variant: "destructive",
            });
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = currentStation
                ? `http://localhost:8000/stations/${currentStation.id}`
                : 'http://localhost:8000/stations';

            const method = currentStation ? 'PUT' : 'POST';

            const requestData = {
                ...formData,
                state: formData.state === 'none' ? null : formData.state
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                toast({
                    title: currentStation ? "Station Updated" : "Station Created",
                    description: currentStation
                        ? "The station has been successfully updated."
                        : "A new station has been created.",
                });
                setIsDialogOpen(false);
                fetchStations();
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: getErrorMessage(error),
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save station",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
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

                // Validate and process the data
                const processedStations = processExcelData(jsonData);
                if (processedStations.length > 0) {
                    importStations(processedStations);
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

    const processExcelData = (data: any[]): Array<{ station_name: string; station_code: string; state?: string }> => {
        const processedStations: Array<{ station_name: string; station_code: string; state?: string }> = [];
        const errors: string[] = [];

        console.log('🔍 Processing Excel data:', data);

        data.forEach((row, index) => {
            const stationName = row['Station Name'] || row['station_name'] || row['StationName'] || row['STATION_NAME'];
            const stationCode = row['Station Code'] || row['station_code'] || row['StationCode'] || row['STATION_CODE'];
            const state = row['State'] || row['state'] || row['STATE'];

            console.log(`🔍 Row ${index + 2}: Name='${stationName}', Code='${stationCode}', State='${state}'`);
            console.log(`🔍 Row ${index + 2} raw data:`, row);

            if (!stationName || !stationCode) {
                errors.push(`Row ${index + 2}: Missing station name or code`);
                return;
            }

            if (typeof stationName !== 'string' || typeof stationCode !== 'string') {
                errors.push(`Row ${index + 2}: Station name and code must be text`);
                return;
            }

            if (stationCode.length > 5) {
                errors.push(`Row ${index + 2}: Station code must be 5 characters or less`);
                return;
            }

            const processedStation = {
                station_name: stationName.trim(),
                station_code: stationCode.trim().toUpperCase(),
                ...(state && state.trim() && state.trim().toLowerCase() !== 'none' ? { state: state.trim() } : {}),
            };
            
            console.log(`✅ Processed station:`, processedStation);
            processedStations.push(processedStation);
        });

        if (errors.length > 0) {
            toast({
                title: "Validation Errors",
                description: `Found ${errors.length} errors in Excel file:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n... and ${errors.length - 3} more` : ''}`,
                variant: "destructive",
            });
            console.error('Excel validation errors:', errors);
            return [];
        }

        if (processedStations.length === 0) {
            toast({
                title: "No Data Found",
                description: "No valid station data found in the Excel file. Please check the column headers and data format.",
                variant: "destructive",
            });
            return [];
        }

        return processedStations;
    };

    const importStations = async (stationsData: Array<{ station_name: string; station_code: string; state?: string }>) => {
        setImportLoading(true);
        let successCount = 0;
        let errorCount = 0;

        console.log('🔍 Importing stations data:', stationsData);
        
        // Check if token is available
        if (!token) {
            toast({
                title: "Authentication Error",
                description: "No authentication token found. Please log in again.",
                variant: "destructive",
            });
            setImportLoading(false);
            return;
        }

        // Test backend connectivity first
        try {
            const testResponse = await fetch('http://localhost:8000/stations', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            
            if (!testResponse.ok) {
                console.error('❌ Backend connectivity test failed:', testResponse.status, testResponse.statusText);
                toast({
                    title: "Backend Error",
                    description: `Cannot connect to backend (${testResponse.status}). Please check if the server is running.`,
                    variant: "destructive",
                });
                setImportLoading(false);
                return;
            }
            
            console.log('✅ Backend connectivity test passed');
        } catch (error) {
            console.error('❌ Backend connectivity test failed:', error);
            toast({
                title: "Connection Error",
                description: "Cannot connect to backend server. Please check if the server is running.",
                variant: "destructive",
            });
            setImportLoading(false);
            return;
        }

        for (const stationData of stationsData) {
            try {
                // Validate data before sending
                if (!stationData.station_name || !stationData.station_code) {
                    console.error('❌ Invalid station data:', stationData);
                    errorCount++;
                    continue;
                }

                console.log('🔍 Sending station data:', stationData);
                console.log('🔍 Request body:', JSON.stringify(stationData, null, 2));
                console.log('🔍 Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
                
                const response = await fetch('http://localhost:8000/stations', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(stationData),
                });

                console.log('🔍 Response status:', response.status);
                console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

                if (response.ok) {
                    const createdStation = await response.json();
                    console.log('✅ Station created:', createdStation);
                    successCount++;
                } else {
                    let error;
                    try {
                        error = await response.json();
                    } catch (parseError) {
                        error = { detail: `Failed to parse error response: ${parseError}` };
                    }
                    
                    console.error('❌ Station creation failed:', error);
                    console.error('❌ Response status:', response.status);
                    console.error('❌ Response status text:', response.statusText);
                    console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()));
                    
                    // Try to get response text if JSON parsing failed
                    if (!error.detail) {
                        try {
                            const responseText = await response.text();
                            console.error('❌ Response text:', responseText);
                        } catch (textError) {
                            console.error('❌ Could not read response text:', textError);
                        }
                    }
                    
                    if (typeof error.detail === 'string' && error.detail.includes('already exists')) {
                        // Station already exists, skip
                        console.log(`ℹ️  Station ${stationData.station_code} already exists, skipping`);
                        continue;
                    }
                    
                    // Log more details about the error
                    if (error.detail) {
                        console.error('❌ Error detail:', error.detail);
                    }
                    errorCount++;
                }
            } catch (error) {
                console.error('❌ Network error:', error);
                errorCount++;
            }
        }

        setImportLoading(false);

        if (successCount > 0) {
            toast({
                title: "Import Successful",
                description: `Successfully imported ${successCount} stations${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
            });
            fetchStations(); // Refresh the list
        } else {
            toast({
                title: "Import Failed",
                description: "No stations were imported. Please check your data.",
                variant: "destructive",
            });
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Clear all stations
    const handleClearAll = async () => {
        setClearAllLoading(true);
        try {
            const response = await fetch('http://localhost:8000/stations/clear-all', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "All stations have been cleared from the database",
                });
                fetchStations(); // Refresh the list
            } else {
                const error = await response.json();
                toast({
                    title: "Error",
                    description: getErrorMessage(error),
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: getErrorMessage(error),
                variant: "destructive",
            });
        } finally {
            setClearAllLoading(false);
        }
    };

    const downloadTemplate = () => {
        const templateData = [
            { 'Station Name': 'MUMBAI CENTRAL', 'Station Code': 'MMCT', 'State': 'Maharashtra' },
            { 'Station Name': 'BORIVALI', 'Station Code': 'BVI', 'State': 'Maharashtra' },
            { 'Station Name': 'VAPI', 'Station Code': 'VAPI', 'State': 'Gujarat' },
            { 'Station Name': 'SURAT', 'Station Code': 'ST', 'State': 'Gujarat' },
            { 'Station Name': 'VADODARA JN', 'Station Code': 'BRC', 'State': 'Gujarat' },
            { 'Station Name': 'ANAND JN', 'Station Code': 'ANND', 'State': 'Gujarat' },
            { 'Station Name': 'AHMEDABAD JN', 'Station Code': 'ADI', 'State': 'Gujarat' },
            { 'Station Name': 'GANDHINAGAR CAP', 'Station Code': 'GNC', 'State': 'Gujarat' },
            { 'Station Name': 'NEW DELHI', 'Station Code': 'NDLS', 'State': 'Delhi' },
            { 'Station Name': 'CHENNAI CENTRAL', 'Station Code': 'MAS', 'State': 'Tamil Nadu' },
            { 'Station Name': 'HOWRAH', 'Station Code': 'HWH', 'State': 'West Bengal' },
            { 'Station Name': 'BANGALORE CITY', 'Station Code': 'SBC', 'State': 'Karnataka' },
            { 'Station Name': 'HYDERABAD', 'Station Code': 'HYB', 'State': 'Telangana' },
            { 'Station Name': 'PUNE', 'Station Code': 'PUNE', 'State': 'Maharashtra' },
            { 'Station Name': 'JAIPUR', 'Station Code': 'JP', 'State': 'Rajasthan' },
            { 'Station Name': 'LUCKNOW', 'Station Code': 'LKO', 'State': 'Uttar Pradesh' },
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Stations');
        
        // Auto-size columns
        const columnWidths = [
            { wch: 25 }, // Station Name
            { wch: 15 }, // Station Code
            { wch: 20 }, // State
        ];
        worksheet['!cols'] = columnWidths;

        XLSX.writeFile(workbook, 'station_import_template.xlsx');
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                        Station Management
                    </h1>
                    <p className="text-muted-foreground">
                        Create, edit, and manage railway stations. Import Excel files with Station Name, Code, and State for language mapping.
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
                    <Button 
                        variant="destructive" 
                        onClick={handleClearAll}
                        disabled={clearAllLoading || stations.length === 0}
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        {clearAllLoading ? "Clearing..." : "Clear All"}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={handleAddNew}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add New Station
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="font-headline">
                                    {currentStation ? 'Edit Station' : 'Add New Station'}
                                </DialogTitle>
                                <DialogDescription>
                                    {currentStation
                                        ? 'Update the station name and code.'
                                        : 'Enter station name and code to create a new station.'
                                    }
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSave}>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="station_name">Station Name *</Label>
                                        <Input
                                            id="station_name"
                                            value={formData.station_name}
                                            onChange={(e) => setFormData({ ...formData, station_name: e.target.value })}
                                            placeholder="e.g., MUMBAI CENTRAL"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="station_code">Station Code *</Label>
                                        <Input
                                            id="station_code"
                                            value={formData.station_code}
                                            onChange={(e) => setFormData({ ...formData, station_code: e.target.value.toUpperCase() })}
                                            placeholder="e.g., MMCT"
                                            maxLength={5}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="state">State</Label>
                                        <Select
                                            value={formData.state}
                                            onValueChange={(value) => setFormData({ ...formData, state: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a state" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                                                <SelectItem value="Gujarat">Gujarat</SelectItem>
                                                <SelectItem value="Delhi">Delhi</SelectItem>
                                                <SelectItem value="Karnataka">Karnataka</SelectItem>
                                                <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                                                <SelectItem value="Kerala">Kerala</SelectItem>
                                                <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                                                <SelectItem value="Telangana">Telangana</SelectItem>
                                                <SelectItem value="West Bengal">West Bengal</SelectItem>
                                                <SelectItem value="Odisha">Odisha</SelectItem>
                                                <SelectItem value="Assam">Assam</SelectItem>
                                                <SelectItem value="Punjab">Punjab</SelectItem>
                                                <SelectItem value="Haryana">Haryana</SelectItem>
                                                <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                                                <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                                                <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                                                <SelectItem value="Bihar">Bihar</SelectItem>
                                                <SelectItem value="Jharkhand">Jharkhand</SelectItem>
                                                <SelectItem value="Chhattisgarh">Chhattisgarh</SelectItem>
                                                <SelectItem value="Uttarakhand">Uttarakhand</SelectItem>
                                                <SelectItem value="Himachal Pradesh">Himachal Pradesh</SelectItem>
                                                <SelectItem value="Jammu and Kashmir">Jammu and Kashmir</SelectItem>
                                                <SelectItem value="Goa">Goa</SelectItem>
                                                <SelectItem value="Mizoram">Mizoram</SelectItem>
                                                <SelectItem value="Manipur">Manipur</SelectItem>
                                                <SelectItem value="Meghalaya">Meghalaya</SelectItem>
                                                <SelectItem value="Nagaland">Nagaland</SelectItem>
                                                <SelectItem value="Tripura">Tripura</SelectItem>
                                                <SelectItem value="Sikkim">Sikkim</SelectItem>
                                                <SelectItem value="Arunachal Pradesh">Arunachal Pradesh</SelectItem>
                                                <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                                                <SelectItem value="Dadra and Nagar Haveli">Dadra and Nagar Haveli</SelectItem>
                                                <SelectItem value="Daman and Diu">Daman and Diu</SelectItem>
                                                <SelectItem value="Lakshadweep">Lakshadweep</SelectItem>
                                                <SelectItem value="Puducherry">Puducherry</SelectItem>
                                                <SelectItem value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? "Saving..." : "Save"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>



            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Railway Stations
                    </CardTitle>
                    <CardDescription>
                        A list of all registered railway stations. State information is used for language mapping in announcements.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Station Name</TableHead>
                                <TableHead>Station Code</TableHead>
                                <TableHead>State</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stations.map((station) => (
                                <TableRow key={station.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-primary" />
                                            {station.station_name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {station.station_code}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {station.state ? (
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                {station.state}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-gray-500">
                                                Not Set
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={station.is_active ? 'default' : 'destructive'}>
                                            {station.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleEdit(station)}
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
                                                            This action will deactivate the station "{station.station_name}".
                                                            This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(station.id)}
                                                            className="bg-destructive hover:bg-destructive/90"
                                                        >
                                                            Deactivate
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
                </CardContent>
            </Card>
        </div>
    );
} 