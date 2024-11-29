class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    preload() {
        this.load.image('logo', 'assets/images/logo.png');
        this.load.image('menuBg', 'assets/images/menuBg.jpeg');
        this.load.image('controls', 'assets/images/controls.png');
        this.load.image('selector', 'assets/images/selector.png'); // The selector image
        this.load.image('playButton', 'assets/images/playbutton.png'); // Replaced text with images
        this.load.image('controlsButton', 'assets/images/controlsbutton.png'); // Replaced text with images
        this.load.audio('menuMusic', 'assets/audio/letsStart.mp3');
    }

    create() {
        this.menuBG = this.add.image(0, 0, 'menuBg').setOrigin(0, 0);
        this.menuBG.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        this.logo = this.add.image(400, 150, 'logo');
        this.logo.setDisplaySize(400, 300);

        // Set space between buttons
        const buttonSpacing = 100; // Space between buttons
        const buttonYStart = 350; // Starting y-position for the first button

        // Create images for the menu options
        this.menuOptions = [
            { image: this.add.image(400, buttonYStart, 'playButton').setOrigin(0.5), action: this.startGame },
            { image: this.add.image(400, buttonYStart + buttonSpacing, 'controlsButton').setOrigin(0.5), action: this.showControls }
        ];

        const buttonWidth = 250;
        const buttonHeight = 120;
        this.menuOptions.forEach(option => {
            option.image.setDisplaySize(buttonWidth, buttonHeight);
        });

        
        // Create the selector (initially place it next to the "Start Game" button)
        this.selector = this.add.image(320, 350, 'selector').setOrigin(0.8, 0.5);
        const selectorWidth = 50; // Set the width of the selector
        const selectorHeight = 60; // Set the height of the selector
        this.selector.setDisplaySize(selectorWidth, selectorHeight);

        //para que se vea chido
        this.tweens.add({
            targets: this.selector,
            alpha: { from: 1, to: 0 }, // Fade from 1 (fully visible) to 0 (invisible)
            duration: 125, // Duration of the fade (in milliseconds)
            yoyo: true, // Enable yoyo effect (reverse the tween automatically)
            repeat: -1, // Repeat the tween indefinitely
            ease: 'Sine.easeInOut' // Smooth ease for the fade effect
        });


        // Set up navigation and actions
        this.selectedOption = 0;

        this.input.keyboard.on('keydown-UP', this.navigateUp, this);
        this.input.keyboard.on('keydown-DOWN', this.navigateDown, this);
        this.input.keyboard.on('keydown-ENTER', this.selectOption, this);

        this.returnText = this.add.text(400, 500, 'Press ENTER to Return', {
            font: '24px Arial',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5,-5).setVisible(false);

        this.sound.play('menuMusic', {
            loop: true,
            volume: 0.5
        });

        // Initialize the controlsImage as null initially
        this.controlsImage = null;
    }

    navigateUp() {
        if (this.selectedOption > 0) {
            this.selectedOption--;
            this.moveSelector();
        }
    }

    navigateDown() {
        if (this.selectedOption < this.menuOptions.length - 1) {
            this.selectedOption++;
            this.moveSelector();
        }
    }

    moveSelector() {
        // Move the selector to the left of the selected option
        const selectedOption = this.menuOptions[this.selectedOption];
        this.selector.setPosition(selectedOption.image.x - 80, selectedOption.image.y);
    }

    selectOption() {
        const selectedAction = this.menuOptions[this.selectedOption].action;
        selectedAction.call(this);
    }

    startGame() {
        this.sound.stopAll();
        this.scene.start('Game');
    }

    showControls() {
        this.logo.setVisible(false);
        this.selector.setVisible(false);
        this.menuOptions.forEach(option => option.image.setVisible(false));

        // Add the controls image (if it hasn't been added already)
        if (!this.controlsImage) {
            this.controlsImage = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'controls');
            this.controlsImage.setDisplaySize(400, 450); // Adjust size as needed
        }
        this.returnText.setVisible(true);
        this.controlsImage.setVisible(true);

        this.input.keyboard.on('keydown-ENTER', this.returnToMainMenu, this);
    }

    returnToMainMenu() {
        // Hide the controls image and return message
        if (this.controlsImage) {
            this.controlsImage.setVisible(false);
        }
        this.returnText.setVisible(false);

        this.logo.setVisible(true);
        this.menuOptions.forEach(option => option.image.setVisible(true));
        this.selector.setVisible(true);
        this.selectedOption = 0;
        this.moveSelector();

        this.input.keyboard.removeListener('keydown-ENTER', this.returnToMainMenu, this);
    }
}

export default MainMenu;
