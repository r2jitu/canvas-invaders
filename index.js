/*\
|*| Canvas Invaders
|*| By Jitu Das & Bertha Lam
|*| CMU 15-237 Cross-platform Mobile Web Apps, Fall 2012
\*/

var config = {
    sprites: {
        player: "images/player.png",
        invader: "images/invader.png"
    },
    stages: [
        {
            platoons: [
                /*
                {
                    x: 300,
                    y: 200,
                    theta: 0,
                    layout: [
                        ['invader', 'invader', 'invader'],
                        ['invader', 'invader', 'invader', 'invader'],
                        ['invader', 'invader', 'invader'],
                    ]
                },
                {
                    x: 300,
                    y: 500,
                    theta: 0,
                    layout: [
                        ['player'],
                        ['player', 'player']
                    ]
                }
                */
            ]
        }
    ],
    player_velocity: 75,
    player_angvelocity: 2 * Math.PI / 3
};

// The global game instance
var game;

// Miscellaneous helper functions
var Util = {
    extend: function (self, parent) {
        self.prototype = new parent();
        self.prototype.constructor = self;
        self.parent = parent;
    },
    default_arg: function (val, def) {
        if (typeof val === "undefined")
            return def;
        else
            return val;
    }
};

/**************
 * GAME LOGIC *
 **************/

Game = (function () {
    var eventHandlers = {
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
        this.stages = [];
        this.curStage = 0;

        this.canvas = document.getElementById(canvas_id);
        this.ctx = this.canvas.getContext("2d");

        this.bgColor = "black";
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.stars = generateStars(this.width, this.height);

        // Player stats
        this.playerScore = 0;
        this.player = null;

        // Compute update rate
        this.fps = Util.default_arg(fps, 60);
        this.delay = 1000 / this.fps;
        this.interval = null;
        this.lastUpdate = (new Date()).getTime();

        // Add event listeners
        var self = this;
        for (var evname in eventHandlers) {
            (function (evname) {
                self.canvas.addEventListener(evname, function (e) {
                    // Call the screen's handler if it has one
                    var handler = eventHandlers[evname];
                    if (typeof self.curScreen[handler] === "function") {
                        self.curScreen[handler](e);
                    }
                });
            })(evname);
        }

        this.canvas.setAttribute("tabindex", 0);
        this.canvas.focus();
    }
    
    function generateStars(width, height) {
        var numStars = 50;
        var stars = new Array();

        for (var i = 0; i < numStars; i++) {
            var xPos = Math.floor(Math.random() * width);
            var yPos = Math.floor(Math.random() * height + 15);

            var alpha = (Math.random() * 50 + 25) / 100;

            stars[i] = {
                x: xPos,
                y: yPos,
                a: alpha
            };
        }

        return stars;
    }

    // Loads a list of sprites in parallel. Calls cb when all are done loading.
    Game.prototype.loadSprites = function (paths, cb) {
        var sprites = {};
        var remain_sprites = 0;
        
        this.sprites = sprites;

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
        var prevUpdate = this.lastUpdate;
        this.lastUpdate = (new Date()).getTime();
        var dt = (this.lastUpdate - prevUpdate) / 1000;
        this.curScreen.update(dt);
        
        this.curScreen.render(this.ctx);
    };

    Game.prototype.addScreen = function (name, screen) {
        this.screens[name] = screen;
    };

    Game.prototype.addStage = function (stage) {
        var idx = this.stages.length + 1;
        var name = "stage" + idx;
        this.stages.push(name);
        this.addScreen(name, stage);
    };

    Game.prototype.setScreen = function (screen_id) {
        this.curScreen = this.screens[screen_id];
        this.curStage = null;
    };

    Game.prototype.setStage = function (idx) {
        this.setScreen(this.stages[idx]);
        this.curStage = idx;
    };

    return Game;
})();

Screen = (function () {
    function Screen() {}

    Screen.prototype.update = function (dt) { /* Do nothing */ };

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
        Menu.parent.prototype.render(ctx);

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
            game.setStage(0);
            game.player.reset();
        }
        else if (String.fromCharCode(e.charCode) === "i") {
            game.setScreen("instructions");
        }
    };

    return Menu;
})();

Instructions = (function () {
    function Instructions() {}

    Util.extend(Instructions, Screen);

    Instructions.prototype.render = function(ctx) {
        Instructions.parent.prototype.render(ctx);
        // render header
        ctx.fillStyle = "white";
        ctx.font = "bold 40px Arial";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText("Instructions", game.width / 2, 70);

        // render actual instructions
        ctx.font = "25px Arial";
        ctx.fillText("Up Arrow - Move forward", game.width / 2, 200);
        ctx.fillText("Down Arrow - Move backwards", game.width / 2, 230);
        ctx.fillText("Left Arrow - Rotate counter-clockwise", game.width / 2, 260);
        ctx.fillText("Right Arrow - Rotate clockwise", game.width / 2, 290);
        ctx.fillText("Spacebar - Fire weapon", game.width / 2, 320);

        ctx.fillText("Press 'b' to return to the menu screen", game.width / 2, 550);

    }

    // Handle user keyboard input
    Instructions.prototype.onKeyPress = function(e) {
        // 'b', escape, backspace will go back to menu
        if (String.fromCharCode(e.charCode) === "b") {
           game.setScreen("menu"); 
        }
    }
    
    return Instructions;

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
    var pressedKeys = {};

    function Stage(platoons) {
        this.platoons = platoons;
    }

    Util.extend(Stage, Screen);

    Stage.prototype.update = function (dt) {
        for (var i = 0; i < this.platoons.length; i++)
            this.platoons[i].update(dt);

        game.player.update(dt);
    };

    Stage.prototype.render = function (ctx) {
        Stage.parent.prototype.render(ctx);

        renderBg(ctx);
        renderStats(ctx);

        // render platoons
        for (var i = 0; i < this.platoons.length; i++)
            this.platoons[i].render(ctx);

        // render player
        game.player.render(ctx);
    };

    // Renders background (stars)
    function renderBg(ctx) {
        for (var i = 0; i < game.stars.length; i++) {
            var star = game.stars[i];
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

    
    Stage.prototype.onKeyDown = function (e) {
        console.log(e.keyCode);
        if (!pressedKeys[e.keyCode]) {
            switch (e.keyCode) {
            case 37: // left arrow
                game.player.state.vtheta -= config.player_angvelocity;
                break;
            case 39: // right arrow
                game.player.state.vtheta += config.player_angvelocity;
                break;
            case 38: // up arrow
                game.player.state.vforward += config.player_velocity;
                break;
            case 40: // down arrow
                game.player.state.vforward -= config.player_velocity;
                break;
            }
        }

        pressedKeys[e.keyCode] = true;
    };

    Stage.prototype.onKeyUp = function (e) {
        switch (e.keyCode) {
        case 37: // left arrow
            game.player.state.vtheta += config.player_angvelocity;
            break;
        case 39: // right arrow
            game.player.state.vtheta -= config.player_angvelocity;
            break;
        case 38: // up arrow
            game.player.state.vforward -= config.player_velocity;
            break;
        case 40: // down arrow
            game.player.state.vforward += config.player_velocity;
            break;
        }

        pressedKeys[e.keyCode] = false;
    };

    return Stage;
})();

/****************
 * OBJECT LOGIC *
 ****************/

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
        if (this.sprite) {
            ctx.save();
            ctx.translate(this.state.x, this.state.y);
            ctx.rotate(this.state.theta + Math.PI / 2);
            ctx.drawImage(this.sprite.image, -this.width/2, -this.height/2);
            ctx.restore();
        }
    };

    Object.prototype.update = function (dt) {
        this.state.x += dt * this.state.vx;
        this.state.y += dt * this.state.vy;
        this.state.theta += dt * this.state.vtheta;
        if (this.state.vforward) {
            this.state.x += dt * this.state.vforward * Math.cos(this.state.theta);
            this.state.y += dt * this.state.vforward * Math.sin(this.state.theta);
        }
        // TODO: Collision detection
    };

    Object.prototype.reset = function () {};    // do nothing

    return Object;
})();

SpaceShip = (function () {
    function SpaceShip(type, config) {
        if (typeof type === "string") {
            SpaceShip.parent.call(this, game.sprites[type], config);
        }
    }

    Util.extend(SpaceShip, Object);

    return SpaceShip;
})();

PlayerShip = (function () {
    function PlayerShip() {
        PlayerShip.parent.call(this, "player");
        this.health = 100;
    }

    Util.extend(PlayerShip, SpaceShip);

    PlayerShip.prototype.reset = function () {
        this.state.x = 300;
        this.state.y = 300;
        this.state.vforward = 0;
        this.state.theta = 0;
        this.state.vtheta = 0;
    };

    return PlayerShip;
})();

Platoon = (function () {
    // How much space to put between the ships
    // (x,y) is the center of the platoon
    function Platoon(x, y, theta, layout, spacing) {
        this.start = {
            x: x,
            y: y,
            theta: theta
        };
        Platoon.parent.call(this, null, this.start);
        
        this.spacing = Util.default_arg(spacing, 10);

        this.ships = [];
        for (var i = 0; i < layout.length; i++) {
            var row = [];
            for (var j = 0; j < layout[i].length; j++) {
                row.push(new SpaceShip(layout[i][j]));
            }
            this.ships.push(row);
        }

        this.computeOffsets();
        this.reset();
    }

    Util.extend(Platoon, Object);

    Platoon.prototype.render = function (ctx) {
        // TODO: Override render to draw all the individual ships
        for (var i = 0; i < this.ships.length; i++) {
            for (var j = 0; j < this.ships[i].length; j++) {
                this.ships[i][j].render(ctx);
            }
        }
    };

    Platoon.prototype.update = function (dt) {
        Platoon.parent.prototype.update(dt);

        // update position of each ship in platoon
        for (var i = 0; i < this.ships.length; i++) {
            for (var j = 0; j < this.ships[i].length; j++) {
                var ship = this.ships[i][j];
                var state = ship.state;

                var ang = Math.atan2(state.offsety, state.offsetx);
                var mag = Math.sqrt(state.offsetx * state.offsetx +
                                    state.offsety * state.offsety);
                state.x = this.state.x + mag * Math.cos(ang + this.state.theta);
                state.y = this.state.y + mag * Math.sin(ang + this.state.theta);
                state.theta = this.state.theta;
            }
        }
    };

    Platoon.prototype.reset = function () {
        this.state.x = this.start.x;
        this.state.y = this.start.y;
        this.state.theta = this.start.theta;
        this.state.vx = 0;
        this.state.vy = 0;
        this.state.vtheta = Math.PI / 8;
    };

    Platoon.prototype.computeOffsets = function () {
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
                state.offsetx = offsetX + ship.width / 2;
                state.offsety = offsetY + ship.height / 2;
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

/*********
 * SETUP *
 *********/

function init() {
    game = new Game("game", 60);

    game.loadSprites(config.sprites, function () {
        game.player = new PlayerShip();

        game.addScreen("menu", new Menu());
        game.addScreen("instructions", new Instructions());
        game.addScreen("highscores", new HighScores());

        config.stages.forEach(function (config) {
            var platoons = [];
            config.platoons.forEach(function (config) {
                platoons.push(new Platoon(config.x, config.y, config.theta,
                    config.layout));
            });
            game.addStage(new Stage(platoons));
        });

        game.start("menu");
    });
}

window.onload = init;
