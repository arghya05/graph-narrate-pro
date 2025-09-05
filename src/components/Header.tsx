import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, GitCompare, Eye } from 'lucide-react';

export function Header() {
  return (
    <header className="h-12 bg-primary border-b border-primary flex items-center justify-between px-4 z-50">
      {/* Left side - Logo */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
            <span className="text-black font-bold text-sm">⚡</span>
          </div>
          <span className="font-semibold text-primary-foreground">datagpt</span>
        </div>
      </div>

      {/* Center - Empty space */}
      <div className="flex-1"></div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20"
        >
          <MessageCircle className="h-3 w-3 mr-1" />
          Chat Mode
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20"
        >
          <GitCompare className="h-3 w-3 mr-1" />
          Comparison
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs bg-white/10 border-white/20 text-primary-foreground hover:bg-white/20"
        >
          <Eye className="h-3 w-3 mr-1" />
          Observation
        </Button>
      </div>
    </header>
  );
}