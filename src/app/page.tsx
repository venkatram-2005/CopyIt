"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, where, onSnapshot, serverTimestamp, orderBy } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Header } from '@/components/header';
import { EntryCard } from '@/components/entry-card';
import { EntryForm } from '@/components/entry-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Entry } from '@/types';
import { z } from 'zod';

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  content: z.string().min(1, "Content is required."),
});

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const q = query(collection(db, 'entries'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
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
    }
  }, [user, toast]);

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
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
    try {
      await deleteDoc(doc(db, 'entries', entryId));
      toast({ title: "Success", description: "Entry deleted successfully." });
    } catch (error) {
      console.error("Error deleting entry: ", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete entry." });
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry =>
      entry.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [entries, searchTerm]);

  if (!user || (isLoading && entries.length === 0)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header user={user} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:p-8 container">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => { setEditingEntry(null); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add New
          </Button>
        </div>

        {isLoading ? (
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-3 p-4 border rounded-lg animate-pulse">
                    <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                    <div className="h-20 bg-muted rounded-md"></div>
                </div>
            ))}
           </div>
        ) : filteredEntries.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in-50">
            {filteredEntries.map(entry => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-8">
            <div className="flex flex-col items-center gap-1 text-center">
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
