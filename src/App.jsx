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

  const [previewImage, setPreviewImage] = useState("");

  const [modifiedPdf, setModifiedPdf] = useState(null);

  const canvasRef = useRef(null);
  const [isSigning, setIsSigning] = useState(false);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [scaleFactor, setScaleFactor] = useState(1);

  const handleMouseDown = (e) => {
    setIsSigning(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    setLastX((e.clientX - rect.left) / scaleFactor);
    setLastY((e.clientY - rect.top) / scaleFactor);
  };

  const handleMouseMove = (e) => {
    if (!isSigning) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(
      (e.clientX - rect.left) / scaleFactor,
      (e.clientY - rect.top) / scaleFactor
    );
    ctx.stroke();
    setLastX((e.clientX - rect.left) / scaleFactor);
    setLastY((e.clientY - rect.top) / scaleFactor);
  };

  const handleMouseUp = () => {
    setIsSigning(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.offsetWidth / rect.width;
    const scaleY = canvas.offsetHeight / rect.height;
    setScaleFactor(Math.min(scaleX, scaleY));
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }, []);

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
    console.log(numPages);
  };

  return (
    <main className="container">
      <h1 className="font-bold text-center text-2xl mt-2 mb-10">
        Sample PDF E-Sign
      </h1>
      <div className="max-w-3xl mx-auto space-y-5">
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
          <div className="flex justify-between ">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="w-full border rounded-md h-fit rounded-tr-none rounded-br-none"
              id="signatureCanvas"
            ></canvas>
            <div className="flex flex-col">
              <button
                disabled={isLoading || !selectedFile}
                onClick={handleAddSignature}
                className="px-4 h-full disabled:bg-gray-300 disabled:cursor-not-allowed py-2 rounded-md border rounded-tl-none rounded-bl-none bg-green-500 text-white"
              >
                Bubuhkan
              </button>
              <button
                onClick={handleClearSignature}
                className="px-4 h-full py-2 rounded-md rounded-tl-none rounded-bl-none border bg-red-500 text-white"
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
              <h2>Modified PDF</h2>
              <div className="flex justify-center border">
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
