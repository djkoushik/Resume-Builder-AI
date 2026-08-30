import React, { useState, useEffect } from 'react';
import { Skill } from '../../types';
import Input from '../ui/Input';
import RemoveButton from '../ui/RemoveButton';

interface SkillsSectionProps {
  skills: Skill[];
  onUpdate: (skills: Skill[]) => void;
}

// A custom input component to handle the comma-separated keywords.
// It uses local state to allow free editing and updates the parent state on blur.
const KeywordsInput: React.FC<{
  initialKeywords: string[];
  onUpdate: (keywords: string[]) => void;
}> = ({ initialKeywords, onUpdate }) => {
  const [value, setValue] = useState(initialKeywords.join(', '));

  // Effect to sync the local state if the parent prop changes from an external source.
  useEffect(() => {
    setValue(initialKeywords.join(', '));
  }, [initialKeywords]);
  
  const handleBlur = () => {
    // On blur, parse the string into an array, clean it up, and send to parent.
    const newKeywords = value.split(',').map(k => k.trim()).filter(Boolean);
    
    // Also, update the local input value to the cleaned-up version for consistency.
    setValue(newKeywords.join(', '));

    // Only call the update function if the keywords have actually changed.
    if (JSON.stringify(newKeywords) !== JSON.stringify(initialKeywords)) {
      onUpdate(newKeywords);
    }
  };

  return (
    <Input
      label="Skills (comma-separated)"
      placeholder="e.g. HTML5, CSS3, JavaScript"
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={handleBlur}
    />
  );
};


const SkillsSection: React.FC<SkillsSectionProps> = ({ skills, onUpdate }) => {
  const handleAddItem = () => {
    onUpdate([...skills, { id: Date.now().toString(), name: '', keywords: [] }]);
  };

  const handleRemoveItem = (id: string) => {
    onUpdate(skills.filter(s => s.id !== id));
  };

  const handleChange = (id: string, field: keyof Skill, value: string | string[]) => {
    onUpdate(skills.map(s => (s.id === id ? { ...s, [field]: value } : s)));
  };

  return (
    <div>
      {skills.map(skill => (
        <div key={skill.id} className="p-4 mb-2 border rounded-md relative bg-gray-50 dark:bg-gray-700">
          <RemoveButton onClick={() => handleRemoveItem(skill.id)} />
          <Input label="Category Name" placeholder="e.g. Web Technologies" value={skill.name} onChange={e => handleChange(skill.id, 'name', e.target.value)} />
          <KeywordsInput 
            initialKeywords={skill.keywords} 
            onUpdate={newKeywords => handleChange(skill.id, 'keywords', newKeywords)} 
          />
        </div>
      ))}
      <button onClick={handleAddItem} className="mt-2 w-full text-blue-600 dark:text-blue-400 font-medium py-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900">+ Add Skill</button>
    </div>
  );
};

export default SkillsSection;