export const handlePrint = () => {
    window.scrollTo(0, 0);
    window.print();
};

// Optional: print specific area (backup method)
export const printPrintArea = () => {
    const printArea = document.getElementById('printArea');
    if (printArea) {
        const printContents = printArea.outerHTML;
        const originalContents = document.body.innerHTML;

        document.body.innerHTML = `
      <div class="print-only">${printContents}</div>
      <style>
        @media print { body { margin: 0; } }
        @page { margin: 1in; }
      </style>
    `;

        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); // Reset page
    }
};
