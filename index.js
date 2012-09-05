/*\
|*| Canvas Invaders
|*| By Jitu Das & Bertha Lam
|*| CMU 15-237 Cross-platform Mobile Web Apps, Fall 2012
\*/

var config = {
    canvas: "game",
    sprites: {
        player: "images/player2.png",
        invader: "images/invader2.png",
        bullet: "images/bullet.png"
    },
    stages: [
        {
            platoons: [
                {
                    x: 300,
                    y: 100,
                    theta: -Math.PI / 2,
                    layout: [
                        ['invader', 'invader', 'invader'],
                        ['invader', 'invader', 'invader', 'invader'],
                    ]
                },
                {
                    x: 300,
                    y: 500,
                    theta: Math.PI / 2,
                    layout: [
                        ['invader', 'invader', 'invader'],
                        ['invader', 'invader', 'invader', 'invader'],
                    ]
                }
            ]
        }
    ],
    player_velocity: 150,
    player_angvelocity: 2 * Math.PI / 1.5,
    shooting_delay: 300, // milliseconds
    bullet_velocity: 200,
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
        this.bullets = [];

        // Compute update rate
        this.fps = Util.default_arg(fps, 60);
        this.delay = 1000 / this.fps;
        this.interval = null;
        this.lastUpdate = (new Date()).getTime();

        // Add event listeners
        for (var evname in eventHandlers) {
            this.canvas.addEventListener(evname, function (evname, e) {
                // Call the screen's handler if it has one
                var handler = eventHandlers[evname];
                if (this.curScreen
                        && typeof this.curScreen[handler] === "function") {
                    this.curScreen[handler](e);
                }
            }.bind(this, evname));
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
        this.interval = setInterval(function() {
            this.mainLoop();
        }.bind(this), this.delay);
    };

    Game.prototype.mainLoop = function () {
        var prevUpdate = this.lastUpdate;
        this.lastUpdate = (new Date()).getTime();
        var dt = (this.lastUpdate - prevUpdate) / 1000;
        
        var doRender = this.curScreen.update(dt);
        
        if (doRender) {
            this.curScreen.render(this.ctx, dt);
        }
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
        this.curScreen.reset(this.ctx);
        this.curStage = null;
    };

    Game.prototype.setStage = function (idx) {
        this.setScreen(this.stages[idx]);
        this.curStage = idx;
    };

    Game.prototype.nextStage = function () {
        this.curStage++;
        if (this.curStage < this.stages.length) {
            this.setStage(this.curStage);
        } else {
            this.setScreen("menu");
        }
    };

    Game.prototype.reset = function () {
        this.bullets = [];
        this.player.reset();
    };

    return Game;
})();

Screen = (function () {
    function Screen() { /* Do nothing */ }

    Screen.prototype.update = function (dt) {
        if (this.wasRendered) {
            // By default don't redraw except first frame
            return false;
        } else {
            this.wasRendered = true;
            return true;
        }
    };

    // clears the screen
    Screen.prototype.render = function(ctx) {
        ctx.fillStyle = game.bgColor;
        ctx.fillRect(0, 0, 600, 600);
    };

    Screen.prototype.reset = function () {
        this.wasRendered = false;
    };

    return Screen;
})();

Menu = (function () {
    function Menu() {}

    Util.extend(Menu, Screen);

    // press S to start, P to pause, I for instructions

    Menu.prototype.render = function(ctx) {
        Menu.parent.prototype.render.call(this, ctx);

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
        //console.log("keycode", e.charCode, String.fromCharCode(e.charCode));
        if (String.fromCharCode(e.charCode) === "s") {
            game.reset();
            game.setStage(0);
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
        Instructions.parent.prototype.render.call(this, ctx);
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
    function HighScores() {
        HighScores.parent.prototype.constructor.call(this);
    }

    Util.extend(HighScores, Screen);

    HighScores.prototype.render = function(ctx) {
      console.log("render not implemented for HighScores");
    };

    return HighScores;
})();

Stage = (function () {
    // Player Status bar offset
    var statusBarOffset = 15;

    function Stage(platoons) {
        Stage.parent.prototype.constructor.call(this);

        this.platoons = platoons;
    }

    Util.extend(Stage, Screen);

    Stage.prototype.detectCollisions = function () {
        var player = game.player;

        // Player collision with wall
        if (player.state.x < player.radius)
            player.state.x = player.radius;
        if (player.state.y < player.radius)
            player.state.y = player.radius;
        if (player.state.x > game.width-player.radius)
            player.state.x = game.width-player.radius;
        if (player.state.y > game.height-player.radius)
            player.state.y = game.height-player.radius;

        for (var i = 0; i < this.platoons.length; i++) {
            var platoon = this.platoons[i];

            // Platoon with platoon
            for (var j = i+1; j < this.platoons.length; j++) {
                var platoon2 = this.platoons[j];
                var dx = platoon2.state.x - platoon.state.x;
                var dy = platoon2.state.y - platoon.state.y;
                var dist = Math.sqrt(dx*dx + dy*dy);
                var delta = platoon.radius + platoon2.radius - dist;
                if (delta > 0) {
                    // normalize
                    var nx = dx / dist;
                    var ny = dy / dist;

                    platoon.state.x -= nx * delta / 2;
                    platoon.state.y -= ny * delta / 2;
                    platoon2.state.x += nx * delta / 2;
                    platoon2.state.y += ny * delta / 2;
                }
            }

            // Platoon with player
            var ship = platoon.collidesWith(player, platoon.spacing);
            if (ship) {
                player.health = Math.max(0, player.health-25);
                ship.health = 0;
            }
        }

        for (var i = 0; i < game.bullets.length; i++) {
            var bullet = game.bullets[i];

            if (bullet.origin === player) {
                // Bullet with platoon
                var ship = null;
                for (var j = 0; j < this.platoons.length && !ship; j++) {
                    var platoon = this.platoons[j];
                    ship = platoon.collidesWith(bullet);
                }
                if (ship) {
                    ship.health = 0;
                    game.bullets.splice(i, 1);
                    i--;
                    continue;
                }
            } else if (player.health > 0) {
                // Bullet with player
                if (bullet.collidesWith(player)) {
                    player.health -= 5;
                    game.bullets.splice(i, 1);
                    i--;
                }
            }

            // Remove out of bound bullet
            if (bullet.state.x < -bullet.radius
                    || bullet.state.y < -bullet.radius
                    || bullet.state.x > game.width+bullet.radius
                    || bullet.state.y > game.height+bullet.radius) {
                game.bullets.splice(i, 1);
                i--;
            }
        }
    };

    Stage.prototype.update = function (dt) {
        // Update platoons
        for (var i = 0; i < this.platoons.length; i++)
            this.platoons[i].update(dt);

        // Update player
        game.player.update(dt);

        // Update bullets
        for (var i = 0; i < game.bullets.length; i++) 
            game.bullets[i].update(dt);

        // Do collision detection
        this.detectCollisions();

        // Show game over if health reaches 0
        console.log(game.player.health);
        if (game.player.health === 0) {
            //game.nextStage();
            game.pause();
            return false;
        }

        // Check if all enemies have been destroyed
        var remainingShips = 0;
        for (var i = 0; i < this.platoons.length; i++)
            remainingShips += this.platoons[i].remainingShips();

        // Go to next stage if all enemies are dead
        if (remainingShips === 0) {
            game.nextStage();
            return false;
        }

        // We always want to redraw
        return true;
    };

    Stage.prototype.render = function (ctx, dt) {
        var alpha = Math.max(0.75 - 0.01 / dt, 0);
        ctx.fillStyle = "rgba(0, 0, 0, " + alpha + ")";
        ctx.fillRect(0, 0, game.width, game.height);

        renderBg(ctx);
        renderStats(ctx);

        // Render platoons
        for (var i = 0; i < this.platoons.length; i++)
            this.platoons[i].render(ctx);

        // Render player
        game.player.render(ctx);

        // Render bullets
        for (var i = 0; i < game.bullets.length; i++)
            game.bullets[i].render(ctx);
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
        if (!this.pressedKeys[e.keyCode]) {
            switch (e.keyCode) {
            case 37: // left arrow
                game.player.state.vtheta += config.player_angvelocity;
                break;
            case 39: // right arrow
                game.player.state.vtheta -= config.player_angvelocity;
                break;
            case 38: // up arrow
                game.player.state.vel += config.player_velocity;
                break;
            case 40: // down arrow
                game.player.state.vel -= config.player_velocity;
                break;
            case 32: // space bar
                game.player.setShooting(true);
                break;
            }
        }

        this.pressedKeys[e.keyCode] = true;
    };

    Stage.prototype.onKeyUp = function (e) {
        switch (e.keyCode) {
        case 37: // left arrow
            game.player.state.vtheta -= config.player_angvelocity;
            break;
        case 39: // right arrow
            game.player.state.vtheta += config.player_angvelocity;
            break;
        case 38: // up arrow
            game.player.state.vel -= config.player_velocity;
            break;
        case 40: // down arrow
            game.player.state.vel += config.player_velocity;
            break;
        case 32: // space bar
            game.player.setShooting(false);
            break;
        }

        this.pressedKeys[e.keyCode] = false;
    };

    Stage.prototype.reset = function () {
        Stage.parent.prototype.reset.call(this);

        for (var i = 0; i < this.platoons.length; i++) {
            this.platoons[i].reset();
        }

        this.pressedKeys = {};
        this.lastFrameImage = null;
    };

    return Stage;
})();

/****************
 * OBJECT LOGIC *
 ****************/

Object = (function () {
    function Object(sprite_id, config) {
        if (typeof sprite_id !== "string") return;

        config = Util.default_arg(config, {});

        this.state = {
            x: Util.default_arg(config.x, 0),
            y: Util.default_arg(config.y, 0),
            vel: Util.default_arg(config.vel, 0),
            theta: Util.default_arg(config.theta, 0),
            vtheta: Util.default_arg(config.vtheta, 0)
        };

        this.sprite = game.sprites[sprite_id];

        if (this.sprite) {
            this.width = this.sprite.width;
            this.height = this.sprite.height;
            this.radius = Math.min(this.width, this.height) / 2;
        }
    }

    Object.prototype.render = function (ctx) {
        if (this.sprite) {
            ctx.save();
            ctx.translate(this.state.x, this.state.y);
            ctx.rotate(-this.state.theta + Math.PI / 2);
            ctx.drawImage(this.sprite.image, -this.width/2, -this.height/2);
            ctx.restore();
        }
    };

    Object.prototype.update = function (dt) {
        this.state.x += dt * this.state.vel * Math.cos(this.state.theta);
        this.state.y -= dt * this.state.vel * Math.sin(this.state.theta);
        this.state.theta += dt * this.state.vtheta;
    };

    Object.prototype.reset = function () { /* Do nothing */ };

    Object.prototype.collidesWith = function (that, padding) {
        if (!this.radius || !that.radius) return false;
        
        padding = Util.default_arg(padding, 0);

        var dx = this.state.x - that.state.x;
        var dy = this.state.y - that.state.y;
        var distSq = dx * dx + dy * dy;
        var limit = this.radius + that.radius + padding;

        return (distSq < limit * limit);
    };

    return Object;
})();

Bullet = (function () {
    function Bullet(origin, x, y, vel, theta) {
        this.origin = origin;

        Bullet.parent.call(this, "bullet", {
            x: x,
            y: y,
            vel: vel,
            theta: theta
        });
    }
    
    Util.extend(Bullet, Object);

    return Bullet;
})();

SpaceShip = (function () {
    function SpaceShip(type, config) {
        SpaceShip.parent.apply(this, arguments);
        
        this.fullHealth = 100;
        this.lastShot = 0;

        this.reset();
    }

    Util.extend(SpaceShip, Object);

    SpaceShip.prototype.update = function () {
        if (this.health > 0) {
            SpaceShip.parent.prototype.update.apply(this, arguments);
        }
    };

    SpaceShip.prototype.render = function () {
        if (this.health > 0) {
            SpaceShip.parent.prototype.render.apply(this, arguments);
        }
    };

    SpaceShip.prototype.fireBullet = function (curTime) {
        var bullet = new Bullet(this, this.state.x, this.state.y, 
            config.bullet_velocity, this.state.theta);
        
        game.bullets.push(bullet);
        
        if (!curTime) curTime = (new Date()).getTime();
        this.lastShot = curTime;
    };

    SpaceShip.prototype.reset = function () {
        SpaceShip.parent.prototype.reset.call(this);

        this.health = this.fullHealth;
    };

    return SpaceShip;
})();

PlayerShip = (function () {
    function PlayerShip() {
        PlayerShip.parent.call(this, "player");
        
        this.isShooting = false;
    }

    Util.extend(PlayerShip, SpaceShip);

    PlayerShip.prototype.update = function (dt) {
        PlayerShip.parent.prototype.update.call(this, dt);

        var curTime = (new Date()).getTime();
        if (this.isShooting && curTime-this.lastShot > config.shooting_delay) {
            this.fireBullet(curTime);
        }
    };

    PlayerShip.prototype.reset = function () {
        PlayerShip.parent.prototype.reset.call(this);

        this.state.x = 300;
        this.state.y = 300;
        this.state.vel = 0;
        this.state.theta = Math.PI / 2;
        this.state.vtheta = 0;
    };

    PlayerShip.prototype.setShooting = function (isShooting) {
        this.isShooting = isShooting;
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
        Platoon.parent.call(this, "", this.start);

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
    }

    Util.extend(Platoon, Object);

    Platoon.prototype.render = function (ctx) {
        for (var i = 0; i < this.ships.length; i++) {
            for (var j = 0; j < this.ships[i].length; j++) {
                this.ships[i][j].render(ctx);
            }
        }
    };

    Platoon.prototype.update = function (dt) {
        var state = this.state;
        var player = game.player.state;
        var dx = player.x - state.x;
        var dy = -(player.y - state.y);
        var dist = Math.sqrt(dx * dx + dy * dy);
        var angToPlayer = Math.atan2(dy, dx);
        var dtheta = state.theta - angToPlayer;

        while (dtheta < -Math.PI) dtheta += 2 * Math.PI;
        while (dtheta >  Math.PI) dtheta -= 2 * Math.PI;

        if (dtheta < -0.01) {
            this.state.vtheta = 2 * Math.PI / 30;
        } else if (dtheta > 0.01) {
            this.state.vtheta = -2 * Math.PI / 30;
        } else {
            this.state.vtheta = 0;
        }

        if (dist > this.height / 2 + 2 * game.player.radius) {
            this.state.vel = 10;
        } else if (dist < this.height / 2 + game.player.radius) {
            this.state.vel = -10;
        } else {
            this.state.vel = 0;
        }

        Platoon.parent.prototype.update.call(this, dt);

        // update position of each ship in platoon
        for (var i = 0; i < this.ships.length; i++) {
            for (var j = 0; j < this.ships[i].length; j++) {
                var ship = this.ships[i][j];
                var state = ship.state;

                if (ship.health > 0) {
                    var ang = Math.atan2(state.offsety, state.offsetx) + Math.PI / 2;
                    var mag = Math.sqrt(state.offsetx * state.offsetx +
                                        state.offsety * state.offsety);
                    state.x = this.state.x + mag * Math.cos(ang + this.state.theta);
                    state.y = this.state.y - mag * Math.sin(ang + this.state.theta);
                    state.theta = angToPlayer;

                    // Some percent chance of firing again after a delay
                    var curTime = (new Date()).getTime();
                    if (curTime-ship.lastShot > config.shooting_delay
                            && Math.random() < 0.0025) {
                        ship.fireBullet(curTime);
                    }
                }
            }
        }
    };

    Platoon.prototype.reset = function () {
        Platoon.parent.prototype.reset.call(this);

        this.state.x = this.start.x;
        this.state.y = this.start.y;
        this.state.vel = 0;
        this.state.theta = this.start.theta;
        this.state.vtheta = 0;

        // Reset all the ships
        for (var i = 0; i < this.ships.length; i++) {
            for (var j = 0; j < this.ships[i].length; j++) {
                this.ships[i][j].reset();
            }
        }
    };

    Platoon.prototype.computeOffsets = function () {
        this.height = 0;
        this.width = 0;
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

            this.height += this.rowHeights[i];
            if (i > 0)
                this.height += this.spacing;
            if (this.rowWidths[i] > this.width)
                this.width = this.rowWidths[i];
        }

        // Compute the relative position of each ship
        var offsetY = -this.height / 2;
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
        
        // Compute radius for collision detection
        this.radius = Math.sqrt((this.width / 2) * (this.width / 2)
                                + (this.height / 2) * (this.height / 2));
    };

    Platoon.prototype.collidesWith = function (that, padding) {
        // First check if the platoon's bounding circle collides
        var platoonCollides =
            Platoon.parent.prototype.collidesWith.call(this, that, padding);
        if (!platoonCollides)
            return null;

        // Check which ship is colliding, if any
        for (var i = 0; i < this.ships.length; i++) {
            for (var j = 0; j < this.ships[i].length; j++) {
                var ship = this.ships[i][j];
                if (ship.health > 0 && ship.collidesWith(that))
                    return ship;
            }
        }

        return null;
    };

    Platoon.prototype.remainingShips = function () {
        var count = 0;
        for (var i = 0; i < this.ships.length; i++) {
            for (var j = 0; j < this.ships[i].length; j++) {
                if (this.ships[i][j].health > 0)
                    count++;
            }
        }
        return count;
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
        this.image = new Image();
        this.image.onload = function () {
            if (!self.width) self.width = this.width;
            if (!self.height) self.height = this.height;
            console.log("Loaded image " + self.src);
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
    game = new Game(config.canvas, 60);

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
