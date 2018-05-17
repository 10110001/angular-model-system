/**
 * 使用$q生成promise任务
 * {
 *    name: "sys_message"
 *    url: "",
 *    type: "requirejs" //requirejs，ajax
 * }
 * @return promise
 */

define(['angular',
    '../modelSystemModule',
    '../../helper/responsePreHandler',
    '../../services/aliyunHttpHandler'
  ],
  function(angular, modelSystemModule, responsePreHandler) {
    modelSystemModule.factory('moduleMessageTask', ['$injector', '$q', 'modelSystem.scriptLoader', 'aliyun.console.request', function($injector, $q, scriptLoader, requestWrapper){
      var request = requestWrapper.request;
      var configMessages = function(messages){
        if(window.$global && window.$global.translations){
          window.$global.translations('zh', angular.extend(window.ALIYUN_CONSOLE_MESSAGE, messages));
        }
      };
      var requireFunc = function(url, deferred){
        scriptLoader.load([url], function(messages) {
          configMessages(messages);
          deferred.resolve(true);
        });
        return deferred.promise;
      };

      var ajaxFunc = function(url, deferred){
        var options = {
          method: 'GET'
        };
        request(url, options).then(function(response) {
          var result = responsePreHandler.responsePreHandler(response, $injector);
          if (result && angular.isFunction(result.then) == false) {
            configMessages(result);
            deferred.resolve(true);
          } else {
            deferred.reject(result);
          }
        }, function(error) {
          deferred.reject(error);
        });
        return deferred.promise;
      }
      var task = {
        excute: function(config){
          if(!config){
            console.log("任务缺少相应的参数");
            return;
          }

          var deferred = $q.defer();

          if(!config.url){
            var langKey = config.global['LANG'];
            var module = config.module;
            var modulePath = '';
            if(module.url){
              modulePath = module.url.replace(/\.js$/, "")
            }

            var i18nResourceUrl = (langKey && langKey != "zh") ? (modulePath + '/nls/messageModule' + '_' + langKey) : (modulePath + '/nls/messageModule');
            //如果url是以 http:// | https:// | // 开头的，补上.js
            if (/^(http:|https:)*\/\//.test(i18nResourceUrl)) {
              i18nResourceUrl += '.js';
            }
            return requireFunc(i18nResourceUrl, deferred);
          }else{
            if(config.type=='ajax'){

              return ajaxFunc(config.url, deferred);
            }else{
              return requireFunc(config.url, deferred);
            }
          }

        }
      };
      return task.excute;
    }])
});
