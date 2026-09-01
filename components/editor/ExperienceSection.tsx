import React, { useState } from 'react';
import { WorkExperience } from '../../types';
import Input from '../ui/Input';
import RemoveButton from '../ui/RemoveButton';
import Textarea from '../ui/Textarea';
import { enhanceExperience } from '../../services/geminiService';

interface ExperienceSectionProps {
  experience: WorkExperience[];
  onUpdate: (experience: WorkExperience[]) => void;
}

const ExperienceSection: React.FC<ExperienceSectionProps> = ({ experience, onUpdate }) => {
  const [enhancingId, setEnhancingId] = useState<string | null>(null);

  const handleAddItem = () => {
    onUpdate([...experience, { id: Date.now().toString(), company: '', project: '', position: '', location: '', startDate: '', endDate: '', isCurrent: false, summary: '' }]);
  };

  const handleRemoveItem = (id: string) => {
    onUpdate(experience.filter(e => e.id !== id));
  };

  const handleChange = (id: string, field: keyof WorkExperience, value: string | boolean) => {
    onUpdate(experience.map(e => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const handleEnhance = async (id: string, text: string) => {
    if (typeof (window as any).checkUserLimit === 'function' && !(window as any).checkUserLimit()) {
      return;
    }
    // FIX: Removed API key check. The service now handles the key from the environment.
    setEnhancingId(id);
    try {
      // The instruction lives on the server, in api/aiPresets.ts.
      const enhancedSummary = await enhanceExperience(text);
      handleChange(id, 'summary', enhancedSummary);
    } catch (error) {
      console.error(error);
      // Surfaced verbatim so the rate-limit message reaches the user.
      alert(error instanceof Error ? error.message : "Failed to enhance summary. Check the console for details.");
    } finally {
      setEnhancingId(null);
    }
  };


  return (
    <div>
      {experience.map(exp => (
        <div key={exp.id} className="p-4 mb-2 border rounded-md relative bg-gray-50 dark:bg-gray-700">
          <RemoveButton onClick={() => handleRemoveItem(exp.id)} />
          <Input label="Company" value={exp.company} onChange={e => handleChange(exp.id, 'company', e.target.value)} />
          <Input label="Project (Optional)" value={exp.project || ''} onChange={e => handleChange(exp.id, 'project', e.target.value)} />
          <Input label="Position" value={exp.position} onChange={e => handleChange(exp.id, 'position', e.target.value)} />
          <Input label="Company Website (Optional)" value={exp.url || ''} onChange={e => handleChange(exp.id, 'url', e.target.value)} />
          <Input label="Location" value={exp.location} onChange={e => handleChange(exp.id, 'location', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="text" placeholder="e.g. January 2019" value={exp.startDate} onChange={e => handleChange(exp.id, 'startDate', e.target.value)} />
            <Input label="End Date" type="text" placeholder="e.g. Present" value={exp.endDate} onChange={e => handleChange(exp.id, 'endDate', e.target.value)} disabled={exp.isCurrent} />
          </div>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id={`current-job-${exp.id}`}
              checked={exp.isCurrent}
              onChange={e => handleChange(exp.id, 'isCurrent', e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={`current-job-${exp.id}`} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">I currently work here</label>
          </div>
          <Textarea
            label="Summary / Achievements"
            value={exp.summary}
            onChange={e => handleChange(exp.id, 'summary', e.target.value)}
            onEnhance={() => handleEnhance(exp.id, exp.summary)}
            isEnhancing={enhancingId === exp.id}
          />
        </div>
      ))}
      <button onClick={handleAddItem} className="mt-2 w-full text-blue-600 dark:text-blue-400 font-medium py-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900">+ Add Experience</button>
    </div>
  );
};

export default ExperienceSection;