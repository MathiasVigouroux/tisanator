class NuclearFacilityEnvironment {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = null;
        this.mouse = new THREE.Vector2();
        this.clock = new THREE.Clock();

        this.interactionPoints = [];
        this.currentLocation = 'Entrance';
        this.isLoaded = false;
        
        // Keyboard state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            turnLeft: false,
            turnRight: false
        };

        // Navigation nodes
        this.navigationNodes = {
            'Entrance': { position: new THREE.Vector3(0, 1.7, 5), rotation: 0 },
            'Corridor': { position: new THREE.Vector3(0, 1.7, -10), rotation: 0 },
            'Reactor Hall': { position: new THREE.Vector3(-15, 1.7, -10), rotation: Math.PI / 2 },
            'Control Room': { position: new THREE.Vector3(15, 1.7, -10), rotation: -Math.PI / 2 }
        };

        // Init
        this.init();
    }

    init() {
        // Setup loading screen
        const loadingScreen = document.getElementById('loading-screen');
        const loadProgress = document.getElementById('load-progress');

        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0f0f1b);
        this.scene.fog = new THREE.Fog(0x0f0f1b, 10, 30);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.7, 5); // Eye level
        
        // Create renderer with pixel art style
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(1); // Force pixel ratio of 1 for sharper pixel art look
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap; // Use basic shadow map for pixelated look
        document.getElementById('environment').appendChild(this.renderer.domElement);

        // Add lights
        this.addLights();

        // Add raycaster for interactions
        this.raycaster = new THREE.Raycaster();

        // Create custom pixel art cursor
        this.createPixelCursor();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
        
        // Add mouse and keyboard listeners
        document.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
        document.addEventListener('click', (e) => this.onClick(e), false);
        document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
        document.addEventListener('keyup', (e) => this.onKeyUp(e), false);

        // Add instructions UI
        this.addInstructionsUI();

        // Load environment models and textures
        this.loadEnvironment(() => {
            // Setup completed
            this.isLoaded = true;
            
            // Hide loading screen
            loadProgress.style.width = '100%';
            setTimeout(() => {
                loadingScreen.style.opacity = 0;
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 500);
            
            // Start animation loop
            this.animate();
        });

        // Handle exit button
        document.getElementById('exit-simulator').addEventListener('click', () => {
            document.getElementById('simulator-container').style.display = 'none';
            document.getElementById('environment-container').style.display = 'block';
        });
        
        // Listen for reactor critical faults to show visual indicators
        document.addEventListener('reactor-critical-fault', (event) => {
            if (event.detail && event.detail.system) {
                this.showAlarmInEnvironment(event.detail.system);
            }
        });
    }

    createPixelCursor() {
        // Create pixel art cursor element
        const cursorElement = document.createElement('div');
        cursorElement.className = 'pixel-cursor';
        document.body.appendChild(cursorElement);
        
        this.pixelCursor = cursorElement;
        
        // Show pixel cursor when in environment
        document.getElementById('environment').addEventListener('mouseover', () => {
            this.pixelCursor.style.display = 'block';
            document.body.style.cursor = 'none';
        });
        
        document.getElementById('environment').addEventListener('mouseout', () => {
            this.pixelCursor.style.display = 'none';
            document.body.style.cursor = 'auto';
        });
    }

    addInstructionsUI() {
        // Create help UI for controls
        const controlsHelp = document.createElement('div');
        controlsHelp.className = 'controls-help';
        controlsHelp.innerHTML = `
            <h3>CONTROLS</h3>
            <ul>
                <li>↑/W: Move Forward</li>
                <li>↓/S: Move Backward</li>
                <li>←/A: Turn Left</li>
                <li>→/D: Turn Right</li>
                <li>Click: Interact</li>
                <li>1-4: Quick Navigation</li>
            </ul>
        `;
        document.getElementById('environment-container').appendChild(controlsHelp);
        
        // Create mission objective UI
        const missionObjective = document.createElement('div');
        missionObjective.className = 'mission-objective';
        missionObjective.innerHTML = `
            <h3>MISSION</h3>
            <p>You are the engineer of this nuclear facility. Enter the Control Room to manage the reactor systems and maintain safe operation.</p>
        `;
        document.getElementById('environment-container').appendChild(missionObjective);
    }

    addLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404050, 0.6);
        this.scene.add(ambientLight);

        // Directional light (like sunlight through windows)
        const directionalLight = new THREE.DirectionalLight(0xffeecc, 0.8);
        directionalLight.position.set(1, 10, 1);
        directionalLight.castShadow = true;
        
        // Set shadow properties for pixelated look
        directionalLight.shadow.mapSize.width = 512;
        directionalLight.shadow.mapSize.height = 512;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        
        this.scene.add(directionalLight);

        // Add some point lights
        this.addPointLight(0, 3, -5, 0x4466cc, 1, 10);
        this.addPointLight(-15, 3, -10, 0xcc4444, 1, 10);
        this.addPointLight(15, 3, -10, 0x44cc44, 1, 10);
    }

    addPointLight(x, y, z, color, intensity, distance) {
        const light = new THREE.PointLight(color, intensity, distance);
        light.position.set(x, y, z);
        light.castShadow = true;
        
        // Set shadow properties for pixelated look
        light.shadow.mapSize.width = 256;
        light.shadow.mapSize.height = 256;
        
        this.scene.add(light);
        
        // Add a small cube to represent the light source (pixel art style)
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.2, 0.2),
            new THREE.MeshBasicMaterial({ color: color })
        );
        cube.position.set(x, y, z);
        this.scene.add(cube);
    }

    loadEnvironment(callback) {
        // In a real application, you would use a 3D model loader here
        // For this example, we'll create a pixel art style environment

        // Update progress indicator
        const loadProgress = document.getElementById('load-progress');
        loadProgress.style.width = '20%';
        
        // Create pixel art textures
        const textureLoader = new THREE.TextureLoader();
        
        // Create floor with pixel art texture
        const floorTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/minecraft/atlas.png', () => {
            loadProgress.style.width = '40%';
        });
        
        // Set texture to nearest-neighbor filtering for pixel art
        floorTexture.magFilter = THREE.NearestFilter;
        floorTexture.minFilter = THREE.NearestFilter;
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(20, 20);
        
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshStandardMaterial({ 
                map: floorTexture,
                roughness: 0.9,
                metalness: 0.1
            })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Create walls with pixel art textures
        const wallTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/minecraft/coal_ore.png');
        wallTexture.magFilter = THREE.NearestFilter;
        wallTexture.minFilter = THREE.NearestFilter;
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(2, 1);
        
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            map: wallTexture,
            roughness: 0.8,
            metalness: 0.2
        });
        
        // Create walls
        this.createWalls(wallMaterial);
        loadProgress.style.width = '60%';

        // Add interaction points
        this.addInteractionPoints();
        loadProgress.style.width = '80%';

        // Add pixel art style decorative elements
        this.addPixelArtDecorations();

        // Finish loading
        setTimeout(() => {
            callback();
        }, 500);
    }

    createWalls(wallMaterial) {
        // Main corridor walls
        this.createWall(-5, 0, -15, 0.2, 3, 30, wallMaterial);  // Left wall
        this.createWall(5, 0, -15, 0.2, 3, 30, wallMaterial);   // Right wall
        this.createWall(0, 0, -30, 10, 3, 0.2, wallMaterial);   // Back wall

        // Control room (right side)
        this.createWall(10, 0, -10, 10, 3, 0.2, wallMaterial);  // Front wall
        this.createWall(20, 0, -15, 0.2, 3, 10, wallMaterial);  // Right wall
        this.createWall(15, 0, -20, 10, 3, 0.2, wallMaterial);  // Back wall
        // Door opening is left open

        // Reactor hall (left side)
        this.createWall(-10, 0, -10, 10, 3, 0.2, wallMaterial); // Front wall
        this.createWall(-20, 0, -15, 0.2, 3, 10, wallMaterial); // Left wall
        this.createWall(-15, 0, -20, 10, 3, 0.2, wallMaterial); // Back wall
        // Door opening is left open

        // Entrance area walls
        this.createWall(-5, 0, 5, 0.2, 3, 10, wallMaterial);    // Left wall
        this.createWall(5, 0, 5, 0.2, 3, 10, wallMaterial);     // Right wall
    }

    createWall(x, y, z, width, height, depth, material) {
        // Create walls with a voxel/pixel art style
        const segmentsW = Math.max(1, Math.floor(width));
        const segmentsH = Math.max(1, Math.floor(height));
        const segmentsD = Math.max(1, Math.floor(depth));
        
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(width, height, depth, segmentsW, segmentsH, segmentsD),
            material
        );
        
        wall.position.set(x, y + height/2, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.scene.add(wall);
        return wall;
    }

    addInteractionPoints() {
        // Create interaction point for Control Room
        this.createInteractionPoint(
            12, 1.5, -10,
            'Enter Control Room',
            () => this.enterControlRoom()
        );

        // Create interaction point for Reactor Hall
        this.createInteractionPoint(
            -12, 1.5, -10,
            'View Reactor Hall',
            () => this.showReactorInfo()
        );

        // Create directional signs
        this.createDirectionalSign(0, 2, -5, 'Control Room →', 0);
        this.createDirectionalSign(0, 2, -5, '← Reactor Hall', Math.PI);
        this.createDirectionalSign(7, 2, -10, 'Control Room →', Math.PI / 2);
        this.createDirectionalSign(-7, 2, -10, '← Reactor Hall', -Math.PI / 2);

        // Create navigation points
        this.createNavigationPoint('Entrance', this.navigationNodes['Entrance']);
        this.createNavigationPoint('Corridor', this.navigationNodes['Corridor']);
        this.createNavigationPoint('Reactor Hall', this.navigationNodes['Reactor Hall']);
        this.createNavigationPoint('Control Room', this.navigationNodes['Control Room']);
    }

    createDirectionalSign(x, y, z, text, rotation) {
        // Create a pixel art style sign
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        // Draw background
        context.fillStyle = '#000000';
        context.fillRect(0, 0, 256, 64);
        
        // Draw border
        context.strokeStyle = '#55ff55';
        context.lineWidth = 4;
        context.strokeRect(4, 4, 248, 56);
        
        // Draw text
        context.font = '16px "Press Start 2P", monospace';
        context.fillStyle = '#55ff55';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 128, 32);
        
        // Convert to texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        
        // Create sign mesh
        const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 0.5),
            new THREE.MeshBasicMaterial({ 
                map: texture,
                transparent: true
            })
        );
        
        sign.position.set(x, y, z);
        sign.rotation.y = rotation;
        this.scene.add(sign);
    }

    createInteractionPoint(x, y, z, prompt, action) {
        // Create a pixel art style interaction marker
        const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x55ff55,
            transparent: true,
            opacity: 0.7
        });
        
        const point = new THREE.Mesh(geometry, material);
        point.position.set(x, y, z);
        
        // Add a pulsing animation
        point.userData = { 
            baseScale: 1,
            pulseSpeed: 1 + Math.random() * 0.5
        };
        
        this.scene.add(point);
        
        // Add to interaction points array
        this.interactionPoints.push({
            mesh: point,
            prompt: prompt,
            action: action
        });
        
        return point;
    }

    createNavigationPoint(locationName, nodeData) {
        // Create an invisible marker for navigation
        const geometry = new THREE.BoxGeometry(2, 0.1, 2);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x0088ff,
            opacity: 0.0,
            transparent: true
        });
        
        const navPoint = new THREE.Mesh(geometry, material);
        navPoint.position.copy(nodeData.position);
        navPoint.position.y = 0.1; // Just above the floor
        
        this.scene.add(navPoint);
        
        // No need to add these to interaction points as they're handled differently
        return navPoint;
    }

    addPixelArtDecorations() {
        // Add pixel art style computers in the control room
        const computerGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.5);
        const screenMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x55ff55,
            emissive: 0x33aa33,
            emissiveIntensity: 0.5
        });
        const caseMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        for (let i = 0; i < 3; i++) {
            // Computer case
            const computer = new THREE.Mesh(computerGeometry, caseMaterial);
            computer.position.set(15 - i * 2, 1, -15);
            computer.castShadow = true;
            computer.receiveShadow = true;
            this.scene.add(computer);
            
            // Computer screen
            const screen = new THREE.Mesh(
                new THREE.BoxGeometry(0.7, 0.4, 0.05),
                screenMaterial
            );
            screen.position.set(15 - i * 2, 1.25, -14.75);
            this.scene.add(screen);
        }
        
        // Add reactor core visualization in the reactor hall with pixelated glow
        const coreGeometry = new THREE.BoxGeometry(2, 3, 2);
        const coreMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x88aaff,
            emissive: 0x2244aa,
            emissiveIntensity: 0.8
        });
        
        const reactorCore = new THREE.Mesh(coreGeometry, coreMaterial);
        reactorCore.position.set(-15, 1.5, -15);
        reactorCore.castShadow = true;
        this.scene.add(reactorCore);
        
        // Add glowing rods in the reactor
        for (let i = 0; i < 5; i++) {
            const rodGeometry = new THREE.BoxGeometry(0.2, 2.5, 0.2);
            const rodMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00ffff, 
                transparent: true,
                opacity: 0.7
            });
            
            const rod = new THREE.Mesh(rodGeometry, rodMaterial);
            const angle = (i / 5) * Math.PI * 2;
            const radius = 0.7;
            
            rod.position.set(
                -15 + Math.cos(angle) * radius,
                1.5,
                -15 + Math.sin(angle) * radius
            );
            
            this.scene.add(rod);
        }
        
        // Add pixel art style control panels
        const panelGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.8);
        const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        const buttonGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const redButtonMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const greenButtonMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const blueButtonMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        
        for (let i = 0; i < 2; i++) {
            // Panel base
            const controlPanel = new THREE.Mesh(panelGeometry, panelMaterial);
            controlPanel.position.set(13 + i * 2, 1, -17);
            controlPanel.rotation.x = -Math.PI / 4;
            controlPanel.castShadow = true;
            this.scene.add(controlPanel);
            
            // Add buttons and indicators in a grid pattern
            for (let x = 0; x < 3; x++) {
                for (let z = 0; z < 2; z++) {
                    let buttonMaterial;
                    
                    // Alternate button colors for visual appeal
                    if ((x + z) % 3 === 0) {
                        buttonMaterial = redButtonMaterial;
                    } else if ((x + z) % 3 === 1) {
                        buttonMaterial = greenButtonMaterial;
                    } else {
                        buttonMaterial = blueButtonMaterial;
                    }
                    
                    const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
                    
                    // Position on the control panel
                    const localX = -0.5 + x * 0.5;
                    const localZ = -0.25 + z * 0.5;
                    
                    // Apply panel rotation to position buttons correctly
                    const angle = -Math.PI / 4; // Same angle as panel
                    
                    button.position.set(
                        13 + i * 2 + localX,
                        1 + Math.sin(angle) * localZ + 0.05,
                        -17 + Math.cos(angle) * localZ
                    );
                    
                    this.scene.add(button);
                }
            }
        }
        
        // Add pixelated warning signs
        this.createPixelArtSign(-18, 2, -15, "DANGER", 0xff0000, Math.PI / 2);
        this.createPixelArtSign(18, 2, -15, "CONTROL", 0x00ff00, -Math.PI / 2);
    }
    
    createPixelArtSign(x, y, z, text, color, rotation) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Fill background with black
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 128, 64);
        
        // Draw pixelated border
        ctx.fillStyle = color.toString(16).padStart(6, '0');
        
        // Top and bottom borders
        for (let i = 0; i < 128; i += 8) {
            ctx.fillRect(i, 0, 8, 8); // Top border
            ctx.fillRect(i, 56, 8, 8); // Bottom border
        }
        
        // Left and right borders
        for (let i = 8; i < 56; i += 8) {
            ctx.fillRect(0, i, 8, 8); // Left border
            ctx.fillRect(120, i, 8, 8); // Right border
        }
        
        // Draw pixelated text
        ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        
        const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 0.75),
            new THREE.MeshBasicMaterial({
                map: texture,
                transparent: false
            })
        );
        
        sign.position.set(x, y, z);
        sign.rotation.y = rotation;
        this.scene.add(sign);
        
        return sign;
    }

    showAlarmInEnvironment(system) {
        // Create a flashing alarm light based on the system that's having issues
        let position, color;
        
        switch(system) {
            case 'temperature':
                position = new THREE.Vector3(15, 2.5, -10);
                color = 0xff0000; // Red
                break;
            case 'pressure':
                position = new THREE.Vector3(14, 2.5, -10);
                color = 0xffff00; // Yellow
                break;
            case 'radiation':
                position = new THREE.Vector3(16, 2.5, -10);
                color = 0x00ff00; // Green
                break;
            default:
                position = new THREE.Vector3(15, 2.5, -10);
                color = 0xff0000;
                break;
        }
        
        // Create alarm light
        const alarmLight = new THREE.PointLight(color, 1, 10);
        alarmLight.position.copy(position);
        this.scene.add(alarmLight);
        
        // Create light housing
        const lightHousing = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 0.3),
            new THREE.MeshBasicMaterial({ color: color })
        );
        lightHousing.position.copy(position);
        this.scene.add(lightHousing);
        
        // Flash the alarm
        let intensity = 0;
        let increasing = true;
        const flashInterval = setInterval(() => {
            if (increasing) {
                intensity += 0.1;
                if (intensity >= 1) {
                    increasing = false;
                }
            } else {
                intensity -= 0.1;
                if (intensity <= 0) {
                    increasing = true;
                }
            }
            
            alarmLight.intensity = intensity;
            
        }, 100);
        
        // Remove after 10 seconds
        setTimeout(() => {
            clearInterval(flashInterval);
            this.scene.remove(alarmLight);
            this.scene.remove(lightHousing);
        }, 10000);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
        
        // Update pixel cursor position
        if (this.pixelCursor) {
            this.pixelCursor.style.left = `${event.clientX - 8}px`;
            this.pixelCursor.style.top = `${event.clientY - 8}px`;
        }
    }

    onClick(event) {
        if (!this.isLoaded) return;
        
        // Check if we clicked on an interaction point
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const intersects = this.raycaster.intersectObjects(
            this.interactionPoints.map(point => point.mesh)
        );
        
        if (intersects.length > 0) {
            const index = this.interactionPoints.findIndex(point => point.mesh === intersects[0].object);
            if (index !== -1) {
                this.interactionPoints[index].action();
            }
        }
    }

    onKeyDown(event) {
        switch(event.key) {
            case 'w':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 's':
            case 'ArrowDown':
                this.keys.backward = true;
                break;
            case 'a':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'd':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'q':
                this.keys.turnLeft = true;
                break;
            case 'e':
                this.keys.turnRight = true;
                break;
            case '1':
                this.navigateTo('Entrance');
                break;
            case '2':
                this.navigateTo('Corridor');
                break;
            case '3':
                this.navigateTo('Reactor Hall');
                break;
            case '4':
                this.navigateTo('Control Room');
                break;
        }
    }

    onKeyUp(event) {
        switch(event.key) {
            case 'w':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 's':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'a':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'd':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'q':
                this.keys.turnLeft = false;
                break;
            case 'e':
                this.keys.turnRight = false;
                break;
        }
    }

    moveForward(distance) {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        const movement = direction.multiplyScalar(distance);
        const newPosition = this.camera.position.clone().add(movement);
        
        // Basic collision detection - prevent walking through walls
        if (this.isPositionValid(newPosition)) {
            this.camera.position.add(movement);
            this.updateCurrentLocation();
        }
    }

    moveRight(distance) {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        const right = new THREE.Vector3();
        right.crossVectors(this.camera.up, direction).normalize();
        
        const movement = right.multiplyScalar(distance);
        const newPosition = this.camera.position.clone().add(movement);
        
        // Basic collision detection - prevent walking through walls
        if (this.isPositionValid(newPosition)) {
            this.camera.position.add(movement);
            this.updateCurrentLocation();
        }
    }

    rotateCamera(angle) {
        this.camera.rotation.y += angle;
    }

    isPositionValid(position) {
        // Simple bounding box collision detection
        
        // Keep player within general bounds
        if (position.x < -19 || position.x > 19 || position.z < -29 || position.z > 9) {
            return false;
        }
        
        // Entrance corridor bounds
        if (position.z > -9 && (position.x < -4.8 || position.x > 4.8)) {
            return false;
        }
        
        // Main corridor bounds
        if (position.z < -9 && position.z > -29 && (position.x < -4.8 || position.x > 4.8) &&
            !(position.x < -4.8 && position.x > -15.2 && position.z > -12 && position.z < -8) && // Reactor hall entrance
            !(position.x > 4.8 && position.x < 15.2 && position.z > -12 && position.z < -8)) {    // Control room entrance
            return false;
        }
        
        // Control room bounds (right wing)
        if (position.x > 9.8 && position.x < 19.8 && 
            ((position.z < -9.8 && position.z > -19.8) || 
             (position.z < -10.2 && position.z > -19.8))) {
            return false;
        }
        
        // Reactor hall bounds (left wing)
        if (position.x < -9.8 && position.x > -19.8 && 
            ((position.z < -9.8 && position.z > -19.8) || 
             (position.z < -10.2 && position.z > -19.8))) {
            return false;
        }
        
        return true;
    }

    updateCurrentLocation() {
        // Determine which area the player is in based on position
        const position = this.camera.position;
        
        if (position.z > -5) {
            this.currentLocation = 'Entrance';
        } else if (position.z < -5 && position.z > -20 && position.x > -5 && position.x < 5) {
            this.currentLocation = 'Corridor';
        } else if (position.x < -5) {
            this.currentLocation = 'Reactor Hall';
        } else if (position.x > 5) {
            this.currentLocation = 'Control Room';
        }
        
        document.getElementById('current-location').textContent = this.currentLocation;
    }

    navigateTo(location) {
        if (this.navigationNodes[location]) {
            const node = this.navigationNodes[location];
            this.camera.position.copy(node.position);
            this.camera.rotation.y = node.rotation;
            this.currentLocation = location;
            document.getElementById('current-location').textContent = this.currentLocation;
        }
    }

    enterControlRoom() {
        document.getElementById('environment-container').style.display = 'none';
        document.getElementById('simulator-container').style.display = 'block';
    }

    showReactorInfo() {
        alert('REACTOR HALL\n\nThis is the heart of the nuclear facility where the reactor core is contained. The core is surrounded by thick concrete walls to shield radiation.\n\nThe reactor is currently running within normal parameters, but requires constant monitoring from the control room.');
    }

    checkInteraction() {
        // Check if any interaction points are being hovered
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const intersects = this.raycaster.intersectObjects(
            this.interactionPoints.map(point => point.mesh)
        );
        
        const promptElement = document.getElementById('interaction-prompt');
        
        if (intersects.length > 0) {
            const index = this.interactionPoints.findIndex(point => point.mesh === intersects[0].object);
            if (index !== -1) {
                promptElement.textContent = this.interactionPoints[index].prompt + ' (click)';
            }
        } else {
            promptElement.textContent = '';
        }
    }

    animateInteractionPoints(deltaTime) {
        // Make interaction points pulse
        this.interactionPoints.forEach(point => {
            const userData = point.mesh.userData;
            const scale = userData.baseScale + 0.1 * Math.sin(this.clock.elapsedTime * userData.pulseSpeed * 2);
            point.mesh.scale.set(scale, scale, scale);
        });
    }

    animate() {
        if (!this.isLoaded) return;
        
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        // Check for hover over interaction points
        this.checkInteraction();
        
        // Animate interaction points
        this.animateInteractionPoints(delta);
        
        // Handle keyboard input for movement
        const moveSpeed = 0.1;
        const rotateSpeed = 0.03;
        
        if (this.keys.forward) this.moveForward(moveSpeed);
        if (this.keys.backward) this.moveForward(-moveSpeed);
        if (this.keys.left) this.rotateCamera(rotateSpeed);
        if (this.keys.right) this.rotateCamera(-rotateSpeed);
        if (this.keys.turnLeft) this.moveRight(-moveSpeed);
        if (this.keys.turnRight) this.moveRight(moveSpeed);
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the environment when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    const environment = new NuclearFacilityEnvironment();
});
