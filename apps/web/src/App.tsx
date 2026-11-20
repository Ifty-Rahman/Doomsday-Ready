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
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b py-4">
        <h1 className="text-lg font-semibold">Doomsday Ready</h1>
        <nav className="flex gap-4">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "border-b-2 py-1 text-sm transition-colors",
                  isActive ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="pt-6">
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
