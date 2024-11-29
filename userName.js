export default class UserName extends Phaser.Scene {
    constructor() {
        super({ key: 'UserName' });
    }

    preload() {
        this.load.image('menuBg', 'assets/images/menuBg.jpeg');
        this.load.audio('menuMusic', 'assets/audio/letsStart.mp3'); // Load music for the menu
    }

    create() {

        this.add.image(400, 300, 'menuBg').setOrigin(0.5).setScale(0.5);

        // Fondo opcional o estilo de la escena
        this.add.text(400, 100, 'Ingresa tu nombre:', {
            fontSize: '32px',
            fill: '#ffffff',
        }).setOrigin(0.5);

        // Crear un cuadro de texto para que el jugador ingrese su nombre
        const inputBox = this.add.dom(400, 200, 'input', {
            type: 'text',
            fontSize: '20px',
            padding: '10px',
            width: '300px',
            border: '1px solid #ffffff',
            borderRadius: '10px',
            textAlign: 'center',
        });

        // Mensaje de instrucciones
        this.add.text(400, 300, 'Presiona ENTER para continuar', {
            fontSize: '20px',
            fill: '#ffffff',
        }).setOrigin(0.5);

        // Escuchar la tecla ENTER
        this.input.keyboard.on('keydown-ENTER', () => {
            const playerName = inputBox.node.value.trim();

            if (playerName) {
                // Guardar el nombre del jugador (por ejemplo, en data o en localStorage)
                this.registry.set('playerName', playerName);

                // Cambiar a la escena principal del juego
                this.scene.start('MainMenu');
            } else {
                // Mensaje de error si el jugador no ingresa un nombre
                this.add.text(400, 350, 'Por favor ingresa un nombre válido', {
                    fontSize: '18px',
                    fill: '#ff0000',
                }).setOrigin(0.5);
            }
        });
    }
}