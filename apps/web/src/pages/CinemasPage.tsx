import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BookingChecker from "@/components/BookingChecker";
import CinemaForm from "@/components/CinemaForm";
import { ConfirmDelete, EmptyState, ErrorMessage, Loading, PageTitle } from "@/components/Bits";
import { useCinemas, useDeleteCinema } from "@/lib/queries";

export default function CinemasPage() {
  const cinemas = useCinemas();
  const remove = useDeleteCinema();

  return (
    <section className="space-y-8">
      <PageTitle title="Cinemas" subtitle="Save the bundles each cinema sells, then check if your group fits exactly." />

      <div className="space-y-4">
        <h3 className="font-medium">Add a cinema</h3>
        <CinemaForm />
        {cinemas.isLoading && <Loading />}
        {cinemas.isError && <ErrorMessage error={cinemas.error} />}
        {cinemas.data?.length === 0 && <EmptyState>No cinemas yet.</EmptyState>}
        <ul className="divide-y border-y">
          {cinemas.data?.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="flex-1 font-medium">{c.name}</span>
              {c.bundleSizes.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
              <ConfirmDelete
                trigger={<Button variant="ghost" size="icon" aria-label={`Delete ${c.name}`}><Trash2 className="size-4" /></Button>}
                title={`Delete ${c.name}?`}
                description="This cannot be undone."
                onConfirm={() => remove.mutate(c.id, { onError: (e) => toast.error(e.message) })}
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Check a booking</h3>
        {cinemas.data && cinemas.data.length > 0 ? (
          <BookingChecker cinemas={cinemas.data} />
        ) : (
          <EmptyState>Add a cinema first to check bookings.</EmptyState>
        )}
      </div>
    </section>
  );
}
