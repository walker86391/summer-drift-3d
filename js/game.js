// ==========================================================================
// SUMMER DRIFT 3D // REALISTIC DRIFT PHYSICS & DAY ISLAND RACING ENGINE
// - Dynamic Floating Joystick (appears below 35% of screen, disappears on release)
// - Top 35% Touch Area: horizontal swipe to look/pan camera around
// - Real Drift Physics: inertia, slip angles, volumetric tire smoke & skid marks
// - Upgraded 3D Graphics: sports convertible, paved circuit, curbs & ocean
// ==========================================================================

class CyberRacingEngine {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.minimapCanvas = document.getElementById("minimap-canvas");
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext("2d") : null;

    // Joystick DOM Elements
    this.joystickEl = document.getElementById("virtual-joystick");
    this.joystickKnob = document.getElementById("joystick-knob");
    this.joystickOrigin = { x: 0, y: 0 };
    this.joystickActive = false;

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Car Meshes & Parts
    this.carGroup = null;
    this.carBody = null;
    this.wheels = [];
    this.frontWheelPivots = [];
    this.rearTirePositions = [];

    // Real Physics Simulation Parameters
    this.carPos = new THREE.Vector3(0, 0.45, -20);
    this.carVelocity = new THREE.Vector3(0, 0, 0); // 3D world velocity
    this.carHeading = 0; // heading angle (radians)
    this.carSteerAngle = 0; // front wheel angle
    this.speed = 0;
    this.maxSpeed = 1.45;
    this.maxReverseSpeed = -0.55;
    this.enginePower = 0.028;
    this.brakeForce = 0.065;
    this.rollingFriction = 0.985;
    this.gripNormal = 0.88; // high tire grip
    this.gripDrift = 0.35; // reduced lateral grip for real drifting
    this.turnRate = 0.046;
    this.isDrifting = false;
    this.isBoosting = false;
    this.boostTimer = 0;
    this.slipAngle = 0;

    // Camera Rig & Free Look
    this.camElevation = 22;
    this.camDistance = 17;
    this.cameraOrbitYaw = 0; // manual pan angle from top 35% swipes
    this.currentCamPos = new THREE.Vector3(0, 22, -37);
    this.camLookTarget = new THREE.Vector3(0, 0, -20);

    // Touch & Swipe Gesture State
    this.touchMode = null; // 'joystick' | 'cameraLook'
    this.lastTouchX = 0;

    // Desktop Keys State
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      drift: false
    };

    // Analog control strengths (from joystick)
    this.analogThrottle = 0;
    this.analogSteer = 0;

    // Particle & Skidmark Systems
    this.particles = [];
    this.skidmarks = [];
    this.skidmarkIndex = 0;
    this.maxSkidmarks = 250;

    // World Objects
    this.stations = [];
    this.activeStation = null;
    this.clouds = [];
    this.oceanWater = null;
    this.physicsProps = [];
    this.boostPads = [];
    this.skillPickups = [];
    this.collectedSkills = 0;

    // Callbacks
    this.onStationDetected = null;
    this.onStationLeft = null;
    this.onStationEnter = null;
    this.onSpeedUpdate = null;
    this.onSkillCollected = null;

    this.carColor = 0xff6b6b; // Coral Red
  }

  init() {
    this.setupScene();
    this.setupLights();
    this.setupIslandEnvironment();
    this.buildRealisticSportsCar();
    this.setupInteractableProps();
    this.setupStations();
    this.setupBoostPads();
    this.setupSkillCoconuts();
    this.setupBeachProps();
    this.setupSummerClouds();
    this.setupGestureAndKeyboardControls();
    this.setupResize();

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    console.log("[SummerEngine 2.0] Real physics & dynamic joystick initialized.");
  }

  // ==========================================================================
  // SCENE & ATMOSPHERE
  // ==========================================================================
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7ac9fb);
    this.scene.fog = new THREE.FogExp2(0xc4e5fd, 0.0032);

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(52, aspect, 0.1, 800);
    this.camera.position.set(0, this.camElevation, -37);

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
    const hemiLight = new THREE.HemisphereLight(0x9ae6f8, 0xfce3a1, 1.45);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffae8, 1.9);
    sunLight.position.set(65, 95, 45);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 300;
    const d = 130;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;
    this.scene.add(sunLight);

    const ambient = new THREE.AmbientLight(0xfff5e0, 0.65);
    this.scene.add(ambient);
  }

  // ==========================================================================
  // ISLAND TERRAIN & COASTAL CIRCUIT WITH CURBS
  // ==========================================================================
  setupIslandEnvironment() {
    // 1. Ocean Water Plane with Caustic Look
    const oceanGeo = new THREE.PlaneGeometry(900, 900, 32, 32);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0096c7,
      roughness: 0.12,
      metalness: 0.85,
      transparent: true,
      opacity: 0.88
    });
    this.oceanWater = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanWater.position.y = -0.32;
    this.scene.add(this.oceanWater);

    // 2. Sand Island Ground
    const sandGeo = new THREE.CircleGeometry(165, 64);
    sandGeo.rotateX(-Math.PI / 2);
    const sandMat = new THREE.MeshStandardMaterial({
      color: 0xf5d491,
      roughness: 0.88,
      metalness: 0.05
    });
    const sandIsland = new THREE.Mesh(sandGeo, sandMat);
    sandIsland.receiveShadow = true;
    sandIsland.position.y = 0;
    this.scene.add(sandIsland);

    // 3. Shoreline Foam
    const foamGeo = new THREE.RingGeometry(162, 169, 64);
    foamGeo.rotateX(-Math.PI / 2);
    const foamMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75
    });
    const foam = new THREE.Mesh(foamGeo, foamMat);
    foam.position.y = -0.15;
    this.scene.add(foam);

    // 4. Paved Coastal Asphalt Road with Red/White Curbs
    this.buildCoastalCircuit();
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
    const points = curve.getPoints(220);

    const roadWidth = 14;
    const roadGeo = new THREE.BufferGeometry();
    const vertices = [];
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
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x2b313a, // asphalt
      roughness: 0.75,
      metalness: 0.15
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    this.scene.add(roadMesh);

    // Red & White Racing Curbs
    this.createRacingCurb(curve, roadWidth / 2 + 0.35, true);
    this.createRacingCurb(curve, -roadWidth / 2 - 0.35, false);
  }

  createRacingCurb(curve, offset, isOuter) {
    const points = curve.getPoints(160);
    const curbGeo = new THREE.BufferGeometry();
    const verts = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const nextP = points[(i + 1) % points.length];
      const dir = new THREE.Vector3().subVectors(nextP, p).normalize();
      const normal = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
      const pt = new THREE.Vector3().copy(p).addScaledVector(normal, offset);
      verts.push(pt.x, 0.12, pt.z);
    }
    verts.push(verts[0], verts[1], verts[2]);

    curbGeo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    const curbMat = new THREE.LineBasicMaterial({
      color: isOuter ? 0xff4d4f : 0xffffff,
      linewidth: 3
    });
    const curb = new THREE.Line(curbGeo, curbMat);
    this.scene.add(curb);
  }

  // ==========================================================================
  // REALISTIC 3D SPORTS CONVERTIBLE CAR
  // ==========================================================================
  buildRealisticSportsCar() {
    this.carGroup = new THREE.Group();
    this.carGroup.position.copy(this.carPos);

    // Metallic Car Paint Material
    const paintMat = new THREE.MeshStandardMaterial({
      color: this.carColor,
      roughness: 0.18,
      metalness: 0.85,
      envMapIntensity: 1.5
    });

    // 1. Lower Aerodynamic Body
    const lowerBodyGeo = new THREE.BoxGeometry(1.85, 0.44, 3.9);
    this.carBody = new THREE.Mesh(lowerBodyGeo, paintMat);
    this.carBody.position.y = 0.38;
    this.carBody.castShadow = true;
    this.carBody.receiveShadow = true;
    this.carGroup.add(this.carBody);

    // Front Splitter (Matte Carbon Black)
    const carbonMat = new THREE.MeshStandardMaterial({ color: 0x15181e, roughness: 0.6 });
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.08, 0.4), carbonMat);
    splitter.position.set(0, 0.16, 1.95);
    this.carGroup.add(splitter);

    // Rear Diffuser & Twin Exhausts
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.3), carbonMat);
    diffuser.position.set(0, 0.22, -1.95);
    this.carGroup.add(diffuser);

    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 });
    const exhaustL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.25, 12), exhaustMat);
    exhaustL.rotateX(Math.PI / 2);
    exhaustL.position.set(-0.55, 0.22, -2.02);
    const exhaustR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.25, 12), exhaustMat);
    exhaustR.rotateX(Math.PI / 2);
    exhaustR.position.set(0.55, 0.22, -2.02);
    this.carGroup.add(exhaustL, exhaustR);

    // 2. Open Convertible Cockpit & Interior
    const interiorMat = new THREE.MeshStandardMaterial({ color: 0x1e242d, roughness: 0.8 });
    const cockpitTub = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 1.5), interiorMat);
    cockpitTub.position.set(0, 0.52, -0.15);
    this.carGroup.add(cockpitTub);

    // Sports Seats (Twin red/black bucket seats)
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.5 });
    const seatL = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.45, 0.48), seatMat);
    seatL.position.set(-0.35, 0.68, -0.25);
    const seatR = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.45, 0.48), seatMat);
    seatR.position.set(0.35, 0.68, -0.25);
    this.carGroup.add(seatL, seatR);

    // Steering Wheel
    const wheelTorus = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 8, 16), carbonMat);
    wheelTorus.rotation.x = Math.PI / 3;
    wheelTorus.position.set(-0.35, 0.82, 0.25);
    this.carGroup.add(wheelTorus);

    // Windshield (Curved Glass)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x223344,
      roughness: 0.05,
      metalness: 0.95,
      transparent: true,
      opacity: 0.65
    });
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.1), glassMat);
    windshield.rotation.x = Math.PI / 4;
    windshield.position.set(0, 0.8, 0.6);
    this.carGroup.add(windshield);

    // Chrome Roll Bars
    const rollMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.95, roughness: 0.15 });
    const hoopL = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 8, 16, Math.PI), rollMat);
    hoopL.position.set(-0.35, 0.88, -0.55);
    hoopL.rotation.y = Math.PI;
    const hoopR = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 8, 16, Math.PI), rollMat);
    hoopR.position.set(0.35, 0.88, -0.55);
    hoopR.rotation.y = Math.PI;
    this.carGroup.add(hoopL, hoopR);

    // Headlights & Taillights
    const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.08), headMat);
    headL.position.set(-0.62, 0.42, 1.95);
    const headR = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.08), headMat);
    headR.position.set(0.62, 0.42, 1.95);
    this.carGroup.add(headL, headR);

    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff1e38 });
    const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.08, 0.08), tailMat);
    tailBar.position.set(0, 0.46, -1.96);
    this.carGroup.add(tailBar);

    // 3. Wheels with Rotors & Calipers
    this.wheels = [];
    this.frontWheelPivots = [];
    this.rearTirePositions = [];

    const wheelCoords = [
      { x: -0.98, y: 0.35, z: 1.15, isFront: true },
      { x: 0.98, y: 0.35, z: 1.15, isFront: true },
      { x: -0.98, y: 0.36, z: -1.2, isFront: false },
      { x: 0.98, y: 0.36, z: -1.2, isFront: false }
    ];

    wheelCoords.forEach((wc) => {
      const pivot = new THREE.Group();
      pivot.position.set(wc.x, wc.y, wc.z);

      const wheelGroup = this.createDetailedWheel(wc.isFront ? 0.34 : 0.36);
      pivot.add(wheelGroup);

      this.carGroup.add(pivot);
      this.wheels.push(wheelGroup);
      if (wc.isFront) {
        this.frontWheelPivots.push(pivot);
      } else {
        this.rearTirePositions.push(wc);
      }
    });

    this.scene.add(this.carGroup);
  }

  createDetailedWheel(radius) {
    const group = new THREE.Group();

    // Rubber Tire with tread thickness
    const tireGeo = new THREE.CylinderGeometry(radius, radius, 0.36, 20);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x1b1f24,
      roughness: 0.9,
      metalness: 0.1
    });
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    group.add(tire);

    // Multi-spoke Silver Alloy Rim
    const rimGeo = new THREE.CylinderGeometry(radius * 0.68, radius * 0.68, 0.37, 14);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xe0e6ed,
      metalness: 0.92,
      roughness: 0.18
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    group.add(rim);

    // Red Brake Caliper
    const caliperMat = new THREE.MeshStandardMaterial({ color: 0xff1122, roughness: 0.3 });
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.12), caliperMat);
    caliper.position.set(0, 0.12, 0.05);
    group.add(caliper);

    return group;
  }

  updateCarColor(hexColor) {
    this.carColor = hexColor;
    if (this.carBody && this.carBody.material) {
      this.carBody.material.color.setHex(hexColor);
    }
  }

  // ==========================================================================
  // REAL DRIFT PHYSICS & TIRE TRACTION SIMULATION
  // ==========================================================================
  updatePhysics(delta) {
    // 1. Process Steering Inputs
    let targetSteer = 0;
    if (this.keys.left) targetSteer += 1;
    if (this.keys.right) targetSteer -= 1;
    if (this.analogSteer !== 0) targetSteer = -this.analogSteer;

    // Smooth steering interpolation
    const steerSmoothing = 0.22;
    this.carSteerAngle += (targetSteer * 0.52 - this.carSteerAngle) * steerSmoothing;
    this.frontWheelPivots.forEach((p) => {
      p.rotation.y = this.carSteerAngle;
    });

    // 2. Throttle / Braking Forces
    let throttleInput = 0;
    if (this.keys.forward) throttleInput += 1;
    if (this.keys.backward) throttleInput -= 1;
    if (this.analogThrottle !== 0) throttleInput = this.analogThrottle;

    const isBraking = throttleInput < 0;
    const isAccelerating = throttleInput > 0;
    const manualDrift = this.keys.drift;

    let targetMax = this.maxSpeed;
    if (this.isBoosting) {
      targetMax *= 1.6;
      this.boostTimer -= delta;
      if (this.boostTimer <= 0) this.isBoosting = false;
    }

    if (isAccelerating) {
      this.speed += this.enginePower * Math.abs(throttleInput) * (this.isBoosting ? 1.8 : 1);
      if (this.speed > targetMax) this.speed = targetMax;
    } else if (isBraking) {
      if (this.speed > 0.05) {
        this.speed -= this.brakeForce * Math.abs(throttleInput);
      } else {
        this.speed -= this.enginePower * 0.75 * Math.abs(throttleInput);
        if (this.speed < this.maxReverseSpeed) this.speed = this.maxReverseSpeed;
      }
    } else {
      this.speed *= this.rollingFriction;
      if (Math.abs(this.speed) < 0.002) this.speed = 0;
    }

    // 3. Real Slip Angle & Drift Dynamics
    const speedRatio = Math.min(Math.abs(this.speed) / this.maxSpeed, 1);
    const turnDirection = this.speed >= 0 ? 1 : -1;

    // Heading update
    const yawRate = this.carSteerAngle * this.turnRate * speedRatio * turnDirection;
    this.carHeading += yawRate;

    // Dynamic Lateral Grip Curve
    // If user holds drift or corners violently with high lateral force, tires break loose!
    const lateralForce = Math.abs(yawRate) * speedRatio;
    this.isDrifting = manualDrift || (lateralForce > 0.015 && Math.abs(this.speed) > 0.35);

    let currentLateralGrip = this.isDrifting ? this.gripDrift : this.gripNormal;

    // Decompose heading vectors
    const fwdX = Math.sin(this.carHeading);
    const fwdZ = Math.cos(this.carHeading);
    const rgtX = Math.cos(this.carHeading);
    const rgtZ = -Math.sin(this.carHeading);

    // Target velocity aligned with wheels
    const targetVx = fwdX * this.speed;
    const targetVz = fwdZ * this.speed;

    // Blend current velocity towards target based on grip
    this.carVelocity.x += (targetVx - this.carVelocity.x) * currentLateralGrip;
    this.carVelocity.z += (targetVz - this.carVelocity.z) * currentLateralGrip;

    // Update Car Position
    this.carPos.x += this.carVelocity.x;
    this.carPos.z += this.carVelocity.z;

    // Island Boundary containment (sand rim = 155)
    const islandRadius = 155;
    const distFromCenter = Math.hypot(this.carPos.x, this.carPos.z);
    if (distFromCenter > islandRadius) {
      this.carPos.x *= 0.985;
      this.carPos.z *= 0.985;
      this.speed = -this.speed * 0.5;
      this.carVelocity.multiplyScalar(-0.5);
    }

    // 4. Weight Transfer & Body Roll
    if (this.carGroup) {
      this.carGroup.position.copy(this.carPos);
      this.carGroup.rotation.y = this.carHeading;

      // Realistic suspension roll and pitch
      const rollTilt = -this.carSteerAngle * speedRatio * (this.isDrifting ? 0.35 : 0.22);
      const pitchTilt = (isAccelerating ? -0.06 : 0) + (isBraking ? 0.09 : 0);
      this.carBody.rotation.z = rollTilt;
      this.carBody.rotation.x = pitchTilt;

      // Wheel Spin
      const spinDelta = this.speed * 1.8;
      this.wheels.forEach((w) => {
        w.rotation.x += spinDelta;
      });
    }

    // 5. Volumetric Tire Smoke & Persistent Skid Marks
    if (this.isDrifting && Math.abs(this.speed) > 0.28) {
      this.spawnTireSmoke();
      this.addSkidmarks();
      if (window.cyberAudio && Math.random() < 0.25) {
        window.cyberAudio.playDriftScreech();
      }
    }

    // 6. Update Props, Sound, Checkpoints
    this.updatePhysicsProps(delta);

    if (window.cyberAudio) {
      window.cyberAudio.updateEngine(speedRatio, isAccelerating);
    }

    this.checkStationProximity();
    this.checkBoostPads();
    this.checkSkillPickups();

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

  // ==========================================================================
  // VOLUMETRIC TIRE SMOKE & TIRE SKID MARKS
  // ==========================================================================
  spawnTireSmoke() {
    if (!this.carGroup) return;

    [-0.85, 0.85].forEach((offsetX) => {
      const puffGeo = new THREE.DodecahedronGeometry(0.35 + Math.random() * 0.2, 0);
      const puffMat = new THREE.MeshBasicMaterial({
        color: 0xf5eedc, // warm tire & sand smoke
        transparent: true,
        opacity: 0.65
      });
      const puff = new THREE.Mesh(puffGeo, puffMat);

      const spawnPos = new THREE.Vector3(offsetX, 0.2, -1.3).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.carHeading
      ).add(this.carPos);

      puff.position.copy(spawnPos);
      this.scene.add(puff);

      this.particles.push({
        mesh: puff,
        life: 0.55,
        maxLife: 0.55,
        growthRate: 1.04,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.12 + 0.02, // subtle drift wind
          0.06 + Math.random() * 0.06,
          (Math.random() - 0.5) * 0.12
        )
      });
    });
  }

  addSkidmarks() {
    [-0.85, 0.85].forEach((offsetX) => {
      const markGeo = new THREE.PlaneGeometry(0.32, 0.9);
      markGeo.rotateX(-Math.PI / 2);
      const markMat = new THREE.MeshBasicMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
      });
      const mark = new THREE.Mesh(markGeo, markMat);

      const markPos = new THREE.Vector3(offsetX, 0.03, -1.2).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        this.carHeading
      ).add(this.carPos);

      mark.position.copy(markPos);
      mark.rotation.y = this.carHeading;
      this.scene.add(mark);

      this.skidmarks.push(mark);
      if (this.skidmarks.length > this.maxSkidmarks) {
        const old = this.skidmarks.shift();
        this.scene.remove(old);
        old.geometry.dispose();
        old.material.dispose();
      }
    });
  }

  updateParticles(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      p.mesh.position.add(p.vel);
      p.mesh.scale.multiplyScalar(p.growthRate);
      p.mesh.material.opacity = (p.life / p.maxLife) * 0.65;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  // ==========================================================================
  // DYNAMIC FLOATING JOYSTICK & TOP 35% CAMERA SWIPE SYSTEM
  // ==========================================================================
  setupGestureAndKeyboardControls() {
    // 1. Touch Events on Window
    window.addEventListener(
      "touchstart",
      (e) => {
        if (e.target && typeof e.target.closest === "function") {
          if (e.target.closest("#customizer-drawer") || e.target.closest("#station-modal") || e.target.closest(".top-hud")) {
            return; // Ignore clicks inside UI panels
          }
        }

        if (window.cyberAudio) window.cyberAudio.ensureContext();

        const touch = e.touches[0];
        const screenHeight = window.innerHeight;
        const cutoff = screenHeight * 0.35; // 35% from top

        if (touch.clientY <= cutoff) {
          // TOP 35%: Look Around Gesture
          this.touchMode = "cameraLook";
          this.lastTouchX = touch.clientX;
        } else {
          // BELOW 35%: Dynamic Floating Joystick
          this.touchMode = "joystick";
          this.joystickActive = true;
          this.joystickOrigin = { x: touch.clientX, y: touch.clientY };

          if (this.joystickEl) {
            this.joystickEl.style.left = `${touch.clientX}px`;
            this.joystickEl.style.top = `${touch.clientY}px`;
            this.joystickEl.classList.add("active");
          }
          if (this.joystickKnob) {
            this.joystickKnob.style.transform = `translate(0px, 0px)`;
            this.joystickKnob.classList.remove("drifting");
          }
        }
      },
      { passive: false }
    );

    window.addEventListener(
      "touchmove",
      (e) => {
        if (!this.touchMode) return;
        const touch = e.touches[0];

        if (this.touchMode === "cameraLook") {
          // Swipe to rotate/pan camera left and right
          const deltaX = touch.clientX - this.lastTouchX;
          this.cameraOrbitYaw += deltaX * 0.007;
          this.lastTouchX = touch.clientX;
        } else if (this.touchMode === "joystick" && this.joystickActive) {
          e.preventDefault();
          const dx = touch.clientX - this.joystickOrigin.x;
          const dy = touch.clientY - this.joystickOrigin.y;
          const maxRadius = 48;
          const dist = Math.hypot(dx, dy);

          const clampDist = Math.min(dist, maxRadius);
          const angle = Math.atan2(dy, dx);
          const knobX = Math.cos(angle) * clampDist;
          const knobY = Math.sin(angle) * clampDist;

          if (this.joystickKnob) {
            this.joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
          }

          // Compute analog throttle and steering
          const normY = knobY / maxRadius; // -1 (up) to +1 (down)
          const normX = knobX / maxRadius; // -1 (left) to +1 (right)

          this.analogThrottle = -normY; // positive = forward
          this.analogSteer = normX; // positive = right

          // Swipe hard sideways -> trigger drift visual
          const hardSideways = Math.abs(normX) > 0.65;
          if (this.joystickKnob) {
            this.joystickKnob.classList.toggle("drifting", hardSideways);
          }
          this.keys.drift = hardSideways;
        }
      },
      { passive: false }
    );

    const endTouch = () => {
      this.touchMode = null;
      this.joystickActive = false;
      this.analogThrottle = 0;
      this.analogSteer = 0;
      this.keys.drift = false;

      if (this.joystickEl) {
        this.joystickEl.classList.remove("active");
      }
      if (this.joystickKnob) {
        this.joystickKnob.style.transform = `translate(0px, 0px)`;
        this.joystickKnob.classList.remove("drifting");
      }
    };

    window.addEventListener("touchend", endTouch);
    window.addEventListener("touchcancel", endTouch);

    // Mouse drag support for desktop testing
    let isMouseDown = false;
    window.addEventListener("mousedown", (e) => {
      if (e.target && typeof e.target.closest === "function") {
        if (e.target.closest("#customizer-drawer") || e.target.closest("#station-modal") || e.target.closest(".top-hud") || e.target.closest(".floating-drift-pill")) {
          return;
        }
      }
      isMouseDown = true;
      const screenHeight = window.innerHeight;
      const cutoff = screenHeight * 0.35;

      if (e.clientY <= cutoff) {
        this.touchMode = "cameraLook";
        this.lastTouchX = e.clientX;
      } else {
        this.touchMode = "joystick";
        this.joystickActive = true;
        this.joystickOrigin = { x: e.clientX, y: e.clientY };

        if (this.joystickEl) {
          this.joystickEl.style.left = `${e.clientX}px`;
          this.joystickEl.style.top = `${e.clientY}px`;
          this.joystickEl.classList.add("active");
        }
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (!isMouseDown || !this.touchMode) return;
      if (this.touchMode === "cameraLook") {
        const deltaX = e.clientX - this.lastTouchX;
        this.cameraOrbitYaw += deltaX * 0.007;
        this.lastTouchX = e.clientX;
      } else if (this.touchMode === "joystick" && this.joystickActive) {
        const dx = e.clientX - this.joystickOrigin.x;
        const dy = e.clientY - this.joystickOrigin.y;
        const maxRadius = 48;
        const dist = Math.hypot(dx, dy);

        const clampDist = Math.min(dist, maxRadius);
        const angle = Math.atan2(dy, dx);
        const knobX = Math.cos(angle) * clampDist;
        const knobY = Math.sin(angle) * clampDist;

        if (this.joystickKnob) {
          this.joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
        }

        const normY = knobY / maxRadius;
        const normX = knobX / maxRadius;

        this.analogThrottle = -normY;
        this.analogSteer = normX;

        const hardSideways = Math.abs(normX) > 0.65;
        if (this.joystickKnob) {
          this.joystickKnob.classList.toggle("drifting", hardSideways);
        }
        this.keys.drift = hardSideways;
      }
    });

    window.addEventListener("mouseup", () => {
      isMouseDown = false;
      endTouch();
    });

    // 2. Floating Drift Pill Button
    const driftPill = document.getElementById("touch-drift-btn");
    if (driftPill) {
      const startDrift = (e) => {
        e.preventDefault();
        this.keys.drift = true;
        driftPill.classList.add("pressed");
      };
      const stopDrift = (e) => {
        e.preventDefault();
        this.keys.drift = false;
        driftPill.classList.remove("pressed");
      };
      driftPill.addEventListener("touchstart", startDrift);
      driftPill.addEventListener("touchend", stopDrift);
      driftPill.addEventListener("mousedown", startDrift);
      driftPill.addEventListener("mouseup", stopDrift);
    }

    // 3. Desktop Keyboard Controls
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
  }

  // ==========================================================================
  // TOP-DOWN FOLLOWING CAMERA WITH FREE LOOK OFFSET
  // ==========================================================================
  updateCamera() {
    if (!this.camera || !this.carGroup) return;

    // Smooth return-to-center for manual swipe pan when finger released
    if (this.touchMode !== "cameraLook") {
      this.cameraOrbitYaw *= 0.94; // gracefully recenter
    }

    const totalHeading = this.carHeading + this.cameraOrbitYaw;

    // Elevated top-down view looking down at the car
    const behindVector = new THREE.Vector3(0, this.camElevation, -this.camDistance);
    behindVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), totalHeading);

    const targetCamPos = new THREE.Vector3().copy(this.carPos).add(behindVector);
    this.currentCamPos.lerp(targetCamPos, 0.1);
    this.camera.position.copy(this.currentCamPos);

    // Look at point slightly in front of the car
    const forwardLead = new THREE.Vector3(0, 0.5, 4.0).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      this.carHeading
    );
    const targetLook = new THREE.Vector3().copy(this.carPos).add(forwardLead);

    this.camLookTarget.lerp(targetLook, 0.14);
    this.camera.lookAt(this.camLookTarget);
  }

  // ==========================================================================
  // PROPS & WORLD DETAILS
  // ==========================================================================
  setupInteractableProps() {
    this.physicsProps = [];

    // Striped Beach Balls
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
      this.scene.add(mesh);

      this.physicsProps.push({
        type: "ball",
        mesh: mesh,
        pos: pos.clone(),
        vel: new THREE.Vector3(0, 0, 0),
        radius: radius,
        mass: 0.4,
        restitution: 0.78,
        friction: 0.985
      });
    });

    // Wooden Cargo Crates
    const cratePositions = [
      new THREE.Vector3(38, 0.6, -25),
      new THREE.Vector3(40, 0.6, -23),
      new THREE.Vector3(39, 1.6, -24),
      new THREE.Vector3(-42, 0.6, 35),
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
      prop.pos.x += prop.vel.x;
      prop.pos.z += prop.vel.z;
      prop.pos.y += prop.vel.y;

      const groundY = prop.type === "ball" ? prop.radius : 0.6;
      if (prop.pos.y > groundY) {
        prop.vel.y -= 0.015;
      } else {
        prop.pos.y = groundY;
        if (Math.abs(prop.vel.y) > 0.05) {
          prop.vel.y = -prop.vel.y * prop.restitution;
        } else {
          prop.vel.y = 0;
        }
      }

      prop.vel.x *= prop.friction;
      prop.vel.z *= prop.friction;

      if (prop.type === "ball") {
        prop.mesh.rotation.x += prop.vel.z * 1.5;
        prop.mesh.rotation.z -= prop.vel.x * 1.5;
      }

      prop.mesh.position.copy(prop.pos);

      // Collision with Car
      const distToCar = this.carPos.distanceTo(prop.pos);
      const collisionDist = 1.6 + prop.radius;

      if (distToCar < collisionDist) {
        const impactDir = new THREE.Vector3().subVectors(prop.pos, this.carPos).normalize();
        const carSpeedMag = Math.max(Math.abs(this.speed), 0.2);
        const force = (carSpeedMag * 1.25) / prop.mass;

        prop.vel.x += impactDir.x * force;
        prop.vel.z += impactDir.z * force;
        prop.vel.y += force * 0.45;

        if (window.cyberAudio) window.cyberAudio.playSkillPickup();
        this.speed *= 0.88;
      }
    }
  }

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

      // Checkpoint Ring
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

      // Wooden Arch
      const woodMat = new THREE.MeshStandardMaterial({ color: 0xa06d3b, roughness: 0.85 });
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

      // Wooden Sign
      const sign = this.createWoodenSurfSign(st.title, st.icon, st.color);
      sign.position.set(0, 11, 0);
      group.add(sign);

      this.scene.add(group);
      this.stationObjects.push({ data: st, group: group, sign: sign, initialY: 11 });
    });
  }

  createWoodenSurfSign(text, icon, colorHex) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");

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
    const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
    return new THREE.Mesh(new THREE.PlaneGeometry(12, 3.8), mat);
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

      this.skillPickups.push({ data: sk, mesh: mesh, pos: sk.pos, collected: false, initialY: sk.pos.y });
    });
  }

  setupBeachProps() {
    const palmPositions = [
      new THREE.Vector3(20, 0, -50),
      new THREE.Vector3(-25, 0, -50),
      new THREE.Vector3(65, 0, -10),
      new THREE.Vector3(60, 0, 30),
      new THREE.Vector3(-65, 0, -10),
      new THREE.Vector3(-60, 0, 30),
      new THREE.Vector3(25, 0, 75),
      new THREE.Vector3(-25, 0, 75)
    ];

    palmPositions.forEach((pos) => this.createPalmTree(pos));
  }

  createPalmTree(pos) {
    const group = new THREE.Group();
    group.position.copy(pos);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
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

    const frondMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.6, side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const frondGeo = new THREE.PlaneGeometry(1.6, 5.2);
      frondGeo.translate(0, 2.5, 0);
      const frond = new THREE.Mesh(frondGeo, frondMat);
      frond.position.set(0.8, 8.2, 0);
      frond.rotation.y = angle;
      frond.rotation.x = 0.85;
      frond.castShadow = true;
      group.add(frond);
    }

    this.scene.add(group);
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
      for (let p = 0; p < 4; p++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(6 + Math.random() * 4, 8, 8), cloudMat);
        puff.position.set(p * 5, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3);
        cloudGroup.add(puff);
      }
      cloudGroup.position.set((Math.random() - 0.5) * 400, 45 + Math.random() * 20, (Math.random() - 0.5) * 400);
      this.scene.add(cloudGroup);
      this.clouds.push(cloudGroup);
    }
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

  drawMinimap() {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.42;

    ctx.fillStyle = "#00b4d8";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#f5d491";
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fill();

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

  animate() {
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    this.updatePhysics(delta);
    this.updateCamera();
    this.updateParticles(delta);

    if (this.stationObjects) {
      this.stationObjects.forEach((obj, idx) => {
        if (obj.sign) {
          obj.sign.position.y = obj.initialY + Math.sin(time * 2 + idx) * 0.35;
          obj.sign.lookAt(this.camera.position);
        }
      });
    }

    this.skillPickups.forEach((sk, idx) => {
      if (!sk.collected && sk.mesh) {
        sk.mesh.rotation.y += 0.03;
        sk.mesh.position.y = sk.initialY + Math.sin(time * 3 + idx) * 0.3;
      }
    });

    this.clouds.forEach((c) => {
      c.position.x += 0.06;
      if (c.position.x > 250) c.position.x = -250;
    });

    if (this.oceanWater) {
      this.oceanWater.position.y = -0.32 + Math.sin(time * 1.5) * 0.05;
    }

    this.drawMinimap();
    this.renderer.render(this.scene, this.camera);
  }
}

window.CyberRacingEngine = CyberRacingEngine;
