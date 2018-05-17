/**
 * 由于是动态指令，所以，当前指令内部 $watch的 rawData 和 directiveModel 在变更的时候都会compile指令，
 * 这样就会有一个问题，如果这个指令的 rawData 和directiveModel都会变，那么如果要动态编译的指令自己发请求，则会出现重复发多个请求的情况。
 * 为了避免这种情况的发生，建议这样使用：
 * 1、如果rawData 和 directiveModel都会在短时间内同时发生变化（这样两个数据变动被$watch到的顺序是随机的，如果指令内部发请求的话，会发两次请求，因为被编译了两次），
 * 这种情况下，建议使用 config 替代 这两个数据项。config的数据结构包括rawData 和 directiveModel。
 *  config:{
      rawData: {
        //这里可以传递任意的业务数据
      },
      directiveModel: {
        template:"",//动态信息的模版
        templateUrl:"",//模版地址，优先使用 template属性
        setCompileData: function(scope, rawData, attrs, $injector) {
          //这里方便开发者自己定义上面模版编译的时候需要的各种数据
        }
      }
    },
    rawData: {
          //这里可以传递任意的业务数据
    },
    directiveModel: {
      template:"",//动态信息的模版
      templateUrl:"",//模版地址，优先使用 template属性
      setCompileData: function(scope, rawData, attrs, $injector) {
        //这里方便开发者自己定义上面模版编译的时候需要的各种数据
      }
    },
    modelType: "@",//这里可以直接给 directiveModel 的名字，指令里面会直接使用这个名字去modelFactory里面拉取模型
    handlerType: "@"//这里可以由开发人员自己指定数据模型处理器的类型，后续面对不同的需求，可以直接扩展DynamicInfoHandler 来处理自己的业务渲染需求
 */


define(['angular', '../modelSystemModule'], function(angular, modelSystemModule) {
  var dynamciInfoHandlerConfig = {
    factory: {}
  }

  function DynamicInfoHandler(model, $templateCache) {
    var defaultModel = {
      template: '',
      templateUrl: '',
      setCompileData: function(scope, rawData, attrs) {

      }
    }
    angular.extend(this, defaultModel, model);
    this.$templateCache = $templateCache;
  }
  DynamicInfoHandler.factory = function(className) {
    var constant = dynamciInfoHandlerConfig.factory;
    return constant[className] || DynamicInfoHandler;
  }

  DynamicInfoHandler.regist = function(name, constructor) {
    var constant = dynamciInfoHandlerConfig.factory;
    if (!angular.isFunction(constructor)) {
      throw new Error('only function can extend handler')
    }
    var subClass = constant.factory[name];
    if (subClass !== null || subClass !== undefined) {
      throw new Error('handler "' + name + '" has registed! you can\'t overwrite it');
    }
    //constructor继承 dynamicInfoHandler
    constant.factory[name] = constructor;
    return this;
  }
  DynamicInfoHandler.prototype = {
    constructor: DynamicInfoHandler,
    setCompileData: function(scope, rawData, attrs) {

    },
    getTemplate: function() {
      var templateCache = this.$templateCache;
      var template = this.template ? this.template : (templateCache ? this.template = templateCache.get(this.templateUrl) : "");
      return template;
    }
  }

  //定义可配置的常量，用于后续做handler的扩展
  modelSystemModule.constant("dynamciInfoHandlerConfig", dynamciInfoHandlerConfig)
    //定义
    .provider('DynamicInfoHandlerProvider', ['dynamciInfoHandlerConfig', function(dynamciInfoHandlerConfig) {
      var constant = dynamciInfoHandlerConfig;
      return {
        extend: function(subClassName, constructor) {
          return DynamicInfoHandler.regist(subClassName, constructor);
        },
        $get: function() {
          return constant;
        }
      };
    }]).directive('aliyunConsoleDynamicDirective', dynamicDirective);


  dynamicDirective.$inject = ['$compile', '$templateCache', 'modelFactory', '$injector'];

  function dynamicDirective($compile, $templateCache, modelFactory, $injector) {

    function linkFunction(scope, elem, attrs) {
      var model = scope.config && scope.config.directiveModel ? scope.config.directiveModel : modelFactory.getModel(scope.modelType, 'DynamicDirectiveModel') || scope.directiveModel;
      if (!model) {
        console.error("model is required")
        return;
      }
      var template = model.template || $templateCache.get(model.templateUrl);
      if (!template) {
        console.error("template or templateUrl is needed in DynamicDirective; please check your model config for template or templateUrl is right");
        return;
      }

      var rawData = scope.config && scope.config.rawData ? scope.config.rawData : scope.rawData;
      var Handler = DynamicInfoHandler.factory(scope.handlerType);
      var handler = new Handler(model, $templateCache);

      function compileTemplate(scope, rawData, attrs) {
        handler.setCompileData(scope, rawData, attrs, $injector);
        elem.empty();
        elem.append(handler.getTemplate());
        $compile(elem.contents())(scope);
      }

      scope.$watch('rawData', function(rawData) {
        if (rawData !== null && rawData !== undefined) {
          handler = new Handler(model, $templateCache);
          compileTemplate(scope, rawData, attrs);
        }
      })

      scope.$watch('directiveModel', function(model) {
        if (model) {
          handler = new Handler(model, $templateCache);
          compileTemplate(scope, scope.rawData, attrs);
        }
      })

      /**
       * 特殊情况下使用：指令自己发请求，且rawData 和 directiveModel都会变动，则使用 config 替换 rawData 和 directiveModel
       * @param  {Handler}
       * @return {[type]}         [description]
       */
      scope.$watch('config', function(config) {
        if (config) {
          handler = new Handler(config.directiveModel, $templateCache);
          compileTemplate(scope, config.rawData, attrs);
        }
      })
    }
    return {
      scope: {
        config: "=",
        rawData: "=",
        directiveModel: "=",
        modelType: "@",
        handlerType: "@"
      },
      link: linkFunction
    }
  }

})
