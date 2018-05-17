define(['angular', './modelSystemModule', '../helper/responsePreHandler'], function(angular, modelSystemModule, responsePreHandler) {

  function getArgs(argument, index) {
    return Array.prototype.slice.call(argument, index || 0);
  }

  function needInjectScope(injectArray) {
    if (angular.isArray(injectArray)) {
      for (var i = 0, item = null; item = injectArray[i]; i++) {
        if (item === '$scope') {
          return true;
        }
      }
    }
    return false;
  }


  /****************************************************************************
   * 定义最基本的controller，其他controller去继承该controller
   ****************************************************************************/

  modelSystemModule.controller("modelSystemBaseController", BaseController)
    .controller('$$baseController', BaseController)

  function BaseController($rootScope, modelFactory, modelSystemScopeContextService) {
    this.$rootScope = $rootScope;
    this.modelFactory = modelFactory;
    this.responsePreHandler = responsePreHandler;
    this.getScopeContext = function() {
      return modelSystemScopeContextService;
    }
  }
  BaseController.$inject = ['$rootScope', 'modelFactory', 'modelSystemScopeContextService']

  BaseController.prototype = {
    constructor: BaseController,
    $constructor: function($scope) {
      this.$scope = $scope;
      // this.getScopeContext().setContext(this.$name, $scope);
    },
    $on: function() {
      if (this.$scope === undefined) {
        throw new Error('父controller没有初始化，请在子controller中调用 this.$parent.$constructor.call(this,$scope)来完成父类的初始化');
      }
      var args = getArgs(arguments);
      var token = this.$rootScope.$on.apply(this.$rootScope, args);
      this.$scope.$on('$destroy', function() {
        angular.isFunction(token) && token();
      })
    },
    $publish: function() {
      var args = getArgs(arguments);
      this.$rootScope.$emit.apply(this.$rootScope, args);
    },
    $getModel: function() {
      var args = getArgs(arguments);
      return this.modelFactory.getModel.apply(this.modelFactory, args);
    },
    $handleResponse: function(result) {
      var args = Array.prototype.slice.call(arguments, 0);
      return this.responsePreHandler.responsePreHandler.apply(this.responsePreHandler, args);
    }
  }


  /****************************************************************************
   * 定义controller继承服务
   ****************************************************************************/

  /**
   * 内部继承服务对象
   * @type {Object}
   */
  var inheritServiceInstance = {
    cache: {},
    $rootScope: null,
    $controller: null,

    /**
     * 解决解析需要继承的controller，并且递归解决继承链的问题
     * @param  {Object} subController 子controller的数据对象
     * @param  {Object} needInherit   所有注册在系统内的需要继承的controller的数据体
     * @param  {Angular Provider} $controller   AngularJS运行时的 Controller provider
     * @param  {Angular RootScope} $rootScope   AngularJS运行时的 $rootScope
     * @return {[type]}               [description]
     */
    resolveSubController: function(subController, needInherit, $controller, $rootScope) {
      var parentName = subController.parent;
      if (subController.resolved === false && angular.isString(parentName)) {
        var parentObj = needInherit[parentName];
        //如果要继承的controller没有在缓存中，则说明要继承的controller是父类，
        //父controller不继承其他任何controller，可以直接实例化
        if (parentObj === undefined || parentObj.resolved === true) {
          /**
           * 下面定义的locals和Angular关于实例化controller的机制有关，如果要继承的controller
           * 定义了对$scope的注入，则在实例化的时候需要手动提供$scope，因为$scope没有对应的provider
           * 所以不能直接类似其他注入项那样获取，而需要外界提供。
           *
           * 真正的controller是对应ui-view指令的，ui-view就是在它对应的scope实例化的时候手动提供了包涵$scope的locals（所以我们这里也要提供一个），ui-view代码如下：
           *
           *  第1543行：
           *    if (!locals) {
                viewLocals = null;
                view.state = null;

                // Restore the initial view
                return render.restore(initialView, element);
              }

              viewLocals = locals;
              view.state = locals.$$state;

              var link = $compile(render.populate(locals.$template, element));
              viewScope = scope.$new();

              if (locals.$$controller) {
                locals.$scope = viewScope;
                var controller = $controller(locals.$$controller, locals);
                element.children().data('$ngControllerController', controller);
              }
              link(viewScope);
           *
           */

          //TODO:考察指令的controller里面需要注入 $attrs的情况
          var locals = {
            $scope: $rootScope.$new()
          };
          try {
            var proto = $controller(parentName, locals);


            //指定父类构造函数的父类
            subController.constructor.$parent = {
              $constructor: proto.$constructor || function() {}
            }

            //扩展子类构造函数的prototype，原本可以直接让 constructor.prototpye = proto;
            //但是这样的话在写子类的时候就必须先执行继承代码，然后才能定义子类的prototype。
            //采用现在的写法，直接定义好子类和子类的原型（prototype），在做继承的时候，
            //把子类定义好的 prototype扩展到继承的父类的实例上（这里是proto），就实现了原来的原型式继承
            subController.constructor.prototype = extendPrototype(proto, subController.constructor.prototype);
            //这里是为了兼容已经继承了$$baseController的那些controller在初始化时候的已有写法，即：this.$parent.$constructor.call(this,$scope),
            //其实已有的这种写法是错误的，无法实现多级继承，只能实现二级继承；
            //如果希望多级继承，在子类初始化的时候，不能通过this来获取$parent.$constructor,因为原型继承后，回形成循环调用；
            //多级继承的时候，应该使用标准方式继承，即：子类构造函数.$parent.$constructor(this, xxx);
            //请注意旧的写法（通过this取值）和新的写法（通过当前class的构造函数取值）的区别
            if (!parentObj) {
              subController.constructor.prototype.$parent = proto;
            }
            subController.constructor.prototype.constructor = subController.constructor;
            subController.constructor.prototype.$name = subController.name;
          } catch (e) {
            console.log(e);
            throw new Error('modelSystem:BaseController:the controller "' + parentName + '" you want to inherit dose not exist or failed to instantiate, check if you had registed it or the services which it relies on are correct');
          }
          subController.resolved = true;
        } else {
          var newSubController = parentObj;
          inheritServiceInstance.resolveSubController(newSubController, needInherit, $controller, $rootScope);
        }
      }

      function extendPrototype(superClassPrototype, subClassPrototype) {
        if (!superClassPrototype || !subClassPrototype) {
          return;
        }
        var extendedObj = superClassPrototype;
        for (var property in subClassPrototype) {
          // if (property.indexOf('$') != 0) {
          extendedObj[property] = subClassPrototype[property];
          // }
        }
        return extendedObj;
      }
    },
    /**
     * Angularjs 运行时的继承方法，不仅要注册哪些controller需要继承，而且还要动态解决当前controller的继承问题
     * 和静态时继承相比，多了一个实时解决继承问题的步骤
     */
    dynamicInherit: function(subControllerName, subController, superControllerName) {
      //调用原始继承接口注册controller
      this.inherit(subControllerName, subController, superControllerName)

      //直接做类似初始化的方法去做继承
      var needInherit = this.cache;
      var registedSubController = needInherit[subControllerName];
      this.resolveSubController(registedSubController, needInherit, this.$controller, this.$rootScope);
    },
    /**
     * Angularjs 启动之前的继承方法，这个阶段只注册哪些controller要继承
     */
    inherit: function(subControllerName, subController, superControllerName) {
      if (!angular.isString(subControllerName)) {
        throw new Error('subControllerName must be the name of sub controller')
      }
      if (!angular.isFunction(subController)) {
        throw new Error('subController must be a function');
      }
      if (!angular.isString(superControllerName)) {
        throw new Error('superController must be a name of a controller')
      }

      var obj = {
        name: subControllerName,
        parent: superControllerName,
        constructor: subController,
        resolved: false
      }
      var inheritCache = this.cache[subControllerName];
      //防止多重继承。多重继承技术上可以实现，但是考虑由此带来的相互覆盖问题以及维护复杂度，所以不做实现
      if (angular.isObject(inheritCache) && inheritCache.parent !== superControllerName) {
        throw new Error(subControllerName + 'has inherited "' + inheritCache.parent + '" , can not inherit from ' + superControllerName);
      }
      this.cache[subControllerName] = obj;
    }
  };
  /**
   * 注册Angular JS运行时的Service
   */
  modelSystemModule.factory('controllerInheritService', ['$controller', '$rootScope', function($controller, $rootScope) {
    var inited = false;
    //运行时给内部类挂载必要参数
    inheritServiceInstance.$controller = $controller;
    inheritServiceInstance.$rootScope = $rootScope;
    return {
      init: function() {
        if (inited === false) {
          inited = true;
          var needInherit = inheritServiceInstance.cache;
          var superControllerInstance = null;
          var subControllers = [];
          //继承依赖需要解决，必须按照层级关系继承，即先做顶级函数的继承。
          /*
            由于angular不支持重名的controller，所以下面实现可以直接拿 superController来做唯一性标示意
           */
          for (var subControllerName in needInherit) {
            if (needInherit.hasOwnProperty(subControllerName)) {
              var subController = needInherit[subControllerName];
              inheritServiceInstance.resolveSubController(subController, needInherit, $controller, $rootScope);
            }
          }
        }
      }
    }
  }]);


  /****************************************************************************
   * 返回Angularjs初始化之前对外提供的服务定义controller继承服务
   ****************************************************************************/

  return {
    inherit: function(subControllerName, subController, superControllerName, dynamicRegistControllerAndInherit) {
      if (dynamicRegistControllerAndInherit === true) {
        return inheritServiceInstance.dynamicInherit(subControllerName, subController, superControllerName);
      }
      return inheritServiceInstance.inherit(subControllerName, subController, superControllerName);
    },
    /**
     * 提供语法糖，包裹Angularjs提供的默认controller方法，相当于劫持原生方法（更换AngularJS版本之后需要回归这部分代码）
     * @param  {[type]} angularModule [description]
     * @return {[type]}               [description]
     */
    wrapController: function(angularModule) {
      var module = angularModule;
      var originalController = module.controller;
      var me = this;
      return function() {
        var args = Array.prototype.slice.call(arguments, 0);
        var wantInherit = arguments.length === 3;

        //如果controller第一个参数是Object，则不支持继承
        if (angular.isObject(subControllerName) && wantInherit) {
          console.log('the way to define a controller can not inherit the other controller');
        } else if (wantInherit) {
          var controllerFn = arguments[1];
          //分析参数，解析出controller构造函数，解析对应的 $$inherit属性
          if (angular.isArray(controllerFn)) {
            //对应传统写法，获取controller的构造函数
            controllerFn = controllerFn[controllerFn.length - 1];
          }
          var superControllerName = null;
          var subControllerName = null;
          if (angular.isFunction(controllerFn)) {
            subControllerName = arguments[0];
            superControllerName = arguments[2];
          }
          //如果使用动态注册，则只能继承已经静态注册过的controller
          if (module.$$isInLazyMod) {
            me.inherit(subControllerName, controllerFn, superControllerName, true);
          } else {
            me.inherit(subControllerName, controllerFn, superControllerName);
          }
        }
        return originalController.apply(module, args);
      }
    }
  }
})
