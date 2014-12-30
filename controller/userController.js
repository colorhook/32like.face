/**
@author hk1k
**/
var fs = require('fs');
var path = require('path');
var nunjucks = require('nunjucks');
var logger = require('../lib/logger');
var database = require('../model/database');



/**
店铺首页渲染
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
  database.User.getCount(function(err, count){
    if(err){
      logger.error(err);
      console.log(err);
      return res.redirect('admin/error');
    }
    database.User.list(page, pageCount, function(err, rows){
      if(err){
        logger.error(err);
        console.log(err);
        return res.redirect('admin/error');
      }
      var list = [];
      
      rows.forEach(function(item){
        var face = JSON.parse(item.data);
    
        var adapterData = database.User.adapter(face, item.type);
        console.log(item.msgid);
        adapterData.id = item.id;
        adapterData.msgid = item.msgid;
        adapterData.openid = item.openid;
        adapterData.img = item.img;
        adapterData.faceid = item.faceid;
        adapterData.time = item.time;
        adapterData.type = item.type;
        list.push(adapterData);
      });
      

      res.render('admin/user.html', {
        page: page,
        size: Math.round(count/pageCount),
        list: list
      });
    });
  });
}