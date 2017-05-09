// import  all pakhage and all file path which is required ...

var express = require('express');
var app = express();


var indexJs = require('./magStore/index');


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});



app.listen(3000, function () {
  console.log(' app listening on port 3000!');
})

// call to another files and we can hit the URLS Based on this /index
app.use('/index', indexJs);