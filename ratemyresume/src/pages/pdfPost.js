import PdfViewHeader from '../components/pdfViewHeader';
import { useRouter } from 'next/router';
import Link from 'next/link'
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import Document and Page with server side rendering disabled
const Document = dynamic(() => import('react-pdf').then(mod => mod.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then(mod => mod.Page), { ssr: false });

export default function PdfPost() {
  const router = useRouter();
  const { file } = router.query;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Only import pdfjs on the client side
    const initPdf = async () => {
      const { pdfjs } = await import('react-pdf');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      setIsClient(true);
    };

    initPdf();
  }, []);

  const handlePostClick = async () => {
    try {
      const response = await fetch(file);
      const blob = await response.blob();

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Pdf = reader.result.split(',')[1];

        // TODO update the pdf metadata
        const mongodbData = {
          id: 0,
          major_tag: 'Art History',
          description: 'Art History Resume',
          likes: 0,
          pdf_file: base64Pdf
        };

        const result = await fetch('http://127.0.0.1:8000/create-item', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mongodbData),
        });

        if (result.ok) {
          console.log('MongoDB update success');
          router.push('/#explore');
        } else {
          console.error('MongoDB update failed');
        }
      };
    } catch (error) {
      console.error('Error posting resume:', error);
    }
  };

  return (
    <div className={`container font-montserrat transition-opacity duration-1000 `}>
      <PdfViewHeader />

      {
        isClient && file ? (
          <Document file={file}>
            <Page pageNumber={1} renderTextLayer={false} renderAnnotationLayer={false}/>
          </Document>
        ) : (
          <p>Loading PDF...</p>
        )
      }
      <div className="flex justify-between items-end absolute bottom-0 left-0 right-0 pb-4 px-6">
        <button className="border-2 border-cyan-400 text-cyan-400 py-2 px-4 font-bold hover:bg-cyan-400 hover:text-black transition duration-200">
          Edit
        </button>
        <button 
          onClick={handlePostClick}
          className="border-2 border-cyan-400 text-cyan-400 py-2 px-4 font-bold hover:bg-cyan-400 hover:text-black transition duration-200"
        >
          Post
        </button>
      </div>
    </div>
  );
}
