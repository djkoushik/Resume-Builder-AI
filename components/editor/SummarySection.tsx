
import React, { useState } from 'react';
import Textarea from '../ui/Textarea';
import { enhanceSummary } from '../../services/geminiService';

interface SummarySectionProps {
  summary: string;
  onUpdate: (summary: string) => void;
}

const SummarySection: React.FC<SummarySectionProps> = ({ summary, onUpdate }) => {
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhance = async () => {
    if (typeof (window as any).checkUserLimit === 'function' && !(window as any).checkUserLimit()) {
      return;
    }
    // FIX: Removed API key check. The service now handles the key from the environment.
    setIsEnhancing(true);
    try {
      // The instruction lives on the server, in api/aiPresets.ts.
      const enhancedSummary = await enhanceSummary(summary);
      onUpdate(enhancedSummary);
    } catch (error) {
      console.error(error);
      // Surfaced verbatim so the rate-limit message reaches the user.
      alert(error instanceof Error ? error.message : "Failed to enhance summary. Check the console for details.");
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <Textarea
      label="Summary"
      id="summary"
      value={summary}
      onChange={(e) => onUpdate(e.target.value)}
      onEnhance={handleEnhance}
      isEnhancing={isEnhancing}
      rows={6}
    />
  );
};

export default SummarySection;