/**
 * Invoicely - PDF Export & Printing Engine
 * Handles client-side PDF compilation with html2pdf and print stylesheets
 */

const PDFExportService = (() => {
  /**
   * Downloads the current invoice as a PDF file
   * @param {HTMLElement} element - The invoice paper DOM element
   * @param {Object} metadata - Invoice metadata (number, client)
   * @param {Function} onProgress - Progress / status callback
   */
  async function downloadInvoicePDF(element, metadata = {}, onProgress = null) {
    if (!element) {
      console.error('Invoice element not found');
      return;
    }

    const invNum = (metadata.number || 'INVOICE').replace(/[^a-zA-Z0-9-_]/g, '_');
    const client = (metadata.client || 'Client').replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `${invNum}_${client}.pdf`;

    if (onProgress) onProgress(true, 'Preparing PDF generation...');

    // If html2pdf bundle is loaded via CDN
    if (typeof html2pdf !== 'undefined') {
      try {
        // Clone element or temporarily reset zoom transform to ensure 100% crisp DPI
        const currentTransform = element.style.transform;
        element.style.transform = 'none';

        const opt = {
          margin: [8, 8, 8, 8], // mm
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2, // 2x high resolution
            useCORS: true,
            logging: false,
            letterRendering: true,
            scrollY: 0
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
          },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        await html2pdf().set(opt).from(element).save();

        // Restore transform
        element.style.transform = currentTransform;

        if (onProgress) onProgress(false, 'PDF downloaded successfully!');
      } catch (err) {
        console.warn('html2pdf generation encountered error, falling back to print dialog:', err);
        // Fallback: trigger print
        if (onProgress) onProgress(false, 'Opening print dialog...');
        window.print();
      }
    } else {
      // Direct print fallback if CDN was unavailable
      if (onProgress) onProgress(false, 'Opening print dialog...');
      window.print();
    }
  }

  /**
   * Triggers the browser's native print window with print-optimized styling
   */
  function printInvoice() {
    window.print();
  }

  return {
    downloadInvoicePDF,
    printInvoice
  };
})();
