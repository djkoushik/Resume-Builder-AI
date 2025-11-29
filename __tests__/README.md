# Cover Letter Builder Test Suite

This directory contains comprehensive tests for the Cover Letter Builder feature.

## Test Structure

### Unit Tests
- `coverLetter/CoverLetterBuilder.test.tsx` - Tests for the main container component
- `coverLetter/CoverLetterEditor.test.tsx` - Tests for the form editor component
- `coverLetter/CoverLetterPreview.test.tsx` - Tests for the preview component
- `coverLetter/TemplateSelector.test.tsx` - Tests for the template selection component

### Integration Tests
- `integration/CoverLetterWorkflow.test.tsx` - End-to-end workflow tests

### Service Tests
- `services/geminiService.test.ts` - Tests for AI enhancement functionality

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test CoverLetterBuilder.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="AI enhancement"
```

## Test Coverage

The test suite covers:

### Functional Requirements
- ✅ Artifact selection interface (CL-T08, CL-T09, CL-T10)
- ✅ Data synchronization between resume and cover letter (CL-T01, CL-T02)
- ✅ Form input validation (CL-T03)
- ✅ PDF generation (CL-T04, CL-T05)
- ✅ Template selection (CL-T06, CL-T07)
- ✅ Real-time preview updates
- ✅ Import/export functionality

### AI Enhancement Tests
- ✅ AI content generation with valid inputs (CL-A01)
- ✅ Error handling for missing job title (CL-A02)
- ✅ Multiple AI enhancement calls (CL-A03)
- ✅ AI-generated content persistence (CL-A04)

### UI/UX Tests
- ✅ Responsive design on mobile devices (CL-U02)
- ✅ Consistent button styling (CL-U03)
- ✅ Template selector accessibility (CL-U04)
- ✅ Navigation consistency (CL-U01)

### Accessibility Tests
- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Screen reader compatibility
- ✅ Focus management

### Error Handling
- ✅ Form validation errors
- ✅ AI service failures
- ✅ PDF generation errors
- ✅ Import/export errors

## Test Data

Tests use mock data based on the initial data structures:
- `initialResumeData` for resume context
- `initialCoverLetterData` for cover letter state
- `coverLetterTemplates` for template testing

## Mocking Strategy

### External Dependencies
- **Gemini AI Service**: Mocked to return predictable responses
- **PDF Generation**: Mocked html2pdf library
- **File Operations**: Mocked file input/output operations

### Browser APIs
- **File API**: Mocked for import/export testing
- **DOM APIs**: Mocked for PDF generation testing
- **Local Storage**: Not used, but would be mocked if needed

## Performance Tests

While not included in this basic suite, performance tests could be added for:
- Large content rendering
- Template switching speed
- AI response handling
- PDF generation time

## Future Test Enhancements

1. **Visual Regression Tests**: Screenshot comparison for template rendering
2. **Cross-browser Tests**: Automated testing across different browsers
3. **Load Tests**: Testing with large amounts of data
4. **Security Tests**: Input sanitization and XSS prevention
5. **Internationalization Tests**: Multi-language support testing