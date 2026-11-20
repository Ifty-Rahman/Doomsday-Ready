import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createMovieSchema, MAX_RELEASE_YEAR, MIN_RELEASE_YEAR, MAX_RUNTIME } from "@doomsday/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/Bits";
import { useCreateMovie } from "@/lib/queries";

const formSchema = createMovieSchema
  .pick({ title: true, releaseYear: true, runtime: true })
  .extend({ watched: z.boolean() });
type FormValues = z.infer<typeof formSchema>;

export default function MovieForm() {
  const create = useCreateMovie();
  const {
    register, handleSubmit, reset, setValue, watch, setError, formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", watched: false },
  });

  const onSubmit = handleSubmit((values) =>
    create.mutate({ ...values, prerequisiteIds: [] }, {
      onSuccess: () => reset({ title: "", watched: false }),
      onError: (err) => setError("title", { message: err.message }),
    }),
  );

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-6" noValidate>
      <div className="sm:col-span-6">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="Iron Man" {...register("title")} />
        <FieldError message={errors.title?.message} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="releaseYear">Release year</Label>
        <Input id="releaseYear" type="number" placeholder={String(MIN_RELEASE_YEAR)} {...register("releaseYear", { valueAsNumber: true })} />
        <FieldError message={errors.releaseYear?.message} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="runtime">Runtime (minutes)</Label>
        <Input id="runtime" type="number" placeholder={`1-${MAX_RUNTIME}`} {...register("runtime", { valueAsNumber: true })} />
        <FieldError message={errors.runtime?.message} />
      </div>
      <div className="flex items-end gap-2 pb-2 sm:col-span-2">
        <Checkbox id="watched" checked={!!watch("watched")} onCheckedChange={(v) => setValue("watched", v === true)} />
        <Label htmlFor="watched">Already watched</Label>
      </div>
      <div className="sm:col-span-6">
        <Button type="submit" disabled={create.isPending}>{create.isPending ? "Adding..." : "Add movie"}</Button>
        <span className="text-muted-foreground ml-3 text-sm">Releases {MIN_RELEASE_YEAR}-{MAX_RELEASE_YEAR}</span>
      </div>
    </form>
  );
}
