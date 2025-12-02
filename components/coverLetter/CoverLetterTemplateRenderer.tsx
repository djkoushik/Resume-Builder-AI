import React from 'react';
import { CoverLetterData, CoverLetterTemplate, CustomizationSettings, coverLetterTemplates } from '../../types';
import { FontStyle, FontWeight } from '../../constants';
import { ModernTemplate } from './templates/ModernTemplate';
import { CreativeTemplate } from './templates/CreativeTemplate';
import { ProfessionalTemplate } from './templates/ProfessionalTemplate';
import { MinimalistTemplate } from './templates/MinimalistTemplate';
import { GeometricTemplate } from './templates/GeometricTemplate';
import { NavyTemplate } from './templates/NavyTemplate';
import { SquareTemplate } from './templates/SquareTemplate';
import { ExecutiveTemplate } from './templates/ExecutiveTemplate';

interface CoverLetterTemplateRendererProps {
    data: CoverLetterData;
    customization?: CustomizationSettings;
    templateId: string;
}

type FontSetting = {
    family: string;
    weight: FontWeight;
    style: FontStyle;
}

const CoverLetterTemplateRenderer: React.FC<CoverLetterTemplateRendererProps> = ({ data, customization, templateId }) => {

    // Find the template definition to access styles if needed, though most templates use their own internal logic
    // or the passed customization settings.
    const templateDef = coverLetterTemplates.find(t => t.id === templateId) || coverLetterTemplates[0];

    const buildFontQuery = (font: FontSetting): string => {
        const familyName = font.family.replace(' ', '+');
        // Request italic fonts correctly from Google Fonts API v2
        if (font.style === 'italic') {
            return `family=${familyName}:ital,wght@1,${font.weight}`;
        }
        return `family=${familyName}:wght@${font.weight}`;
    };

    // Only load fonts if customization is provided
    let fontUrl = '';
    if (customization) {
        const headingFontQuery = buildFontQuery(customization.typography.headingFont);
        const bodyFontQuery = buildFontQuery(customization.typography.bodyFont);
        fontUrl = `https://fonts.googleapis.com/css2?${headingFontQuery}&${bodyFontQuery}&display=swap`;
    }

    const renderTemplate = () => {
        switch (templateId) {
            case 'modern':
                return <ModernTemplate data={data} customization={customization} template={templateDef} />;
            case 'creative':
                return <CreativeTemplate data={data} customization={customization} template={templateDef} />;
            case 'professional':
                return <ProfessionalTemplate data={data} customization={customization} template={templateDef} />;
            case 'minimalist':
                return <MinimalistTemplate data={data} customization={customization} template={templateDef} />;
            case 'geometric':
                return <GeometricTemplate data={data} customization={customization} template={templateDef} />;
            case 'navy':
                return <NavyTemplate data={data} customization={customization} template={templateDef} />;
            case 'square':
                return <SquareTemplate data={data} customization={customization} template={templateDef} />;
            case 'executive':
                return <ExecutiveTemplate data={data} customization={customization} template={templateDef} />;
            default:
                return <ProfessionalTemplate data={data} customization={customization} template={templateDef} />;
        }
    };

    return (
        <>
            {fontUrl && (
                <style>
                    {`@import url('${fontUrl}');`}
                </style>
            )}
            {renderTemplate()}
        </>
    );
};

export default CoverLetterTemplateRenderer;
