//lets require/import the mongodb native drivers.
var express = require("express"),
    myUrl = require("url"),
    app = express(),
    mongodb = require("mongodb");

//We need to work with "MongoClient" interface in order to connect to a mongodb server.    
var MongoClient  = mongodb.MongoClient;


var url = 'mongodb://localhost:27017/camperproject';

function validateUrl(value) {
  return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}

function getRandomArbitrary() {
  var urlkey =  Math.floor(Math.random() * (9999 - 1000)) + 1000;
  return urlkey;
}

function rescuDataForWrite (collect,url, db, pagesend){
    collect.find().toArray(function(err, docs){
        if (err) throw err;
        var keyurl = getRandomArbitrary();
        if(docs.length == 0){
            //creat first data in DB
            var myObj = {original_url:url,short_url:keyurl};
            collect.insertOne(myObj,(err, res)=>{
                if(err) throw err;
                pagesend.send( {original_url:url,short_url:'https://camper-api-project-celsio.c9users.io/'+keyurl});
                
            });
        }else{
            //add data creation
            var shortList=[]; 
            
            for(var i=0; i< docs.length; i++){
                shortList.push(docs[i].urlshort); 
            }
            console.log(searchKey(keyurl, shortList ));
            // test if url short exite 
            while(searchKey(keyurl, shortList )){
                keyurl = getRandomArbitrary();
            }
            
            var myObj = {original_url:url,short_url:keyurl};
            //insert new item
            collect.insertOne(myObj,(err, res)=>{
                if(err) throw err;
                console.log('record inserted');
                pagesend.send( {original_url:url,short_url:'https://camper-api-project-celsio.c9users.io/'+keyurl});
            
            });
            
        }
        db.close();
       
    });
    
}

//test exitence for url code (short)
function searchKey(urlk, list){
    var val = false
    for(var i=0; i< list.length; i++){
        if(list[i] == urlk){return true;}; 
    }
    return val;
}
app.get('/new/:id*',  function(req, res){
    
    var viewData = {}, myUrl = req.params.id+req.params['0'];
    viewData['error'] = "Wrong url format, make sure you have a valid protocol and real site. 2";
    if (validateUrl(myUrl) == true){
        MongoClient.connect(url, (err, db) =>{
            if(err){
                console.log('Unable to connect to the mongoDB server. Error:', err);
            }else{
                console.log('Connection established to', url);
        
                // do some work here with the database.
                var collection = db.collection('urlshotener');
                collection.find(
                    { original_url: myUrl},{"_id": 0}
                ).toArray(function(err, docs){
                    if (err) throw (err)
                    console.log(docs.length);
                    if(docs.length == 0){
                        rescuDataForWrite(collection,myUrl, db,res);
                        
                    }else{
                        //return is chorter
                        //result = docs[0].short_url
                        res.send(docs[0]);
                    }
                })
                //Close connection
                //console.log('DB CLOSED');
                db.close();
            }
        });
        
    }else{
        res.send(viewData['error']);
        
    }
});
app.get('/:id', function(req, res){
    var viewData = {};
    
    viewData['error'] = "Wrong url format, make sure you have a valid protocol and real site.";
    var url_params = req.params.id;
    
    if(url_params.length == 4 || !isNaN(url_params)){
        MongoClient.connect(url, (err, db) =>{
            if(err){
                console.log('Unable to connect to the mongoDB server. Error:', err);
            }else{
                console.log('Connection established to', url);
        
                // do some work here with the database.
                var myobj={ "short_url":parseInt(url_params)}
                var collection = db.collection('urlshotener');
                collection.find(
                    myobj,{"_id": 0}
                ).toArray(function(err, docs){
                    
                    if (err) throw err;
                    if(docs.length == 0){
                        res.send({"error": "This url is not on the database."});
                    }else{
                        //res.send(docs[0])
                        res.redirect(docs[0].original_url);
                    }
                //console.log('DB CLOSE')
                //Close connection
                db.close();    
                });
            }
        });
    }else{
        console.log('PAS DE VALEUR');
        res.send({"error": "This url is not on the database. "});
    }
});

app.listen('8080', function(){
    
	console.log('This app listen port 8080');

})