const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let width = 0;
let height = 0;
function resize() {
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

// Simple audio system (Web Audio API)
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) {
      audioCtx = new Ctor();
    }
  }
  return audioCtx;
}

function playBeep({ frequency = 440, duration = 0.15, volume = 0.2, type = "square" } = {}) {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration + 0.05);
}

function playClickSound() {
  playBeep({ frequency: 900, duration: 0.08, volume: 0.18, type: "square" });
}

function playNitroSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(380, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(250, ctx.currentTime + 0.35);

  gain.gain.setValueAtTime(0.0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.45);
}

function playCollisionSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const bufferSize = 256;
  const noise = ctx.createScriptProcessor(bufferSize, 1, 1);
  const gain = ctx.createGain();

  gain.gain.setValueAtTime(0.18, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

  noise.onaudioprocess = function (e) {
    const out = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      out[i] = (Math.random() * 2 - 1) * 0.5;
    }
  };

  noise.connect(gain);
  gain.connect(ctx.destination);

  setTimeout(() => {
    noise.disconnect();
    gain.disconnect();
  }, 220);
}

function playCountdownBeep(step) {
  // 3,2,1 short beeps
  const baseFreq = 600;
  const freq = baseFreq + (3 - step) * 80;
  playBeep({ frequency: freq, duration: 0.22, volume: 0.22, type: "square" });
}

function playStartSound() {
  // Slightly longer, lower "GO" tone
  playBeep({ frequency: 420, duration: 0.35, volume: 0.26, type: "sawtooth" });
}

function playFinishSound(winnerColor) {
  // Small two-note jingle; RED slightly higher than BLUE
  const ctx = getAudioCtx();
  if (!ctx) return;

  const base = winnerColor === "RED" ? 660 : 520;

  function note(freq, start, dur, vol) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    gain.gain.setValueAtTime(0, ctx.currentTime + start);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur + 0.05);
  }

  note(base, 0.0, 0.22, 0.25);
  note(base * 1.25, 0.19, 0.25, 0.25);
}

// Input
const keys = new Set();
window.addEventListener("keydown", (e) => {
  keys.add(e.code);
});
window.addEventListener("keyup", (e) => {
  keys.delete(e.code);
});

// Track (simple loop)
const track = {
  centerX: () => width / 2,
  centerY: () => height / 2,
  outerRadius: () => Math.min(width, height) * 0.42,
  innerRadius: () => Math.min(width, height) * 0.22,
};

// Race settings
const TOTAL_LAPS = 5;
let raceOver = false;
let winner = null;
let gameMode = null; // "single" or "versus"
let gameState = "menu"; // "menu", "difficulty", "countdown", "racing", "results", "pause"
let prevGameState = null; // used to restore after pause
let aiDifficulty = "medium"; // "easy", "medium", "hard"
let countdownTime = 0;
let lastCountdownStep = null;

// Restart button state
const restartButton = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  visible: false,
};

const pauseButton = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  visible: false,
};

const pauseRestartButton = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  visible: false,
};

const pauseSurrenderButton = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  visible: false,
};

const pauseStageButton = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  visible: false,
};

const pauseCloseButton = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  visible: false,
};

const changeModeButton = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  visible: false,
};

const backButton = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  visible: false,
};

// Car parameters
const CAR_LENGTH = 38;
const CAR_WIDTH = 20;

class Car {
  constructor(x, y, angle, color, isBot = false, keyConfig = null) {
    this.x = x;
    this.y = y;
    this.angle = angle; // radians
    this.speed = 0;
    this.baseMaxSpeed = 10; // faster base speed
    this.nitroMaxSpeed = 14; // faster nitro speed
    this.maxSpeed = this.baseMaxSpeed;
    this.accel = 0.2; // stronger acceleration
    this.brake = 0.22;
    this.friction = 0.04;
    this.turnSpeed = 0.055;
    this.color = color;
    this.isBot = isBot;
    this.keyConfig = keyConfig;

    this.vx = 0;
    this.vy = 0;

    this.drifting = false;
    this.nitro = false;
    this.maxNitroTime = 10; // seconds (longer nitro duration)
    this.nitroTimer = this.maxNitroTime; // start full
    this.nitroRegenRate = this.maxNitroTime / 10; // refill in ~10s when not in use

    this.smokeCooldown = 0;

    this.waypointIndex = 0;
    this.progress = 0; // for simple "who is ahead" estimate
    this.prevProgress = undefined;

    this.lap = 0;
    this.finished = false;
  }

  update(dt, input, smokeSystem, targetCarForBot = null) {
    if (this.keyConfig) {
      this.handlePlayerInput(dt, input);
    } else if (this.isBot) {
      this.handleBotAI(dt, targetCarForBot);
    }

    // Nitro logic
    if (this.nitro && this.nitroTimer > 0) {
      this.maxSpeed = this.nitroMaxSpeed;
      this.accel = 0.26; // stronger acceleration while on nitro
      this.nitroTimer -= dt;
      if (this.nitroTimer <= 0) {
        this.nitroTimer = 0;
        this.nitro = false;
      }
    } else {
      this.maxSpeed = this.baseMaxSpeed;
      this.accel = 0.2;
      // regen nitro when not active
      if (!this.nitro && this.nitroTimer < this.maxNitroTime) {
        this.nitroTimer = Math.min(
          this.maxNitroTime,
          this.nitroTimer + dt * this.nitroRegenRate
        );
      }
    }

    // Drift logic affects grip
    const grip = this.drifting ? 0.07 : 0.2;

    // Car heading vector
    const forwardX = Math.cos(this.angle);
    const forwardY = Math.sin(this.angle);

    // Project velocity onto forward direction
    const forwardSpeed = this.vx * forwardX + this.vy * forwardY;

    // Align velocity towards heading (grip)
    const desiredVx = forwardX * forwardSpeed;
    const desiredVy = forwardY * forwardSpeed;
    this.vx += (desiredVx - this.vx) * grip;
    this.vy += (desiredVy - this.vy) * grip;

    // Apply friction
    this.vx *= 1 - this.friction;
    this.vy *= 1 - this.friction;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Keep car on the track and bounce off walls
    this.clampToTrack();

    // Speed magnitude
    this.speed = Math.hypot(this.vx, this.vy);

    // Smoke when drifting and moving
    if (this.drifting && this.speed > 0.8) {
      this.smokeCooldown -= dt;
      if (this.smokeCooldown <= 0) {
        this.spawnSmoke(smokeSystem);
        this.smokeCooldown = 0.03;
      }
    }

    // Update progress along a circular track for "race" feeling
    this.updateProgress();
  }

  handlePlayerInput(dt, input) {
    if (!this.keyConfig) return;

    const up = input.has(this.keyConfig.up);
    const down = input.has(this.keyConfig.down);
    const left = input.has(this.keyConfig.left);
    const right = input.has(this.keyConfig.right);
    const driftKey = input.has(this.keyConfig.drift);
    const nitroKey = input.has(this.keyConfig.nitro);

    // Acceleration / brake
    let forward = 0;
    if (up) forward += 1;
    if (down) forward -= 1;

    const forwardX = Math.cos(this.angle);
    const forwardY = Math.sin(this.angle);

    if (forward > 0) {
      this.vx += forwardX * this.accel;
      this.vy += forwardY * this.accel;
    } else if (forward < 0) {
      this.vx -= forwardX * this.brake;
      this.vy -= forwardY * this.brake;
    }

    // Clamp speed
    const currentSpeed = Math.hypot(this.vx, this.vy);
    if (currentSpeed > this.maxSpeed) {
      const scale = this.maxSpeed / currentSpeed;
      this.vx *= scale;
      this.vy *= scale;
    }

    // Steering more sensitive at lower speeds so car can turn when slow
    const speedFactor = Math.min(1, currentSpeed / 2);
    if (left) this.angle -= this.turnSpeed * dt * 60 * speedFactor;
    if (right) this.angle += this.turnSpeed * dt * 60 * speedFactor;

    // Drift toggle (hold)
    this.drifting = driftKey;

    // Nitro (press+hold while available)
    if (
      nitroKey &&
      !this.nitro &&
      this.nitroTimer > 0.3 && // need a bit of charge
      this.speed > 1
    ) {
      this.nitro = true;
      playNitroSound();
    }
  }

  handleBotAI(dt, targetCar) {
    // Advanced AI for circular track with simple racing line + overtaking

    const cx = track.centerX();
    const cy = track.centerY();
    const midRadius = (track.innerRadius() + track.outerRadius()) / 2;

    // Difficulty scaling (used only when this car is a bot)
    let diffSpeedMul = 1.0;
    let diffAggression = 1.0;
    let diffReaction = 1.0;
    let steerNoiseAmp = 0;      // ความเพี้ยนทิศทาง
    let speedErrorFactor = 0;   // ความเพี้ยนความเร็ว

    if (aiDifficulty === "easy") {
      diffSpeedMul = 0.7;      // ช้าลงชัดเจน
      diffAggression = 0.3;    // ไม่ค่อยพยายามแซง
      diffReaction = 0.5;      // ตัดสินใจช้า
      steerNoiseAmp = 0.30;    // หักเลี้ยวไม่เป๊ะ
      speedErrorFactor = 0.35; // เร่ง/เบรกผิดจังหวะบ่อย
    } else if (aiDifficulty === "medium") {
      diffSpeedMul = 0.8;      // ความเร็วค่อนข้างช้า แต่เร็วกว่าง่ายเล็กน้อย
      diffAggression = 0.4;    // แซงน้อยลง แค่ตอนทางโล่งมาก ๆ
      diffReaction = 0.7;      // ตัดสินใจปานกลาง แต่ยังลังเลอยู่
      steerNoiseAmp = 0.20;    // มีพลาดบ่อยพอสมควร
      speedErrorFactor = 0.25; // เร่งไม่สุด / เบรกเพี้ยนบ่อย
    } else if (aiDifficulty === "hard") {
      diffSpeedMul = 1.2;
      diffAggression = 1.3;
      diffReaction = 1.3;
      steerNoiseAmp = 0.05;
      speedErrorFactor = 0.05;
    }

    // Waypoints around the circle (dense for smooth line)
    const totalPoints = 64;

    // Base AI racing radius (slightly inside mid)
    const baseRadius = midRadius * 0.96;

    // Compute current waypoint index from position (keeps progress consistent)
    const angleFromCenter = Math.atan2(this.y - cy, this.x - cx);
    const normAngle =
      (angleFromCenter + Math.PI * 2) % (Math.PI * 2); // 0..2π
    const approxIndex = Math.round((normAngle / (Math.PI * 2)) * totalPoints);
    this.waypointIndex = (approxIndex + totalPoints) % totalPoints;

    // Look-ahead: further ahead at higher speeds for smoother steering
    const speedMag = Math.hypot(this.vx, this.vy);
    const lookAheadMin = 4;
    const lookAheadMax = 10;
    const tSpeed = Math.min(1, speedMag / 10); // 0..1
    const lookAhead = Math.round(
      lookAheadMin + (lookAheadMax - lookAheadMin) * tSpeed
    );

    const idx = this.waypointIndex;
    const targetIdx = (idx + lookAhead) % totalPoints;
    const targetAngle =
      (targetIdx / totalPoints) * Math.PI * 2; // 0..2π

    // --- Define simple "corner" zones around the track (for braking/accel) ---
    // Treat 4 major quadrants as areas where AI adjusts speed a bit more
    const cornerCenters = [
      -Math.PI / 2, // top
      0, // right
      Math.PI / 2, // bottom
      Math.PI, // left
    ].map((a) => (a + Math.PI * 2) % (Math.PI * 2));

    let cornerIntensity = 0;
    for (const c of cornerCenters) {
      let d = Math.abs(((targetAngle - c + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      d = Math.min(d, Math.PI); // 0..π
      const influence = Math.max(0, 1 - d / (Math.PI / 3)); // stronger near c
      cornerIntensity = Math.max(cornerIntensity, influence);
    }

    // --- Overtaking & avoidance logic relative to target car (player) ---
    let lateralOffset = 0; // 0 = normal ideal line
    let desiredExtraSpeed = 0;

    if (targetCar) {
      const dx = targetCar.x - this.x;
      const dy = targetCar.y - this.y;
      const distToTarget = Math.hypot(dx, dy);

      // Is target roughly in front?
      const headingAngle = this.angle;
      const dirToTarget = Math.atan2(dy, dx);
      let angleDiff =
        ((dirToTarget - headingAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      const inFront = Math.abs(angleDiff) < Math.PI / 3; // +-60 deg

      // Decide if bot is behind or ahead in race terms
      const behind =
        this.lap < targetCar.lap ||
        (this.lap === targetCar.lap && this.progress < targetCar.progress);

      // Safe following distance
      const safeDist = CAR_LENGTH * 2.0;

      if (distToTarget < safeDist && inFront) {
        // Very close and in front: avoid collision
        // Steer slightly away from target and reduce speed
        const sideSign = angleDiff > 0 ? -1 : 1; // go opposite side of target
        lateralOffset += sideSign * (CAR_WIDTH * 0.8);
        desiredExtraSpeed -= 3 * diffReaction;
      } else if (behind && distToTarget < safeDist * 3) {
        // Behind and close: try to overtake with safe lateral offset
        const sideSign = angleDiff > 0 ? 1 : -1; // pick an overtake side
        lateralOffset += sideSign * (CAR_WIDTH * 1.2);
        desiredExtraSpeed += 2.5 * diffAggression;
      }

      // If directly blocked very near, brake harder
      if (distToTarget < CAR_LENGTH * 1.2 && inFront) {
        desiredExtraSpeed -= 5 * diffReaction;
      }
    }

    // ลดความพยายามแซงของบอทง่าย/กลางให้แสดงผลชัดขึ้น
    if (aiDifficulty === "easy") {
      lateralOffset *= 0.4;
      desiredExtraSpeed *= 0.3;
    } else if (aiDifficulty === "medium") {
      lateralOffset *= 0.5;    // ลด offset การแซงให้เน้นเฉพาะตอนโล่งจริง ๆ
      desiredExtraSpeed *= 0.5; // ลดแรงผลักให้รีบแซงลง
    }

    // Compute dynamic radius for racing line + overtake offset
    // Clamp offset so bot stays between inner and outer track
    const maxOffsetFromMid =
      (track.outerRadius() - track.innerRadius()) / 2 - CAR_WIDTH * 0.8;
    lateralOffset = Math.max(
      -maxOffsetFromMid,
      Math.min(maxOffsetFromMid, lateralOffset)
    );

    // Convert lateralOffset into radial change depending on heading
    // Lateral offset is perpendicular to radius (tangent), approximate with radius change
    const racingRadius = baseRadius + lateralOffset;

    const tx = cx + racingRadius * Math.cos(targetAngle);
    const ty = cy + racingRadius * Math.sin(targetAngle);

    // --- Steering control: smooth, proportional to angle error ---
    const dxT = tx - this.x;
    const dyT = ty - this.y;
    let desiredAngle = Math.atan2(dyT, dxT);

    // ใส่การเพี้ยนทิศเล็กน้อยตามระดับความยาก
    if (steerNoiseAmp > 0) {
      const noise = (Math.random() - 0.5) * steerNoiseAmp;
      desiredAngle += noise;
    }

    let delta =
      ((desiredAngle - this.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;

    // Proportional steering based on error, clamped by max turn
    const maxTurn = this.turnSpeed * dt * 60 * 1.8 * diffReaction;
    const steer = Math.max(-maxTurn, Math.min(maxTurn, delta));
    this.angle += steer;

    // --- Speed control: adjust for "corners" + desired overtaking speed ---
    const forwardX = Math.cos(this.angle);
    const forwardY = Math.sin(this.angle);
    const forwardSpeed = this.vx * forwardX + this.vy * forwardY;

    // Base desired speed from difficulty and nitro state
    let baseDesired = 10.5 * diffSpeedMul;
    if (this.nitro) baseDesired = 13.5 * diffSpeedMul;

    // Slow slightly in strong "corners" to avoid sliding too far
    const cornerSlow = 1 - cornerIntensity * 0.35; // between ~0.65 and 1
    let desiredSpeed = baseDesired * cornerSlow + desiredExtraSpeed;

    // ใส่ความผิดพลาดเรื่องความเร็ว: เร่งเกิน/ขาดเล็กน้อยตามระดับความยาก
    if (speedErrorFactor > 0) {
      const speedNoise = 1 + (Math.random() * 2 - 1) * speedErrorFactor;
      desiredSpeed *= speedNoise;
    }

    desiredSpeed = Math.max(5, desiredSpeed); // avoid going too slow

    // Accel/brake towards desired speed
    if (forwardSpeed < desiredSpeed) {
      this.vx += forwardX * this.accel * 1.7 * diffReaction;
      this.vy += forwardY * this.accel * 1.7 * diffReaction;
    } else {
      // Gentle "engine brake" / light braking if too fast
      const brakeStrength = 0.28 + 0.1 * cornerIntensity;
      this.vx -= forwardX * brakeStrength * dt * 60;
      this.vy -= forwardY * brakeStrength * dt * 60;
    }

    // Occasional controlled drifting when fast on straights, less random
    const speedNow = Math.hypot(this.vx, this.vy);
    const isOnStraight = cornerIntensity < 0.25;
    if (!this.drifting && isOnStraight && speedNow > 4) {
      if (Math.random() < 0.006 * diffAggression) {
        this.drifting = true;
      }
    } else if (this.drifting && (!isOnStraight || speedNow < 2.5)) {
      this.drifting = false;
    }

    // Use nitro in 1P mode more smartly on straights when behind
    if (
      gameMode === "single" &&
      !this.nitro &&
      this.nitroTimer > 0.6 &&
      speedNow > 3 &&
      isOnStraight &&
      targetCar
    ) {
      const behindInRace =
        this.lap < targetCar.lap ||
        (this.lap === targetCar.lap && this.progress < targetCar.progress);
      if (behindInRace && Math.random() < 0.08 * diffAggression) {
        this.nitro = true;
      }
    }

    // Limit maximum absolute speed based on car's own limits and difficulty multiplier
    const maxAllowed = this.baseMaxSpeed * 1.25 * diffSpeedMul;
    const currSpeed = Math.hypot(this.vx, this.vy);
    if (currSpeed > maxAllowed) {
      const scale = maxAllowed / currSpeed;
      this.vx *= scale;
      this.vy *= scale;
    }
  }

  clampToTrack() {
    const cx = track.centerX();
    const cy = track.centerY();
    const dx = this.x - cx;
    const dy = this.y - cy;
    const dist = Math.hypot(dx, dy);
    if (dist === 0) return;

    const inner = track.innerRadius() + CAR_WIDTH * 0.6;
    const outer = track.outerRadius() - CAR_WIDTH * 0.6;

    if (dist < inner || dist > outer) {
      const targetR = dist < inner ? inner : outer;
      const nx = dx / dist;
      const ny = dy / dist;

      // Snap back onto the track ring
      this.x = cx + nx * targetR;
      this.y = cy + ny * targetR;

      // Reflect velocity component towards wall to simulate bounce
      const vn = this.vx * nx + this.vy * ny;
      // If moving into the wall, reflect
      if ((dist < inner && vn < 0) || (dist > outer && vn > 0)) {
        const bounce = 0.3;
        this.vx -= (1 + bounce) * vn * nx;
        this.vy -= (1 + bounce) * vn * ny;
        // Slight slowdown on wall hit
        this.vx *= 0.8;
        this.vy *= 0.8;
      }
    }
  }

  spawnSmoke(smokeSystem) {
    // Emit from rear wheels
    const rearOffset = -CAR_LENGTH * 0.35;
    const sideOffset = CAR_WIDTH * 0.35;
    const sin = Math.sin(this.angle);
    const cos = Math.cos(this.angle);

    const baseX = this.x + rearOffset * cos;
    const baseY = this.y + rearOffset * sin;

    const leftX = baseX - sideOffset * sin;
    const leftY = baseY + sideOffset * cos;
    const rightX = baseX + sideOffset * sin;
    const rightY = baseY - sideOffset * cos;

    smokeSystem.add(leftX, leftY, this.vx * 0.2, this.vy * 0.2);
    smokeSystem.add(rightX, rightY, this.vx * 0.2, this.vy * 0.2);
  }

  updateProgress() {
    const cx = track.centerX();
    const cy = track.centerY();
    const angle = Math.atan2(this.y - cy, this.x - cx);
    // Normalize to [0,1)
    this.progress = (angle + Math.PI * 2) % (Math.PI * 2);

    // Lap counting across start/finish line
    const startAngle = (-Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);

    if (this.prevProgress === undefined) {
      this.prevProgress = this.progress;
      return;
    }

    if (!raceOver && !this.finished) {
      const crossed =
        this.prevProgress < startAngle && this.progress >= startAngle;

      if (crossed && this.speed > 0.5) {
        this.lap += 1;
        if (this.lap >= TOTAL_LAPS) {
          this.finished = true;
          if (!raceOver) {
            raceOver = true;
            winner = this === playerCar1 ? "RED" : "BLUE";
            playFinishSound(winner);
          }
        }
      }
    }

    this.prevProgress = this.progress;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Nitro thrust glow when active
    if (this.nitro) {
      const thrustLength = CAR_LENGTH * 0.8;
      const thrustWidth = CAR_WIDTH * 0.7;
      const gradient = ctx.createLinearGradient(
        -CAR_LENGTH / 2 - thrustLength,
        0,
        -CAR_LENGTH / 2,
        0
      );
      gradient.addColorStop(0, "rgba(255,240,150,0)");
      gradient.addColorStop(0.4, "rgba(255,220,120,0.7)");
      gradient.addColorStop(1, "rgba(255,255,255,0.9)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(-CAR_LENGTH / 2 - thrustLength, -thrustWidth / 2);
      ctx.lineTo(-CAR_LENGTH / 2, -CAR_WIDTH / 2);
      ctx.lineTo(-CAR_LENGTH / 2, CAR_WIDTH / 2);
      ctx.lineTo(-CAR_LENGTH / 2 - thrustLength, thrustWidth / 2);
      ctx.closePath();
      ctx.fill();
    }

    // Body
    ctx.fillStyle = this.color;
    ctx.fillRect(-CAR_LENGTH / 2, -CAR_WIDTH / 2, CAR_LENGTH, CAR_WIDTH);

    // Front highlight
    ctx.fillStyle = "#fff6";
    ctx.fillRect(CAR_LENGTH / 4, -CAR_WIDTH / 2, CAR_LENGTH / 4, CAR_WIDTH);

    // Windows
    ctx.fillStyle = "rgba(20,20,20,0.9)";
    ctx.fillRect(-CAR_LENGTH * 0.1, -CAR_WIDTH * 0.4, CAR_LENGTH * 0.45, CAR_WIDTH * 0.8);

    ctx.restore();
  }
}

class SmokeSystem {
  constructor() {
    this.particles = [];
  }

  add(x, y, vx, vy) {
    this.particles.push({
      x,
      y,
      vx: vx * (0.5 + Math.random() * 0.5),
      vy: vy * (0.5 + Math.random() * 0.5),
      life: 0.35 + Math.random() * 0.25,
      age: 0,
      size: 8 + Math.random() * 5,
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      if (p.age >= p.life) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.92;
      p.vy *= 0.92;
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      const t = p.age / p.life;
      const alpha = (1 - t) * 0.7;
      const size = p.size * (1 + t * 0.8);

      const gradient = ctx.createRadialGradient(
        p.x,
        p.y,
        0,
        p.x,
        p.y,
        size
      );
      gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
      gradient.addColorStop(1, `rgba(180,180,180,0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Create cars
const smokeSystem = new SmokeSystem();

function setupCars() {
  const cx = track.centerX();
  const cy = track.centerY();
  const radius = (track.innerRadius() + track.outerRadius()) / 2;

  const startAngle = -Math.PI / 2;
  const offset = 18;

  const player1X = cx + (radius - offset) * Math.cos(startAngle);
  const player1Y = cy + (radius - offset) * Math.sin(startAngle);

  const player2X = cx + (radius + offset) * Math.cos(startAngle);
  const player2Y = cy + (radius + offset) * Math.sin(startAngle);

  // Player 1: WASD, Shift nitro, Space drift (red car) using layout-independent codes
  playerCar1 = new Car(
    player1X,
    player1Y,
    0, // always face right
    "#e63946",
    false,
    {
      up: "KeyW",
      down: "KeyS",
      left: "KeyA",
      right: "KeyD",
      nitro: "ShiftLeft",
      drift: "Space"
    }
  );

  if (gameMode === "versus") {
    // Player 2: Arrow keys, right-side numpad 1 nitro, 2 drift (blue car)
    playerCar2 = new Car(
      player2X,
      player2Y,
      0, // always face right
      "#3498db",
      false,
      {
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
        nitro: "Numpad1",
        drift: "Numpad2"
      }
    );
  } else {
    // Single player: blue car as bot
    playerCar2 = new Car(
      player2X,
      player2Y,
      0, // always face right
      "#3498db",
      true,
      null
    );
  }

  raceOver = false;
  winner = null;
  if (playerCar1) {
    playerCar1.lap = 0;
    playerCar1.finished = false;
    playerCar1.prevProgress = undefined;
  }
  if (playerCar2) {
    playerCar2.lap = 0;
    playerCar2.finished = false;
    playerCar2.prevProgress = undefined;
  }
}

let playerCar1;
let playerCar2;
setupCars();

function beginCountdown() {
  countdownTime = 3.5;
  gameState = "countdown";
}

// Game mode / UI interaction
canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Ensure audio context can start on first user interaction
  getAudioCtx();

  // Pause button (during gameplay)
  if ((gameState === "racing" || gameState === "countdown") && pauseButton.visible) {
    if (
      x >= pauseButton.x &&
      x <= pauseButton.x + pauseButton.w &&
      y >= pauseButton.y &&
      y <= pauseButton.y + pauseButton.h
    ) {
      prevGameState = gameState;
      gameState = "pause";
      playClickSound();
      return;
    }
  }

  // Pause menu buttons
  if (gameState === "pause") {
    // Close (resume)
    if (
      pauseCloseButton.visible &&
      x >= pauseCloseButton.x &&
      x <= pauseCloseButton.x + pauseCloseButton.w &&
      y >= pauseCloseButton.y &&
      y <= pauseCloseButton.y + pauseCloseButton.h
    ) {
      gameState = prevGameState || "racing";
      prevGameState = null;
      playClickSound();
      return;
    }

    // Restart current race
    if (
      pauseRestartButton.visible &&
      x >= pauseRestartButton.x &&
      x <= pauseRestartButton.x + pauseRestartButton.w &&
      y >= pauseRestartButton.y &&
      y <= pauseRestartButton.y + pauseRestartButton.h
    ) {
      setupCars();
      beginCountdown();
      prevGameState = null;
      playClickSound();
      return;
    }

    // Surrender -> back to main menu
    if (
      pauseSurrenderButton.visible &&
      x >= pauseSurrenderButton.x &&
      x <= pauseSurrenderButton.x + pauseSurrenderButton.w &&
      y >= pauseSurrenderButton.y &&
      y <= pauseSurrenderButton.y + pauseSurrenderButton.h
    ) {
      gameMode = null;
      gameState = "menu";
      raceOver = false;
      winner = null;
      prevGameState = null;
      playClickSound();
      return;
    }

    // Change stage -> choose difficulty or mode
    if (
      pauseStageButton.visible &&
      x >= pauseStageButton.x &&
      x <= pauseStageButton.x + pauseStageButton.w &&
      y >= pauseStageButton.y &&
      y <= pauseStageButton.y + pauseStageButton.h
    ) {
      raceOver = false;
      winner = null;
      if (gameMode === "single") {
        gameState = "difficulty";
      } else {
        gameMode = null;
        gameState = "menu";
      }
      prevGameState = null;
      playClickSound();
      return;
    }
  }

  // Results screen buttons
  if (gameState === "results") {
    if (
      restartButton.visible &&
      x >= restartButton.x &&
      x <= restartButton.x + restartButton.w &&
      y >= restartButton.y &&
      y <= restartButton.y + restartButton.h
    ) {
      setupCars();
      beginCountdown();
      playClickSound();
      return;
    }
    if (
      changeModeButton.visible &&
      x >= changeModeButton.x &&
      x <= changeModeButton.x + changeModeButton.w &&
      y >= changeModeButton.y &&
      y <= changeModeButton.y + changeModeButton.h
    ) {
      gameMode = null;
      gameState = "menu";
      raceOver = false;
      winner = null;
      restartButton.visible = false;
      changeModeButton.visible = false;
      playClickSound();
      return;
    }
  }

  // Main menu: select 1P or 2P
  if (gameState === "menu") {
    const btnW = Math.min(220, width * 0.7);
    const btnH = 44;
    const spacing = 16;
    const startY = height / 2 - (btnH * 2 + spacing) / 2;
    const centerX = width / 2 - btnW / 2;

    const singleBtn = { x: centerX, y: startY, w: btnW, h: btnH };
    const versusBtn = {
      x: centerX,
      y: startY + btnH + spacing,
      w: btnW,
      h: btnH,
    };

    if (
      x >= singleBtn.x &&
      x <= singleBtn.x + singleBtn.w &&
      y >= singleBtn.y &&
      y <= singleBtn.y + singleBtn.h
    ) {
      gameMode = "single";
      gameState = "difficulty";
      playClickSound();
      return;
    }

    if (
      x >= versusBtn.x &&
      x <= versusBtn.x + versusBtn.w &&
      y >= versusBtn.y &&
      y <= versusBtn.y + versusBtn.h
    ) {
      gameMode = "versus";
      setupCars();
      beginCountdown();
      playClickSound();
      return;
    }
  }

  // Difficulty selection for 1P
  if (gameState === "difficulty" && gameMode === "single") {
    const btnW = Math.min(220, width * 0.7);
    const btnH = 44;
    const spacing = 12;
    const startY = height / 2 - (btnH * 3 + spacing * 2) / 2;
    const centerX = width / 2 - btnW / 2;

    // Back button (top-left)
    if (
      backButton.visible &&
      x >= backButton.x &&
      x <= backButton.x + backButton.w &&
      y >= backButton.y &&
      y <= backButton.y + backButton.h
    ) {
      gameMode = null;
      gameState = "menu";
      playClickSound();
      return;
    }

    const easyBtn = { x: centerX, y: startY, w: btnW, h: btnH };
    const medBtn = {
      x: centerX,
      y: startY + (btnH + spacing),
      w: btnW,
      h: btnH,
    };
    const hardBtn = {
      x: centerX,
      y: startY + (btnH + spacing) * 2,
      w: btnW,
      h: btnH,
    };

    if (
      x >= easyBtn.x &&
      x <= easyBtn.x + easyBtn.w &&
      y >= easyBtn.y &&
      y <= easyBtn.y + easyBtn.h
    ) {
      aiDifficulty = "easy";
      setupCars();
      beginCountdown();
      playClickSound();
      return;
    }

    if (
      x >= medBtn.x &&
      x <= medBtn.x + medBtn.w &&
      y >= medBtn.y &&
      y <= medBtn.y + medBtn.h
    ) {
      aiDifficulty = "medium";
      setupCars();
      beginCountdown();
      playClickSound();
      return;
    }

    if (
      x >= hardBtn.x &&
      x <= hardBtn.x + hardBtn.w &&
      y >= hardBtn.y &&
      y <= hardBtn.y + hardBtn.h
    ) {
      aiDifficulty = "hard";
      setupCars();
      beginCountdown();
      playClickSound();
      return;
    }
  }
});

// Game loop
let lastTime = performance.now();

function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function update(dt) {
  smokeSystem.update(dt);

  // Countdown logic
  if (gameState === "countdown") {
    countdownTime -= dt;

    // Determine current countdown step for sounds
    let step = null;
    if (countdownTime > 2.5) {
      step = 3;
    } else if (countdownTime > 1.5) {
      step = 2;
    } else if (countdownTime > 0.5) {
      step = 1;
    } else if (countdownTime > 0) {
      step = 0; // "เริ่ม!"
    }

    if (step !== lastCountdownStep && step !== null) {
      if (step > 0) {
        playCountdownBeep(step);
      } else {
        playStartSound();
      }
      lastCountdownStep = step;
    }

    if (countdownTime <= 0) {
      countdownTime = 0;
      gameState = "racing";
      lastCountdownStep = null;
    }
  }

  // Racing update
  if (gameState === "racing" && !raceOver) {
    const activeKeys = keys;
    playerCar1.update(dt, activeKeys, smokeSystem, playerCar2.isBot ? playerCar2 : null);
    playerCar2.update(dt, activeKeys, smokeSystem, playerCar1);

    // Handle collision between player and player2 cars
    handleCarCollision(playerCar1, playerCar2);

    if (raceOver && winner) {
      gameState = "results";
    }
  }
}

function handleCarCollision(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return;

  const minDist = CAR_LENGTH * 0.8;
  if (dist >= minDist) return;

  playCollisionSound();

  const overlap = minDist - dist;
  const nx = dx / dist;
  const ny = dy / dist;

  // Push cars apart
  a.x -= (nx * overlap) / 2;
  a.y -= (ny * overlap) / 2;
  b.x += (nx * overlap) / 2;
  b.y += (ny * overlap) / 2;

  // Separate velocity along collision normal (simple inelastic bounce)
  const avn = a.vx * nx + a.vy * ny;
  const bvn = b.vx * nx + b.vy * ny;
  const restitution = 0.2;
  const impulse = ((bvn - avn) * (1 + restitution)) / 2;

  a.vx += nx * impulse;
  a.vy += ny * impulse;
  b.vx -= nx * impulse;
  b.vy -= ny * impulse;

  // Slight slowdown on impact
  a.vx *= 0.9;
  a.vy *= 0.9;
  b.vx *= 0.9;
  b.vy *= 0.9;
}

function drawTrack(ctx) {
  const cx = track.centerX();
  const cy = track.centerY();
  const outer = track.outerRadius();
  const inner = track.innerRadius();

  // Background
  ctx.fillStyle = "#202020";
  ctx.fillRect(0, 0, width, height);

  // Grass
  ctx.fillStyle = "#17351f";
  ctx.beginPath();
  ctx.arc(cx, cy, outer + 40, 0, Math.PI * 2);
  ctx.fill();

  // Asphalt
  ctx.fillStyle = "#262626";
  ctx.beginPath();
  ctx.arc(cx, cy, outer, 0, Math.PI * 2);
  ctx.arc(cx, cy, inner, 0, Math.PI * 2, true);
  ctx.fill("evenodd");

  // Inner grass
  ctx.fillStyle = "#17351f";
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fill();

  // Center line (dashed)
  const mid = (inner + outer) / 2;
  ctx.strokeStyle = "#f4f4f4";
  ctx.setLineDash([10, 12]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, mid, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Start/finish line at the top of the circle
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#ffffff";
  const lineW = 4;
  ctx.fillRect(inner - 2, -lineW / 2, outer - inner, lineW);
  ctx.restore();
}

function drawHUD(ctx) {
  // Speeds up to 500 km/h based on each car's baseMaxSpeed
  const kmh1 = Math.round(
    Math.min(500, (playerCar1.speed / playerCar1.baseMaxSpeed) * 500)
  );
  const kmh2 = Math.round(
    Math.min(500, (playerCar2.speed / playerCar2.baseMaxSpeed) * 500)
  );

  const nitroReady1 = playerCar1.nitroTimer > 0.3;
  const nitroReady2 = playerCar2.nitroTimer > 0.3;

  ctx.save();

  // Draw STOP button (top-right) during gameplay (not when finished)
  if (gameState === "racing" || gameState === "countdown") {
    const btnSize = 40;
    const margin = 10;
    const x = width - btnSize - margin;
    const y = margin;

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x, y, btnSize, btnSize);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, btnSize, btnSize);

    ctx.fillStyle = "#ff4d4d";
    ctx.font = "12px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("STOP", x + btnSize / 2, y + btnSize / 2);

    pauseButton.x = x;
    pauseButton.y = y;
    pauseButton.w = btnSize;
    pauseButton.h = btnSize;
    pauseButton.visible = true;
  } else {
    pauseButton.visible = false;
  }

  // HUD for RED (left-bottom)
  const boxHeight = 70;
  const boxWidth = 170;

  if (gameState === "racing" || gameState === "countdown" || gameState === "results") {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(8, height - boxHeight - 8, boxWidth, boxHeight);

    ctx.fillStyle = "#fdfdfd";
    ctx.font = "11px system-ui";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    ctx.fillText(`RED KM/H: ${kmh1}`, 14, height - boxHeight + 2);
    ctx.fillText(`LAP: ${playerCar1.lap}/${TOTAL_LAPS}`, 14, height - boxHeight + 18);
    ctx.fillText(`NITRO: ${nitroReady1 ? "READY" : "CHARGING"}`, 14, height - boxHeight + 34);

    // Nitro gauge RED
    const gaugeX1 = 14;
    const gaugeY1 = height - boxHeight + 50;
    const gaugeW = boxWidth - 20;
    const gaugeH = 8;
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(gaugeX1, gaugeY1, gaugeW, gaugeH);
    const charge1 = Math.max(
      0,
      Math.min(1, playerCar1.nitroTimer / playerCar1.maxNitroTime)
    );
    ctx.fillStyle = "#ffcc33";
    ctx.fillRect(gaugeX1, gaugeY1, gaugeW * charge1, gaugeH);

    // HUD for BLUE (right-bottom)
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(width - boxWidth - 8, height - boxHeight - 8, boxWidth, boxHeight);

    ctx.fillStyle = "#fdfdfd";
    ctx.textAlign = "left";
    const baseXBlue = width - boxWidth - 2;
    ctx.fillText(`BLUE KM/H: ${kmh2}`, baseXBlue, height - boxHeight + 2);
    ctx.fillText(`LAP: ${playerCar2.lap}/${TOTAL_LAPS}`, baseXBlue, height - boxHeight + 18);
    ctx.fillText(`NITRO: ${nitroReady2 ? "READY" : "CHARGING"}`, baseXBlue, height - boxHeight + 34);

    // Nitro gauge BLUE
    const gaugeX2 = baseXBlue;
    const gaugeY2 = height - boxHeight + 50;
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(gaugeX2, gaugeY2, gaugeW, gaugeH);
    const charge2 = Math.max(
      0,
      Math.min(1, playerCar2.nitroTimer / playerCar2.maxNitroTime)
    );
    ctx.fillStyle = "#ffcc33";
    ctx.fillRect(gaugeX2, gaugeY2, gaugeW * charge2, gaugeH);
  }

  // Reset back button visibility by default
  backButton.visible = false;

  // Main menu UI
  if (gameState === "menu") {
    const title = "DRIFT RACE";
    ctx.fillStyle = "#ffffff";
    ctx.font = "22px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(title, width / 2, height * 0.25);

    const btnW = Math.min(220, width * 0.7);
    const btnH = 44;
    const spacing = 16;
    const startY = height / 2 - (btnH * 2 + spacing) / 2;

    const drawButton = (label, index) => {
      const x = width / 2 - btnW / 2;
      const y = startY + index * (btnH + spacing);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(x, y, btnW, btnH);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, btnW, btnH);
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px system-ui";
      ctx.fillText(label, width / 2, y + btnH / 2);
    };

    drawButton("เล่น 1 คน", 0);
    drawButton("เล่น 2 คน", 1);
  }

  // Difficulty selection UI
  if (gameState === "difficulty" && gameMode === "single") {
    ctx.fillStyle = "#ffffff";
    ctx.font = "18px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("เลือกความยาก", width / 2, height * 0.25);

    // Back button (top-left)
    const btnSize = 40;
    const margin = 10;
    const bx = margin;
    const by = margin;

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(bx, by, btnSize, btnSize);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, btnSize, btnSize);

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("←", bx + btnSize / 2, by + btnSize / 2);

    backButton.x = bx;
    backButton.y = by;
    backButton.w = btnSize;
    backButton.h = btnSize;
    backButton.visible = true;

    const btnW = Math.min(220, width * 0.7);
    const btnH = 44;
    const spacing = 12;
    const startY = height / 2 - (btnH * 3 + spacing * 2) / 2;

    const drawButton = (label, index) => {
      const x = width / 2 - btnW / 2;
      const y = startY + index * (btnH + spacing);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(x, y, btnW, btnH);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, btnW, btnH);
      ctx.fillStyle = "#ffffff";
      ctx.font = "16px system-ui";
      ctx.fillText(label, width / 2, y + btnH / 2);
    };

    drawButton("ง่าย", 0);
    drawButton("ปานกลาง", 1);
    drawButton("ยาก", 2);
  }

  // Countdown display
  if (gameState === "countdown" && countdownTime > 0) {
    let text = "";
    if (countdownTime > 2.5) {
      text = "3";
    } else if (countdownTime > 1.5) {
      text = "2";
    } else if (countdownTime > 0.5) {
      text = "1";
    } else {
      text = "เริ่ม!";
    }
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    const boxW = 140;
    const boxH = 80;
    const boxX = width / 2 - boxW / 2;
    const boxY = height / 2 - boxH / 2;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "#ffffff";
    ctx.font = "36px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, width / 2, height / 2);
  }

  // Pause menu
  if (gameState === "pause") {
    // Dim background
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, width, height);

    const menuW = Math.min(280, width * 0.85);
    const menuH = 220;
    const menuX = (width - menuW) / 2;
    const menuY = (height - menuH) / 2;

    ctx.fillStyle = "rgba(0,0,0,0.9)";
    ctx.fillRect(menuX, menuY, menuW, menuH);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(menuX, menuY, menuW, menuH);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "18px system-ui";
    ctx.fillText("หยุดเกม (PAUSE)", menuX + menuW / 2, menuY + 32);

    // Close (X) button
    const closeSize = 24;
    const closeX = menuX + menuW - closeSize - 8;
    const closeY = menuY + 8;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(closeX, closeY, closeSize, closeSize);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.strokeRect(closeX, closeY, closeSize, closeSize);
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px system-ui";
    ctx.fillText("X", closeX + closeSize / 2, closeY + closeSize / 2);

    pauseCloseButton.x = closeX;
    pauseCloseButton.y = closeY;
    pauseCloseButton.w = closeSize;
    pauseCloseButton.h = closeSize;
    pauseCloseButton.visible = true;

    // Buttons: Restart, Surrender, Change Stage
    const btnW = menuW - 40;
    const btnH = 36;
    const spacing = 10;
    const firstY = menuY + 70;

    const drawPauseBtn = (x, y, label) => {
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(x, y, btnW, btnH);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.strokeRect(x, y, btnW, btnH);
      ctx.fillStyle = "#ffffff";
      ctx.font = "14px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + btnW / 2, y + btnH / 2);
    };

    const xBtn = menuX + (menuW - btnW) / 2;

    // Restart
    const restartY = firstY;
    drawPauseBtn(xBtn, restartY, "เริ่มใหม่");
    pauseRestartButton.x = xBtn;
    pauseRestartButton.y = restartY;
    pauseRestartButton.w = btnW;
    pauseRestartButton.h = btnH;
    pauseRestartButton.visible = true;

    // Surrender
    const surrenderY = firstY + btnH + spacing;
    drawPauseBtn(xBtn, surrenderY, "ยอมแพ้ (กลับเมนูหลัก)");
    pauseSurrenderButton.x = xBtn;
    pauseSurrenderButton.y = surrenderY;
    pauseSurrenderButton.w = btnW;
    pauseSurrenderButton.h = btnH;
    pauseSurrenderButton.visible = true;

    // Change stage / mode
    const stageY = firstY + (btnH + spacing) * 2;
    drawPauseBtn(xBtn, stageY, "เปลี่ยนด่าน / โหมด");
    pauseStageButton.x = xBtn;
    pauseStageButton.y = stageY;
    pauseStageButton.w = btnW;
    pauseStageButton.h = btnH;
    pauseStageButton.visible = true;
  } else {
    pauseRestartButton.visible = false;
    pauseSurrenderButton.visible = false;
    pauseStageButton.visible = false;
    pauseCloseButton.visible = false;
  }

  // Results screen1
  if (gameState === "results" && winner) {
    const menuW = Math.min(280, width * 0.85);
    const menuH = 180;
    const menuX = (width - menuW) / 2;
    const menuY = (height - menuH) / 2;

    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(menuX, menuY, menuW, menuH);

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(menuX, menuY, menuW, menuH);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "20px system-ui";
    let mainText = "";
    if (gameMode === "single") {
      mainText = winner === "RED" ? "คุณชนะ!" : "คุณแพ้!";
    } else {
      mainText = winner === "RED" ? "RED WINNER" : "BLUE WINNER";
    }
    ctx.fillText(mainText, menuX + menuW / 2, menuY + 40);

    ctx.font = "12px system-ui";
    const subText =
      gameMode === "versus" ? "โหมด 2 คน" : "โหมด 1 คน (สู้กับบอท)";
    ctx.fillText(subText, menuX + menuW / 2, menuY + 70);

    // Buttons: Restart and Change Mode
    const btnW = 120;
    const btnH = 32;
    const spacing = 12;
    const totalWidth = btnW * 2 + spacing;
    const btnStartX = menuX + (menuW - totalWidth) / 2;
    const btnY = menuY + menuH - btnH - 20;

    // Restart button
    const rbX = btnStartX;
    const rbY = btnY;
    ctx.fillStyle = "#c0392b";
    ctx.fillRect(rbX, rbY, btnW, btnH);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.strokeRect(rbX, rbY, btnW, btnH);
    ctx.fillStyle = "#ffffff";
    ctx.font = "13px system-ui";
    ctx.fillText("เริ่มใหม่", rbX + btnW / 2, rbY + btnH / 2);

    restartButton.x = rbX;
    restartButton.y = rbY;
    restartButton.w = btnW;
    restartButton.h = btnH;
    restartButton.visible = true;

    // Change mode button
    const cbX = btnStartX + btnW + spacing;
    const cbY = btnY;
    ctx.fillStyle = "#34495e";
    ctx.fillRect(cbX, cbY, btnW, btnH);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.strokeRect(cbX, cbY, btnW, btnH);
    ctx.fillStyle = "#ffffff";
    ctx.font = "13px system-ui";
    ctx.fillText("เปลี่ยนโหมด", cbX + btnW / 2, cbY + btnH / 2);

    changeModeButton.x = cbX;
    changeModeButton.y = cbY;
    changeModeButton.w = btnW;
    changeModeButton.h = btnH;
    changeModeButton.visible = true;
  } else {
    restartButton.visible = false;
    changeModeButton.visible = false;
  }

  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  drawTrack(ctx);
  smokeSystem.draw(ctx);

  playerCar2.draw(ctx);
  playerCar1.draw(ctx);

  drawHUD(ctx);
}