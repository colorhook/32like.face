/**
@author hk1k
**/
var database = require('../model/database');
var logger = require('../lib/logger');
var faceapi = require('../lib/faceapi');
var EventEmitter = require('events').EventEmitter;



var imageEventEmitter = new EventEmitter();

var imageWaitList = {}
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
  faceapi.detect(img, function(e, face){
    delete imageWaitList[message.MsgId];
    if(e){
      logger.error(e);
      database.NoDetect.add({img:img, openid: message.FromUserName}, function(){});
      imageEventEmitter.emit(message.MsgId);
    }else{
      var type = 0;
      if(face.type == 'betaface'){
        type = 1;
      }else if(face.type == 'skybiometry'){
        type = 2;
      }
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
  }, 40000);
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
      var data = database.User.adapter(JSON.parse(face.data), type);
      return callback(null, {type: type, data: data, img: face.img});
    });
  }
}


exports.getScoreFromFace = function(data){
  var d = data.data;
  var info = '性别: ' + d.gender;
  info += '<br/>年龄: ' + d.age;
  info += '<br/>眼镜: ' + d.glass;
  info += '<br/>种族: ' + d.race;
  info += '<br/>微笑: ' + d.smile;
  var engine = 'faceplus';
  if(data.type == 1){
    engine = 'betaface';
  }else if(data.type == 2){
    engine = 'skybiometry'
  }
  info += '<br/>By ' + engine;
  return info;
}
exports.show = function(req, res){
  var msgid = decodeURIComponent(req.param('msgid') || req.params.msgid || '');
  if(!msgid){
    return res.render('show-error.html', {
      img: 'http://face.zmzp.cn/img/qrcode.jpg',
      error: '没有制定图片'
    });
  }
  exports.getImageDetectData(msgid, function(err, data){
    if(err){
      return res.render('show-error.html', {
        img: 'http://face.zmzp.cn/img/qrcode.jpg',
        error: err.toString()
      });
    }else{
      var info = exports.getScoreFromFace(data);
      return res.render('show.html', {
        img: data.img,
        info: info,
        type: data.type
      });
    }
  });
}
