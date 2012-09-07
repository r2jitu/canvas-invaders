/*\
|*| Canvas Invaders
|*| By Jitu Das (cdas) & Bertha Lam (chingwal)
|*| CMU 15-237 Cross-platform Mobile Web Apps, Fall 2012
\*/

// Holds the configuration for the levels, sprites, constants, etc.
var game_config = {
    // The id of the canvas that the game runs on
    canvas: "game",

    // Gameplay constants
    player_velocity: 150, // px/s
    player_angvelocity: 2 * Math.PI / 2, // rad/s
    platoon_velocity: 20, // px/s
    platoon_angvelocity: 2 * Math.PI / 20, // rad/s
    platoon_shooting_chance: 0.01,
    shooting_delay: 300, // milliseconds
    bullet_velocity: 200, // milliseconds
    frames_per_second: 60,

    // Display constants
    header_height: 30, // pixels
    background_color: "black",
    num_stars: 50, // number of stars in background
};

// The sprites that game uses. Sprites are made from a list of primitives.
var game_sprites = {
    bullet: {
        width: 5,
        height: 20,
        shapes: [
            'color',    'white',
            'rect',     [ 0, 2.5, 5, 7.5 ],
            'arc',      [ 2.5, 2.5, 2.5, 0, Math.PI, true ]
        ]
    },
    player: {
        width: 32,
        height: 22,
        shapes: [
            'color',    'white',

            // Left pillar
            'rect',     [ 0, 6, 8, 12 ],
            'rect',     [ 1, 3, 6, 3 ],
            'rect',     [ 3, 0, 2, 3 ],

            // Center pillar
            'rect',     [ 9, 11, 14, 7 ],
            'rect',     [ 12, 8, 8, 3 ],
            'rect',     [ 13, 7, 6, 1 ],
            'rect',     [ 14, 6, 4, 1 ],
            'rect',     [ 15, 5, 2, 1 ],

            // Right pillar
            'rect',     [ 24+0, 6, 8, 12 ],
            'rect',     [ 24+1, 3, 6, 3 ],
            'rect',     [ 24+3, 0, 2, 3 ],

            // Bottom
            'rect',     [ 0, 18, 32, 4 ],
        ]
    },
    invader: {
        width: 28,
        height: 31,
        shapes: [
            'color',    'white',

            'rect',     [ 13, 0, 2, 1 ],
            'rect',     [ 12, 1, 4, 1 ],
            'rect',     [ 11, 2, 6, 2 ],
            'rect',     [ 10, 4, 8, 2 ],
            'rect',     [ 9, 6, 10, 4 ],
            'rect',     [ 8, 10, 12, 2 ],
            'rect',     [ 7, 12, 14, 2 ],
            'rect',     [ 5, 14, 18, 1 ],
            'rect',     [ 4, 15, 20, 1 ],
            'rect',     [ 2, 16, 24, 2 ],
            'rect',     [ 0, 18, 28, 8 ],
            'rect',     [ 1, 26, 25, 1 ],
            'rect',     [ 1, 27, 7, 1 ],
            'rect',     [ 3, 28, 3, 2 ],
            'rect',     [ 19+1, 27, 7, 1 ],
            'rect',     [ 19+3, 28, 3, 2 ],
            'rect',     [ 9, 27, 11, 1 ],
            'rect',     [ 10, 28, 8, 2 ],
            'rect',     [ 12, 30, 4, 1 ],

            'color',    'black',

            'rect',     [ 13, 4, 2, 1 ],
            'rect',     [ 12, 5, 4, 2 ],
            'rect',     [ 11, 7, 6, 1 ],
        ]
    }
};

// An array of the different stages of the game. Each stage keeps a list of
// platoons, and platoons are defined by a starting position (which is
// supposed to be off the viewable area) and angle, and the row-by-row
// layout of the spaceship types.
var game_stages = [
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
];

// Miscellaneous helper functions
var Util = {
    // Given two classes, this makes the second class the parent of the first
    extend: function (self, parent) {
        self.prototype = new parent();
        self.prototype.constructor = self;
        self.parent = parent.prototype;
    },

    // Returns the second argument if the first is undefined
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

// Manages the game's screens and update/render loop
Game = (function () {
    // A mapping of the events to listen for and the function to call in the
    // screen when the event is triggered.
    var eventHandlers = {
        "click": "onClick",
        "mousedown": "onMouseDown",
        "mouseup": "onMouseUp",
        "mousemove": "onMouseMove",
        "keydown": "onKeyDown",
        "keyup": "onKeyUp",
        "keypress": "onKeyPress",
        "blur": "onBlur"
    };

    function Game(config) {
        this.config = config;

        this.screens = {};
        this.stages = [];
        this.curStage = 0;

        this.canvas = document.getElementById(config.canvas);
        this.ctx = this.canvas.getContext("2d");

        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.stars = generateStars(config.num_stars, this.width, this.height);
        this.sprites = {};

        // Player stats
        this.player = null;
        this.bullets = [];
        this.explosions = [];

        // Compute update rate
        this.fps = Util.default_arg(config.frames_per_second, 60);
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
                } else if (evname == "blur") {
                    // Don't let the canvas lose focus
                    this.canvas.focus();
                }
            }.bind(this, evname), false);
        }

        // Keeps track of keys that are currently down
        this.pressedKeys = {};

        // Focuses on the canvas
        this.canvas.setAttribute("tabindex", 0);
        this.canvas.focus();
    }

    // Generates (x, y) coordindates for the background stars as well as
    // an alpha value from 0.5 to 1
    function generateStars(numStars, width, height) {
        var stars = [];

        // star (x, y) & alpha value generation
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

    Game.prototype.addSprite = function (name, sprite) {
        this.sprites[name] = sprite;
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

    // This gets run on an interval timer. Updates and renders the screen.
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

    // A stage is just a special kind of screen that gets numbered
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

    // Set stage by stage number
    Game.prototype.setStage = function (idx) {
        this.setScreen(this.stages[idx]);
        this.curStage = idx;
    };

    // Go to the next stage. If no next stage then goes to gameover.
    Game.prototype.nextStage = function () {
        this.curStage++;
        if (this.curStage < this.stages.length) {
            this.setStage(this.curStage);
        } else {
            this.setScreen("gameover");
        }
    };

    // State that gets reset after each game
    Game.prototype.reset = function () {
        this.bullets = [];
        this.explosions = [];
        this.playerScore = 0;
        this.player.reset();
    };

    return Game;
})();

// A generic screen that clears background and renders only once.
Screen = (function () {
    function Screen(game) {
        this.game = game;
    }

    // Updates the screen's state given dt milliseconds passed since last frame.
    // Returns if the screen should redraw.
    Screen.prototype.update = function (dt) {
        if (this.wasRendered) {
            // By default don't redraw except first frame
            return false;
        } else {
            this.wasRendered = true;
            return true;
        }
    };

    // Clears the screen by filling it with black
    Screen.prototype.render = function(ctx) {
        ctx.fillStyle = this.game.config.background_color;
        ctx.fillRect(0, 0, this.game.width, this.game.height);
    };

    // Called before the screen gets switched to
    Screen.prototype.reset = function () {
        this.wasRendered = false;
    };

    return Screen;
})();

/**
 *  Game Start Menu
 */
Menu = (function () {
    function Menu() {
        Menu.parent.constructor.apply(this, arguments);
    }

    Util.extend(Menu, Screen);

    // Renders the menu screen
    Menu.prototype.render = function (ctx) {
        Menu.parent.render.call(this, ctx);

        // Title
        ctx.fillStyle = "white";
        ctx.font = "bold 40px Arial";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText("Canvas Invaders", this.game.width / 2, 70);

        // Game Options
        ctx.font = "bold 30px Arial";
        ctx.fillText("Start Game (s)", this.game.width / 2, 270);
        ctx.fillText("Instructions (i)", this.game.width / 2, 320);
    };

    // Handles keyboard presses
    Menu.prototype.onKeyPress = function(e) {
        // "s" starts the game
        if (String.fromCharCode(e.charCode) === "s") {
            this.game.reset();
            this.game.setStage(0);
        }
        // "i" goes to the instructions screen
        else if (String.fromCharCode(e.charCode) === "i") {
            this.game.setScreen("instructions");
        }
    };

    return Menu;
})();

/**
 *  Instructions Screen
 *  Tells users how to play the game, static screen
 */
Instructions = (function () {
    function Instructions() {
        Instructions.parent.constructor.apply(this, arguments);
    }

    Util.extend(Instructions, Screen);

    // Renders actual instructions to screen
    Instructions.prototype.render = function(ctx) {
        Instructions.parent.render.call(this, ctx);

        var half_width = this.game.width / 2;

        // Render header
        ctx.fillStyle = "white";
        ctx.font = "bold 40px Arial";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText("Instructions", half_width, 70);

        // Render actual instructions
        ctx.font = "25px Arial";
        ctx.fillText("Up Arrow - Move forward", half_width, 200);
        ctx.fillText("Down Arrow - Move backwards", half_width, 230);
        ctx.fillText("Left Arrow - Rotate counter-clockwise", half_width, 260);
        ctx.fillText("Right Arrow - Rotate clockwise", half_width, 290);
        ctx.fillText("Spacebar - Fire weapon", half_width, 320);

        ctx.fillText("Press 'b' to return to the menu screen", half_width, 550);

    }

    // Handle user keyboard input
    Instructions.prototype.onKeyPress = function(e) {
        // "b" will go back to menu
        if (String.fromCharCode(e.charCode) === "b") {
           this.game.setScreen("menu");
        }
    }

    return Instructions;

})();

/**
 *  High Scores screen
 *  Shows player's final score and  top 5 (or less) scores.
 *  Prompts player for name and adds a new entry to the high scores
 *  list if the player made it to the high scores.
 *  High scores are stored in a cookie that expires in 10 days
 */
HighScores = (function () {
    var maxNumScores = 5;  // number of stored high scores
    var highScoresKey = "high_scores"; // name of high scores cookie

    function HighScores() {
        HighScores.parent.constructor.apply(this, arguments);
    }

    Util.extend(HighScores, Screen);

    // Render high score contents and handles adding players to high scores
    HighScores.prototype.render = function (ctx) {
        HighScores.parent.render.call(this, ctx);

        ctx.fillStyle = "white";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        // Add player health to total score
        this.game.playerScore += this.game.player.health;

        // Only attempt to add player to high scores if score > 0
        if (this.game.playerScore > 0)
            updateHighScores(this.game.playerScore);

        this.renderHighScores(ctx);
    };

    // Takes player back to start menu w/ any keypress
    HighScores.prototype.onKeyDown = function (e) {
        this.game.setScreen("menu");
        e.preventDefault();
    };

    // Renders contents of high score screen
    HighScores.prototype.renderHighScores = function (ctx) {
        var highScores = getHighScores();

        var game = this.game;
        var half_width = game.width / 2;
        var half_height = game.height / 2;

        // Render win/lose results
        ctx.font = "bold 40px Arial";
        var endMsg;
        if (game.player.health === 0)
            endMsg = "You Lost!";
        else
            endMsg = "You Won!";

        ctx.fillText(endMsg, half_width, 50);

        // Render player score
        ctx.font = "bold 30px Arial";
        ctx.fillText("Your Score: " + game.playerScore, half_width, 190);

        // Render high scores list
        ctx.font = "bold 25px Arial";
        ctx.fillText("High Scores: ", half_width, half_height);

        ctx.font = "20px Arial";
        var fontHeight = half_height + 40;
        for (var i = highScores.length - 1; i >= 0; i--) {
            ctx.fillText(highScores[i].name + ": " + highScores[i].score,
                half_width, fontHeight);

            fontHeight += 25;
        }

        // Render user instructions
        ctx.font = "bold 25px Arial";
        ctx.fillText("Press any key to continue.", half_width, fontHeight + 50);
    }

    // Checks to see if player got new high score
    function checkHighScores(score) {
        var highScores = getHighScores();

        // # high scores < max. number of high scores
        if (highScores.length < maxNumScores)
            return true;

        // lowest high score < player score
        if (highScores[0].score < score)
            return true;

        return false;
    }

    // Insert new high score entry at right place in relation to other high
    // scores.
    // High score entries are in the form {name: n, score: s}
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

    // Update high scores by inserting (if necessary) player score,
    // updating the high scores list, and then writing this data out to a
    // cookie
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

    // Get list of all high scores by extracting from cookie
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

// Handles the actual gameplay. One stage instance per stage.
Stage = (function () {
    // Player Status bar offset
    var statusBarOffset = 15;

    function Stage(game, platoons) {
        Stage.parent.constructor.call(this, game);

        this.platoons = platoons;
    }

    Util.extend(Stage, Screen);

    Stage.prototype.detectCollisions = function () {
        var game = this.game;
        var player = game.player;

        // Player collision with wall
        if (player.state.x < player.radius)
            player.state.x = player.radius;
        if (player.state.y < player.radius+game.config.header_height)
            player.state.y = player.radius+game.config.header_height;
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

                game.explosions.push(new Explosion(this.game,
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
                    game.explosions.push(new Explosion(this.game,
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
                    game.explosions.push(new Explosion(this.game,
                        bullet.state.x,
                        bullet.state.y
                    ));
                }
            }

            // Remove out of bound bullet
            if (bullet.state.x < -bullet.radius
                    || bullet.state.y < -bullet.radius
                                                + game.config.header_height
                    || bullet.state.x > game.width+bullet.radius
                    || bullet.state.y > game.height+bullet.radius) {
                game.bullets.splice(i, 1);
                i--;
            }
        }
    };

    Stage.prototype.update = function (dt) {
        var game = this.game;

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
            game.setScreen("gameover");
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
        var game = this.game;

        var alpha = Math.max(0.75 - 0.01 / dt, 0);
        ctx.fillStyle = "rgba(0, 0, 0, " + alpha + ")";
        ctx.fillRect(0, 0, game.width, game.height);

        this.renderBg(ctx);

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

        this.renderStats(ctx);
    };

    // Renders background (stars)
    Stage.prototype.renderBg = function (ctx) {
        for (var i = 0; i < this.game.stars.length; i++) {
            var star = this.game.stars[i];
            ctx.fillStyle = "rgba(255, 255, 255," +  star.a + ")";
            ctx.fillRect(star.x, star.y, 5, 5);
        }
    }

    // Renders user data (score, lives, weapon)
    Stage.prototype.renderStats = function (ctx) {
        var game = this.game;

        // draw black cleared area for player stats
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, game.width, game.config.header_height);

        // text styling
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

        var livesOffset = game.width / 2 + 5 +
            ctx.measureText("Health:").width;
        ctx.fillText(game.player.health, livesOffset, 15);
    }

    // Handle user key down presses; initiates ship movement & rotation and
    // starting bullet fire
    Stage.prototype.onKeyDown = function (e) {
        var game = this.game;

        if (!game.pressedKeys[e.keyCode]) {
            switch (e.keyCode) {
            case 37: // left arrow
                game.player.state.vtheta += game.config.player_angvelocity;
                break;
            case 39: // right arrow
                game.player.state.vtheta -= game.config.player_angvelocity;
                break;
            case 38: // up arrow
                game.player.state.vel += game.config.player_velocity;
                break;
            case 40: // down arrow
                game.player.state.vel -= game.config.player_velocity;
                break;
            case 32: // space bar
                game.player.setShooting(true);
                break;
            }
        }
    };

    // Handles user key up presses; stops ship movement & rotation and
    // stopping bullet fire
    Stage.prototype.onKeyUp = function (e) {
        var game = this.game;

        switch (e.keyCode) {
        case 37: // left arrow
            game.player.state.vtheta -= game.config.player_angvelocity;
            break;
        case 39: // right arrow
            game.player.state.vtheta += game.config.player_angvelocity;
            break;
        case 38: // up arrow
            game.player.state.vel -= game.config.player_velocity;
            break;
        case 40: // down arrow
            game.player.state.vel += game.config.player_velocity;
            break;
        case 32: // space bar
            game.player.setShooting(false);
            break;
        }
    };

    // Sets stage to original state
    Stage.prototype.reset = function () {
        Stage.parent.reset.call(this);

        for (var i = 0; i < this.platoons.length; i++) {
            this.platoons[i].reset();
        }
    };

    return Stage;
})();

/**
 *  Game over screen
 *  Shown to player when he/she wins or loses. Stays on for 3s before
 *  showing the high scores screen
 */
GameOverScreen = (function () {
    function GameOverScreen() {
        GameOverScreen.parent.constructor.apply(this, arguments);
    }

    Util.extend(GameOverScreen, Screen);

    // Renders the game over screen
    GameOverScreen.prototype.render = function (ctx) {
        var game = this.game;

        // black overlay
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, game.config.header_height, game.width,
            game.height - game.config.header_height);

        // text
        ctx.fillStyle = "white";
        ctx.font = "bold 40px Arial";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        ctx.fillText("Game Over", game.width / 2, game.height / 2);

        // go to high scores screen after 3s
        setTimeout(function () {
            game.setScreen("highscores");
        }, 3000);
    };

    return GameOverScreen;
})();

/****************
 * OBJECT LOGIC *
 ****************/

/**
 *  Generic class for all physical entities in the game
 */
Object = (function () {
    function Object(game, sprite_id, config) {
        if (!(game instanceof Game)) return;

        this.game = game;

        config = Util.default_arg(config, {});

        // Stores the position, rotation, velocity state
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

    // Draw the sprite if it has one
    Object.prototype.render = function (ctx) {
        if (this.sprite) {
            ctx.save();
            ctx.translate(this.state.x, this.state.y);
            ctx.rotate(-this.state.theta + Math.PI / 2);
            ctx.translate(-this.width/2, -this.height/2)
            this.sprite.render(ctx);
            ctx.restore();
        }
    };

    // The default update function simply updates the position and rotation
    Object.prototype.update = function (dt) {
        this.state.x += dt * this.state.vel * Math.cos(this.state.theta);
        this.state.y -= dt * this.state.vel * Math.sin(this.state.theta);
        this.state.theta += dt * this.state.vtheta;
    };

    // Used to reset the object before it gets used
    Object.prototype.reset = function () { /* Do nothing */ };

    // Simple collision detection that checks if the bounding circles intersect
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

/**
 *  Bullet
 *  Class for the bullets that are shot by all spaceships
 */
Bullet = (function () {
    function Bullet(game, origin, x, y, vel, theta) {
        this.origin = origin;

        Bullet.parent.constructor.call(this, game, "bullet", {
            x: x,
            y: y,
            vel: vel,
            theta: theta
        });
    }

    Util.extend(Bullet, Object);

    return Bullet;
})();

/**
 *  Spaceship
 *  Class for all spaceships in the game.
 */
SpaceShip = (function () {
    function SpaceShip() {
        SpaceShip.parent.constructor.apply(this, arguments);

        this.fullHealth = 100;
        this.lastShot = 0;

        this.reset();
    }

    Util.extend(SpaceShip, Object);

    // Only spending time updating the ship if it has health
    SpaceShip.prototype.update = function () {
        if (this.health > 0) {
            SpaceShip.parent.update.apply(this, arguments);
        }
    };

    // Only shows a spaceship if it has health
    SpaceShip.prototype.render = function () {
        if (this.health > 0) {
            SpaceShip.parent.render.apply(this, arguments);
        }
    };

    // Generates a new bullet in the position and direction of the ship
    SpaceShip.prototype.fireBullet = function (curTime) {
        var game = this.game;

        // Bullet fires slightly in the direction of the ship
        var bx = (this.height / 2) * Math.cos(this.state.theta) + this.state.x;
        var by = -(this.height / 2) * Math.sin(this.state.theta) + this.state.y;
        var bvel = game.config.bullet_velocity;
        var btheta = this.state.theta;

        game.bullets.push(new Bullet(game, this, bx, by, bvel, btheta));

        if (!curTime) curTime = (new Date()).getTime();
        this.lastShot = curTime;
    };

    SpaceShip.prototype.reset = function () {
        SpaceShip.parent.reset.call(this);

        this.health = this.fullHealth;
    };

    return SpaceShip;
})();

/**
 *  PlayerShip
 */
PlayerShip = (function () {
    function PlayerShip(game) {
        PlayerShip.parent.constructor.call(this, game, "player");
    }

    Util.extend(PlayerShip, SpaceShip);

    PlayerShip.prototype.update = function (dt) {
        PlayerShip.parent.update.call(this, dt);

        // Shoot when in shooting mode (i.e. space bar is pressed)
        var curTime = (new Date()).getTime();
        if (this.isShooting && curTime-this.lastShot >
                this.game.config.shooting_delay) {
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

// An object that is a wrapper for a set of enemy spaceships.
Platoon = (function () {
    // How much space to put between the ships
    // (x,y) is the center of the platoon
    function Platoon(game, x, y, theta, layout, spacing) {
        this.start = {
            x: x,
            y: y,
            theta: theta
        };
        Platoon.parent.constructor.call(this, game, "", this.start);

        this.spacing = Util.default_arg(spacing, 10);

        this.ships = [];
        for (var i = 0; i < layout.length; i++) {
            var row = [];
            for (var j = 0; j < layout[i].length; j++) {
                row.push(new SpaceShip(game, layout[i][j]));
            }
            this.ships.push(row);
        }

        this.computeOffsets();
    }

    Util.extend(Platoon, Object);

    // Draw all the spaceships
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

    // The platoon as well as the individual spaceship orients themselves
    // towards the player
    Platoon.prototype.update = function (dt) {
        var state = this.state;
        var game = this.game;
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
            this.state.vtheta = game.config.platoon_angvelocity;
        } else if (dtheta > 0.01) {
            this.state.vtheta = -game.config.platoon_angvelocity;
        } else {
            this.state.vtheta = 0;
        }

        if (vecToPlayer.dist > this.height / 2 + 2 * player.radius) {
            this.state.vel = game.config.platoon_velocity * direction;
        } else if (vecToPlayer.dist < this.height / 2 + player.radius) {
            this.state.vel = -game.config.platoon_velocity * direction;
        } else {
            this.state.vel = 0;
        }

        Platoon.parent.update.call(this, dt);

        // update position of each ship in platoon
        for (var i = 0; i < this.ships.length; i++) {
            for (var j = 0; j < this.ships[i].length; j++) {
                var ship = this.ships[i][j];
                var offsetx = ship.state.offsetx;
                var offsety = ship.state.offsety;

                if (ship.health > 0) {
                    var ang = Math.atan2(offsety, offsetx) + Math.PI / 2;
                    var mag = Math.sqrt(offsetx * offsetx + offsety * offsety);
                    ship.state.x = state.x + mag * Math.cos(ang + state.theta);
                    ship.state.y = state.y - mag * Math.sin(ang + state.theta);

                    vecToPlayer = getVectorToPlayer(ship.state.x, ship.state.y,
                                            player.state.x, player.state.y);
                    ship.state.theta = vecToPlayer.theta;

                    // Check if the ship is visible
                    if (ship.state.x > 0
                            && ship.state.y > game.config.header_height
                            && ship.state.x < game.width
                            && ship.state.y < game.height) {
                        // Some percent chance of firing again after a delay
                        var curTime = (new Date()).getTime();
                        if (curTime-ship.lastShot > game.config.shooting_delay
                                && Math.random() <
                                        game.config.platoon_shooting_chance) {
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

    // Precompute the offset from the center for all the spaceships
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

    // Check collision with each of the ships
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

    // Counts how many ships are still alive
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

// An object that shows an explosion animation
Explosion = (function () {
    function Explosion(game, x, y) {
        Explosion.parent.constructor.call(this, game, "", {x:x, y:y});
        this.stage = 0;
    }

    Util.extend(Explosion, Object);

    Explosion.prototype.update = function (dt) {
        this.stage += dt * 4;
    };

    // Show a growing but fading donut
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

// Manages drawing a sprite given a list of operations
Sprite = (function () {
    function Sprite(config) {
        this.width = config.width;
        this.height = config.height;
        this.shapes = config.shapes; // List of drawing operations
    }

    Sprite.prototype.render = function (ctx) {
        for (var i = 0; i < this.shapes.length; i += 2) {
            var type = this.shapes[i];
            var params = this.shapes[i+1];

            switch (type) {
            case "color":
                ctx.fillStyle = params;
                break;
            case "rect":
                ctx.fillRect.apply(ctx, params);
                break;
            case "arc":
                ctx.beginPath();
                ctx.arc.apply(ctx, params);
                ctx.fill();
                break;
            }
        }
    };

    return Sprite;
})();

/*********
 * SETUP *
 *********/

// Expose a global game variable for debugging purposes
var game_instance;

function init() {
    game_instance = new Game(game_config, 60);

    // Add the sprites to the game
    for (var name in game_sprites) {
        var sprite = game_sprites[name];
        game_instance.addSprite(name, new Sprite(sprite));
    }

    // Create a player ship for the game
    game_instance.player = new PlayerShip(game_instance);

    // Add the static screens
    game_instance.addScreen("menu", new Menu(game_instance));
    game_instance.addScreen("instructions", new Instructions(game_instance));
    game_instance.addScreen("highscores", new HighScores(game_instance));
    game_instance.addScreen("gameover", new GameOverScreen(game_instance));

    // Create and add the platoons and stages
    game_stages.forEach(function (stage_config) {
        var platoons = [];
        stage_config.platoons.forEach(function (platoon_config) {
            platoons.push(
                new Platoon(game_instance,
                    platoon_config.x,
                    platoon_config.y,
                    platoon_config.theta,
                    platoon_config.layout
                )
            );
        });
        game_instance.addStage(new Stage(game_instance, platoons));
    });

    // Start the game on the menu screen
    game_instance.start("menu");
}

window.onload = init;
