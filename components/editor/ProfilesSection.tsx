
import React from 'react';
import { Profile } from '../../types';
import Input from '../ui/Input';
import RemoveButton from '../ui/RemoveButton';
import Select from '../ui/Select';
import { SOCIAL_NETWORKS } from '../../constants';

interface ProfilesSectionProps {
  profiles: Profile[];
  onUpdate: (profiles: Profile[]) => void;
}

const ProfilesSection: React.FC<ProfilesSectionProps> = ({ profiles, onUpdate }) => {
  const handleAddProfile = () => {
    onUpdate([...profiles, { id: Date.now().toString(), network: 'LinkedIn', username: '', url: '' }]);
  };

  const handleRemoveProfile = (id: string) => {
    onUpdate(profiles.filter(p => p.id !== id));
  };

  const handleChange = (id: string, field: keyof Profile, value: string) => {
    onUpdate(profiles.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  return (
    <div>
      {profiles.map((profile, index) => (
        <div key={profile.id} className="p-4 mb-2 border rounded-md relative bg-gray-50 dark:bg-gray-700">
          <RemoveButton onClick={() => handleRemoveProfile(profile.id)} />
          <div className="grid grid-cols-2 gap-4 pr-9">
            <Select
              label="Network"
              id={`profile-network-${index}`}
              value={profile.network}
              onChange={e => handleChange(profile.id, 'network', e.target.value)}
            >
              {SOCIAL_NETWORKS.map(network => <option key={network} value={network}>{network}</option>)}
            </Select>
            <Input
              label="Username"
              id={`profile-username-${index}`}
              value={profile.username}
              onChange={e => handleChange(profile.id, 'username', e.target.value)}
            />
          </div>
          <Input
            label="URL"
            id={`profile-url-${index}`}
            value={profile.url}
            onChange={e => handleChange(profile.id, 'url', e.target.value)}
          />
        </div>
      ))}
      <button
        onClick={handleAddProfile}
        className="mt-2 w-full text-blue-600 dark:text-blue-400 font-medium py-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900"
      >
        + Add Profile
      </button>
    </div>
  );
};

export default ProfilesSection;
