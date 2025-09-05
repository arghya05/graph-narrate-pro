import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, GitCompare, Eye, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
}

export function Header({ onMenuClick, sidebarCollapsed }: HeaderProps) {
  return (
    <header className="h-12 bg-header-background border-b border-header-border flex items-center justify-between px-4 z-50">
      {/* Left side - Logo and menu */}
      <div className="flex items-center gap-4">
        {!sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-8 w-8 text-header-foreground hover:bg-secondary"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
            <span className="text-black font-bold text-sm">⚡</span>
          </div>
          <span className="font-semibold text-header-foreground">datagpt</span>
        </div>
      </div>

      {/* Center - Current page */}
      <div className="flex items-center gap-2 text-header-foreground">
        <span className="text-sm text-muted-foreground">&lt;</span>
        <span className="text-sm">Marketing</span>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs bg-transparent border-border text-header-foreground hover:bg-secondary"
        >
          <MessageCircle className="h-3 w-3 mr-1" />
          Chat Mode
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs bg-transparent border-border text-header-foreground hover:bg-secondary"
        >
          <GitCompare className="h-3 w-3 mr-1" />
          Comparison
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs bg-transparent border-border text-header-foreground hover:bg-secondary"
        >
          <Eye className="h-3 w-3 mr-1" />
          Observation
        </Button>
      </div>
    </header>
  );
}