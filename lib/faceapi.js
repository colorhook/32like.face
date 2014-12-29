var request = require('request');
var faceapiConfig = require('../config/faceapi.config.json');
var API_ENDPOINT = faceapiConfig.server;
var API_KEY = faceapiConfig.key;
var API_SECRET = faceapiConfig.secret;

function parseDetectResult(json){
  return json;
}

exports.detect = function(img, callback){
  var url = API_ENDPOINT + 'detection/detect?api_key=' + API_KEY;
  url += '&api_secret=' + API_SECRET;
  url += '&url=' + encodeURIComponent(img);
  url += '&attribute=glass,pose,landmark,gender,age,race,smiling&mode=oneface';
  request(url, function(error, response, body){
    if(error){
      return callback(error);
    }
    var json;
    try{
      json = JSON.parse(body);
    }catch(e){
      return callback(e);
    }
    return callback(null, parseDetectResult(json));
  });
};

exports.getAllFaceset = function(callback){
  var url = API_ENDPOINT + 'info/get_faceset_list?api_key=' + API_KEY;
  url += '&api_secret=' + API_SECRET;
  request(url, function(error, response, body){
    if(error){
      return callback(error);
    }
    var json;
    try{
      json = JSON.parse(body);
    }catch(e){
      return callback(e);
    }
    return callback(null, json.faceset || []);
  });
}

exports.createFaceset = function(name, callback){
  var url = API_ENDPOINT + 'faceset/create?api_key=' + API_KEY;
  url += '&api_secret=' + API_SECRET;
  url += '&faceset_name=' + encodeURIComponent(name);
  
  request(url, function(error, response, body){
    if(error){
      return callback(error);
    }
    var json;
    try{
      json = JSON.parse(body);
    }catch(e){
      return callback(e);
    }
    if(json.faceset_id){
      return callback(null, json);
    }else{
      return callback(json);
    }
  });
}

exports.removeFaceset = function(id, callback){
  var url = API_ENDPOINT + 'faceset/delete?api_key=' + API_KEY;
  url += '&api_secret=' + API_SECRET;
  url += '&faceset_id=' + encodeURIComponent(id);
  request(url, function(error, response, body){
    if(error){
      return callback(error);
    }
    var json;
    try{
      json = JSON.parse(body);
    }catch(e){
      return callback(e);
    }
    if(json.success){
      return callback(null);
    }else{
      return callback(json);
    }
  });
}

exports.addFaceToFaceset = function(faceid, facesetid, callback){
  var url = API_ENDPOINT + 'faceset/add_face?api_key=' + API_KEY;
  url += '&api_secret=' + API_SECRET;
  url += '&faceset_id=' + encodeURIComponent(facesetid);
  url += '&face_id=' + encodeURIComponent(faceid);
  
  request(url, function(error, response, body){
    if(error){
      return callback(error);
    }
    var json;
    try{
      json = JSON.parse(body);
    }catch(e){
      return callback(e);
    }
    if(json.success){
      return callback(null);
    }else{
      return callback(json);
    }
  });
}

exports.removeFaceFromFaceset = function(faceid, facesetid, callback){
  var url = API_ENDPOINT + 'faceset/remove_face?api_key=' + API_KEY;
  url += '&api_secret=' + API_SECRET;
  url += '&faceset_id=' + encodeURIComponent(facesetid);
  url += '&face_id=' + encodeURIComponent(faceid);
  
  request(url, function(error, response, body){
    if(error){
      return callback(error);
    }
    var json;
    try{
      json = JSON.parse(body);
    }catch(e){
      return callback(e);
    }
    if(json.success){
      return callback(null);
    }else{
      return callback(json);
    }
  });
}

exports.getFacesFromFaceset = function(id, callback){
  var url = API_ENDPOINT + 'faceset/get_info?api_key=' + API_KEY;
  url += '&api_secret=' + API_SECRET;
  url += '&faceset_id=' + encodeURIComponent(id);
  request(url, function(error, response, body){
    if(error){
      return callback(error);
    }
    var json;
    try{
      json = JSON.parse(body);
    }catch(e){
      return callback(e);
    }
    if(json.face){
      return callback(null, json.face);
    }else{
      return callback(json);
    }
  });
}