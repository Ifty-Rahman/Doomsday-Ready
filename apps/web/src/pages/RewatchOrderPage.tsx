import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Circle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { EmptyState, ErrorMessage, Loading, PageTitle } from "@/components/Bits";
import { useMovies, useRewatchOrder } from "@/lib/queries";
import { cn } from "@/lib/utils";

const formatMinutes = (total: number) => {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export default function RewatchOrderPage() {
  const movies = useMovies();
  const [selected, setSelected] = useState<string>("");
  const plan = useRewatchOrder(selected ? Number(selected) : null);

  return (
    <section>
      <PageTitle title="Rewatch Order" subtitle="Pick a movie to see what to watch before it." />

      {movies.isLoading && <Loading />}
      {movies.isError && <ErrorMessage error={movies.error} />}
      {movies.data?.length === 0 && (
        <EmptyState>
          No movies yet. <Link to="/movies" className="text-primary underline">Add some movies</Link> first.
        </EmptyState>
      )}

      {movies.data && movies.data.length > 0 && (
        <div className="space-y-6">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-full sm:w-96" aria-label="Target movie">
              <SelectValue placeholder="Pick a movie..." />
            </SelectTrigger>
            <SelectContent>
              {movies.data.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>{m.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {plan.isLoading && <Loading />}
          {plan.isError && <ErrorMessage error={plan.error} />}

          {plan.data && (
            <div className="space-y-4">
              <h3 className="text-2xl">Before you watch <span className="text-primary">{plan.data.target.title}</span></h3>

              {plan.data.totalCount === 0 ? (
                <EmptyState>Nothing to watch first. You are ready to go!</EmptyState>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{plan.data.watchedCount} of {plan.data.totalCount} watched</span>
                      <span className="text-muted-foreground">
                        {plan.data.remainingRuntime === 0
                          ? "All caught up"
                          : `${formatMinutes(plan.data.remainingRuntime)} left to watch`}
                      </span>
                    </div>
                    <Progress value={(plan.data.watchedCount / plan.data.totalCount) * 100} />
                  </div>

                  <ol className="space-y-2">
                    {plan.data.order.map((m, i) => (
                      <li key={m.id} className="bg-card flex items-center gap-3 rounded-lg border p-3">
                        <span className="font-heading text-muted-foreground w-8 text-2xl">{i + 1}</span>
                        <span
                          className={cn(
                            "flex size-6 items-center justify-center rounded-full border",
                            m.watched ? "bg-primary border-primary text-primary-foreground" : "text-muted-foreground",
                          )}
                          aria-label={m.watched ? "Watched" : "Not watched"}
                        >
                          {m.watched ? <Check className="size-4" /> : <Circle className="size-3" />}
                        </span>
                        <span className={cn("flex-1", m.watched && "text-muted-foreground line-through")}>{m.title}</span>
                        <span className="text-muted-foreground text-sm">{formatMinutes(m.runtime)}</span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
