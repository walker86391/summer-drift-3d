// ==========================================================================
// CYBER DRIFT // SUMMER DESERT ISLAND 3D RACING ENGINE
// Top-Down Following Camera, Real Drift Physics, Interactable Props & Day Island
// ==========================================================================

class CyberRacingEngine {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.minimapCanvas = document.getElementById("minimap-canvas");
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext("2d") : null;

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Car & Physics
    this.carGroup = null;
    this.carBody = null;
    this.wheels = [];
    this.frontWheelPivots = [];
    this.underglowLight = null;

    // Physics State
    this.carPos = new THREE.Vector3(0, 0.45, -20);
    this.carVelocity = new THREE.Vector3(0, 0, 0); // Real 2D/3D velocity vector
    this.carHeading = 0; // heading angle in radians
    this.carSteerAngle = 0;
    this.speed = 0;
    this.maxSpeed = 1.35;
    this.maxReverseSpeed = -0.45;
    this.enginePower = 0.026;
    this.brakeForce = 0.055;
    this.rollingFriction = 0.982;
    this.lateralFriction = 0.94; // normal tire grip
    this.driftLateralFriction = 0.38; // slip grip during drift
    this.turnRate = 0.042;
    this.isDrifting = false;
    this.isBoosting = false;
    this.boostTimer = 0;

    // Input State
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      drift: false
    };

    // Top-Down Following Camera Setup
    // Elevated top-down view looking down at the car (Bruno Simon style)
    this.camElevation = 24;
    this.camDistance = 18;
    this.currentCamPos = new THREE.Vector3(0, 24, -38);
    this.camLookTarget = new THREE.Vector3(0, 0, -20);

    // World & Checkpoints
    this.stations = [];
    this.activeStation = null;
    this.clouds = [];
    this.oceanWater = null;
    this.boostPads = [];
    this.skillPickups = [];
    this.collectedSkills = 0;
    this.particles = [];
    this.skidmarks = [];

    // Interactive Physics Objects (Beach balls, crates, cones)
    this.physicsProps = [];

    // Callbacks
    this.onStationDetected = null;
    this.onStationLeft = null;
    this.onStationEnter = null;
    this.onSpeedUpdate = null;
    this.onSkillCollected = null;

    // Car Customization
    this.carColor = 0xff6b6b; // Summer coral/red or turquoise
  }

  init() {
    this.setupScene();
    this.setupLights();
    this.setupSummerIslandTerrain();
    this.buildCar();
    this.setupInteractableProps();
    this.setupStations();
    this.setupBoostPads();
    this.setupSkillCoconuts();
    this.setupPalmTreesAndBeachDecor();
    this.setupSummerClouds();
    this.setupControls();
    this.setupResize();

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    console.log("[SummerEngine] 3D Desert Island & Top-Down Camera initialized.");
  }

  // ==========================================================================
  // SCENE & DAYLIGHT SETUP
  // ==========================================================================
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x70c5ff); // Sunny summer blue sky
    this.scene.fog = new THREE.FogExp2(0xbbe3ff, 0.0035); // Soft summer ocean mist

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 800);
    this.camera.position.set(0, this.camElevation, -38);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  setupLights() {
    // Hemisphere light (Warm blue sky + golden sand bounce)
    const hemiLight = new THREE.HemisphereLight(0x90e0ef, 0xf4cf85, 1.4);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    // Main Summer Sun
    const sunLight = new THREE.DirectionalLight(0xfffae5, 1.8);
    sunLight.position.set(60, 90, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 300;
    const d = 120;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;
    this.scene.add(sunLight);

    // Warm ambient fill
    const ambient = new THREE.AmbientLight(0xfff3d6, 0.6);
    this.scene.add(ambient);
  }

  // ==========================================================================
  // DESERT ISLAND & OCEAN WATER TERRAIN
  // ==========================================================================
  setupSummerIslandTerrain() {
    // 1. Crystal Turquoise Ocean Water (Surrounding the island)
    const oceanGeo = new THREE.PlaneGeometry(800, 800, 32, 32);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x00b4d8,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.88
    });
    this.oceanWater = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanWater.position.y = -0.3;
    this.scene.add(this.oceanWater);

    // 2. Golden Sand Island Ground
    const sandGeo = new THREE.CircleGeometry(160, 64);
    sandGeo.rotateX(-Math.PI / 2);
    const sandTexture = this.generateSandTexture();
    sandTexture.wrapS = THREE.RepeatWrapping;
    sandTexture.wrapT = THREE.RepeatWrapping;
    sandTexture.repeat.set(40, 40);

    const sandMat = new THREE.MeshStandardMaterial({
      color: 0xf4cf85, // warm golden beach sand
      roughness: 0.9,
      metalness: 0.05,
      map: sandTexture
    });
    const sandIsland = new THREE.Mesh(sandGeo, sandMat);
    sandIsland.receiveShadow = true;
    sandIsland.position.y = 0;
    this.scene.add(sandIsland);

    // 3. White shoreline foam ring
    const foamGeo = new THREE.RingGeometry(158, 164, 64);
    foamGeo.rotateX(-Math.PI / 2);
    const foamMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const foamMesh = new THREE.Mesh(foamGeo, foamMat);
    foamMesh.position.y = -0.15;
    this.scene.add(foamMesh);

    // 4. Coastal Wood Plank & Asphalt Driving Track
    this.buildCoastalCircuit();
  }

  generateSandTexture() {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#f4cf85";
    ctx.fillRect(0, 0, size, size);

    // Subtle sand grain noise
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const brightness = Math.random() > 0.5 ? "rgba(255,255,255,0.18)" : "rgba(180,130,60,0.14)";
      ctx.fillStyle = brightness;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    return new THREE.CanvasTexture(canvas);
  }

  buildCoastalCircuit() {
    const trackPoints = [
      new THREE.Vector3(0, 0.05, -60),
      new THREE.Vector3(55, 0.05, -45),
      new THREE.Vector3(75, 0.05, 15),
      new THREE.Vector3(50, 0.05, 65),
      new THREE.Vector3(0, 0.05, 90),
      new THREE.Vector3(-50, 0.05, 65),
      new THREE.Vector3(-75, 0.05, 15),
      new THREE.Vector3(-55, 0.05, -45)
    ];

    const curve = new THREE.CatmullRomCurve3(trackPoints, true);
    const points = curve.getPoints(200);

    const roadWidth = 14;
    const roadGeo = new THREE.BufferGeometry();
    const vertices = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const nextP = points[(i + 1) % points.length];
      const dir = new THREE.Vector3().subVectors(nextP, p).normalize();
      const normal = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

      const left = new THREE.Vector3().copy(p).addScaledVector(normal, roadWidth / 2);
      const right = new THREE.Vector3().copy(p).addScaledVector(normal, -roadWidth / 2);

      vertices.push(left.x, left.y + 0.02, left.z);
      vertices.push(right.x, right.y + 0.02, right.z);

      const u = (i / points.length) * 20;
      uvs.push(0, u);
      uvs.push(1, u);

      if (i < points.length - 1) {
        const i2 = i * 2;
        indices.push(i2, i2 + 1, i2 + 2);
        indices.push(i2 + 1, i2 + 3, i2 + 2);
      }
    }
    const last = (points.length - 1) * 2;
    indices.push(last, last + 1, 0);
    indices.push(last + 1, 1, 0);

    roadGeo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    roadGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    // Cedar Wood Plank Boardwalk material
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0xc89658, // warm wooden planks
      roughness: 0.8,
      metalness: 0.1
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    this.scene.add(roadMesh);

    // White rope curbs
    this.createBoardwalkBorder(curve, roadWidth / 2 + 0.2, 0xffffff);
    this.createBoardwalkBorder(curve, -roadWidth / 2 - 0.2, 0xffffff);
  }

  createBoardwalkBorder(curve, offset, colorHex) {
    const points = curve.getPoints(140);
    const borderPoints = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const nextP = points[(i + 1) % points.length];
      const dir = new THREE.Vector3().subVectors(nextP, p).normalize();
      const normal = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
      const pt = new THREE.Vector3().copy(p).addScaledVector(normal, offset);
      pt.y = 0.15;
      borderPoints.push(pt);
    }
    borderPoints.push(borderPoints[0]);

    const lineGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: colorHex,
      linewidth: 3
    });
    const borderLine = new THREE.Line(lineGeo, lineMat);
    this.scene.add(borderLine);
  }

  // ==========================================================================
  // 3D CAR BUILDER (SUMMER SPORTS CABRIOLET)
  // ==========================================================================
  buildCar() {
    this.carGroup = new THREE.Group();
    this.carGroup.position.copy(this.carPos);

    // Car Body Material
    const bodyMat = new THREE.MeshStandardMaterial({
      color: this.carColor,
      roughness: 0.2,
      metalness: 0.7
    });

    // Main wedge sports body
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.48, 3.8);
    this.carBody = new THREE.Mesh(bodyGeo, bodyMat);
    this.carBody.position.y = 0.38;
    this.carBody.castShadow = true;
    this.carBody.receiveShadow = true;
    this.carGroup.add(this.carBody);

    // Cockpit / Open Top Windshield
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x223344,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.7
    });
    const windshieldGeo = new THREE.BoxGeometry(1.4, 0.38, 1.2);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 0.72, 0.1);
    windshield.castShadow = true;
    this.carGroup.add(windshield);

    // Driver Roll Bar (Summer convertible)
    const rollBarMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.2 });
    const rollBarGeo = new THREE.TorusGeometry(0.55, 0.06, 8, 16, Math.PI);
    const rollBar = new THREE.Mesh(rollBarGeo, rollBarMat);
    rollBar.position.set(0, 0.75, -0.6);
    rollBar.rotation.y = Math.PI;
    this.carGroup.add(rollBar);

    // Headlights (Warm bright sun lamps)
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const headGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 12);
    headGeo.rotateX(Math.PI / 2);
    const headL = new THREE.Mesh(headGeo, headMat);
    headL.position.set(-0.6, 0.4, 1.91);
    const headR = new THREE.Mesh(headGeo, headMat);
    headR.position.set(0.6, 0.4, 1.91);
    this.carGroup.add(headL, headR);

    // Taillights
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2244 });
    const tailGeo = new THREE.BoxGeometry(1.6, 0.1, 0.08);
    const tailBar = new THREE.Mesh(tailGeo, tailMat);
    tailBar.position.set(0, 0.45, -1.91);
    this.carGroup.add(tailBar);

    // Fake Shadow blob under car
    const shadowGeo = new THREE.PlaneGeometry(2.3, 4.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x1a2e3b,
      transparent: true,
      opacity: 0.4,
      depthWrite: false
    });
    const carShadow = new THREE.Mesh(shadowGeo, shadowMat);
    carShadow.rotation.x = -Math.PI / 2;
    carShadow.position.y = 0.04;
    this.carGroup.add(carShadow);

    // 4 Wheels
    this.wheels = [];
    this.frontWheelPivots = [];
    const wheelPositions = [
      { x: -0.96, y: 0.34, z: 1.15, isFront: true },
      { x: 0.96, y: 0.34, z: 1.15, isFront: true },
      { x: -0.96, y: 0.36, z: -1.2, isFront: false },
      { x: 0.96, y: 0.36, z: -1.2, isFront: false }
    ];

    wheelPositions.forEach((wp) => {
      const pivot = new THREE.Group();
      pivot.position.set(wp.x, wp.y, wp.z);

      const wheelMesh = this.createWheelMesh(wp.isFront ? 0.34 : 0.36);
      pivot.add(wheelMesh);

      this.carGroup.add(pivot);
      this.wheels.push(wheelMesh);
      if (wp.isFront) {
        this.frontWheelPivots.push(pivot);
      }
    });

    this.scene.add(this.carGroup);
  }

  createWheelMesh(radius) {
    const wheelGroup = new THREE.Group();

    // Tire
    const tireGeo = new THREE.CylinderGeometry(radius, radius, 0.35, 18);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.9,
      metalness: 0.1
    });
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    wheelGroup.add(tire);

    // White / Chrome Rim
    const rimGeo = new THREE.CylinderGeometry(radius * 0.65, radius * 0.65, 0.36, 12);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.9,
      roughness: 0.15
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wheelGroup.add(rim);

    return wheelGroup;
  }

  updateCarColor(hexColor) {
    this.carColor = hexColor;
    if (this.carBody && this.carBody.material) {
      this.carBody.material.color.setHex(hexColor);
    }
  }

  // ==========================================================================
  // INTERACTABLE 3D PHYSICS PROPS (BEACH BALLS, CRATES, CONES)
  // Ram them with the car to watch them tumble, roll, and bounce!
  // ==========================================================================
  setupInteractableProps() {
    this.physicsProps = [];

    // 1. Beach Balls (Light, bouncy, rolling)
    const ballColors = [0xff6b6b, 0x00b4d8, 0xffb703, 0x2a9d8f];
    const ballPositions = [
      new THREE.Vector3(12, 0.9, -15),
      new THREE.Vector3(-14, 0.9, 25),
      new THREE.Vector3(25, 0.9, 45),
      new THREE.Vector3(-28, 0.9, -35)
    ];

    ballPositions.forEach((pos, idx) => {
      const radius = 0.95;
      const geo = new THREE.SphereGeometry(radius, 20, 20);
      const mat = new THREE.MeshStandardMaterial({
        color: ballColors[idx % ballColors.length],
        roughness: 0.3,
        metalness: 0.1
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      this.physicsProps.push({
        type: "ball",
        mesh: mesh,
        pos: pos.clone(),
        vel: new THREE.Vector3(0, 0, 0),
        radius: radius,
        mass: 0.4,
        restitution: 0.75, // bouncy
        friction: 0.985
      });
    });

    // 2. Wooden Cargo Crates (Stacked boxes on track corners)
    const cratePositions = [
      new THREE.Vector3(38, 0.6, -25),
      new THREE.Vector3(40, 0.6, -23),
      new THREE.Vector3(39, 1.6, -24), // stacked
      new THREE.Vector3(-42, 0.6, 35),
      new THREE.Vector3(-44, 0.6, 37),
      new THREE.Vector3(0, 0.6, 75)
    ];

    const crateGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0x9c6644,
      roughness: 0.85,
      metalness: 0.1
    });

    cratePositions.forEach((pos) => {
      const mesh = new THREE.Mesh(crateGeo, crateMat);
      mesh.position.copy(pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      this.physicsProps.push({
        type: "crate",
        mesh: mesh,
        pos: pos.clone(),
        vel: new THREE.Vector3(0, 0, 0),
        radius: 0.85,
        mass: 1.2,
        restitution: 0.35,
        friction: 0.96
      });
    });
  }

  updatePhysicsProps(delta) {
    for (const prop of this.physicsProps) {
      // 1. Move by velocity
      prop.pos.x += prop.vel.x;
      prop.pos.z += prop.vel.z;
      prop.pos.y += prop.vel.y;

      // Gravity for bounced objects
      const groundY = prop.type === "ball" ? prop.radius : 0.6;
      if (prop.pos.y > groundY) {
        prop.vel.y -= 0.015; // gravity
      } else {
        prop.pos.y = groundY;
        if (Math.abs(prop.vel.y) > 0.05) {
          prop.vel.y = -prop.vel.y * prop.restitution;
        } else {
          prop.vel.y = 0;
        }
      }

      // Rolling & sliding friction
      prop.vel.x *= prop.friction;
      prop.vel.z *= prop.friction;

      // Mesh rotation when rolling
      if (prop.type === "ball") {
        prop.mesh.rotation.x += prop.vel.z * 1.5;
        prop.mesh.rotation.z -= prop.vel.x * 1.5;
      }

      prop.mesh.position.copy(prop.pos);

      // 2. Collision with Player Car
      const distToCar = this.carPos.distanceTo(prop.pos);
      const carRadius = 1.6;
      const collisionDist = carRadius + prop.radius;

      if (distToCar < collisionDist) {
        // Impact vector from car to prop
        const impactDir = new THREE.Vector3().subVectors(prop.pos, this.carPos).normalize();
        const carSpeedMag = Math.max(Math.abs(this.speed), 0.2);

        // Impulse force
        const force = (carSpeedMag * 1.2) / prop.mass;
        prop.vel.x += impactDir.x * force;
        prop.vel.z += impactDir.z * force;
        prop.vel.y += force * 0.45; // slight pop in the air

        // Sound effect & particles
        if (window.cyberAudio) window.cyberAudio.playSkillPickup();
        this.createSandSplash(prop.pos);

        // Slight push back on car
        this.speed *= 0.88;
      }
    }
  }

  // ==========================================================================
  // PALM TREES & BEACH DECORATIONS
  // ==========================================================================
  setupPalmTreesAndBeachDecor() {
    const palmPositions = [
      new THREE.Vector3(20, 0, -50),
      new THREE.Vector3(-25, 0, -50),
      new THREE.Vector3(65, 0, -10),
      new THREE.Vector3(60, 0, 30),
      new THREE.Vector3(-65, 0, -10),
      new THREE.Vector3(-60, 0, 30),
      new THREE.Vector3(25, 0, 75),
      new THREE.Vector3(-25, 0, 75),
      new THREE.Vector3(0, 0, 110)
    ];

    palmPositions.forEach((pos) => {
      this.createPalmTree(pos);
    });

    // Striped Beach Umbrellas & Surfboards
    this.createBeachUmbrella(new THREE.Vector3(15, 0, -30), 0xff6b6b);
    this.createBeachUmbrella(new THREE.Vector3(-18, 0, -32), 0x00b4d8);
    this.createBeachUmbrella(new THREE.Vector3(30, 0, 15), 0xffb703);

    this.createSurfboard(new THREE.Vector3(13, 0, -28), 0x00b4d8);
    this.createSurfboard(new THREE.Vector3(-16, 0, -30), 0xff6b6b);
  }

  createPalmTree(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Curved Trunk (3 stacked cylinders)
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.9,
      metalness: 0.1
    });

    const trunk1 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 3, 8), trunkMat);
    trunk1.position.y = 1.5;
    trunk1.castShadow = true;

    const trunk2 = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 3, 8), trunkMat);
    trunk2.position.set(0.3, 4.2, 0);
    trunk2.rotation.z = -0.12;
    trunk2.castShadow = true;

    const trunk3 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 3, 8), trunkMat);
    trunk3.position.set(0.7, 6.8, 0);
    trunk3.rotation.z = -0.18;
    trunk3.castShadow = true;

    group.add(trunk1, trunk2, trunk3);

    // Palm Fronds (Vibrant tropical leaves)
    const frondMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f,
      roughness: 0.6,
      side: THREE.DoubleSide
    });
    const frondCount = 7;
    for (let i = 0; i < frondCount; i++) {
      const angle = (i / frondCount) * Math.PI * 2;
      const frondGeo = new THREE.PlaneGeometry(1.6, 5.2);
      frondGeo.translate(0, 2.5, 0);
      const frond = new THREE.Mesh(frondGeo, frondMat);
      frond.position.set(0.8, 8.2, 0);
      frond.rotation.y = angle;
      frond.rotation.x = 0.85;
      frond.castShadow = true;
      group.add(frond);
    }

    // Coconuts
    const cocoMat = new THREE.MeshStandardMaterial({ color: 0x582f0e, roughness: 0.8 });
    const cocoGeo = new THREE.SphereGeometry(0.35, 8, 8);
    for (let c = 0; c < 3; c++) {
      const coco = new THREE.Mesh(cocoGeo, cocoMat);
      coco.position.set(0.8 + Math.cos(c * 2) * 0.4, 8.0, Math.sin(c * 2) * 0.4);
      group.add(coco);
    }

    this.scene.add(group);
  }

  createBeachUmbrella(pos, colorHex) {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Pole
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.8 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4, 8), poleMat);
    pole.position.y = 2;
    pole.castShadow = true;
    group.add(pole);

    // Parasol Canopy
    const canopyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4 });
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.2, 16), canopyMat);
    canopy.position.y = 3.8;
    canopy.castShadow = true;
    group.add(canopy);

    this.scene.add(group);
  }

  createSurfboard(pos, colorHex) {
    const geo = new THREE.BoxGeometry(0.5, 2.8, 0.12);
    const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.2 });
    const board = new THREE.Mesh(geo, mat);
    board.position.set(pos.x, 1.2, pos.z);
    board.rotation.z = 0.2;
    board.rotation.y = 0.5;
    board.castShadow = true;
    this.scene.add(board);
  }

  setupSummerClouds() {
    this.clouds = [];
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      transparent: true,
      opacity: 0.9
    });

    for (let i = 0; i < 12; i++) {
      const cloudGroup = new THREE.Group();
      const numPuffs = 3 + Math.floor(Math.random() * 3);

      for (let p = 0; p < numPuffs; p++) {
        const puffGeo = new THREE.SphereGeometry(6 + Math.random() * 4, 8, 8);
        const puff = new THREE.Mesh(puffGeo, cloudMat);
        puff.position.set(p * 5, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3);
        cloudGroup.add(puff);
      }

      const x = (Math.random() - 0.5) * 400;
      const z = (Math.random() - 0.5) * 400;
      const y = 45 + Math.random() * 20;
      cloudGroup.position.set(x, y, z);
      this.scene.add(cloudGroup);
      this.clouds.push(cloudGroup);
    }
  }

  // ==========================================================================
  // STATIONS / CHECKPOINTS (SUMMER ISLAND CABANAS)
  // ==========================================================================
  setupStations() {
    this.stations = [
      {
        id: "about",
        name: "About Me",
        title: "ABOUT // CABANA",
        pos: new THREE.Vector3(0, 0, -45),
        radius: 12,
        color: 0x00b4d8,
        icon: "🏖️",
        desc: "Meet the creator, philosophy & summer vibes"
      },
      {
        id: "projects",
        name: "Projects",
        title: "PROJECTS // MARINA",
        pos: new THREE.Vector3(70, 0, 15),
        radius: 14,
        color: 0x2a9d8f,
        icon: "🚀",
        desc: "Interactive open-source builds & engineering dock"
      },
      {
        id: "skills",
        name: "Skills",
        title: "SKILLS // COCONUT GROVE",
        pos: new THREE.Vector3(0, 0, 75),
        radius: 14,
        color: 0xffb703,
        icon: "🥥",
        desc: "Collect power-ups & mastery tokens across the dunes"
      },
      {
        id: "socials",
        name: "Socials",
        title: "SOCIAL // SURF SHACK",
        pos: new THREE.Vector3(-70, 0, 15),
        radius: 14,
        color: 0xff6b6b,
        icon: "🏄",
        desc: "GitHub, X, Discord & direct channels"
      },
      {
        id: "vibe",
        name: "Music / Vibe",
        title: "TIKI // BOOMBOX BAR",
        pos: new THREE.Vector3(0, 0, -95),
        radius: 12,
        color: 0x7209b7,
        icon: "📻",
        desc: "Chill summer lofi & audio deck"
      }
    ];

    this.stationObjects = [];

    this.stations.forEach((st) => {
      const group = new THREE.Group();
      group.position.copy(st.pos);

      // 1. Sand Checkpoint Ring
      const ringGeo = new THREE.RingGeometry(st.radius * 0.85, st.radius, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: st.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.y = 0.05;
      group.add(ringMesh);

      // 2. Bamboo / Wooden Gateway Arch
      const woodMat = new THREE.MeshStandardMaterial({
        color: 0xa06d3b,
        roughness: 0.85,
        metalness: 0.1
      });
      const postGeo = new THREE.CylinderGeometry(0.5, 0.6, 9, 8);
      const postL = new THREE.Mesh(postGeo, woodMat);
      postL.position.set(-st.radius * 0.6, 4.5, 0);
      postL.castShadow = true;

      const postR = new THREE.Mesh(postGeo, woodMat);
      postR.position.set(st.radius * 0.6, 4.5, 0);
      postR.castShadow = true;

      const beamGeo = new THREE.CylinderGeometry(0.4, 0.4, st.radius * 1.35, 8);
      beamGeo.rotateZ(Math.PI / 2);
      const beam = new THREE.Mesh(beamGeo, woodMat);
      beam.position.set(0, 9, 0);
      beam.castShadow = true;

      group.add(postL, postR, beam);

      // 3. Wooden Surfboard Hanging Sign
      const sign = this.createWoodenSurfSign(st.title, st.icon, st.color);
      sign.position.set(0, 11, 0);
      group.add(sign);

      this.scene.add(group);
      this.stationObjects.push({
        data: st,
        group: group,
        sign: sign,
        initialY: 11
      });
    });
  }

  createWoodenSurfSign(text, icon, colorHex) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");

    // Warm white beach card
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.roundRect(10, 10, 492, 140, 24);
    ctx.fill();

    const colorStr = "#" + colorHex.toString(16).padStart(6, "0");
    ctx.strokeStyle = colorStr;
    ctx.lineWidth = 6;
    ctx.roundRect(10, 10, 492, 140, 24);
    ctx.stroke();

    ctx.fillStyle = "#1d3557";
    ctx.font = "bold 40px 'SF Mono', monospace, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${icon}  ${text}`, 256, 80);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });
    const geo = new THREE.PlaneGeometry(12, 3.8);
    return new THREE.Mesh(geo, mat);
  }

  setupBoostPads() {
    const padPositions = [
      new THREE.Vector3(35, 0.06, -55),
      new THREE.Vector3(75, 0.06, -15),
      new THREE.Vector3(30, 0.06, 75),
      new THREE.Vector3(-35, 0.06, 75),
      new THREE.Vector3(-75, 0.06, -15)
    ];

    padPositions.forEach((pos) => {
      const geo = new THREE.PlaneGeometry(4, 4);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xff6b6b,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide
      });
      const pad = new THREE.Mesh(geo, mat);
      pad.position.copy(pos);
      this.scene.add(pad);
      this.boostPads.push({ pos: pos, radius: 4 });
    });
  }

  setupSkillCoconuts() {
    const skills = [
      { name: "TypeScript", pos: new THREE.Vector3(-15, 1.2, 60), color: 0x3178c6 },
      { name: "Python", pos: new THREE.Vector3(-5, 1.2, 75), color: 0x3776ab },
      { name: "WebGL / Three.js", pos: new THREE.Vector3(10, 1.2, 75), color: 0x00b4d8 },
      { name: "React", pos: new THREE.Vector3(20, 1.2, 60), color: 0x61dafb },
      { name: "Rust", pos: new THREE.Vector3(0, 1.2, 88), color: 0xd97706 },
      { name: "AI / GenAI", pos: new THREE.Vector3(-25, 1.2, 75), color: 0xff6b6b }
    ];

    this.skillPickups = [];

    skills.forEach((sk) => {
      // Golden Coconut sphere
      const geo = new THREE.SphereGeometry(1.0, 14, 14);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffb703,
        emissive: 0xffb703,
        emissiveIntensity: 0.4,
        roughness: 0.3,
        metalness: 0.8
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(sk.pos);
      mesh.castShadow = true;
      this.scene.add(mesh);

      this.skillPickups.push({
        data: sk,
        mesh: mesh,
        pos: sk.pos,
        collected: false,
        initialY: sk.pos.y
      });
    });
  }

  // ==========================================================================
  // REAL DRIFT PHYSICS & TOP-DOWN VEHICLE SIMULATION
  // ==========================================================================
  setupControls() {
    window.addEventListener("keydown", (e) => {
      if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
        return;
      }
      if (window.cyberAudio) window.cyberAudio.ensureContext();

      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          this.keys.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          this.keys.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          this.keys.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          this.keys.right = true;
          break;
        case "Space":
          this.keys.drift = true;
          e.preventDefault();
          break;
        case "KeyR":
          this.resetCar();
          break;
        case "KeyE":
        case "Enter":
          if (this.activeStation && this.onStationEnter) {
            this.onStationEnter(this.activeStation);
          }
          break;
      }
    });

    window.addEventListener("keyup", (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          this.keys.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          this.keys.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          this.keys.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          this.keys.right = false;
          break;
        case "Space":
          this.keys.drift = false;
          break;
      }
    });

    this.setupTouchControlBtn("touch-left", "left");
    this.setupTouchControlBtn("touch-right", "right");
    this.setupTouchControlBtn("touch-gas", "forward");
    this.setupTouchControlBtn("touch-brake", "backward");
    this.setupTouchControlBtn("touch-drift", "drift");
  }

  setupTouchControlBtn(elementId, keyName) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const press = (e) => {
      e.preventDefault();
      if (window.cyberAudio) window.cyberAudio.ensureContext();
      this.keys[keyName] = true;
      el.classList.add("pressed");
    };

    const release = (e) => {
      e.preventDefault();
      this.keys[keyName] = false;
      el.classList.remove("pressed");
    };

    el.addEventListener("touchstart", press, { passive: false });
    el.addEventListener("touchend", release, { passive: false });
    el.addEventListener("touchcancel", release, { passive: false });
    el.addEventListener("mousedown", press);
    el.addEventListener("mouseup", release);
    el.addEventListener("mouseleave", release);
  }

  setupResize() {
    window.addEventListener("resize", () => {
      if (!this.camera || !this.renderer) return;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  resetCar() {
    this.carPos.set(0, 0.45, -20);
    this.carHeading = 0;
    this.speed = 0;
    this.carVelocity.set(0, 0, 0);
    if (this.carGroup) {
      this.carGroup.position.copy(this.carPos);
      this.carGroup.rotation.set(0, 0, 0);
    }
  }

  teleportToStation(stationId) {
    const st = this.stations.find((s) => s.id === stationId);
    if (!st) return;
    this.carPos.copy(st.pos);
    this.carPos.z -= 4;
    this.carHeading = 0;
    this.speed = 0;
    this.carVelocity.set(0, 0, 0);
    if (this.carGroup) {
      this.carGroup.position.copy(this.carPos);
      this.carGroup.rotation.y = this.carHeading;
    }
  }

  updatePhysics(delta) {
    const isAccelerating = this.keys.forward;
    const isBraking = this.keys.backward;
    const isDrifting = this.keys.drift;

    let targetMax = this.maxSpeed;
    if (this.isBoosting) {
      targetMax *= 1.6;
      this.boostTimer -= delta;
      if (this.boostTimer <= 0) this.isBoosting = false;
    }

    // 1. Throttle / Brake
    if (isAccelerating) {
      this.speed += this.enginePower * (this.isBoosting ? 1.8 : 1);
      if (this.speed > targetMax) this.speed = targetMax;
    } else if (isBraking) {
      if (this.speed > 0.05) {
        this.speed -= this.brakeForce;
      } else {
        this.speed -= this.enginePower * 0.7;
        if (this.speed < this.maxReverseSpeed) this.speed = this.maxReverseSpeed;
      }
    } else {
      this.speed *= this.rollingFriction;
      if (Math.abs(this.speed) < 0.002) this.speed = 0;
    }

    // 2. Steering & Real Drift Mechanics
    const speedFactor = Math.min(Math.abs(this.speed) / this.maxSpeed, 1);
    let steerDelta = 0;

    if (this.keys.left) steerDelta += this.turnRate;
    if (this.keys.right) steerDelta -= this.turnRate;

    // Lateral grip transitions from tight grip to drift slide
    let currentGrip = this.lateralFriction;
    if (isDrifting && Math.abs(this.speed) > 0.25) {
      currentGrip = this.driftLateralFriction;
      steerDelta *= 1.7; // sharp slide rotation
      this.speed *= 0.988;
      if (window.cyberAudio && Math.random() < 0.25) {
        window.cyberAudio.playDriftScreech();
      }
      this.createSandDust();
    }

    const turnDir = this.speed >= 0 ? 1 : -1;
    this.carHeading += steerDelta * speedFactor * turnDir;

    // Visual Wheel Turn Angle
    const targetWheelAngle = (this.keys.left ? 0.45 : 0) + (this.keys.right ? -0.45 : 0);
    this.carSteerAngle += (targetWheelAngle - this.carSteerAngle) * 0.2;
    this.frontWheelPivots.forEach((p) => {
      p.rotation.y = this.carSteerAngle;
    });

    // 3. Decompose velocity along heading & lateral slide
    const forwardX = Math.sin(this.carHeading);
    const forwardZ = Math.cos(this.carHeading);

    // Blend current velocity towards forward vector based on lateral grip
    const targetVx = forwardX * this.speed;
    const targetVz = forwardZ * this.speed;

    this.carVelocity.x += (targetVx - this.carVelocity.x) * currentGrip;
    this.carVelocity.z += (targetVz - this.carVelocity.z) * currentGrip;

    this.carPos.x += this.carVelocity.x;
    this.carPos.z += this.carVelocity.z;

    // Island Boundary containment (sand rim radius = 150)
    const islandRadius = 150;
    const distFromOrigin = Math.sqrt(this.carPos.x * this.carPos.x + this.carPos.z * this.carPos.z);
    if (distFromOrigin > islandRadius) {
      this.carPos.x *= 0.985;
      this.carPos.z *= 0.985;
      this.speed = -this.speed * 0.5;
      this.carVelocity.multiplyScalar(-0.5);
    }

    // 4. Update Three.js Car Transforms
    if (this.carGroup) {
      this.carGroup.position.copy(this.carPos);
      this.carGroup.rotation.y = this.carHeading;

      // Body roll tilt into corners
      const rollTilt = -steerDelta * speedFactor * 0.3;
      const pitchTilt = (isAccelerating ? -0.05 : 0) + (isBraking ? 0.08 : 0);
      this.carBody.rotation.z = rollTilt;
      this.carBody.rotation.x = pitchTilt;

      // Wheel Spin
      const wheelSpin = this.speed * 1.8;
      this.wheels.forEach((w) => {
        w.rotation.x += wheelSpin;
      });
    }

    // 5. Update Interactive Physics Props
    this.updatePhysicsProps(delta);

    // 6. Audio Update
    if (window.cyberAudio) {
      const speedRatio = Math.abs(this.speed) / this.maxSpeed;
      window.cyberAudio.updateEngine(speedRatio, isAccelerating);
    }

    // 7. Checkpoints & Boosts
    this.checkStationProximity();
    this.checkBoostPads();
    this.checkSkillPickups();

    // 8. Speedometer UI
    if (this.onSpeedUpdate) {
      const mph = Math.round(Math.abs(this.speed) * 82);
      let gear = "N";
      if (this.speed < -0.01) gear = "R";
      else if (mph === 0) gear = "N";
      else if (mph < 25) gear = "1";
      else if (mph < 45) gear = "2";
      else if (mph < 70) gear = "3";
      else if (mph < 95) gear = "4";
      else gear = "5";
      this.onSpeedUpdate(mph, gear);
    }
  }

  createSandDust() {
    if (!this.carGroup) return;
    const pGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0xf4cf85, // sand dust
      transparent: true,
      opacity: 0.75
    });
    const pMesh = new THREE.Mesh(pGeo, pMat);

    const rearOffset = new THREE.Vector3(
      (Math.random() - 0.5) * 1.6,
      0.15,
      -1.7
    ).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.carHeading);

    pMesh.position.copy(this.carPos).add(rearOffset);
    this.scene.add(pMesh);

    this.particles.push({
      mesh: pMesh,
      life: 0.45,
      maxLife: 0.45,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.12,
        Math.random() * 0.08 + 0.04,
        (Math.random() - 0.5) * 0.12
      )
    });
  }

  createSandSplash(pos) {
    for (let i = 0; i < 6; i++) {
      const pGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const pMat = new THREE.MeshBasicMaterial({
        color: 0xf4cf85,
        transparent: true,
        opacity: 0.8
      });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.copy(pos);
      this.scene.add(pMesh);

      this.particles.push({
        mesh: pMesh,
        life: 0.4,
        maxLife: 0.4,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.25,
          Math.random() * 0.2 + 0.08,
          (Math.random() - 0.5) * 0.25
        )
      });
    }
  }

  updateParticles(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      p.mesh.position.add(p.vel);
      p.mesh.scale.multiplyScalar(0.96);
      p.mesh.material.opacity = (p.life / p.maxLife) * 0.75;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  // ==========================================================================
  // TOP-DOWN FOLLOWING CAMERA (BRUNO SIMON ELEVATED FOLLOWING CHASE)
  // ==========================================================================
  updateCamera() {
    if (!this.camera || !this.carGroup) return;

    // Desired camera position: elevated looking down from top at 55 degree angle
    // following behind the car heading
    const behindVector = new THREE.Vector3(0, this.camElevation, -this.camDistance);
    behindVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.carHeading);

    const targetCamPos = new THREE.Vector3().copy(this.carPos).add(behindVector);

    // Smooth lerp top following camera
    this.currentCamPos.lerp(targetCamPos, 0.09);
    this.camera.position.copy(this.currentCamPos);

    // Look at point slightly in front of the car
    const forwardLead = new THREE.Vector3(0, 0.5, 4.0);
    forwardLead.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.carHeading);
    const targetLook = new THREE.Vector3().copy(this.carPos).add(forwardLead);

    this.camLookTarget.lerp(targetLook, 0.12);
    this.camera.lookAt(this.camLookTarget);
  }

  // ==========================================================================
  // CHECKPOINT PROXIMITY DETECTION
  // ==========================================================================
  checkStationProximity() {
    let nearest = null;
    let minDist = Infinity;

    for (const st of this.stations) {
      const dist = this.carPos.distanceTo(st.pos);
      if (dist < st.radius && dist < minDist) {
        minDist = dist;
        nearest = st;
      }
    }

    if (nearest !== this.activeStation) {
      this.activeStation = nearest;
      if (nearest) {
        if (window.cyberAudio) window.cyberAudio.playCheckpointChime();
        if (this.onStationDetected) this.onStationDetected(nearest);
      } else {
        if (this.onStationLeft) this.onStationLeft();
      }
    }
  }

  checkBoostPads() {
    for (const pad of this.boostPads) {
      if (this.carPos.distanceTo(pad.pos) < pad.radius && !this.isBoosting) {
        this.isBoosting = true;
        this.boostTimer = 2.2;
        this.speed = Math.max(this.speed, this.maxSpeed * 1.35);
        if (window.cyberAudio) window.cyberAudio.playNitroBoost();
        break;
      }
    }
  }

  checkSkillPickups() {
    for (const sk of this.skillPickups) {
      if (!sk.collected && this.carPos.distanceTo(sk.pos) < 2.8) {
        sk.collected = true;
        this.collectedSkills++;
        if (window.cyberAudio) window.cyberAudio.playSkillPickup();
        if (this.onSkillCollected) this.onSkillCollected(sk.data, this.collectedSkills);

        this.scene.remove(sk.mesh);
      }
    }
  }

  // ==========================================================================
  // RADAR / MINIMAP DRAWING (SUMMER ISLAND MAP)
  // ==========================================================================
  drawMinimap() {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.42;

    // Ocean background
    ctx.fillStyle = "#00b4d8";
    ctx.fillRect(0, 0, w, h);

    // Sand Island circle
    ctx.fillStyle = "#f4cf85";
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fill();

    // Checkpoints
    for (const st of this.stations) {
      const sx = cx + st.pos.x * scale;
      const sy = cy + st.pos.z * scale;

      ctx.fillStyle = "#" + st.color.toString(16).padStart(6, "0");
      ctx.beginPath();
      ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
      ctx.fill();

      if (this.activeStation === st) {
        ctx.strokeStyle = "#1d3557";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Player Car Arrow
    const px = cx + this.carPos.x * scale;
    const py = cy + this.carPos.z * scale;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(this.carHeading);

    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(-4, -5);
    ctx.lineTo(0, -2);
    ctx.lineTo(4, -5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // ==========================================================================
  // MAIN ANIMATION LOOP
  // ==========================================================================
  animate() {
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    this.updatePhysics(delta);
    this.updateCamera();
    this.updateParticles(delta);

    // Animate Station Signs
    if (this.stationObjects) {
      this.stationObjects.forEach((obj, idx) => {
        if (obj.sign) {
          obj.sign.position.y = obj.initialY + Math.sin(time * 2 + idx) * 0.35;
          obj.sign.lookAt(this.camera.position);
        }
      });
    }

    // Animate Skill Coconuts
    this.skillPickups.forEach((sk, idx) => {
      if (!sk.collected && sk.mesh) {
        sk.mesh.rotation.y += 0.03;
        sk.mesh.position.y = sk.initialY + Math.sin(time * 3 + idx) * 0.3;
      }
    });

    // Animate Drifting Summer Clouds
    this.clouds.forEach((c) => {
      c.position.x += 0.06;
      if (c.position.x > 250) c.position.x = -250;
    });

    // Animate Subtle Ocean Water waves
    if (this.oceanWater) {
      this.oceanWater.position.y = -0.3 + Math.sin(time * 1.5) * 0.05;
    }

    this.drawMinimap();
    this.renderer.render(this.scene, this.camera);
  }
}

window.CyberRacingEngine = CyberRacingEngine;
