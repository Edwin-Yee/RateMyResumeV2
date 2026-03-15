import PdfViewHeader from '../components/pdfViewHeader';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// Load react-pdf components only on the client
const Document = dynamic(() => import('react-pdf').then((m) => m.Document), { ssr: false })
const Page = dynamic(() => import('react-pdf').then((m) => m.Page), { ssr: false })
// Load Disqus embed client-side only
const DiscussionEmbed = dynamic(() => import('disqus-react').then((m) => m.DiscussionEmbed), { ssr: false })

export default function PdfView() {
    const router = useRouter();
    const { file } = router.query;
    const [pdfReady, setPdfReady] = useState(false);

    // Set up pdfjs worker in the browser only
    useEffect(() => {
        if (typeof window === 'undefined') return;
        (async () => {
            try {
                const pdfjsDist = await import('pdfjs-dist/legacy/build/pdf');
                const ver = pdfjsDist.version || '3.4.120';
                pdfjsDist.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${ver}/pdf.worker.min.js`;
                setPdfReady(true);
            } catch (err) {
                console.error('Failed to set pdfjs worker in pdfView', err);
            }
        })();
    }, []);

    const fileUrl = file ? (file.startsWith('/') ? file : `/${file}`) : null;
    const url = `http://localhost:3000/pdfView?file=${file}`;

        return (
            // Use full-width container so embedded PDF and Disqus can expand
            <div className={`w-full font-montserrat transition-opacity duration-1000`}>
            <PdfViewHeader />
                {fileUrl ? (
                    <div>
                        {/* Primary viewer (react-pdf) */}
                        {pdfReady && (
                            <Document file={fileUrl} onLoadError={(e) => console.error('Document load error', e)}>
                                <Page pageNumber={1} renderTextLayer={false} renderAnnotationLayer={false} />
                            </Document>
                        )}

                        {/* Always-visible native embed fallback to ensure the file is visible */}
                        <div className="mt-4 w-full">
                            <object data={fileUrl} type="application/pdf" width="100%" height="1000vh" style={{maxHeight: '80vh'}}>
                                <a href={fileUrl} target="_blank" rel="noreferrer">Open PDF</a>
                            </object>
                        </div>

                        {/* Disqus comments (client-only) */}
                            <div className="mt-8 w-full" style={{minHeight: '40vh'}}>
                                <div style={{width: '100%'}}>
                                    <DiscussionEmbed
                                        shortname="ratemyresume-com"
                                        config={{
                                            url: url,
                                            identifier: file || fileUrl,
                                            title: file || fileUrl,
                                        }}
                                    />
                                </div>
                            </div>
                    </div>
                ) : (
                    <div className="p-4 text-red-600">No file specified in the URL query. Click a resume preview to navigate here.</div>
                )}
        </div>
    );
}
