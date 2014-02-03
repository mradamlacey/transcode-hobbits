var fs = require('fs');

module.exports = function(app){

    var controller = {};
    controller.index = function(req, res){
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.write("hello");
        res.end();
    };

    fs.readdirSync(__dirname).forEach(function(file) {
        if (file == "index.js") return;
        var name = file.substr(0, file.indexOf('.'));
        require('./' + name)(app);
    });

    /////////////////////////////////////////////////////////////
    // Define routes
    /////////////////////////////////////////////////////////////
    app.get('/', controller.index);

}

