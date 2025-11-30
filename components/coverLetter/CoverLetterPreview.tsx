import React from 'react';
import { CoverLetterData, CoverLetterTemplate, coverLetterTemplates, CustomizationSettings } from '../../types';

interface CoverLetterPreviewProps {
  data: CoverLetterData;
  customization?: CustomizationSettings;
}

const CoverLetterPreview: React.FC<CoverLetterPreviewProps> = ({ data, customization }) => {
  const template = coverLetterTemplates.find(t => t.id === data.templateId) || coverLetterTemplates[0];

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
        marginBottom: '40px'
      }}>
        {data.closing || 'Sincerely,'}
      </div>
      <div style={{ ...styles.heading, fontSize: customization?.typography.fontSizes.subheading ? `${customization.typography.fontSizes.subheading}pt` : '16px' }}>
        {data.senderName || 'Your Name'}
      </div>
    </div>
  );

  // Template-specific layouts
  const renderTemplate = () => {
    switch (template.id) {
      case 'modern':
        return (
          <div style={styles.container}>
            <div style={{ borderBottom: `2px solid ${template.styles.colors.accent}`, paddingBottom: '16px', marginBottom: '24px' }}>
              {renderSenderInfo()}
            </div>
            {renderDate()}
            {renderRecipientInfo()}
            {renderSalutation()}
            {renderBodyContent()}
            {renderClosing()}
          </div>
        );

      case 'creative':
        return (
          <div style={styles.container}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div style={{ flex: 1 }}>
                {renderSenderInfo()}
              </div>
              <div style={{ flex: 0, minWidth: '120px' }}>
                {renderDate()}
              </div>
            </div>
            {renderRecipientInfo()}
            {renderSalutation()}
            {renderBodyContent()}
            {renderClosing()}
          </div>
        );

      case 'executive':
        return (
          <div style={{ ...styles.container, fontSize: customization?.typography.fontSizes.body ? `${customization.typography.fontSizes.body}pt` : '15px' }}>
            <div style={{ textAlign: 'center' as const, marginBottom: '32px' }}>
              <div style={{
                ...styles.heading,
                fontSize: customization?.typography.fontSizes.name ? `${customization.typography.fontSizes.name}pt` : '20px',
                marginBottom: '8px'
              }}>
                {data.senderName || 'Your Name'}
              </div>
              <div style={{ fontSize: customization?.typography.fontSizes.meta ? `${customization.typography.fontSizes.meta}pt` : '13px' }}>
                {data.senderAddress} • {data.senderPhone} • {data.senderEmail}
              </div>
            </div>
            {renderDate()}
            {renderRecipientInfo()}
            {renderSalutation()}
            {renderBodyContent()}
            {renderClosing()}
          </div>
        );

      case 'minimalist':
        return (
          <div style={{ ...styles.container, fontSize: customization?.typography.fontSizes.body ? `${customization.typography.fontSizes.body}pt` : '13px' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                ...styles.heading,
                fontSize: customization?.typography.fontSizes.subheading ? `${customization.typography.fontSizes.subheading}pt` : '16px',
                marginBottom: '4px'
              }}>
                {data.senderName || 'Your Name'}
              </div>
              <div style={{ fontSize: customization?.typography.fontSizes.meta ? `${customization.typography.fontSizes.meta}pt` : '12px', color: '#666' }}>
                {data.senderEmail} • {data.senderPhone}
              </div>
            </div>
            <div style={{ textAlign: 'right' as const, marginBottom: '24px' }}>
              <div style={{ fontSize: customization?.typography.fontSizes.meta ? `${customization.typography.fontSizes.meta}pt` : '12px' }}>{formatDate(data.date)}</div>
            </div>
            {renderRecipientInfo()}
            {renderSalutation()}
            {renderBodyContent()}
            {renderClosing()}
          </div>
        );

      default: // professional
        return (
          <div style={styles.container}>
            {renderSenderInfo()}
            {renderDate()}
            {renderRecipientInfo()}
            {renderSalutation()}
            {renderBodyContent()}
            {renderClosing()}
          </div>
        );
    }
  };

  return (
    <div
      id="cover-letter-preview"
      className="bg-white rounded-lg shadow-sm min-h-96 overflow-auto mx-auto"
      style={{
        width: '100%',
        maxWidth: '8.5in',
        minHeight: '11in',
        maxHeight: '600px',
        fontSize: customization?.typography.fontSizes.body ? `${customization.typography.fontSizes.body}pt` : '14px'
      }}
      role="document"
      aria-label="Cover letter preview"
    >
      {renderTemplate()}
    </div>
  );
};

export default CoverLetterPreview;