import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Database, Eye } from 'lucide-react';

interface DataPreviewModalProps {
  data: Record<string, any>[];
}

export function DataPreviewModal({ data }: DataPreviewModalProps) {
  const [open, setOpen] = useState(false);

  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);
  const previewRows = data.slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Eye className="h-3 w-3 mr-2" />
          View Data ({data.length} rows)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Preview
            <Badge variant="outline" className="ml-2">
              {data.length} rows × {columns.length} columns
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium text-muted-foreground bg-background">
                    #
                  </th>
                  {columns.map((column) => (
                    <th key={column} className="text-left p-3 font-medium text-muted-foreground bg-background min-w-[120px]">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 text-muted-foreground font-mono text-xs">
                      {index + 1}
                    </td>
                    {columns.map((column) => (
                      <td key={column} className="p-3 text-foreground">
                        <div className="max-w-[200px] truncate" title={String(row[column])}>
                          {String(row[column])}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.length > 10 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Showing first 10 of {data.length} rows
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}