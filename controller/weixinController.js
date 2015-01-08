/**
@author hk1k
**/
var database = require('../model/database');
var logger = require('../lib/logger');
var faceapi = require('../lib/faceapi');
var EventEmitter = require('events').EventEmitter;

var imageEventEmitter = new EventEmitter();

var imageWaitList = {}


exports.parallel = function(kv, callback){
  var arr = Object.keys(kv);
  if(!arr.length){
    return callback({});
  }
  var results = {};
  var finished = 0;
  function checkCompleted(){
    if(finished >= arr.length){
      callback(results);
    }
  }
  arr.forEach(function(key){
    var func = kv[key];
    func(function(err, result){
      results[key] = {e: err, result: result};
      finished++;
      checkCompleted();
    });
  });
}
/**
当收到微信订阅消息后，通过weixin OpenID来查找对应的店铺
@method subscribe
@param {String} weixinID weixin OpenID
@param {Function} callback 订阅恢复信息的回调
**/
exports.subscribe = function(weixinID, callback){
  callback(null, '请发送自己的一张照片来打分');
}

exports.text = function(message, callback){
  // message为文本内容
  // { ToUserName: 'gh_d3e07d51b513',
  // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
  // CreateTime: '1359125035',
  // MsgType: 'text',
  // Content: 'http',
  // MsgId: '5837397576500011341' }
  callback(null, '请发送自己的一张照片来打分');
}

exports.image = function(message, callback){
  // message为图片内容
    // { ToUserName: 'gh_d3e07d51b513',
    // FromUserName: 'oPKu7jgOibOA-De4u8J2RuNKpZRw',
    // CreateTime: '1359124971',
    // MsgType: 'image',
    // PicUrl: 'http://mmsns.qpic.cn/mmsns/bfc815ygvIWcaaZlEXJV7NzhmA3Y2fc4eBOxLjpPI60Q1Q6ibYicwg/0',
    // MediaId: 'media_id',
    // MsgId: '5837397301622104395' }
  var img = message.PicUrl;
  imageWaitList[message.MsgId] = true;
  callback(null, [
    {
      title: '这是一个看脸的世界',
      description: '系统正在紧张地扫描你的脸孔，点开查看详情',
      picurl: img,
      url: 'http://face.zmzp.cn/show/' + message.MsgId
    }
  ]);
  
  exports.parallel({
    keywords: function(callback){
      faceapi.getKeywordsByBaidu(img, callback);
    },
    detect: function(callback){
      faceapi.detect(img, callback, 18000);
    }
  }, function(results){
    delete imageWaitList[message.MsgId];
    
    var keywords = results.keywords.result || [];
    var e = results.detect.e;
    if(e){
      logger.error(e);
      database.NoDetect.add({
        img:img, 
        msgid: message.MsgId,
        openid: message.FromUserName, 
        keywords: JSON.stringify(keywords)
      }, function(e2){
        e2 && logger.error(e2);
        imageEventEmitter.emit(message.MsgId);
      });
    }else{
      var type = 0;
      var face = results.detect.result;
      face.data.keywords = keywords;
      if(face.type == 'betaface'){
        type = 1;
      }else if(face.type == 'skybiometry'){
        type = 2;
      }
      var saveData = function(){
        database.Face.add({
          faceid: face.data.face_id,
          msgid: message.MsgId,
          img: message.PicUrl,
          data: JSON.stringify(face.data),
          openid: message.FromUserName,
          type: type
        }, function(err){
          err && logger.error(err);
          database.User.setOpenId(message.FromUserName, face.data.face_id, function(err){
            err && logger.error(err);
            imageEventEmitter.emit(message.MsgId);
          });
        });
      }
      //FacePlus to find candidate
      if(type == 0){
        var facesetid = database.Faceset.getCurrentId();
        logger.debug("start search face, faceid: " + face.data.face_id + " facesetid: " + facesetid);
        faceapi.search(face.data.face_id, facesetid, function(e, candidate){
          if(candidate){
            logger.debug(candidate);
          }else{
            logger.debug("nothing searched");
          }
          face.data.candidate = candidate;
          saveData();
        });
      }else{
        saveData();
      }
    }
    
  });
}


exports.getImageDetectData = function(msgid, callback){
  if(imageWaitList[msgid]){
    imageEventEmitter.once(msgid, function(){
      exports.getImageDetectData(msgid, callback);
    });
  }else{
    database.Face.findByMsgId(msgid, function(err, face){
      if(err){
        return callback(err);
      }
      var type = face.type;
      var json = JSON.parse(face.data);
      var data = database.User.adapter(json, type);
      var result = {type: type, data: data, img: face.img, json:json};
      if(json.candidate && json.candidate.face_id){
        database.Star.findByFaceId(json.candidate.face_id, function(e, star){
          if(star){
            database.Face.find(json.candidate.face_id, function(e, f){
              if(f){
                star.img = f.img;
              }
              result.star = {name: star.name, img:star.img, faceid: json.candidate.face_id};
              return callback(null, result);
            });
          }else{
            return callback(null, result);
          }
        });
      }else{
        return callback(null, result);
      }
    });
  }
}


exports.getScoreFromFace = function(data){
  var d = data.data;
  var json = data.json;
  var info = '性别: ' + (d.gender.toLowerCase() == 'male' ? '男' : '女');
  info += '<br/>年龄: ' + d.age;

  if(data.star){
    info += '<br/>最像明星：' + data.star.name;
  }
  if(json.keywords && json.keywords.length){
    info += '<br/>关键字：' + json.keywords.join(',');
  }
  var engine = 'faceplus';
  if(data.type == 1){
    engine = 'betaface';
  }else if(data.type == 2){
    engine = 'skybiometry'
  }
  //info += '<br/>By ' + engine;
  return info;
}

exports.show = function(req, res){
  var msgid = decodeURIComponent(req.param('msgid') || req.params.msgid || '');
  if(!msgid){
    return res.render('show-error.html', {
      img: 'http://face.zmzp.cn/img/qrcode.jpg',
      error: '没有指定msgid'
    });
  }
  exports.getImageDetectData(msgid, function(err, data){
    if(err){
      database.NoDetect.findByMsgId(msgid, function(e, d){
        if(e || !d){
          return res.render('show-error.html', {
            img: 'http://face.zmzp.cn/img/qrcode.jpg',
            error: 'msgid无效'
          });
        }else{
          var keywords;
          try{
            keywords = JSON.parse(d.keywords).join(',');
          }catch(e2){}
          var info = '无法识别人脸';
          if(keywords){
            info += '<br/>' + keywords;
          }
          return res.render('show.html', {
            img: d.img,
            notfound: true,
            info: info
          });
        }
      });
      
    }else{
      var info = exports.getScoreFromFace(data);
      return res.render('show.html', {
        img: data.img,
        star: data.star,
        age: data.data.age,
        info: info,
        type: data.type
      });
    }
  });
}
