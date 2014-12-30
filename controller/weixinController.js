/**
@author hk1k
**/
var database = require('../model/database');
var logger = require('../lib/logger');
var faceapi = require('../lib/faceapi');
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
  /*
  var url = 'http://f.hiphotos.baidu.com/baike/w%3D268/sign=81d9240f32fa828bd1239ae5c51e41cd/8694a4c27d1ed21b33138eefac6eddc450da3fe5.jpg'
  */
  var start = Date.now();
  faceapi.detect(message.PicUrl, function(e, face){
    if(e){
      logger.error(e);
      database.NoDetect.add({img:message.PicUrl, openid: message.FromUserName}, function(){});
      callback(null, "花了较长时间都未找到人脸，请换一张更好的正面照片");
    }else{
      var info = '';
      var type = 0;
      if(face.type == 'betaface'){
        type = 1;
      }else if(face.type == 'skybiometry'){
        type = 2;
      }
      var time = ' ' + (Date.now() - start) + 'ms';
      var attributes;
      if(type == 0){
        attributes = face.data.attribute;
        info += '性别: ' + attributes.gender.value;
        info += '\n年龄: ' + attributes.age.value;
        info += '\n眼镜: ' + attributes.glass.value;
        info += '\n种族: ' + attributes.race.value;
        info += '\n微笑: ' + attributes.smiling.value + ' faceplus' + time;
      }else if(type == 1){
        attributes = face.data.attributes;
        info += '性别: ' + attributes.gender.value;
        info += '\n年龄: ' +  attributes.age.value;
        info += '\n眼镜: ' + attributes.glasses.value;
        info += '\n种族: ' + attributes.race.value;
        info += '\n微笑: ' + attributes.smile.value + ' betaface' + time;
      }else if(type == 2){
        attributes = face.data.attributes;
        info += '性别: ' + attributes.gender.value;
        info += '\n年龄: ' +  attributes.age_est.value;
        info += '\n眼镜: ' + attributes.glasses.value;
        info += '\n种族: NULL' ;
        info += '\n微笑: ' + attributes.happiness.value + ' skybiometry' + time;
      }
      
      callback(null, info);
      database.Face.add({
        faceid: face.face_id,
        img: message.PicUrl,
        data: JSON.stringify(face),
        openid: message.FromUserName,
        betaface: type
      }, function(err){
        err && logger.error(err);
        database.User.setOpenId(message.FromUserName, face.face_id, function(err){
          err && logger.error(err);
        });
      });
    }
  }, 4000);
}