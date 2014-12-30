var request = require('request');
var logger = require('./logger');
var faceapiConfig = require('../config/faceapi.config.json');
var API_ENDPOINT = faceapiConfig.server;
var API_KEY = faceapiConfig.key;
var API_SECRET = faceapiConfig.secret;

exports.detectByFacePlus = function(img, callback){
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
    if(!json.face && json.face.length){
      logger.info("faceplus的face为空");
      return callback(json);
    }
    return callback(null, json.face[0]);
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
  var handler = {};
  handler.request = request.post({
    url: 'http://www.betafaceapi.com/service.svc/UploadNewImage_Url',
    headers: {
      'Content-Length': body.length,
      'Content-Type': 'application/xml',
      'Connection': 'keep-alive',
      'Referer': 'http://www.betafaceapi.com/demo.html',
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
    },
    body: body
  }, function(err, httpResponse, body){
    if(!body || err){
      return callback(err || 'nobody');
    }
    var regexp = /<string_response>ok<\/string_response><img_uid>(.+)<\/img_uid>/;
    var matched = body.match(regexp);
    if(!matched){
      return callback(body);
    }
    body = '<?xml version="1.0" encoding="utf-8"?><ImageInfoRequestUid><api_key>d45fd466-51e2-4701-8da8-04351c872236</api_key><api_secret>171e8465-f548-401d-b63b-caf0dc28df5f</api_secret><img_uid>' + matched[1]+ '</img_uid></ImageInfoRequestUid>';
    handler.request = request.post({
      url: 'http://www.betafaceapi.com/service.svc/GetImageInfo',
      headers: {
        'Content-Length': body.length,
        'Content-Type': 'application/xml',
        'Connection': 'keep-alive',
        'Referer': 'http://www.betafaceapi.com/demo.html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
      },
      body: body
    }, function(err,httpResponse, body){
      if(!body || err){
        return callback(err || 'nobody');
      }
      var jsxml = require('node-jsxml');
      try{
        var xml = new jsxml.XML(body);
        var face = xml.child("faces").child("FaceInfo");
        if(face.length() == 0){
          return callback(body)
        }
        var obj = {face_id: xml.child("uid").toString(), betaface: 1, attributes:{}}
        face.child("tags").child("TagInfo").each(function(item){
          obj.attributes[item.child("name").toString()] = {
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
  return handler;
}


var cachedTokenAndJar = null;
var prevRequestTime = Date.now();
function getSkyBiometryToken(callback){
  if(cachedTokenAndJar && Date.now() - prevRequestTime < 10 * 60 * 1000){
    prevRequestTime = Date.now();
    return callback(null, cachedTokenAndJar);
  }
  return request.get({
    url: 'http://skybiometry.com/Demo',
    headers: {
      'Accept': '*/*',
      'Pragma': 'no-cache',
      'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Referer': 'http://skybiometry.com/Demo',
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
    }
  }, function(err, result, body){
    
    var j = request.jar();
    var cookies = '';
    var host = 'http://skybiometry.com';
    
    result.headers['set-cookie'] && result.headers['set-cookie'].forEach(function( item ) {
      cookies += item.split("path")[0];
    });
    j.setCookie(request.cookie(cookies), host);
    
    if(err || !body){
      return callback(err || "nobody");
    }
    var regexp = /__RequestVerificationToken.+value="([\w-_]+)"\s*\/>.+validation-summary-valid/
    var matched = body.match(regexp);
    if(!matched || !matched[1]){
      return callback("__RequestVerificationToken not found");
    }
    var __RequestVerificationToken = matched[1];
    cachedTokenAndJar = {token: __RequestVerificationToken, jar: j};
    callback(null, cachedTokenAndJar);
  });
  return handler.request;
}
              
exports.detectBySkyBiometry = function(img, callback){
  var handler = {};
  handler.request = getSkyBiometryToken(function(err, tokenAndJar){
    if(err){
      logger.debug(err);
      return callback(err);
    }
    var __RequestVerificationToken = tokenAndJar.token;
    var j = tokenAndJar.jar;
    var crlf = '\r\n';
    var dashdash = '--';
    var boundary = "----WebKitFormBoundaryPuGNMDdD9zFUjNAK";
    var body = dashdash + boundary;
    body += crlf;
    body += 'Content-Disposition: form-data; name="__RequestVerificationToken"';
    body += crlf;
    body += crlf;
    body += encodeURIComponent(__RequestVerificationToken);
    body += crlf + dashdash + boundary + crlf;
    body += 'Content-Disposition: form-data; name="imageUrl1"';
    body += crlf;
    body += crlf;
    body += encodeURIComponent(img);
    body += crlf +  dashdash + boundary + crlf;
    body += 'Content-Disposition: form-data; name="file1"';
    body += crlf + crlf + crlf + dashdash + boundary + dashdash;
    body += crlf;
    
    handler.request = request.post({
      url: 'http://skybiometry.com/Demo',
      jar: j,
      headers: {
        'Accept': '*/*',
        'Pragma': 'no-cache',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4',
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Length': body.length,
        'Content-Type': 'multipart/form-data; boundary='+boundary,
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Referer': 'http://skybiometry.com/Demo',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36'
      },
      body: body
    }, function(err,httpResponse, body){
      if(err || !body){
        logger.debug(err);
        return callback(err || 'nobody');
      }
      var json;
      try{
        json = JSON.parse(body);
      }catch(e){
        logger.error(e);
        return callback(e);
      }
      if(!json.RawData){
        return callback(json);
      }
      json = JSON.parse(json.RawData);
 
      if(!json || !json.photos || !json.photos.length){
        return callback(json);
      }
      var face = json.photos[0];
      var face_id = face.pid;
      if(!face.tags[0]){
        logger.debug(JSON.stringify(face));
        return callback(face);
      }
      var attributes = face.tags[0].attributes;
      callback(null, {face_id: face_id, attributes: attributes});
    });
  });
  
  return handler;
}

exports.detect = function(img, callback, timeout){
  timeout = timeout || 20000;
  var timeoutID = setTimeout(function(){
    timeoutID = null;
    if(betaFaceHandler.request){
      betaFaceHandler.request.abort();
      betaFaceHandler.request = null;
    }
    if(skyBiometryHandler.request){
      skyBiometryHandler.request.abort();
      skyBiometryHandler.request = null;
    }
    callback('timeout');
  }, timeout);
  
  var betaFace, skyBiometry, facePlus;
  var facePlusFailed = false;
  var betaFaceHandler = exports.detectByBetaFace(img, function(e, json){
    if(!timeoutID || facePlus || skyBiometry){
      return;
    }
    if(json){
      betaFace = json;
      if(facePlusFailed){
        clearTimeout(timeoutID);
        timeoutID = null;
        if(skyBiometryHandler.request){
          skyBiometryHandler.request.abort()
          skyBiometryHandler.request = null;
        }
        callback(null, {type: 'betaface', data: betaFace});
      }
    }
  });
  var skyBiometryHandler = exports.detectBySkyBiometry(img, function(e, json){
    if(!timeoutID || facePlus || betaFace){
      return;
    }
    if(json){
      skyBiometry = json;
      if(facePlusFailed){
        clearTimeout(timeoutID);
        timeoutID = null;
        if(betaFaceHandler.request){
          betaFaceHandler.request.abort();
          betaFaceHandler.request = null;
        }
        callback(null, {type: 'skybiometry', data: skyBiometry});
      }
    }
  });
  exports.detectByFacePlus(img, function(e, json){
    if(!timeoutID){
      return;
    }
    if(json){
      clearTimeout(timeoutID);
      timeoutID = null;
      facePlus = json;
      if(betaFaceHandler.request){
        betaFaceHandler.request.abort()
        betaFaceHandler.request = null;
      }
      if(skyBiometryHandler.request){
        skyBiometryHandler.request.abort();
        skyBiometryHandler.request = null;
      }
      callback(null, {type: 'faceplus', data: facePlus});
    }else {
      facePlusFailed = true;
      if(betaFace){
        callback(null, {type: 'faceplus', data: facePlus});
      }else if(skyBiometry){
        callback(null, {type: 'skybiometry', data: skyBiometry});
      }
    }
  });
}

/*
var img = 'http://mmbiz.qpic.cn/mmbiz/QONj06oVo0vO864Bia6L9oOoZNiapr4ibzrluDt5FMCkgD2jcTOwfLmgH1ZOGiclnSiaM7I7UbFNxicG89dpGD96GJtw/0';
exports.detectBySkyBiometry(img, function(e, json){
  //console.log(json.attributes.gender.value);
});
*/