/**
 * 使用$q生成promise任务
 * {
 *    name: "sys_load"
 *    url: "",
 *    type: "requirejs" //requirejs，ajax
 *    ignoreRequestError: false, 可选，如果请求ajax出错，是否忽略弹窗提示。默认为false
 *    keyName: "", //变量名称
 *    globalVarName: "" //挂在全局哪个变量上
 * }
 * @return promise
 */

define(['angular',
    '../modelSystemModule',
    '../../helper/responsePreHandler',
    '../../services/aliyunHttpHandler'
  ],
  function(angular, modelSystemModule, responsePreHandler) {
    modelSystemModule.factory('moduleLoadTask', ['$injector', '$q', 'modelSystem.scriptLoader', 'aliyun.console.request', function($injector, $q, scriptLoader, requestWrapper){
      var request = requestWrapper.request;
      var configVar = function(config, result, moduleId){
        var taskConfig = config.task;
        var keyName = taskConfig['keyName'];
        var globalVarName = taskConfig['globalVarName']
        var globalVar;
        if(!globalVarName){
          return;
        }else{
          globalVar = window[globalVarName];
          if(!globalVar){globalVar = window[globalVarName] = {}}
        }
        var propertyName = moduleId.toUpperCase();
        //如果没有指定键名，则直接把值附加到全局变量上
        if (!keyName) {
          if (!globalVar[propertyName]) {
            globalVar[propertyName] = result;
          }
        } else {
          !globalVar[propertyName] && (globalVar[propertyName] = {});
          !globalVar[propertyName][keyName] && (globalVar[propertyName][keyName] = result);
        }
      };
      var requireFunc = function(config, deferred, moduleId){
        scriptLoader.load([config.url], function(result) {
          configVar(config, result, moduleId);
          deferred.resolve(true);
        });
        return deferred.promise;
      };

      var ajaxFunc = function(config, deferred, moduleId){
        var taskConfig = config.task;
        var options = {
          method: 'GET'
        };
        request(taskConfig.url, options).then(function(response) {
          var result = responsePreHandler.responsePreHandler(response, $injector);
          if (result && angular.isFunction(result.then) == false) {
            configVar(config, result, moduleId);
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
        excute: function(config, moduleId){
          if(!config){
            console.log("任务缺少相应的参数");
            return;
          }
          var taskConfig = config.task;
          var deferred = $q.defer();
          if(taskConfig.url){
            if(taskConfig.type=='ajax'){
              return ajaxFunc(config, deferred, moduleId);
            }else{
              requireFunc(config, deferred, moduleId);
            }
          }
        }
      };
      return task.excute;
    }])
});
