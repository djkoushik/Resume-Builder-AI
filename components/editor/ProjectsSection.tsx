import React from 'react';
import { Project } from '../../types';
import Input from '../ui/Input';
import RemoveButton from '../ui/RemoveButton';
import Textarea from '../ui/Textarea';

interface ProjectsSectionProps {
  projects: Project[];
  onUpdate: (projects: Project[]) => void;
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ projects, onUpdate }) => {
  const handleAddItem = () => {
    onUpdate([...projects, { id: Date.now().toString(), name: '', role: '', description: '', url: '' }]);
  };

  const handleRemoveItem = (id: string) => {
    onUpdate(projects.filter(p => p.id !== id));
  };

  const handleChange = (id: string, field: keyof Project, value: string) => {
    onUpdate(projects.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  return (
    <div>
      {projects.map(project => (
        <div key={project.id} className="p-4 mb-2 border rounded-md relative bg-gray-50 dark:bg-gray-700">
          <RemoveButton onClick={() => handleRemoveItem(project.id)} />
          <Input label="Project Name" value={project.name} onChange={e => handleChange(project.id, 'name', e.target.value)} />
          <Input label="Your Role" value={project.role} onChange={e => handleChange(project.id, 'role', e.target.value)} />
          <Input label="Project URL (Optional)" value={project.url} onChange={e => handleChange(project.id, 'url', e.target.value)} />
          <Textarea label="Description" value={project.description} onChange={e => handleChange(project.id, 'description', e.target.value)} />
        </div>
      ))}
      <button onClick={handleAddItem} className="mt-2 w-full text-blue-600 dark:text-blue-400 font-medium py-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900">+ Add Project</button>
    </div>
  );
};

export default ProjectsSection;