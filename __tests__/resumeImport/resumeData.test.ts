import { initialResumeData, type ResumeData } from '../../types';
import { applyImportedContent, isPristineResume, mergeResumeData } from '../../utils/resumeData';
import { emptyContent } from '../../utils/resumeImport/normalize';

describe('mergeResumeData — json source (existing import must not regress)', () => {
  test('a full export round-trips unchanged', () => {
    const exported = JSON.parse(JSON.stringify(initialResumeData));
    expect(mergeResumeData(exported, { source: 'json' })).toEqual(initialResumeData);
  });

  test('missing keys still fall back to the seed, as they always have', () => {
    const merged = mergeResumeData({ summary: 'Just a summary' }, { source: 'json' });
    expect(merged.summary).toBe('Just a summary');
    expect(merged.projects).toEqual(initialResumeData.projects);
    expect(merged.basics.name).toBe(initialResumeData.basics.name);
  });

  test('malformed input does not throw', () => {
    expect(() => mergeResumeData(null, { source: 'json' })).not.toThrow();
    expect(() => mergeResumeData('nonsense', { source: 'json' })).not.toThrow();
  });
});

describe('mergeResumeData — file source (the seed-data regression)', () => {
  test('missing sections become empty, never John Doe', () => {
    const merged = mergeResumeData(emptyContent(), { source: 'file' });

    expect(merged.projects).toEqual([]);
    expect(merged.certifications).toEqual([]);
    expect(merged.interests).toEqual([]);
    expect(merged.languages).toEqual([]);
    expect(merged.experience).toEqual([]);
    expect(merged.education).toEqual([]);
    expect(merged.profiles).toEqual([]);
    expect(merged.summary).toBe('');
    expect(merged.references).toBe('');
  });

  test('no seed value survives anywhere in the result', () => {
    const content = emptyContent();
    content.basics.name = 'Priya Sharma';

    const serialized = JSON.stringify(mergeResumeData(content, { source: 'file' }));

    // Every one of these would have leaked through the old merge.
    [
      'John Doe', '(555) 123-4567', 'johndoe.me', 'john.doe@gmail.com',
      'E-Commerce Platform', 'Creative Solutions', 'Hiking', 'CodeAcademy',
    ].forEach(needle => expect(serialized).not.toContain(needle));
  });

  test('a partial parse does not inherit the seed for the fields it missed', () => {
    const merged = mergeResumeData(
      { basics: { name: 'Priya Sharma', email: 'priya@example.com' } },
      { source: 'file' }
    );

    expect(merged.basics.name).toBe('Priya Sharma');
    expect(merged.basics.phone).toBe('');
    expect(merged.basics.website).toBe('');
    expect(merged.basics.headline).toBe('');
  });
});

describe('presentation is preserved across a file import', () => {
  const current: ResumeData = {
    ...initialResumeData,
    resumeMode: 'custom',
    sectionOrder: ['skills', 'summary', 'experience'] as ResumeData['sectionOrder'],
    basics: { ...initialResumeData.basics, photo: 'data:image/png;base64,AAAA' },
  };

  test('keeps mode, section order and layout', () => {
    const merged = applyImportedContent(current, emptyContent());
    expect(merged.resumeMode).toBe('custom');
    expect(merged.sectionOrder).toEqual(['skills', 'summary', 'experience']);
    expect(merged.layout).toEqual(current.layout);
  });

  test('keeps an existing photo, since no resume file carries one', () => {
    const merged = applyImportedContent(current, emptyContent());
    expect(merged.basics.photo).toBe('data:image/png;base64,AAAA');
  });

  test('an imported photo would still win if one ever existed', () => {
    const content = emptyContent();
    content.basics.photo = 'data:image/png;base64,BBBB';
    expect(applyImportedContent(current, content).basics.photo).toBe('data:image/png;base64,BBBB');
  });
});

describe('isPristineResume', () => {
  test('true for the untouched seed', () => {
    expect(isPristineResume(initialResumeData)).toBe(true);
  });

  test('true after navigating to Custom mode without typing anything', () => {
    // /build-custom-resume sets resumeMode; that is navigation, not user work.
    expect(isPristineResume({ ...initialResumeData, resumeMode: 'custom' })).toBe(true);
  });

  test('true after reordering sections but changing no content', () => {
    expect(
      isPristineResume({
        ...initialResumeData,
        sectionOrder: ['skills', 'summary'] as ResumeData['sectionOrder'],
      })
    ).toBe(true);
  });

  test('false once real content changes', () => {
    expect(
      isPristineResume({
        ...initialResumeData,
        basics: { ...initialResumeData.basics, name: 'Priya Sharma' },
      })
    ).toBe(false);
  });

  test('false once an entry is added', () => {
    expect(
      isPristineResume({ ...initialResumeData, interests: [] })
    ).toBe(false);
  });
});
