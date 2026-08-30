import React from 'react';
import { Certification } from '../../types';
import Input from '../ui/Input';
import RemoveButton from '../ui/RemoveButton';

interface CertificationsSectionProps {
  certifications: Certification[];
  onUpdate: (certifications: Certification[]) => void;
}

const CertificationsSection: React.FC<CertificationsSectionProps> = ({ certifications, onUpdate }) => {
  const handleAddItem = () => {
    onUpdate([...certifications, { id: Date.now().toString(), name: '', issuer: '', date: '' }]);
  };

  const handleRemoveItem = (id: string) => {
    onUpdate(certifications.filter(c => c.id !== id));
  };

  const handleChange = (id: string, field: keyof Certification, value: string) => {
    onUpdate(certifications.map(c => (c.id === id ? { ...c, [field]: value } : c)));
  };

  return (
    <div>
      {certifications.map(cert => (
        <div key={cert.id} className="p-4 mb-2 border rounded-md relative bg-gray-50 dark:bg-gray-700">
          <RemoveButton onClick={() => handleRemoveItem(cert.id)} />
          <Input label="Certification Name" value={cert.name} onChange={e => handleChange(cert.id, 'name', e.target.value)} />
          <Input label="Issuer" value={cert.issuer} onChange={e => handleChange(cert.id, 'issuer', e.target.value)} />
          <Input label="Date" placeholder="e.g. 2020" value={cert.date} onChange={e => handleChange(cert.id, 'date', e.target.value)} />
        </div>
      ))}
      <button onClick={handleAddItem} className="mt-2 w-full text-blue-600 dark:text-blue-400 font-medium py-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900">+ Add Certification</button>
    </div>
  );
};

export default CertificationsSection;