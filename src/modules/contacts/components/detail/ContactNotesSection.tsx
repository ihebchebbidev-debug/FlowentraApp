import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ContactNotesSection({ notes }: { notes: { id: string; content: string; createdAt: string; }[] }) {
  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="text-lg">Notes</CardTitle>
      </CardHeader>
      <CardContent>
        {notes.length > 0 ? (
          <div>
            <p className="text-sm text-muted-foreground">{notes[0].content}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Last updated {new Date(notes[0].createdAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
