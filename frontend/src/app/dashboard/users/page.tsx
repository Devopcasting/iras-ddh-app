
'use client';

import { useState, useEffect } from 'react';
import { MoreHorizontal, PlusCircle, Trash, Edit, User, Building } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  station_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}



export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stations, setStations] = useState<Array<{ station_code: string, station_name: string }>>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    role: 'operator',
    station_code: '',
  });
  const { toast } = useToast();
  const { token, user: currentLoggedInUser } = useAuth();

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
      }
    } catch (error) {
      console.error('Failed to fetch stations:', error);
    }
  };

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:8000/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStations();
  }, [token]);

  const handleEdit = (user: User) => {
    setCurrentUser(user);
    setFormData({
      email: user.email,
      username: user.username,
      password: '',
      role: user.role,
      station_code: user.station_code || '',
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setCurrentUser(null);
    setFormData({
      email: '',
      username: '',
      password: '',
      role: 'operator',
      station_code: '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/auth/users/${userId}`, {
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
          description: result.message || "User deleted successfully",
        });
        fetchUsers(); // Refresh the user list
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.detail || "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    if (formData.role === 'operator' && !formData.station_code) {
      toast({
        title: "Validation Error",
        description: "Station assignment is required for operators",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const userData = {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        station_code: formData.role === 'operator' ? formData.station_code : null,
      };

      const response = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        toast({
          title: currentUser ? "User Updated" : "User Created",
          description: currentUser
            ? "The user's details have been successfully updated."
            : "A new user account has been created.",
        });
        setIsDialogOpen(false);
        fetchUsers();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.detail || "Failed to save user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            User Management
          </h1>
          <p className="text-muted-foreground">
            Create, edit, and manage user accounts.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-headline">
                {currentUser ? 'Edit User' : 'Add New User'}
              </DialogTitle>
              <DialogDescription>
                {currentUser
                  ? 'Update the details for the user account.'
                  : 'Fill in the details to create a new user account.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={currentUser ? "Set a new password (optional)" : "Enter a password"}
                    required={!currentUser}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="operator">Operator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.role === 'operator' && (
                  <div className="space-y-2">
                    <Label htmlFor="station_code">Station Assignment *</Label>
                    {stations.length === 0 ? (
                      <div className="p-3 border border-yellow-300 bg-yellow-50 rounded-md">
                        <p className="text-sm text-yellow-800">
                          No stations available. Ask admin to add station.
                        </p>
                      </div>
                    ) : (
                      <>
                        <Select
                          value={formData.station_code}
                          onValueChange={(value) => setFormData({ ...formData, station_code: value })}
                          required
                        >
                          <SelectTrigger className={!formData.station_code ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select station (required for operators)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">
                              🌐 All Stations (Access to all routes)
                            </SelectItem>
                            {stations.map((station) => (
                              <SelectItem key={station.station_code} value={station.station_code}>
                                {station.station_code} - {station.station_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.role === 'operator' && !formData.station_code && (
                          <p className="text-sm text-red-500">Station assignment is required for operators</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || (formData.role === 'operator' && !formData.station_code)}
                >
                  {loading ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
          <CardDescription>
            A list of all registered user accounts in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Station</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users
                .filter(user => !(currentLoggedInUser && currentLoggedInUser.role === 'admin' && user.role === 'admin'))
                .map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? (
                        <>
                          <User className="mr-1 h-3 w-3" />
                          Admin
                        </>
                      ) : (
                        <>
                          <Building className="mr-1 h-3 w-3" />
                          Operator
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.station_code ? (
                      user.station_code.toUpperCase() === 'ALL' ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                          🌐 All Stations
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {user.station_code}
                        </Badge>
                      )
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'destructive'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()} 
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              disabled={!!(currentLoggedInUser && currentLoggedInUser.id === user.id)}
                            >
                              <Trash className="mr-2 h-4 w-4" /> 
                              {currentLoggedInUser && currentLoggedInUser.id === user.id ? 'Cannot Delete Self' : 'Delete'}
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the user account for{" "}
                                <strong>{user.username}</strong> ({user.email}).
                                {user.role === 'admin' && (
                                  <span className="block mt-2 text-yellow-600">
                                    ⚠️ Warning: This is an admin user account.
                                  </span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(user.id)} className='bg-destructive hover:bg-destructive/90'>
                                Delete User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
