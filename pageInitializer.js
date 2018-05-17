define(['angular', './lib/util'], function(angular, Util) {
  function PageInitializer(config) {
    var defaultInitializerModel = {
      templateUrl: ""
    }
    config ? config = Util.deepClone(defaultInitializerModel, config) : "";
    angular.extend(this, defaultInitializerModel);
  }
  PageInitializer.constructors = {};
  PageInitializer.factory = function(name) {
    return this.constructors[name] || PageInitializer;
  }

  PageInitializer.regist = function(name, constructor, forceOverWrite) {
    constructor = Util.inherit(constructor, PageInitializer);
    if (forceOverWrite) {
      this.constructors[name] = constructor;
    } else {
      this.constructors[name] === undefined ? (this.constructors[name] = constructor) : console.log("regist '" + name + "' fail, because it has been registed");
    }
  }

  PageInitializer.prototype = {
    constructor: PageInitializer,
    getTemplateUrl: function() {
      return this.templateUrl
    },
    initPageModel: function($scope, $injector, $state, module, pageModel) {
      if (pageModel) {
        Util.deepClone($scope.viewModel, pageModel);
        $scope.viewModel.layoutConfig = {
          layout: pageModel.layout,
          components: pageModel.bizComponents
        }
      }
    }
  }


  function MenuPageInitializer() {

  }

  MenuPageInitializer.prototype = {
    constructor: MenuPageInitializer,
    getTemplateUrl: function() {
      return "scripts/template/commonSideMenuPage.html"
    },
    initPageModel: function($scope, $injector, $state, module, pageModel) {
      $scope.viewModel = {};
      if (pageModel) {
        Util.deepClone($scope.viewModel, pageModel);
        $scope.viewModel.layoutConfig = {
          layout: pageModel.layout,
          components: pageModel.bizComponents
        }
      }
      $scope.viewModel.menuItems = $scope.viewModel.menuItems ? $scope.viewModel.menuItems : module.getChildrenMenus();
      $scope.viewModel.subUiViewName = $scope.viewModel.subUiViewName ? $scope.viewModel.subUiViewName : module.getSubUiView();
    }
  }

  function NormalPageInitializer() {

  }

  NormalPageInitializer.prototype = {
    constructor: NormalPageInitializer,
    getTemplateUrl: function() {
      return "scripts/template/commonNormalPage.html"
    },
    initPageModel: function($scope, $injector, $state, module, pageModel) {
      $scope.viewModel = {};
      if (pageModel) {
        Util.deepClone($scope.viewModel, pageModel);
        $scope.viewModel.layoutConfig = {
          layout: pageModel.layout,
          components: pageModel.bizComponents
        }
      }
    }
  }

  function InnerDetailPageInitializer(argument) {

  }

  InnerDetailPageInitializer.prototype = {
    constructor: InnerDetailPageInitializer,
    getTemplateUrl: function() {
      return "scripts/template/commonInnerDetailPage.html"
    },
    initPageModel: function($scope, $injector, $state, module, pageModel) {
      var parentModule = module.getParent();
      $scope.viewModel = {
        iconClass: "",
        title: module.name,
        parentState: parentModule.router.state,
        parentName: parentModule.name,
        subTitle: module.subTitle
      };
      if(pageModel){
        Util.deepClone($scope.viewModel, pageModel);
        $scope.viewModel.layoutConfig = {
          layout: pageModel.layout,
          components: pageModel.bizComponents
        }
      }
      $scope.viewModel.subUiViewName = $scope.viewModel.subUiViewName ? $scope.viewModel.subUiViewName : module.getSubUiView();
    }
  }



  function TabPageInitializer() {}

  PageInitializer.regist("menu", MenuPageInitializer);
  PageInitializer.regist("normal", NormalPageInitializer);
  PageInitializer.regist("tab", TabPageInitializer);
  PageInitializer.regist("innerDetail", InnerDetailPageInitializer);
  return {
    factory: function(type) {
      return PageInitializer.factory(type);
    },
    regist: function(type, constructor) {
      PageInitializer.regist(type, constructor);
    }
  }
})
