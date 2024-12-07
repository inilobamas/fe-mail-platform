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
import PaginationComponent from "@/components/PaginationComponent"
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import FooterAdminNav from "@/components/FooterAdminNav"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster";
import withAuth from "@/components/hoc/withAuth";

interface EmailUser {
    id: number
    email: string
    lastActive: string
    created: string
    createdByName: string
}

interface User {
    ID: number
    Email: string
    LastLogin: string
    CreatedAt: string
    CreatedByName: string
}

type SortField = 'lastActive' | 'created'
type SortOrder = 'asc' | 'desc'

const EmailManagement: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [users, setUsers] = useState<EmailUser[]>([])
    const [sortField, setSortField] = useState<SortField>('lastActive')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const pageSize = 10
    const [totalPages, setTotalPages] = useState(1)
    const router = useRouter();
    const token = useAuthStore((state) => state.token);
    const { toast } = useToast();

    const [isDialogDeleteOpen, setIsDialogDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<EmailUser | null>(null);

    const handleDeleteClick = (user: EmailUser) => {
        setSelectedUser(user);
        setIsDialogDeleteOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedUser) return;

        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/${selectedUser.id}`, {
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
                title: "Success",
                description: "User deleted successfully!",
                variant: "default",
            });
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1); // Reset to first page when searching
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params: {
                        page: currentPage,
                        page_size: pageSize,
                        email: searchTerm,
                        sort_by: sortField,
                        sort_order: sortOrder,
                    },
                });
                const data = response.data.users.map((user: User) => ({
                    id: user.ID,
                    email: user.Email,
                    lastActive: new Date(user.LastLogin).toLocaleString(),
                    created: new Date(user.CreatedAt).toLocaleDateString(),
                    createdByName: user.CreatedByName,
                }));
                setUsers(data);
                setTotalPages(response.data.total_pages);
                setTotalCount(response.data.total_count);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch users:', err);
                setError('Failed to load users');
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [token, currentPage, pageSize, searchTerm, sortField, sortOrder]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    return (
        <div className="p-6 space-y-2">
            <div className="flex-1 overflow-auto pb-20">
                <div className="flex justify-between items-center pl-4">
                    <Input
                        placeholder="by username"
                        className="max-w-xs"
                        value={searchTerm}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^[a-zA-Z0-9.,_]*$/.test(value)) {
                                handleSearch(value);
                            }
                        }}
                    />
                    <Toaster />
                </div>

                <div className="overflow-x-auto p-4">
                    {isLoading ? (
                        <div>Loading...</div>
                    ) : error ? (
                        <div className="text-red-500">{error}</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-400 hover:bg-gray-400">
                                    <TableHead className="text-center text-black font-bold">Name</TableHead>
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
                                    <TableHead className="text-center text-black font-bold">Created By Admin</TableHead>
                                    <TableHead className="text-center text-black font-bold">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.email}>
                                        <TableCell className="px-2 py-1 text-center">{user.email}</TableCell>
                                        <TableCell className="px-2 py-1 text-center">{user.lastActive}</TableCell>
                                        <TableCell className="px-2 py-1 text-center">{user.created}</TableCell>
                                        <TableCell className="px-2 py-1 text-center">{user.createdByName}</TableCell>
                                        <TableCell className="px-2 py-1 space-x-2 text-center">
                                            <Button variant="secondary" className="bg-yellow-200 hover:bg-yellow-300" onClick={() => router.push(`/admin/user/${user.id}`)}>
                                                View
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

                    <Dialog open={isDialogDeleteOpen} onOpenChange={setIsDialogDeleteOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Confirmation</DialogTitle>
                            </DialogHeader>
                            <p>Are you sure you want to delete user {selectedUser?.email}?</p>
                            <DialogFooter>
                                <Button variant="secondary" onClick={() => setIsDialogDeleteOpen(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDeleteConfirm}>Confirm</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <PaginationComponent
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    totalCount={totalCount}
                    pageSize={pageSize}
                />
            </div>

            <FooterAdminNav />
        </div>
    )
}

export default withAuth(EmailManagement);