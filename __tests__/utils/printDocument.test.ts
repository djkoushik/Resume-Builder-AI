/**
 * @jest-environment jsdom
 */

import { printDocument, PRINT_ROOT_ID, PRINTING_CLASS } from '../../utils/printDocument';

const A4: Parameters<typeof printDocument>[0] = {
  elementId: 'resume-preview',
  filename: 'Jane Doe_Resume',
  pageFormat: 'A4',
  margins: { top: 1, right: 0, bottom: 0, left: 0 },
};

const mountPreview = () => {
  const node = document.createElement('div');
  node.id = 'resume-preview';
  node.innerHTML = '<div id="inner"><h1>Jane Doe</h1><p>Engineer</p></div>';
  document.body.appendChild(node);
  return node;
};

const pageRule = () => document.getElementById('print-page-rule')?.textContent ?? '';

describe('printDocument', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    document.documentElement.className = '';
    document.title = 'BuildResumeNow';
    delete (window as any).checkUserLimit;
    // jsdom does not implement printing; hold the "dialog" open by default so
    // tests can inspect the DOM mid-print.
    window.print = jest.fn();
  });

  it('prints and reports success', () => {
    mountPreview();
    expect(printDocument(A4)).toBe('started');
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('clones the preview into #print-root without duplicating ids', () => {
    mountPreview();
    printDocument(A4);

    const root = document.getElementById(PRINT_ROOT_ID);
    expect(root).not.toBeNull();
    expect(root!.textContent).toContain('Jane Doe');
    // The clone must not shadow the ids still live in the app.
    expect(root!.querySelectorAll('[id]')).toHaveLength(0);
    expect(document.querySelectorAll('#resume-preview')).toHaveLength(1);
  });

  it('marks the document as printing and names the file via the title', () => {
    mountPreview();
    printDocument(A4);

    expect(document.documentElement.classList.contains(PRINTING_CLASS)).toBe(true);
    expect(document.title).toBe('Jane_Doe_Resume');
  });

  it('generates an @page rule from the page format and margins', () => {
    mountPreview();
    printDocument(A4);
    expect(pageRule()).toBe('@page { size: A4 portrait; margin: 1cm 0cm 0cm 0cm; }');
  });

  it('supports Letter and per-side margins', () => {
    mountPreview();
    printDocument({
      ...A4,
      pageFormat: 'Letter',
      margins: { top: 1.5, right: 2, bottom: 1.5, left: 2 },
    });
    expect(pageRule()).toBe('@page { size: Letter portrait; margin: 1.5cm 2cm 1.5cm 2cm; }');
  });

  it('clamps nonsensical margins rather than emitting invalid CSS', () => {
    mountPreview();
    printDocument({
      ...A4,
      margins: { top: -3, right: Number.NaN, bottom: 99, left: 0 },
    });
    expect(pageRule()).toBe('@page { size: A4 portrait; margin: 0cm 0cm 5cm 0cm; }');
  });

  it('restores the document once printing finishes', () => {
    mountPreview();
    printDocument(A4);
    window.dispatchEvent(new Event('afterprint'));

    expect(document.getElementById(PRINT_ROOT_ID)).toBeNull();
    expect(document.getElementById('print-page-rule')).toBeNull();
    expect(document.documentElement.classList.contains(PRINTING_CLASS)).toBe(false);
    expect(document.title).toBe('BuildResumeNow');
  });

  it('cleans up only once even if afterprint fires repeatedly', () => {
    mountPreview();
    printDocument(A4);
    window.dispatchEvent(new Event('afterprint'));
    document.title = 'Something Else';
    window.dispatchEvent(new Event('afterprint'));

    expect(document.title).toBe('Something Else');
  });

  it('reports a missing preview node instead of printing the app', () => {
    expect(printDocument(A4)).toBe('missing');
    expect(window.print).not.toHaveBeenCalled();
    expect(document.getElementById(PRINT_ROOT_ID)).toBeNull();
  });

  it('refuses to stack a second print while one is open', () => {
    mountPreview();
    expect(printDocument(A4)).toBe('started');
    expect(printDocument(A4)).toBe('busy');
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('honours the quota gate', () => {
    mountPreview();
    (window as any).checkUserLimit = jest.fn(() => false);

    expect(printDocument(A4)).toBe('blocked');
    expect(window.print).not.toHaveBeenCalled();
    expect(document.getElementById(PRINT_ROOT_ID)).toBeNull();
    expect(document.documentElement.classList.contains(PRINTING_CLASS)).toBe(false);
  });

  it('falls back to a usable filename when the name is empty or unsafe', () => {
    mountPreview();
    printDocument({ ...A4, filename: '///:*?' });
    expect(document.title).toBe('Resume');
  });

  it('tears down and reports failure when the browser refuses to print', () => {
    mountPreview();
    window.print = jest.fn(() => { throw new Error('blocked by browser'); });

    expect(printDocument(A4)).toBe('failed');
    expect(document.getElementById(PRINT_ROOT_ID)).toBeNull();
    expect(document.documentElement.classList.contains(PRINTING_CLASS)).toBe(false);
    expect(document.title).toBe('BuildResumeNow');
  });
});
