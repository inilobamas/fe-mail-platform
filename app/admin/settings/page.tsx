'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import FooterAdminNav from "@/components/FooterAdminNav"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster";
import withAuth from "@/components/hoc/withAuth";
import PasswordInput from "@/components/PasswordInput";

interface AdminUser {
    id: number
    email: string
    lastActive: string
    created: string
}

interface User {
    ID: number
    Email: string
    LastLogin: string
    CreatedAt: string
}

type SortField = 'lastActive' | 'created' | 'lastCreated'
type SortOrder = 'asc' | 'desc'

const UserAdminManagement: React.FC = () => {
    // const [searchTerm, setSearchTerm] = useState("");
    const [users, setUsers] = useState<AdminUser[]>([])
    const [sortField, setSortField] = useState<SortField>('lastActive')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    // const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 10
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const { toast } = useToast();

    const [isDialogDeleteOpen, setIsDialogDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

    const [isDialogCreateOpen, setIsDialogCreateOpen] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState("");
    const [newAdminPassword, setNewAdminPassword] = useState("");

    const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
    const [isChangePasswordMyselfDialogOpen, setIsChangePasswordMyselfDialogOpen] = useState(false);
    const [passwordForAdmin, setPasswordForAdmin] = useState("");
    const [oldPasswordForAdmin, setOldPasswordForAdmin] = useState("");
    const [confirmPasswordForAdmin, setConfirmPasswordForAdmin] = useState("");
    const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showOPassword, setShowOPassword] = useState(false);
    const [showCPassword, setShowCPassword] = useState(false);

    const handleDeleteClick = (user: AdminUser) => {
        setSelectedUser(user);
        setIsDialogDeleteOpen(true);
    };

    // Function to handle "Change Password" button click
    const handleChangePasswordClick = (admin: AdminUser) => {
        setSelectedAdmin(admin);
        setIsChangePasswordDialogOpen(true);
    };

    const handleChangeMyselfPasswordClick = (admin: AdminUser) => {
        setSelectedAdmin(admin);
        setIsChangePasswordMyselfDialogOpen(true);
    };

    // Function to handle password change submission
    const handleChangePasswordSubmit = async () => {
        if (!selectedAdmin) return;

        if (passwordForAdmin !== confirmPasswordForAdmin) {
            toast({
                description: "Passwords do not match.",
                variant: "destructive",
            });
            return;
        }

        if (passwordForAdmin.length < 6) {
            toast({
                description: "Password must be at least 6 characters long.",
                variant: "destructive",
            });
            return;
        }

        // Regular expression to ensure password complexity
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;

        if (!passwordRegex.test(passwordForAdmin)) {
            toast({
                description: "Password must include a number, lowercase, uppercase, and symbol.",
                variant: "destructive",
            });
            return;
        }

        try {
            await axios.put(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/change_password/admin`,
                {
                    new_password: passwordForAdmin,
                    old_password: oldPasswordForAdmin,
                    user_id: selectedAdmin.id
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            toast({
                description: "Password changed successfully.",
                variant: "default",
            });

            // Reset state and close modal
            setIsChangePasswordDialogOpen(false);
            setIsChangePasswordMyselfDialogOpen(false);
            setPasswordForAdmin("");
            setOldPasswordForAdmin("");
            setConfirmPasswordForAdmin("");
            setSelectedAdmin(null);

            // Optionally refresh the user list
            fetchUsers();
        } catch (error) {
            console.error('Failed to change password:', error);
            setPasswordForAdmin("");
            setOldPasswordForAdmin("");
            setConfirmPasswordForAdmin("");
            setSelectedAdmin(null);
            toast({
                description: "Failed to change password. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!selectedUser) return;

        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/admin/${selectedUser.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Remove the deleted user from the state
            setUsers((prevUsers) => prevUsers.filter((user) => user.id !== selectedUser.id));
            setIsDialogDeleteOpen(false);
            setSelectedUser(null);

            // Show success toast
            toast({
                description: newAdminEmail + " admin deleted successfully!",
                variant: "default",
            });
        } catch (error) {
            console.error('Failed to delete admin:', error);
            toast({
                description: "Failed to delete admin. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleCreateAdmin = async () => {
        if (!newAdminEmail || !newAdminPassword) {
            toast({
                title: "Error",
                description: "Please fill all required fields",
                variant: "destructive",
            });
            return;
        }

        if (newAdminPassword.length < 6) {
            toast({
                description: "Password must be at least 6 characters long.",
                variant: "destructive",
            });
            return;
        }

        // Regular expression to ensure password complexity
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;

        if (!passwordRegex.test(newAdminPassword)) {
            toast({
                description: "Password must include a number, lowercase, uppercase, and symbol.",
                variant: "destructive",
            });
            return;
        }

        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/admin`,
                {
                    username: newAdminEmail,
                    password: newAdminPassword,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Show success toast
            toast({
                description: newAdminEmail + " admin has been successfully created!",
                variant: "default",
            });

            // Close the dialog and reset the form
            setIsDialogCreateOpen(false);
            setNewAdminEmail("");
            setNewAdminPassword("");

            // Refresh the user list
            fetchUsers();
        } catch (error) {
            console.error('Failed to create admin:', error);
            toast({
                description: "Failed to create admin. Please try again.",
                variant: "destructive",
            });
        }
    };

    // const handleSearch = (value: string) => {
    //     setSearchTerm(value);
    //     setCurrentPage(1); // Reset to first page when searching
    // };

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/admin`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            const data = response.data.users.map((user: User) => ({
                id: user.ID,
                email: user.Email,
                lastActive: new Date(user.LastLogin).toLocaleString(),
                created: new Date(user.CreatedAt).toLocaleDateString(),
            }))
            setUsers(data)
            setError(null)
        } catch (err) {
            console.error('Failed to fetch users:', err)
            setError('Failed to load users')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [token, pageSize])

    const sortedUsers = [...users].sort((a, b) => {
        if (sortField === 'lastActive') {
            return sortOrder === 'asc'
                ? a.lastActive.localeCompare(b.lastActive)
                : b.lastActive.localeCompare(a.lastActive)
        } else if (sortField === 'created') {
            return sortOrder === 'asc'
                ? a.created.localeCompare(b.created)
                : b.created.localeCompare(a.created)
        } else {
            return sortOrder === 'asc'
                ? a.created.localeCompare(b.created)
                : b.created.localeCompare(a.created)
        }
    })

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('desc')
        }
    }

    const handleLogout = () => {
        // Clear token and redirect to login page
        useAuthStore.getState().setToken(null);
        router.push('/');
    }

    return (
        <div className="p-6 space-y-2">
            <div className="flex-1 overflow-auto pb-20">
                {/* <div className="flex justify-between items-center pl-4">
                    <Input placeholder="by username" className="max-w-xs" value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)} />
                </div> */}

                <div className="overflow-auto p-4 pb-20">
                    <Toaster />
                    {isLoading ? (
                        <div>Loading...</div>
                    ) : error ? (
                        <div className="text-red-500">{error}</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-400 hover:bg-gray-400">
                                    <TableHead className="text-center text-black font-bold">Admin Name</TableHead>
                                    <TableHead className="text-center text-black font-bold">
                                        <Button
                                            variant="ghost"
                                            onClick={() => toggleSort('lastActive')}
                                            className="font-bold text-black hover:bg-gray-500"
                                        >
                                            Last Active
                                            {sortField === 'lastActive' && (
                                                sortOrder === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                                            )}
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-center text-black font-bold">
                                        <Button
                                            variant="ghost"
                                            onClick={() => toggleSort('created')}
                                            className="font-bold text-black hover:bg-gray-500"
                                        >
                                            Created
                                            {sortField === 'created' && (
                                                sortOrder === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                                            )}
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-center text-black font-bold">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedUsers.map((user) => (
                                    <TableRow key={user.email}>
                                        <TableCell className="px-2 py-1 text-center">{user.email}</TableCell>
                                        <TableCell className="px-2 py-1 text-center">{user.lastActive}</TableCell>
                                        <TableCell className="px-2 py-1 text-center">{user.created}</TableCell>
                                        <TableCell className="px-2 py-1 space-x-2 text-center">
                                            <Button
                                                variant="secondary"
                                                className="bg-yellow-200 hover:bg-yellow-300"
                                                onClick={() => handleChangePasswordClick(user)}
                                            >
                                                Change Password
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                className="bg-white border border-red-500 text-red-500 hover:bg-red-100"
                                                onClick={() => handleDeleteClick(user)}
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    <Dialog open={isChangePasswordDialogOpen} onOpenChange={setIsChangePasswordDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Change Password for {selectedAdmin?.email}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <PasswordInput
                                    id="password"
                                    placeholder="New Password"
                                    value={passwordForAdmin}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setPasswordForAdmin(value.replace(/\s/g, '')); // Remove spaces
                                    }}
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                />
                                <PasswordInput
                                    id="password"
                                    placeholder="Confirm Password"
                                    value={confirmPasswordForAdmin}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setConfirmPasswordForAdmin(value.replace(/\s/g, '')); // Remove spaces
                                    }}
                                    showPassword={showCPassword}
                                    setShowPassword={setShowCPassword}
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="secondary" onClick={() => {
                                    setIsChangePasswordDialogOpen(false);
                                    setPasswordForAdmin("");
                                    setConfirmPasswordForAdmin("");
                                    setSelectedAdmin(null);
                                }}>
                                    Cancel
                                </Button>
                                <Button onClick={handleChangePasswordSubmit}>
                                    Submit
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isChangePasswordMyselfDialogOpen} onOpenChange={setIsChangePasswordMyselfDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Change Password for {selectedAdmin?.email}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                            <PasswordInput
                                    id="old-password"
                                    placeholder="Old Password"
                                    value={oldPasswordForAdmin}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setOldPasswordForAdmin(value.replace(/\s/g, '')); // Remove spaces
                                    }}
                                    showPassword={showOPassword}
                                    setShowPassword={setShowOPassword}
                                />
                                <PasswordInput
                                    id="password"
                                    placeholder="New Password"
                                    value={passwordForAdmin}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setPasswordForAdmin(value.replace(/\s/g, '')); // Remove spaces
                                    }}
                                    showPassword={showPassword}
                                    setShowPassword={setShowPassword}
                                />
                                <PasswordInput
                                    id="password"
                                    placeholder="Confirm Password"
                                    value={confirmPasswordForAdmin}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setConfirmPasswordForAdmin(value.replace(/\s/g, '')); // Remove spaces
                                    }}
                                    showPassword={showCPassword}
                                    setShowPassword={setShowCPassword}
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="secondary" onClick={() => {
                                    setIsChangePasswordDialogOpen(false);
                                    setPasswordForAdmin("");
                                    setConfirmPasswordForAdmin("");
                                    setSelectedAdmin(null);
                                }}>
                                    Cancel
                                </Button>
                                <Button onClick={handleChangePasswordSubmit}>
                                    Submit
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isDialogDeleteOpen} onOpenChange={setIsDialogDeleteOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Confirmation</DialogTitle>
                            </DialogHeader>
                            <p>Are you sure you want to delete admin {selectedUser?.email}?</p>
                            <DialogFooter>
                                <Button variant="secondary" onClick={() => setIsDialogDeleteOpen(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDeleteConfirm}>Confirm</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isDialogCreateOpen} onOpenChange={setIsDialogCreateOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Admin</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <Input
                                    placeholder="Username"
                                    value={newAdminEmail}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setNewAdminEmail(value.replace(/\s/g, '')); // Remove spaces
                                    }}
                                />
                                <Input
                                    placeholder="Password"
                                    type="password"
                                    value={newAdminPassword}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setNewAdminPassword(value.replace(/\s/g, '')); // Remove spaces
                                    }}
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="secondary" className='w-1/2 bg-white border border-yellow-500 text-yellow-500 hover:bg-yellow-100' onClick={() => setIsDialogCreateOpen(false)}>Back</Button>
                                <Button
                                    variant="default"
                                    className={`w-1/2  font-bold border border-black/20 text-black ${!newAdminEmail || !newAdminPassword
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : "bg-yellow-300 hover:bg-yellow-300"
                                        }`}
                                    disabled={!newAdminEmail || !newAdminPassword}
                                    onClick={handleCreateAdmin}>Confirm</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="fixed bottom-10 left-0 right-0 p-4">
                    <div className="flex justify-center gap-4 mt-4 mb-8">
                        <Button
                            className="w-[400px] bg-gray-800 hover:bg-gray-700 text-white py-3"
                            onClick={() => setIsDialogCreateOpen(true)}
                        >
                            Create Admin
                        </Button>
                        {/* <Button
                            className="w-[400px] bg-gray-800 hover:bg-gray-700 text-white py-3"
                            onClick={() => setIsDialogCreateOpen(true)}
                        >
                            Change Password
                        </Button> */}
                        <Button
                            className="w-[400px] bg-gray-800 hover:bg-gray-700 text-white py-3"
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                        <Button
                            className="w-[150px] bg-gray-800 hover:bg-gray-700 text-white py-3"
                            onClick={() => handleChangeMyselfPasswordClick({ id: 0, email: "Myself", lastActive: "", created: "" })}
                        >
                            Change Password
                        </Button>
                    </div>
                </div>
            </div>

            <FooterAdminNav />
        </div>
    )
}

export default withAuth(UserAdminManagement);