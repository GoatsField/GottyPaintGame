class GameOver extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOver' });
    }

    preload() {
        this.load.image('menuBg', 'assets/images/menuBg.jpeg');
        this.load.audio('gameOverJingle', 'assets/audio/painted.mp3');
    }

    create(data) {
        // Get player name and score
        const playerName = localStorage.getItem('playerName') || 'Player';
        const score = data.score || 0;

        // Save high score
        this.saveHighScore(playerName, score);

        // Background
        this.menuBG = this.add.image(0, 0, 'menuBg').setOrigin(0, 0);
        this.menuBG.setDisplaySize(this.cameras.main.width, this.cameras.main.height);

        // Game Over Title
        this.add.text(400, 100, 'Game Over', {
            font: '48px Arial',
            fill: '#ff0000',
            align: 'center'
        }).setOrigin(0.5);

        // Player Score Display
        this.add.text(400, 200, `${playerName}'s Score: ${score}`, {
            font: '32px Arial',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // High Scores Title
        this.add.text(400, 250, 'High Scores', {
            font: '24px Arial',
            fill: '#ffff00',
            align: 'center'
        }).setOrigin(0.5);

        // Display High Scores
        const highScores = this.getHighScores();
        highScores.slice(0, 5).forEach((entry, index) => {
            this.add.text(400, 300 + index * 30, 
                `${index + 1}. ${entry.name}: ${entry.score}`, {
                font: '20px Arial',
                fill: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
        });

        // Menu Options
        this.menuOptions = [
            { text: 'Restart', action: this.restartGame },
            { text: 'Main Menu', action: this.goToMainMenu }
        ];

        this.selectedOption = 0;

        // Create menu option texts
        this.menuTexts = this.menuOptions.map((option, index) => {
            return this.add.text(400, 500 + index * 60, option.text, {
                font: '24px Arial',
                fill: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
        });

        // Highlight the first option
        this.highlightOption();

        // Set up keyboard input for navigation
        this.input.keyboard.on('keydown-UP', this.navigateUp, this);
        this.input.keyboard.on('keydown-DOWN', this.navigateDown, this);
        this.input.keyboard.on('keydown-ENTER', this.selectOption, this);

        // Play Game Over music
        this.sound.play('gameOverJingle', {
            loop: false,
            volume: 0.5
        });
    }

    saveHighScore(playerName, score) {
        // Retrieve existing high scores
        let highScores = JSON.parse(localStorage.getItem('highScores') || '[]');
        
        // Add new score
        highScores.push({ name: playerName, score: score });
        
        // Sort scores in descending order
        highScores.sort((a, b) => b.score - a.score);
        
        // Keep only top 10 scores
        highScores = highScores.slice(0, 10);
        
        // Save back to localStorage
        localStorage.setItem('highScores', JSON.stringify(highScores));
    }

    getHighScores() {
        return JSON.parse(localStorage.getItem('highScores') || '[]');
    }

    navigateUp() {
        if (this.selectedOption > 0) {
            this.selectedOption--;
            this.highlightOption();
        }
    }

    navigateDown() {
        if (this.selectedOption < this.menuOptions.length - 1) {
            this.selectedOption++;
            this.highlightOption();
        }
    }

    highlightOption() {
        // Reset the color of all options
        this.menuTexts.forEach(text => text.setStyle({ fill: '#ffffff' }));
        // Highlight the selected option in yellow
        this.menuTexts[this.selectedOption].setStyle({ fill: '#ffff00' });
    }

    selectOption() {
        const selectedAction = this.menuOptions[this.selectedOption].action;
        selectedAction.call(this);
    }

    restartGame() {
        this.sound.stopAll();
        this.scene.start('Game');
    }

    goToMainMenu() {
        this.scene.start('MainMenu');
    }
}

export default GameOver;