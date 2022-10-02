
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Initial tick in a tock function
const time1 = new Date();
// Integer from 1-8 representing minimum (1) and maximum (8) solar irradiance
let globalindex = 0;
// Actual value in mW/m^2
let globalirrad = 0;


var player;
var stars;
/** @type Phaser.Physics.Arcade.Group */
var fire;
var platforms;
var cursors;
var score = 0;
var gameOver = false;
var scoreText;
var irradText;
var player_speed; // Sets the player's speed between normal and boost

var max = 100;
var min = 0;

var game = new Phaser.Game(config);



function preload() {
    //    this.load.image('sky', 'assets/sky.png');
    this.load.image('space', 'assets/space.png');
    this.load.image('sun', 'assets/sun.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('star', 'assets/star.png');
    this.load.image('fire', 'assets/fire.png');
    this.load.spritesheet('Astronaut', 'assets/Astronaut.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('astroLeft', 'assets/astronaut_to_left.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('astroRight', 'assets/astronaut_to_right.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('astroUp', 'assets/astronaut_to_up.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('astroDown', 'assets/astronaut_to_down.png', { frameWidth: 48, frameHeight: 48 });
}

/** @this Phaser.Scene */
function create() {
    //  A simple background for our game
    this.add.image(config.height / 2 + 100, config.width / 2 - 100, 'space');

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = this.physics.add.staticGroup();

    //  Here we create the ground.
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    platforms.create(400, 630, "ground").setScale(2).refreshBody();

    // The player and its settings
    player = this.physics.add.sprite(100, 450, "Astronaut");
    player.setCollideWorldBounds(true);

    //_________________________________________________________________________________
    // EDITED BY EP. TO BE EITHER REENABLED OR DELETED.
    //player = this.physics.add.sprite(100, 450, 'dude');
    //player.setAllowGravity(false);
    //player.setGravity(0);
    //.setAllowGravity(false);

    //  Player physics properties. Give the little guy a slight bounce.
    //player.setBounce(0.2);

    //  Now let's create some ledges
    //platforms.create(600, 400, 'ground');
    //platforms.create(50, 250, 'ground');
    //platforms.create(750, 220, 'ground');
    // _________________________________________________________________________________

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({ key: 'left',    frames: 'astroLeft'});
    this.anims.create({ key: 'right',   frames: 'astroRight'});
    this.anims.create({ key: 'up',      frames: 'astroUp'});
    this.anims.create({ key: 'down',    frames: 'astroDown'});

    // Possibly redundant
    this.anims.create({ key: 'turn',    frames: 'Astronaut'});

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();

    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    stars = this.physics.add.group({
    key: "star",
    repeat: 0,
    setXY: {
        x: Phaser.Math.RND.between(0, 800),
        y: 0,
    },
    });

    fire = this.physics.add.group();

    setTimeout(makeFires, 2000);

    //  A simple foreground for our game
    this.add.image(config.height / 2 + 100, config.width / 2 - 100, "sun");

    //  The score
    scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });
    scoreText.setStyle({ color: '#42f560' });
    
    irradText = this.add.text(16, 32, 'irradiance (mW/m^2): ' + globalirrad, { fontSize: '32px', fill: '#000' });
    irradText.setStyle({ color: '#42f560' });

    //  Collide the player and the stars with the platforms
    this.physics.add.collider(player, platforms);


    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    this.physics.add.overlap(player, stars, collectStar, undefined, this);
    this.physics.add.collider(player, fire, hitFire, undefined, this);
    this.physics.add.collider(platforms, stars, resetStar, undefined, this);

}

/** @this Phaser.Scene */
function update() {

    if (gameOver) {
        return;
    } else {

        //Irradiance level
        let time2 = new Date();
        let timeindex = Math.round((time2.getTime() - time1.getTime()) / 1000);
        // @ts-ignore
        let package = irradiance(timeindex);
        globalindex = package.globalindex;
        globalirrad = package.irradlevel;
        irradText.setText('irradiance (mW/m^2): ' + globalirrad);
        if (globalindex > 6) { irradText.setStyle({ color: '#f54242' }); }


        if (cursors.left.isDown) {
            player.setVelocityX(-player_speed);

            player.anims.play('left', true);
        }
        else if (cursors.right.isDown) {
            player.setVelocityX(player_speed);

            player.anims.play('right', true);
        }
        else {
            player.setVelocityX(0);

            player.anims.play('turn');
        }



        if (cursors.up.isDown) { // EP: Enables float
            player.setVelocityY(-player_speed);
            player.anims.play('up', true);
        } else if (cursors.down.isDown) {
            player.setVelocityY(player_speed);
            player.anims.play('down', true);
        } else {
            player.setVelocityY(-5); //EP: maintain current y

        }
        if (cursors.space.isDown) { //EP: Enables Booster
            player_speed = 800;
        }
        else { player_speed = 200; }


    }


}

//TODO: make these stop when game ends
function makeFires() {
    if (gameOver == false) {
        console.log(globalindex);
        for (var i = 0; i < globalindex; i++) {
            console.log(globalindex);
            var x = Phaser.Math.RND.between(0, 800);
            fire.create(x, 0, 'fire');
        }
        setTimeout(makeFires, 2000);
    }

}

/**
 * @this Phaser.Scene
 * @param {Phaser.Types.Physics.Arcade.SpriteWithDynamicBody} player
 * @param {Phaser.Types.Physics.Arcade.SpriteWithDynamicBody} star
 * @type ArcadePhysicsCallback
 */
function collectStar(player, star) {
    star.disableBody(true, true);

    //  Add and update the score
    score += 10;
    scoreText.setText('Score: ' + score);


    var newStar = stars.create(Phaser.Math.RND.between(0, 800), 16, 'star');
    // star.setCollideWorldBounds(true);
    newStar.allowGravity = true;
    //_________________________________________________________________________________
    //Commented out at the CA's request.
    //var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
    //var fire = fire.create(x, 16, 'fire');
    //fire.setBounce(1);
    //fire.setCollideWorldBounds(true);
    //fire.setVelocity(Phaser.Math.Between(-200, 200), 20);
    //fire.allowGravity = false;
    //_________________________________________________________________________________
}

/**
 * @param {Phaser.Types.Physics.Arcade.SpriteWithDynamicBody} player
 * @param {Phaser.Types.Physics.Arcade.SpriteWithDynamicBody} fire
 * @this Phaser.Scene
 * @type ArcadePhysicsCallback
 */
function hitFire(player, fire) {
    this.physics.pause();

    player.setTint(0xeb6c0c);
    player.anims.play('turn');

    gameOver = true;
}

function destroyFire(fire) {
    fire.destroy(fire);
}

function resetStar(platforms, stars) {
    stars.setPosition(Phaser.Math.RND.between(0, 800), 0);
}
