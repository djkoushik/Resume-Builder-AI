import React from 'react';
import { Education } from '../../types';
import Input from '../ui/Input';
import RemoveButton from '../ui/RemoveButton';
import Textarea from '../ui/Textarea';

interface EducationSectionProps {
  education: Education[];
  onUpdate: (education: Education[]) => void;
}

const EducationSection: React.FC<EducationSectionProps> = ({ education, onUpdate }) => {
  const handleAddItem = () => {
    onUpdate([...education, { id: Date.now().toString(), institution: '', degree: '', areaOfStudy: '', startDate: '', endDate: '', summary: '' }]);
  };

  const handleRemoveItem = (id: string) => {
    onUpdate(education.filter(e => e.id !== id));
  };

  const handleChange = (id: string, field: keyof Education, value: string) => {
    onUpdate(education.map(e => (e.id === id ? { ...e, [field]: value } : e)));
  };

  return (
    <div>
      {education.map(edu => (
        <div key={edu.id} className="p-4 mb-2 border rounded-md relative bg-gray-50 dark:bg-gray-700">
          <RemoveButton onClick={() => handleRemoveItem(edu.id)} />
          <Input label="Institution" value={edu.institution} onChange={e => handleChange(edu.id, 'institution', e.target.value)} />
          <Input label="Degree" value={edu.degree} onChange={e => handleChange(edu.id, 'degree', e.target.value)} />
          <Input label="Area of Study / Location" placeholder="e.g. Computer Science or Berkeley, CA" value={edu.areaOfStudy} onChange={e => handleChange(edu.id, 'areaOfStudy', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="text" placeholder="e.g. August 2012" value={edu.startDate} onChange={e => handleChange(edu.id, 'startDate', e.target.value)} />
            <Input label="End Date" type="text" placeholder="e.g. May 2016" value={edu.endDate} onChange={e => handleChange(edu.id, 'endDate', e.target.value)} />
          </div>
          <Textarea label="Summary" value={edu.summary} onChange={e => handleChange(edu.id, 'summary', e.target.value)} />
        </div>
      ))}
      <button onClick={handleAddItem} className="mt-2 w-full text-blue-600 dark:text-blue-400 font-medium py-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900">+ Add Education</button>
    </div>
  );
};

export default EducationSection;