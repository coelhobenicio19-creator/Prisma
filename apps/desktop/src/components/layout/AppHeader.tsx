import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Menu, Sun, Moon, Sparkles, ChevronRight } from "lucide-react";
import { useProfileStore, useUIStore } from "@/store";

const titles: Record<string, string> = {
  dashboard: "Visão geral",
  atlas: "Atlas",
  library: "Biblioteca",
  search: "Busca",
  learn: "Aprender",
  exams: "Simulados",
  recall: "Recall",
  questions: "Questões",
  "error-lab": "Caderno de erros",
  "exam-intel": "Análise de provas",
  "active-learning": "Aprendizagem ativa",
  reader: "Leitor",
  compare: "Comparar",
  formula: "Fórmulas",
  board: "Quadro",
  focus: "Foco",
  planner: "Planner",
  projects: "Projetos",
  forecast: "Previsão",
  studio: "Studio",
  lab: "Laboratório",
  oral: "Banca oral",
  lia: "LIA",
  settings: "Configurações",
  help: "Ajuda",
  onboarding: "Seu perfil",
  school: "Escola",
};

export function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme, setIsMobile, setSidebarOpen } = useUIStore();
  const profile = useProfileStore((state) => state.currentProfile);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const update = () => {
      setIsMobile(media.matches);
      if (media.matches) setSidebarOpen(false);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [setIsMobile, setSidebarOpen]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.classList.toggle("light", !dark);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [theme]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        navigate("/search");
      }
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, setSidebarOpen]);

  return (
    <header className="app-header">
      <div className="flex items-center gap-3 min-w-0">
        <button
          className="icon-button lg:hidden"
          aria-label="Abrir navegação"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu />
        </button>
        <div className="app-breadcrumb">
          <span className="hidden sm:inline">Meu espaço</span>
          <ChevronRight size={12} className="hidden sm:block" />
          <strong>{titles[pathname.split("/")[1]] ?? "PRISMA"}</strong>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="app-search"
          onClick={() => navigate("/search")}
          aria-label="Buscar no Prisma"
        >
          <Search size={14} />
          <span>Buscar no seu conhecimento</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button
          className="icon-button"
          aria-label="Alternar tema"
          onClick={() =>
            setTheme(
              document.documentElement.classList.contains("light")
                ? "dark"
                : "light",
            )
          }
        >
          <Sun className="hidden dark:block" />
          <Moon className="dark:hidden" />
        </button>
        <button
          className="icon-button"
          aria-label="Abrir assistente LIA"
          onClick={() => navigate("/lia")}
        >
          <Sparkles />
        </button>
        <button
          className="w-8 h-8 rounded-full bg-accent-bg text-accent text-xs ml-1 border border-accent/20"
          aria-label="Configurar perfil"
          onClick={() => navigate("/settings")}
        >
          {profile?.name.slice(0, 1).toUpperCase() ?? "P"}
        </button>
      </div>
    </header>
  );
}
