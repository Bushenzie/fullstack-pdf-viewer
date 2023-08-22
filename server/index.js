//IMPORTS
const _ = require("lodash");
const cacheController = require("./cache.js");
const { PDFDocument } = require('pdf-lib');
const fs = require("fs");
const shell = require("shelljs");
const path = require("path");
const cors = require("cors");
const express = require("express");

//SERVER SETTINGS
const app = express();
app.use(cors());

//CONFIG
const PORT = 3001;
const rootFolderForData = "data";
const skipDataFolder = true;
const IGNORED_FILES = [".DS_Store"];
const clearInterval = 10; //MINUTES
const defaultTTL = 3; //MINUTES
const maxCacheSize = 12.5; //MB
const maxPDFPageSize = 20; //MB before compression
const PDFCompressionDPI = 90; //DPI for compression if maxPDFPageSize is reached

//CACHE SETTINGS
cacheController.options = {
    defaultTTL, 
    clearInterval,
    maxCacheSize
}

//PRIMARY FUNCTION TO GET DATA , FIND PATH OR READ THE PDF
function getData(rootPath,mainFolder) {

    let returningObj = {};

    const scan = (path,previousFolder) => {
        //Base
        let allFiles = fs.readdirSync(path).filter(file => !IGNORED_FILES.includes(file));
        //Folders
        let folders = allFiles.filter(file => fs.statSync(`${path}/${file}`).isDirectory());
        //Celá cesta stringově
        let pathToFormat = folders.map(folder => `${previousFolder};${folder}`);

        //Převedení na objekt + merge
        pathToFormat.forEach((pth) => {
            let arr = pth.split(";");
            let currentObj = {};
            
            let pathToFiles = arr.reduce((prev,curr) => `${prev}/${curr}`);
            let files = fs.readdirSync(pathToFiles).filter(file => fs.statSync(`${pathToFiles}/${file}`).isFile() && !IGNORED_FILES.includes(file) && file.endsWith(".pdf"));

            for(let i = arr.length-1; i >= (skipDataFolder ? 1 : 0); i--) {      
                let temp_obj = {};                 
                temp_obj[arr[i]] = {...currentObj,files};
                files = [];
                currentObj = {...temp_obj};
            }

            _.merge(returningObj,currentObj);
        })
        
        //Pro každou složku udělám znova scan
        folders.forEach(folder => {
            scan(`${path}/${folder}`,`${previousFolder};${folder}`);
        })
    }

    scan(rootPath,mainFolder,[]);
    return JSON.parse(JSON.stringify(returningObj));
}

function findValuePath(object,valueToFind,currentPath = []) {
    
    let result;

    for(const [key,value] of Object.entries(object)) {
        if(typeof value === "object") {
            if(value.constructor === Array) {
                if(value.includes(valueToFind)) {
                    result = `${currentPath.join("/")}/${valueToFind}`;
                    return result;
                }
            } else {
                result = findValuePath(value,valueToFind,[...currentPath,key])

                if(result) break;
            }
        }
    }

    if(skipDataFolder && result && !result.startsWith(rootFolderForData)) {
        let temp_str = result;
        result = `${rootFolderForData}/${temp_str}`
    }
    return result;
}

async function shrinkPDF(path,buffer) {
    return new Promise(async (resolve,reject) => {
        let pathArr = path.split("/");
        let file = path.split("/").pop();
        let pathBeforeFile = pathArr.splice(0,pathArr.length-1).join("/");
    
        await fs.promises.writeFile(`${pathBeforeFile}/temp_${file}`,buffer)
        shell.exec(`./shrinkpdf.sh -r ${PDFCompressionDPI} -o \"${pathBeforeFile}/compressed_${file}\" \"${pathBeforeFile}/temp_${file}\"`,async (code) => {
            let bytes = await fs.promises.readFile(`${pathBeforeFile}/compressed_${file}`);
            shell.exec(`rm -rf \"${pathBeforeFile}/temp_${file}\"`);
            shell.exec(`rm -rf \"${pathBeforeFile}/compressed_${file}\"`);
            resolve(bytes);
        })
    })
}

async function fetchPDF(path,pageNum,file) {
    try {
        //CHATGPT - navedení jak vzít pouze 1 page.
        const fsData = await fs.promises.readFile(path);
        const pdfDoc = await PDFDocument.load(fsData);
        const pageCount = pdfDoc.getPageCount();
        let pdfBytes;

        if(!pageNum) {
            const pdfBytes = await pdfDoc.saveAsBase64();
            cacheController.set(file,{...cacheController.get(file),full:pdfBytes,pageCount},defaultTTL)
            return pdfBytes;
        } else {
            const newPdfDoc = await PDFDocument.create();
            const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNum-1]);
            newPdfDoc.addPage(copiedPage);
            const docForSize = await newPdfDoc.save();
            const newDocSize = await docForSize.length / (1024*1024);

            if(newDocSize > maxPDFPageSize) {
                await shrinkPDF(path,docForSize)
                .then(async (bytes) => {
                    let newDoc = await PDFDocument.load(bytes)
                    pdfBytes = await newDoc.saveAsBase64();
                });
            } else {
                pdfBytes = await newPdfDoc.saveAsBase64();
            }
            cacheController.set(file,{...cacheController.get(file),[pageNum]:pdfBytes,pageCount},defaultTTL)
            return {pdfBytes,pageCount};
        }
    } catch (error) {
        return error
    }
}

function readPDF(path,pageNum) {
    return new Promise(async (resolve,reject) => {
        if(path) {
            let file = path.split("/").pop();

            fetchPDF(path,pageNum,file)
                .then(data => {
                    resolve(data);
                }).catch(err => {
                    reject(err);
                })
        } else {
            reject("No path");
        }   
    })
}

//ROUTES
app.get("/data",(req,res) => {
    let data = getData(path.join(__dirname,rootFolderForData),rootFolderForData);
    res.json(data);
})

app.get("/data/:searched",(req,res) => {
    let data = getData(path.join(__dirname,rootFolderForData),rootFolderForData);
    let resultOfSearch = findValuePath(data,req.params.searched);
    cacheController.checkSize();
    cacheController.clearExpired();
    if(cacheController.get(req.params.searched) && cacheController.get(req.params.searched)[`${req.query.pageNum}`]) {
        res.send({
            file: cacheController.get(req.params.searched)[`${req.query.pageNum}`],
            pageCount: cacheController.get(req.params.searched)[`pageCount`]
        })
    } else {
        readPDF(resultOfSearch,req.query.pageNum).then(response => {
            res.send({
                file:response.pdfBytes,
                pageCount: response.pageCount
            })
        }).catch(error => {
            res.json({error});
        })
    }
})

app.listen(PORT,() => { 
    cacheController.startClearing()
    console.log(`Server is running on port ${PORT}`) 
});
