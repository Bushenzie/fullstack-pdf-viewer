import { useState,useContext } from "react";
import { FileContext } from "../App";
import { LSController } from "../utils/localStorage";
import { FaRegWindowClose } from "react-icons/fa"
import { BsArrowsFullscreen } from "react-icons/bs"
import { AiOutlineMinusCircle, AiOutlinePlusCircle}  from "react-icons/ai"
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md"
import ReactLoading from 'react-loading';

export async function fetchPDF(fileName,pageNum=1) {
  try {
    const response = await fetch(`http://localhost:3001/data/${fileName}?pageNum=${pageNum}`);
    const data = await response.json();
    const pdfData = await Uint8Array.from(atob(data.file), c => c.charCodeAt(0)); //Stackoverflow fix 
    const pdfBlob = new Blob([pdfData], { type: 'application/pdf' });
    let pdfPageUrl = URL.createObjectURL(pdfBlob);
    pdfPageUrl += "#view=fit&toolbar=0&navpanes=0&scrollbar=0"
    return {
      url: pdfPageUrl,
      pageCount: data.pageCount
    };
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
}

function PDFViewer({fileName}) {
  
  const {setPdfData,pdfData,pageCount,currentPage,setCurrentPage,isLoading,setIsLoading} = useContext(FileContext);
  const [fullscreen,setFullcreen] = useState(false);

  function buttonPageControl(direction) {
    setIsLoading(true)
    LSController.set(fileName,currentPage+(direction));
    fetchPDF(fileName,currentPage+(direction)).then(fetchedData => {
      setIsLoading(false);
      setPdfData(fetchedData);
      setCurrentPage(currentPage+(direction))
    })
  }

  function toggleFullscreen() {
    setFullcreen(!fullscreen)
  }

  return (
    <>
      <div className="top-bar">
        <h1>
          <span className="file-name">{fileName.split(".pdf")[0]}</span>
          {isLoading && <ReactLoading type="bubbles" color="#000000" className="loading" width="5vw" height="5vh"/>}</h1>
        <div className="pages-container">
          <button onClick={toggleFullscreen}><BsArrowsFullscreen /></button>
          <button onClick={(e) => { 
            buttonPageControl(-1) 
          }} disabled={currentPage === 1}><AiOutlineMinusCircle /></button>
          <h5>
            <span id="currentPage">{currentPage}</span>
            /
            <span id="pageCount">{pageCount}</span>
          </h5>
          <button onClick={(e) => {
            buttonPageControl(+1) 
          }} disabled={currentPage === pageCount}><AiOutlinePlusCircle /></button>
        </div>
        
      </div>
      {!fullscreen ?
        <div className="iframe-wrapper">
          <iframe title={pdfData.file} src={pdfData.url}/>
        </div>
        :
        <div className="fullcreen-wrapper">
          <button className="close-btn" onClick={toggleFullscreen}><FaRegWindowClose /></button>

          <button className="fs-previous-page" onClick={(e) => {
            buttonPageControl(-1) 
          }} disabled={currentPage === 1}><MdKeyboardArrowLeft /></button>
          <div className="iframe-wrapper">
            <iframe allowtransparency="true" title={pdfData.file} src={pdfData.url}/>
          </div>
          <button className="fs-next-page" onClick={(e) => {
            buttonPageControl(+1) 
          }} disabled={currentPage === pageCount}><MdKeyboardArrowRight /></button>


          <div className="background"></div>
        </div>
      }
    </>
  )
}

export default PDFViewer