import React from 'react';
import { CoverLetterData, CoverLetterTemplate, CustomizationSettings } from '../../../types';

export interface CoverLetterTemplateProps {
    data: CoverLetterData;
    customization?: CustomizationSettings;
    template: CoverLetterTemplate;
}

export const GeometricTemplate: React.FC<CoverLetterTemplateProps> = ({ data, customization, template }) => {
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

    return (
        <div style={{ ...styles.container, padding: 0, position: 'relative', overflow: 'hidden' }}>
            {/* Header Shapes */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '140px',
                backgroundColor: '#f3e9dc', // Beige background
                zIndex: 0
            }}></div>

            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '40%',
                height: '140px',
                backgroundColor: '#e5e7eb', // Light gray
                zIndex: 1
            }}></div>

            {/* Content Container */}
            <div style={{ position: 'relative', zIndex: 10, paddingTop: '40px' }}>

                {/* Header Content */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{
                        ...styles.heading,
                        fontSize: customization?.typography.fontSizes.name ? `${customization.typography.fontSizes.name}pt` : '36px',
                        fontFamily: 'Playfair Display, serif',
                        marginBottom: '8px',
                        color: customization?.colors.primary || '#000'
                    }}>
                        {(data.senderName || 'Your Name').toUpperCase()}
                    </div>
                </div>

                {/* Main Body Layout */}
                <div style={{ padding: `0 ${template.styles.layout.margins.left}px` }}>

                    {/* Contact Info */}
                    <div style={{
                        marginBottom: '40px',
                        fontSize: customization?.typography.fontSizes.meta ? `${customization.typography.fontSizes.meta}pt` : '12px',
                        color: customization?.colors.sidebarText || '#4b5563'
                    }}>
                        <div>{data.senderAddress || 'Your Address*'}</div>
                        <div>{data.senderAddress ? data.senderAddress.split(',').slice(1).join(',').trim() : 'Your City, State, Zip Code*'}</div>
                        <div>{data.senderPhone || 'Your Phone Number*'}</div>
                        <div>{data.senderEmail || 'Your Email Address*'}</div>
                    </div>

                    {renderDate()}
                    {renderRecipientInfo()}

                    <div style={{ marginTop: '20px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '20px', fontSize: customization?.typography.fontSizes.body ? `${customization.typography.fontSizes.body}pt` : '14px' }}>
                            Subject: {data.senderName} Application for {data.jobTitle || 'Position*'}
                        </div>

                        {renderSalutation()}
                        {renderBodyContent()}
                        {renderClosing()}
                    </div>



                </div>
            </div>
        </div>
    );
};

export const GeometricThumbnail: React.FC<{ template: CoverLetterTemplate }> = ({ template }) => {
    const baseStyles = "bg-white dark:bg-gray-700 h-24 w-full rounded flex overflow-hidden border dark:border-gray-600";
    return (
        <div className={baseStyles}>
            <div className="w-full h-full relative overflow-hidden">
                {/* Background */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-[#f3e9dc]"></div>
                {/* Gray Rectangle */}
                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-[#e5e7eb]"></div>

                {/* Content */}
                <div className="relative z-10 p-2 flex flex-col items-center pt-6">
                    <div className="h-2 w-2/3 bg-black rounded-sm mb-1"></div> {/* Name */}
                    <div className="h-1 w-1/2 bg-gray-500 rounded-sm mb-2"></div> {/* Title */}

                    <div className="w-full px-2">
                        <div className="h-1 w-full bg-gray-400 rounded-sm mb-0.5"></div>
                        <div className="h-1 w-5/6 bg-gray-400 rounded-sm"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
