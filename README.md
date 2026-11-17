# Strike Dungeon — Bowling Roguelite (Unity prototype)

ต้นแบบเกมโบว์ลิ่งแนว roguelite ภาพ 3D low-poly สไตล์ hybrid-casual
ไม่ต้องใช้ไฟล์ภาพหรือเสียงเลย ทุกอย่าง (เลน พิน กล้อง แสง UI เสียง) สร้างจากโค้ดตอนกด Play

## วิธีเปิดเล่น (ประมาณ 5 นาที)

1. ติดตั้ง **Unity 6 LTS** (6000.0.x) ผ่าน Unity Hub
2. Unity Hub → New project → เลือก template **Universal 3D** → Create
3. คัดลอกโฟลเดอร์ `StrikeDungeon/Assets/StrikeDungeon` ไปวางในโฟลเดอร์ `Assets/` ของโปรเจกต์
4. เปิด `SampleScene` (หรือ scene ว่างก็ได้) แล้วกด **Play** เกมจะสร้างตัวเองขึ้นมาอัตโนมัติ
5. ในแท็บ Game ตั้งขนาดจอเป็น **1080x1920 Portrait** จะได้เห็นแบบมือถือ

ทดสอบบนมือถือ: File → Build Profiles → Android → Switch Platform → Build And Run
(หรือใช้แอป Unity Remote 5)

## วิธีเล่น
- **ลากซ้าย/ขวา** เพื่อเลื่อนตำแหน่งลูก
- **ปัดขึ้น** เพื่อโยน ยิ่งปัดเร็ว ลูกยิ่งแรง ปัดเอียงเพื่อเล็งทิศ
- **ปัดเป็นเส้นโค้ง** ลูกจะเลี้ยว (hook)

## วงจรเกม
1. แต่ละด่านมีลูก 2 ลูก ต้องทำแต้มให้ถึงเป้า (พิน 1 แต้ม, Strike +5, Spare +3)
2. ผ่านด่าน → เลือกพลังพิเศษ 1 จาก 3 ใบ
3. ไม่ผ่าน → เสียหัวใจ 1 ดวง (เริ่มต้น 3 ดวง) หมดหัวใจ = จบรอบ
4. เป้าคะแนนสูงขึ้นทุกด่าน, ด่าน 3+ มีสิ่งกีดขวางเลื่อนไปมา, ทุก 5 ด่านเป็น **บอส** (พิน 15 ตัว + พินเหล็ก)
5. ล้มพินหมดแต่ยังมีลูกเหลือ → ตั้งพินใหม่ (Re-rack) ทำ Strike ได้อีก

พลังพิเศษ 12 แบบ: Heavy Ball, Big Ball, Power Throw, Golden Pins, Strike Master, Extra Ball,
Explosive Pins, Split Ball, Shockwave, Magnet Ball, Combo, Extra Heart

## ไฟล์
| ไฟล์ | หน้าที่ |
|---|---|
| `StrikeGame.cs` | ตัวหลัก: สร้างฉาก, วงจรด่าน, การปัด, กล้อง, UI |
| `Upgrades.cs` | รายการพลังพิเศษ + `RunState` (ตัวเลขบาลานซ์ทั้งหมดอยู่ที่นี่) |
| `Ball.cs` / `Pin.cs` | ฟิสิกส์ลูกและพิน, ตรวจว่าพินล้ม |
| `Layouts.cs` | รูปแบบการตั้งพิน |
| `MovingObstacle.cs` | สิ่งกีดขวาง |
| `Fx.cs` / `Sfx.cs` | เอฟเฟกต์ระเบิด/คอนเฟตตี และเสียงที่สร้างจากโค้ด |

## จุดปรับบาลานซ์
- เป้าคะแนน: `StrikeGame.StartStage` → `target = ...`
- ความแรงของพลังพิเศษ: `RunState` ใน `Upgrades.cs`
- ความเร็วลูก / ความแรง hook: field ด้านบนของ `StrikeGame` (ปรับใน Inspector ระหว่างเล่นได้)

## สิ่งที่ยังไม่มี (ขั้นต่อไป)
- โมเดล/สีสวยขึ้น, particle จริง, เสียงจริง
- UI ด้วย Canvas/TextMeshPro แทน IMGUI
- ระบบ meta: เหรียญ, ปลดล็อกลูกใหม่
- SDK ของ publisher (ติดตั้งเมื่อได้รับเซ็นแล้ว)
