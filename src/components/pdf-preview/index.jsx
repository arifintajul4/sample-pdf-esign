import React, { useState } from "react";
import { Document, Page } from "react-pdf";

export default function PdfPreview(pdfFile) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(pageNumber + 1);
    }
  };

  return (
    <div>
      {pdfFile ? (
        <>
          <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
            <Page pageNumber={pageNumber} />
          </Document>
          <div>
            <button onClick={goToPrevPage} disabled={pageNumber <= 1}>
              Previous Page
            </button>
            <p>
              Page {pageNumber} of {numPages}
            </p>
            <button onClick={goToNextPage} disabled={pageNumber >= numPages}>
              Next Page
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
