// The global game instance
var game;

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
    function Game(config) {
        this.menu = config.menu;
        this.highscores = config.highscores;
        this.stages = config.stages;

        this.canvas = document.getElementById(config.canvas);
        this.ctx = this.canvas.getContext("2d");

        this.currentScreen = this.menu;

        this.fps = Util.default_arg(config.fps, 60);
        this.delay = 1000 / this.fps;
        this.interval = null;
    }

    Game.prototype.start = function () {
        this.reume();
    };

    Game.prototype.pause = function () {
        if (this.interval)
            clearInterval(this.interval);
        this.interval = null;
    };

    Game.prototype.resume = function () {
        var self = this;
        this.interval = setInterval(function() {
            self.mainLoop();
        }, this.delay);
    };

    Game.prototype.mainLoop() {
        this.currentScreen.render();
    };

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

document.onload = function () {
    // Create and start the game

    var menuScreen = new Menu();
    var highscoresScreen = new HighScores();

    // TODO: Pass in the config for the stage
    var stage1 = new Stage({});
    var stage2 = new Stage({});
    var stage3 = new Stage({});

    game = new Game({
        canvas: "game",
        menu: menuScreen,
        highscores: highscoresScreen,
        stages: [stage1, stage2, stage3]
    });

    game.start();
}