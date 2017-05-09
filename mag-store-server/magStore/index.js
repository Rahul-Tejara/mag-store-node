// import  all pakhage and all file path which is required ...

var express = require('express');
var router = express.Router();
var fs = require('fs');
var sendmail = require('sendmail')();



var bodyParser = require('body-parser')
router.use(bodyParser.urlencoded({  
  extended: true
  })); 

//  dababase connection
var mysql  = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root123',
  database : 'magstore_db'
});

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
 
  console.log('connected as id ' + connection.threadId);
});


// this is used for fethching product based on category s
router.get('/search', function (req,res) {
        // fetch res value and send response based on UI res ....
        var prduct_Name = req.query.prduct_Name;
        console.log("tab name  "+ prduct_Name);
        // console.log("res is from UI side" +  req.get('userid'));
        if(prduct_Name){
          prduct_Name = '%'+prduct_Name+'%';
          var queryString = 'SELECT id, productTitle, productUrl, productColor, productPrice FROM magproduct_tbl where productCategory LIKE   ?';
          connection.query(queryString, [prduct_Name], function(err, tabsData, fields) {
              if (err){
                 res.json({'status': 500, 'msg': err, 'tab_data': tabsData});
                 throw err;
              }
               else{
                  res.json({'status': 200, 'msg': 'success', 'tab_data': tabsData});
              }
        
           });

       }else {
            res.json({'status': 500, 'msg': 'Tab ID is '+ tabName, 'tab_data': tabsData});
       }// end if 

        
    });

// fetch  product contaion from DB based on tabname
router.get('/tabcontains', function (req,res) {
        // fetch res value and send response based on UI res ....
        var tabName = req.query.tabName;
        console.log("tab name  "+ tabName);
        // console.log("res is from UI side" +  req.get('userid'));
        if(tabName){
          var queryString = 'SELECT id, productTitle, productUrl, productColor, productPrice FROM magproduct_tbl where productTabName = ? ';
          connection.query(queryString, [tabName], function(err, tabsData, fields) {
              if (err){
                 res.json({'status': 500, 'msg': err, 'tab_data': tabsData});
                 throw err;
              }
               else{
                  res.json({'status': 200, 'msg': 'success', 'tab_data': tabsData});
              }
        
           });

       } else {
            res.json({'status': 500, 'msg': 'Tab ID is '+ tabName, 'tab_data': tabsData});
       }// end if 

        
    });

  

// insert add to cart item data into DB 
  router.post('/addtocart', function (req, res) {
      var queryString = 'INSERT INTO magcart_tbl (itemId, creatinTime, modificationTime, cartProductQuantity, updatedProductPrice)  select id, now(), now(), 1 , productPrice from magproduct_tbl where magproduct_tbl.id = ?;'
      var productId = req.body.productId;
      console.log("cartButtonId"+productId);
      if(productId){
          connection.query(queryString, [productId], function(err, rowsData, fields) {
              if (err){
                 res.json({'status': 500, 'msg': err, 'cart_totalItem': rowsData});
                 throw err;
              }
               else{ 
                      var totalItem;
                      var queryString = 'select count(*) as count from magcart_tbl';
                      connection.query(queryString, function(err, totalItem_Cart, fields) {
                      totalItem = totalItem_Cart[0].count;
                      res.json({'status': 200, 'msg': 'successfully inserted data in cart_tbl', 'cart_totalItem': totalItem});
                      });
              }
        
           });

       } else {
            res.json({'status': 500, 'msg': 'Tab ID is '+ productId, 'cart_totalItem': '' });
       }// end if 
   
      
  });

 // default call bind  total number of item in cart 
router.get('/displaytotalitem', function (req,res) {
        var queryString = 'select itemId from magcart_tbl';
        connection.query(queryString, function(err, totalItem_id, fields) {
           if (err){
               res.json({'status': 500, 'msg': err, 'itemId': totalItem_id});
               throw err;
            }
             else{
               res.json({'status': 200, 'msg': 'successfully fetched itemId from magcart_tbl', 'itemId': totalItem_id});
            }
        });

});

// its for display cart list item from DB  
router.get('/displayitemcart', function (req,res) {
        var queryString = 'select id, productUrl, productTitle, productColor, cartProductQuantity, updatedProductPrice from magproduct_tbl a, magcart_tbl b where a.id = b.itemId;';
        connection.query(queryString, function(err, itemList, fields) {
           if (err){
               res.json({'status': 500, 'msg': err, 'itemList': itemList});
               throw err;
            }
             else{
               res.json({'status': 200, 'msg': 'successfully fetched itemId from magcart_tbl', 'itemList': itemList});
            }
        });

});

 // this is used for quantity increse drese and remove product from cart list ...and update values in DB
  router.post('/quantity', function (req, res) {
      var queryString_fetchItem = 'select productPrice, cartProductQuantity, updatedProductPrice  from magproduct_tbl a, magcart_tbl b where a.id = b.itemId and b.itemId = ?;';
      var queryString_updateItem = 'UPDATE magcart_tbl SET modificationTime = now(), cartProductQuantity = ?, updatedProductPrice = ? where itemId = ?;';
      var queryString_removeItem = 'delete from magcart_tbl where itemId = ?;';
      var queryString_countItemCart = 'select count(*) as count from magcart_tbl';
      var productId = req.body.productId;
      var flag = req.body.flag;
      console.log("productId and flag"+productId, flag);
      if(productId){
           connection.query(queryString_fetchItem, [productId], function(err, rowsData, fields) {
              if (err){
                 res.json({'status': 500, 'msg': err, 'updatedQuantityList': rowsData});
                 throw err;
              }
              else{
                var ProductQuantity;
                var updatedProductPrice
                var productPrice
                if(flag == 'plus'){
                  ProductQuantity = rowsData[0].cartProductQuantity + 1;
                  updatedProductPrice = rowsData[0].productPrice * ProductQuantity ;
                  productPrice = rowsData[0].productPrice;
                } 
                else if(flag == 'minus'){
                  ProductQuantity = rowsData[0].cartProductQuantity - 1;
                  updatedProductPrice = rowsData[0].productPrice * ProductQuantity ;
                  productPrice = rowsData[0].productPrice;
                 // for remove req.....
                }else{
                  // ProductQuantity = rowsData[0].cartProductQuantity - 1;
                  updatedProductPrice = rowsData[0].updatedProductPrice;

                }// just updats value of all .....for both conditions....
                if( flag == 'plus' || flag == 'minus'){
                  connection.query(queryString_updateItem, [ProductQuantity, updatedProductPrice, productId], function(err, updateData, fields) {
                     if (err){
                       res.json({'status': 500, 'msg': err, 'updatedQuantityList': updateData, });
                       throw err;
                     }else{
                       data = { "ProductQuantity": ProductQuantity, "updatedProductPrice" : updatedProductPrice, "productPrice" : productPrice};
                       res.json({'status': 200, 'msg': 'successfully inserted data in cart_tbl', 'updatedQuantityList': data});
                     }
                  });
                }else if (flag == 'remove'){
                  connection.query(queryString_removeItem, [productId], function(err, removeitem, fields) {
                     if (err){
                       res.json({'status': 500, 'msg': err, 'removeData': removeitem });
                       throw err;
                     }else{
                        connection.query(queryString_countItemCart, function(err, countItem, fields) {
                        data = { "ProductQuantity": ProductQuantity, "updatedProductPrice" : updatedProductPrice, "totalItem": countItem[0].count};
                        res.json({'status': 200, 'msg': 'successfully inserted data in cart_tbl', 'removeData': data});
                       });
                      }
                  });
              }
            } // else
        
           });

      }
      else {
            res.json({'status': 500, 'msg': 'Tab ID is '+ productId, 'updatedQuantityList': '' });
       }// end if 
   
  });

// send email 
  router.post('/emailsubscribe', function (req, res) {
      var queryString = 'INSERT INTO magcart_tbl (itemId, creatinTime, modificationTime, cartProductQuantity, updatedProductPrice)  select id, now(), now(), 1 , productPrice from magproduct_tbl where magproduct_tbl.id = ?;'
      var email_addess = req.body.email_addess;
      console.log("email_addess"+email_addess);
      sendmail({
        from: 'rahulptdr47@gmail.com',
        to: email_addess,
        replyTo: 'rahulptdr47gmail.com',
        subject: 'Welcome mail for emailsubscribe',
        html: 'Thanks for subscribe email in mag store'
      }, function (err, reply) {
        // console.log(err && err.stack)
        // console.dir(reply)
        res.json({'status': 200, 'msg': 'successfully emailsubscribe'});

        

      })
      
      
  });


 // 

// export funciton 
module.exports = router;