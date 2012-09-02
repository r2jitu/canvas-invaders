// The global game instance
var game, sprites;
var sprite_paths = {
    player: "images/player.png",
    invader: "images/invader.png"
};

var Util = {
    extend: function (self, parent) {
        self.prototype = new parent();
        self.prototype.constructor = self;
        self.prototype._super = parent;
    },
    default_arg: function (val, def) {
        if (typeof val === "undefined")
            return def;
        else
            return val;
    },
    load_sprites: function (paths, cb) {
        var sprites = {};
        var remain_sprites = 0;

        function finished() {
            remain_sprites--;
            if (remain_sprites === 0) {
                cb(sprites);
            }
        }

        for (var p in paths) {
            (function (p) {
                sprites[p] = new Sprite(paths[p]);
                remain_sprites++;
                setTimeout(function () { sprites[p].load(finished); }, 0);
            })(p);
        }
    }
};

Game = (function () {
    var events = {
        "click": "onClick",
        "mousedown": "onMouseDown",
        "mouseup": "onMouseUp",
        "keydown": "onKeyDown",
        "keyup": "onKeyUp",
        "keypress": "onKeyPress"
    };

    function Game(config) {
        this.menu = config.menu;
        this.highscores = config.highscores;
        this.stages = config.stages;

        this.canvas = document.getElementById(config.canvas);
        this.ctx = this.canvas.getContext("2d");

        this.bgColor = "black";
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.curScreen = this.menu;

        // Compute update rate
        this.fps = Util.default_arg(config.fps, 60);
        this.delay = 1000 / this.fps;
        this.interval = null;

        // Add event listeners
        var self = this;
        for (var evname in events) {
            (function (evname) {
                self.canvas.addEventListener(evname, function (e) {
                    // Call the screen's handler if it has one
                    var handler = events[evname];
                    console.log(evname, e);
                    if (typeof self.curScreen[handler] === "function") {
                        self.curScreen[handler](e);
                    }
                });
            })(evname);
        }
    }

    Game.prototype.start = function () {
        this.resume();
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

    Game.prototype.mainLoop = function () {
        this.curScreen.render(this.ctx);
    };

    return Game;
})();

Screen = (function () {
    function Screen() {}

    // clears the screen
    Screen.prototype.render = function(ctx) {
        ctx.fillStyle = game.bgColor;
        ctx.fillRect(0, 0, 600, 600);
    };

    return Screen;
})();

Menu = (function () {
    function Menu() {}

    Util.extend(Menu, Screen);
    
    // press S to start, P to pause, I for instructions

    Menu.prototype.render = function(ctx) {
        this._super.prototype.render(ctx);

        ctx.fillStyle = "white";
        ctx.font = "bold 40px Arial";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText("Canvas Invaders", game.width / 2, 70);

        ctx.font = "bold 30px Arial";
        ctx.fillText("Play (p)", game.width / 2, 270);
        ctx.fillText("Instructions (i)", game.width / 2, 320);
        
        //game.stages[0].render(ctx);
    };

    Menu.prototype.onKeyPress = function(e) {
        console.log("got press event", e);
    };

    return Menu;
})();

HighScores = (function () {
    function HighScores() {}

    Util.extend(HighScores, Screen);
    
    HighScores.prototype.render = function(ctx) {
      console.log("render not implemented for HighScores");
    };
    
    return HighScores;
})();

Stage = (function () {
    function Stage() {}
    
    Util.extend(Stage, Screen);

    Stage.prototype.render = function(ctx) {
        console.log("render not implemented for Stage");
    };
    
    // Renders background (stars)
    function renderBg(ctx) {
    }

    // Renders user data (score, lives, weapon)
    function renderStats(ctx) {
    }

    return Stage;
})();

Object = (function () {
    function Object(sprite, config) {
        this.state = {
            x: Util.default_arg(config.x, 0),
            y: Util.default_arg(config.y, 0),
            theta: Util.default_arg(config.theta, 0),
            vx: Util.default_arg(config.vx, 0),
            vy: Util.default_arg(config.vy, 0),
            vtheta: Util.default_arg(config.vtheta, 0)
        };
        this.sprite = Util.default_arg(sprite, "default.png");
    }

    Object.prototype.render = function (ctx) {
        // TODO: This does useful stuff (common render code)
        console.log("render not implemented for Object");
    };

    Object.prototype.update = function (dt) {
        this.state.x += dt * this.state.vx;
        this.state.y += dt * this.state.vy;
        this.state.theta += dt * this.state.vtheta;

        // TODO: Collision detection
    };

    return Object;
})();

Sprite = (function () {
    function Sprite(src, width, height) {
        this.src = src;
        this.width = Util.default_arg(width, 0);
        this.height = Util.default_arg(height, 0);
    }

    Sprite.prototype.load = function (cb) {
        var self = this;
        console.log("Loading image " + self.src);
        
        this.image = new Image();
        this.image.onload = function () {
            if (!self.width) self.width = this.width;
            if (!self.height) self.height = this.height;
            console.log("Loaded image " + self.src, self.width, self.height);

            cb();
        };
        this.image.src = this.src;
    };

    return Sprite;
})();

// Load the sprites then call the callback when they're all loaded
function loadSprites(cb) {
    Util.load_sprites(sprite_paths, function (sprites) {
        window.sprites = sprites;
        cb();
    });
}

function startGame() {
    // Create and start the game

    var menuScreen = new Menu();
    var highscoresScreen = new HighScores();

    // TODO: Pass in the config for the stage

    var platoons1 = {
        startx: 0,
        starty: 0,
        layout: [
        ]
    };
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

function init() {
    loadSprites(function () {
        startGame()
    });
}

window.onload = init;
