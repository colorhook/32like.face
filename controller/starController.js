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
    database.Star.find(page, pageCount, function(err, rows){
      if(err){
        return res.redirect('admin/error');
      }
      var list = [];
      rows.forEach(function(item){
        var face = JSON.parse(item.data);
        var attr = face.attribute;
        list.push({
          id: item.id,
          img: item.img,
          faceid: item.faceid,
          age: attr.age.value,
          smiling: attr.smiling.value,
          glass: attr.glass.value,
          race: attr.race.value,
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

/**
@method action
@param {HttpRequest} req
@param {HttpResponse} res
**/
exports.action = function(req, res){
  var img = req.param('img');
  var info;
  
  if(!img){
    info = 'img不能为空';
  }
  if(info){
    req.flash('info', info);
    return res.redirect('/admin/star/add');
  }
  faceapi.detect(img, function(e, result){
    if(e){
      req.flash('info', e.message);
      return res.redirect('/admin/star/add');
    }
    if(!result || !result.face || !result.face.length){
      req.flash('info', '没有找到人脸');
      return res.redirect('/admin/star/add');
    }
    var face = result.face[0];
    database.Face.add({
      faceid: face.face_id,
      data: JSON.stringify(face)
    }, function(err, data){
      if(err){
        req.flash('info', err.message);
        return res.redirect('/admin/star/add');
      }
      database.Star.add({
        faceid: face.face_id,
        facesetid: facesetid
      }, function(err){
        if(err){
          console.log(err);
          req.flash('info', err.toString());
          return res.redirect('/admin/star/add');
        }
        return res.redirect('/admin/star');
      });
    });
    
  });
}


