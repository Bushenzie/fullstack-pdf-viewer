# Fullstack PDF Viewer

Fullstack PDF viewer made with Node.js/Express and React for browsing PDF locally

## Installed requirements

- Node.js
- NPM

## How to use it

1. Clone the repo
2. Navigate into both folders server && client and run `npm install` to install packages
3. In server folder run `npm start`
4. In client folder run `npx serve -s dist`
5. To add PDFs to view ,just navigate to server folder ,where you can create as much folders as you want with PDFs -> each folder will represent one menu item
6. If you want to configure caching or maximum size of PDF page before compression ,it can all be modified in server/index.js and variables under the comment` //CONFIG`
