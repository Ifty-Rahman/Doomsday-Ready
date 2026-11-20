import MovieForm from "@/components/MovieForm";
import MovieItem from "@/components/MovieItem";
import { EmptyState, ErrorMessage, Loading, PageTitle } from "@/components/Bits";
import { useMovies } from "@/lib/queries";

export default function MoviesPage() {
  const movies = useMovies();

  return (
    <section className="space-y-8">
      <PageTitle title="Movies" subtitle="Add movies, set what to watch first, and tick what you have seen." />
      <MovieForm />

      <div className="space-y-3">
        <h3 className="font-medium">Your movies</h3>
        {movies.isLoading && <Loading />}
        {movies.isError && <ErrorMessage error={movies.error} />}
        {movies.data?.length === 0 && <EmptyState>No movies yet. Add your first one above.</EmptyState>}
        {movies.data && movies.data.length === 1 && (
          <p className="text-muted-foreground text-sm">Add one more movie to start setting prerequisites.</p>
        )}
        <ul className="divide-y border-y">
          {movies.data?.map((m) => <MovieItem key={m.id} movie={m} allMovies={movies.data} />)}
        </ul>
      </div>
    </section>
  );
}
