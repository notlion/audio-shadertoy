var express = require("express"),
    ejs = require("ejs"),
    mongoose = require("mongoose"),
    requestURL = require("request");

require("./models").configureSchema(mongoose.Schema, mongoose);
var Shader = mongoose.model("Shader");

var app = express.createServer(express.logger());
app.db = mongoose.connect(process.env.MONGOLAB_URI);
app.configure(function() {
    app.set("view engine", "ejs");
    app.set("views", __dirname + "/views");
    app.set("view options", { layout : false });
    app.register("html", require("ejs"));
    app.use(express.static(__dirname + "/static"));
    app.use(express.bodyParser());
    app.use(express.logger());
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});


// index
app.get("/", function(req, res){
    res.render("index.html");
});


// toy
app.get("/toy", function(req, res){
    res.render("toy.html");
});


// pop
app.get("/pop", function(req, res){
    res.render("pop.html");
});


// get shaders
app.get("/get", function(req, res){
  var limit  = req.query["limit"];
  var skip = req.query["skip"];
  var query = Shader.find({  }).skip(skip).limit(limit);
  query.sort("date", -1);
  query.exec(function (err, shaders) {
    res.json({
      "status" : "OK",
      "shaders" : shaders
    });
  });
});


// get single by short_id
app.get("/short/:short_id",function(req, res){
  Shader.findOne({ short_id : req.params.short_id }, function(err, shader){
    if (err) {
      console.log(err);
      res.send("db error");
    }
    else if (shader === null ) {
      res.json({
        "status" : "NOT FOUND"
      });
    } else {
      res.json({
        "status" : "OK",
        "shader" : shader
      });
    }
  });
});


// save
app.post("/save", function(req, res){

  console.log("Receiving new shader to store...");
  console.log(req.body);

  var generateID = function(length) {
    var id = "";
    var chars = "qwrtypsdfghjklzxcvbnm0123456789";
    while(id.length < length) {
      var pos = Math.floor(Math.random() * chars.length - 1);
      id += chars.substring(pos, pos + 1);
    }
    return id;
  }

  var saveShader = function(iteration, callback) {
    var newShader = new Shader({
      short_id : generateID(iteration),
      code_lzma : req.body.code_lzma,
      track : req.body.track
    });
    newShader.save(function (err) {
      if (err === null) {
        callback(this.emitted.complete[0]);
      }
      else if (err.code === 11000) {
        console.log("Duplicate short_id; Generating another...");
        saveShader(iteration += 1, callback);
      }
    });
  };

  saveShader(1, function(savedShader) {
    console.log("Saving Success!", savedShader);
    res.json({
      "status" : "OK",
      "shader" : savedShader
    });
  });
});


// init
var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
