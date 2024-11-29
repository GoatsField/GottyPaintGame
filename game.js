// Import the MainMenu class
import UserName from './userName.js';
import GameOver from './gameOver.js';
import MainMenu from './mainMenu.js';

let player;
let bullets;
let enemies;
let enemyBullets;
let enemyBulletCount = 100;
let cursors;
let score = 0;
let scoreText;
let health = 3;  // Player starts with 3 health
let bulletCount = 200;
let maxBullets = 200;
let bulletCountText;
let lastFired = 0;
let infiniteAmmoActive = false;
let infiniteAmmoTimer = null;
let inventory = [];  // Store collected power-ups in the inventory
let spawningEnabled = true;
let invulnerable = false;
const INVULNERABILITY_DURATION = 3000;  // Duration in ms
let pausedText;
let isPaused = false;
let dropProbability = 1;  // Start with high chance (100%)
const dropDecayRate = 0.05; // Decay rate for drop probability after each enemy defeat

class Game extends Phaser.Scene{
    constructor() {
        super({ key: 'Game' });  // The key for this scene
    }

    // Preload assets
    preload() {
        this.load.spritesheet('player', 'assets/images/gotty.png', { frameWidth: 70, frameHeight: 71 });
        this.load.json('playerFrames', 'assets/json/gotty.json');  // Load the JSON for frames
        this.load.spritesheet('bullet', 'assets/images/bullet.png', { frameWidth: 150, frameHeight: 80});
        this.load.json('bulletFrames', 'assets/json/bullet.json');
        this.load.spritesheet('enemy', 'assets/images/enemy.png', { frameWidth: 70, frameHeight: 71 }); // Enemy sprite
        this.load.json('enemyFrames', 'assets/json/enemy.json');
        this.load.spritesheet('enemyBullet', 'assets/images/bulletEnemy.png', { frameWidth: 150, frameHeight: 80});
        this.load.json('enemyBulletFrames', 'assets/json/bulletEnemy.json');
        this.load.image('ammo', 'assets/images/ammo.png'); // Ammo sprite
        this.load.image('infiniteAmmo', 'assets/images/infiniteAmmo.png'); // Infinite ammo power-up sprite
        this.load.image('paintfield', 'assets/images/background.jpg');
        this.load.image('powerBox', 'assets/images/itembox.png');
        this.load.image('lowhealth', 'assets/images/redball.png');
        this.load.image('halfhealth', 'assets/images/blueball.png');
        this.load.image('fullhealth', 'assets/images/greenball.png');
        this.load.image('damageTaken', 'assets/images/grayball.png');
        //this.load.image('car', 'assets/images/ob/car.png');
        this.load.image('smallBlueWall', 'assets/images/ob/obstacle01.png');
        this.load.image('wallsAndTire', 'assets/images/ob/obstacle02.png');
        this.load.image('tires', 'assets/images/ob/obstacle03.png');
        this.load.image('singleTire', 'assets/images/ob/obstacle04.png');
        this.load.image('anotherTire', 'assets/images/ob/obstacle05.png');
        this.load.audio('mainTheme', 'assets/audio/paint them.mp3'); //Main Theme
        this.load.audio('pewpew', 'assets/audio/shoot.mp3'); //paint gun when pressing arrow keys, also applies to enemies
        this.load.audio('ouch', 'assets/audio/hurt.mp3'); //plays when the player gets hit
        this.load.audio('painted', 'assets/audio/hit.mp3'); //plays when the player hits an enemy
    }

    // Create the game objects
    create() {
        this.resetGameStats();
        
        // Create health display images
        this.fullHealthImage = this.add.image(90, 30, 'fullhealth').setOrigin(0, 0).setDisplaySize(32, 32);
        this.halfHealthImage = this.add.image(50, 30, 'halfhealth').setOrigin(0, 0).setDisplaySize(32, 32);
        this.lowHealthImage = this.add.image(10, 30, 'lowhealth').setOrigin(0, 0).setDisplaySize(32, 32);
        this.fullHealthImage.setDepth(10);  // Ensure the item box is in front
        this.halfHealthImage.setDepth(11);  // Ensure the icon is in front of the item box
        this.lowHealthImage.setDepth(12);

        // Create item box in the top-left corner
        const itemBoxX = 10;  // X position for the item box
        const itemBoxY = 50;  // Y position for the item box

        // Create the item box (set its size)
        this.itemBox = this.add.image(itemBoxX, itemBoxY, 'powerBox').setOrigin(-1, 0.5).setDisplaySize(100, 100);
        this.itemBox.setVisible(true); // Ensure it's always visible

        // Create the infinite ammo image inside the item box (initially hidden)
        this.infiniteAmmoIcon = this.add.image(itemBoxX + 25, itemBoxY + 25, 'infiniteAmmo').setOrigin(-2.55, 1.3).setScale(0.9);
        this.infiniteAmmoIcon.setVisible(false); // Hide it initially

        this.itemBox.setDepth(10);  // Ensure the item box is in front
        this.infiniteAmmoIcon.setDepth(11);  // Ensure the icon is in front of the item box

        this.paintfield = this.add.image(0,0, 'paintfield').setOrigin(0, 0);
        this.paintfield.setDisplaySize(800,600)

        player = this.physics.add.sprite(450, 300, 'player').setCollideWorldBounds(true);
        player.body.setSize(32, 48); // Adjust to match your sprite size

        player.setTint(0xffffff);  // Ensure no tint initially (not invulnerable)
        
        // Define animations using the frames from the loaded JSON data
        const playerFrames = this.cache.json.get('playerFrames');

        // Define animations
            this.anims.create({
                key: 'idle',
                frames: this.anims.generateFrameNumbers('player', { start: 1, end: 3 }), // Update frame range
                frameRate: 8,
                repeat: -1
            });

            this.anims.create({
                key: 'walkleft',
                frames: this.anims.generateFrameNumbers('player', { start: 6, end: 11 }), // Update frame range
                frameRate: 10,
                repeat: -1
            });

            this.anims.create({
                key: 'walkright',
                frames: this.anims.generateFrameNumbers('player', { start: 12, end: 17 }), // Update frame range
                frameRate: 10,
                repeat: -1
            });

            this.anims.create({
                key: 'hit',
                frames: this.anims.generateFrameNumbers('player', { start: 18, end: 21 }), // Update frame range
                frameRate: 4,
                repeat: 0
            });
            
            //enemyAnimations
            this.anims.create({
                key: 'enemyIdle',
                frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
            
            this.anims.create({
                key: 'enemyWalkLeft',
                frames: this.anims.generateFrameNumbers('enemy', { start: 6, end: 11 }),
                frameRate: 10,
                repeat: -1
            });
            
            this.anims.create({
                key: 'enemyWalkRight',
                frames: this.anims.generateFrameNumbers('enemy', { start: 12, end: 17 }),
                frameRate: 10,
                repeat: -1
            });
            
            this.anims.create({
                key: 'defeat',
                frames: this.anims.generateFrameNumbers('enemy', { start: 18, end: 21 }),
                frameRate: 10,
                repeat: 0
            });
            
            // Create bullet animation (the flying bullet)
            this.anims.create({
                key: 'bullet',  // Animation for bullet flying
                frames: this.anims.generateFrameNumbers('bullet', { start: 0, end: 0 }),  // Frame 0 for flying
                frameRate: 10,  // Frame rate for animation
                repeat: -1  // Repeat indefinitely
            });

            // Create bullet hit animation (when the bullet hits an enemy)
            this.anims.create({
                key: 'bulletHit',  // Animation for bullet hit
                frames: this.anims.generateFrameNumbers('bullet', { start: 1, end: 1 }),  // Frame 1 for hit
                frameRate: 10,  // Frame rate for animation
                repeat: 0  // Only play this animation once
            });

            // Create enemy bullet animation (the flying bullet)
            this.anims.create({
                key: 'enemyBullet',  // Animation for bullet flying
                frames: this.anims.generateFrameNumbers('enemyBullet', { start: 0, end: 0 }),  // Frame 0 for flying
                frameRate: 10,  // Frame rate for animation
                repeat: -1  // Repeat indefinitely
            });

            // Create bullet hit animation (when the bullet hits an enemy)
            this.anims.create({
                key: 'enemyBulletHit',  // Animation for bullet hit
                frames: this.anims.generateFrameNumbers('enemyBullet', { start: 1, end: 1 }),  // Frame 1 for hit
                frameRate: 10,  // Frame rate for animation
                repeat: 0  // Only play this animation once
            });


        // Set default animation (idle)
        player.anims.play('idle');


        //bg music
        this.sound.play('mainTheme', {
            loop: true, // Set the music to loop indefinitely
            volume: 0.5  // Adjust volume if necessary
        });

        // Create bullets group
        bullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: maxBullets // Set max size of the bullet group
        });

        // Create enemies group
        enemies = this.physics.add.group();

        // Create enemy bullets group
        enemyBullets = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: enemyBulletCount
        });

        // Add collision detection between enemy bullets and player
        this.physics.add.collider(enemyBullets, player, hitPlayer, null, this);

        // Create cursors for shooting and movement
        cursors = this.input.keyboard.createCursorKeys(); // Arrow keys for shooting
        this.input.keyboard.addKeys('W, A, S, D'); // W, A, S, D for movement
        this.input.keyboard.on('keydown-P', () => togglePause(this)); // P for pause

        // Display score
        scoreText = this.add.text(10, 10, 'Score: 0', {
            font: '16px Arial',
            fill: '#ffffff'
        });

        // Display bullet count
        bulletCountText = this.add.text(650, 10, 'Bullets: ' + bulletCount, {
            font: '16px Arial',
            fill: '#ffffff'
        });

        // Set up enemy spawning
        this.time.addEvent({
            delay: 1500,
            callback: spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // Bullet and enemy collision detection
        this.physics.add.collider(bullets, enemies, hitEnemy, null, this);
        this.physics.add.collider(player, enemies, hitPlayer, null, this);
        this.physics.add.collider(enemyBullets, player, hitPlayer, null, this);

        // Enemy shoot timer setup
        this.time.addEvent({
            delay: 1500,  // Enemy will try to shoot every 1000 ms (1 second)
            callback: enemyShoot,
            callbackScope: this,
            loop: true
        });
        pausedText = this.add.text(400, 300, 'PAUSE', {
            fontSize: '48px',
            color: '#FFF',
        }).setOrigin(0.5, 0.5).setDepth(1).setVisible(false);

        /*
        const car = this.physics.add.image(Phaser.Math.Between(50, 750), Phaser.Math.Between(50, 550), 'car');
        car.setCollideWorldBounds(true);
        car.body.setSize(30,50);
        car.setImmovable(true);
        */
        // Add obstacles (obstacle01 to obstacle05) at random positions
        const obstacles = [];
        obstacles.push(this.physics.add.image(Phaser.Math.Between(50, 750), Phaser.Math.Between(50, 550), 'smallBlueWall'));
        obstacles.push(this.physics.add.image(Phaser.Math.Between(50, 750), Phaser.Math.Between(50, 550), 'wallsAndTire'));
        obstacles.push(this.physics.add.image(Phaser.Math.Between(50, 750), Phaser.Math.Between(50, 550), 'tires'));
        obstacles.push(this.physics.add.image(Phaser.Math.Between(50, 750), Phaser.Math.Between(50, 550), 'singleTire'));
        obstacles.push(this.physics.add.image(Phaser.Math.Between(50, 750), Phaser.Math.Between(50, 550), 'anotherTire'));
    
        obstacles.forEach(obstacle => {
            // Set the physics body to collide with the world bounds
            obstacle.setCollideWorldBounds(true);
            
            // Make the obstacle immovable (it won't move on collisions)
            obstacle.setImmovable(true);
            
            // Set the size of the physics body (hitbox), but keep the visual scale of the sprite
            obstacle.body.setSize(20, 30);  // Set the size of the physics body (hitbox)
            
            // If you want the sprite to be visually larger but keep the hitbox the same, 
            // use setScale without affecting the collision size
            obstacle.setScale(1);  // This will scale the sprite visually but not affect the physics body
        });
        
    
        // Handle collisions
        // Collisions for obstacle01 and obstacle02 (with player, enemies, enemy bullets, and bullets)
        this.physics.add.collider(player, obstacles[0], hitObstacle, null, this);
        this.physics.add.collider(player, obstacles[1], hitObstacle, null, this);
        this.physics.add.collider(enemies, obstacles[0], hitObstacle, null, this);
        this.physics.add.collider(enemies, obstacles[1], hitObstacle, null, this);
    
        // Collisions for obstacle03 to obstacle05 (with player and enemies, but not with bullets)
        this.physics.add.collider(player, obstacles[2], hitObstacle, null, this);
        this.physics.add.collider(player, obstacles[3], hitObstacle, null, this);
        this.physics.add.collider(player, obstacles[4], hitObstacle, null, this);
    
        this.physics.add.collider(enemies, obstacles[2], hitObstacle, null, this);
        this.physics.add.collider(enemies, obstacles[3], hitObstacle, null, this);
        this.physics.add.collider(enemies, obstacles[4], hitObstacle, null, this);
        /*
        // Car collision with player, enemies, and enemy bullets (for example)
        this.physics.add.collider(player, car, hitObstacle, null, this);
        this.physics.add.collider(enemies, car, hitObstacle, null, this);
        this.physics.add.collider(enemyBullets, car, hitObstacle, null, this);
        */
    }

    // Update loop
    update(time, delta) {
        if (isPaused){
            return;
        }

         // Handle player movement
        const velocity = 200; // Movement speed

        // Reset player velocity
        player.setVelocity(0);

        if (this.input.keyboard.checkDown(this.input.keyboard.addKey('A'))) {
            player.setVelocityX(-velocity); // Move left
            player.anims.play('walkright', true);
        } else if (this.input.keyboard.checkDown(this.input.keyboard.addKey('D'))) {
            player.setVelocityX(velocity); // Move right
            player.anims.play('walkleft', true);
        } 

        if (this.input.keyboard.checkDown(this.input.keyboard.addKey('W'))) {
            player.setVelocityY(-velocity); // Move up
        } else if (this.input.keyboard.checkDown(this.input.keyboard.addKey('S'))) {
            player.setVelocityY(velocity); // Move down
        }

        // If no movement keys are pressed, play the idle animation
        if (player.body.velocity.x === 0 && player.body.velocity.y === 0) {
            player.anims.play('idle', true);
        }


        // Only allow shooting in one direction at a time, and respect cooldown
        if ((infiniteAmmoActive || bulletCount > 0) && time > lastFired + 300) {  // 300ms delay between shots
            if (cursors.up.isDown) {
                shootBullet(0, -1); // Shoot upwards
                lastFired = time;
            } else if (cursors.down.isDown) {
                shootBullet(0, 1); // Shoot downwards
                lastFired = time;
            } else if (cursors.left.isDown) {
                shootBullet(-1, 0); // Shoot left
                lastFired = time;
            } else if (cursors.right.isDown) {
                shootBullet(1, 0); // Shoot right
                lastFired = time;
            }
        }   

        // Make enemies follow the player
        enemies.getChildren().forEach(enemy => {
            // Calculate the angle towards the player
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);

            // Set the velocity of the enemy to move towards the player
            const speed = 80; // Adjust the speed as needed
            enemy.setVelocity(
                Math.cos(angle) * speed, // Set velocity in the X direction
                Math.sin(angle) * speed  // Set velocity in the Y direction
            );
        });

        // Spacebar activation to use infinite ammo if available
        if (this.input.keyboard.checkDown(this.input.keyboard.addKey('SPACE'))) {
            activatePowerUp.call(this);
        }

        if (invulnerable) {
            this.tweens.killTweensOf(player);  // Kill existing tweens for flicker
            this.tweens.add({
                targets: player,
                alpha: { from: 1, to: 0.5 },
                duration: 200,
                yoyo: true,
                repeat: -1
            });
        }      
        
    }
    resetGameStats() {
        // Reset all player-related stats
        score = 0;
        health = 3;  // Reset health to 3
        bulletCount = 200;
        inventory = [];  // Clear inventory
        infiniteAmmoActive = false;  // Ensure infinite ammo is off
        invulnerable = false;  // Remove invulnerability status
    }
}

function hitObstacle(obj1, obj2) {
    // Check if obj1 or obj2 is the player or enemy
    if (obj1 === player || obj2 === player) {
        console.log("Player hit an obstacle!");
        // Add logic to handle player collision with obstacles (e.g., stop movement, take damage, etc.)
    } else if (obj1 === enemies || obj2 === enemies) {
        console.log("Enemy hit an obstacle!");
        // Add logic for enemy collision with obstacles (e.g., stop movement, take damage, etc.)
    }
}


    function togglePause(scene){
        isPaused = !isPaused;
        if(isPaused){
            scene.physics.world.pause();
            pausedText.setVisible(true);
            enemies.getChildren().forEach(enemy => enemy.setVelocity(0)); // Pause enemy movement
        } else {
            scene.physics.world.resume();
            pausedText.setVisible(false);
        }
    }

    // Shoot bullet in a specific direction
    function shootBullet(velocityX, velocityY) {
        if (bulletCount <= 0 && !infiniteAmmoActive) {
            return;  // Don't shoot if no bullets are left and infinite ammo isn't active
        }
        // Get a bullet from the group
        const bullet = bullets.get(player.x, player.y);
        // When bullet is fired, play the 'bullet' animation
        bullet.anims.play('bullet', true);
        if (bullet) {
            bullet.body.setSize(0.3);
            bullet.setScale(0.3);
            bullet.setVelocityX(velocityX * 400); 
            bullet.setVelocityY(velocityY * 400); 

            // If not using infinite ammo, decrease bullet count
            if (!infiniteAmmoActive) {
                bulletCount--; 
                bulletCountText.setText('Bullets: ' + bulletCount); // Update bullet count display
            }
        }
    }

    // Enemy shoot function
    function enemyShoot() {
        enemies.getChildren().forEach(enemy => {
            // Check if the enemy is alive and can shoot
            if (enemy.active) {
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);  // Get the angle towards the player
                shootEnemyBullet(enemy.x, enemy.y, angle);  // Shoot the enemy bullet towards the player
            }
        });
    }

    // Function to shoot enemy bullets towards the player
    function shootEnemyBullet(x, y, angle) {
        // Get an enemy bullet from the group
        const enemyBullet = enemyBullets.get(x, y);
        enemyBullet.anims.play('enemyBullet', true)

        if (enemyBullet) {
            enemyBullet.setActive(true).setVisible(true);
            enemyBullet.body.setSize(0.3);
            enemyBullet.setScale(0.3);  // Keep the enemy bullets the same size as player bullets
            enemyBullet.setVelocity(
                Math.cos(angle) * 200, // Set bullet velocity in X direction (lower speed)
                Math.sin(angle) * 200  // Set bullet velocity in Y direction (lower speed)
            );
        }
    }

    // Function to drop infinite ammo power-up at the enemy's position
function dropInfiniteAmmo(x, y) {
    const infiniteAmmo = this.physics.add.image(x, y, 'infiniteAmmo');
    infiniteAmmo.body.setSize(32, 32);
    infiniteAmmo.setPosition(x + Phaser.Math.Between(-50, 50), y + Phaser.Math.Between(-50, 50)); // Slightly offset the infinite ammo position
    infiniteAmmo.setVelocity(0); // No movement, stays at the spawn position

    // Add flicker effect: makes the power-up flicker between yellow and original color
    this.tweens.add({
        targets: infiniteAmmo,
        alpha: { from: 1, to: 0.2 },
        ease: 'Sine.easeInOut',
        duration: 500,
        yoyo: true,
        repeat: -1 // Make the flicker loop indefinitely
    });

    // Add collision or overlap with player to collect infinite ammo
    this.physics.add.overlap(player, infiniteAmmo, collectInfiniteAmmo, null, this);
}
    // Function to handle infinite ammo collection
    function collectInfiniteAmmo(player, infiniteAmmo) {
        infiniteAmmo.destroy(); // Remove infinite ammo when collected
    
        // Add infinite ammo to the inventory
        inventory.push('infiniteAmmo');
    
        // Show the infinite ammo icon inside the item box
        this.infiniteAmmoIcon.setVisible(true); // Make the icon visible
    }    

    // Function to drop ammo at the enemy's position
    function dropAmmo(x, y) {
        const ammo = this.physics.add.image(x, y, 'ammo');
        ammo.body.setSize(32,32)
        ammo.setPosition(x + Phaser.Math.Between(-50, 50), y + Phaser.Math.Between(-50, 50)); // Slightly offset the ammo position

        // Remove the velocity to keep the ammo stationary
        ammo.setVelocity(0); // No movement, stays at the spawn position

        // Add collision or overlap with player to collect ammo
        this.physics.add.overlap(player, ammo, collectAmmo, null, this);
    }

    // Function to handle ammo collection
    function collectAmmo(player, ammo) {
        ammo.destroy(); // Remove ammo when collected
        bulletCount = Math.min(bulletCount + 10, maxBullets); // Add bullets (without exceeding max)
        bulletCountText.setText('Bullets: ' + bulletCount); // Update bullet count display
    }
// Function to activate power-up when space is pressed
function activatePowerUp() {
    // Check if the player has infinite ammo in inventory
    if (inventory.includes('infiniteAmmo') && !infiniteAmmoActive) {
        infiniteAmmoActive = true;
        bulletCountText.setText('Bullets: Infinite');
    
        // Remove the infinite ammo from inventory
        inventory = inventory.filter(item => item !== 'infiniteAmmo');
    
        // Hide the infinite ammo icon inside the item box when it is used
        this.infiniteAmmoIcon.setVisible(false); // Hide the icon

        // Automatically deactivate infinite ammo after 10 seconds
        if (infiniteAmmoTimer) {
            clearTimeout(infiniteAmmoTimer); // Clear any existing timer
        }
    
        infiniteAmmoTimer = setTimeout(() => {
            infiniteAmmoActive = false;
            bulletCountText.setText('Bullets: ' + bulletCount);
        }, 10000); // 10 seconds of infinite ammo
    }
} 

function hitPlayer(player, enemyBullet) {
    // If the player is invulnerable or is currently playing the hit animation, ignore damage
    if (invulnerable || player.anims.isPlaying && player.anims.currentAnim.key === 'hit') {
        return;
    }

    // Start hit animation
    player.anims.play('hit', true);

    // Apply damage to health
    health -= 1;

    // Update health images based on current health
    if (health === 2) {
        // Full health -> damage taken
        this.fullHealthImage.setTexture('damageTaken');
    } else if (health === 1) {
        // Half health -> damage taken
        this.halfHealthImage.setTexture('damageTaken');
    } else if (health === 0) {
        // Low health -> damage taken
        this.lowHealthImage.setTexture('damageTaken');
    }

    // Check if health has reached 0 (game over)
    if (health <= 0) {
        player.setTint(0xff0000);  // Flash red to indicate damage
        this.physics.pause();  // Stop the game physics

        // Stop the background music before transitioning to GameOver
        let mainThemeSound = this.sound.get('mainTheme');
        if (mainThemeSound) {
            mainThemeSound.stop();  // Stop the main theme music
        }

        // Transition to the GameOver scene after a delay (for effect)
        this.time.delayedCall(1000, () => {
            // Pass the score to the GameOver scene via the 'data' object
            this.scene.start('GameOver', { score: score, from: 'Game' });
        });
        return;
    }

    // Flash red for a short period when hit
    player.setTint(0xff0000);
    this.time.delayedCall(200, () => {
        player.clearTint();
    });

    // Set up invulnerability timeout (3 seconds)
    this.time.delayedCall(INVULNERABILITY_DURATION, () => {
        invulnerable = false;
        player.setAlpha(1);
    });

    enemyBullet.destroy();
}

// Spawn enemies from random directions
function spawnEnemy() {
    if (!spawningEnabled) {
        return;  // Skip spawning if it's disabled
    }

    const direction = Phaser.Math.Between(0, 3); // Randomly choose between 0 (top), 1 (bottom), 2 (left), 3 (right)

    let x, y, velocityX = 0, velocityY = 0;

    switch (direction) {
        case 0: // Spawn from top
            x = Phaser.Math.Between(375, 400);
            y = 0;
            break;
        case 1: // Spawn from bottom
            x = Phaser.Math.Between(375, 400);
            y = 600;
            break;
        case 2: // Spawn from left
            x = 0;
            y = Phaser.Math.Between(275, 300);
            break;
        case 3: // Spawn from right
            x = 800;
            y = Phaser.Math.Between(275, 300);
            break;
    }

    const enemy = enemies.create(x, y, 'enemy');
    enemy.setCollideWorldBounds(true);
    enemy.body.setSize(32, 48); // Adjust size to match the sprite
    enemy.setVelocity(0); // Initialize velocity to 0
    enemy.anims.play('enemyWalkLeft', true); // Play idle animation by default
    // Set basic health for the enemy
    enemy.health = 1; // Example health value; adjust as needed

    // Add behavior: Make the enemy move towards the player
    this.physics.add.overlap(enemy, player, hitPlayer, null, this);

    enemy.update = function () {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        const speed = 50; // Adjust speed as needed
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        
        this.setVelocity(velocityX, velocityY); // Move towards the player

        // Check horizontal movement (x-axis)
            // If the enemy is moving primarily horizontally, decide on animation
            if (velocityX > 0) {
                this.anims.play('enemyWalkRight', true);  // Right movement animation
            } else {
                this.anims.play('enemyWalkLeft', true);  // Left movement animation
            }
    };

    this.physics.add.collider(enemy, bullets, hitEnemy, null, this);
}

function hitEnemy(bullet, enemy) {
    // Change bullet animation to 'bulletHit' when it hits an enemy
    bullet.anims.play('bulletHit', true);
    
    // Destroy the bullet after the animation completes
    bullet.on('animationcomplete', () => {
        bullet.destroy();
    });

    // Play defeat animation for the enemy
    enemy.anims.play('defeat', true);

    // Destroy the enemy after the animation completes
    enemy.on('animationcomplete', () => enemy.destroy());

    // Update score
    score += 3;
    scoreText.setText('Score: ' + score);

    // Drop ammo or infinite ammo with chances, influenced by dropProbability
    if (Phaser.Math.FloatBetween(0, 1) <= 0.15 * dropProbability) {
        dropAmmo.call(this, enemy.x, enemy.y);
    }

    if (Phaser.Math.FloatBetween(0, 1) <= 0.05 * dropProbability) {
        dropInfiniteAmmo.call(this, enemy.x, enemy.y);
    }

    // Decrease dropProbability after each enemy defeat (decay effect)
    dropProbability = Math.max(dropProbability - dropDecayRate, 0.1);  // Ensure it doesn't go below 0.1
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container', // Asegúrate de que este contenedor exista en tu HTML
    dom: {
        createContainer: true, // Habilita el soporte para DOM
    },
    scene: [UserName, MainMenu, Game, GameOver],  // Add both scenes to the configuration
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

const game = new Phaser.Game(config);

export default Game;
