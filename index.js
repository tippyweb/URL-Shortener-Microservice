/**
 * ################################################################
 *  URL Shortener Microservice - 2024-10-07
 * ################################################################
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// adding modules
//const res = require('express/lib/response');
const dns = require('dns');
const URL = require("url").URL;
let bodyParser = require("body-parser");

// adding MongoDB/mongoose
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// setting up Schema and DB model
const Schema = mongoose.Schema;

const shorturlSchema = new Schema({
  original_url: {
     type: String,
     required: true,
     unique: true
   },
   short_url: {
     type: Number,
     required: true,
     unique: true
   }
});

const Shorturl = mongoose.model("Shorturl", shorturlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

// app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

/*
// display current database contents
Shorturl.find({})
          .then((err, data) => {
            if (err) return console.log(err);
            if (data) {
              console.log("Database data: " + JSON.stringify(data));
              return data;
            }
          });
*/

// Request to make a shorturl
app.post("/api/shorturl", async (req, res) => {

/**
 * console.log("App.post API endpoint here...");
 * console.log("Req.body:   " + JSON.stringify(req.body));
 * console.log("Req.params: " + JSON.stringify(req.params));
 * console.log("Req.query:  " + JSON.stringify(req.query));
 */

  // Retrieve the url data from the request
  const original_url = req.body.url;
  var short_url;
  var urlObject;

  try {
    // Validate the url format
    const validatedUrl = new URL(original_url);

    // Check if the url exists
    dns.lookup(validatedUrl.hostname, (err, address, family) => {

      if (! address) {
        // Handle non-existing url
         return res.json({
                 'error': 'invalid url'
                });

      // URL is valid and existing
      } else {

        // Check if the url exists in the database
        Shorturl.findOne({original_url: original_url})
          .then((foundUrl) => {

            if (foundUrl) {
              urlObject = {
                original_url: foundUrl.original_url,
                short_url: foundUrl.short_url
              };
            
              // Respond with the shorturl data for already existing urls
              return res.json(urlObject);

            // The url doesn't exist in the database
            } else {
              short_url = 1;

              // Find the latest short url in the database
              Shorturl.find()
                .sort({"short_url": -1 })  // Sort in descending order
                .limit(1)
                .then((latestURL) => {

                  if (latestURL) {
                    short_url = Number(latestURL[0].short_url) + 1;
                  }
                  urlObject = {
                    original_url: original_url,
                    short_url: short_url
                  };

                  // Save the new URL in the database
                  const newURL = new Shorturl(urlObject);
                  newURL.save();

                  // Return the short_url data
                  return res.json(urlObject);
                  
                })
                .catch((err) => {
                  return console.log(err);

                });  // Shorturl.find({})

            }  // else

          })
          .catch((err) => {
            return console.log(err);

          });  // Shorturl.findOne({original_url: original_url})

      }  // if (! address)
    
    });  // dns.lookup(validatedUrl.hostname, (err, address, family) => {

  // URL is not in the right format  
  } catch (err) {
    // Handle invalid url
    return res.json({
             'error': 'invalid url'
           });
  }

});


// Request to go to website using the shorturl
app.get("/api/shorturl/:shorturl", (req, res) => {

/**
 * console.log("App.get API endpoint here...");
 * console.log("Req.body:   " + JSON.stringify(req.body));
 * console.log("Req.params: " + JSON.stringify(req.params));
 * console.log("Req.query:  " + JSON.stringify(req.query));
 */

  // Handle the data in the request
  const short_url = Number(req.params.shorturl);
  let redirect_url;

  // Find the original url from the database
  Shorturl.findOne({short_url: short_url})
    .then((data) => {
      // Check returned data from the database
      if (data != null) {
        redirect_url = data.original_url;
      } else {
        redirect_url = "";
      }
    })
    .catch((err) => {
      return console.log(err);
    })
    .finally(() => {
      // Redirect url
      if (redirect_url != "") {
        return res.redirect(redirect_url);

      // Short_url does not exist
      } else {
        return res.json({
                 "error": "The short url does not exist!"
               });
      }
    });

});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});