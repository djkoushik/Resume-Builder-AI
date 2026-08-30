
import React from 'react';
import { Language } from '../../types';
import Input from '../ui/Input';
import RemoveButton from '../ui/RemoveButton';
import Select from '../ui/Select';
import { LANGUAGE_FLUENCY } from '../../constants';

interface LanguagesSectionProps {
  languages: Language[];
  onUpdate: (languages: Language[]) => void;
}

const LanguagesSection: React.FC<LanguagesSectionProps> = ({ languages, onUpdate }) => {
  const handleAddItem = () => {
    onUpdate([...languages, { id: Date.now().toString(), language: '', fluency: '' }]);
  };

  const handleRemoveItem = (id: string) => {
    onUpdate(languages.filter(l => l.id !== id));
  };

  const handleChange = (id: string, field: keyof Language, value: string) => {
    onUpdate(languages.map(l => (l.id === id ? { ...l, [field]: value } : l)));
  };

  return (
    <div>
      {languages.map(lang => (
        <div key={lang.id} className="p-4 mb-2 border rounded-md relative bg-gray-50 dark:bg-gray-700">
          <RemoveButton onClick={() => handleRemoveItem(lang.id)} />
          <div className="grid grid-cols-2 gap-4 pr-9">
            <Input label="Language" value={lang.language} onChange={e => handleChange(lang.id, 'language', e.target.value)} />
            <Select label="Fluency" value={lang.fluency} onChange={e => handleChange(lang.id, 'fluency', e.target.value)}>
              <option value=""></option>
              {LANGUAGE_FLUENCY.map(level => <option key={level} value={level}>{level}</option>)}
            </Select>
          </div>
        </div>
      ))}
      <button onClick={handleAddItem} className="mt-2 w-full text-blue-600 dark:text-blue-400 font-medium py-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900">+ Add Language</button>
    </div>
  );
};

export default LanguagesSection;
