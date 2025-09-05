import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Lightbulb } from 'lucide-react';

interface SuggestedQuestionsProps {
  questions: string[];
  onQuestionSelect: (question: string) => void;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  questions,
  onQuestionSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!questions.length) return null;

  return (
    <div className="mx-4 mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            size="sm"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Suggested Questions
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="p-4 mt-2">
            <div className="grid grid-cols-1 gap-2">
              {questions.map((question, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="text-left justify-start text-wrap h-auto py-2 px-3"
                  onClick={() => onQuestionSelect(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};