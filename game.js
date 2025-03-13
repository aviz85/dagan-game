// Game variables
let scene, camera, renderer;
let monsters = [];
let badMonsters = [];
let score = 0;
let colors = [
    0xff6b6b, // Red
    0x48dbfb, // Blue
    0x1dd1a1, // Green
    0xfeca57, // Yellow
    0x6c5ce7, // Purple
    0xfd79a8  // Pink
];
let sounds = {
    bounce: [],
    cheer: null,
    wrong: null,
    background: null
};
let confetti = [];
let isLoading = true;
let cameraAngle = 0;
let cameraRotationSpeed = 0.002;
let spawnTimer = 0;
let difficulty = 1;
let gameStarted = false;
let gameOver = false;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x74b9ff);

    // Create camera
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    scene.add(directionalLight);

    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x7bed9f,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Load sounds
    loadSounds();

    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('touchstart', onTouchStart, false);
    renderer.domElement.addEventListener('mousedown', onMouseDown, false);

    // Create start screen
    createStartScreen();

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        isLoading = false;
    }, 1500);

    // Start animation loop
    animate();
}

// Create start screen with instructions
function createStartScreen() {
    const startScreen = document.createElement('div');
    startScreen.id = 'start-screen';
    startScreen.innerHTML = `
        <div class="start-content">
            <h1>Monster Bounce</h1>
            <p>תפסו את המפלצות הצבעוניות!</p>
            <p>היזהרו מהמפלצות השחורות!</p>
            <button id="start-button">התחל משחק</button>
        </div>
    `;
    document.getElementById('game-container').appendChild(startScreen);
    
    // Add CSS for start screen
    const style = document.createElement('style');
    style.textContent = `
        #start-screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 100;
        }
        .start-content {
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            max-width: 80%;
        }
        #start-button {
            background-color: #ff6b6b;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 18px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
        }
        #game-over {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 100;
            display: none;
        }
        #restart-button {
            background-color: #ff6b6b;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 18px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
        }
    `;
    document.head.appendChild(style);
    
    // Create game over screen (hidden initially)
    const gameOverScreen = document.createElement('div');
    gameOverScreen.id = 'game-over';
    gameOverScreen.innerHTML = `
        <div class="start-content">
            <h1>המשחק נגמר!</h1>
            <p>הניקוד שלך: <span id="final-score">0</span></p>
            <button id="restart-button">שחק שוב</button>
        </div>
    `;
    document.getElementById('game-container').appendChild(gameOverScreen);
    
    // Add event listeners for buttons
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('restart-button').addEventListener('click', restartGame);
}

// Start the game
function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    gameStarted = true;
    
    // Play background sound
    if (sounds.background) {
        sounds.background.play();
    }
    
    // Spawn initial monsters
    for (let i = 0; i < 3; i++) {
        spawnMonster(false);
    }
}

// Game over
function endGame() {
    gameOver = true;
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').style.display = 'flex';
    
    // Stop background sound
    if (sounds.background) {
        sounds.background.stop();
    }
}

// Restart the game
function restartGame() {
    // Clear all monsters
    for (let i = monsters.length - 1; i >= 0; i--) {
        scene.remove(monsters[i].mesh);
    }
    monsters = [];
    
    for (let i = badMonsters.length - 1; i >= 0; i--) {
        scene.remove(badMonsters[i].mesh);
    }
    badMonsters = [];
    
    // Reset variables
    score = 0;
    document.getElementById('score').textContent = `ניקוד: ${score}`;
    difficulty = 1;
    cameraRotationSpeed = 0.002;
    spawnTimer = 0;
    gameOver = false;
    
    // Hide game over screen
    document.getElementById('game-over').style.display = 'none';
    
    // Play background sound
    if (sounds.background) {
        sounds.background.play();
    }
    
    // Spawn initial monsters
    for (let i = 0; i < 3; i++) {
        spawnMonster(false);
    }
}

// Spawn a new monster at random position
function spawnMonster(isBad = false) {
    const monsterTypes = [
        createBlobMonster,
        createCubeMonster,
        createPyramidMonster
    ];
    
    const monsterType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
    const monster = monsterType(isBad);
    
    // Random position within a circle
    const angle = Math.random() * Math.PI * 2;
    const radius = 4 + Math.random() * 3;
    monster.position.x = Math.cos(angle) * radius;
    monster.position.z = Math.sin(angle) * radius;
    monster.position.y = -2; // Start below ground
    
    scene.add(monster);
    
    // Calculate lifespan based on difficulty (shorter as difficulty increases)
    const baseLifespan = 5; // Base lifespan in seconds
    const minLifespan = 1.5; // Minimum lifespan at highest difficulty
    const lifespanReduction = (baseLifespan - minLifespan) * ((difficulty - 1) / 4);
    const adjustedLifespan = baseLifespan - lifespanReduction;
    
    const monsterData = {
        mesh: monster,
        originalY: 0, // Will be above ground when fully appeared
        bounceHeight: 1.5 + Math.random(),
        bounceSpeed: 0.05 + Math.random() * 0.05,
        isBouncing: false,
        bounceFactor: 0,
        colorIndex: Math.floor(Math.random() * colors.length),
        eyeDirection: new THREE.Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize(),
        blinkTime: Math.random() * 3 + 1,
        state: 'appearing', // appearing, active, disappearing, gone
        stateTime: 0,
        lifespan: adjustedLifespan + Math.random(), // How long the monster stays active
        scale: 0.01, // Start tiny
        isBad: isBad
    };
    
    if (isBad) {
        badMonsters.push(monsterData);
    } else {
        monsters.push(monsterData);
    }
    
    return monsterData;
}

// Create a blob-like monster
function createBlobMonster(isBad = false) {
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: isBad ? 0x000000 : colors[Math.floor(Math.random() * colors.length)],
        roughness: 0.7,
        metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ 
        color: isBad ? 0xff0000 : 0xffffff 
    });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.5, 0.5, 0.9);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.5, 0.5, 0.9);
    group.add(rightEye);
    
    // Pupils
    const pupilGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const pupilMaterial = new THREE.MeshStandardMaterial({ 
        color: isBad ? 0xffff00 : 0x000000 
    });
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.5, 0.5, 1.1);
    leftPupil.userData.isPupil = true;
    group.add(leftPupil);
    
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.5, 0.5, 1.1);
    rightPupil.userData.isPupil = true;
    group.add(rightPupil);
    
    // Mouth
    const mouthGeometry = new THREE.TorusGeometry(0.4, 0.1, 16, 32, Math.PI);
    const mouthMaterial = new THREE.MeshStandardMaterial({ 
        color: isBad ? 0xff0000 : 0x333333 
    });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, 0, 1);
    mouth.rotation.x = Math.PI / 2;
    if (isBad) {
        mouth.rotation.z = Math.PI; // Frown for bad monsters
    }
    mouth.userData.isMouth = true;
    group.add(mouth);
    
    return group;
}

// Create a cube monster
function createCubeMonster(isBad = false) {
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.BoxGeometry(2, 2, 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: isBad ? 0x000000 : colors[Math.floor(Math.random() * colors.length)],
        roughness: 0.7,
        metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(body);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ 
        color: isBad ? 0xff0000 : 0xffffff 
    });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.5, 0.5, 1.01);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.5, 0.5, 1.01);
    group.add(rightEye);
    
    // Pupils
    const pupilGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const pupilMaterial = new THREE.MeshStandardMaterial({ 
        color: isBad ? 0xffff00 : 0x000000 
    });
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.5, 0.5, 1.2);
    leftPupil.userData.isPupil = true;
    group.add(leftPupil);
    
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.5, 0.5, 1.2);
    rightPupil.userData.isPupil = true;
    group.add(rightPupil);
    
    // Mouth
    const mouthGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.1);
    const mouthMaterial = new THREE.MeshStandardMaterial({ 
        color: isBad ? 0xff0000 : 0x333333 
    });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    
    if (isBad) {
        // Frown for bad monsters
        mouth.position.set(0, -0.5, 1.01);
        mouth.rotation.z = Math.PI * 0.1;
    } else {
        mouth.position.set(0, -0.3, 1.01);
    }
    
    mouth.userData.isMouth = true;
    group.add(mouth);
    
    return group;
}

// Create a pyramid monster
function createPyramidMonster(isBad = false) {
    const group = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.ConeGeometry(1.2, 2, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: isBad ? 0x000000 : colors[Math.floor(Math.random() * colors.length)],
        roughness: 0.7,
        metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.y = Math.PI / 4;
    group.add(body);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ 
        color: isBad ? 0xff0000 : 0xffffff 
    });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.4, 0.3, 0.7);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.4, 0.3, 0.7);
    group.add(rightEye);
    
    // Pupils
    const pupilGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const pupilMaterial = new THREE.MeshStandardMaterial({ 
        color: isBad ? 0xffff00 : 0x000000 
    });
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.4, 0.3, 0.85);
    leftPupil.userData.isPupil = true;
    group.add(leftPupil);
    
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.4, 0.3, 0.85);
    rightPupil.userData.isPupil = true;
    group.add(rightPupil);
    
    // Mouth
    const mouthGeometry = new THREE.TorusGeometry(0.3, 0.08, 16, 32, Math.PI);
    const mouthMaterial = new THREE.MeshStandardMaterial({ 
        color: isBad ? 0xff0000 : 0x333333 
    });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, -0.2, 0.7);
    mouth.rotation.x = Math.PI / 2;
    
    if (isBad) {
        mouth.rotation.z = Math.PI; // Frown for bad monsters
    }
    
    mouth.userData.isMouth = true;
    group.add(mouth);
    
    return group;
}

// Load sound effects
function loadSounds() {
    // Create audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create bounce sounds
    for (let i = 0; i < 5; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 300 + i * 100; // Different pitch for each monster
        
        gainNode.gain.value = 0;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        
        sounds.bounce.push({
            oscillator,
            gainNode,
            play: function() {
                this.gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                this.gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
                this.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
            }
        });
    }
    
    // Create cheer sound
    const cheerOscillator = audioContext.createOscillator();
    const cheerGain = audioContext.createGain();
    
    cheerOscillator.type = 'square';
    cheerOscillator.frequency.value = 440;
    
    cheerGain.gain.value = 0;
    
    cheerOscillator.connect(cheerGain);
    cheerGain.connect(audioContext.destination);
    
    cheerOscillator.start();
    
    sounds.cheer = {
        oscillator: cheerOscillator,
        gainNode: cheerGain,
        play: function() {
            const now = audioContext.currentTime;
            this.oscillator.frequency.setValueAtTime(440, now);
            this.oscillator.frequency.linearRampToValueAtTime(880, now + 0.1);
            this.oscillator.frequency.linearRampToValueAtTime(1320, now + 0.2);
            
            this.gainNode.gain.setValueAtTime(0, now);
            this.gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
            this.gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
        }
    };
    
    // Create wrong sound
    const wrongOscillator = audioContext.createOscillator();
    const wrongGain = audioContext.createGain();
    
    wrongOscillator.type = 'sawtooth';
    wrongOscillator.frequency.value = 150;
    
    wrongGain.gain.value = 0;
    
    wrongOscillator.connect(wrongGain);
    wrongGain.connect(audioContext.destination);
    
    wrongOscillator.start();
    
    sounds.wrong = {
        oscillator: wrongOscillator,
        gainNode: wrongGain,
        play: function() {
            const now = audioContext.currentTime;
            this.oscillator.frequency.setValueAtTime(200, now);
            this.oscillator.frequency.linearRampToValueAtTime(100, now + 0.3);
            
            this.gainNode.gain.setValueAtTime(0, now);
            this.gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
            this.gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        }
    };
    
    // Create background music
    const backgroundOsc1 = audioContext.createOscillator();
    const backgroundOsc2 = audioContext.createOscillator();
    const backgroundGain = audioContext.createGain();
    
    backgroundOsc1.type = 'sine';
    backgroundOsc1.frequency.value = 220;
    
    backgroundOsc2.type = 'triangle';
    backgroundOsc2.frequency.value = 330;
    
    backgroundGain.gain.value = 0;
    
    backgroundOsc1.connect(backgroundGain);
    backgroundOsc2.connect(backgroundGain);
    backgroundGain.connect(audioContext.destination);
    
    backgroundOsc1.start();
    backgroundOsc2.start();
    
    sounds.background = {
        oscillators: [backgroundOsc1, backgroundOsc2],
        gainNode: backgroundGain,
        isPlaying: false,
        play: function() {
            if (this.isPlaying) return;
            
            const now = audioContext.currentTime;
            this.gainNode.gain.setValueAtTime(0, now);
            this.gainNode.gain.linearRampToValueAtTime(0.05, now + 1);
            
            this.isPlaying = true;
            
            // Create simple melody pattern
            this.melodyInterval = setInterval(() => {
                const notes = [220, 330, 440, 330];
                const currentNote = notes[Math.floor(Date.now() / 1000) % notes.length];
                this.oscillators[0].frequency.setValueAtTime(currentNote, audioContext.currentTime);
                this.oscillators[1].frequency.setValueAtTime(currentNote * 1.5, audioContext.currentTime);
            }, 500);
        },
        stop: function() {
            if (!this.isPlaying) return;
            
            const now = audioContext.currentTime;
            this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
            this.gainNode.gain.linearRampToValueAtTime(0, now + 1);
            
            this.isPlaying = false;
            clearInterval(this.melodyInterval);
        }
    };
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle touch events
function onTouchStart(event) {
    event.preventDefault();
    
    if (isLoading) return;
    
    const touch = event.touches[0];
    checkMonsterClick(touch.clientX, touch.clientY);
}

// Handle mouse events
function onMouseDown(event) {
    if (isLoading) return;
    
    checkMonsterClick(event.clientX, event.clientY);
}

// Check if a monster was clicked/tapped
function checkMonsterClick(x, y) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Convert to normalized device coordinates
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections with good monsters
    for (let i = 0; i < monsters.length; i++) {
        const monster = monsters[i];
        
        // Only check active monsters
        if (monster.state !== 'active') continue;
        
        const intersects = raycaster.intersectObject(monster.mesh, true);
        
        if (intersects.length > 0) {
            // Make the monster bounce
            if (!monster.isBouncing) {
                monster.isBouncing = true;
                monster.bounceFactor = 0;
                
                // Play bounce sound
                sounds.bounce[i % sounds.bounce.length].play();
                
                // Change color
                monster.colorIndex = (monster.colorIndex + 1) % colors.length;
                monster.mesh.children[0].material.color.setHex(colors[monster.colorIndex]);
                
                // Update score
                score++;
                document.getElementById('score').textContent = `ניקוד: ${score}`;
                
                // Increase difficulty
                updateDifficulty();
                
                // Create confetti on milestone scores
                if (score % 10 === 0) {
                    createConfetti(monster.mesh.position.x, monster.mesh.position.y + 2, monster.mesh.position.z);
                    sounds.cheer.play();
                }
                
                // Start disappearing
                monster.state = 'disappearing';
                monster.stateTime = 0;
            }
            return; // Exit after finding a hit
        }
    }
    
    // Check for intersections with bad monsters
    for (let i = 0; i < badMonsters.length; i++) {
        const monster = badMonsters[i];
        
        // Only check active monsters
        if (monster.state !== 'active') continue;
        
        const intersects = raycaster.intersectObject(monster.mesh, true);
        
        if (intersects.length > 0) {
            // Play wrong sound
            sounds.wrong.play();
            
            // Penalty - reduce score
            score = Math.max(0, score - 2);
            document.getElementById('score').textContent = `ניקוד: ${score}`;
            
            // Make the monster angry
            monster.isBouncing = true;
            monster.bounceFactor = 0;
            monster.bounceSpeed *= 2; // Faster angry bounce
            
            // Start disappearing
            monster.state = 'disappearing';
            monster.stateTime = 0;
            
            return; // Exit after finding a hit
        }
    }
}

// Update difficulty based on score
function updateDifficulty() {
    // Increase difficulty every 10 points
    difficulty = 1 + Math.floor(score / 10) * 0.5;
    
    // Cap difficulty
    if (difficulty > 5) difficulty = 5;
    
    // Update camera rotation speed - gets faster with higher difficulty
    cameraRotationSpeed = 0.002 + (difficulty - 1) * 0.002;
    
    // Update monster spawn rate - gets faster with higher difficulty
    // This is applied in the animate function when resetting spawnTimer
    
    // Log current difficulty settings
    console.log(`Difficulty: ${difficulty}, Camera Speed: ${cameraRotationSpeed.toFixed(4)}, Spawn Rate: ${(2/difficulty).toFixed(2)}s`);
}

// Create confetti particles
function createConfetti(x, y, z) {
    const confettiCount = 50;
    const colors = [0xff6b6b, 0x48dbfb, 0x1dd1a1, 0xfeca57, 0x6c5ce7, 0xfd79a8];
    
    for (let i = 0; i < confettiCount; i++) {
        const geometry = new THREE.PlaneGeometry(0.1, 0.1);
        const material = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            side: THREE.DoubleSide
        });
        const particle = new THREE.Mesh(geometry, material);
        
        particle.position.set(
            x + (Math.random() - 0.5) * 2,
            y + Math.random() * 1,
            z + (Math.random() - 0.5) * 2
        );
        
        particle.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
        
        scene.add(particle);
        
        confetti.push({
            mesh: particle,
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                Math.random() * 0.2 + 0.1,
                (Math.random() - 0.5) * 0.2
            ),
            rotation: new THREE.Vector3(
                Math.random() * 0.1,
                Math.random() * 0.1,
                Math.random() * 0.1
            ),
            life: 100
        });
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Only update game if started
    if (gameStarted && !gameOver) {
        // Rotate camera around the scene
        cameraAngle += cameraRotationSpeed;
        const cameraRadius = 10;
        camera.position.x = Math.sin(cameraAngle) * cameraRadius;
        camera.position.z = Math.cos(cameraAngle) * cameraRadius;
        camera.lookAt(0, 0, 0);
        
        // Spawn timer
        spawnTimer -= 0.016; // Approximately 60fps
        if (spawnTimer <= 0) {
            // Spawn a new monster
            const badChance = Math.min(0.3, 0.05 + (difficulty - 1) * 0.05); // Increase bad monster chance with difficulty
            const isBad = Math.random() < badChance;
            
            spawnMonster(isBad);
            
            // Reset timer - spawn faster as difficulty increases
            const baseSpawnTime = 2.5; // Base spawn time in seconds
            const minSpawnTime = 0.8; // Minimum spawn time at highest difficulty
            const spawnReduction = (baseSpawnTime - minSpawnTime) * ((difficulty - 1) / 4);
            spawnTimer = baseSpawnTime - spawnReduction;
        }
        
        // Update good monsters
        updateMonsters(monsters);
        
        // Update bad monsters
        updateMonsters(badMonsters);
        
        // Check if game should end (too many bad monsters)
        if (badMonsters.length > 5) {
            endGame();
        }
    }
    
    // Update confetti
    for (let i = confetti.length - 1; i >= 0; i--) {
        const particle = confetti[i];
        
        particle.mesh.position.add(particle.velocity);
        particle.mesh.rotation.x += particle.rotation.x;
        particle.mesh.rotation.y += particle.rotation.y;
        particle.mesh.rotation.z += particle.rotation.z;
        
        // Apply gravity
        particle.velocity.y -= 0.01;
        
        // Reduce life
        particle.life--;
        
        // Remove dead particles
        if (particle.life <= 0) {
            scene.remove(particle.mesh);
            confetti.splice(i, 1);
        }
    }
    
    renderer.render(scene, camera);
}

// Update monsters based on their state
function updateMonsters(monsterArray) {
    for (let i = monsterArray.length - 1; i >= 0; i--) {
        const monster = monsterArray[i];
        
        // Update state time
        monster.stateTime += 0.016; // Approximately 60fps
        
        // Handle different states
        switch (monster.state) {
            case 'appearing':
                // Grow and rise from the ground
                monster.scale += 0.05;
                if (monster.scale >= 1) {
                    monster.scale = 1;
                    monster.state = 'active';
                    monster.stateTime = 0;
                }
                
                monster.mesh.position.y = -2 + monster.scale * 2;
                monster.mesh.scale.set(monster.scale, monster.scale, monster.scale);
                break;
                
            case 'active':
                // Check if monster should start disappearing
                if (monster.stateTime >= monster.lifespan) {
                    monster.state = 'disappearing';
                    monster.stateTime = 0;
                }
                
                // Handle bouncing
                if (monster.isBouncing) {
                    monster.bounceFactor += monster.bounceSpeed;
                    
                    if (monster.bounceFactor >= Math.PI) {
                        monster.bounceFactor = 0;
                        monster.isBouncing = false;
                    } else {
                        monster.mesh.position.y = monster.originalY + Math.sin(monster.bounceFactor) * monster.bounceHeight;
                        
                        // Squash and stretch effect
                        const scale = monster.scale * (1 + Math.sin(monster.bounceFactor) * 0.2);
                        monster.mesh.scale.set(scale, monster.scale * (2 - scale/monster.scale), scale);
                    }
                }
                
                // Animate eyes
                monster.mesh.children.forEach(child => {
                    if (child.userData.isPupil) {
                        // Move pupils randomly but keep them within the eye
                        monster.eyeDirection.x += (Math.random() - 0.5) * 0.05;
                        monster.eyeDirection.y += (Math.random() - 0.5) * 0.05;
                        
                        // Limit movement range
                        if (monster.eyeDirection.length() > 1) {
                            monster.eyeDirection.normalize();
                        }
                        
                        // Get base position based on whether it's left or right eye
                        const isLeftEye = child.position.x < 0;
                        const baseX = isLeftEye ? -0.5 : 0.5;
                        const baseZ = isLeftEye ? 1.1 : 1.1; // Same Z for both eyes
                        
                        // Apply limited movement (max 0.1 units in any direction)
                        child.position.x = baseX + monster.eyeDirection.x * 0.05;
                        child.position.z = baseZ + monster.eyeDirection.y * 0.05;
                        
                        // Blinking
                        monster.blinkTime -= 0.01;
                        if (monster.blinkTime <= 0) {
                            monster.blinkTime = Math.random() * 3 + 1;
                            child.scale.y = 0.1;
                            setTimeout(() => {
                                if (child && child.scale) child.scale.y = 1;
                            }, 150);
                        }
                    }
                    
                    // Animate mouth for bouncing monsters
                    if (child.userData.isMouth && monster.isBouncing) {
                        if (child.geometry.type === 'TorusGeometry') {
                            child.scale.set(1 + Math.sin(monster.bounceFactor) * 0.5, 1, 1);
                        } else {
                            child.scale.set(1, 1 + Math.sin(monster.bounceFactor) * 2, 1);
                        }
                    }
                });
                
                // Gentle idle animation
                monster.mesh.rotation.y += Math.sin(Date.now() * 0.001) * 0.005;
                break;
                
            case 'disappearing':
                // Shrink and sink into the ground
                monster.scale -= 0.05;
                if (monster.scale <= 0) {
                    monster.scale = 0;
                    monster.state = 'gone';
                    
                    // Remove from scene
                    scene.remove(monster.mesh);
                    monsterArray.splice(i, 1);
                } else {
                    monster.mesh.position.y = -2 + monster.scale * 2;
                    monster.mesh.scale.set(monster.scale, monster.scale, monster.scale);
                }
                break;
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', init); 