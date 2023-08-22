import {useState,useEffect,createContext} from "react";
import ReactLoading from 'react-loading';
import Menu from "./components/Menu"
import Header from "./components/Header";
import PDFViewer,{fetchPDF} from "./components/PDFViewer";
import { LSController } from "./utils/localStorage";
import "./styles.scss";

export const FileContext = createContext(null);
export const PickContext = createContext(null);

function App() {
  const [data,setData] = useState([]);
  const [pdfData,setPdfData] = useState(null);
  const [pageCount,setPageCount] = useState(null)
  const [currentPage,setCurrentPage] = useState(1)
  const [pickedFile,setPickedFile] = useState(null);
  const [isLoading,setIsLoading] = useState(false);
  const [menuPickLoading,setMenuPickLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3001/data")
      .then(resp => resp.json())
      .then(fData => {
        setData(fData);
      });
  },[])

  useEffect(() => {
    if(pickedFile) {
      setIsLoading(true);
      setPdfData(null);

      let pageNum = LSController.get(pickedFile) ? LSController.get(pickedFile) : 1;

      fetchPDF(pickedFile,pageNum).then(data => {
        setIsLoading(false);
        setMenuPickLoading(false);
        setPdfData(data);
        setPageCount(data.pageCount);
        setCurrentPage(pageNum)
      })
    }
  },[pickedFile])

  return (
      <div className="container">
        <PickContext.Provider value={{setPickedFile,setMenuPickLoading}}>
          <div className="menu-container">
            <Header title="PDF Viewer" />
            <Menu data={data} />
          </div>
        </PickContext.Provider>
        <FileContext.Provider value={{pageCount,pdfData,setPdfData,currentPage,setCurrentPage,isLoading,setIsLoading}}>
          <div className="pdf-container">
            {(menuPickLoading && !pdfData) &&
              <div className="pdf-pick-container-loading">
                <ReactLoading type="spin" color="#000000"/>
              </div>
            }
            {pdfData && (
                <PDFViewer data={pdfData} fileName={pickedFile} />
              )
            }
          </div>
        </FileContext.Provider>
      </div>
  );
}

export default App;
