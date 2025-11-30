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

      case 'geometric':
        return (
          <div style={{ ...styles.container, padding: 0, position: 'relative', overflow: 'hidden' }}>
            {/* Header Shapes */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '250px',
              backgroundColor: '#f3e9dc', // Beige background
              zIndex: 0
            }}></div>

            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '40%',
              height: '250px',
              backgroundColor: '#e5e7eb', // Light gray
              clipPath: 'polygon(0 0, 100% 0, 60% 100%, 0% 100%)',
              zIndex: 1
            }}></div>

            <div style={{
              position: 'absolute',
              top: '150px',
              left: 0,
              right: 0,
              height: '100px',
              backgroundColor: '#ffffff',
              clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
              zIndex: 2
            }}></div>

            {/* Content Container */}
            <div style={{ position: 'relative', zIndex: 10, paddingTop: '60px' }}>

              {/* Header Content */}
              <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                <div style={{
                  ...styles.heading,
                  fontSize: customization?.typography.fontSizes.name ? `${customization.typography.fontSizes.name}pt` : '36px',
                  fontFamily: 'Playfair Display, serif',
                  marginBottom: '8px',
                  color: '#000'
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
                  color: '#4b5563'
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

                {/* Footer Contact */}
                <div style={{ marginTop: '40px', fontSize: customization?.typography.fontSizes.meta ? `${customization.typography.fontSizes.meta}pt` : '12px', color: '#4b5563' }}>
                  <div>{data.senderEmail}</div>
                  <div>{data.senderAddress ? data.senderAddress.split(',').slice(1).join(',').trim() : 'City, State'}</div>
                  <div>linkedin.com/username</div>
                </div>

              </div>
            </div>
          </div>
        );

      case 'navy':
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

      case 'square':
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
                backgroundColor: '#1e3a8a',
                color: 'white',
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