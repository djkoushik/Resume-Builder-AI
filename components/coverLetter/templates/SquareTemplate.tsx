import React from 'react';
import { CoverLetterData, CoverLetterTemplate, CustomizationSettings } from '../../../types';

export interface CoverLetterTemplateProps {
    data: CoverLetterData;
    customization?: CustomizationSettings;
    template: CoverLetterTemplate;
}

export const SquareTemplate: React.FC<CoverLetterTemplateProps> = ({ data, customization, template }) => {
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
                borderLeft: `3px solid ${customization?.colors.primary || template.styles.colors.accent}`,
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
                marginBottom: '0px'
            }}>
                {data.closing || 'Sincerely,'}
            </div>
            <div style={{ ...styles.heading, fontSize: customization?.typography.fontSizes.subheading ? `${customization.typography.fontSizes.subheading}pt` : '16px' }}>
                {data.senderName || 'Your Name'}
            </div>
        </div>
    );

    const initials = (data.senderName || 'Your Name').split(' ').map(n => n[0]).join('/').toUpperCase().slice(0, 3);
    const firstName = (data.senderName || 'Your Name').split(' ')[0];
    const lastName = (data.senderName || 'Your Name').split(' ').slice(1).join(' ');

    return (
        <div style={{ ...styles.container, padding: '40px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
                {/* Square Logo */}
                <div style={{
                    width: '100px',
                    height: '100px',
                    backgroundColor: customization?.colors.primary || '#1e3a8a',
                    color: customization?.colors.sidebarText || 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: '300',
                    marginRight: '20px'
                }}>
                    {initials}
                </div>

                {/* Name and Contact */}
                <div>
                    <div style={{
                        fontSize: customization?.typography.fontSizes.name ? `${customization.typography.fontSizes.name}pt` : '32px',
                        fontFamily: 'Montserrat, sans-serif',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        color: '#1f2937',
                        lineHeight: '1.1'
                    }}>
                        <div>{firstName}</div>
                        <div>{lastName}</div>
                    </div>
                </div>
            </div>

            {/* Contact Info Line */}
            <div style={{
                fontSize: customization?.typography.fontSizes.meta ? `${customization.typography.fontSizes.meta}pt` : '12px',
                color: '#4b5563',
                marginBottom: '40px',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '20px'
            }}>
                {data.senderAddress && <span>{data.senderAddress}</span>}
                {data.senderPhone && <span style={{ margin: '0 8px' }}>• {data.senderPhone}</span>}
                {data.senderEmail && <span style={{ margin: '0 8px' }}>• {data.senderEmail}</span>}
            </div>

            {/* Main Content */}
            <div>
                {renderDate()}
                {renderRecipientInfo()}
                {renderSalutation()}
                {renderBodyContent()}
                {renderClosing()}
            </div>
        </div>
    );
};

export const SquareThumbnail: React.FC<{ template: CoverLetterTemplate }> = ({ template }) => {
    const baseStyles = "bg-white dark:bg-gray-700 h-24 w-full rounded flex overflow-hidden border dark:border-gray-600";
    return (
        <div className={baseStyles}>
            <div className="p-2 w-full flex flex-col">
                <div className="flex items-center mb-2">
                    {/* Logo */}
                    <div className="h-8 w-8 bg-[#1e3a8a] flex items-center justify-center mr-2">
                        <div className="text-[8px] text-white font-light">S/W</div>
                    </div>
                    {/* Name */}
                    <div className="flex flex-col">
                        <div className="h-1.5 w-16 bg-[#1f2937] rounded-sm mb-0.5"></div>
                        <div className="h-1.5 w-12 bg-[#1f2937] rounded-sm"></div>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gray-200 mb-2"></div>

                {/* Content */}
                <div className="flex-grow">
                    <div className="h-1 w-1/4 bg-gray-400 rounded-sm mb-1 ml-auto"></div>
                    <div className="h-1 w-1/3 bg-gray-600 rounded-sm mb-1"></div>
                    <div className="h-1 w-full bg-gray-400 rounded-sm mb-0.5"></div>
                    <div className="h-1 w-5/6 bg-gray-400 rounded-sm"></div>
                </div>
            </div>
        </div>
    );
};
