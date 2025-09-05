import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SuggestedQuestionsProps {
  questions: string[];
  onQuestionSelect: (question: string) => void;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({
  questions,
  onQuestionSelect,
}) => {
  if (!questions.length) return null;

  return (
    <div className="mx-4 mb-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Suggested Questions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {questions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              className="text-left justify-start text-wrap h-auto py-2 px-3"
              onClick={() => onQuestionSelect(question)}
            >
              {question}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
};