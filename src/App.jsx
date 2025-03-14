import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { PDFDocument, StandardFonts } from "pdf-lib";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

function App() {
  const [isLoading, setIsloading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(1);

  const [modifiedPdf, setModifiedPdf] = useState(null);

  const canvasRef = useRef(null);
  const [isSigning, setIsSigning] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);

  const handleMouseDown = (e) => {
    setIsSigning(true);
    setLastX(e.nativeEvent.offsetX);
    setLastY(e.nativeEvent.offsetY);
  };

  const handleMouseMove = (e) => {
    if (!isSigning) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
    setLastX(e.nativeEvent.offsetX);
    setLastY(e.nativeEvent.offsetY);
  };

  const handleMouseUp = () => {
    setIsSigning(false);
  };

  const handleTouchStart = (e) => {
    setIsSigning(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    setLastX(touch.clientX - rect.left);
    setLastY(touch.clientY - rect.top);
  };

  const handleTouchMove = (e) => {
    if (!isSigning) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
    setLastX(touch.clientX - rect.left);
    setLastY(touch.clientY - rect.top);
  };

  const handleTouchEnd = () => {
    setIsSigning(false);
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleAddSignature = async () => {
    try {
      // Read the PDF file from input
      const inputPdfFile = document.getElementById("inputPdf").files[0];
      const inputPdfBytes = await inputPdfFile.arrayBuffer();

      // Read the signature image from canvas
      const signatureCanvas = document.getElementById("signatureCanvas");
      const signatureImage = signatureCanvas.toDataURL("image/png");

      // Load the existing PDF document
      const pdfDoc = await PDFDocument.load(inputPdfBytes);

      // Get the last page of the PDF
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];

      // lastPage.removeText();

      // Embed the signature image
      const signatureImageBytes = await fetch(signatureImage).then((res) =>
        res.arrayBuffer()
      );
      const signatureImageEmbed = await pdfDoc.embedPng(signatureImageBytes);

      // Add the signature image to the last page
      const { width, height } = signatureImageEmbed.scale(0.5);
      const x = lastPage.getWidth() - width;
      const y = 25;
      lastPage.drawImage(signatureImageEmbed, {
        x: x,
        y: y,
        width: width,
        height: height,
      });

      // Save the modified PDF document
      const modifiedPdfBytes = await pdfDoc.save();

      // Create a Blob from the modified PDF bytes
      // const modifiedPdfBlob = new Blob([modifiedPdfBytes], {
      //   type: "application/pdf",
      // });

      // Set the modified PDF as the source for displaying
      const modifiedPdfBlob = new Blob([modifiedPdfBytes], {
        type: "application/pdf",
      });
      setModifiedPdf(URL.createObjectURL(modifiedPdfBlob));
      // Download the modified PDF
      // const downloadLink = document.createElement("a");
      // downloadLink.href = URL.createObjectURL(modifiedPdfBlob);
      // setPreviewImage(modifiedPdfBlob);
      // console.log(URL.createObjectURL(modifiedPdfBlob));
      // downloadLink.download = "modified.pdf";
      // downloadLink.click();
    } catch (error) {
      console.error("Error adding signature to PDF:", error);
    }
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

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <main className="container">
      <h1 className="font-bold text-center text-2xl mt-2 mb-10">
        Sample PDF E-Sign
      </h1>
      <div className="sm:max-w-3xl px-5 mx-auto space-y-5">
        <div>
          <p className="mb-1 font-semibold">Pilih File PDF</p>
          <div className="flex">
            <input
              id="inputPdf"
              onChange={handleFileChange}
              type="file"
              className="border rounded-md rounded-tr-none rounded-br-none p-2 w-full"
            />
          </div>
          {message && <p className="text-green-500 text-sm mt-2">{message}</p>}
        </div>
        <div>
          <p className="mb-1 font-semibold">Tanda Tangan</p>
          <div className="sm:flex md:flex">
            <canvas
              ref={canvasRef}
              width={330}
              height={200}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              style={{ touchAction: "none" }}
              className=" border rounded-md mx-auto sm:m-0 sm:rounded-tr-none sm:rounded-br-none"
              id="signatureCanvas"
            ></canvas>
            <div className="flex flex-col">
              <button
                disabled={isLoading || !selectedFile}
                onClick={handleAddSignature}
                className="px-4 w-[330px] sm:w-auto mx-auto h-full disabled:bg-gray-300 disabled:cursor-not-allowed py-2 rounded-md border sm:rounded-tl-none sm:rounded-bl-none bg-green-500 text-white"
              >
                Bubuhkan
              </button>
              <button
                disabled={isSigning}
                onClick={handleClearSignature}
                className="px-4 w-[330px] sm:w-full disabled:bg-gray-300 disabled:cursor-not-allowed mx-auto h-full py-2 rounded-md sm:rounded-tl-none sm:rounded-bl-none border bg-red-500 text-white"
              >
                Ulangi
              </button>
            </div>
          </div>
        </div>
        <div>
          <p className="font-semibold">Hasil</p>
          {modifiedPdf ? (
            <div style={{ marginTop: "20px" }}>
              <div className="flex justify-center border max-w-screen sm:max-w-full overflow-scroll">
                <Document
                  file={modifiedPdf}
                  onLoadSuccess={onDocumentLoadSuccess}
                >
                  <Page pageNumber={pageNumber} />
                </Document>
              </div>
              <div className="flex gap-5 justify-center my-10">
                <button onClick={goToPrevPage} disabled={pageNumber <= 1}>
                  Previous Page
                </button>
                <p>
                  Page {pageNumber} of {numPages}
                </p>
                <button
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                >
                  Next Page
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default App;
