import { Link, useLocation } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, BarChart3, Database } from 'lucide-react';

const dashboards = [
  { name: 'Marketing', href: '/', active: true },
  { name: 'Operations...', href: '/operations' },
  { name: 'Payments &...', href: '/payments' },
  { name: 'Product &...', href: '/product' },
  { name: 'Medicare/Medical...', href: '/medicare' },
];

const schemas = [
  { name: 'Schemas', href: '/schemas' },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const location = useLocation();

  if (collapsed) {
    return (
      <div className="w-16 bg-sidebar-background border-r border-sidebar-border flex flex-col h-full">
        <div className="p-4">
          <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
            <span className="text-black font-bold text-xs">⚡</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
            <span className="text-black font-bold text-xs">⚡</span>
          </div>
          <span className="font-semibold text-sidebar-foreground">datagpt</span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4">
        <nav className="space-y-6">
          {/* Dashboards Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Dashboards</span>
            </div>
            <div className="space-y-1 ml-6">
              {dashboards.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      block px-2 py-1.5 text-sm rounded-md transition-colors
                      ${isActive 
                        ? 'text-sidebar-foreground font-medium' 
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                      }
                    `}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Schemas Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-4 w-4 text-sidebar-foreground/70" />
              <span className="text-sm font-medium text-sidebar-foreground/70">Schemas</span>
            </div>
          </div>
        </nav>
      </ScrollArea>
    </div>
  );
}