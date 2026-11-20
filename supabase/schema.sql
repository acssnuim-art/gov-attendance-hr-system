-- เปิดใช้งาน Extension สำหรับ UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. work_categories (หมวดกลุ่มงาน)
CREATE TABLE work_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. work_groups (กลุ่มงาน)
CREATE TABLE work_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES work_categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. departments (หน่วยงานย่อยภายในกลุ่มงาน)
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_group_id UUID NOT NULL REFERENCES work_groups(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(work_group_id, name)
);

-- 4. users (บัญชีผู้ใช้งานและสิทธิ์)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    employee_code TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
    account_status TEXT NOT NULL DEFAULT 'pending' CHECK (account_status IN ('pending', 'active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. employees (ข้อมูลรายละเอียดบุคลากร)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_code TEXT NOT NULL UNIQUE,
    prefix TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    position TEXT NOT NULL,
    work_group_id UUID NOT NULL REFERENCES work_groups(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. attendance (ประวัติการลงเวลาทำงาน)
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent', 'leave', 'travel')),
    late_minutes INT DEFAULT 0,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, work_date)
);

-- 7. leave_requests (คำขอลา)
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('ลาป่วย', 'ลากิจ', 'ลาพักผ่อน', 'ลาอื่น ๆ')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days NUMERIC(4,1) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. official_travel (แจ้งไปราชการ)
CREATE TABLE official_travel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location TEXT NOT NULL,
    purpose TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. attachments (ไฟล์และรูปภาพประกอบ)
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_type TEXT NOT NULL CHECK (reference_type IN ('leave', 'travel', 'avatar')),
    reference_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. approvals (ประวัติการอนุมัติของ Admin)
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_type TEXT NOT NULL CHECK (request_type IN ('leave', 'travel')),
    request_id UUID NOT NULL,
    approved_by UUID NOT NULL REFERENCES users(id),
    approver_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
    remark TEXT,
    approved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. holidays (วันหยุดราชการ)
CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    holiday_date DATE NOT NULL UNIQUE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. system_settings (การตั้งค่าระบบ)
CREATE TABLE system_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    organization_name TEXT NOT NULL DEFAULT 'สำนักงานป้องกันควบคุมโรค / หน่วยงานราชการ',
    logo_url TEXT,
    work_start_time TIME NOT NULL DEFAULT '08:30:00',
    work_end_time TIME NOT NULL DEFAULT '16:30:00',
    late_threshold_time TIME NOT NULL DEFAULT '08:31:00',
    working_days INT[] NOT NULL DEFAULT '{1,2,3,4,5}',
    enable_notifications BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. activity_logs (ประวัติการใช้งานและการแก้ไขข้อมูล)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- SEED DATA: ข้อมูลเริ่มต้นตามข้อกำหนดระบบ
-- ==========================================

INSERT INTO system_settings (id, organization_name) VALUES (1, 'สำนักงานป้องกันควบคุมโรค (ระบบบริหารงานบุคคล)');

-- หมวดกลุ่มงาน 2 หมวดหลัก
INSERT INTO work_categories (id, name, sort_order) VALUES
('11111111-1111-1111-1111-111111111111', 'หมวดที่ 1 กลุ่มงานสนับสนุนและบริหาร', 1),
('22222222-2222-2222-2222-222222222222', 'หมวดที่ 2 กลุ่มงานวิชาการและการควบคุมโรค', 2);

-- กลุ่มงานทั้ง 12 กลุ่มงาน
INSERT INTO work_groups (id, category_id, name) VALUES
-- หมวดที่ 1
('aaaaaaaa-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'กลุ่มบริหารทั่วไป'),
('aaaaaaaa-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'กลุ่มพัฒนาองค์กร'),
('aaaaaaaa-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', 'กลุ่มยุทธศาสตร์และแผนงาน'),
('aaaaaaaa-0001-0001-0001-000000000004', '11111111-1111-1111-1111-111111111111', 'กลุ่มพัฒนานวัตกรรมและวิจัย'),
('aaaaaaaa-0001-0001-0001-000000000005', '11111111-1111-1111-1111-111111111111', 'กลุ่มสื่อสารความเสี่ยงโรคและภัยสุขภาพ'),
-- หมวดที่ 2
('bbbbbbbb-0002-0002-0002-000000000001', '22222222-2222-2222-2222-222222222222', 'กลุ่มห้องปฏิบัติการทางการแพทย์ด้านควบคุมโรค'),
('bbbbbbbb-0002-0002-0002-000000000002', '22222222-2222-2222-2222-222222222222', 'กลุ่มระบาดวิทยาและตอบโต้ภาวะฉุกเฉินทางสาธารณสุข'),
('bbbbbbbb-0002-0002-0002-000000000003', '22222222-2222-2222-2222-222222222222', 'กลุ่มโรคติดต่อ'),
('bbbbbbbb-0002-0002-0002-000000000004', '22222222-2222-2222-2222-222222222222', 'กลุ่มโรคติดต่อเรื้อรัง'),
('bbbbbbbb-0002-0002-0002-000000000005', '22222222-2222-2222-2222-222222222222', 'กลุ่มโรคไม่ติดต่อ'),
('bbbbbbbb-0002-0002-0002-000000000006', '22222222-2222-2222-2222-222222222222', 'กลุ่มโรคจากการประกอบอาชีพและสิ่งแวดล้อม'),
('bbbbbbbb-0002-0002-0002-000000000007', '22222222-2222-2222-2222-222222222222', 'กลุ่มโรคติดต่อนำโดยแมลง');

-- หน่วยงานย่อยเริ่มต้น
INSERT INTO departments (work_group_id, name)
SELECT id, 'งานธุรการและอำนวยการประจำ' || name FROM work_groups;

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_travel ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin' AND account_status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Employee view own profile" ON employees FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Employee update own profile" ON employees FOR UPDATE USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Insert profile on register" ON employees FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "View attendance" ON attendance FOR SELECT USING (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR is_admin()
);
CREATE POLICY "Manage attendance" ON attendance FOR ALL USING (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR is_admin()
);

CREATE POLICY "View own or admin leaves" ON leave_requests FOR SELECT USING (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR is_admin()
);
CREATE POLICY "Insert own leaves" ON leave_requests FOR INSERT WITH CHECK (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);
CREATE POLICY "Admin update leaves" ON leave_requests FOR UPDATE USING (is_admin());

CREATE POLICY "View own or admin travel" ON official_travel FOR SELECT USING (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()) OR is_admin()
);
CREATE POLICY "Insert own travel" ON official_travel FOR INSERT WITH CHECK (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
);
CREATE POLICY "Admin update travel" ON official_travel FOR UPDATE USING (is_admin());
