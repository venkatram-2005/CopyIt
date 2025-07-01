"use client";

import { Copy, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="transition-shadow hover:shadow-xl flex flex-col">
      <CardHeader>
        <CardTitle className="truncate">{entry.title}</CardTitle>
        <CardDescription>
            {entry.createdAt ? new Date(entry.createdAt.toDate()).toLocaleString() : "Just now"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-sm text-muted-foreground bg-secondary p-3 rounded-md whitespace-pre-wrap font-mono h-full max-h-48 overflow-auto">
          {entry.content}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 bg-muted/50 p-3">
         <Button variant="default" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onEdit(entry)}>
            <Edit className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon" className="h-9 w-9">
              <Trash2 className="h-4 w-4" />
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
      </CardFooter>
    </Card>
  );
}
