Canvas Invaders
===============

By Jitu Das (cdas) & Bertha Lam (chingwal)  
CMU 15-237 Cross-platform Mobile Web Apps, Fall 2012

How To Play
-----------

This game is a 2D shooter. You control a spaceship that can shoot bullets,
rotate left and right, and move forwards and backwards. To shoot bullets, 
press/hold down the spacebar key. To rotate left or right, hold down the left
or right arrow key respectively. To move forwards or backwards, hold down the up
or down arrow key respectively.

You start off with 100 health. If you get hit by a bullet, you lose 5 health,
and if you crash into an enemy spaceship, you lose 25 health. 

For every enemy spaceship that you kill, your score goes up by 5 points. Your 
final score is the points you gain from killing enemy ships plus any remaining 
health you have.

There is a high scores table that stores the top 5 scores in a cookie, and 
users can input their name for their high score entries.


Design Overview
---------------

When the page is loaded, we create a new instance of the Game class and attach
the appropriate screen objects. The screen objects are responsible for rendering
and handling interaction for different parts of the game. We read in the
configuration for each of the game levels from an array at the top of the
javascript file and then generate a screen for each one. Then we start the game.

The Game class has a main loop which is run 60 times per second using an
interval timer. The main loop asks the screen to update, and if the screen
indicates that it wishes to be rendered then it calls the render function. The
screens can listen for events and ask the game to change screens.

The Stage class is a screen that is responsible for gameplay. It renders the
spaceships, bullets, explosions, score, health, etc. It also listens for key
events and handles interactions accordingly.

Inheritance is used throughout our program to minimize duplicated code. There is
a Screen class which gets extended to the different screens like Menu, Stage,
and Instructions. There is also an Object class that gets extended into Bullet
and SpaceShip. The SpaceShip is further extended into the Player class. Object
has functions such as drawing the sprite associated with the object and common
collision detection code. The SpaceShip class adds health and a shooting delay
since these are common to the player as well as enemy ships.
