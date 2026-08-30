
import React from 'react';
import { CustomizationSettings, initialCustomizationSettings } from '../../types';
import { GOOGLE_FONTS, FONT_WEIGHTS, FONT_STYLES } from '../../constants';
import Select from '../ui/Select';

interface TypographyTabProps {
    settings: CustomizationSettings;
    onUpdate: (settings: CustomizationSettings) => void;
    isCoverLetter?: boolean;
}

const StepButton: React.FC<{ onClick: () => void; label: string; children: React.ReactNode }> = ({ onClick, label, children }) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="flex items-center justify-center w-9 h-9 flex-shrink-0 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
    >
        {children}
    </button>
);

const FontSizeInput: React.FC<{
    label: string,
    value: number,
    onChange: (value: number) => void
}> = ({ label, value, onChange }) => (
    <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <div className="flex items-center gap-1">
            <StepButton label={`Decrease ${label}`} onClick={() => onChange(Math.max(4, value - 1))}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M5 12h14" /></svg>
            </StepButton>
            <input
                type="number"
                inputMode="numeric"
                value={value}
                onChange={e => { const n = parseInt(e.target.value, 10); if (!isNaN(n)) onChange(n); }}
                className="w-full min-w-0 text-center px-1 h-9 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm tabular-nums"
            />
            <StepButton label={`Increase ${label}`} onClick={() => onChange(value + 1)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg>
            </StepButton>
        </div>
    </div>
);

const SCALE_PRESETS: { label: string; factor: number }[] = [
    { label: 'Compact', factor: 0.9 },
    { label: 'Standard', factor: 1 },
    { label: 'Large', factor: 1.15 },
];


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
        newSize: number
    ) => {
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

    const applyScale = (factor: number) => {
        const base = initialCustomizationSettings.typography.fontSizes;
        const scaled = Object.fromEntries(
            Object.entries(base).map(([k, v]) => [k, Math.round(v * factor)])
        ) as CustomizationSettings['typography']['fontSizes'];
        onUpdate({
            ...settings,
            typography: { ...settings.typography, fontSizes: scaled },
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
            <div>
                <h3 className="font-semibold mb-2">Text size</h3>
                <div className="grid grid-cols-3 gap-2">
                    {SCALE_PRESETS.map(p => (
                        <button
                            key={p.label}
                            type="button"
                            onClick={() => applyScale(p.factor)}
                            className="min-h-[44px] px-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Sets every size at once. Fine-tune individual sizes below.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Line Height</label>
                <input
                    type="number"
                    step="0.1"
                    inputMode="decimal"
                    value={settings.typography.lineHeight}
                    onChange={e => handleLineHeightChange(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:min-h-0"
                />
            </div>

            <details className="p-3 border rounded-md dark:border-gray-600">
                <summary className="text-sm font-semibold cursor-pointer select-none">Fine-tune sizes (pt)</summary>
                <div className="grid grid-cols-2 gap-x-3 gap-y-3 mt-3">
                    <FontSizeInput label="Name" value={settings.typography.fontSizes.name} onChange={v => handleFontSizeChange('name', v)} />
                    {!isCoverLetter && (
                        <>
                            <FontSizeInput label="Headline" value={settings.typography.fontSizes.headline} onChange={v => handleFontSizeChange('headline', v)} />
                            <FontSizeInput label="Section Title" value={settings.typography.fontSizes.sectionTitle} onChange={v => handleFontSizeChange('sectionTitle', v)} />
                        </>
                    )}
                    <FontSizeInput label="Subheading" value={settings.typography.fontSizes.subheading} onChange={v => handleFontSizeChange('subheading', v)} />
                    <FontSizeInput label="Body" value={settings.typography.fontSizes.body} onChange={v => handleFontSizeChange('body', v)} />
                    <FontSizeInput label="Meta (Date/Contact)" value={settings.typography.fontSizes.meta} onChange={v => handleFontSizeChange('meta', v)} />
                </div>
            </details>

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
