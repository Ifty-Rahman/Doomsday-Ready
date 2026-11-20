import { useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Movie } from "@doomsday/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ConfirmDelete } from "@/components/Bits";
import { useDeleteMovie, useUpdateMovie } from "@/lib/queries";
import { cn } from "@/lib/utils";

export default function MovieItem({ movie, allMovies }: { movie: Movie; allMovies: Movie[] }) {
  const update = useUpdateMovie();
  const remove = useDeleteMovie();
  const [editing, setEditing] = useState(false);
  const [chosen, setChosen] = useState<number[]>(movie.prerequisiteIds);
  const [saveError, setSaveError] = useState<string | null>(null);

  const others = allMovies.filter((m) => m.id !== movie.id);
  const titleOf = (id: number) => allMovies.find((m) => m.id === id)?.title ?? `#${id}`;

  const openEditor = () => {
    setChosen(movie.prerequisiteIds);
    setSaveError(null);
    setEditing(true);
  };

  const save = () =>
    update.mutate(
      { id: movie.id, prerequisiteIds: chosen },
      { onSuccess: () => setEditing(false), onError: (e) => setSaveError(e.message) },
    );

  const toggle = (id: number, on: boolean) =>
    setChosen((cur) => (on ? [...cur, id] : cur.filter((x) => x !== id)));

  const move = (index: number, by: -1 | 1) =>
    setChosen((cur) => {
      const next = [...cur];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });

  return (
    <li className="bg-card space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Checkbox
          id={`watched-${movie.id}`}
          checked={movie.watched}
          onCheckedChange={(v) =>
            update.mutate({ id: movie.id, watched: v === true }, { onError: (e) => toast.error(e.message) })
          }
          aria-label={`Mark ${movie.title} as watched`}
        />
        <div className="min-w-0 flex-1">
          <p className={cn("font-medium", movie.watched && "text-muted-foreground line-through")}>{movie.title}</p>
          <p className="text-muted-foreground text-sm">{movie.releaseYear} · {movie.runtime} min</p>
        </div>
        <Button variant="outline" size="sm" onClick={editing ? () => setEditing(false) : openEditor}>
          {editing ? "Close" : "Edit prerequisites"}
        </Button>
        <ConfirmDelete
          trigger={<Button variant="ghost" size="icon" aria-label={`Delete ${movie.title}`}><Trash2 className="size-4" /></Button>}
          title={`Delete ${movie.title}?`}
          description="This cannot be undone."
          onConfirm={() => remove.mutate(movie.id, { onError: (e) => toast.error(e.message) })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-sm">Watch first:</span>
        {movie.prerequisiteIds.length === 0 ? (
          <span className="text-muted-foreground text-sm">nothing</span>
        ) : (
          movie.prerequisiteIds.map((id) => <Badge key={id} variant="secondary">{titleOf(id)}</Badge>)
        )}
      </div>

      {editing && (
        <div className="bg-background space-y-3 rounded-md border p-3">
          {others.length === 0 ? (
            <p className="text-muted-foreground text-sm">Add more movies first, then you can pick prerequisites here.</p>
          ) : (
            <>
              <p className="text-sm font-medium">Which movies should be watched before {movie.title}?</p>
              {chosen.length > 1 && (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Order (first is watched first):</p>
                  <ol className="space-y-1">
                    {chosen.map((id, i) => (
                      <li key={id} className="flex items-center gap-2 text-sm">
                        <span className="font-heading text-muted-foreground w-5 text-lg">{i + 1}</span>
                        <span className="flex-1">{titleOf(id)}</span>
                        <Button type="button" variant="ghost" size="icon" className="size-7" disabled={i === 0}
                          onClick={() => move(i, -1)} aria-label={`Move ${titleOf(id)} up`}><ArrowUp className="size-4" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="size-7" disabled={i === chosen.length - 1}
                          onClick={() => move(i, 1)} aria-label={`Move ${titleOf(id)} down`}><ArrowDown className="size-4" /></Button>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {others.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Checkbox id={`pre-${movie.id}-${m.id}`} checked={chosen.includes(m.id)} onCheckedChange={(v) => toggle(m.id, v === true)} />
                    <Label htmlFor={`pre-${movie.id}-${m.id}`}>{m.title}</Label>
                  </div>
                ))}
              </div>
              {saveError && <p className="text-destructive text-sm" role="alert">{saveError}</p>}
              <Button size="sm" onClick={save} disabled={update.isPending}>
                {update.isPending ? "Saving..." : "Save prerequisites"}
              </Button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
