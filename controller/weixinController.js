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

  faceapi.detect(message.PicUrl, function(e, result){
    if(e){
      logger.error(e);
      callback(null, e.toString());
    }else{
      var info = '';
      if(result.face && result.face.length){
        var face = result.face[0];
        var attr = face.attribute;
        
        database.Face.add({
          faceid: face.face_id,
          img: message.PicUrl,
          data: JSON.stringify(face),
          openid: message.FromUserName
        }, function(err){
          database.User.setOpenId(message.FromUserName, face.face_id, function(err){
            info += '性别: ' + attr.gender.value;
            info += '\n年龄: ' + attr.age.value + '<'+attr.age.range+'>';
            info += '\n眼镜: ' + attr.glass.value;
            info += '\n种族: ' + attr.race.value;
            info += '\n微笑: ' + attr.smiling.value;
            callback(null, info);
          });
        });
        
      }else{
       logger.debug('没有通过faceplus找到人脸:'+message.PicUrl);
       faceapi.detectByBetaFace(message.PicUrl, function(e, json){
         if(e){
           logger.warn('没有通过beta找到人脸:'+message.PicUrl);
           database.NoDetect.add({img:message.PicUrl, openid: message.FromUserName}, function(){
             info = '没有找到人脸';
             callback(null, info);
           });
         }else{
           database.Face.add({
            faceid: json.face_id,
            img: message.PicUrl,
            data: JSON.stringify(json),
            openid: message.FromUserName,
            betaface: 1,
          }, function(err){
            database.User.setOpenId(message.FromUserName, face.face_id, function(err){
               info += '性别: ' + json.gender.value;
               info += '\n年龄: ' + json.age.value;
               info += '\n眼镜: ' + json.glasses.value;
               info += '\n种族: ' + json.race.value;
               info += '\n微笑: ' + json.smile.value;
               callback(null, info);
            });
          });
         }
       });
        
      }
      
    }
  });
}