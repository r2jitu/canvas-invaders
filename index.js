// The global game instance
var game, sprites;
var sprite_paths = {
    player: "images/player.png",
    invader: "images/invader.png"
};
var stars;

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
    },
    generateStars: function() {
        var numStars = 50;
        var stars = new Array();

        for (var i = 0; i < numStars; i++) {
            var xPos = Math.floor(Math.random() * game.width);
            var yPos = Math.floor(Math.random() * game.height + 15);

            // TODO: Fix alpha
            var alpha = ((Math.random() * 100 + 25) / 100.0) % 1; 

            stars[i] = {
                x: xPos,
                y: yPos,
                a: alpha
            };
        }

        return stars;
    }
};

Game = (function () {
    var events = {
        "click": "onClick",
        "mousedown": "onMouseDown",
        "mouseup": "onMouseUp",
        "mousemove": "onMouseMove",
        "keydown": "onKeyDown",
        "keyup": "onKeyUp",
        "keypress": "onKeyPress"
    };

    function Game(canvas_id, fps) {
        this.screens = {};

        this.canvas = document.getElementById(canvas_id);
        this.ctx = this.canvas.getContext("2d");

        this.bgColor = "black";
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Player stats
        this.playerScore = 0;
        this.player = null;

        // Compute update rate
        this.fps = Util.default_arg(fps, 60);
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

        this.canvas.setAttribute("tabindex", 0);
        this.canvas.focus();
    }

    Game.prototype.addScreen = function (name, screen) {
        this.screens[name] = screen;
    };

    Game.prototype.start = function (screen_id) {
        this.setScreen(screen_id);
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

    Game.prototype.setScreen = function (screen_id) {
        this.curScreen = this.screens[screen_id];
    }

    return Game;
})();

Screen = (function () {
    function Screen() {}

    // clears the screen
    Screen.prototype.render = function(ctx) {
        ctx.fillStyle = game.bgColor;
        ctx.fillRect(0, 0, 600, 600);
    };

    Screen.prototype.reset = function () { /* Do nothing */ };

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
        ctx.fillText("Start Game (s)", game.width / 2, 270);
        ctx.fillText("Instructions (i)", game.width / 2, 320);
    };

    Menu.prototype.onKeyPress = function(e) {
        // handle user input
       console.log("keycode", e.charCode, String.fromCharCode(e.charCode));
        if (String.fromCharCode(e.charCode) === "s") {
            game.setScreen("stage1");
        }
        else if (String.fromCharCode(e.charCode) === "i") {
            console.log("i");
        }
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
    // Player Status bar offset
    var statusBarOffset = 15;

    function Stage(platoon) {
        this.platoon = platoon;
        this.lastUpdate = (new Date()).getTime();
    }
    
    Util.extend(Stage, Screen);

    Stage.prototype.render = function(ctx) {
        this._super.prototype.render(ctx);

        var prevUpdate = this.lastUpdate;
        this.lastUpdate = (new Date()).getTime();
        var dt = (this.lastUpdate - prevUpdate) / 1000;
        this.platoon.update(dt);
        
        renderBg(ctx);
        renderStats(ctx);
        this.platoon.render(ctx);

        console.log("render not implemented for Stage");
    };

    // Renders background (stars)
    function renderBg(ctx) {
        for (var i = 0; i < stars.length; i++) {
            var star = stars[i];
            ctx.fillStyle = "rgba(255, 255, 255," +  star.a + ")";
            ctx.fillRect(star.x, star.y, 5, 5);
        }
    }

    // Renders user data (score, lives, weapon)
    function renderStats(ctx) {
        ctx.fillStyle = "white";
        ctx.font = "bold 15px Arial";
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";

        // TODO: render black box for stats

        // Score
        ctx.fillText("Score:", 10, 15);
        
        var scoreOffset = 10 + 5 + ctx.measureText("Score:").width;
        ctx.fillText(game.playerScore, scoreOffset, 15);

        // Lives
        ctx.fillText("Health:", game.width / 2, 15);

        var livesOffset = game.width / 2 + 5 + ctx.measureText("Health:").width;
        ctx.fillText(game.player.health, livesOffset, 15);
    }

    return Stage;
})();

Object = (function () {
    function Object(sprite, config) {
        config = Util.default_arg(config, {});

        this.state = {
            x: Util.default_arg(config.x, 0),
            y: Util.default_arg(config.y, 0),
            theta: Util.default_arg(config.theta, 0),
            vx: Util.default_arg(config.vx, 0),
            vy: Util.default_arg(config.vy, 0),
            vtheta: Util.default_arg(config.vtheta, 0)
        };

        this.sprite = Util.default_arg(sprite, null);

        if (this.sprite) {
            this.width = this.sprite.width;
            this.height = this.sprite.height;
        }
    }

    Object.prototype.render = function (ctx) {
        // TODO: This does useful stuff (common render code)
        if (this.sprite)
            ctx.drawImage(
                this.sprite.image,
                this.state.x - this.width / 2,
                this.state.y - this.height / 2);
    };

    Object.prototype.update = function (dt) {
        this.state.x += dt * this.state.vx;
        this.state.y += dt * this.state.vy;
        this.state.theta += dt * this.state.vtheta;

        // TODO: Collision detection
    };

    return Object;
})();

SpaceShip = (function () {
    function SpaceShip(type) {
        this._super.prototype.constructor.call(this, sprites[type]);
    }

    Util.extend(SpaceShip, Object);

    return SpaceShip;
})();

PlayerShip = (function () {
    function PlayerShip() {
        this._super.prototype.constructor.call("player");
        
        this.health = 100;
    }

    Util.extend(PlayerShip, SpaceShip);

    return PlayerShip;
})();

Platoon = (function () {
    // How much space to put between the ships
    // (x,y) is the center of the platoon
    function Platoon(x, y, theta, ships, spacing) {
        this.start = {
            x: x,
            y: y,
            theta: theta
        };

        this.spacing = Util.default_arg(spacing, 10);

        this.ships = [];
        for (var i = 0; i < ships.length; i++) {
            var row = [];
            for (var j = 0; j < ships[i].length; j++) {
                row.push(new SpaceShip(ships[i][j]));
            }
            this.ships.push(row);
        }

        // Positions all the ships
        this.reset();

        this._super.prototype.constructor(null, {});
    }

    Util.extend(Platoon, Object);

    Platoon.prototype.render = function (ctx) {
        ctx.save();

        ctx.translate(this.state.x, this.state.y);
        ctx.rotate(this.state.theta);

        // TODO: Override render to draw all the individual ships
        for (var i = 0; i < this.ships.length; i++) {
            for (var j = 0; j < this.ships[i].length; j++) {
                this.ships[i][j].render(ctx);
            }
        }

        ctx.restore();
    };

    Platoon.prototype.update = function (dt) {
        this._super.prototype.update.call(this, dt);
        console.log(this.state.theta, this.state.vtheta);

        // TODO: Update all the positions of the ships relative to the platoon
    };

    Platoon.prototype.reset = function () {
        this.state.x = this.start.x;
        this.state.y = this.start.y;
        this.state.theta = this.start.theta;
        this.state.vx = 0;
        this.state.vy = 0;
        this.state.vtheta = Math.PI / 4;

        this.totalHeight = 0;
        this.totalWidth = 0;
        this.rowHeights = [];
        this.rowWidths = [];

        // Measure the widths and heights of each row
        for (var i = 0; i < this.ships.length; i++) {
            this.rowHeights[i] = this.rowWidths[i] = 0;

            for (var j = 0; j < this.ships[i].length; j++) {
                var ship = this.ships[i][j];
                if (ship.height > this.rowHeights[i])
                    this.rowHeights[i] = ship.height;
                if (j > 0)
                    this.rowWidths[i] += this.spacing;
                this.rowWidths[i] += ship.width;
            }

            this.totalHeight += this.rowHeights[i];
            if (i > 0)
                this.totalHeight += this.spacing;
            if (this.rowWidths[i] > this.totalWidth)
                this.totalWidth = this.rowWidths[i];
        }

        // Compute the relative position of each ship
        var offsetY = -this.totalHeight / 2;
        for (var i = 0; i < this.ships.length; i++) {
            var offsetX = -this.rowWidths[i] / 2;
            for (var j = 0; j < this.ships[i].length; j++) {
                var ship = this.ships[i][j];
                var state = ship.state;
                state.x = offsetX + ship.width / 2;
                state.y = offsetY + ship.height / 2;
                state.vx = 0;
                state.vy = 0;
                state.theta = 0;
                state.vtheta = 0;
                offsetX += ship.width + this.spacing;
            }
            offsetY += this.rowHeights[i] + this.spacing;
        }
    };

    return Platoon;
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

    game = new Game("game");

    game.addScreen("menu", new Menu);
    game.addScreen("highscores", new HighScores());

    stars = Util.generateStars();

    // TODO: Pass in the config for the stage
    game.player = new PlayerShip();

    var platoon1 = new Platoon(300, 300, Math.PI/4, [
        ['invader', 'invader', 'invader'],
        ['invader', 'invader', 'invader', 'invader'],
        ['invader', 'invader', 'invader'],
    ]);
    game.addScreen("stage1", new Stage(platoon1));
    
    game.addScreen("stage2", new Stage());
    
    game.addScreen("stage3", new Stage());

    game.start("menu");
}

function init() {
    loadSprites(function () {
        startGame()
    });
}

window.onload = init;
