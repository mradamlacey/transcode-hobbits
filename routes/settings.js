
var config = require("../config");

module.exports = function(app){

    var controller = {};
    controller.settings = function(req, res){

        res.json(config);
    };

    /////////////////////////////////////////////////////////////
    // Define routes
    /////////////////////////////////////////////////////////////
    app.get('/_settings', controller.settings);

}
