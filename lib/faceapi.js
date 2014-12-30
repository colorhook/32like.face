var request = require('request');
var faceapiConfig = require('../config/faceapi.config.json');
var API_ENDPOINT = faceapiConfig.server;
var API_KEY = faceapiConfig.key;
var API_SECRET = faceapiConfig.secret;

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
    return callback(null, json);
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


exports.detectByBetaFace = function(img, callback){
  var body = '<?xml version="1.0" encoding="utf-8"?><ImageRequestUrl xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><api_key>d45fd466-51e2-4701-8da8-04351c872236</api_key><api_secret>171e8465-f548-401d-b63b-caf0dc28df5f</api_secret><detection_flags>cropface,recognition,propoints,classifiers,extended</detection_flags><image_url>'+img+'</image_url></ImageRequestUrl>';
  request.post({
    url: 'http://www.betafaceapi.com/service.svc/UploadNewImage_Url',
    headers: {
      'Content-Length': body.length,
      'Content-Type': 'application/xml',
      'Referer': 'http://www.betafaceapi.com/demo.html',
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
    },
    body: body
  }, function(err,httpResponse,body){
    var regexp = /<string_response>ok<\/string_response><img_uid>(.+)<\/img_uid>/;
    var matched = body.match(regexp);
    if(!matched){
      return callback(body);
    }
    body = '<?xml version="1.0" encoding="utf-8"?><ImageInfoRequestUid><api_key>d45fd466-51e2-4701-8da8-04351c872236</api_key><api_secret>171e8465-f548-401d-b63b-caf0dc28df5f</api_secret><img_uid>' + matched[1]+ '</img_uid></ImageInfoRequestUid>';
    request.post({
      url: 'http://www.betafaceapi.com/service.svc/GetImageInfo',
      headers: {
        'Content-Length': body.length,
        'Content-Type': 'application/xml',
        'Referer': 'http://www.betafaceapi.com/demo.html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
      },
      body: body
    }, function(err,httpResponse,body){
      var jsxml = require('node-jsxml');
      try{
        var xml = new jsxml.XML(body);
        var face = xml.child("faces").child("FaceInfo");
        if(face.length() == 0){
          return callback(body)
        }
        var obj = {face_id: xml.child("uid").toString(), betaface: 1}
        face.child("tags").child("TagInfo").each(function(item){
          obj[item.child("name").toString()] = {
            value: item.child("value").toString(),
            confidence: item.child("confidence").toString()
          }
        });
        callback(null, obj);
      }catch(e){
        return callback(e);
      }
    });
  });
}