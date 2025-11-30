import React from 'react';
import { CoverLetterData, CoverLetterTemplate, CustomizationSettings } from '../../../types';

export interface CoverLetterTemplateProps {
    data: CoverLetterData;
    customization?: CustomizationSettings;
    template: CoverLetterTemplate;
}

export const NavyTemplate: React.FC<CoverLetterTemplateProps> = ({ data, customization, template }) => {
    const getTemplateStyles = (template: CoverLetterTemplate, customization?: CustomizationSettings) => {
        const baseStyles = {
            container: {
                fontFamily: customization?.typography.bodyFont.family || template.styles.fonts.body,
                fontWeight: customization?.typography.bodyFont.weight || '400',
                fontStyle: customization?.typography.bodyFont.style || 'normal',
                color: template.styles.colors.text,
                padding: `${template.styles.layout.margins.top}px ${template.styles.layout.margins.right}px ${template.styles.layout.margins.bottom}px ${template.styles.layout.margins.left}px`,
                lineHeight: customization?.typography.lineHeight || '1.5',
                fontSize: customization?.typography.fontSizes.body ? `${customization.typography.fontSizes.body}pt` : '12pt',
            },
            heading: {
                fontFamily: customization?.typography.headingFont.family || template.styles.fonts.heading,
                fontWeight: customization?.typography.headingFont.weight || '700',
                fontStyle: customization?.typography.headingFont.style || 'normal',
                color: template.styles.colors.primary,
            },
            sectionSpacing: {
                marginBottom: `${template.styles.layout.spacing.sectionSpacing}px`,
            },
            paragraphSpacing: {
                marginBottom: `${template.styles.layout.spacing.paragraphSpacing}px`,
            },
            accent: template.styles.colors.accent ? {
                borderLeft: `3px solid ${template.styles.colors.accent}`,
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
                marginBottom: '40px'
            }}>
                {data.closing || 'Sincerely,'}
            </div>
            <div style={{ ...styles.heading, fontSize: customization?.typography.fontSizes.subheading ? `${customization.typography.fontSizes.subheading}pt` : '16px' }}>
                {data.senderName || 'Your Name'}
            </div>
        </div>
    );

    return (
        <div style={{ ...styles.container, padding: 0 }}>
            {/* Header */}
            <div style={{
                backgroundColor: '#1e3a8a',
                color: 'white',
                padding: '40px 20px',
                textAlign: 'center'
            }}>
                <div style={{
                    ...styles.heading,
                    color: 'white',
                    fontSize: customization?.typography.fontSizes.name ? `${customization.typography.fontSizes.name}pt` : '32px',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    {data.senderName || 'Your Name'}
                </div>
            </div>

            {/* Sub-header Contact Info */}
            <div style={{
                backgroundColor: '#dbeafe',
                color: '#1e3a8a',
                padding: '12px 20px',
                textAlign: 'center',
                fontSize: customization?.typography.fontSizes.meta ? `${customization.typography.fontSizes.meta}pt` : '12px',
                fontWeight: '500',
                marginBottom: '40px'
            }}>
                <span style={{ margin: '0 8px' }}>{data.senderAddress || 'Your Address'}</span>
                •
                <span style={{ margin: '0 8px' }}>{data.senderPhone || 'Phone'}</span>
                •
                <span style={{ margin: '0 8px' }}>{data.senderEmail || 'Email'}</span>
            </div>

            {/* Main Content */}
            <div style={{ padding: `0 ${template.styles.layout.margins.left}px` }}>
                {renderDate()}
                {renderRecipientInfo()}

                <div style={{ marginTop: '20px' }}>
                    {renderSalutation()}
                    {renderBodyContent()}
                    {renderClosing()}
                </div>
            </div>
        </div>
    );
};

export const NavyThumbnail: React.FC<{ template: CoverLetterTemplate }> = ({ template }) => {
    const baseStyles = "bg-white dark:bg-gray-700 h-24 w-full rounded flex overflow-hidden border dark:border-gray-600";
    return (
        <div className={baseStyles}>
            <div className="w-full h-full flex flex-col">
                {/* Header */}
                <div className="h-1/3 bg-[#1e3a8a] flex flex-col items-center justify-center p-1">
                    <div className="h-2 w-2/3 bg-white rounded-sm mb-1"></div>
                </div>
                {/* Sub-header */}
                <div className="h-1/6 bg-[#dbeafe] flex items-center justify-center mb-2">
                    <div className="h-1 w-1/2 bg-[#1e3a8a] rounded-sm"></div>
                </div>

                {/* Content */}
                <div className="px-2 flex-grow">
                    <div className="h-1 w-1/4 bg-gray-400 rounded-sm mb-1 ml-auto"></div>
                    <div className="h-1 w-1/3 bg-gray-600 rounded-sm mb-1"></div>
                    <div className="h-1 w-full bg-gray-400 rounded-sm mb-0.5"></div>
                    <div className="h-1 w-5/6 bg-gray-400 rounded-sm"></div>
                </div>
            </div>
        </div>
    );
};
