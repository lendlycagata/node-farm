const fs = require('fs');
const http = require('http');
const url = require('url');
const slugify = require('slugify');
const replaceTemplate = require('./modules/replaceTemplate');

//db connection
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
var db=mongoose.connection; 
mongoose
  .connect(DB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DB connection successful!'));

/////////////////////////////////
// SERVER
const tempOverview = fs.readFileSync(
  `${__dirname}/templates/template-overview.html`,
  'utf-8'
);
const tempCard = fs.readFileSync(
  `${__dirname}/templates/template-card.html`,
  'utf-8'
);
const tempProduct = fs.readFileSync(
  `${__dirname}/templates/template-product.html`,
  'utf-8'
);

const feed = fs.readFileSync(
  `${__dirname}/templates/template-feedback.html`,
  'utf-8'
);

const success = fs.readFileSync(
  `${__dirname}/templates/success.html`,
  'utf-8'
);

const data = fs.readFileSync(`${__dirname}/dev-data/data.json`, 'utf-8');
const dataObj = JSON.parse(data);

const slugs = dataObj.map(el => slugify(el.productName, { lower: true }));
console.log(slugs);

const { parse } = require('querystring');
const server = http.createServer((req, res) => {
  const { query, pathname } = url.parse(req.url, true);

  // Overview page
  if (pathname === '/' || pathname === '/overview') {
    res.writeHead(200, {
      'Content-type': 'text/html'
    });

    const cardsHtml = dataObj.map(el => replaceTemplate(tempCard, el)).join('');
    const output = tempOverview.replace('{%PRODUCT_CARDS%}', cardsHtml);
    res.end(output);

    // Product page
  } else if (pathname === '/product') {
    res.writeHead(200, {
      'Content-type': 'text/html'
    });
    const product = dataObj[query.id];
    const output = replaceTemplate(tempProduct, product);
    res.end(output);

    // API
  } else if (pathname === '/api') {
    res.writeHead(200, {
      'Content-type': 'application/json'
    });
    res.end(data); 

  }//feedback
  else if (pathname === '/feedback') {
    res.writeHead(200, {
      'Content-type': 'text/html'
    });
    res.end(feed); 
   
  }// success
  else if (pathname === '/success') {
    res.writeHead(200, {
      'Content-type': 'text/html'
    });
    
   save = []
    if (req.method === 'POST'){
      let body='';
      req.on('data', chunk => {
        body += chunk.toString();
        
      });
      req.on('end', () => {
        
        db.collection('feedback').insertOne(parse(body),function(err, collection){ 
         if (err) throw err; 
        console.log("Record inserted Successfully");           
       });      
        res.end(success); 
      });      

    } 
    
  }

    // Not found
  else {
    res.writeHead(404, {
      'Content-type': 'text/html',
      'my-own-header': 'hello-world'
    });
    res.end('<h1>Page not found!</h1>');
  }
});




server.listen(8000, '127.0.0.1', () => {
  console.log('Listening to requests on port 8000');
});
