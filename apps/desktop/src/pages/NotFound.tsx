import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Home, Search, AlertTriangle, RotateCcw } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="p-12 text-center max-w-md">
        <div className="w-20 h-20 mx-auto rounded-full bg-error/10 flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-error" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Página não encontrada</h1>
        <p className="text-text-muted mb-6">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="primary" asChild>
            <Link to="/dashboard">
              <Home className="w-4 h-4 mr-1" />
              Ir para Dashboard
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/search">
              <Search className="w-4 h-4 mr-1" />
              Buscar
            </Link>
          </Button>
        </div>
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-text-muted">
            Acha que isso é um erro?
            <Button variant="ghost" size="sm" className="ml-1 p-0">
              <RotateCcw className="w-3 h-3 mr-1" />
              Recarregar
            </Button>
          </p>
        </div>
      </Card>
    </div>
  );
}