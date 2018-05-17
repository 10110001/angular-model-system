define(['angular', './lib/util', './resourceLoader', './pageInitializer'], function(angular, Util, resourceLoader, PageInitializer) {

  function initModuleRouter(module) {

    //1、给子节点的router里面加views配置项
    var pageType = module.pageType || "normal";
    //如果当前节点没有子节点，则其所属的视图是父节点的视图
    var Initializer = PageInitializer.factory(pageType),
      pageInitializer = new Initializer(module);
    module.pageInitializer = pageInitializer;

    if (module.hasChildren() && (module.pageType === "tab" || module.pageType === "menu")) {
      module.subUiView = module.nameSpace.replace(/[.]/g, "$");
    }
    var parent = module.getParent(),
      parentSubUiView = null;
    if (parent && pageType != "innerDetail") {
      parentSubUiView = parent.subUiView;
    } else if (pageType == "innerDetail") {
      // parentSubUiView = parent.parentSubUiView;
    }

    var viewObj = {
      templateUrl: module.router.templateUrl || pageInitializer.getTemplateUrl(),
      controller: module.router.controller || "commonBizController"
    };
    if (parentSubUiView) {
      !module.router.views && (module.router.views = {});
      module.router.views[parentSubUiView] = viewObj;
      module.parentSubUiView = parentSubUiView;
    } else {
      module.router.templateUrl = module.router.templateUrl ? module.router.templateUrl : viewObj.templateUrl;
      module.router.controller = module.router.controller ? module.router.controller : viewObj.controller;
    }

    if (module.routerType !== "custom") {
      //2、给子节点的router里面加resolve，然后通用控制器里面获取resolveObject，执行代码
      !module.router.resolve && (module.router.resolve = {});
      module.router.resolve["_currentModule"] = function() {
        return module;
      }
      module.router.resolve["_pageInitializer"] = function() {
        return pageInitializer;
      }
      module.router.resolve["_moduleLoader"] = function() {
        var Loader = resourceLoader.factory("module"),
          loader = new Loader(module);
        return loader;
      }
      module.router.resolve["_pageModelLoader"] = function() {
        var Loader = resourceLoader.factory("page"),
          loader = new Loader(module);
        return loader;
      }
    }
  }
  /**
   * 初始化控制台模块
   * @param {Object} config 配置项
   */
  function Module(config, parent) {
    !config && (config = {});
    var defaultModuleConfig = {
      id: "",
      name: "",
      type: "",
      router: {
        state: "",
        url: "",
        controller: "",
        templateUrl: ""
      },
      children: {
        type: "menu", //tab
        items: {}
      }
    }
    config = Util.deepClone(defaultModuleConfig, config);
    angular.extend(this, config);
    this.parent = parent;
    //如果开发者没有定义pageModel,则使用模块的命名空间作为pageModel的ID
    this.pageModel = !this.pageModel && this.getNameSpace();
    var children = this.children;
    var child = null;
    initModuleRouter(this);
    //将所有的json 结构的配置项初始化为Module的实例
    var items = children.items;
    var cParent = this;
    for (var i in items) {
      if (items.hasOwnProperty(i)) {
        child = items[i];
        child.nameSpace = this.nameSpace + "." + i;
        child = new Module(child, cParent);
        items[i] = child;
      }
    }
  }

  Module.prototype = {
    constructor: Module,
    getModuleMenus: function() {
      if (this.type === "top") {
        //按照首页导航栏的数据格式返回
        var childrenStates = [];
        childrenStates = this.getChildrenStates();
        childrenStates.push(this.router.state);
        return {
          router: this.defaultPageRouter || this.router.state,
          text: this.name,
          module: childrenStates
        }
      }
    },
    getChildrenMenus: function() {
      var children = this.getChildren(),
        child = null,
        menuItems = [],
        menuItem = {};
      for (var i in children) {
        if (children.hasOwnProperty(i)) {
          child = children[i];
          menuItem = {
            state: child.router.state,
            text: child.name
          }
          menuItems.push(menuItem);
          menuItem = null;
        }
      }
      return menuItems;
    },
    getNameSpace: function() {
      return this.nameSpace;
    },
    getParent: function() {
      return this.parent || null;
    },
    getChildren: function() {
      return this.children.items;
    },
    injectResolve: function() {

    },
    getSubUiView: function() {
      //判断当前是不是自定义的，如果是，则返回定义好的subUiView，因为框架不知道自定义的页面上子页面所属的ui-view
      // if (this.routerType === "custom") {
      return this.subUiView;
      // } else {
      //   if (this.children.type === "menu") {
      //     // return this.ui这里需要好好想一下如何做，如何封装变化点
      //   }
      // }
    },
    hasChildren: function() {
      var childCount = 0;
      var children = this.getChildren();
      if (!children) {
        return false;
      }
      for (var i in children) {
        if (children.hasOwnProperty(i)) {
          return true
        }
      }
      return false;
    },
    getChildrenStates: function() {
      var children = this.getChildren(),
        child = null,
        childrenStates = [];
      for (var i in children) {
        if (children.hasOwnProperty(i)) {
          child = children[i];
          if (child.hasChildren()) {
            childrenStates.push(child.router.state);
            childrenStates = childrenStates.concat(child.getChildrenStates());
          } else {
            childrenStates.push(child.router.state);
          }
        }
      }
      return childrenStates;
    },
    getChild: function(key) {
      return this.children.items[key];
    },
    setChild: function(key, value, forceOverWrite) {
      if (!(value instanceof Module)) {
        value = new Module(value);
      }
      if (forceOverWrite) {
        this.children.items[key] = value;
      } else {
        this.children.items[key] === undefined ? (this.children.items[key] = value) : console.log("setChild '" + key + "' fail, because it has been registed");
      }
    }
  }

  function ModuleManager() {
    this.modules = {}
  }

  function getValueByNameSpace(nameSpace, object) {
    var itemChildren = null,
      nameSpaces = nameSpace.split("."),
      i = 0,
      length = nameSpaces.length,
      result = null,
      data = object[nameSpaces[i++]];
    if (!(data instanceof Module)) {
      data = new Module(data);
      object[nameSpaces[0]] = data;
    }
    result = data;
    while (data && i < length) {
      data = data.getChild(nameSpaces[i++]);
      result = data;
      if (result == null || result == undefined) {
        break;
      }
    }
    return result
  }

  function setValueByNameSpace(nameSpace, object, value, valueType) {
    value.nameSpace = nameSpace;
    var itemChildren = null,
      currentkey = "",
      nameSpaces = nameSpace.split("."),
      i = 0,
      length = nameSpaces.length,
      tempModule = null,
      moduleInstance = new Module(value),
      data = object[nameSpaces[i++]];

    if (length === 1) {
      object[nameSpaces[0]] = moduleInstance;
      return moduleInstance;
    }
    if (!(data instanceof Module)) {
      data = new Module(data);
      object[nameSpaces[0]] = data;
    }
    while (i < length) {
      currentkey = nameSpaces[i++];
      tempModule = data.getChild(currentkey);
      //如果当前节点的子节点不存在,给当前节点设置一个空的子节点
      if (tempModule === undefined || tempModule === null) {
        tempModule = new Module();
        data.setChild(currentkey, tempModule);
        data = data.getChild(currentkey);
      }
    }
    //TODO:需要考虑中间注册的情况。即注册一个点，父节点是有意义的，子节点也是有意义的，但是当前节点仅仅是一个空节点

    data.setChild(currentkey, moduleInstance);
    return moduleInstance
  }

  ModuleManager.prototype = {
    contructor: ModuleManager,
    getDefaultModuleChildType: function(nameSpace) {
      var length = nameSpace.split(".").length,
        defaultModuleChildType = "";
      switch (length) {
        case 1:
          defaultModuleChildType = "menu";
          break;
        case 2:
          defaultModuleChildType = "tab";
          break;
        case 3:
          defaultModuleChildType = "simpleDetail";
          break;
        default:
          defaultModuleChildType = "tab"
      }
      return defaultModuleChildType;
    },
    getValueByNameSpace: function(nameSpace, object) {
      return getValueByNameSpace(nameSpace, object);
    },
    setValueByNameSpace: function(nameSpace, object, value, valueType) {
      return setValueByNameSpace(nameSpace, object, value, valueType);
    },
    getModules: function(nameSpace) {
      var result = [],
        modules = this.modules;
      //如果不传任何命名空间，则返回当前管理器中所有的模块
      if (nameSpace == undefined) {
        for (var i in modules) {
          if (modules.hasOwnProperty(i)) {
            result.push(modules[i]);
          }
        }
      } else {
        result = [this.getValueByNameSpace(nameSpace, modules)];
      }
      return result;
    },
    getModuleMenus: function() {
      var menuConfigs = [];
      var modules = this.getModules();
      for (var i = 0, module = null; module = modules[i]; i++) {
        menuConfigs.push(module.getModuleMenus());
      }
      return menuConfigs;
    },
    registModule: function(nameSpace, module) {
      if (arguments.length === 1) {
        throw new Error('nameSpace is needed for regist modules');
      }
      var modules = this.modules[nameSpace];
      if (modules != undefined) {
        console.log(nameSpace + ' has been registed!')
        return null
      }
      var modules = this.modules;
      return this.setValueByNameSpace(nameSpace, modules, module, this.getDefaultModuleChildType(nameSpace));
    },
    registModules: function(modules) {
      if (angular.isArray(modules)) {
        for (var i = 0, moudle = null; moudle = modules[i]; i++) {
          this.registModule(module.nameSpace, module);
        }
      }
    },
    registRemoteModules: function(nameSpace, module, service) {
      this.modules.$remoteModules = module;
    },
    config: function(key, value) {
      var whiteList = {
        getDefaultModuleChildType: true,
        getValueByNameSpace: true,
        setValueByNameSpace: true
      }
      if (whiteList[key] === true) {
        this[key] = value;
      } else {
        console.log("Error: can't set " + key + " of ModuleManager because it's a protected property");
        console.log("properties can be configed in ModuleManager is:");
        console.dir(whiteList);
      }
    }
  }
  var manger = null;
  return {
    getInstance: function() {
      if (manger == null) {
        manger = new ModuleManager();
      }
      return manger;
    }
  }
})
