/**
 * 通用服务--common services
 */
define(['angular',
    './modelSystemModule',
    '../helper/responsePreHandler',
    '../services/aliyunHttpHandler',
    './tasks/taskHandler'
  ],
  function(angular, modelSystemModule, responsePreHandler) {

    modelSystemModule.provider('modelSystem.dynamicLoadServiceProvider', [function() {
        var defaultConfig = {
          env: 'PRODUCT',
          urls: []
        };
        var getterSetter = {
          setDynamicResourceUrl: function(urls) {
            defaultConfig.urls = urls;
          },
          getDynamicResourceUrl: function() {
            return angular.copy(defaultConfig.urls);
          },
          setRuntimeEnvironment: function(env) {
            defaultConfig.env = env;
          },
          getRuntimeEnvironment: function() {
            return defaultConfig.env;
          }
        }
        return {
          $get: function() {
            return getterSetter;
          }
        }
      }])
      .factory('modelSystem.dynamicResourceLoadService', ['$injector', '$q', '$controller', 'aliyun.console.request', 'modelSystem.dynamicLoadServiceProvider', 'modelSystem.scriptLoader', 'moduleTaskHandler', function($injector, $q, $controller, requestWrapper, dynamicLoadServiceProvider, scriptLoader, moduleTaskHandler) {
        function ResouceLoadService() {

        }
        var timer = 0;
        var counter = 0;
        var exp = /\[ng:areq\]\s*Argument\s*\'.*\'\s*is\s*not\s*a\s*function, got\s*undefined/g;
        var request = requestWrapper.request;

        function preventCacheUrl(urls) {
          var result = [];
          if (angular.isArray(urls)) {
            for (var i = 0, url = ''; url = urls[i]; i++) {
              url += "?_preventCache=" + new Date().getTime();
              result.push(url);
            }
          }
          return result;
        }

        /**
         * 检测动态加载的脚本是不是已经执行完毕，因为RequireJs只能知道脚本加载完成，但是不嫩知道是否执行完毕
         * 所以会出现虽然脚本资源已经加载，但是还没有执行完毕就跳转到对应的路由，则会报错，提示Controller不存在
         * @param  {[type]} deferred
         * @param  {[type]} resource
         * @param  {[type]} controllerName  想要跳转的路由所对应的Controller的名称
         */
        function checkResourcePrepared(deferred, resource, controllerName) {
          clearTimeout(timer);
          try {
            $controller(controllerName, {});
            deferred.resolve(resource);
          } catch (e) {
            // 如果异常执行了20次，每次50毫秒，即距离代码加载完成大于1秒钟，则直接默认动态加载的脚本都执行完毕
            if (counter++ < 20) {
              // 动态脚本加载之后需要一个执行时间，而是用requireJs只能知道什么时候脚本加载完毕，而不知道脚本什么时候执行完毕
              // 所以，这里要检测最开始进入的路由所对应的Controller 有没有注册过。
              // 如果实例化该Controller的时候 AngularJs抛出异常:[ng:areq] Argument 'account.homeController' is not a function, got undefined
              // 则说明Controller还没有注册（即新加载的脚本还没有执行完毕）,则需要设置定时器，50毫秒之后再次检测是否执行完毕
              //
              //  注意：在该过程中检测到任意其他错误，都忽略不计，因为和“检测动态脚本加载之后是否执行完毕”没有关系
              //

              // if (e.message.indexOf("[ng:areq] Argument") > -1) {
              // if (exp.test(e.message)) {
              if ((e.message.match(exp) || []).length > 0) {
                timer = setTimeout(function() {
                  checkResourcePrepared(deferred, resource, controllerName);
                }, 50)
              } else {
                deferred.resolve(resource);
              }
            } else {
              deferred.resolve(resource);
            }
          }
        }

        /**
         * 根据将要跳转的目标路由获取其Controller的名称
         * @param  {[type]} state 将要跳转的目标路由
         * @return {[type]}       Controller的名称
         */
        function getControllerName(state) {
          if (state) {
            var controllerName = state.controller;
            if (!controllerName) {
              var views = state.views;
              for (var i in views) {
                if (views.hasOwnProperty(i)) {
                  controllerName = views[i].controller;
                  break;
                }
              }
            }
            return controllerName;
          }
        }
        ResouceLoadService.prototype = {
          constructor: ResouceLoadService,
          init: function(modules, globalConfig) {
            this.modules = modules;
            this.globalConfig = globalConfig;
          },
          isLoaded: function(moduleId) {
            var module = this.modules[moduleId];
            if (!module) {
              // throw new Error("module not exist!");
              return true;
            }
            return module.loaded;
          },
          loadResource: function(moduleId, toState) {
            var self = this;
            var currentControllerName = getControllerName(toState);
            var module = this.modules[moduleId];
            if (module.loading) {
              //正在加载资源，则返回deferred
              return module.deferred.promise;
            }
            if (module.loaded) {
              //如果已经加载完成，则返回true
              return true
            }
            module.deferred = $q.defer();
            module.loading = true;
            module.loaded = false;
            var url = angular.isArray(module.url) ? module.url : [module.url];
            if (dynamicLoadServiceProvider.getRuntimeEnvironment() === "TEST") {
              url = preventCacheUrl(url);
            }
            var tasks = moduleTaskHandler(self.modules, self.globalConfig, moduleId);
            //tasks.push(this.fetchConfig(moduleId));
            $q.all(tasks).then(function(res){
              scriptLoader.load(url, function(resource) {
                module.loaded = true;
                module.loading = false;
                if (angular.isString(currentControllerName)) {
                  checkResourcePrepared(module.deferred, resource, currentControllerName)
                } else {
                  setTimeout(function() {
                    module.deferred.resolve(resource);
                  }, 200)
                }
              }, function(err) {
                module.deferred.reject(err);
              })
            });
            return module.deferred.promise;
          }/*,

          fetchConfig: function(moduleId) {
            var self = this;
            var deferred = $q.defer();
            var options = {
              method: 'GET'
            };
            var module = this.modules[moduleId];
            var configUrl = '';
            var key = "";
            var depsConfig = module.depsConfig;
            if (depsConfig) {
              configUrl = depsConfig.configUrl;
              key = depsConfig.keyName;
            } else {
              configUrl = module.configUrl;
            }
            if (configUrl) {
              request(configUrl, options).then(function(response) {
                var result = responsePreHandler.responsePreHandler(response, $injector);
                if (result && angular.isFunction(result.then) == false) {
                  self.setConfigVariable(moduleId, result, key);
                  deferred.resolve(true);
                } else {
                  deferred.reject(result);
                }
              }, function(error) {
                deferred.reject(error);
              });
            } else {
              deferred.resolve({});
            }
            return deferred.promise;
          },
          setConfigVariable: function(moduleId, config, keyName) {
            var ALIYUN_EXPENSECENTER_CONSOLE_CONFIG = window.ALIYUN_EXPENSECENTER_CONSOLE_CONFIG;
            var propertyName = moduleId.toUpperCase();
            //如果没有指定键名，则直接把值附加到全局变量上
            if (!keyName) {
              if (!ALIYUN_EXPENSECENTER_CONSOLE_CONFIG[propertyName]) {
                ALIYUN_EXPENSECENTER_CONSOLE_CONFIG[propertyName] = config;
              }
            } else {
              !ALIYUN_EXPENSECENTER_CONSOLE_CONFIG[propertyName] && (ALIYUN_EXPENSECENTER_CONSOLE_CONFIG[propertyName] = {});
              !ALIYUN_EXPENSECENTER_CONSOLE_CONFIG[propertyName][keyName] && (ALIYUN_EXPENSECENTER_CONSOLE_CONFIG[propertyName][keyName] = config);
            }
          }
          */
        }
        var loadService = new ResouceLoadService();
        return loadService;
      }])
  });
