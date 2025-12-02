import React from 'react';
import { CoverLetterData, CoverLetterTemplate, CustomizationSettings } from '../../../types';

export interface CoverLetterTemplateProps {
    data: CoverLetterData;
    customization?: CustomizationSettings;
    template: CoverLetterTemplate;
}

export const ModernTemplate: React.FC<CoverLetterTemplateProps> = ({ data, customization, template }) => {
    const getTemplateStyles = (template: CoverLetterTemplate, customization?: CustomizationSettings) => {
        const baseStyles = {
            container: {
                fontFamily: customization?.typography.bodyFont.family || template.styles.fonts.body,
                fontWeight: customization?.typography.bodyFont.weight || '400',
                fontStyle: customization?.typography.bodyFont.style || 'normal',
                color: customization?.colors.text || template.styles.colors.text,
                padding: `${template.styles.layout.margins.top}px ${template.styles.layout.margins.right}px ${template.styles.layout.margins.bottom}px ${template.styles.layout.margins.left}px`,
                lineHeight: customization?.typography.lineHeight || '1.5',
                fontSize: customization?.typography.fontSizes.body ? `${customization.typography.fontSizes.body}pt` : '12pt',
                backgroundColor: customization?.colors.background || '#ffffff',
                minHeight: '11in',
            },
            heading: {
                fontFamily: customization?.typography.headingFont.family || template.styles.fonts.heading,
                fontWeight: customization?.typography.headingFont.weight || '700',
                fontStyle: customization?.typography.headingFont.style || 'normal',
                color: customization?.colors.primary || template.styles.colors.primary,
            },
            sectionSpacing: {
                marginBottom: `${template.styles.layout.spacing.sectionSpacing}px`,
            },
            paragraphSpacing: {
                marginBottom: `${template.styles.layout.spacing.paragraphSpacing}px`,
            },
            accent: template.styles.colors.accent ? {
                borderLeft: `3px solid ${customization?.colors.primary || template.styles.colors.accent}`, // Modern template uses accent color for border
                paddingLeft: '12px',
            } : {},
        };
        return baseStyles;
    };

    const styles = getTemplateStyles(template, customization);

    const formatDate = (dateString: string) => {
        if (!dateString) return new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderSenderInfo = () => (
        <div style={styles.sectionSpacing}>
            <div style={{
                ...styles.heading,
                fontSize: customization?.typography.fontSizes.name ? `${customization.typography.fontSizes.name}pt` : '18px',
                marginBottom: '8px'
            }}>
                {data.senderName || 'Your Name'}
            </div>
            <div style={{
                fontSize: customization?.typography.fontSizes.meta ? `${customization.typography.fontSizes.meta}pt` : '14px',
                lineHeight: '1.4'
            }}>
                {data.senderAddress && <div>{data.senderAddress}</div>}
                {data.senderPhone && <div>{data.senderPhone}</div>}
                {data.senderEmail && <div>{data.senderEmail}</div>}
            </div>
        </div>
    );

    const renderDate = () => (
        <div style={{ ...styles.sectionSpacing, textAlign: 'right' as const }}>
            <div style={{ fontSize: customization?.typography.fontSizes.meta ? `${customization.typography.fontSizes.meta}pt` : '14px' }}>
                {formatDate(data.date)}
            </div>
        </div>
    );

    const renderRecipientInfo = () => (
        <div style={styles.sectionSpacing}>
            <div style={{
                fontSize: customization?.typography.fontSizes.body ? `${customization.typography.fontSizes.body}pt` : '14px',
                lineHeight: '1.4'
            }}>
                {data.recipientName && <div style={{ fontWeight: '500' }}>{data.recipientName}</div>}
                {data.recipientTitle && <div>{data.recipientTitle}</div>}
                {data.companyName && <div style={{ fontWeight: '500' }}>{data.companyName}</div>}
                {data.companyAddress && <div>{data.companyAddress}</div>}
            </div>
        </div>
    );

    const renderSalutation = () => (
        <div style={styles.paragraphSpacing}>
            <div style={{ fontSize: customization?.typography.fontSizes.body ? `${customization.typography.fontSizes.body}pt` : '14px' }}>
                {data.salutation || 'Dear Hiring Manager,'}
            </div>
        </div>
    );

    const renderBodyContent = () => {
        const bodyText = data.bodyContent || 'Your cover letter content will appear here. Use the editor on the left to add your content or click "Enhance with AI" to generate professional content based on your resume and job details.';

        // Split content into paragraphs
        const paragraphs = bodyText.split('\n').filter(p => p.trim());

        return (
            <div style={styles.sectionSpacing}>
                {paragraphs.map((paragraph, index) => (
                    <div
                        key={index}
                        style={{
                            ...styles.paragraphSpacing,
                            fontSize: customization?.typography.fontSizes.body ? `${customization.typography.fontSizes.body}pt` : '14px',
                            textAlign: 'justify' as const,
                            ...(template.id === 'creative' ? styles.accent : {}),
                        }}
                    >
                        {paragraph.trim()}
                    </div>
                ))}
            </div>
        );
    };

    const renderClosing = () => (
        <div style={styles.sectionSpacing}>
            <div style={{
                fontSize: customization?.typography.fontSizes.body ? `${customization.typography.fontSizes.body}pt` : '14px',
                marginBottom: '0px'
            }}>
                {data.closing || 'Sincerely,'}
            </div>
            <div style={{ ...styles.heading, fontSize: customization?.typography.fontSizes.subheading ? `${customization.typography.fontSizes.subheading}pt` : '16px' }}>
                {data.senderName || 'Your Name'}
            </div>
        </div>
    );

    return (
        <div style={styles.container}>
            <div style={{ borderBottom: `2px solid ${customization?.colors.primary || template.styles.colors.accent}`, paddingBottom: '16px', marginBottom: '24px' }}>
                {renderSenderInfo()}
            </div>
            {renderDate()}
            {renderRecipientInfo()}
            {renderSalutation()}
            {renderBodyContent()}
            {renderClosing()}
        </div>
    );
};

export const ModernThumbnail: React.FC<{ template: CoverLetterTemplate }> = ({ template }) => {
    const baseStyles = "bg-white dark:bg-gray-700 h-24 w-full rounded flex overflow-hidden border dark:border-gray-600";
    return (
        <div className={baseStyles}>
            <div className="p-2 w-full flex flex-col">
                <div
                    className="border-b-2 pb-1 mb-2"
                    style={{ borderColor: template.styles.colors.accent || template.styles.colors.primary }}
                >
                    <div
                        className="h-3 w-2/3 rounded-sm mb-1"
                        style={{ backgroundColor: template.styles.colors.primary }}
                    ></div> {/* Name */}
                    <div className="h-1.5 w-1/2 bg-gray-500 dark:bg-gray-400 rounded-sm"></div> {/* Contact */}
                </div>
                <div className="flex justify-between mb-1">
                    <div className="h-1.5 w-1/3 bg-gray-600 dark:bg-gray-400 rounded-sm"></div> {/* Recipient */}
                    <div className="h-1.5 w-1/4 bg-gray-400 dark:bg-gray-500 rounded-sm"></div> {/* Date */}
                </div>
                <div className="h-1 w-full bg-gray-400 dark:bg-gray-500 rounded-sm mb-0.5"></div> {/* Body */}
                <div className="h-1 w-4/5 bg-gray-400 dark:bg-gray-500 rounded-sm"></div>
            </div>
        </div>
    );
};
