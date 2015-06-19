/*global requirejs*/
requirejs(['./paths'], function (paths) {

    requirejs.config(paths);

    requirejs(['fx-flude-ui/start'], function (Module) {
        var m = new Module();
        m.init();
    });
});