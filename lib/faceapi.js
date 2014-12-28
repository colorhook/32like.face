var request = require('request');
var faceapiConfig = require('../config/faceapi.config.json');
var API_ENDPOINT = faceapiConfig.server;
var API_KEY = faceapiConfig.key;
var API_SECRET = faceapiConfig.secret;

function detect(img, callback){
  var url = API_ENDPOINT + 'detection/detect?api_key=' + API_KEY;
  url += '&api_secret=' + API_SECRET;
  url += '&url=' + encodeURIComponent(img);
  url += '&attribute=glass,pose,landmark,gender,age,race,smiling&mode=oneface';
  request(url, function(error, response, body){
    if(error){
      return callback(error);
    }
    var json
    try{
      json = JSON.parse(body);
    }catch(e){
      return callback(e);
    }
    return callback(null, parseDetectResult(json));
  });
}

function parseDetectResult(json){
  return json;
}


exports.detect = detect;