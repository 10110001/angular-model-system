define(['angular', './lib/util'], function(angular, Util) {

  function ResourceLoader(module) {
    this.moudle = module;
  }
  ResourceLoader.constructors = {};
  ResourceLoader.factory = function(type) {
    return this.constructors[type] || ResourceLoader;
  }

  ResourceLoader.regist = function(name, constructor, forceOverWrite) {
    constructor = Util.inherit(constructor, ResourceLoader);
    if (forceOverWrite) {
      this.constructors[name] = constructor;
    } else {
      this.constructors[name] === undefined ? (this.constructors[name] = constructor) : console.log("regist '" + name + "' fail, because it has been registed");
    }
  }

  ResourceLoader.prototype = {
    constructor: ResourceLoader,
    loadResources: function($scope, $injector, callback) {
      callback(null);
    }
  }

  function ModuleResourceLoader() {

  }

  function BizComponentResourceLoader(module) {
    this.module = module;
  }

  BizComponentResourceLoader.prototype = {
    constructor: BizComponentResourceLoader,
    loadResources: function($scope, $injector, callback) {
      var modelFactory = $injector.get("modelFactory"),
        module = this.module,
        pageId = module.getNameSpace();
      callback(modelFactory.getModel(pageId, "BizComponentModel"));
    }
  }

  function PageResourceLoader(module) {
    this.module = module
  }
  PageResourceLoader.prototype = {
    constructor: PageResourceLoader,
    loadResources: function($scope, $injector, callback) {
      var modelFactory = $injector.get("modelFactory"),
        module = this.module,
        pageModel = module.pageModel;
      if (angular.isString(pageModel)) {
        pageModel = modelFactory.getModel(pageModel, "PageModel");
      }
      if (pageModel && pageModel.bizComponents) {
        var bizComponents = pageModel.bizComponents,
          tmpComponents = [];
        if (bizComponents && angular.isString(bizComponents)) {
          bizComponents = modelFactory.getModel(bizComponents, "BizComponentModel");
          pageModel.bizComponents = bizComponents;
        } else if (bizComponents && angular.isArray(bizComponents)) {
          for (var i = 0, len = bizComponents.length; i < len; i++) {
            var component = bizComponents[i];
            if (angular.isString(component)) {
              component = modelFactory.getModel(component, "BizComponentModel");
              tmpComponents.push(component);
              component = null;
            } else if (angular.isObject(component)) {
              tmpComponents.push(component);
            }
          }
          pageModel.bizComponents = tmpComponents;
        }
      }
      callback(pageModel);
    }
  }

  ResourceLoader.regist("module", ModuleResourceLoader);
  ResourceLoader.regist("page", PageResourceLoader);
  return {
    factory: function(type) {
      return ResourceLoader.factory(type);
    },
    regist: function(type, constructor) {
      ResourceLoader.regist(type, constructor);
    }
  }
})
