"use client";

import { Copy, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Entry } from "@/types";
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
} from "@/components/ui/alert-dialog"

type EntryCardProps = {
  entry: Entry;
  onEdit: (entry: Entry) => void;
  onDelete: (entryId: string) => void;
};

export function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(entry.content);
    toast({
      title: "Copied to clipboard!",
      description: `"${entry.title}" content has been copied.`,
    });
  };

  return (
    <Card className="transition-all hover:shadow-lg flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{entry.title}</CardTitle>
                <CardDescription className="text-xs">
                    {entry.createdAt ? new Date(entry.createdAt.toDate()).toLocaleString() : "Just now"}
                </CardDescription>
            </div>
            <div className="flex items-center shrink-0">
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onEdit(entry)}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your entry titled "{entry.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(entry.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md whitespace-pre-wrap font-mono h-full max-h-48 overflow-auto">
          {entry.content}
        </p>
      </CardContent>
    </Card>
  );
}
