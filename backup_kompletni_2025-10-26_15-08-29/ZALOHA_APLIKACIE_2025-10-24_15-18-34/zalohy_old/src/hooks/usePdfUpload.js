import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const usePdfUpload = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState(null);

  const convertPDFToImages = useCallback(async (file) => {
    setIsConverting(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const images = [];

      for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport }).promise;
        const imageData = canvas.toDataURL('image/png').split(',')[1];
        images.push({ pageNumber: i, imageData });
      }

      return images;
    } catch (error) {
      console.error('PDF conversion error:', error);
      setError(error.message);
      throw new Error(`Chyba při konverzi PDF: ${error.message}`);
    } finally {
      setIsConverting(false);
    }
  }, []);

  return {
    convertPDFToImages,
    isConverting,
    error
  };
};







