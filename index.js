/*\
|*| Canvas Invaders
|*| By Jitu Das & Bertha Lam
|*| CMU 15-237 Cross-platform Mobile Web Apps, Fall 2012
\*/

var game_config = {
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
                    y: -20,
                    theta: -Math.PI / 2,
                    layout: [
                        ['invader', 'invader', 'invader', 'invader', 'invader'],
                    ]
                }
            ]
        },
        {
            platoons: [
                {
                    x: -50,
                    y: 300,
                    theta: 0,
                    layout: [
                        ['invader', 'invader', 'invader']
                    ]
                },
                {
                    x: 650,
                    y: 300,
                    theta: 0,
                    layout: [
                        ['invader', 'invader', 'invader']
                    ]
                }
            ]
        },
        {
            platoons: [
                {
                    x: -50,
                    y: -20,
                    theta: -Math.PI / 4,
                    layout: [
                        ['invader', 'invader', 'invader']
                    ]
                },
                {
                    x: 650,
                    y: -20,
                    theta: -3 * Math.PI / 4,
                    layout: [
                        ['invader', 'invader', 'invader']
                    ]
                },
                {
                    x: -50,
                    y: 650,
                    theta: Math.PI / 4,
                    layout: [
                        ['invader', 'invader', 'invader']
                    ]
                },
                {
                    x: 650,
                    y: 650,
                    theta: 3 * Math.PI / 4,
                    layout: [
                        ['invader', 'invader', 'invader']
                    ]
                }
            ]
        },
        {
            platoons: [
                {
                    x: 300,
                    y: -20,
                    theta: -Math.PI / 2,
                    layout: [
                        ['invader', 'invader', 'invader'],
                        ['invader', 'invader', 'invader', 'invader'],
                    ]
                },
                {
                    x: 300,
                    y: 650,
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
    player_angvelocity: 2 * Math.PI / 2,
    platoon_velocity: 20,
    platoon_angvelocity: 2 * Math.PI / 20,
    platoon_shooting_chance: 0.01,
    shooting_delay: 300, // milliseconds
    bullet_velocity: 200,
    header_height: 30
};

// The global game instance
var game;

// Miscellaneous helper functions
var Util = {
    extend: function (self, parent) {
        self.prototype = new parent();
        self.prototype.constructor = self;
        self.parent = parent.prototype;
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
        this.player = null;
        this.bullets = [];
        this.explosions = [];

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

                if (evname === "keydown") {
                    this.pressedKeys[e.keyCode] = true;
                } else if (evname === "keyup") {
                    this.pressedKeys[e.keyCode] = false;
                }
            }.bind(this, evname));
        }

        this.pressedKeys = {};

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
        
        // Get this variable since update may change screen
        var curScreen = this.curScreen;

        // Only render if the update functions says we need to redraw
        var doRender = curScreen.update(dt);
        if (doRender) curScreen.render(this.ctx, dt);
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
            this.setScreen("highscores");
        }
    };

    Game.prototype.reset = function () {
        this.bullets = [];
        this.explosions = [];
        this.playerScore = 0;
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
        Menu.parent.render.call(this, ctx);

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
        Instructions.parent.render.call(this, ctx);
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
    var maxNumScores = 5;  // number of stored high scores
    var highScoresKey = "high_scores"; // name of high scores cookie

    function HighScores() {
        HighScores.parent.constructor.call(this);
    }

    Util.extend(HighScores, Screen);

    HighScores.prototype.render = function (ctx) {
        HighScores.parent.render.call(this, ctx);

        ctx.fillStyle = "white";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
       
        // Add player health to total score
        game.playerScore += game.player.health; 
        updateHighScores(game.playerScore);
        renderHighScores(ctx);
    };

    HighScores.prototype.onKeyDown = function (e) {
        game.setScreen("menu");
    };
    
    function renderHighScores(ctx) {
        var highScores = getHighScores();

        // Render player score
        ctx.font = "bold 40px Arial";
        var endMsg;
        if (game.player.health === 0)
            endMsg = "You Lost!";
        else
            endMsg = "You Won!";

        ctx.fillText(endMsg, game.width / 2, 50);

        ctx.font = "bold 30px Arial";
        ctx.fillText("Your Score: " + game.playerScore, game.width / 2, 190);

        ctx.font = "bold 25px Arial";
        ctx.fillText("High Scores: ", game.width / 2, game.height / 2);

        // Render high scores list
        ctx.font = "20px Arial";
        var fontHeight = game.height / 2 + 40;
        for (var i = highScores.length - 1; i >= 0; i--) {
            ctx.fillText(highScores[i].name + ": " + highScores[i].score, 
                game.width / 2, fontHeight);
            
            fontHeight += 25;
        }

        ctx.font = "bold 25px Arial";
        ctx.fillText("Press any key to continue.", game.width / 2, fontHeight + 50);
    }

    // checks to see if player got new high score
    // true conditions:
    // 1) num high scores < maxNumScores
    // 2) lowest high score < score
    function checkHighScores(score) {
        var highScores = getHighScores();

        if (highScores.length < maxNumScores)
            return true;
        
        if (highScores[0].score < score)
            return true;

        return false;
    }

    // Insert new high score entry at right place
    function insertHighScore(name, score) {
        var highScores = getHighScores();
        var entry = {
            name: name,
            score: score
        };
        var inserted = false;

        // insert high score in right order
        for (var i = 0; i < highScores.length; i++) {
            if (highScores[i].score > score) {
                highScores.splice(i, 0, entry);
                inserted = true;
                break;
            }
        }

        if (!inserted) 
            highScores.push(entry);

        // remove lowest entry if necessary
        if (highScores.length > maxNumScores) {
            highScores.shift();
        }

        return highScores;
    }

    // Store & retrieve high scores using cookies
    // place starts w/ 0 as base
    // does nothing if no score to set
    function updateHighScores(score) {
        // scores expire in 10 days
        var expireDate = new Date();
        expireDate.setTime(expireDate.getTime() + 10 * 24 * 60 * 60 * 1000);
       
        // only update high scores with valid entry
        if (checkHighScores(score)) {
            // prompt user for name
            var name = prompt("Congratulations! You got a new high score!", 
            "Player");

            var highScores = insertHighScore(name, score);
            var value = escape(JSON.stringify(highScores)) + ";expires=" + 
                expireDate.toUTCString();
            
            console.log(highScoresKey + "=" + value);
            document.cookie = highScoresKey + "=" + value;
        }
    }
         
    // get list of all high scores, returns from highest to lowest
    function getHighScores() {
        var cookiesArr = document.cookie.split(";");
        
        for (var i = 0; i < cookiesArr.length; i++) {
            var splitIndex = cookiesArr[i].indexOf("=");
            var curCookieKey = cookiesArr[i].substr(0, splitIndex);
            curCookieKey = curCookieKey.replace(/^\s+|\s+$/g, "");

            if (curCookieKey === highScoresKey) {
                var highScores = cookiesArr[i].substr(splitIndex + 1);
                return JSON.parse(unescape(highScores));
            }
        }

        // make new high scores if no high scores yet
        return [];
    }

    return HighScores;
})();

Stage = (function () {
    // Player Status bar offset
    var statusBarOffset = 15;

    function Stage(platoons) {
        Stage.parent.constructor.call(this);

        this.platoons = platoons;
    }

    Util.extend(Stage, Screen);

    Stage.prototype.detectCollisions = function () {
        var player = game.player;

        // Player collision with wall
        if (player.state.x < player.radius)
            player.state.x = player.radius;
        if (player.state.y < player.radius+game_config.header_height)
            player.state.y = player.radius+game_config.header_height;
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

                game.explosions.push(new Explosion(
                    (player.state.x + ship.state.x) / 2,
                    (player.state.y + ship.state.y) / 2
                ));
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
                    game.explosions.push(new Explosion(
                        bullet.state.x,
                        bullet.state.y
                    ));
                    
                    // increment player score
                    game.playerScore += 5;

                    continue;
                }
            } else if (player.health > 0) {
                // Bullet with player
                if (bullet.collidesWith(player)) {
                    player.health -= 5;
                    game.bullets.splice(i, 1);
                    i--;
                    game.explosions.push(new Explosion(
                        bullet.state.x,
                        bullet.state.y
                    ));
                }
            }

            // Remove out of bound bullet
            if (bullet.state.x < -bullet.radius
                    || bullet.state.y < -bullet.radius+game_config.header_height
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

        // Update explosions
        for (var i = 0; i < game.explosions.length; i++) {
            game.explosions[i].update(dt);
            if (game.explosions[i].stage > 1) {
                game.explosions.splice(i, 1);
                i--;
            }
        }

        // Do collision detection
        this.detectCollisions();

        // Show game over if health reaches 0
        if (game.player.health === 0) {
            game.setScreen("lose");
            return true;
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

        // Render platoons
        for (var i = 0; i < this.platoons.length; i++)
            this.platoons[i].render(ctx);

        // Render player
        game.player.render(ctx);

        // Render bullets
        for (var i = 0; i < game.bullets.length; i++)
            game.bullets[i].render(ctx);

        // Render explosions
        for (var i = 0; i < game.explosions.length; i++)
            game.explosions[i].render(ctx);
        
        renderStats(ctx);
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
        // TODO: render black box for stats
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, game.width, game_config.header_height);

        ctx.fillStyle = "white";
        ctx.font = "bold 15px Arial";
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";

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
        if (!game.pressedKeys[e.keyCode]) {
            switch (e.keyCode) {
            case 37: // left arrow
                game.player.state.vtheta += game_config.player_angvelocity;
                break;
            case 39: // right arrow
                game.player.state.vtheta -= game_config.player_angvelocity;
                break;
            case 38: // up arrow
                game.player.state.vel += game_config.player_velocity;
                break;
            case 40: // down arrow
                game.player.state.vel -= game_config.player_velocity;
                break;
            case 32: // space bar
                game.player.setShooting(true);
                break;
            }
        }
    };

    Stage.prototype.onKeyUp = function (e) {
        switch (e.keyCode) {
        case 37: // left arrow
            game.player.state.vtheta -= game_config.player_angvelocity;
            break;
        case 39: // right arrow
            game.player.state.vtheta += game_config.player_angvelocity;
            break;
        case 38: // up arrow
            game.player.state.vel -= game_config.player_velocity;
            break;
        case 40: // down arrow
            game.player.state.vel += game_config.player_velocity;
            break;
        case 32: // space bar
            game.player.setShooting(false);
            break;
        }
    };

    Stage.prototype.reset = function () {
        Stage.parent.reset.call(this);

        for (var i = 0; i < this.platoons.length; i++) {
            this.platoons[i].reset();
        }
    };

    return Stage;
})();

LoseScreen = (function () {
    function LoseScreen() {
    }

    Util.extend(LoseScreen, Screen);

    LoseScreen.prototype.render = function (ctx) {
        // TODO: Render lose screen
        ctx.fillText("You lose. Press any key to continue.", 50, 50);

        setTimeout(function () {
            game.setScreen("highscores");
        }, 3000);
    };

    return LoseScreen;
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

        Bullet.parent.constructor.call(this, "bullet", {
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
        SpaceShip.parent.constructor.apply(this, arguments);
        
        this.fullHealth = 100;
        this.lastShot = 0;

        this.reset();
    }

    Util.extend(SpaceShip, Object);

    SpaceShip.prototype.update = function () {
        if (this.health > 0) {
            SpaceShip.parent.update.apply(this, arguments);
        }
    };

    SpaceShip.prototype.render = function () {
        if (this.health > 0) {
            SpaceShip.parent.render.apply(this, arguments);
        }
    };

    SpaceShip.prototype.fireBullet = function (curTime) {
        var bullet = new Bullet(this, this.state.x, this.state.y, 
            game_config.bullet_velocity, this.state.theta);
        
        game.bullets.push(bullet);
        
        if (!curTime) curTime = (new Date()).getTime();
        this.lastShot = curTime;
    };

    SpaceShip.prototype.reset = function () {
        SpaceShip.parent.reset.call(this);

        this.health = this.fullHealth;
    };

    return SpaceShip;
})();

PlayerShip = (function () {
    function PlayerShip() {
        PlayerShip.parent.constructor.call(this, "player");
    }

    Util.extend(PlayerShip, SpaceShip);

    PlayerShip.prototype.update = function (dt) {
        PlayerShip.parent.update.call(this, dt);

        var curTime = (new Date()).getTime();
        if (this.isShooting && curTime-this.lastShot > game_config.shooting_delay) {
            this.fireBullet(curTime);
        }
    };

    PlayerShip.prototype.reset = function () {
        PlayerShip.parent.reset.call(this);

        this.state.x = 300;
        this.state.y = 300;
        this.state.vel = 0;
        this.state.theta = Math.PI / 2;
        this.state.vtheta = 0;
        
        this.isShooting = false;
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
        Platoon.parent.constructor.call(this, "", this.start);

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

    function getVectorToPlayer(x, y, px, py) {
        var dx = px - x;
        var dy = py - y;
        return {
            dist: Math.sqrt(dx*dx + dy*dy),
            theta: Math.atan2(-dy, dx)
        };
    }

    Platoon.prototype.update = function (dt) {
        var state = this.state;
        var player = game.player;
        var vecToPlayer = getVectorToPlayer(state.x, state.y,
                                            player.state.x, player.state.y);
        var dtheta = state.theta - vecToPlayer.theta;

        while (dtheta < -Math.PI) dtheta += 2 * Math.PI;
        while (dtheta >  Math.PI) dtheta -= 2 * Math.PI;
        
        var direction = 1;
        if (dtheta < -Math.PI / 2) {
            dtheta += Math.PI;
            direction = -1;
        } else if (dtheta > Math.PI / 2) {
            dtheta -= Math.PI;
            direction = -1;
        }

        if (dtheta < -0.01) {
            this.state.vtheta = game_config.platoon_angvelocity;
        } else if (dtheta > 0.01) {
            this.state.vtheta = -game_config.platoon_angvelocity;
        } else {
            this.state.vtheta = 0;
        }

        if (vecToPlayer.dist > this.height / 2 + 2 * player.radius) {
            this.state.vel = game_config.platoon_velocity * direction;
        } else if (vecToPlayer.dist < this.height / 2 + player.radius) {
            this.state.vel = -game_config.platoon_velocity * direction;
        } else {
            this.state.vel = 0;
        }

        Platoon.parent.update.call(this, dt);

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
                    
                    vecToPlayer = getVectorToPlayer(state.x, state.y,
                                            player.state.x, player.state.y);
                    state.theta = vecToPlayer.theta;

                    // Check if the ship is visible
                    if (state.x > 0 && state.y > game_config.header_height
                            && state.x < game.width && state.y < game.height) {
                        // Some percent chance of firing again after a delay
                        var curTime = (new Date()).getTime();
                        if (curTime-ship.lastShot > game_config.shooting_delay
                                && Math.random() < game_config.platoon_shooting_chance) {
                            ship.fireBullet(curTime);
                        }
                    }
                }
            }
        }
    };

    Platoon.prototype.reset = function () {
        Platoon.parent.reset.call(this);

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
            Platoon.parent.collidesWith.call(this, that, padding);
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

Explosion = (function () {
    function Explosion(x, y) {
        Explosion.parent.constructor.call(this, "", {x:x, y:y});
        this.stage = 0;
    }

    Util.extend(Explosion, Object);

    Explosion.prototype.update = function (dt) {
        this.stage += dt * 4;
    };

    Explosion.prototype.render = function (ctx) {
        var alpha = 1 - this.stage / 2;
        if (alpha < 0) return;

        var radius = this.stage * 10;

        ctx.beginPath();
        ctx.arc(this.state.x, this.state.y, radius, 0, 2*Math.PI, true);
        ctx.strokeStyle = "rgba(255,255,255," + alpha + ")";
        ctx.lineWidth = 5;
        ctx.stroke();
    };

    return Explosion;
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
    game = new Game(game_config.canvas, 60);

    game.loadSprites(game_config.sprites, function () {
        game.player = new PlayerShip();

        game.addScreen("menu", new Menu());
        game.addScreen("instructions", new Instructions());
        game.addScreen("highscores", new HighScores());
        game.addScreen("lose", new LoseScreen());

        game_config.stages.forEach(function (stage_config) {
            var platoons = [];
            stage_config.platoons.forEach(function (platoon_config) {
                platoons.push(
                    new Platoon(
                        platoon_config.x,
                        platoon_config.y,
                        platoon_config.theta,
                        platoon_config.layout
                    )
                );
            });
            game.addStage(new Stage(platoons));
        });

        game.start("menu");
    });
}

window.onload = init;
