/**
 * 默认的产品首页和默认的跳转规则
 */
define(['./modelSystemModule', './moduleManager'],
  function(modelSystemModule, ModuleManager) {
    var moduleManager = ModuleManager.getInstance();

    modelSystemModule.config(
      ['$stateProvider', '$urlRouterProvider',
        function($stateProvider, $urlRouterProvider) {
           var modules = moduleManager.getModules();
          var stack =[];
          var i = 0 ,
          items = null,
          module = null,
          router = null;
          stack = Array.prototype.slice.call(modules,0);
          module = stack.pop();
          while(module){
            router = module.router;
            if(router){
              $stateProvider.state(router.state, router);
            }
            if(module.children && module.children.items){
              items = module.children.items;
              for(var itemName in items){
                if(items.hasOwnProperty(itemName)){
                  stack.push(items[itemName]);
                }
              }
            }
            module = stack.pop();
          }
        }
      ])
  })
