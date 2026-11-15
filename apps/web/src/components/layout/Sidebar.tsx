import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Search,
  Target,
  Award,
  Calendar,
  Kanban,
  BarChart2,
  Brain,
  Library,
  HelpCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FlaskConical,
  PenTool,
  Mic2,
  Network,
  AlertTriangle,
  Zap,
  GitCompare,
  Sigma,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useProfileStore, useUIStore } from "@/store";
import { PrismaMark } from "@/components/PrismaMark";
import { cn } from "@/utils/helpers";

const groups = [
  {
    label: "Seu espaço",
    items: [
      ["/dashboard", "Visão geral", LayoutDashboard],
      ["/atlas", "Atlas", Network],
      ["/lia", "LIA", Sparkles],
    ],
  },
  {
    label: "Estudar",
    items: [
      ["/learn", "Aprender", BookOpen],
      ["/recall", "Recall", Brain],
      ["/questions", "Questões", HelpCircle],
      ["/exams", "Simulados", Award],
      ["/error-lab", "Caderno de erros", AlertTriangle],
      ["/focus", "Foco", Target],
    ],
  },
  {
    label: "Conhecimento",
    items: [
      ["/library", "Biblioteca", Library],
      ["/search", "Busca", Search],
      ["/reader", "Leitor", FileText],
      ["/compare", "Comparar", GitCompare],
      ["/formula", "Fórmulas", Sigma],
      ["/exam-intel", "Análise de provas", BarChart2],
      ["/active-learning", "Aprendizagem ativa", Zap],
    ],
  },
  {
    label: "Organizar e criar",
    items: [
      ["/planner", "Planner", Calendar],
      ["/projects", "Projetos", Kanban],
      ["/forecast", "Previsão", BarChart2],
      ["/studio", "Studio", PenTool],
      ["/board", "Quadro", PenTool],
      ["/lab", "Laboratório", FlaskConical],
      ["/oral", "Banca oral", Mic2],
    ],
  },
] as const;

export function Sidebar() {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarOpen,
    setSidebarOpen,
    isMobile,
  } = useUIStore();
  const profile = useProfileStore((state) => state.currentProfile);
  const [closed, setClosed] = useState<string[]>([]);
  const location = useLocation();
  const compact = sidebarCollapsed && !isMobile;
  if (isMobile && !sidebarOpen) return null;
  return (
    <>
      {isMobile && (
        <button
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          aria-label="Fechar navegação"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn("sidebar flex flex-col", compact ? "w-16" : "w-64")}
        aria-label="Navegação principal"
      >
        <div className={cn("sidebar-brand", compact && "!px-4")}>
          <NavLink
            to="/dashboard"
            className="prisma-wordmark"
            aria-label="Prisma — início"
          >
            <PrismaMark size={27} />
            {!compact && (
              <span>
                PRISMA
                <span className="block text-[8px] tracking-[.25em] text-text-muted mt-1 font-normal">
                  UM UNIVERSO DE CONHECIMENTO
                </span>
              </span>
            )}
          </NavLink>
          {!compact && (
            <button
              className="icon-button hidden lg:flex !w-6"
              onClick={() => setSidebarCollapsed(true)}
              aria-label="Recolher navegação"
            >
              <ChevronLeft size={14} />
            </button>
          )}
        </div>
        {compact && (
          <button
            className="icon-button mx-auto mb-2"
            aria-label="Expandir navegação"
            onClick={() => setSidebarCollapsed(false)}
          >
            <ChevronRight />
          </button>
        )}
        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Módulos">
          {groups.map((group) => {
            const hasActive = group.items.some(
              ([to]) => location.pathname === to,
            );
            const expanded =
              compact || !closed.includes(group.label) || hasActive;
            return (
              <div key={group.label}>
                {!compact && (
                  <button
                    className="nav-section-title w-full"
                    aria-expanded={expanded}
                    onClick={() =>
                      setClosed((values) =>
                        values.includes(group.label)
                          ? values.filter((value) => value !== group.label)
                          : [...values, group.label],
                      )
                    }
                  >
                    {group.label}
                    <ChevronDown
                      size={11}
                      style={{
                        transform: expanded ? undefined : "rotate(-90deg)",
                      }}
                    />
                  </button>
                )}
                {compact && <div className="h-3" />}
                {expanded && (
                  <ul>
                    {group.items.map(([to, label, Icon]) => (
                      <li key={to}>
                        <NavLink
                          to={to}
                          title={compact ? label : undefined}
                          onClick={() => {
                            if (isMobile) setSidebarOpen(false);
                          }}
                          aria-label={compact ? label : undefined}
                          className={({ isActive }) =>
                            cn(
                              "nav-item",
                              isActive && "nav-item-active",
                              compact && "!px-2 justify-center",
                            )
                          }
                        >
                          <Icon />
                          {!compact && (
                            <>
                              <span className="flex-1">{label}</span>
                              {to === "/atlas" && (
                                <span className="text-[8px] font-mono border border-accent/20 px-1.5 py-0.5 rounded">
                                  3D
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t border-border">
          <NavLink
            to="/settings"
            title={compact ? "Configurações" : undefined}
            aria-label="Configurações"
            onClick={() => {
              if (isMobile) setSidebarOpen(false);
            }}
            className={({ isActive }) =>
              cn(
                "nav-item",
                isActive && "nav-item-active",
                compact && "justify-center !px-2",
              )
            }
          >
            <Settings />
            {!compact && "Configurações"}
          </NavLink>
          <NavLink
            to="/help"
            title={compact ? "Ajuda" : undefined}
            aria-label="Ajuda"
            onClick={() => {
              if (isMobile) setSidebarOpen(false);
            }}
            className={({ isActive }) =>
              cn(
                "nav-item",
                isActive && "nav-item-active",
                compact && "justify-center !px-2",
              )
            }
          >
            <HelpCircle />
            {!compact && "Ajuda"}
          </NavLink>
        </div>
        {!compact && (
          <NavLink
            to="/settings"
            className="profile-card flex items-center gap-3"
            onClick={() => {
              if (isMobile) setSidebarOpen(false);
            }}
          >
            <span className="w-8 h-8 rounded-full bg-accent-bg text-accent flex items-center justify-center text-xs">
              {profile?.name.slice(0, 1).toUpperCase() ?? "P"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs truncate">
                {profile?.name ?? "Seu perfil"}
              </p>
              <p className="text-[9px] text-text-muted mt-1">
                Espaço pessoal de estudos
              </p>
            </div>
            <ChevronRight size={13} className="text-text-muted" />
          </NavLink>
        )}
      </aside>
    </>
  );
}
