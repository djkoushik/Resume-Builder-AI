
import React from 'react';
import { CustomizationSettings } from '../../types';
import { COLOR_PALETTES } from '../../constants';

interface ColorTabProps {
  settings: CustomizationSettings;
  onUpdate: (settings: CustomizationSettings) => void;
  isCoverLetter?: boolean;
}

const ColorInput: React.FC<{ label: string, value: string, onChange: (value: string) => void }> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between mb-2">
    <label className="text-sm">{label}</label>
    <div className="relative">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600" />
    </div>
  </div>
);


const ColorTab: React.FC<ColorTabProps> = ({ settings, onUpdate, isCoverLetter }) => {
  const handleColorChange = (colorName: keyof CustomizationSettings['colors'], value: string) => {
    onUpdate({
      ...settings,
      colors: {
        ...settings.colors,
        [colorName]: value
      }
    });
  }

  const handlePaletteSelect = (palette: typeof COLOR_PALETTES[0]) => {
    onUpdate({
      ...settings,
      colors: {
        primary: palette.primary,
        text: palette.text,
        background: palette.background,
        sidebarText: palette.sidebarText,
      }
    });
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">Color Palettes</h3>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {COLOR_PALETTES.map((palette) => (
          <div key={palette.name} onClick={() => handlePaletteSelect(palette)} className="cursor-pointer group" aria-label={`Select ${palette.name} color palette`}>
            <div className="flex h-10 rounded-md overflow-hidden border border-gray-300 dark:border-gray-600 group-hover:scale-105 transition-transform duration-200">
              <div style={{ backgroundColor: palette.primary }} className="w-2/5 h-full" title={`Primary: ${palette.primary}`}></div>
              <div style={{ backgroundColor: palette.background }} className="w-3/5 h-full flex items-center justify-center" title={`Background: ${palette.background}`}>
                <div style={{ backgroundColor: palette.text }} className="w-5 h-5 rounded-full" title={`Text: ${palette.text}`}></div>
              </div>
            </div>
            <p className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400">{palette.name}</p>
          </div>
        ))}
      </div>

      <h3 className="font-semibold mb-4">Custom Colors</h3>
      <ColorInput label="Primary Color" value={settings.colors.primary} onChange={(val) => handleColorChange('primary', val)} />
      <ColorInput label="Background Color" value={settings.colors.background} onChange={(val) => handleColorChange('background', val)} />
      <ColorInput label="Text Color" value={settings.colors.text} onChange={(val) => handleColorChange('text', val)} />
      {!isCoverLetter && (
        <ColorInput label="Sidebar Text Color" value={settings.colors.sidebarText} onChange={(val) => handleColorChange('sidebarText', val)} />
      )}
    </div>
  );
};

export default ColorTab;
