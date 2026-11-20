import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { bundleSize, createCinemaSchema, MAX_BUNDLES_PER_CINEMA, type CreateCinemaInput } from "@doomsday/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/Bits";
import { useCreateCinema } from "@/lib/queries";

export default function CinemaForm() {
  const create = useCreateCinema();
  const [sizeInput, setSizeInput] = useState("");
  const [sizeError, setSizeError] = useState<string>();

  const {
    register, handleSubmit, reset, setValue, watch, setError, formState: { errors },
  } = useForm<CreateCinemaInput>({
    resolver: zodResolver(createCinemaSchema),
    defaultValues: { name: "", bundleSizes: [] },
  });
  const sizes = watch("bundleSizes");

  const addSize = () => {
    const parsed = bundleSize.safeParse(sizeInput.trim() === "" ? NaN : Number(sizeInput));
    if (!parsed.success) return setSizeError(parsed.error.issues[0].message);
    if (sizes.includes(parsed.data)) return setSizeError(`${parsed.data} is already added`);
    if (sizes.length >= MAX_BUNDLES_PER_CINEMA) return setSizeError(`At most ${MAX_BUNDLES_PER_CINEMA} bundle sizes`);
    setValue("bundleSizes", [...sizes, parsed.data].sort((a, b) => a - b), { shouldValidate: errors.bundleSizes !== undefined });
    setSizeInput("");
    setSizeError(undefined);
  };

  const onSubmit = handleSubmit((values) =>
    create.mutate(values, {
      onSuccess: () => reset({ name: "", bundleSizes: [] }),
      onError: (err) => setError("name", { message: err.message }),
    }),
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="cinema-name">Cinema name</Label>
        <Input id="cinema-name" placeholder="Star Cineplex" {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="bundle-size">Bundle sizes (seats per bundle)</Label>
        <div className="flex gap-2">
          <Input
            id="bundle-size"
            type="number"
            placeholder="e.g. 5"
            value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSize(); } }}
          />
          <Button type="button" variant="outline" onClick={addSize}>Add size</Button>
        </div>
        <FieldError message={sizeError} />
        <div className="flex min-h-8 flex-wrap gap-2">
          {sizes.length === 0 && <span className="text-muted-foreground text-sm">No sizes added yet</span>}
          {sizes.map((s) => (
            <Badge key={s} variant="secondary" className="gap-1 text-sm">
              {s} seats
              <button
                type="button"
                aria-label={`Remove size ${s}`}
                onClick={() => setValue("bundleSizes", sizes.filter((x) => x !== s))}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <FieldError message={errors.bundleSizes?.message ?? errors.bundleSizes?.root?.message} />
      </div>

      <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving..." : "Save cinema"}</Button>
    </form>
  );
}
