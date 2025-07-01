
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Header } from '@/components/header';
import { EntryCard } from '@/components/entry-card';
import { EntryForm } from '@/components/entry-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2, AlertTriangle, ClipboardList, ArrowUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { Entry } from '@/types';
import { z } from 'zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  content: z.string().min(1, "Content is required."),
});

const mockEntries: Entry[] = [
    {
      id: '1',
      title: 'Welcome to CopyIt!',
      content: 'This is a demo of your personal clipboard manager. Since Firebase is not configured, this is mock data and your changes will not be saved.',
      userId: 'mock-user',
      createdAt: { toDate: () => new Date(Date.now() - 1000 * 60 * 5) } as any,
    },
    {
      id: '2',
      title: 'How to use',
      content: 'Click "Add New" to create a new entry. You can edit, delete, and copy existing entries.',
      userId: 'mock-user',
      createdAt: { toDate: () => new Date(Date.now() - 1000 * 60 * 2) } as any,
    },
    {
      id: '3',
      title: 'Example JavaScript Snippet',
      content: 'const greeting = "Hello, world!";\nconsole.log(greeting);',
      userId: 'mock-user',
      createdAt: { toDate: () => new Date() } as any,
    },
];


export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest' | 'alphabetical'>('oldest');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  const router = useRouter();
  const { toast } = useToast();
  const isFirebaseConfigured = !!auth && !!db;
  const isMockMode = !isFirebaseConfigured;

  useEffect(() => {
    if (isMockMode) {
      setUser({ uid: 'mock-user', email: 'demo@example.com' } as User);
      setEntries(mockEntries);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [isMockMode, router]);

  useEffect(() => {
    if (isMockMode || !user) {
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    const q = query(collection(db, 'entries'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const entriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Entry[];
      setEntries(entriesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching entries: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch entries." });
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user, isMockMode, toast]);

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
     if (isMockMode) {
      if (editingEntry) {
        setEntries(prev => prev.map(e => e.id === editingEntry.id ? {...e, ...values, createdAt: { toDate: () => new Date() } as any} : e));
        toast({ title: "Success (Demo)", description: "Entry updated in demo mode." });
      } else {
        const newEntry: Entry = {
          id: (Math.random() * 10000).toString(),
          ...values,
          userId: 'mock-user',
          createdAt: { toDate: () => new Date() } as any
        };
        setEntries(prev => [newEntry, ...prev]);
        toast({ title: "Success (Demo)", description: "Entry added in demo mode." });
      }
      setIsDialogOpen(false);
      setEditingEntry(null);
      return;
    }

    if (!user) return;

    try {
      if (editingEntry) {
        const entryRef = doc(db, 'entries', editingEntry.id);
        await updateDoc(entryRef, {
          title: values.title,
          content: values.content,
        });
        toast({ title: "Success", description: "Entry updated successfully." });
      } else {
        await addDoc(collection(db, 'entries'), {
          ...values,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Success", description: "Entry added successfully." });
      }
      setIsDialogOpen(false);
      setEditingEntry(null);
    } catch (error) {
      console.error("Error saving entry: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not save entry." });
    }
  };

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setIsDialogOpen(true);
  };

  const handleDelete = async (entryId: string) => {
    if (isMockMode) {
      setEntries(prev => prev.filter(e => e.id !== entryId));
      toast({ title: "Success (Demo)", description: "Entry deleted in demo mode." });
      return;
    }

    try {
      await deleteDoc(doc(db, 'entries', entryId));
      toast({ title: "Success", description: "Entry deleted successfully." });
    } catch (error) {
      console.error("Error deleting entry: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete entry." });
    }
  };

  const sortedAndFilteredEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => {
      // Ensure createdAt exists and has toDate method before calling it
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;

      switch (sortOrder) {
        case 'oldest':
          return dateA - dateB;
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'latest':
        default:
          return dateB - dateA;
      }
    });

    if (!searchTerm) {
      return sorted;
    }

    return sorted.filter(entry =>
      entry.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [entries, searchTerm, sortOrder]);


  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header user={user} />
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-8 lg:p-10 container">
        {isMockMode && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Demo Mode</AlertTitle>
            <AlertDescription>
              Firebase is not configured. Any changes you make are for demonstration only and will not be saved.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-primary self-start">Your Clipboard</h1>
             <div className="flex w-full flex-col sm:flex-row sm:w-auto items-center gap-2">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                    placeholder="Search by title..."
                    className="pl-10 h-9 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full flex-1">
                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                Sort
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[--radix-dropdown-menu-trigger-width]">
                            <DropdownMenuItem onClick={() => setSortOrder('latest')}>
                                Date: Latest
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortOrder('oldest')}>
                                Date: Oldest
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortOrder('alphabetical')}>
                                Title: A-Z
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" className="w-full flex-1" onClick={() => { setEditingEntry(null); setIsDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Add New
                    </Button>
                </div>
            </div>
        </div>

        {sortedAndFilteredEntries.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in-50">
            {sortedAndFilteredEntries.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-8 py-24">
            <div className="flex flex-col items-center gap-2 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground"/>
              <h3 className="text-2xl font-bold tracking-tight">No entries found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? `No results for "${searchTerm}".` : 'Click "Add New" to create your first entry.'}
              </p>
            </div>
          </div>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingEntry ? 'Edit Entry' : 'Add New Entry'}</DialogTitle>
          </DialogHeader>
          <EntryForm
            onSubmit={handleFormSubmit}
            initialData={editingEntry || undefined}
            onClose={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
