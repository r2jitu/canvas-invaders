Canvas Invaders
===============

By Jitu Das (cdas) & Bertha Lam (chingwal)  
CMU 15-237 Cross-platform Mobile Web Apps, Fall 2012

How To Play
-----------




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
