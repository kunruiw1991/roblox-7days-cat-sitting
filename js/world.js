// Three.js 3D Retro 1970s/80s Roblox Suburban House & Tuxedo Top-Hat Cat World
// Faithfully reproduces kitchen checkers, laundry machines + litter box, living room red curtains + cyan TV,
// nighttime front yard + green mailbox, bedroom, shadow window stalker, and Rabbit & Turtle buddies.
// Tracks all GPU geometries/materials/textures for clean dispose() with zero leaks.

import { ROOMS } from "./data.js";

function makeCheckerTexture(c1, c2, repeatX = 8, repeatY = 8) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = c1;
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = c2;
  g.fillRect(0, 0, 64, 64);
  g.fillRect(64, 64, 64, 64);
  // Subtle retro grout line
  g.strokeStyle = "rgba(0,0,0,0.08)";
  g.lineWidth = 2;
  g.strokeRect(0, 0, 64, 64);
  g.strokeRect(64, 64, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

function makeStripeHatTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  for (let i = 0; i < 6; i++) {
    g.fillStyle = i % 2 === 0 ? "#dc2626" : "#f8fafc";
    g.fillRect(0, i * (64 / 6), 64, 64 / 6 + 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

function makeStalkerFaceTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#08090c";
  g.fillRect(0, 0, 128, 128);
  // High-contrast creepy pale face streak matching thumb_maxres.jpg & sb0_03 f14
  g.fillStyle = "#e5e7eb";
  g.beginPath();
  g.ellipse(64, 58, 34, 44, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#08090c";
  g.beginPath();
  g.ellipse(46, 52, 13, 15, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(82, 52, 13, 15, 0, 0, Math.PI * 2);
  g.fill();
  // Wide glowing staring eyes
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.arc(46, 52, 6, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(82, 52, 6, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#000000";
  g.beginPath();
  g.arc(46, 52, 2.5, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(82, 52, 2.5, 0, Math.PI * 2);
  g.fill();
  // Open startled mouth
  g.fillStyle = "#08090c";
  g.beginPath();
  g.ellipse(64, 86, 15, 11, 0, 0, Math.PI * 2);
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

export class CatSittingWorld {
  constructor(canvas) {
    this.canvas = canvas;
    this.disposables = { geometries: [], materials: [], textures: [] };
    this.interactables = [];

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b101b);
    this.scene.fog = new THREE.Fog(0x0b101b, 14, 42);

    this.camera = new THREE.PerspectiveCamera(64, window.innerWidth / window.innerHeight, 0.1, 80);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = false;

    this.camTargetPos = new THREE.Vector3(0.4, 2.25, 3.6);
    this.camPos = this.camTargetPos.clone();
    this.yaw = 0.42;
    this.pitch = -0.14;
    this.targetYaw = 0.42;
    this.targetPitch = -0.14;
    this.camera.position.copy(this.camPos);

    this._buildLights();
    this._buildHouse();
    this._buildKitchenProps();
    this._buildLaundryProps();
    this._buildLivingProps();
    this._buildHallwayOutsideProps();
    this._buildBedroomProps();
    this._buildTopHatCat();
    this._buildRabbitTurtleBuddies();
    this._buildWindowStalker();

    this.focusRoom("kitchen", true);
  }

  _trackGeo(geo) { this.disposables.geometries.push(geo); return geo; }
  _trackMat(mat) { this.disposables.materials.push(mat); return mat; }
  _trackTex(tex) { this.disposables.textures.push(tex); return tex; }

  _box(w, h, d, colorOrMat, x, y, z, interactId = null) {
    const geo = this._trackGeo(new THREE.BoxGeometry(w, h, d));
    const mat = typeof colorOrMat === "number"
      ? this._trackMat(new THREE.MeshLambertMaterial({ color: colorOrMat }))
      : colorOrMat;
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (interactId) {
      m.userData.interactId = interactId;
      this.interactables.push(m);
    }
    this.scene.add(m);
    return m;
  }

  _buildLights() {
    this.ambient = new THREE.AmbientLight(0xfff4df, 0.65);
    this.scene.add(this.ambient);

    this.kitchenLight = new THREE.PointLight(0xfff3cf, 0.95, 18);
    this.kitchenLight.position.set(-1.0, 3.6, -1.5);
    this.scene.add(this.kitchenLight);

    this.livingLight = new THREE.PointLight(0xffe7bc, 0.9, 18);
    this.livingLight.position.set(6.8, 3.6, -0.5);
    this.scene.add(this.livingLight);

    this.laundryLight = new THREE.PointLight(0xeef6ff, 0.85, 14);
    this.laundryLight.position.set(-7.5, 3.5, -1.2);
    this.scene.add(this.laundryLight);

    this.bedroomLight = new THREE.PointLight(0xffddb0, 0.72, 14);
    this.bedroomLight.position.set(-7.2, 3.4, 7.0);
    this.scene.add(this.bedroomLight);

    this.yardLight = new THREE.PointLight(0xfff1b8, 0.85, 22);
    this.yardLight.position.set(2.4, 5.2, 13.5);
    this.scene.add(this.yardLight);
  }

  _buildHouse() {
    const checkGreen = this._trackTex(makeCheckerTexture("#4e8865", "#e8e6db", 10, 7));
    const checkRed = this._trackTex(makeCheckerTexture("#c64d3b", "#f0eae0", 4, 4));
    const greenFloorMat = this._trackMat(new THREE.MeshLambertMaterial({ map: checkGreen }));
    const redFloorMat = this._trackMat(new THREE.MeshLambertMaterial({ map: checkRed }));
    const carpetMat = this._trackMat(new THREE.MeshLambertMaterial({ color: 0xc2b192 }));
    const wallMat = this._trackMat(new THREE.MeshLambertMaterial({ color: 0x7e8a71 }));
    const trimMat = this._trackMat(new THREE.MeshLambertMaterial({ color: 0x6b4528 }));
    const ceilMat = this._trackMat(new THREE.MeshLambertMaterial({ color: 0xd9d4c3 }));
    const grassMat = this._trackMat(new THREE.MeshLambertMaterial({ color: 0x4b8736 }));

    // Kitchen + Laundry checkered floor (x: -10..3, z: -5..3)
    this._box(13.2, 0.12, 8.2, greenFloorMat, -3.5, -0.06, -1.0);
    // Living room + Hallway beige carpet (x: 3..11.2, z: -5..7.5 and hallway -2.5..3, z: 3..7.5)
    this._box(8.4, 0.12, 12.6, carpetMat, 7.2, -0.06, 1.2);
    this._box(5.6, 0.12, 4.6, carpetMat, 0.2, -0.06, 5.2);
    // Wood divider strips
    this._box(0.24, 0.14, 8.2, trimMat, 3.0, -0.05, -1.0);
    this._box(5.6, 0.14, 0.24, trimMat, 0.2, -0.05, 3.0);
    // Bedroom floor + Red-checkered bathroom corner
    this._box(7.8, 0.12, 7.6, carpetMat, -6.4, -0.06, 6.6);
    this._box(3.4, 0.14, 3.4, redFloorMat, -4.3, -0.05, 8.7);
    // Ceiling
    this._box(22, 0.16, 16, ceilMat, 0.6, 4.1, 2.5);

    // Outer walls (leave window gap in living room back wall & front door gap at z=7.5)
    this._box(15.2, 4.1, 0.3, wallMat, -2.6, 2.05, -5.0); // back wall left (laundry + kitchen)
    this._box(2.2, 4.1, 0.3, wallMat, 10.2, 2.05, -5.0);  // back wall far right
    this._box(4.2, 1.1, 0.3, wallMat, 7.1, 0.55, -5.0);   // under living window
    this._box(4.2, 0.9, 0.3, wallMat, 7.1, 3.65, -5.0);   // above living window
    this._box(0.3, 4.1, 15.6, wallMat, -10.1, 2.05, 2.6); // far left wall
    this._box(0.3, 4.1, 12.8, wallMat, 11.2, 2.05, 1.2);  // far right wall
    // Front wall with doorway at x: -1.1..1.1, z=7.5
    this._box(9.2, 4.1, 0.3, wallMat, -5.6, 2.05, 7.5);
    this._box(10.2, 4.1, 0.3, wallMat, 6.2, 2.05, 7.5);
    this._box(2.4, 1.1, 0.3, wallMat, 0.0, 3.55, 7.5);
    // Partition wall between laundry & kitchen (open doorway)
    this._box(0.28, 4.1, 3.6, wallMat, -5.1, 2.05, -3.2);
    // Partition wall between hallway & bedroom (open doorway)
    this._box(0.28, 4.1, 3.2, wallMat, -2.5, 2.05, 5.9);

    // Ceiling lamps
    for (const [lx, lz] of [[-1.0, -1.5], [6.8, -0.5], [-7.5, -1.2], [-7.2, 6.8]]) {
      this._box(0.9, 0.14, 0.9, 0xfff8dc, lx, 3.96, lz);
    }

    // Outside nighttime front lawn, sidewalk, road & distant house (sb0_00 f18, sb0_01 f10)
    this._box(42, 0.14, 24, grassMat, 0, -0.1, 19.5);
    this._box(2.2, 0.16, 12, 0xcbd5c0, 0, -0.07, 13.5); // walkway
    this._box(42, 0.16, 4.6, 0x3b3f46, 0, -0.07, 21.5); // street
    // Backyard lawn behind living window
    this._box(34, 0.14, 14, grassMat, 4, -0.1, -12.0);
    // Distant cozy neighbor house with warm glowing window
    this._box(6.2, 4.0, 4.5, 0xc7a982, -5.5, 2.0, 26.5);
    this._box(1.4, 1.1, 0.2, 0xffe484, -5.5, 2.2, 24.2);
    // Streetlamp pole
    this._box(0.18, 5.4, 0.18, 0x475569, 2.6, 2.7, 13.5);
    this._box(0.7, 0.22, 0.3, 0xfff3b0, 2.3, 5.3, 13.5);
  }

  _buildKitchenProps() {
    const cabMat = this._trackMat(new THREE.MeshLambertMaterial({ color: 0x6ba085 }));
    const counterMat = this._trackMat(new THREE.MeshLambertMaterial({ color: 0x7c4824 }));
    const upperMat = this._trackMat(new THREE.MeshLambertMaterial({ color: 0xe6e2d3 }));

    // Mint lower cabinets + wood countertops + upper cream cabinets
    this._box(4.6, 1.05, 0.95, cabMat, 0.2, 0.525, -4.35);
    this._box(4.7, 0.12, 1.02, counterMat, 0.2, 1.1, -4.35);
    this._box(4.6, 1.05, 0.55, upperMat, 0.2, 3.0, -4.55);

    // White Stove
    this._box(1.15, 1.08, 0.98, 0xf1f5f9, -1.65, 0.54, -4.32);
    this._box(0.95, 0.45, 0.08, 0x1e293b, -1.65, 0.48, -3.82); // oven glass

    // White Refrigerator (x=-3.55, z=-4.25) with hinged interactive door!
    this._box(1.25, 2.35, 1.05, 0xeef2f6, -3.55, 1.175, -4.3);
    this._box(1.05, 2.0, 0.1, 0xbae6fd, -3.55, 1.18, -3.8); // frosty cold interior
    this.fridgePivot = new THREE.Group();
    this.fridgePivot.position.set(-4.16, 1.18, -3.77);
    const fDoorGeo = this._trackGeo(new THREE.BoxGeometry(1.24, 2.32, 0.12));
    const fDoorMat = this._trackMat(new THREE.MeshLambertMaterial({ color: 0xf8fafc }));
    this.fridgeDoor = new THREE.Mesh(fDoorGeo, fDoorMat);
    this.fridgeDoor.position.set(0.62, 0, 0.06);
    this.fridgeDoor.userData.interactId = "fridge";
    this.interactables.push(this.fridgeDoor);
    this.fridgePivot.add(this.fridgeDoor);
    // Fridge handle
    const fHandle = new THREE.Mesh(
      this._trackGeo(new THREE.BoxGeometry(0.08, 0.65, 0.1)),
      this._trackMat(new THREE.MeshLambertMaterial({ color: 0x94a3b8 }))
    );
    fHandle.position.set(1.1, 0.15, 0.14);
    this.fridgePivot.add(fHandle);
    this.scene.add(this.fridgePivot);

    // Black Microwave on counter (x=0.85, y=1.42, z=-4.25)
    this.microwave = this._box(0.95, 0.56, 0.62, 0x18181b, 0.85, 1.44, -4.25, "microwave");
    this.microwaveScreen = this._box(0.55, 0.36, 0.06, 0x064e3b, 0.72, 1.44, -3.93, "microwave");
    this._box(0.16, 0.12, 0.06, 0x22c55e, 1.16, 1.54, -3.93, "microwave"); // green digital clock

    // Iconic Red Cat Food Bowl on green checkered floor (sb0_00 f6-7)
    const bowlGeo = this._trackGeo(new THREE.CylinderGeometry(0.42, 0.48, 0.24, 16));
    const bowlMat = this._trackMat(new THREE.MeshLambertMaterial({ color: 0xdc2626 }));
    this.catBowl = new THREE.Mesh(bowlGeo, bowlMat);
    this.catBowl.position.set(-2.25, 0.12, -2.2);
    this.catBowl.userData.interactId = "feed";
    this.interactables.push(this.catBowl);
    this.scene.add(this.catBowl);

    const kibbleGeo = this._trackGeo(new THREE.CylinderGeometry(0.34, 0.36, 0.14, 12));
    const kibbleMat = this._trackMat(new THREE.MeshLambertMaterial({ color: 0x7c3f18 }));
    this.catKibble = new THREE.Mesh(kibbleGeo, kibbleMat);
    this.catKibble.position.set(-2.25, 0.2, -2.2);
    this.catKibble.visible = false;
    this.scene.add(this.catKibble);
  }

  _buildLaundryProps() {
    // Twin White Front-Loading Washing Machines (sb0_00 f10-13)
    for (const wx of [-8.8, -7.2]) {
      this._box(1.25, 1.45, 1.15, 0xeef2f6, wx, 0.725, -4.2);
      const drumGeo = this._trackGeo(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 18));
      drumGeo.rotateX(Math.PI / 2);
      const drumMat = this._trackMat(new THREE.MeshLambertMaterial({ color: 0x1e293b }));
      const drum = new THREE.Mesh(drumGeo, drumMat);
      drum.position.set(wx, 0.65, -3.6);
      this.scene.add(drum);
    }

    // Iconic Grey Litter Box right beside the washing machines!
    this.litterBox = this._box(1.15, 0.24, 0.92, 0x64748b, -6.0, 0.12, -3.2, "litter");
    this._box(1.02, 0.12, 0.78, 0xa89b82, -6.0, 0.2, -3.2, "litter");
    this.poopMeshes = [];
    const offsets = [[-0.28, -0.18], [0.22, -0.12], [0.0, 0.05], [-0.24, 0.2], [0.26, 0.2]];
    for (const [ox, oz] of offsets) {
      const m = this._box(0.18, 0.16, 0.18, 0x5c3a1e, -6.0 + ox, 0.3, -3.2 + oz, "litter");
      this.poopMeshes.push(m);
    }
  }

  _buildLivingProps() {
    // Dark-Green Sectional Sofa (sb0_00 f14)
    const sofaMat = this._trackMat(new THREE.MeshLambertMaterial({ color: 0x1f5c4b }));
    this._box(1.2, 0.65, 3.6, sofaMat, 4.3, 0.325, -0.4);
    this._box(0.35, 1.25, 3.6, sofaMat, 3.85, 0.625, -0.4);
    this._box(1.4, 0.65, 1.2, sofaMat, 5.2, 0.325, 0.8);

    // Wooden Coffee Table + String Cat Toy (sb0_00 f14-15)
    this._box(1.1, 0.52, 2.0, 0x5c361d, 6.7, 0.26, -0.4);
    this.catToy = this._box(0.65, 0.1, 0.14, 0xef4444, 6.7, 0.58, -0.4, "play");

    // TV Cabinet + Iconic Cyan Glowing TV (sb0_01 f13, sb0_02 f2)
    this._box(0.9, 0.72, 2.4, 0x4f2f18, 10.35, 0.36, -0.4);
    this._box(0.16, 1.05, 1.75, 0x111827, 10.45, 1.28, -0.4, "tv");
    this.tvScreenMat = this._trackMat(new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    this.tvScreen = this._box(0.06, 0.92, 1.6, this.tvScreenMat, 10.34, 1.28, -0.4, "tv");

    // Floor Lamp
    this._box(0.12, 2.3, 0.12, 0xb45309, 4.4, 1.15, 2.1);
    const shadeGeo = this._trackGeo(new THREE.CylinderGeometry(0.28, 0.44, 0.55, 14));
    const shade = new THREE.Mesh(shadeGeo, this._trackMat(new THREE.MeshBasicMaterial({ color: 0xfef3c7 })));
    shade.position.set(4.4, 2.45, 2.1);
    this.scene.add(shade);

    // Big Living Room Window + Red Curtains (slide shut when closed!)
    const glassMat = this._trackMat(new THREE.MeshBasicMaterial({ color: 0x1e3a5f, transparent: true, opacity: 0.34 }));
    this._box(4.0, 2.1, 0.08, glassMat, 7.1, 2.15, -4.95, "curtains");
    this._box(4.2, 0.12, 0.22, 0x262626, 7.1, 3.3, -4.78); // curtain rod

    const curtainMat = this._trackMat(new THREE.MeshLambertMaterial({ color: 0x991b1b }));
    this.curtainLeft = this._box(0.85, 2.45, 0.14, curtainMat, 5.45, 2.05, -4.72, "curtains");
    this.curtainRight = this._box(0.85, 2.45, 0.14, curtainMat, 8.75, 2.05, -4.72, "curtains");
  }

  _buildHallwayOutsideProps() {
    // Dark-wood Front Door + Deadbolt Lock indicator (sb0_01 f8, sb0_02 f14)
    this.frontDoor = this._box(2.1, 3.0, 0.18, 0x452815, 0.0, 1.5, 7.45, "door");
    this.lockIndicatorMat = this._trackMat(new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    this.lockIndicator = this._box(0.22, 0.22, 0.14, this.lockIndicatorMat, 0.78, 1.62, 7.34, "door");

    // Wall Light Switch beside front door (sb0_01 f8, sb0_03 f16)
    this._box(0.24, 0.36, 0.08, 0xf1f5f9, -1.45, 1.65, 7.34, "lights");
    this.switchKnob = this._box(0.08, 0.12, 0.1, 0x22c55e, -1.45, 1.68, 7.3, "lights");

    // Iconic Green Mailbox with Red Flag outside (sb0_00 f18, sb0_04 f19)
    this._box(0.18, 1.45, 0.18, 0x6b4423, 1.85, 0.725, 14.2, "mailbox");
    this.mailboxBody = this._box(0.62, 0.48, 0.92, 0x166534, 1.85, 1.55, 14.2, "mailbox");
    this.mailboxFlag = this._box(0.08, 0.42, 0.14, 0xdc2626, 2.2, 1.72, 14.0, "mailbox");
  }

  _buildBedroomProps() {
    // Master Bedroom Blue Bed (sb0_02 f7)
    this._box(2.4, 0.55, 3.1, 0x5c361d, -7.8, 0.275, 8.2, "sleep");
    this._box(2.25, 0.38, 2.85, 0x3b6e8c, -7.8, 0.68, 8.2, "sleep");
    this._box(0.85, 0.24, 0.52, 0xe2e8f0, -8.3, 0.96, 9.2, "sleep");
    this._box(0.85, 0.24, 0.52, 0xe2e8f0, -7.3, 0.96, 9.2, "sleep");
    // Bedside table + lamp
    this._box(0.75, 0.72, 0.75, 0x6b4226, -9.4, 0.36, 9.0);
    this._box(0.32, 0.44, 0.32, 0xfef08a, -9.4, 0.94, 9.0);
    // White Toilet in red-checkered bathroom corner (sb0_02 f6)
    this._box(0.65, 0.52, 0.78, 0xf8fafc, -4.3, 0.26, 9.3);
    this._box(0.62, 0.62, 0.26, 0xf8fafc, -4.3, 0.82, 9.56);
  }

  _buildTopHatCat() {
    // Iconic Tuxedo Cat wearing Tall Red-and-White Striped Top Hat & Red Bowtie!
    this.catGroup = new THREE.Group();
    const blackMat = this._trackMat(new THREE.MeshLambertMaterial({ color: 0x171717 }));
    const whiteMat = this._trackMat(new THREE.MeshLambertMaterial({ color: 0xf8fafc }));
    const redMat = this._trackMat(new THREE.MeshLambertMaterial({ color: 0xdc2626 }));
    const eyeMat = this._trackMat(new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    const hatMat = this._trackMat(new THREE.MeshLambertMaterial({ map: this._trackTex(makeStripeHatTexture()) }));

    const addPart = (geo, mat, x, y, z) => {
      const m = new THREE.Mesh(this._trackGeo(geo), mat);
      m.position.set(x, y, z);
      m.userData.interactId = "cat";
      this.interactables.push(m);
      this.catGroup.add(m);
      return m;
    };

    // Body + white belly + 4 paws
    addPart(new THREE.BoxGeometry(0.54, 0.46, 0.86), blackMat, 0, 0.42, 0);
    addPart(new THREE.BoxGeometry(0.36, 0.32, 0.24), whiteMat, 0, 0.38, 0.36);
    for (const [px, pz] of [[-0.18, 0.28], [0.18, 0.28], [-0.18, -0.28], [0.18, -0.28]]) {
      addPart(new THREE.BoxGeometry(0.16, 0.24, 0.16), whiteMat, px, 0.12, pz);
    }
    // Head + ears + yellow eyes + pink nose
    addPart(new THREE.BoxGeometry(0.52, 0.46, 0.46), blackMat, 0, 0.8, 0.38);
    addPart(new THREE.BoxGeometry(0.36, 0.2, 0.08), whiteMat, 0, 0.72, 0.62);
    addPart(new THREE.BoxGeometry(0.14, 0.16, 0.12), blackMat, -0.18, 1.08, 0.38);
    addPart(new THREE.BoxGeometry(0.14, 0.16, 0.12), blackMat, 0.18, 1.08, 0.38);
    addPart(new THREE.BoxGeometry(0.1, 0.1, 0.06), eyeMat, -0.13, 0.86, 0.61);
    addPart(new THREE.BoxGeometry(0.1, 0.1, 0.06), eyeMat, 0.13, 0.86, 0.61);
    // Red bowtie
    addPart(new THREE.BoxGeometry(0.32, 0.13, 0.1), redMat, 0, 0.56, 0.52);
    // Iconic Tall Red-and-White Striped Top Hat!
    addPart(new THREE.CylinderGeometry(0.36, 0.36, 0.07, 14), redMat, 0, 1.06, 0.38);
    addPart(new THREE.CylinderGeometry(0.24, 0.2, 0.62, 14), hatMat, 0, 1.4, 0.38);
    // Wagging tail
    this.catTail = addPart(new THREE.BoxGeometry(0.12, 0.12, 0.58), blackMat, 0, 0.55, -0.62);

    this.catGroup.position.set(-1.35, 0, -1.75);
    this.catTarget = new THREE.Vector3(-1.35, 0, -1.75);
    this.scene.add(this.catGroup);
  }

  _buildRabbitTurtleBuddies() {
    // Cute Roblox Red-Hoodie Rabbit & Green-Hoodie Turtle buddies (thumb_maxres.jpg & sb0_00 f2)
    const buildBuddy = (hoodColor, bodyColor, x, z, isRabbit) => {
      const grp = new THREE.Group();
      const hood = this._trackMat(new THREE.MeshLambertMaterial({ color: hoodColor }));
      const body = this._trackMat(new THREE.MeshLambertMaterial({ color: bodyColor }));
      const face = this._trackMat(new THREE.MeshLambertMaterial({ color: 0xfef2f2 }));
      const eye = this._trackMat(new THREE.MeshBasicMaterial({ color: 0x111827 }));

      const put = (w, h, d, m, px, py, pz) => {
        const mesh = new THREE.Mesh(this._trackGeo(new THREE.BoxGeometry(w, h, d)), m);
        mesh.position.set(px, py, pz);
        grp.add(mesh);
      };
      put(0.42, 0.52, 0.26, body, 0, 0.78, 0);
      put(0.18, 0.48, 0.22, body, -0.11, 0.24, 0);
      put(0.18, 0.48, 0.22, body, 0.11, 0.24, 0);
      put(0.46, 0.46, 0.44, hood, 0, 1.28, 0);
      put(0.32, 0.3, 0.06, face, 0, 1.28, 0.22);
      put(0.06, 0.08, 0.04, eye, -0.08, 1.32, 0.25);
      put(0.06, 0.08, 0.04, eye, 0.08, 1.32, 0.25);
      if (isRabbit) {
        put(0.12, 0.38, 0.1, hood, -0.14, 1.66, 0);
        put(0.12, 0.38, 0.1, hood, 0.14, 1.66, 0);
      } else {
        // Turtle yellow crown badge
        put(0.2, 0.12, 0.12, this._trackMat(new THREE.MeshBasicMaterial({ color: 0xfacc15 })), 0, 1.56, 0);
      }
      grp.position.set(x, 0, z);
      this.scene.add(grp);
      return grp;
    };
    this.rabbitBuddy = buildBuddy(0xef4444, 0x2563eb, 1.95, -2.55, true);
    this.turtleBuddy = buildBuddy(0x22c55e, 0x16a34a, 2.55, -2.15, false);
    this.rabbitBuddy.rotation.y = -0.5;
    this.turtleBuddy.rotation.y = -0.8;
  }

  _buildWindowStalker() {
    // Iconic Black & White Shadow Stalker outside the red-curtain living room window (thumb_maxres.jpg, sb0_03 f14)
    this.stalkerGroup = new THREE.Group();
    const darkMat = this._trackMat(new THREE.MeshBasicMaterial({ color: 0x090a0e }));
    const faceMat = this._trackMat(new THREE.MeshBasicMaterial({ map: this._trackTex(makeStalkerFaceTexture()) }));

    const torso = new THREE.Mesh(this._trackGeo(new THREE.BoxGeometry(1.5, 2.2, 0.4)), darkMat);
    torso.position.set(0, 1.1, 0);
    this.stalkerGroup.add(torso);

    const head = new THREE.Mesh(this._trackGeo(new THREE.BoxGeometry(1.1, 1.15, 0.45)), [
      darkMat, darkMat, darkMat, darkMat, faceMat, darkMat,
    ]);
    head.position.set(0, 2.42, 0.02);
    this.stalkerGroup.add(head);

    // Hands pressed against window glass
    for (const hx of [-1.05, 1.05]) {
      const hand = new THREE.Mesh(this._trackGeo(new THREE.BoxGeometry(0.45, 0.55, 0.18)), darkMat);
      hand.position.set(hx, 2.05, 0.25);
      this.stalkerGroup.add(hand);
    }

    this.stalkerGroup.position.set(7.1, 0.1, -5.55);
    this.stalkerGroup.visible = false;
    this.scene.add(this.stalkerGroup);
  }

  focusRoom(roomId, instant = false) {
    const r = ROOMS.find((item) => item.id === roomId) || ROOMS[0];
    this.camTargetPos.set(...r.camPos);
    const dx = r.lookAt[0] - r.camPos[0];
    const dy = r.lookAt[1] - r.camPos[1];
    const dz = r.lookAt[2] - r.camPos[2];
    this.targetYaw = Math.atan2(-dx, -dz);
    this.targetPitch = Math.atan2(dy, Math.hypot(dx, dz));
    if (instant) {
      this.camPos.copy(this.camTargetPos);
      this.yaw = this.targetYaw;
      this.pitch = this.targetPitch;
    }
  }

  rotateLook(dYaw, dPitch) {
    this.targetYaw += dYaw;
    this.targetPitch = Math.max(-0.85, Math.min(0.65, this.targetPitch + dPitch));
  }

  moveLocal(forward, strafe) {
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw);
    const rz = -Math.sin(this.yaw);
    this.camTargetPos.x = Math.max(-9.4, Math.min(10.4, this.camTargetPos.x + (fx * forward + rx * strafe)));
    this.camTargetPos.z = Math.max(-4.3, Math.min(15.5, this.camTargetPos.z + (fz * forward + rz * strafe)));
  }

  raycastInteract(ndcX, ndcY) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera({ x: ndcX, y: ndcY }, this.camera);
    const hits = ray.intersectObjects(this.interactables, false);
    if (hits.length && hits[0].distance < 15) {
      return hits[0].object.userData.interactId;
    }
    return null;
  }

  syncState(state, time) {
    const rt = state.runtime;

    // Fridge door open vs closed
    const targetFridge = rt.fridgeOpen ? -1.45 : 0;
    this.fridgePivot.rotation.y += (targetFridge - this.fridgePivot.rotation.y) * 0.16;

    // Cat bowl kibble visible once fed
    this.catKibble.visible = rt.catFed;

    // Litter box remaining poop piles
    const remaining = Math.max(0, rt.litterTotal - rt.litterScooped);
    this.poopMeshes.forEach((m, idx) => {
      m.visible = idx < remaining;
    });

    // Red curtains open vs closed across living room window
    const targetLeftX = rt.curtainsClosed ? 6.15 : 5.45;
    const targetRightX = rt.curtainsClosed ? 8.05 : 8.75;
    const targetScaleX = rt.curtainsClosed ? 2.3 : 1.0;
    this.curtainLeft.position.x += (targetLeftX - this.curtainLeft.position.x) * 0.15;
    this.curtainRight.position.x += (targetRightX - this.curtainRight.position.x) * 0.15;
    this.curtainLeft.scale.x += (targetScaleX - this.curtainLeft.scale.x) * 0.15;
    this.curtainRight.scale.x += (targetScaleX - this.curtainRight.scale.x) * 0.15;

    // Front door lock light + mailbox red flag
    this.lockIndicatorMat.color.setHex(rt.doorLocked ? 0x22c55e : 0xef4444);
    this.mailboxFlag.rotation.z = rt.mailboxChecked ? -1.35 : 0;

    // Haunted Cyan TV screen
    if (rt.tvOn) {
      const flicker = Math.sin(time * 0.025) > 0 ? 0x38bdf8 : 0x7dd3fc;
      this.tvScreenMat.color.setHex(flicker);
    } else {
      this.tvScreenMat.color.setHex(0x111827);
    }

    // House lights on vs blackout darkness
    const lightScale = rt.lightsOn ? 1.0 : 0.16;
    this.ambient.intensity = rt.lightsOn ? 0.68 : 0.16;
    this.kitchenLight.intensity = 0.95 * lightScale;
    this.livingLight.intensity = 0.9 * lightScale;
    this.laundryLight.intensity = 0.85 * lightScale;
    this.bedroomLight.intensity = 0.72 * lightScale;

    // Window Shadow Stalker visible during paranormal nights until curtains shut + door locked
    this.stalkerGroup.visible = Boolean(rt.stalkerActive);
    if (this.stalkerGroup.visible) {
      this.stalkerGroup.position.y = 0.1 + Math.sin(time * 0.004) * 0.08;
    }

    // Top-Hat Cat position based on current room & activity
    if (state.currentRoom === "living") {
      this.catTarget.set(6.7, 0, -1.85);
    } else if (state.currentRoom === "laundry") {
      this.catTarget.set(-6.9, 0, -2.0);
    } else if (state.currentRoom === "bedroom") {
      this.catTarget.set(-6.1, 0, 7.2);
    } else {
      this.catTarget.set(-1.35, 0, -1.75);
    }
    this.catGroup.position.lerp(this.catTarget, 0.08);
    this.catGroup.position.y = rt.catPlayed && state.currentRoom === "living"
      ? Math.abs(Math.sin(time * 0.008)) * 0.45
      : 0;
    this.catGroup.lookAt(this.camera.position.x, this.catGroup.position.y + 0.5, this.camera.position.z);
    this.catTail.rotation.y = Math.sin(time * 0.007) * 0.45;

    // Smooth camera interpolation
    this.camPos.lerp(this.camTargetPos, 0.12);
    this.yaw += (this.targetYaw - this.yaw) * 0.16;
    this.pitch += (this.targetPitch - this.pitch) * 0.16;
    this.camera.position.copy(this.camPos);
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose() {
    for (const g of this.disposables.geometries) g.dispose();
    for (const m of this.disposables.materials) m.dispose();
    for (const t of this.disposables.textures) t.dispose();
    this.disposables.geometries = [];
    this.disposables.materials = [];
    this.disposables.textures = [];
    this.renderer.dispose();
  }
}
