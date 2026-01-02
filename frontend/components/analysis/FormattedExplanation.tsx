interface FormattedExplanationProps {
  explanation: string;
  className?: string;
}

interface ParsedExplanation {
  mainText: string;
  keyConcerns: string[];
  isSingleConcern: boolean;
}

function parseExplanation(explanation: string): ParsedExplanation {
  // Check if there's a "Key concerns:" section
  const keyConcernsMatch = explanation.match(/Key concerns?:\n([\s\S]*?)$/);

  if (keyConcernsMatch) {
    const mainText = explanation.substring(0, keyConcernsMatch.index).trim();
    const concernsText = keyConcernsMatch[1];

    // Extract bullet points
    const concerns = concernsText
      .split('\n')
      .map(line => line.replace(/^•\s*/, '').trim())
      .filter(line => line.length > 0);

    return {
      mainText,
      keyConcerns: concerns,
      isSingleConcern: false
    };
  }

  // Check if there's a single "Key concern:" (without bullet points)
  const singleConcernMatch = explanation.match(/Key concern:\s*(.+)\.?$/);

  if (singleConcernMatch) {
    const mainText = explanation.substring(0, singleConcernMatch.index).trim();
    const concern = singleConcernMatch[1].trim();

    return {
      mainText,
      keyConcerns: [concern],
      isSingleConcern: true
    };
  }

  // No key concerns found, return the whole explanation as main text
  return {
    mainText: explanation,
    keyConcerns: [],
    isSingleConcern: false
  };
}

export default function FormattedExplanation({ explanation, className = "" }: FormattedExplanationProps) {
  const parsed = parseExplanation(explanation);

  return (
    <div className={className}>
      {/* Main explanation text */}
      {parsed.mainText && (
        <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
          {parsed.mainText}
        </p>
      )}

      {/* Key concerns section */}
      {parsed.keyConcerns.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {parsed.isSingleConcern ? 'Key Concern:' : 'Key Concerns:'}
          </h4>

          {parsed.isSingleConcern ? (
            <p className="text-sm pl-3 border-l-2" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
              {parsed.keyConcerns[0]}
            </p>
          ) : (
            <ul className="space-y-1 pl-2">
              {parsed.keyConcerns.map((concern, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>•</span>
                  <span className="flex-1">{concern}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
