import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BookingQuote, Cinema, CreateCinemaInput, CreateMovieInput, Movie, RewatchOrder, UpdateMovieInput,
} from "@doomsday/shared";
import { api } from "./api";

const json = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });

export const useMovies = () => useQuery({ queryKey: ["movies"], queryFn: () => api<Movie[]>("/movies") });

export const useRewatchOrder = (movieId: number | null) =>
  useQuery({
    queryKey: ["rewatch-order", movieId],
    queryFn: () => api<RewatchOrder>(`/movies/${movieId}/rewatch-order`),
    enabled: movieId !== null,
  });

// Any change to movies can change every rewatch order, so refresh both.
function useMovieMutation<TVars, TData = unknown>(fn: (vars: TVars) => Promise<TData>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["movies"] });
      qc.invalidateQueries({ queryKey: ["rewatch-order"] });
    },
  });
}

export const useCreateMovie = () =>
  useMovieMutation((input: CreateMovieInput) => api<Movie>("/movies", json("POST", input)));

export const useUpdateMovie = () =>
  useMovieMutation(({ id, ...input }: UpdateMovieInput & { id: number }) =>
    api<Movie>(`/movies/${id}`, json("PATCH", input)),
  );

export const useDeleteMovie = () => useMovieMutation((id: number) => api<void>(`/movies/${id}`, { method: "DELETE" }));

export const useCinemas = () => useQuery({ queryKey: ["cinemas"], queryFn: () => api<Cinema[]>("/cinemas") });

export function useCreateCinema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCinemaInput) => api<Cinema>("/cinemas", json("POST", input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cinemas"] }),
  });
}

export function useDeleteCinema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<void>(`/cinemas/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cinemas"] }),
  });
}

export const useBookingQuote = () =>
  useMutation({
    mutationFn: ({ cinemaId, groupSize }: { cinemaId: number; groupSize: number }) =>
      api<BookingQuote>(`/cinemas/${cinemaId}/booking?groupSize=${groupSize}`),
  });
