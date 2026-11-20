import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import RewatchOrderPage from "@/pages/RewatchOrderPage";
import MoviesPage from "@/pages/MoviesPage";
import CinemasPage from "@/pages/CinemasPage";

const links = [
  { to: "/rewatch", label: "Rewatch Order" },
  { to: "/movies", label: "Movies" },
  { to: "/cinemas", label: "Cinemas" },
];

export default function App() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b py-6">
        <h1 className="text-4xl text-primary sm:text-5xl">
          Doomsday <span className="text-foreground">Ready</span>
        </h1>
        <nav className="flex gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "font-heading rounded-md px-4 py-2 text-xl tracking-wider transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="pt-8">
        <Routes>
          <Route path="/" element={<Navigate to="/rewatch" replace />} />
          <Route path="/rewatch" element={<RewatchOrderPage />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/cinemas" element={<CinemasPage />} />
          <Route path="*" element={<Navigate to="/rewatch" replace />} />
        </Routes>
      </main>
      <Toaster theme="dark" />
    </div>
  );
}
