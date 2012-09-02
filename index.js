var Util = {
    extend: function (self, parent) {
        self.prototype = new parent();
        self.prototype.constructor = self;
    },
    default_arg: function (val, def) {
        if (typeof val === "undefined")
            return def;
        else
            return val;
    }
};

Game = (function () {
    function Game() {
    }

    return Game;
})();

Screen = (function () {
    function Screen() {}

    return Screen;
})();

Menu = (function () {
    function Menu() {}

    Util.extend(Menu, Screen);

    return Menu;
})();

HighScores = (function () {
    function HighScores() {}

    Util.extend(HighScores, Screen);

    return HighScores;
})();

Stage = (function () {
    function Stage() {}
    
    Util.extend(Stage, Screen);

    return Stage;
})();

Object = (function () {
    function Object(x, y, vx, vy, ang, vang) {
        this.state = {
            x: Util.default_arg(x, 0),
            y: Util.default_arg(y, 0),
            vx: Util.default_arg(vx, 0),
            vy: Util.default_arg(vy, 0),
            ang: Util.default_arg(ang, 0),
            vang: Util.default_arg(vang, 0)
        };
        this.sprite = "default.png";
    }

    Object.prototype.render = function () {
        // TODO: This does useful stuff (common render code)
    }

    return Object;
})();

var menuScreen = new Menu();
var highScoresScreen = new HighScores();

// TODO: Pass in the config for the stage
var stage1 = new Stage({});
var stage2 = new Stage({});
var stage3 = new Stage({});

var game = new Game({
    menu: menuScreen,
    highScores: highScoresScreen,
    stages: [stage1, stage2, stage3]
});

document.onload = function () {
    game.start();
}
