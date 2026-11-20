import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { groupSizeSchema, MAX_GROUP_SIZE, type Cinema } from "@doomsday/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorMessage, FieldError } from "@/components/Bits";
import { useBookingQuote } from "@/lib/queries";

const formSchema = z.object({
  cinemaId: z.string().min(1, "Pick a cinema"),
  groupSize: groupSizeSchema,
});
type FormIn = z.input<typeof formSchema>;
type FormOut = z.output<typeof formSchema>;

export default function BookingChecker({ cinemas }: { cinemas: Cinema[] }) {
  const quote = useBookingQuote();
  const { control, register, handleSubmit, formState: { errors } } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(formSchema),
    defaultValues: { cinemaId: "" },
  });

  const onSubmit = handleSubmit((v) => quote.mutate({ cinemaId: Number(v.cinemaId), groupSize: v.groupSize }));
  const result = quote.data;

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-3" noValidate>
        <div className="grid content-start gap-2">
          <Label>Cinema</Label>
          <Controller
            control={control}
            name="cinemaId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full" aria-label="Cinema"><SelectValue placeholder="Pick a cinema..." /></SelectTrigger>
                <SelectContent>
                  {cinemas.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError message={errors.cinemaId?.message} />
        </div>
        <div className="grid content-start gap-2">
          <Label htmlFor="group-size">Group size</Label>
          <Input id="group-size" type="number" placeholder={`1-${MAX_GROUP_SIZE}`} {...register("groupSize")} />
          <FieldError message={errors.groupSize?.message} />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={quote.isPending}>Check bundles</Button>
        </div>
      </form>

      {quote.isError && <ErrorMessage error={quote.error} />}

      {result && (
        <div className="rounded-md border p-4" aria-live="polite">
          {result.possible ? (
            <>
              <p className="font-medium">
                {result.totalBundles} {result.totalBundles === 1 ? "bundle" : "bundles"} for {result.groupSize} seats
              </p>
              <ul className="mt-2 space-y-1">
                {result.bundles.map((b) => (
                  <li key={b.size}>{b.size} seats × <strong>{b.count}</strong></li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-destructive">Not possible: no exact combination for {result.groupSize} seats.</p>
          )}
        </div>
      )}
    </div>
  );
}
