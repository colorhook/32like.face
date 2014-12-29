/**
@author hk1k
**/
var database = require('../model/database');
var faceapi = require('../lib/faceapi');
var logger = require('../lib/logger');

/**
faceset渲染
@method index
@param {HttpRequest} req
@param {HttpResponse} res
**/
exports.index = function(req, res){
  var page = req.params.page || req.param('page');
  page = Number(page);
  if(isNaN(page) || page < 1){
    page = 1;
  }
  var pageCount = 20;
  database.Star.getCount(function(err, count){
    if(err){
      return res.redirect('admin/error');
    }
    database.Star.list(page, pageCount, function(err, rows){
      if(err){
        return res.redirect('admin/error');
      }
      var list = [];
      
      rows.forEach(function(item){
        var face = JSON.parse(item.data);
        var attr = face.attribute;
        list.push({
          id: item.id,
          name: item.name,
          img: item.img,
          faceid: item.faceid,
          age: attr.age.value,
          smiling: attr.smiling.value,
          glass: attr.glass.value,
          race: attr.race.value,
          time: item.time,
          gender: attr.gender.value == 'Male' ? '男' : '女'
        });
      });
      res.render('admin/star.html', {
        page: page,
        size: Math.round(count/pageCount),
        list: list
      });
    });
  });
  
}



/**
新增店铺页面渲染
@method add
@param {HttpRequest} req
@param {HttpResponse} res
**/
exports.add = function(req, res){
  res.render('admin/star-add.html', {
    info: req.flash('info')
  });
}

/**
@method delete
@param {HttpRequest} req
@param {HttpResponse} res
**/
exports.delete = function(req, res){
  var id = req.param('id');
  var info;
  if(!id){
    info = 'id不能为空';
  }
  if(info){
    req.flash('info', info);
    return res.redirect('/admin/star');
  }
  
  database.Star.delete(id, function(err){
    if(err){
      return res.redirect('/admin/error');
    }
    return res.redirect('back');
  });
}


exports.addStar = function(img, callback){
   faceapi.detect(img, function(e, result){
     if(e){
      return callback(e);
     }
     if(!result || !result.face || !result.face.length){
      return callback('noface');
     }
     var face = result.face[0];
     var facesetid = database.Faceset.getCurrentId();
     faceapi.addFaceToFaceset(face.face_id, facesetid, function(e){
       if(e){
         if(e.statusCode == 400){
           faceapi.createFaceset('star'+Date.now(), function(e, json){
             if(e){
              return callback(e);
             }
             var newfacesetid = json.faceset_id;
             faceapi.addFaceToFaceset(face.face_id, newfacesetid, function(e){
               if(e){
                return callback(e);
               }
               callback(null, {face: face, faceid:face.face_id, facesetid: newfacesetid});
             })
           })
         }else{
           callback(e);
         }
       }else{
        callback(null, {face: face, faceid:face.face_id, facesetid: facesetid});
       }
     });
   });
}
/**
@method action
@param {HttpRequest} req
@param {HttpResponse} res
**/
exports.action = function(req, res){
  var img = req.param('img');
  var name = req.param('name');
  var info;
  
  if(!name){
    info = 'name不能为空';
  }else if(!img){
    info = 'img不能为空';
  }
  if(info){
    req.flash('info', info);
    return res.redirect('/admin/star/add');
  }
  exports.addStar(img, function(e, data){
    if(e){
      logger.error(e);
      req.flash('info', e.message);
      return res.redirect('/admin/star/add');
    }
    var face = data.face;
    console.log(data);
    database.Face.add({
      faceid: data.faceid,
      img: img,
      data: JSON.stringify(face)
    }, function(err){
      if(err){
        logger.error(err);
        req.flash('info', err.message);
        return res.redirect('/admin/star/add');
      }
      database.Star.add({
        name: name,
        faceid: data.faceid,
        facesetid: data.facesetid
      }, function(err){
        if(err){
          logger.error(err);
          req.flash('info', err.toString());
          return res.redirect('/admin/star/add');
        }
        return res.redirect('/admin/star');
      });
    });
  });
}

/**
@method batch
@param {HttpRequest} req
@param {HttpResponse} res
**/
exports.batch = function(req, res){
  var data = req.param('data');
  var info;
  
  if(!data){
    info = 'data不能为空';
  }
  if(info){
    req.flash('info', info);
    console.log(info);
    return res.redirect('/admin/star/add');
  }
  var arr = data.split("\n") || [];
  var index = 0, length = arr.length, succeed = 0;
  function nextKeyValue(){
    if(index >= length){
      return null;
    }
    var kv = arr[index];
    index++;
    if(!kv){
      return nextKeyValue();
    }
    kv = kv.trim();
    var match = kv.match(/(.+)\s+(.+)/);
    if(!match || match.length < 3){
      return nextKeyValue();
    }
    var name = match[1], img = match[2];
    if(!name || !img){
      return nextKeyValue();
    }
    return {name: name, img: img}
  }
  
  function task(){
    var kv = nextKeyValue();
    console.log(kv);
    if(!kv){
      return completed();
    }
    exports.addStar(kv.img, function(e, data){
      if(e){
        logger.error(e);
        return task();
      }
      var face = data.face;
      
      //add face
      database.Face.add({
        faceid: data.faceid,
        img: kv.img,
        data: JSON.stringify(face)
      }, function(err){
        if(err){
          logger.error(err);
          return task();
        }
        database.Star.add({
          name: kv.name,
          faceid: data.faceid,
          facesetid: data.facesetid
        }, function(err){
          if(err){
            logger.error(err);
            return task();
          }
           succeed++;
          return task();
        });
        
      });
      //end add face
    });
  }
  
  function completed(){
    req.flash('info', '成功导入' + succeed + '条数据');
    return res.redirect('/admin/star/add');
  }
  
  //start task
  task();

}

