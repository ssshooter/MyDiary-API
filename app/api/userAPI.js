var User = require('../models/User')
var UserInfo = require('../models/UserInfo')
var express = require('express')
var formidable = require('formidable')
var fs = require('fs')
var router = express.Router()

router.route('/login').post(function(req, res) {
  User.findOne({
    name: req.body.name
  })
    .exec()
    .then(user => {
      if (user === null) {
        // 抛错进catch
        return Promise.reject('wrong username')
      }
      return user.comparePassword(req.body.password)
    })
    .then(isMatch => {
      if (!isMatch) {
        return Promise.reject('wrong password')
      } else {
        req.session.username = req.body.name
        res.json({
          code: 0,
          msg: 'login!'
        })
      }
    })
    .catch(err => {
      console.log('err', err)
      res.json({
        code: 1,
        msg: err
      })
    })
})

router.route('/register').post((req, res) => {
  var user = new User(req.body)
  var userinfo = new UserInfo({
    username: req.body.name
  })
  user.save(err => {
    if (err) {
      res.json({
        code: 1,
        msg: 'user save err',
        err: err
      })
      return
    }
    userinfo.save(err => {
      if (err) {
        res.json({
          code: 1,
          msg: 'info save err',
          err: err
        })
        return
      }
      req.session.username = req.body.name
      res.json({
        code: 0,
        msg: 'User created!'
      })
    })
  })
})

router.route('/info').get(function(req, res) {
  UserInfo.findOne(
    {
      username: req.session.username
    },
    function(err, info) {
      if (err) {
        res.json({
          code: 1,
          msg: 'err',
          err: err
        })
      }
      res.json({
        code: 0,
        data: info
      })
    }
  )
})
router.route('/info').put((req, res) => {
  UserInfo.findOneAndUpdate(
    {
      username: req.session.username
    },
    req.body,
    function(err, info) {
      if (err) {
        res.json({
          code: 1,
          msg: 'err',
          err: err
        })
      }
      res.json({
        code: 0,
        msg: 'ok'
      })
    }
  )
})
router.route('/avatar').post((req, res) => {
  UserInfo.findOne(
    {
      username: req.session.username
    },
    (err, info) => {
      if (err) {
        res.json({
          code: 1,
          msg: 'err',
          err: err
        })
        return
      }
      var form = new formidable.IncomingForm()
      form.parse(req, (err, fields, files) => {
        if (err) {
          res.send(err)
          return
        }
        var extName = 'png'
        var newName = Date.now() + randomString()
        var path = require('path')
        fs.renameSync(
          files.file.path,
          path.resolve(path.resolve(__dirname, '..'), '..') +
            '/public/avatar/' +
            newName +
            '.' +
            extName
        )
        info.avatar =
          // 'http://www.time-record.net:8080/avatar/' + newName + '.' + extName
          'http://192.168.0.144:8090/avatar/' + newName + '.' + extName
        info.save(function() {
          res.json({
            code: 0,
            data: info
          })
        })
      })
    }
  )
})

function randomString(len) {
  len = len || 4
  var $chars =
    'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678' /** **默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
  var maxPos = $chars.length
  var pwd = ''
  for (let i = 0; i < len; i++) {
    pwd += $chars.charAt(Math.floor(Math.random() * maxPos))
  }
  return pwd
}
module.exports = router
