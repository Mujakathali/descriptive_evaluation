const PDFJS_VERSION = '3.11.174';

let libsPromise;

const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
};

const ensureOcrLibs = async () => {
    if (window.pdfjsLib && window.Tesseract) {
        return;
    }

    if (!libsPromise) {
        libsPromise = (async () => {
            await loadScript(`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`);
            if (window.pdfjsLib?.GlobalWorkerOptions) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
            }
            await loadScript('https://unpkg.com/tesseract.js@5.1.0/dist/tesseract.min.js');
        })();
    }

    await libsPromise;
};

const readAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.onload = () => resolve(reader.result);
        reader.readAsArrayBuffer(file);
    });
};

const readAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
};

const normalizeText = (text) => {
    return (text || '')
        .replace(/\s+\n/g, '\n')
        .replace(/\n\s+/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

const ocrImageDataUrl = async (dataUrl, { onProgress } = {}) => {
    await ensureOcrLibs();
    const result = await window.Tesseract.recognize(dataUrl, 'eng', {
        logger: (m) => {
            if (m?.status === 'recognizing text' && typeof m.progress === 'number') {
                onProgress?.(m.progress);
            }
        },
    });
    return normalizeText(result?.data?.text || '');
};

const renderPdfPageToDataUrl = async (pdf, pageNumber, { scale = 2 } = {}) => {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL('image/png');
};

export const extractTextFromImageFile = async (file, { onProgress } = {}) => {
    const dataUrl = await readAsDataUrl(file);
    return ocrImageDataUrl(dataUrl, { onProgress });
};

export const extractTextFromPdfFile = async (
    file,
    { maxPagesForOcr = 2, minTextLengthToSkipOcr = 30, onProgress } = {}
) => {
    await ensureOcrLibs();
    const buf = await readAsArrayBuffer(file);

    let pdf;
    try {
        pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
    } catch (e) {
        throw new Error('Unable to open PDF. The file may be corrupted or password-protected.');
    }

    // 1) First try: extract text layer (works for “digital” PDFs)
    let extracted = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = (content.items || []).map((it) => it.str);
        extracted += strings.join(' ') + '\n';

        onProgress?.({ phase: 'pdf_text', page: i, total: pdf.numPages });
    }

    extracted = normalizeText(extracted);

    // 2) If the PDF has almost no text, it's likely scanned -> OCR fallback
    if (extracted.length >= minTextLengthToSkipOcr) {
        return extracted;
    }

    let ocrText = '';
    const pagesToOcr = Math.min(pdf.numPages, maxPagesForOcr);

    for (let i = 1; i <= pagesToOcr; i++) {
        onProgress?.({ phase: 'pdf_ocr_render', page: i, total: pagesToOcr });
        const dataUrl = await renderPdfPageToDataUrl(pdf, i, { scale: 2 });

        onProgress?.({ phase: 'pdf_ocr', page: i, total: pagesToOcr });
        const pageText = await ocrImageDataUrl(dataUrl, {
            onProgress: (p) => onProgress?.({ phase: 'pdf_ocr_progress', page: i, total: pagesToOcr, progress: p }),
        });

        ocrText += pageText + '\n';
    }

    ocrText = normalizeText(ocrText);

    if (!ocrText) {
        throw new Error(
            'No readable text detected in this PDF. If this is a scanned/handwritten PDF, OCR may need better scan quality or a backend OCR pipeline.'
        );
    }

    return ocrText;
};

export const extractTextFromFile = async (file, opts = {}) => {
    if (!file) return '';

    if (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
        return extractTextFromPdfFile(file, opts);
    }

    if (file.type?.startsWith('image/')) {
        return extractTextFromImageFile(file, opts);
    }

    throw new Error('Unsupported file type for text extraction');
};
