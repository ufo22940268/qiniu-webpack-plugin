'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _qiniu = require('qiniu');

var _qiniu2 = _interopRequireDefault(_qiniu);

var _promise = require('promise');

var _promise2 = _interopRequireDefault(_promise);

var _path = require('path');

var _slash = require('slash');

var _slash2 = _interopRequireDefault(_slash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var QiniuPlugin = function () {
  function QiniuPlugin(options) {
    _classCallCheck(this, QiniuPlugin);

    if (!options || !options.ACCESS_KEY || !options.SECRET_KEY) {
      throw new Error('ACCESS_KEY and SECRET_KEY must be provided');
    }
    this.options = Object.assign({}, options);
    _qiniu2.default.conf.ACCESS_KEY = this.options.ACCESS_KEY;
    _qiniu2.default.conf.SECRET_KEY = this.options.SECRET_KEY;
  }

  _createClass(QiniuPlugin, [{
    key: 'apply',
    value: function apply(compiler) {
      var _this = this;

      compiler.plugin('after-emit', function (compilation, callback) {
        var assets = compilation.assets;
        var hash = compilation.hash;
        var _options = _this.options,
            bucket = _options.bucket,
            include = _options.include;
        var _options$path = _this.options.path,
            path = _options$path === undefined ? '[hash]' : _options$path;


        path = path.replace('[hash]', hash);

        var promises = Object.keys(assets).filter(function (fileName) {
          var valid = assets[fileName].emitted;
          if (include) {
            valid = valid && include.some(function (includeFileName) {
              if (includeFileName instanceof RegExp) {
                return includeFileName.test(fileName);
              }
              return includeFileName === fileName;
            });
          }
          return valid;
        }).map(function (fileName) {
          var key = (0, _slash2.default)((0, _path.join)(path, fileName));
          var putPolicy = new _qiniu2.default.rs.PutPolicy(bucket + ':' + key);
          var token = putPolicy.token();
          var extra = new _qiniu2.default.io.PutExtra();

          return function () {
            var promise = new _promise2.default(function (resolve, reject) {
              var begin = Date.now();
              console.log('upload key: ' + JSON.stringify(key, null, 4) + '\n');
              _qiniu2.default.io.putFile(token, key, assets[fileName].existsAt, extra, function (err, ret) {
                if (!err) {
                  resolve(_extends({}, ret, {
                    duration: Date.now() - begin
                  }));
                } else {
                  reject(err);
                }
              });
            });

            return promise;
          };
        });

        promises.reduce(function (p, p2) {
          return p.then(function () {
            return p2();
          });
        }, _promise2.default.resolve()).then(function (res) {
          console.log(res); // eslint-disable-line no-console
          callback();
        }).catch(function (e) {
          callback(e);
        });
      });
    }
  }]);

  return QiniuPlugin;
}();

exports.default = QiniuPlugin;
//# sourceMappingURL=QiniuPlugin.js.map