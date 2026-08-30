interface SuggestedQuestionsProps {
  context?: string;
  onQuestionClick: (question: string) => void;
}

const contextQuestions: Record<string, string[]> = {
  dataset: [
    'Summarize this dataset',
    'What are the most important columns?',
    'Are there any unusual patterns?',
    'What analyses would you recommend?',
    'Identify potential data quality issues',
  ],
  analysis: [
    'What does this visualization tell me?',
    'Explain the key patterns shown here',
    'What are the notable differences?',
    'What should I investigate next?',
    'How should I interpret these results?',
  ],
  model: [
    'Explain this model performance',
    'Which features are most important?',
    'How could this model be improved?',
    'What are the model limitations?',
    'Compare this with other models',
  ],
  decision: [
    'Explain this prediction',
    'What factors influenced this decision?',
    'How confident is this result?',
    'What are the alternative scenarios?',
    'What should I do next?',
  ],
};

const defaultQuestions = [
  'What insights can you find?',
  'Summarize the key findings',
  'What patterns do you notice?',
  'What should I investigate?',
  'Explain the main trends',
];

export const SuggestedQuestions = ({ context, onQuestionClick }: SuggestedQuestionsProps) => {
  const questions = contextQuestions[context || 'dataset'] || defaultQuestions;

  return (
    <div className="rounded-lg border border-border bg-card p-4 animate-fade-in">
      <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
        <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Suggested Questions
      </h4>
      <div className="space-y-2">
        {questions.map((question, i) => (
          <button
            key={i}
            onClick={() => onQuestionClick(question)}
            className="w-full text-left rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
};
