import { generateReport } from '../utils/generateReport';

// ── helpers ─────────────────────────────────────────────────────────────────
const building = (no, name) => [no, name, null, null];          // row with no = เลขอาคาร
const item = (detail, qty = null, unit = null) => [null, detail, qty, unit]; // sub-item row

// ── 1. IIFE fix: keywords ที่ควรถูก skip ────────────────────────────────────
describe('IIFE condition — skip keywords', () => {
  const SKIP_KEYWORDS = [
    'รวมค่าใช้จ่ายทั้งโครงการ',
    'ภาษีมูลค่าเพิ่ม 7%',
    'สาย Patch Cord Cat6',
    'Wi-Fi Controller',
    'WiFi AP',
    'Wireless LAN',
    'Rack Mount 1U',
    'ODF Wall Outdoor Box',
    '1.25G SFP Module',
    '10G SFP+ Module',
    'Ground Cable',
  ];

  SKIP_KEYWORDS.forEach((keyword) => {
    it(`ข้าม "${keyword}" ออกจาก report`, () => {
      const projectData = [building('1', 'อาคาร A'), item(keyword)];
      const result = generateReport(projectData, []);
      // ข้อความ keyword ต้องไม่ปรากฏใน output
      expect(result).not.toContain(keyword);
    });
  });
});

// ── 2. IIFE fix: items ปกติต้องยังคงแสดงผล ──────────────────────────────────
describe('IIFE condition — items ปกติต้องแสดงใน report', () => {
  it('อุปกรณ์ทั่วไปที่ไม่ตรง keyword ควรปรากฏใน report', () => {
    const projectData = [
      building('1', 'อาคาร B'),
      item('ติดตั้ง Fiber Optic Cable ภายในอาคาร', 1, 'งาน'),
    ];
    const result = generateReport(projectData, []);
    expect(result).toContain('ติดตั้ง Fiber Optic Cable ภายในอาคาร');
  });

  it('ODF ปกติ (ไม่ใช่ outdoor) ควรปรากฏ', () => {
    const projectData = [
      building('1', 'อาคาร C'),
      item('ติดตั้ง ODF Indoor 12 Port', 1, 'ชุด'),
    ];
    const result = generateReport(projectData, []);
    expect(result).toContain('ODF Indoor 12 Port');
  });
});

// ── 3. Access Point matching ─────────────────────────────────────────────────
describe('Access Point', () => {
  const inventoryData = [
    [1, 'Access Point', 'Cisco', 'AIR-AP2802', 'SN-001', '', 'AP-Room101', '', 'อาคาร A'],
    [2, 'Access Point', 'Ubiquiti', 'UAP-AC', 'SN-002', '', 'AP-Room102', '', 'อาคาร B'],
  ];

  it('แสดง AP เฉพาะอาคารที่ตรงกัน', () => {
    const projectData = [
      building('1', 'อาคาร A'),
      item('รวมติดตั้ง Access Point'),
    ];
    const result = generateReport(projectData, inventoryData);
    expect(result).toContain('Cisco');
    expect(result).toContain('AIR-AP2802');
    expect(result).toContain('SN-001');
    expect(result).not.toContain('Ubiquiti'); // อาคาร B ไม่ควรโผล่
  });

  it('ไม่แสดง AP ถ้าอาคารไม่ตรง', () => {
    const projectData = [
      building('2', 'อาคาร C'),
      item('รวมติดตั้ง Access Point'),
    ];
    const result = generateReport(projectData, inventoryData);
    expect(result).not.toContain('Cisco');
    expect(result).not.toContain('Ubiquiti');
  });
});

// ── 4. Switch matching ───────────────────────────────────────────────────────
describe('Switch', () => {
  const inventoryData = [
    [1, 'Switch POE', 'Cisco', 'SG350-28P', 'SW-001', '', 'SW-Floor1', '', 'อาคาร D'],
  ];

  it('แสดง Switch POE ถูกต้อง', () => {
    const projectData = [
      building('3', 'อาคาร D'),
      item('ติดตั้ง Switch SG350-28P'),
    ];
    const result = generateReport(projectData, inventoryData);
    expect(result).toContain('Switch POE');
    expect(result).toContain('SG350-28P');
    expect(result).toContain('SW-001');
  });
});

// ── 5. Wall Rack ─────────────────────────────────────────────────────────────
describe('Wall Rack', () => {
  it('Wall Rack ปรากฏใน report พร้อม quantity', () => {
    const projectData = [
      building('1', 'อาคาร E'),
      item('ติดตั้ง Wall Rack 6U', 2, 'ชุด'),
    ];
    const result = generateReport(projectData, []);
    expect(result).toContain('Wall Rack 6U');
    expect(result).toContain('จำนวน: 2 ชุด');
  });
});

// ── 6. Skip header row ───────────────────────────────────────────────────────
describe('Header rows', () => {
  it('ข้ามแถว "ลำดับ"', () => {
    const projectData = [
      ['ลำดับ', 'รายการ', 'จำนวน', 'หน่วย'],
      building('1', 'อาคาร F'),
      item('อุปกรณ์ทดสอบ'),
    ];
    const result = generateReport(projectData, []);
    expect(result).not.toContain('รายการ');
    expect(result).toContain('อุปกรณ์ทดสอบ');
  });
});

// ── 7. Empty input ───────────────────────────────────────────────────────────
describe('Edge cases', () => {
  it('projectData ว่าง → คืน empty string', () => {
    expect(generateReport([], [])).toBe('');
  });

  it('item ไม่มี quantity → แสดง "จำนวน: ไม่ระบุ"', () => {
    const projectData = [building('1', 'อาคาร G'), item('สาย Fiber Single Mode')];
    const result = generateReport(projectData, []);
    expect(result).toContain('จำนวน: ไม่ระบุ');
  });
});
