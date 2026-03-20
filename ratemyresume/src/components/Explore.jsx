import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic'
const Select = dynamic(() => import('react-select'), { ssr: false })
import Link from 'next/link';
import axios from 'axios'

// Load react-pdf components only on the client to avoid SSR errors (pdfjs expects browser globals)
const Document = dynamic(() => import('react-pdf').then((mod) => mod.Document), { ssr: false })
const Page = dynamic(() => import('react-pdf').then((mod) => mod.Page), { ssr: false })

const pdfFiles = [
  "test1.pdf",
  "test2.pdf",
  "test3.pdf",
  "test4.pdf",
  "test5.pdf",
  "test6.pdf",
  "test7.pdf",
  // add more pdf urls
];

const options = [
  { value: 'highestRated', label: 'Highest Rated' },
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'hot', label: 'Hot' },
];

const customStyles = {
    option: (provided, state) => ({
      ...provided,
      color: state.isSelected ? 'white' : 'black',
      backgroundColor: state.isSelected ? 'black' : 'white',
    }),
    control: (provided) => ({
      ...provided,
      color: 'black',
    }),
  };

export default function Explore() {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pdfReady, setPdfReady] = useState(false);
  const [fileStatus, setFileStatus] = useState({}); // index -> 'loading'|'loaded'|'error'

  useEffect( () => {
    axios.get('http://127.0.0.1:8000/get-all').then(res => {
      console.log(res)
    });
  }, [])

  const handleSelectChange = (option) => {
    setSelectedOption(option);
    // Add your sorting logic here based on the selected option
  };

  // Set up pdfjs worker in the browser only
  useEffect(() => {
    if (typeof window === 'undefined') return

    (async () => {
      try {
        // Import pdfjs-dist directly (legacy build) in the browser to avoid evaluating
        // react-pdf's bundled pdfjs during module loading which can cause webpack issues.
        const pdfjsDist = await import('pdfjs-dist/legacy/build/pdf')
        if (pdfjsDist && typeof pdfjsDist === 'object') {
          const ver = pdfjsDist.version || '3.4.120'
          pdfjsDist.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${ver}/pdf.worker.min.js`
          console.log('pdfjs worker set via pdfjs-dist legacy, version', ver)
          setPdfReady(true)
        }
      } catch (err) {
        console.error('Failed to set pdfjs workerSrc', err)
      }
    })()
  }, [])

  return (
    <div className="min-h-screen p-10">
      <h1 className="text-cyan-300 text-center text-3xl md:text-5xl font-bold mb-4">Find Your Inspiration.</h1>
      <div className="flex justify-between mb-4">
        <Select 
          options={options} 
          styles={customStyles}
          value={selectedOption} 
          onChange={handleSelectChange} 
        />
        <input 
          type="text" 
          placeholder="Search..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="border rounded p-2"
        />
      </div>
      <div className="grid grid-cols-4 gap-4">
      {pdfFiles.map((pdfFile, index) => {
        const fileUrl = pdfFile.startsWith('/') ? pdfFile : `/${pdfFile}`
        return (
        <Link key={index} href={`/pdfView?file=${encodeURIComponent(pdfFile)}`}>
            <div 
            className={`w-full h-full relative ${hoverIndex === index ? 'bg-cyan-200' : ''}`}
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
            >
            <div className="absolute inset-0 z-10 bg-cyan-500 opacity-0 hover:opacity-25 transition-opacity duration-200"></div>
                  {/* Use native PDF embed for previews to avoid react-pdf rendering issues */}
                  <object data={fileUrl} type="application/pdf" width="250" height="300">
                    <div className="p-4 text-center">
                      <p>Preview unavailable. <a href={fileUrl} target="_blank" rel="noreferrer">Open PDF</a></p>
                    </div>
                  </object>
            {/* Fallback native embed to confirm file serves correctly */}
            {!pdfReady && (
              <div className="mt-2">
                <object data={fileUrl} type="application/pdf" width="250" height="300">
                  <a href={fileUrl} target="_blank" rel="noreferrer">Open PDF</a>
                </object>
              </div>
            )}
            {fileStatus[index] === 'error' && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-700">Preview failed</div>
            )}
            </div>
        </Link>
        )
      })}
      </div>
    </div>
  );
}
