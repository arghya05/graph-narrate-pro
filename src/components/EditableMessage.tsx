import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface EditableMessageProps {
  content: string;
  onSave: (newContent: string) => void;
  onCancel: () => void;
}

export const EditableMessage: React.FC<EditableMessageProps> = ({
  content,
  onSave,
  onCancel,
}) => {
  const [editedContent, setEditedContent] = useState(content);

  const handleSave = () => {
    onSave(editedContent);
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={editedContent}
        onChange={(e) => setEditedContent(e.target.value)}
        className="min-h-[100px]"
      />
      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};