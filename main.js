const canvas = document.getElementById("game"); // ดึง element canvas จาก HTML ที่มี id ว่า "game"
const ctx = canvas.getContext("2d"); // สร้างบริบท (Context) สำหรับการวาดภาพแบบ 2 มิติลงบนแคนวาส

let width = 0; // ตัวแปรสำหรับเก็บค่าความกว้างของพื้นที่แสดงผลเกม
let height = 0; // ตัวแปรสำหรับเก็บค่าความสูงของพื้นที่แสดงผลเกม
function resize() { // ฟังก์ชันสำหรับปรับขนาดหน้าจอเกมให้พอดีและคมชัดเสมอ
  width = canvas.clientWidth; // รับค่าความกว้างจริงของตัวแคนวาสจากหน้าเว็บ
  height = canvas.clientHeight; // รับค่าความสูงจริงของตัวแคนวาสจากหน้าเว็บ
  const dpr = window.devicePixelRatio || 1; // ตรวจสอบความละเอียดพิกเซลของหน้าจอ (ถ้าจอเทพอย่าง Retina จะเป็น 2+)
  canvas.width = width * dpr; // ปรับจำนวนพิกเซลในแคนวาสตามความละเอียดหน้าจอเพื่อความคมชัด
  canvas.height = height * dpr; // ปรับจำนวนพิกเซลแนวตั้งตามความละเอียดหน้าจอ
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // ตั้งค่าการแปลงพิกเซลให้ขยายตามความละเอียดหน้าจออัตโนมัติ
}
window.addEventListener("resize", resize); // เมื่อมีการขยับขนาดหน้าต่างเบราว์เซอร์ ให้รันฟังก์ชัน resize ใหม่
resize(); // เรียกใช้งานฟังก์ชัน resize ครั้งแรกเพื่อตั้งค่าเริ่มต้น

// ระบบเสียงพื้นฐาน (ใช้ Web Audio API เพื่อสร้างเสียงขึ้นมาเองโดยไม่ต้องโหลดไฟล์)
let audioCtx = null; // ตัวแปรสำหรับเก็บสถานะระบบเสียง (Audio Context)
function getAudioCtx() { // ฟังก์ชันสำหรับดึงหรือเริ่มระบบเสียง
  if (!audioCtx) { // ถ้ายังไม่มีระบบเสียงถูกสร้างขึ้น
    const Ctor = window.AudioContext || window.webkitAudioContext; // รองรับมาตรฐานเสียงทั้งเบราว์เซอร์ใหม่และเก่า
    if (Ctor) { // ถ้าเบราว์เซอร์รองรับ
      audioCtx = new Ctor(); // สร้างระบบเสียงใหม่ขึ้นมา
    }
  }
  return audioCtx; // ส่งคืนค่าระบบเสียงกลับไป
}

function playBeep({ frequency = 440, duration = 0.15, volume = 0.2, type = "square" } = {}) { // ฟังก์ชันสร้างเสียง "ติ๊ด" แบบสังเคราะห์
  const ctx = getAudioCtx(); // เรียกใช้งานระบบเสียง
  if (!ctx) return; // หากระบบเสียงไม่ทำงาน ให้จบฟังก์ชัน
  const osc = ctx.createOscillator(); // สร้างเครื่องกำเนิดคลื่นเสียง (Oscillator)
  const gain = ctx.createGain(); // สร้างเครื่องควบคุมระดับความดัง (Gain)
  osc.type = type; // กำหนดรูปแบบคลื่นเสียง (square = เสียงแบบเกม 8-bit, sawtooth = เสียงฟันเลื่อย)
  osc.frequency.setValueAtTime(frequency, ctx.currentTime); // ตั้งค่าความถี่ของเสียง (Hz)
  gain.gain.setValueAtTime(0, ctx.currentTime); // เริ่มต้นที่ระดับเสียงเงียบ (0)
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01); // เร่งความดังขึ้นในเสี้ยววินาทีเพื่อไม่ให้เสียงแตก
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration); // ค่อยๆ ลดระดับเสียงจางหายไปตามระยะเวลา
  osc.connect(gain); // เชื่อมต่อตัวสร้างเสียงเข้ากับตัวคุมความดัง
  gain.connect(ctx.destination); // ส่งเสียงที่คุมแล้วออกไปยังลำโพงหรือหูฟัง
  osc.start(ctx.currentTime); // เริ่มส่งสัญญาณเสียง
  osc.stop(ctx.currentTime + duration + 0.05); // สั่งหยุดส่งสัญญาณเมื่อหมดเวลาที่กำหนด
}

function playClickSound() { playBeep({ frequency: 900, duration: 0.08, volume: 0.18, type: "square" }); } // เสียงคลิกสั้นๆ แบบเกมย้อนยุค
function playNitroSound() { // เสียงเอฟเฟกต์ตอนกดใช้เทอร์โบ
  const ctx = getAudioCtx(); // เรียกระบบเสียง
  if (!ctx) return;
  const osc = ctx.createOscillator(); // สร้างคลื่นเสียง
  const gain = ctx.createGain(); // สร้างตัวคุมเสียง
  osc.type = "sawtooth"; // ใช้คลื่นเสียงแบบเลื่อยเพื่อให้เสียงดูแรงและดิบ
  osc.frequency.setValueAtTime(380, ctx.currentTime); // เริ่มต้นที่ความถี่ 380Hz
  osc.frequency.linearRampToValueAtTime(250, ctx.currentTime + 0.35); // ค่อยๆ ลดเสียงต่ำลงเหมือนเสียงเครื่องยนต์พุ่งไปข้างหน้า
  gain.gain.setValueAtTime(0.0, ctx.currentTime); // เริ่มจากเงียบ
  gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.02); // เร่งระดับเสียงขึ้นอย่างรวดเร็ว
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4); // ค่อยๆ จางเสียงหายไปใน 0.4 วินาที
  osc.connect(gain); // เชื่อมเสียง
  gain.connect(ctx.destination); // ออกลำโพง
  osc.start(ctx.currentTime); // เริ่มเสียง
  osc.stop(ctx.currentTime + 0.45); // หยุดเสียง
}
function playCollisionSound() { // เสียงเมื่อรถเกิดการชน
  const ctx = getAudioCtx(); // เรียกระบบเสียง
  if (!ctx) return;
  const osc = ctx.createOscillator(); // สร้างคลื่นเสียง
  const gain = ctx.createGain(); // สร้างตัวคุมเสียง
  osc.type = "sawtooth"; // ใช้เสียงดุดัน
  osc.frequency.setValueAtTime(100, ctx.currentTime); // ใช้เสียงทุ้มต่ำ (100Hz) เพื่อให้ดูมีความหนักแน่นตอนกระแทก
  gain.gain.setValueAtTime(0.2, ctx.currentTime); // ตั้งระดับความดัง
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2); // จางหายไปอย่างรวดเร็ว
  osc.connect(gain); // เชื่อมเสียง
  gain.connect(ctx.destination); // ออกลำโพง
  osc.start(ctx.currentTime); // เริ่มเสียง
  osc.stop(ctx.currentTime + 0.25); // หยุดเสียง
}
function playCountdownBeep(step) { // เสียงนับถอยหลัง 3-2-1
  const baseFreq = 600; // ความถี่ตั้งต้น
  const freq = baseFreq + (3 - step) * 80; // ปรับระดับเสียงให้แหลมขึ้นเรื่อยๆ เมื่อตัวเลขลดลง
  playBeep({ frequency: freq, duration: 0.22, volume: 0.22, type: "square" }); // เล่นเสียงติ๊ด
}
function playStartSound() { playBeep({ frequency: 420, duration: 0.35, volume: 0.26, type: "sawtooth" }); } // เสียงสัญญาณเริ่มแข่ง (Go!)
function playFinishSound() { // เสียงทำนองสั้นๆ เมื่อเข้าเส้นชัย
  playBeep({ frequency: 523.25, duration: 0.2, volume: 0.2 }); // เสียงโน้ตตัวแรก (Do)
  setTimeout(() => playBeep({ frequency: 659.25, duration: 0.3, volume: 0.2 }), 200); // เสียงโน้ตตัวที่สอง (Mi) หลังจากนั้น 0.2 วินาที
}

const audioAssets = {}; // คลังสำหรับเก็บข้อมูลเสียงที่เป็นไฟล์จริง
async function loadAudioAsset(name, url) { // ฟังก์ชันโหลดไฟล์เสียงจากภายนอกแบบ Async
  try {
    const response = await fetch(url); // ดึงข้อมูลไฟล์จากที่อยู่ URL ที่ส่งมา
    const arrayBuffer = await response.arrayBuffer(); // แปลงไฟล์เสียงเป็นข้อมูลดิบแบบ Buffer
    const ctx = getAudioCtx(); // เรียกระบบเสียง
    if (ctx) {
      audioAssets[name] = await ctx.decodeAudioData(arrayBuffer); // ถอดรหัสไฟล์เสียงเก็บไว้ในตัวแปร assets
    }
  } catch (e) {
    console.error("Failed to load sound", url); // แสดงข้อผิดพลาดหากโหลดไฟล์เสียงไม่สำเร็จ
  }
}

function playAudioAsset(name) { // ฟังก์ชันสำหรับเปิดเล่นไฟล์เสียงที่โหลดเก็บไว้แล้ว
  const ctx = getAudioCtx(); // เรียกระบบเสียง
  const buffer = audioAssets[name]; // ดึงข้อมูลเสียงจากคลัง
  if (!ctx || !buffer) return; // หากระบบไม่พร้อมหรือไม่มีไฟล์ ให้หยุดทำงาน
  const source = ctx.createBufferSource(); // สร้างตัวกำเนิดเสียงจากข้อมูล Buffer
  source.buffer = buffer; // ใส่ข้อมูลเสียงลงในตัวกำเนิด
  source.connect(ctx.destination); // เชื่อมต่ออกลำโพง
  source.start(0); // เริ่มเล่นเสียงทันที
}

loadAudioAsset('lap_complete', '/lap_complete.mp3'); // สั่งให้โหลดไฟล์เสียงแจ้งเตือนเมื่อครบรอบการแข่งขัน

// ส่วนจัดการปุ่มควบคุม (Input Handling)
const keys = new Set(); // สร้าง Set เพื่อเก็บปุ่มที่กำลังถูกกดค้างอยู่ (เพื่อรองรับการกดหลายปุ่มพร้อมกัน เช่น เลี้ยวพร้อมเร่ง)
window.addEventListener("keydown", (e) => { // ตรวจจับเมื่อมีการกดปุ่มบนคีย์บอร์ดลง
  keys.add(e.code); // เพิ่มโค้ดของปุ่มนั้นเข้าไปใน Set
  // ป้องกันการเลื่อนหน้าจอ (Scroll) เมื่อผู้ใช้กดปุ่มลูกศรหรือปุ่ม Spacebar ขณะเล่นเกม
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) {
    e.preventDefault(); // สั่งระงับพฤติกรรมปกติของเบราว์เซอร์ (ไม่ให้หน้าจอขยับ)
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.code)); // เมื่อปล่อยปุ่ม ให้ลบชื่อปุ่มนั้นออกจาก Set

const P1_KEYS = { // กำหนดชุดปุ่มควบคุมสำหรับผู้เล่นคนที่ 1 (ใช้ WASD)
  up: "KeyW", // เร่งเครื่อง
  down: "KeyS", // เบรก/ถอยหลัง
  left: "KeyA", // เลี้ยวซ้าย
  right: "KeyD", // เลี้ยวขวา
  drift: "Space", // ดริฟต์
  nitro: "ShiftLeft" // ใช้ไนโตรเร่งความเร็ว
};

const P2_KEYS = { // กำหนดชุดปุ่มควบคุมสำหรับผู้เล่นคนที่ 2 (ใช้ปุ่มลูกศร)
  up: "ArrowUp", // เร่งเครื่อง
  down: "ArrowDown", // เบรก/ถอยหลัง
  left: "ArrowLeft", // เลี้ยวซ้าย
  right: "ArrowRight", // เลี้ยวขวา
  drift: "Digit1", // ดริฟต์ (ปุ่มเลข 1)
  nitro: "Digit2" // ใช้ไนโตรเร่งความเร็ว (ปุ่มเลข 2)
};

// ส่วนกำหนดรายละเอียดสนามแข่ง (Tracks Definition)
const TRACKS = [
  {
    name: "สนามเลขแปด (∞)", // ชื่อสนาม
    laps: 3, // จำนวนรอบที่ต้องวิ่ง
    icon: "track_eight.png", // ไฟล์ไอคอนแสดงพรีวิวสนาม
    generatePath: (w, h) => { // ฟังก์ชันสร้างเส้นทางโดยอิงจากความกว้าง (w) และความสูง (h) ของจอ
      const cx = w / 2, cy = h / 2, size = Math.min(w, h) * 0.38; // หาจุดกึ่งกลางและกำหนดขนาดรัศมีสนาม
      const pts = []; // ตัวแปรเก็บชุดพิกัด x, y ของเส้นทาง
      for(let i=0; i<100; i++) { // วนลูป 100 จุดเพื่อสร้างความละเอียดของเส้นรอบวง
        const t = (i / 100) * Math.PI * 2; // คำนวณมุมในหน่วยเรเดียน
        // ใช้สูตร Lemniscate (เส้นโค้งรูปเลข 8) ในการหาพิกัด x และ y
        const x = cx + size * Math.cos(t); // พิกัด x อิงตามค่า Cosine
        const y = cy + (size * Math.sin(2*t)) / 1.8; // พิกัด y อิงตามค่า Sine ความถี่ 2 เท่าเพื่อให้เกิดการวาดวนสองวง
        pts.push({x, y}); // บันทึกจุดพิกัดลงในรายการเส้นทาง
      }
      return pts; // ส่งคืนชุดพิกัดทั้งหมดของสนาม
    },
    aiFocus: "intersection" // คำแนะนำสำหรับ AI ว่าให้ระวังจุดตัดกลางสนาม
  },
  {
    name: "สนามวงกลมความเร็วสูง", // ชื่อสนาม
    laps: 4, // จำนวนรอบ
    icon: "track_circle.png", // ไอคอนสนาม
    generatePath: (w, h) => { // ฟังก์ชันสร้างทางวิ่งทรงกลม
      const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.36; // กำหนดรัศมีวงกลมให้พอดีหน้าจอ
      const pts = []; // เก็บพิกัด
      for(let i=0; i<100; i++) { // วนลูปสร้างจุดรอบวงกลม
        const t = (i / 100) * Math.PI * 2; // คำนวณมุม
        pts.push({x: cx + r * Math.cos(t), y: cy + r * Math.sin(t)}); // ใช้สูตรวงกลมมาตรฐาน (x=r*cos, y=r*sin)
      }
      return pts; // ส่งคืนพิกัดสนามวงกลม
    },
    aiFocus: "speed" // คำแนะนำสำหรับ AI ว่าสนามนี้เน้นทำความเร็วทางโค้งกว้าง
  },
  {
    name: "สนามสี่เหลี่ยมโค้งแคบ", // ชื่อสนาม
    laps: 3, // จำนวนรอบ
    icon: "track_square.png", // ไอคอนสนาม
    generatePath: (w, h) => { // ฟังก์ชันสร้างเส้นทางทรงสี่เหลี่ยม
      const cx = w / 2, cy = h / 2, size = Math.min(w, h) * 0.35; // กำหนดระยะห่างจากกึ่งกลางไปยังขอบสี่เหลี่ยม
      const pts = []; // เก็บพิกัด
      const steps = 25; // กำหนดความละเอียด (จำนวนจุด) ในแต่ละด้านของสี่เหลี่ยม
      // กำหนดตำแหน่งจุดมุมสำคัญเพื่อใช้ลากเส้นต่อกัน
      const corners = [
        {x: cx - size, y: cy},        // จุดเริ่มกึ่งกลางด้านซ้าย
        {x: cx - size, y: cy - size}, // ไปมุมบนซ้าย
        {x: cx + size, y: cy - size}, // ไปมุมบนขวา
        {x: cx + size, y: cy + size}, // ไปมุมล่างขวา
        {x: cx - size, y: cy + size}, // ไปมุมล่างซ้าย
        {x: cx - size, y: cy}         // กลับมาบรรจบที่จุดเริ่มกึ่งกลางด้านซ้าย
      ];
      for (let c = 0; c < corners.length - 1; c++) { // ลูปผ่านจุดมุมแต่ละคู่เพื่อลากเส้นเชื่อม
        const start = corners[c]; // จุดเริ่มต้นของด้านนั้นๆ
        const end = corners[c + 1]; // จุดสิ้นสุดของด้านนั้นๆ
        for (let s = 0; s < steps; s++) { // สร้างจุดย่อยๆ ระหว่างมุมเพื่อไม่ให้รถวาร์ปข้ามมุม
          pts.push({
            x: start.x + (end.x - start.x) * (s / steps), // คำนวณพิกัด x แบบไล่ระดับ (Interpolation)
            y: start.y + (end.y - start.y) * (s / steps)  // คำนวณพิกัด y แบบไล่ระดับ
          });
        }
      }
      return pts; // ส่งคืนพิกัดสนามสี่เหลี่ยม
    },
    aiFocus: "drift" // คำแนะนำสำหรับ AI ว่าสนามนี้ต้องใช้การดริฟต์เข้าโค้งหักศอกบ่อย
  },
  {
    name: "สนามผสม (Mixed)", // ชื่อสนาม
    laps: 5, // จำนวนรอบ
    icon: "track_mixed.png", // ไอคอนสนาม
    generatePath: (w, h) => { // ฟังก์ชันสร้างสนามรูปทรงอิสระ (Organic Shape)
      const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.35; // กำหนดรัศมีฐาน
      const pts = []; // เก็บพิกัด
      for(let i=0; i<100; i++) { // วนลูป 100 จุด
        const t = (i / 100) * Math.PI * 2; // คำนวณมุม
        // ใช้คณิตศาสตร์ผสมคลื่น Sine หลายความถี่เพื่อให้รัศมีสนามยืดเข้าออก ดูขรุขระเหมือนสนามจริง
        const rad = r * (1 + 0.2 * Math.sin(t*3) + 0.1 * Math.cos(t*5)); // รัศมีจะเปลี่ยนไปตามมุม t
        pts.push({x: cx + rad * Math.cos(t), y: cy + rad * Math.sin(t)}); // คำนวณตำแหน่งพิกัดสุดท้าย
      }
      return pts; // ส่งคืนพิกัดสนามแบบผสม
    },
    aiFocus: "mixed" // คำแนะนำสำหรับ AI ว่าต้องใช้ทั้งความเร็วและการเข้าโค้งที่หลากหลาย
  }
];
// สถานะการแข่งขัน (Race state)
let gameState = "menu"; // เก็บสถานะปัจจุบันของหน้าจอเกม เริ่มต้นที่หน้าเมนู
let gameMode = "1p"; // โหมดการเล่น "1p" (เล่นคนเดียว) หรือ "2p" (เล่นสองคน)
let selectedTrackIdx = 0; // ลำดับของสนามที่ถูกเลือก (อิงจาก TRACKS array)
let botCount = 1; // จำนวนรถคู่แข่งที่เป็น Bot ในสนาม
let aiDifficulty = "medium"; // ระดับความยากของ AI (easy, medium, hard)
let countdownTime = 0; // ตัวเลขเวลานับถอยหลังก่อนเริ่มแข่ง
let lastCountdownStep = null; // เก็บค่าขั้นตอนการนับถอยหลังล่าสุดเพื่อใช้เล่นเสียงติ๊ด
let raceOver = false; // สถานะระบุว่าการแข่งขันจบลงหรือยัง
let winner = null; // เก็บข้อมูลผู้ชนะการแข่งขัน
let currentTrack = null; // เก็บพิกัดและข้อมูลสนามที่กำลังแข่งขันอยู่
let waypoints = []; // จุดเช็คพอยท์บนสนามเพื่อให้ AI วิ่งตามและเช็คการครบรอบ
let playerCar1; // ตัวแปรเก็บออบเจกต์รถของผู้เล่นคนที่ 1
let opponentCars = []; // รายการเก็บออบเจกต์รถของคู่แข่ง (Bot หรือ Player 2)
let menuHistory = ["menu"]; // ระบบประวัติหน้าเมนูเพื่อใช้สำหรับกดปุ่มย้อนกลับ

// ข้อมูลเพิ่มเติมของสนามสำหรับแสดงผลบน UI
const TRACK_META = [
  { difficulty: "★☆☆" }, // สนามที่ 1 ความยากระดับ 1 ดาว
  { difficulty: "★☆☆" }, // สนามที่ 2 ความยากระดับ 1 ดาว
  { difficulty: "★★☆" }, // สนามที่ 3 ความยากระดับ 2 ดาว
  { difficulty: "★★★" }  // สนามที่ 4 ความยากระดับ 3 ดาว
];

// ระบบจัดการปุ่มกดบนหน้าจอ (Buttons for UI)
const buttons = []; // คลังเก็บปุ่มทั้งหมดที่จะแสดงบน Canvas
function addButton(text, x, y, w, h, onClick, color = "#ff9f43") { // ฟังก์ชันสร้างปุ่มใหม่
  buttons.push({text, x, y, w, h, onClick, color, visible: true}); // เพิ่มรายละเอียดปุ่มลงในรายการ
}

// ระบบนำทางระหว่างหน้าจอ (Navigation)
function navigateTo(state) { // ฟังก์ชันสำหรับเปลี่ยนหน้าเมนูไปข้างหน้า
  if (menuHistory[menuHistory.length - 1] !== state) { // ถ้าหน้าใหม่ไม่ซ้ำกับหน้าปัจจุบัน
    menuHistory.push(state); // บันทึกหน้าใหม่ลงในประวัติ
  }
  gameState = state; // เปลี่ยนสถานะเกมไปยังหน้าที่ต้องการ
}

function navigateBack() { // ฟังก์ชันสำหรับย้อนกลับหน้าเมนูก่อนหน้า
  if (menuHistory.length > 1) { // ถ้ามีประวัติหน้าก่อนหน้า
    menuHistory.pop(); // ลบหน้าปัจจุบันออก
    gameState = menuHistory[menuHistory.length - 1]; // กลับไปหน้าก่อนหน้าในประวัติ
  } else {
    gameState = "menu"; // ถ้าไม่มีประวัติแล้วให้กลับหน้าเมนูหลัก
  }
}

// ระบบเอฟเฟกต์ควัน (Smoke System) สำหรับควันท่อไอเสียหรือรอยดริฟต์
const smokeSystem = {
  particles: [], // รายการเก็บเม็ดควันแต่ละเม็ด
  add(x, y, vx, vy) { // ฟังก์ชันเพิ่มเม็ดควัน
    this.particles.push({x, y, vx: vx*0.5, vy: vy*0.5, life: 1, age: 0, size: 5 + Math.random()*5}); // กำหนดพิกัด แรงส่ง อายุ และสุ่มขนาดควัน
  },
  update(dt) { // ฟังก์ชันอัปเดตการเคลื่อนที่ของควัน
    for(let i=this.particles.length-1; i>=0; i--) { // วนลูปเช็คควันทุกเม็ด
      const p = this.particles[i]; // ดึงข้อมูลควันเม็ดนั้นมา
      p.age += dt; // เพิ่มอายุตามเวลาที่ผ่านไป
      if(p.age > p.life) { this.particles.splice(i, 1); continue; } // ถ้าหมดอายุ (เกิน 1 วินาที) ให้ลบทิ้ง
      p.x += p.vx; p.y += p.vy; // ขยับพิกัดควันตามความเร็ว
      p.vx *= 0.95; p.vy *= 0.95; // ค่อยๆ ลดความเร็วควันลงเพื่อให้ดูสมจริง
    }
  },
  draw(ctx) { // ฟังก์ชันวาดควันลงบนจอ
    for(const p of this.particles) { // วนลูปวาดควันแต่ละเม็ด
      ctx.fillStyle = `rgba(200,200,200,${1 - p.age/p.life})`; // กำหนดสีเทาและค่อยๆ จางลงตามอายุ
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1+p.age), 0, Math.PI*2); ctx.fill(); // วาดวงกลมที่ขยายตัวขึ้นเรื่อยๆ ก่อนหายไป
    }
  }
};

// คลาสสำหรับสร้างและจัดการรถ (Car Class)
class Car {
  constructor(x, y, angle, color, isBot = false, playerNum = 1) { // ส่วนเริ่มต้นเมื่อสร้างรถใหม่
    this.x = x; this.y = y; this.angle = angle; // ตำแหน่ง X, Y และทิศทางหน้าปุ่ม
    this.color = color; this.isBot = isBot; // สีรถและระบุว่าเป็น Bot หรือไม่
    this.playerNum = playerNum; // หมายเลขผู้เล่น (1 หรือ 2)
    this.vx = 0; this.vy = 0; // ความเร็วในแนวแกน X และ Y
    this.speed = 0; // ความเร็วรวมปัจจุบัน
    this.baseMaxSpeed = 10; // ความเร็วสูงสุดปกติ
    this.nitroMaxSpeed = 13.5; // ความเร็วสูงสุดเมื่อใช้ไนโตร
    this.accel = 0.22; // อัตราเร่งของรถ
    this.brake = 0.3; // อัตราการเบรก
    this.friction = 0.05; // แรงเสียดทานอากาศ (ทำให้รถค่อยๆ ช้าลงเอง)
    this.turnSpeed = 0.06; // ความเร็วในการเลี้ยว
    this.nitroTimer = 2; // ปริมาณไนโตรที่เหลืออยู่ (วินาที)
    this.isNitro = false; // สถานะการใช้ไนโตร
    this.isDrifting = false; // สถานะการดริฟต์
    this.lap = 0; // รอบการแข่งขันที่วิ่งได้ปัจจุบัน
    this.progress = 0; // เปอร์เซ็นต์ความคืบหน้าบนสนาม (0-1)
    this.finished = false; // สถานะเข้าเส้นชัยหรือยัง
    this.prevProgress = 0; // ความคืบหน้าในเฟรมก่อนหน้า (ใช้เช็คว่าวิ่งถูกทางไหม)
    this.stunTimer = 0; // ตัวนับเวลาเมื่อรถมึนงงจากการชน
    this.smokeTimer = 0; // ตัวนับเวลาการปล่อยควัน
    this.waypointIdx = 0; // ลำดับจุดเช็คพอยท์ที่รถกำลังมุ่งหน้าไป (สำหรับ AI)
  }

  update(dt, input) { // ฟังก์ชันอัปเดตสภาวะของรถในทุกๆ เฟรม
    if (this.stunTimer > 0) { // หากรถอยู่ในสถานะมึน (เช่น ชนขอบ)
      this.stunTimer -= dt; // ลดเวลามึนลง
      this.vx *= 0.9; this.vy *= 0.9; // ลดความเร็วอย่างฮวบฮาบ
      this.x += this.vx; this.y += this.vy; // ขยับรถเล็กน้อยตามแรงกระแทก
      return; // จบการทำงานของเฟรมนี้ทันที (ควบคุมรถไม่ได้)
    }

    if (this.isBot) { // หากเป็นรถ AI
      this.handleBotLogic(dt); // เรียกใช้งานสมองของ Bot
    } else { // หากเป็นรถของผู้เล่น
      this.handlePlayerInput(dt, input); // ตรวจจับการกดปุ่มจากผู้เล่น
    }
    // ระบบฟิสิกส์ (Physics)
    const grip = this.isDrifting ? 0.08 : 0.22; // กำหนดการยึดเกาะถนน (ถ้าดริฟต์อยู่ค่าจะน้อยเพื่อให้รถไถล ถ้าไม่ดริฟต์ค่าจะมากเพื่อให้เลี้ยวคม)
    const forwardX = Math.cos(this.angle); // หาเวกเตอร์ทิศทางด้านหน้าของรถในแนวแกน X
    const forwardY = Math.sin(this.angle); // หาเวกเตอร์ทิศทางด้านหน้าของรถในแนวแกน Y
    const forwardSpeed = this.vx * forwardX + this.vy * forwardY; // คำนวณความเร็วของรถเฉพาะในทิศทางที่รถหันหน้าไป (Dot Product)
    
    // ปรับความเร็วรถให้พุ่งไปตามหน้าปัดรถตามค่าการยึดเกาะ (grip) เพื่อจำลองการไถลเข้าโค้ง
    this.vx += (forwardX * forwardSpeed - this.vx) * grip; 
    this.vy += (forwardY * forwardSpeed - this.vy) * grip;
    
    this.vx *= (1 - this.friction); // ลดความเร็วในแนวแกน X ตามแรงเสียดทาน (อากาศ/พื้นถนน)
    this.vy *= (1 - this.friction); // ลดความเร็วในแนวแกน Y ตามแรงเสียดทาน
    
    this.x += this.vx; // อัปเดตตำแหน่งรถตามความเร็วที่เหลืออยู่ในแกน X
    this.y += this.vy; // อัปเดตตำแหน่งรถตามความเร็วที่เหลืออยู่ในแกน Y
    this.speed = Math.hypot(this.vx, this.vy); // คำนวณความเร็วรวมปัจจุบัน (ใช้พีทาโกรัสหาขนาดของเวกเตอร์ความเร็ว)

    // ระบบฟื้นฟูไนโตร (Nitro regen)
    if (!this.isNitro && this.nitroTimer < 2) { // ถ้าไม่ได้ใช้ไนโตรอยู่และถังยังไม่เต็ม
      this.nitroTimer += dt * 0.2; // ค่อยๆ เติมไนโตรคืนให้ทีละนิดตามเวลาที่ผ่านไป
    }
    if (this.isNitro) { // ถ้ากำลังใช้ไนโตรอยู่
      this.nitroTimer -= dt; // หักล้างปริมาณไนโตรในถังออก
      if (this.nitroTimer <= 0) { // ถ้าหมดถัง
        this.nitroTimer = 0; // รีเซ็ตค่ากลับเป็น 0
        this.isNitro = false; // ปิดสถานะการใช้ไนโตร
      }
    }

    // ระบบพ่นควัน (Smoke)
    if ((this.isDrifting || this.isNitro) && this.speed > 2) { // ถ้ากำลังดริฟต์หรือใช้ไนโตร และรถกำลังเคลื่อนที่
      this.smokeTimer -= dt; // นับถอยหลังเวลาเพื่อพ่นควันรอบต่อไป
      if (this.smokeTimer < 0) { // เมื่อถึงเวลา
        // เพิ่มเม็ดควันตรงท้ายรถ (ลบออก 15 หน่วยจากตำแหน่งรถ) และให้ควันลอยสวนทางกับความเร็วรถ
        smokeSystem.add(this.x - forwardX * 15, this.y - forwardY * 15, -this.vx, -this.vy);
        this.smokeTimer = 0.05; // ตั้งเวลาพ่นควันรอบใหม่ (ทุกๆ 0.05 วินาที)
      }
    }

    this.updateWaypoints(); // อัปเดตตำแหน่งเช็คพอยท์ที่ใกล้ที่สุด
    this.checkTrackBounds(); // ตรวจสอบว่ารถวิ่งออกนอกสนามหรือชนขอบหรือไม่
    this.updateLapProgress(); // ตรวจสอบความคืบหน้าการวิ่งและนับรอบการแข่ง
  }

  updateWaypoints() { // ระบบค้นหาจุดเช็คพอยท์ที่ใกล้ตัวรถที่สุด
    let closestIdx = this.waypointIdx; // เริ่มต้นที่จุดเดิมที่เคยอยู่
    let minDist = Infinity; // ตั้งค่าระยะห่างเริ่มต้นให้เป็นอนันต์

    // วนลูปหาจุดบนสนามที่อยู่ใกล้รถที่สุด เพื่อระบุว่ารถอยู่ที่ไหนของสนาม
    for (let i = 0; i < waypoints.length; i++) {
      const d = Math.hypot(waypoints[i].x - this.x, waypoints[i].y - this.y); // วัดระยะจากรถไปหาจุด waypoint ที่ i
      if (d < minDist) { // ถ้าเจอจุดที่ใกล้กว่าเดิม
        minDist = d; // บันทึกระยะทางที่ใกล้ที่สุดใหม่
        closestIdx = i; // บันทึกตำแหน่งจุดที่ใกล้ที่สุด
      }
    }

    // ระบบป้องกันความผิดพลาด (Anti-Cheat/Glitch)
    const diff = (closestIdx - this.waypointIdx + waypoints.length) % waypoints.length; // หาผลต่างของลำดับจุด
    if (diff < waypoints.length * 0.5 || diff > waypoints.length * 0.95) { // ถ้ารถไม่ได้พยายามวิ่งย้อนศรแบบกระทันหัน
      this.waypointIdx = closestIdx; // อัปเดตจุดเช็คพอยท์ปัจจุบันของรถ
    }
  }

  handlePlayerInput(dt, input) { // ส่วนจัดการคำสั่งจากคีย์บอร์ดของผู้เล่น
    const k = this.playerNum === 1 ? P1_KEYS : P2_KEYS; // เลือกชุดปุ่มกดตามว่าเป็นผู้เล่นคนที่ 1 หรือ 2
    const up = input.has(k.up); // เช็คว่ากดปุ่มเดินหน้าไหม
    const down = input.has(k.down); // เช็คว่ากดปุ่มถอยหลัง/เบรกไหม
    const left = input.has(k.left); // เช็คว่าเลี้ยวซ้ายไหม
    const right = input.has(k.right); // เช็คว่าเลี้ยวขวาไหม
    const nitro = input.has(k.nitro); // เช็คว่ากดไนโตรไหม
    const drift = input.has(k.drift); // เช็คว่ากดดริฟต์ไหม

    const maxS = this.isNitro ? this.nitroMaxSpeed : this.baseMaxSpeed; // กำหนดเพดานความเร็วสูงสุด (เพิ่มขึ้นถ้าใช้ไนโตร)
    const curA = this.isNitro ? this.accel * 1.5 : this.accel; // กำหนดแรงส่ง (แรงขึ้นถ้าใช้ไนโตร)

    if (up) { // ถ้ากดเดินหน้า
      this.vx += Math.cos(this.angle) * curA; // เร่งความเร็วไปในทิศทาง X ที่รถหันไป
      this.vy += Math.sin(this.angle) * curA; // เร่งความเร็วไปในทิศทาง Y ที่รถหันไป
    } else if (down) { // ถ้ากดเบรก
      this.vx -= Math.cos(this.angle) * this.brake; // ลดความเร็วในทิศทางที่รถหันไป
      this.vy -= Math.sin(this.angle) * this.brake; // ลดความเร็วในทิศทางที่รถหันไป
    }

    const sMag = Math.hypot(this.vx, this.vy); // หาขนาดความเร็วปัจจุบัน
    if (sMag > maxS) { // ถ้ารถเร็วเกินเพดานที่กำหนด
      this.vx = (this.vx / sMag) * maxS; // จำกัดความเร็วแกน X ไม่ให้เกิน maxS
      this.vy = (this.vy / sMag) * maxS; // จำกัดความเร็วแกน Y ไม่ให้เกิน maxS
    }

    const turnFactor = Math.min(1, sMag / 3); // คำนวณค่าช่วยเลี้ยว (ถ้ารถจอดอยู่จะเลี้ยวไม่ได้ ต้องมีความเร็วระดับหนึ่งก่อน)
    if (left) this.angle -= this.turnSpeed * turnFactor; // หันหน้ารถไปทางซ้าย
    if (right) this.angle += this.turnSpeed * turnFactor; // หันหน้ารถไปทางขวา

    this.isDrifting = drift; // ตั้งสถานะดริฟต์ตามการกดปุ่ม
    if (nitro && !this.isNitro && this.nitroTimer > 0.5) { // เงื่อนไขการกดใช้ไนโตร (ต้องมีเหลือมากกว่า 0.5 วินาที)
      this.isNitro = true; // เปิดใช้งานไนโตร
      playNitroSound(); // เล่นเสียงประกอบไนโตร
    }
  }

  handleBotLogic(dt) { // สมองกลสำหรับควบคุมรถคู่แข่ง (AI)
    // ระบบมองไปข้างหน้า (Look ahead) เพื่อให้ AI เลี้ยวโค้งได้ล่วงหน้าเหมือนคนขับจริง
    const lookAhead = 12; // กำหนดให้ AI มองจุดถัดไปจากตำแหน่งปัจจุบัน 12 จุด
    const targetIdx = (this.waypointIdx + lookAhead) % waypoints.length; // หาตำแหน่งเป้าหมายที่จะขับไปหา
    const wp = waypoints[targetIdx]; // ดึงพิกัดของจุดเป้าหมาย
    
    const dx = wp.x - this.x; // หาระยะห่างแกน X ระหว่างเป้าหมายกับรถ
    const dy = wp.y - this.y; // หาระยะห่างแกน Y ระหว่างเป้าหมายกับรถ

    const targetAngle = Math.atan2(dy, dx); // ใช้ตรีโกณมิติหาองศาที่รถต้องหันไปเพื่อมุ่งหน้าสู่เป้าหมาย
    let diff = targetAngle - this.angle; // คำนวณผลต่างระหว่างองศาปัจจุบันกับองศาเป้าหมาย
    while (diff < -Math.PI) diff += Math.PI * 2; // ปรับค่ามุมให้ไม่เกินช่วง -180 ถึง 180 องศา
    while (diff > Math.PI) diff -= Math.PI * 2; // ปรับค่ามุมให้กระชับที่สุด

    // ส่วนการหันหน้าไปหาเป้าหมาย (Steer towards target) สำหรับบอท
    const steerFactor = 1.3; // ตัวคูณความแรงในการหักพวงมาลัยของ AI
    const steerLimit = this.turnSpeed * steerFactor; // กำหนดขีดจำกัดสูงสุดในการเลี้ยวต่อเฟรม
    this.angle += Math.max(-steerLimit, Math.min(steerLimit, diff)); // ปรับองศารถให้เลี้ยวไปหาเป้าหมายแต่ไม่เกินขีดจำกัด

    let targetSpeed = this.baseMaxSpeed; // ตั้งความเร็วเป้าหมายเริ่มต้นไว้ที่ค่าความเร็วสูงสุดปกติ
    if (aiDifficulty === "easy") targetSpeed *= 0.65; // ถ้าความยากระดับง่าย ให้บอทวิ่งแค่ 65% (ให้ผู้เล่นชนะง่ายขึ้น)
    if (aiDifficulty === "medium") targetSpeed *= 0.9; // ระดับกลาง วิ่ง 90%
    if (aiDifficulty === "hard") targetSpeed *= 1.1; // ระดับยาก บอทจะซิ่งเกินร้อย (110%)

    // ระบบลดความเร็วเมื่อเจอทางโค้งหักศอกเพื่อไม่ให้รถหลุดสนาม
    const turnSeverity = Math.abs(diff); // เช็คว่าทางข้างหน้าเลี้ยวหักศอกแค่ไหน
    if (turnSeverity > 0.5) { // ถ้าโค้งค่อนข้างแคบ
      targetSpeed *= 0.6; // ให้ AI แตะเบรกลดความเร็วลงเหลือ 60% ของความเร็วเป้าหมาย
    }

    // ตรรกะการใช้ไนโตรของ AI (Nitro Logic)
    if (turnSeverity < 0.2 && this.nitroTimer > 1.5 && Math.random() < 0.02) { // ถ้าเป็นทางตรงและมีไนโตรเหลือพอ
      this.isNitro = true; // ให้บอทเปิดใช้งานไนโตร
      playNitroSound(); // เล่นเสียงประกอบ
    }

    if (this.isNitro) targetSpeed *= 1.4; // ถ้าเปิดไนโตร ให้เพิ่มความเร็วเป้าหมายขึ้นอีก 40%

    const sMag = Math.hypot(this.vx, this.vy); // วัดขนาดความเร็วปัจจุบันของบอท
    
    // การตัดสินใจเร่งเครื่องหรือเบรก (Accelerate or Brake)
    if (sMag < targetSpeed) { // ถ้าความเร็วยังไม่ถึงเป้าหมาย
      const curA = this.isNitro ? this.accel * 1.8 : this.accel; // เพิ่มอัตราเร่ง (แรงขึ้นถ้าใช้ไนโตร)
      this.vx += Math.cos(this.angle) * curA; // เร่งความเร็วแกน X
      this.vy += Math.sin(this.angle) * curA; // เร่งความเร็วแกน Y
    } else if (sMag > targetSpeed + 2) { // ถ้าเร็วเกินเป้าหมายไปมาก
      this.vx *= 0.95; // ใช้ Engine Braking (ค่อยๆ ชะลอความเร็วแกน X)
      this.vy *= 0.95; // ชะลอความเร็วแกน Y
    }

    // ตรรกะการดริฟต์ของบอท (Drifting logic)
    this.isDrifting = turnSeverity > 0.7 && sMag > 4; // ให้บอทสะบัดท้ายดริฟต์ถ้าโค้งหักศอกมากและความเร็วสูงพอ

    // ระบบกู้คืนหากบอทติดแหง็ก (Recovery Logic)
    if (!this.stuckTimer) this.stuckTimer = 0; // สร้างตัวนับเวลาค้างถ้ายังไม่มี
    if (sMag < 1.0) { // ถ้ารถขยับช้ามาก (เหมือนติดหล่มหรือชนกำแพง)
      this.stuckTimer += dt; // เริ่มนับเวลาที่ค้าง
      if (this.stuckTimer > 2.5) { // ถ้าค้างเกิน 2.5 วินาที
        const resetWp = waypoints[this.waypointIdx]; // หาจุดเช็คพอยท์ล่าสุด
        this.x = resetWp.x; // วาร์ปรถกลับไปที่จุดนั้น
        this.y = resetWp.y; // วาร์ปแกน Y
        this.vx = 0; this.vy = 0; // หยุดความเร็วทั้งหมด
        this.stuckTimer = 0; // รีเซ็ตตัวนับเวลาค้าง
      }
    } else {
      this.stuckTimer = 0; // ถ้ารถขยับได้ปกติ ให้รีเซ็ตเวลาค้างเป็น 0
    }
  }

  checkTrackBounds() { // ระบบตรวจสอบขอบสนามและการวิ่งบนหญ้า
    let minDist = Infinity; // ตั้งค่าระยะห่างน้อยที่สุดเริ่มต้น
    let closestWp = waypoints[0]; // สมมติให้จุดแรกเป็นจุดที่ใกล้ที่สุดก่อน
    for (let p of waypoints) { // วนลูปหาจุดบนสนามที่ใกล้รถที่สุดในปัจจุบัน
      const d = Math.hypot(p.x - this.x, p.y - this.y);
      if (d < minDist) {
        minDist = d;
        closestWp = p;
      }
    }
    
    const trackWidth = 100; // กำหนดความกว้างของถนน (ระยะจากกึ่งกลาง)
    // ถ้าเริ่มออกนอกถนน (เช่น วิ่งบนหญ้าหรือดิน) ให้รถวิ่งช้าลง
    if (minDist > trackWidth) {
      const slowDown = this.isBot ? 0.85 : 0.92; // บอทจะโดนหญ้าดูดวิญญาณมากกว่าผู้เล่นเพื่อไม่ให้มันลัดสนามเกินไป
      this.vx *= slowDown;
      this.vy *= slowDown;
      
      // ถ้าออกนอกสนามไปไกลเกินไป (หลุดโลก) ให้วาร์ปกลับมาบนถนน
      const limit = this.isBot ? trackWidth + 100 : trackWidth + 180;
      if (minDist > limit) { 
        this.x = closestWp.x; // วาร์ปกลับจุดเช็คพอยท์ที่ใกล้ที่สุด
        this.y = closestWp.y;
        this.vx = 0; // หยุดรถ
        this.vy = 0;
        this.stunTimer = 0.6; // ทำให้รถมึนงงขยับไม่ได้ 0.6 วินาที
        if (!this.isBot) playCollisionSound(); // ถ้าเป็นผู้เล่นให้เล่นเสียงชน
      }
    }
  }

  updateLapProgress() { // ระบบนับรอบการแข่งขัน
    if (raceOver) return; // ถ้าจบการแข่งแล้วไม่ต้องทำอะไร
    this.progress = this.waypointIdx / waypoints.length; // คำนวณเปอร์เซ็นต์ความคืบหน้าของสนาม

    // ตรวจสอบการวิ่งผ่านเส้นชัย (เช็คจากการเปลี่ยนตำแหน่งจากท้ายสนามมาต้นสนาม)
    if (typeof this.lastWp !== 'undefined') {
      const crossedFinish = (this.lastWp > waypoints.length * 0.7 && this.waypointIdx < waypoints.length * 0.3);
      
      if (crossedFinish) { // ถ้าวิ่งข้ามเส้นชัย
        this.lap++; // เพิ่มจำนวนรอบ
        if (this.lap < currentTrack.laps) { // ถ้ายังไม่ครบจำนวนรอบทั้งหมด
          playAudioAsset('lap_complete'); // เล่นเสียงแจ้งเตือนครบรอบ
        }

        if (this.lap >= currentTrack.laps) { // ถ้าวิ่งครบจำนวนรอบที่กำหนดแล้ว
          this.finished = true; // ตั้งสถานะว่าวิ่งจบแล้ว
          if (!raceOver) { // ถ้ายังไม่มีใครเข้าเส้นชัยเป็นคนแรก
            raceOver = true; // สั่งจบการแข่งขัน
            if (gameMode === "1p") { // โหมดเล่นคนเดียว
              winner = this.isBot ? "BOT" : "PLAYER"; // บอทหรือผู้เล่นชนะ
            } else { // โหมดเล่นสองคน
              winner = this.playerNum === 1 ? "PLAYER 1" : "PLAYER 2"; // ใครเข้าที่หนึ่ง
            }
            playFinishSound(); // เล่นเสียงฉลองชัยชนะ
          }
        }
      }
    }
    this.lastWp = this.waypointIdx; // บันทึกตำแหน่งเช็คพอยท์ล่าสุดไว้เทียบในเฟรมหน้า
  }

  draw(ctx) { // ฟังก์ชันเริ่มต้นการวาดตัวรถ
    // คำนวณหาจุดที่ใกล้ที่สุดอีกครั้งเพื่อใช้ตรวจสอบตำแหน่งสำหรับการวาด (เช่น การวาดลูกศรชี้ทาง)
    let minDist = Infinity;
    let closestWp = waypoints[0];
    for (let p of waypoints) {
      const d = Math.hypot(p.x - this.x, p.y - this.y);
      if (d < minDist) {
        minDist = d;
        closestWp = p;
      }
    }

    ctx.save(); // บันทึกสถานะการวาดปัจจุบัน
    ctx.translate(this.x, this.y); // ย้ายจุดศูนย์กลางการวาดไปที่ตำแหน่งของรถ
    ctx.rotate(this.angle); // หมุนแคนวาสตามองศาการหันหน้าของรถ

    // ส่วนวาดเอฟเฟกต์ไฟไนโตร (Nitro fire)
    if (this.isNitro) { // ถ้าสถานะไนโตรทำงานอยู่
      ctx.fillStyle = "orange"; // ใช้สีส้ม
      ctx.fillRect(-25, -8, 15, 16); // วาดสี่เหลี่ยมพ่นออกมาจากท้ายรถ (ตำแหน่งลบคือด้านหลังรถ)
    }

    // ส่วนวาดตัวถังรถ (Car Body)
    ctx.fillStyle = this.color; // ใช้สีประจำตัวรถ (ที่สุ่มหรือกำหนดมา)
    ctx.fillRect(-15, -10, 30, 20); // วาดตัวรถทรงสี่เหลี่ยมรอบจุดศูนย์กลาง
    
    // ส่วนวาดห้องโดยสาร (Cabin)
    ctx.fillStyle = "rgba(0,0,0,0.5)"; // สีดำโปร่งแสง 50% เหมือนกระจกติดฟิล์ม
    ctx.fillRect(-2, -7, 12, 14); // วาดกระจกหน้าและหลังคารถ
    
    // ส่วนวาดไฟหน้า (Headlights)
    ctx.fillStyle = "yellow"; // สีเหลืองสว่าง
    ctx.fillRect(12, -9, 4, 4); // ไฟหน้าดวงซ้าย
    ctx.fillRect(12, 5, 4, 4); // ไฟหน้าดวงขวา
    
    ctx.restore(); // คืนค่าสถานะแคนวาส (หลังจากที่หมุนและย้ายตำแหน่งเพื่อวาดรถเสร็จแล้ว)
  }
}

// ฟังก์ชันจัดการการชนกันระหว่างรถสองคัน (Collision Handling)
function handleCollision(a, b) {
  const dx = b.x - a.x; // ระยะห่างแนวแกน X
  const dy = b.y - a.y; // ระยะห่างแนวแกน Y
  const dist = Math.hypot(dx, dy); // คำนวณระยะห่างจริงๆ ระหว่างรถสองคัน
  if (dist < 25) { // ถ้าอยู่ใกล้กันเกิน 25 พิกเซล (ชนกันแล้ว)
    playCollisionSound(); // เล่นเสียงชน
    const angle = Math.atan2(dy, dx); // หามุมของแรงกระแทก
    const force = 5; // กำหนดความแรงของการกระเด้ง
    a.vx -= Math.cos(angle) * force; // ผลักรถคันแรกไปทางตรงข้าม
    a.vy -= Math.sin(angle) * force;
    b.vx += Math.cos(angle) * force; // ผลักรถคันที่สองไปตามแรงชน
    b.vy += Math.sin(angle) * force;
    
    // บทลงโทษ "ชนหนัก" (Heavy collision penalty)
    if (Math.hypot(a.vx - b.vx, a.vy - b.vy) > 8) { // ถ้าความเร็วขณะปะทะกันสูงมาก
       a.stunTimer = 0.5; // ทำให้รถคันแรกมึน ขยับไม่ได้ 0.5 วินาที
       b.stunTimer = 0.5; // ทำให้รถคันที่สองมึนด้วย
    }
  }
}

// ฟังก์ชันเตรียมความพร้อมก่อนเริ่มแข่ง (Initialize Race)
function initRace() {
  currentTrack = TRACKS[selectedTrackIdx]; // ดึงข้อมูลสนามที่เลือกมาใช้
  waypoints = currentTrack.generatePath(width, height); // สร้างเส้นทางจุดเช็คพอยท์ตามขนาดหน้าจอ
  const start = waypoints[0]; // จุดสตาร์ทคือจุดแรกของสนาม
  const next = waypoints[1]; // จุดถัดไปเพื่อใช้คำนวณทิศทางการหันหน้าของรถ
  const angle = Math.atan2(next.y - start.y, next.x - start.x); // คำนวณองศาเริ่มแรกให้รถหันไปถูกทาง
  
  playerCar1 = new Car(start.x, start.y, angle, "#ff4757", false, 1); // สร้างรถของผู้เล่นคนที่ 1
  opponentCars = []; // ล้างรายการคู่แข่งเก่าออก

  if (gameMode === "1p") { // ถ้าเล่นคนเดียว
    const botColors = ["#2e86de", "#3498db", "#2980b9", "#1abc9c", "#16a085"]; // คลังสีของบอท
    for (let i = 0; i < botCount; i++) { // วนลูปสร้างบอทตามจำนวนที่กำหนด
      // เลื่อนตำแหน่งรถบอทไปด้านข้าง (Offset) เพื่อไม่ให้เกิดทับกับรถผู้เล่นที่จุดสตาร์ท
      const offsetX = Math.cos(angle + Math.PI / 2) * (35 * (i + 1));
      const offsetY = Math.sin(angle + Math.PI / 2) * (35 * (i + 1));
      opponentCars.push(new Car(start.x + offsetX, start.y + offsetY, angle, botColors[i % botColors.length], true, i + 2));
    }
  } else { // ถ้าเล่นสองคน (PVP)
    const offsetX = Math.cos(angle + Math.PI / 2) * 35;
    const offsetY = Math.sin(angle + Math.PI / 2) * 35;
    opponentCars.push(new Car(start.x + offsetX, start.y + offsetY, angle, "#3498db", false, 2)); // สร้างรถผู้เล่นที่ 2
  }
  
  raceOver = false; // รีเซ็ตสถานะจบเกม
  winner = null; // รีเซ็ตผู้ชนะ
  gameState = "countdown"; // เปลี่ยนสถานะไปที่หน้านับถอยหลัง
  countdownTime = 3.5; // ตั้งเวลานับถอยหลัง (เผื่อเวลาให้คนเตรียมตัวนิดนึง)
  smokeSystem.particles = []; // ล้างควันเก่าๆ ทิ้งให้หมด
  menuHistory = ["menu"]; // รีเซ็ตประวัติหน้าเมนู
}

// ฟังก์ชันวาดหน้าเมนูหลัก (Main Menu UI)
function drawMenu() {
  ctx.fillStyle = "#1e272e"; // สีพื้นหลังเทาเข้มเกือบดำ
  ctx.fillRect(0, 0, width, height); // วาดพื้นหลังเต็มจอ
  
  // วาดเส้นวงกลมจางๆ ตกแต่งพื้นหลัง (Background decoration)
  ctx.strokeStyle = "rgba(255,255,255,0.05)"; // สีขาวใสมากๆ
  ctx.lineWidth = 100; // เส้นหนาๆ เหมือนถนน
  ctx.beginPath();
  ctx.arc(width/2, height/2, 250, 0, Math.PI*2); // วาดวงกลมกลางจอ
  ctx.stroke();

  ctx.fillStyle = "#ffffff"; // สีข้อความขาว
  ctx.font = "bold 64px system-ui"; // ตัวอักษรหนา ขนาดใหญ่
  ctx.textAlign = "center"; // จัดข้อความให้อยู่กึ่งกลาง
  ctx.fillText("DRIFT RACE", width/2, height/2 - 80); // วาดชื่อเกม

  buttons.length = 0; // ล้างรายชื่อปุ่มเก่าทิ้งก่อนวาดใหม่ในเฟรมนี้
  const bw = 240, bh = 60, spacing = 20; // กำหนดขนาดปุ่มและระยะห่าง
  const startY = height/2; // จุดเริ่มวางปุ่มแรก

  // เพิ่มปุ่ม "เล่น 1 คน"
  addButton("▶ เล่น 1 คน", width/2 - bw/2, startY, bw, bh, () => {
    gameMode = "1p"; // ตั้งโหมดเป็นเล่นคนเดียว
    botCount = 1; // เริ่มต้นที่บอท 1 ตัว
    navigateTo("difficultySelect"); // ไปหน้าเลือกความยาก
    playClickSound(); // เล่นเสียงคลิก
  }, "#2ecc71"); // สีเขียว

  // เพิ่มปุ่ม "เล่น 2 คน"
  addButton("▶ เล่น 2 คน", width/2 - bw/2, startY + (bh + spacing), bw, bh, () => {
    gameMode = "2p"; // ตั้งโหมดเป็นเล่นสองคน
    navigateTo("trackSelect"); // ไปหน้าเลือกสนาม
    playClickSound();
  }, "#e67e22"); // สีส้ม

  // เพิ่มปุ่ม "วิธีเล่น"
  addButton("▶ วิธีเล่น", width/2 - bw/2, startY + (bh + spacing) * 2, bw, bh, () => {
    navigateTo("howToPlay"); // ไปหน้าสอนเล่น
    playClickSound();
  }, "#3498db"); // สีฟ้า

  drawAllButtons(); // เรียกฟังก์ชันวาดปุ่มทั้งหมดที่แอดไว้ด้านบนลงจอ
}

// ฟังก์ชันวาดหน้าเลือกจำนวนบอท (กรณีเล่นคนเดียว)
function drawBotCountSelect() {
  ctx.fillStyle = "#1e272e"; // พื้นหลังสีเทาเข้ม
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "white"; // ข้อความสีขาว
  ctx.font = "bold 32px system-ui"; // ฟอนต์หัวข้อขนาด 32px
  ctx.textAlign = "center";
  ctx.fillText("เลือกจำนวนบอท", width/2, 100);

  buttons.length = 0; // ล้างรายการปุ่มเดิม
  const bw = 200, bh = 50; // กำหนดความกว้างและความสูงปุ่ม
  
  // สร้างปุ่มเลือกจำนวนบอท 1, 3 และ 5 คัน
  [1, 3, 5].forEach((count, i) => {
    const isSelected = botCount === count; // เช็คว่าจำนวนนี้ถูกเลือกอยู่หรือไม่
    addButton(`บอท ${count} คัน`, width/2 - bw/2, 180 + i * 65, bw, bh, () => {
      botCount = count; // ตั้งค่าจำนวนบอทตามปุ่มที่กด
      playClickSound(); // เล่นเสียงคลิก
    }, isSelected ? "#2ecc71" : "#2f3542"); // ถ้าเลือกอยู่ให้เป็นสีเขียว ถ้าไม่เลือกเป็นสีเทา
  });

  // ปุ่มยืนยัน เพื่อไปหน้าเลือกความยาก
  addButton("ยืนยัน", width/2 - 110, 420, 100, 50, () => {
    navigateTo("difficultySelect");
    playClickSound();
  }, "#27ae60");
  
  // ปุ่มย้อนกลับ
  addButton("ย้อนกลับ", width/2 + 10, 420, 100, 50, () => {
    navigateBack();
    playClickSound();
  }, "#e74c3c");

  drawBackButton(); // วาดปุ่มย้อนกลับที่มุมซ้ายบน
  drawAllButtons(); // วาดปุ่มทั้งหมดที่แอดไว้ลงบนจอ
}

// ฟังก์ชันวาดหน้าเลือกโหมดการเล่น (1 คน หรือ 2 คน)
function drawModeSelect() {
  ctx.fillStyle = "#1e272e";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "white";
  ctx.font = "bold 32px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("เลือกโหมดการเล่น", width/2, 100);

  buttons.length = 0;
  const bw = 240, bh = 60;
  // ปุ่มเลือกโหมดผู้เล่นเดียว
  addButton("1 PLAYER (VS BOT)", width/2 - bw/2, 200, bw, bh, () => {
    gameMode = "1p";
    navigateBack(); // กลับไปหน้าก่อนเพื่อดำเนินการต่อ
    playClickSound();
  }, "#3498db");
  // ปุ่มเลือกโหมดผู้เล่นสองคน (เล่นเครื่องเดียวกัน)
  addButton("2 PLAYERS (LOCAL)", width/2 - bw/2, 280, bw, bh, () => {
    gameMode = "2p";
    navigateBack();
    playClickSound();
  }, "#e74c3c");

  drawBackButton();
  drawAllButtons();
}

// ระบบโหลดรูปภาพไอคอนสนาม
const trackIcons = {}; // คลังเก็บออบเจกต์รูปภาพ
TRACKS.forEach(t => {
  const img = new Image(); // สร้างออบเจกต์ Image ใหม่
  img.src = t.icon; // กำหนดที่อยู่ไฟล์รูปภาพ (เช่น 'track_eight.png')
  trackIcons[t.icon] = img; // เก็บรูปภาพไว้ในคลังโดยใช้ชื่อไฟล์เป็น Key
});

// ฟังก์ชันวาดหน้าเลือกด่าน (Track Selection)
function drawTrackSelect() {
  ctx.fillStyle = "#1e272e";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "white";
  ctx.font = "bold 32px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("เลือกด่าน", width/2, 60);

  buttons.length = 0;
  const cardW = 140, cardH = 140, spacing = 15; // กำหนดขนาดการ์ดแสดงผลสนาม
  const totalW = (cardW * 4) + (spacing * 3); // คำนวณความกว้างรวมของการ์ดทั้ง 4 ใบ
  let startX = (width - totalW) / 2; // คำนวณจุดเริ่มวาดเพื่อให้กลุ่มการ์ดอยู่กึ่งกลางจอพอดี

  TRACKS.forEach((t, i) => {
    const x = startX + i * (cardW + spacing); // พิกัด X ของการ์ดแต่ละใบ
    const y = height/2 - cardH/2 - 40; // พิกัด Y
    
    // วาดพื้นหลังของการ์ด (ถ้าเลือกใบนี้จะเป็นสีฟ้า ถ้าไม่เลือกเป็นสีเทา)
    ctx.fillStyle = selectedTrackIdx === i ? "#3498db" : "#2f3542";
    ctx.fillRect(x, y, cardW, cardH);
    
    // วาดรูปไอคอนสนามที่โหลดไว้ลงในพื้นที่การ์ด
    const icon = trackIcons[t.icon];
    if (icon && icon.complete) { // ตรวจสอบว่ารูปโหลดเสร็จหรือยัง
      ctx.drawImage(icon, x + 10, y + 10, cardW - 20, cardH - 20);
    }

    // วาดเส้นขอบการ์ด
    ctx.strokeStyle = "white";
    ctx.lineWidth = selectedTrackIdx === i ? 4 : 1; // ถ้าเลือกอยู่ให้เส้นขอบหนาขึ้น
    ctx.strokeRect(x, y, cardW, cardH);
    
    // วาดชื่อสนามและดาวความยาก
    ctx.fillStyle = "white";
    ctx.font = "bold 13px system-ui";
    ctx.fillText(t.name, x + cardW/2, y + cardH + 20);
    ctx.fillStyle = "#f1c40f"; // สีทองสำหรับดาวความยาก
    ctx.fillText(TRACK_META[i].difficulty, x + cardW/2, y + cardH + 40);

    // สร้าง "ปุ่มล่องหน" ทับการ์ดไว้เพื่อให้คลิกเลือกสนามได้ง่ายๆ
    addButton("", x, y, cardW, cardH, () => {
      selectedTrackIdx = i;
      playClickSound();
    }, "transparent");
  });

  // ปุ่มเริ่มแข่ง (ที่จะเรียกฟังก์ชัน initRace เพื่อเข้าสู่ตัวเกม)
  addButton("เริ่มแข่ง", width/2 - 110, height - 100, 100, 50, () => {
    initRace();
    playClickSound();
  }, "#2ecc71");
  
  // ปุ่มย้อนกลับ
  addButton("ย้อนกลับ", width/2 + 10, height - 100, 100, 50, () => {
    navigateBack();
    playClickSound();
  }, "#e74c3c");

  drawBackButton();
  drawAllButtons();
}

// ฟังก์ชันวาดหน้าเลือกระดับความยากของ AI
function drawDifficultySelect() {
  ctx.fillStyle = "#1e272e";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "white";
  ctx.font = "bold 32px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("เลือกระดับบอท", width/2, 100);

  buttons.length = 0;
  const bw = 200, bh = 50;
  const difficulties = [{id:"easy", l:"ง่าย"}, {id:"medium", l:"กลาง"}, {id:"hard", l:"ยาก"}];
  
  difficulties.forEach((d, i) => {
    const isSelected = aiDifficulty === d.id;
    // สร้างปุ่มเลือกความยาก (สีเหลืองเมื่อถูกเลือก)
    addButton(d.l, width/2 - bw/2, 180 + i * 65, bw, bh, () => {
      aiDifficulty = d.id;
      playClickSound();
    }, isSelected ? "#f1c40f" : "#2f3542");
  });

  // ปุ่มยืนยันไปหน้าเลือกสนาม
  addButton("ยืนยัน", width/2 - 110, 420, 100, 50, () => {
    navigateTo("trackSelect");
    playClickSound();
  }, "#27ae60");
  
  // ปุ่มย้อนกลับไปหน้าเมนูหลัก
  addButton("ย้อนกลับ", width/2 + 10, 420, 100, 50, () => {
    navigateTo("menu");
    playClickSound();
  }, "#e74c3c");

  drawBackButton();
  drawAllButtons();
}

// ฟังก์ชันวาดหน้าคู่มือการเล่น (How to Play)
function drawHowToPlay() {
  ctx.fillStyle = "#2c3e50";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "white";
  ctx.font = "bold 32px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("วิธีเล่น", width/2, 80);
  
  ctx.font = "16px system-ui";
  ctx.textAlign = "left";
  // คำอธิบายการควบคุมผู้เล่น 1 (WASD + Space + Shift)
  const p1 = [
    "PLAYER 1:",
    "- W/S: เร่ง/เบรก",
    "- A/D: เลี้ยว",
    "- SPACE: ดริฟท์",
    "- SHIFT: ไนโตร"
  ];
  // คำอธิบายการควบคุมผู้เล่น 2 (Arrows + 1 + 2)
  const p2 = [
    "PLAYER 2:",
    "- Arrows: เร่ง/เบรก/เลี้ยว",
    "- 1: ดริฟท์",
    "- 2: ไนโตร"
  ];

  p1.forEach((l, i) => ctx.fillText(l, width/2 - 180, 150 + i * 30));
  p2.forEach((l, i) => ctx.fillText(l, width/2 + 40, 150 + i * 30));

  ctx.textAlign = "center";
  ctx.fillText("แข่งให้ครบจำนวนรอบเพื่อชนะ!", width/2, height - 150);

  buttons.length = 0;
  drawBackButton();
  drawAllButtons();
}

// ฟังก์ชันวาดปุ่มย้อนกลับสีแดงที่มุมซ้ายบน
function drawBackButton() {
  addButton("ย้อนกลับ", 20, 20, 100, 40, () => {
    navigateBack();
    playClickSound();
  }, "#e74c3c");
}

// ฟังก์ชันวาดปุ่มทั้งหมดที่ถูกเพิ่มลงในอาร์เรย์ buttons
function drawAllButtons() {
  for (let b of buttons) {
    if (b.color === "transparent") continue; // ถ้าปุ่มโปร่งใส ไม่ต้องวาดตัวปุ่ม (แต่วงจรคลิกยังทำงาน)
    ctx.fillStyle = b.color;
    ctx.beginPath();
    // วาดสี่เหลี่ยมมุมมน (roundRect) เพื่อความสวยงาม ถ้าเบราว์เซอร์ไม่รองรับให้วาดสี่เหลี่ยมปกติ
    ctx.roundRect ? ctx.roundRect(b.x, b.y, b.w, b.h, 8) : ctx.rect(b.x, b.y, b.w, b.h);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "bold 16px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(b.text, b.x + b.w / 2, b.y + b.h / 2 + 6); // วาดข้อความกึ่งกลางปุ่ม
  }
}

// ฟังก์ชันอัปเดตสถานะของเกม (หัวใจหลักของ Game Loop)
function update(dt) {
  if (gameState === "countdown") { // ช่วงนับถอยหลังก่อนเริ่ม
    countdownTime -= dt;
    const step = Math.ceil(countdownTime);
    if (step !== lastCountdownStep && step > 0) {
      playCountdownBeep(step); // เล่นเสียงติ๊ดทุกวินาที
      lastCountdownStep = step;
    }
    if (countdownTime <= 0) {
      gameState = "racing"; // เริ่มการแข่งขัน
      playStartSound();
    }
  }

  if (gameState === "racing") {
    playerCar1.update(dt, keys); // อัปเดตรถผู้เล่น
    for (let car of opponentCars) {
      car.update(dt, keys); // อัปเดตรถบอท/ผู้เล่น 2
      handleCollision(playerCar1, car); // เช็คการชนระหว่าง P1 กับคันอื่น
      for (let other of opponentCars) {
        if (car !== other) handleCollision(car, other); // เช็คการชนระหว่างคู่แข่งด้วยกันเอง
      }
    }
    smokeSystem.update(dt); // อัปเดตอนุภาคควัน
    if (raceOver) gameState = "results"; // ถ้าเข้าเส้นชัยครบตามที่กำหนด ให้จบเกม
  }
}

// ฟังก์ชันวาดหน้าจอขณะกำลังแข่งขัน
function drawRacing() {
  ctx.fillStyle = "#16a085"; // สีพื้นหลัง (หญ้า)
  ctx.fillRect(0, 0, width, height);
  
  // วาดสนามแข่ง (Track)
  ctx.strokeStyle = "#34495e"; // สีถนน
  ctx.lineWidth = 100; // ความกว้างถนน
  ctx.beginPath();
  ctx.moveTo(waypoints[0].x, waypoints[0].y);
  for (let p of waypoints) ctx.lineTo(p.x, p.y);
  ctx.closePath();
  ctx.stroke();

  // วาดเส้นประกลางถนน
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.setLineDash([15, 15]); // กำหนดลักษณะเส้นประ [ขีด, เว้น]
  ctx.stroke();
  ctx.setLineDash([]); // รีเซ็ตเป็นเส้นทึบ

  // วาดเส้นชัย (ลวดลายหมากรุก)
  if (waypoints.length > 1) {
    const p1 = waypoints[0];
    const p2 = waypoints[1];
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x); // ทิศทางของจุดสตาร์ท
    const perpAngle = angle + Math.PI / 2; // หามุมตั้งฉากขวางสนาม
    
    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(perpAngle);
    
    const trackWidth = 100;
    const boxSize = 10;
    for (let r = -1; r <= 1; r++) { // วาด 2 แถวสลับสี
      for (let i = -trackWidth/2; i < trackWidth/2; i += boxSize) {
        ctx.fillStyle = (Math.floor(i/boxSize) + r) % 2 === 0 ? "white" : "black";
        ctx.fillRect(i, r * boxSize, boxSize, boxSize);
      }
    }
    ctx.restore();
  }

  smokeSystem.draw(ctx); // วาดควันจากการดริฟท์
  playerCar1.draw(ctx);  // วาดรถ P1
  for (let car of opponentCars) car.draw(ctx); // วาดรถคันอื่นๆ

  // --- ส่วนของ HUD (จอแสดงสถานะ) ---
  // แสดงข้อมูลผู้เล่น 1 (รอบ และหลอดไนโตร)
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(10, 10, 160, 85);
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.font = "bold 14px system-ui";
  ctx.fillText(`PLAYER 1`, 20, 28);
  ctx.font = "12px system-ui";
  ctx.fillText(`รอบ: ${Math.min(playerCar1.lap + 1, currentTrack.laps)}/${currentTrack.laps}`, 20, 48);
  
  // หลอดไนโตร P1
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(20, 65, 140, 12);
  const p1NitroW = (playerCar1.nitroTimer / 2) * 140; // คำนวณความยาวหลอดตามเวลาที่เหลือ
  ctx.fillStyle = playerCar1.isNitro ? "#ff9f43" : "#54a0ff"; // เปลี่ยนสีถ้ากำลังกดใช้
  ctx.fillRect(20, 65, p1NitroW, 12);
  ctx.fillStyle = "white";
  ctx.font = "10px system-ui";
  ctx.fillText("NITRO", 22, 75);

  // แสดงข้อมูลคู่แข่ง (Leaderboard / P2)
  if (opponentCars.length > 0) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(width - 170, 10, 160, 85);
    ctx.fillStyle = "white";
    const label = gameMode === "1p" ? `BOTS (${opponentCars.length})` : "PLAYER 2";
    ctx.font = "bold 14px system-ui";
    ctx.fillText(label, width - 160, 28);
    ctx.font = "12px system-ui";
    ctx.fillText(`รอบ: ${Math.min(opponentCars[0].lap + 1, currentTrack.laps)}/${currentTrack.laps}`, width - 160, 48);

    // หลอดไนโตร คู่แข่ง
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(width - 160, 65, 140, 12);
    const opNitroW = (opponentCars[0].nitroTimer / 2) * 140;
    ctx.fillStyle = opponentCars[0].isNitro ? "#ff9f43" : "#54a0ff";
    ctx.fillRect(width - 160, 65, opNitroW, 12);
    ctx.fillStyle = "white";
    ctx.font = "10px system-ui";
    ctx.fillText("NITRO", width - 158, 75);
  }

  // ปุ่มหยุดเกม (STOP)
  buttons.length = 0;
  addButton("STOP", width - 70, 100, 60, 30, () => {
    gameState = "paused";
    playClickSound();
  }, "#e74c3c");
  drawAllButtons();

  // แสดงตัวเลขนับถอยหลังกลางจอ
  if (gameState === "countdown") {
    ctx.fillStyle = "white";
    ctx.font = "bold 80px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(Math.ceil(countdownTime) || "เริ่ม!", width/2, height/2);
  }
}

// ฟังก์ชันวาดหน้าเมนูหยุดพัก (Pause Menu)
function drawPaused() {
  ctx.fillStyle = "rgba(0,0,0,0.7)"; // ทำพื้นหลังมัวๆ ดำๆ
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "white";
  ctx.font = "bold 48px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("หยุดเกม", width/2, height/2 - 100);

  buttons.length = 0;
  const bw = 220, bh = 50, spacing = 20;
  addButton("เล่นต่อ", width/2 - bw/2, height/2 - 40, bw, bh, () => { gameState = "racing"; playClickSound(); }, "#2ecc71");
  addButton("เริ่มใหม่", width/2 - bw/2, height/2 + (bh + spacing) - 40, bw, bh, () => { initRace(); playClickSound(); }, "#f1c40f");
  addButton("ย้อนกลับหน้าเลือกด่าน", width/2 - bw/2, height/2 + (bh + spacing) * 2 - 40, bw, bh, () => { gameState = "trackSelect"; playClickSound(); }, "#e74c3c");

  drawAllButtons();
}

// ฟังก์ชันวาดหน้าสรุปผลหลังจบการแข่งขัน (Results Screen)
function drawResults() {
  ctx.fillStyle = "rgba(0,0,0,0.9)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "white";
  ctx.font = "bold 48px system-ui";
  ctx.textAlign = "center";
  let winText = winner + " ชนะ!";
  // ปรับข้อความประกาศผลตามโหมดการเล่น
  if (gameMode === "1p" && winner === "PLAYER") winText = "คุณชนะ!";
  if (gameMode === "1p" && winner === "BOT") winText = "คุณแพ้!";
  
  ctx.fillText(winText, width/2, height/2 - 80);
  
  buttons.length = 0;
  const bw = 220, bh = 55, spacing = 20;
  addButton("เล่นอีกครั้ง (REPLAY)", width/2 - bw/2, height/2, bw, bh, () => { initRace(); playClickSound(); }, "#2ecc71");
  addButton("เมนูหลัก (MENU)", width/2 - bw/2, height/2 + bh + spacing, bw, bh, () => { gameState = "menu"; playClickSound(); }, "#3498db");
  
  drawAllButtons();
}

// ตรวจจับการคลิกเมาส์เพื่อกดปุ่มต่างๆ
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left; // ตำแหน่งเมาส์ X เทียบกับ Canvas
  const my = e.clientY - rect.top;  // ตำแหน่งเมาส์ Y เทียบกับ Canvas
  
  for (let b of buttons) {
    // เช็คว่าตำแหน่งเมาส์อยู่ในขอบเขตของปุ่มใดปุ่มหนึ่งหรือไม่
    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
      b.onClick(); // รันฟังก์ชันที่ผูกไว้กับปุ่มนั้น
      return;
    }
  }
});

let lastTime = 0; // ตัวแปรสำหรับเก็บค่าเวลาในเฟรมก่อนหน้า

// ฟังก์ชัน Loop หลักที่จะถูกเรียกซ้ำๆ (Game Loop)
function loop(time) {
  // คำนวณ Delta Time (dt) คือเวลาที่ห่างกันระหว่างเฟรมปัจจุบันกับเฟรมที่แล้ว
  // หารด้วย 1000 เพื่อเปลี่ยนจาก มิลลิวินาที เป็น วินาที
  const dt = (time - lastTime) / 1000;
  lastTime = time;

  // ล้างภาพเก่าบนแคนวาสออกให้หมด เพื่อเตรียมวาดภาพใหม่ทับลงไป
  ctx.clearRect(0, 0, width, height);
  
  // ระบบ State Machine: ตรวจสอบสถานะเกม (gameState) เพื่อเลือกวาดหน้าจอที่ถูกต้อง
  if (gameState === "menu") {
    drawMenu(); // วาดหน้าเมนูหลัก
  } else if (gameState === "modeSelect") {
    drawModeSelect(); // วาดหน้าเลือกโหมด (1 หรือ 2 คน)
  } else if (gameState === "botCountSelect") {
    drawBotCountSelect(); // วาดหน้าเลือกจำนวนบอท
  } else if (gameState === "trackSelect") {
    drawTrackSelect(); // วาดหน้าเลือกสนามแข่ง
  } else if (gameState === "difficultySelect") {
    drawDifficultySelect(); // วาดหน้าเลือกระดับความยากของบอท
  } else if (gameState === "howToPlay") {
    drawHowToPlay(); // วาดหน้าคู่มือการเล่น
  } else if (gameState === "paused") {
    drawPaused(); // วาดหน้าจอกรณีหยุดเกมชั่วคราว
  } else if (gameState === "countdown" || gameState === "racing") {
    // ช่วงนับถอยหลังหรือกำลังแข่ง:
    // 1. อัปเดตตรรกะ (Update Logic) โดยจำกัดค่า dt ไม่ให้เกิน 0.1 เพื่อป้องกันรถทะลุกำแพงเวลาเฟรมกระตุก
    update(Math.min(dt, 0.1));
    // 2. วาดฉากการแข่ง (Render)
    drawRacing();
  } else if (gameState === "results") {
    drawResults(); // วาดหน้าสรุปผลการแข่งขัน (ใครชนะ)
  }

  // สั่งให้เบราว์เซอร์เรียกใช้ฟังก์ชัน loop อีกครั้งในเฟรมถัดไป
  requestAnimationFrame(loop);
}

// เริ่มต้นรัน Loop ครั้งแรก
requestAnimationFrame(loop);
