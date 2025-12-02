
import React from 'react';
import { CustomizationSettings } from '../../types';
import { GOOGLE_FONTS, FONT_WEIGHTS, FONT_STYLES } from '../../constants';
import Select from '../ui/Select';

interface TypographyTabProps {
    settings: CustomizationSettings;
    onUpdate: (settings: CustomizationSettings) => void;
    isCoverLetter?: boolean;
}

const FontSizeInput: React.FC<{
    label: string,
    value: number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}> = ({ label, value, onChange }) => (
    <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <input
            type="number"
            value={value}
            onChange={onChange}
            className="w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm"
        />
    </div>
);


const TypographyTab: React.FC<TypographyTabProps> = ({ settings, onUpdate, isCoverLetter }) => {

    const handleLineHeightChange = (value: string) => {
        const newHeight = parseFloat(value);
        if (isNaN(newHeight)) return;
        onUpdate({
            ...settings,
            typography: {
                ...settings.typography,
                lineHeight: newHeight
            }
        });
    }

    const handleFontSizeChange = (
        field: keyof CustomizationSettings['typography']['fontSizes'],
        value: string
    ) => {
        const newSize = parseInt(value, 10);
        if (isNaN(newSize)) return;

        onUpdate({
            ...settings,
            typography: {
                ...settings.typography,
                fontSizes: {
                    ...settings.typography.fontSizes,
                    [field]: newSize,
                }
            }
        });
    };

    const handleFontChange = (
        fontType: 'headingFont' | 'bodyFont',
        property: 'family' | 'weight' | 'style',
        value: string
    ) => {
        onUpdate({
            ...settings,
            typography: {
                ...settings.typography,
                [fontType]: {
                    ...settings.typography[fontType],
                    [property]: value
                }
            }
        })
    }

    return (
        <div className="space-y-4">
            <h3 className="font-semibold">Global Styles</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Line Height</label>
                <input
                    type="number"
                    step="0.1"
                    value={settings.typography.lineHeight}
                    onChange={e => handleLineHeightChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
                />
            </div>

            <div className="p-3 border rounded-md dark:border-gray-600 space-y-2">
                <h4 className="text-sm font-semibold mb-2">Font Sizes (pt)</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <FontSizeInput label="Name" value={settings.typography.fontSizes.name} onChange={e => handleFontSizeChange('name', e.target.value)} />
                    {!isCoverLetter && (
                        <>
                            <FontSizeInput label="Headline" value={settings.typography.fontSizes.headline} onChange={e => handleFontSizeChange('headline', e.target.value)} />
                            <FontSizeInput label="Section Title" value={settings.typography.fontSizes.sectionTitle} onChange={e => handleFontSizeChange('sectionTitle', e.target.value)} />
                        </>
                    )}
                    <FontSizeInput label="Subheading" value={settings.typography.fontSizes.subheading} onChange={e => handleFontSizeChange('subheading', e.target.value)} />
                    <FontSizeInput label="Body" value={settings.typography.fontSizes.body} onChange={e => handleFontSizeChange('body', e.target.value)} />
                    <FontSizeInput label="Meta (Date/Contact)" value={settings.typography.fontSizes.meta} onChange={e => handleFontSizeChange('meta', e.target.value)} />
                </div>
            </div>

            <div className="p-3 border rounded-md dark:border-gray-600">
                <h4 className="text-sm font-semibold mb-2">Heading Font</h4>
                <Select label="Family" value={settings.typography.headingFont.family} onChange={e => handleFontChange('headingFont', 'family', e.target.value)}>
                    {GOOGLE_FONTS.map(font => <option key={font} value={font}>{font}</option>)}
                </Select>
                <Select label="Weight" value={settings.typography.headingFont.weight} onChange={e => handleFontChange('headingFont', 'weight', e.target.value)}>
                    {FONT_WEIGHTS.map(weight => <option key={weight} value={weight}>{weight}</option>)}
                </Select>
                <Select label="Style" value={settings.typography.headingFont.style} onChange={e => handleFontChange('headingFont', 'style', e.target.value)}>
                    {FONT_STYLES.map(style => <option key={style} value={style} className="capitalize">{style}</option>)}
                </Select>
            </div>

            <div className="p-3 border rounded-md dark:border-gray-600">
                <h4 className="text-sm font-semibold mb-2">Body Font</h4>
                <Select label="Family" value={settings.typography.bodyFont.family} onChange={e => handleFontChange('bodyFont', 'family', e.target.value)}>
                    {GOOGLE_FONTS.map(font => <option key={font} value={font}>{font}</option>)}
                </Select>
                <Select label="Weight" value={settings.typography.bodyFont.weight} onChange={e => handleFontChange('bodyFont', 'weight', e.target.value)}>
                    {FONT_WEIGHTS.map(weight => <option key={weight} value={weight}>{weight}</option>)}
                </Select>
                <Select label="Style" value={settings.typography.bodyFont.style} onChange={e => handleFontChange('bodyFont', 'style', e.target.value)}>
                    {FONT_STYLES.map(style => <option key={style} value={style} className="capitalize">{style}</option>)}
                </Select>
            </div>
        </div>
    );
};

export default TypographyTab;
