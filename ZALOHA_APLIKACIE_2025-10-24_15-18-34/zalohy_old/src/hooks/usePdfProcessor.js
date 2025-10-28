import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Nastavení PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export const usePdfProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const processPdf = useCallback(async (file) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const maxPages = Math.min(pdf.numPages, 10); // Limit na 10 strán
      const images = [];
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport }).promise;
        
        const imageData = canvas.toDataURL('image/png');
        images.push({
          pageNumber: i,
          imageData: imageData.split(',')[1], // Odstraní data:image/png;base64, prefix
          preview: i <= 3 // První 3 stránky jako preview
        });
        
        setProgress((i / maxPages) * 100);
      }

      return {
        success: true,
        images,
        totalPages: pdf.numPages,
        processedPages: maxPages
      };

    } catch (error) {
      console.error('PDF processing error:', error);
      setError(error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const processMultiplePdfs = useCallback(async (files) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    const results = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress((i / totalFiles) * 100);
      
      const result = await processPdf(file);
      results.push({
        file,
        ...result
      });
    }

    setProgress(100);
    setIsProcessing(false);
    
    return results;
  }, [processPdf]);

  return {
    processPdf,
    processMultiplePdfs,
    isProcessing,
    progress,
    error
  };
};







