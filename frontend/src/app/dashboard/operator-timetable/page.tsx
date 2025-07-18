'use client';

import { useState, useEffect } from 'react';
import { Train, Clock, MapPin, Calendar } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

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

export default function OperatorTimetablePage() {
    const [trains, setTrains] = useState<Train[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, token } = useAuth();
    const { toast } = useToast();

    // Get trains for the operator's station
    const fetchTrainsForStation = async () => {
        if (!user?.station_code) {
            toast({
                title: "No Station Assigned",
                description: "You are not assigned to any station. Ask admin to add station.",
                variant: "destructive",
            });
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
        fetchTrainsForStation();
    }, [user, token]);

    // Get station info for the operator's station
    const getStationInfo = (train: Train) => {
        if (user?.station_code?.toUpperCase() === 'ALL') {
            // For "ALL" assignment, return the first station of the train
            return train.stations[0];
        }
        return train.stations.find(station => station.station_code === user?.station_code);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading trains for your station...</p>
                </div>
            </div>
        );
    }

    if (!user?.station_code) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Station Assigned</h3>
                    <p className="text-muted-foreground">
                        You are not assigned to any station. Ask admin to add station.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                        Station Timetable
                    </h1>
                    <p className="text-muted-foreground">
                        {user.station_code.toUpperCase() === 'ALL' 
                            ? 'All trains across all stations (you have access to all routes)'
                            : `Trains passing through your assigned station: ${user.station_code}`
                        }
                    </p>
                </div>
                <Button onClick={fetchTrainsForStation} variant="outline">
                    <Clock className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Station Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        {user.station_code.toUpperCase() === 'ALL' ? 'Access Information' : 'Station Information'}
                    </CardTitle>
                    <CardDescription>
                        {user.station_code.toUpperCase() === 'ALL' 
                            ? 'You have access to all stations and routes'
                            : 'Your assigned station details and current status'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <div>
                                <p className="text-sm font-medium">Station Code</p>
                                <p className="text-lg font-bold">
                                    {user.station_code.toUpperCase() === 'ALL' ? '🌐 ALL' : user.station_code}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <div>
                                <p className="text-sm font-medium">Total Trains</p>
                                <p className="text-lg font-bold">{trains.length}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <div>
                                <p className="text-sm font-medium">Status</p>
                                <p className="text-lg font-bold text-green-600">Active</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Trains Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Train className="h-5 w-5" />
                        {user.station_code.toUpperCase() === 'ALL' 
                            ? 'All Trains Across All Stations'
                            : `Trains Passing Through ${user.station_code}`
                        }
                    </CardTitle>
                    <CardDescription>
                        {user.station_code.toUpperCase() === 'ALL'
                            ? 'Complete list of all trains across all stations'
                            : 'Complete list of trains that stop at your station'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {trains.length === 0 ? (
                        <div className="text-center py-8">
                            <Train className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Trains Found</h3>
                            <p className="text-muted-foreground">
                                No trains are currently scheduled to pass through your station. Ask admin to add station.
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
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trains.map((train) => {
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
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>


        </div>
    );
} 