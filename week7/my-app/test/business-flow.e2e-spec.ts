import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { of } from 'rxjs';
import { PrismaClientExceptionFilter } from './../src/common/filter/prisma-client-exception.filter';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// ─────────────────────────────────────────────────────────
// E2E Test Suite: Business Flow Scenarios
// Matches the report tables in BAO_CAO_TUAN_7.md §IV.1.1–1.7
// ─────────────────────────────────────────────────────────

describe('Smart Garden — Business Flow E2E (báo cáo §IV.1)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Shared state across tests
  const ts = Date.now();
  const adminEmail = `admin-e2e-${ts}@test.com`;
  const user1Email = `user1-e2e-${ts}@test.com`;
  const user2Email = `user2-e2e-${ts}@test.com`;
  const allCreatedEmails = [adminEmail, user1Email, user2Email];

  let adminToken: string;
  let user1Token: string;
  let user2Token: string;
  let user1GardenId: number;
  let user2GardenId: number;
  let vegetableId: number;

  // ───────────────────────────────────────────────────────
  // BOOTSTRAP
  // ───────────────────────────────────────────────────────
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Mock MQTT client so device-command tests don't depend on a live broker
      .overrideProvider('MQTT_SERVICE')
      .useValue({ emit: jest.fn(() => of({})) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new PrismaClientExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);

    // ── Seed ADMIN user directly in DB ──
    const hashedAdminPwd = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: { name: 'E2E Admin', email: adminEmail, password: hashedAdminPwd, role: 'ADMIN' },
    });

    // ── Register user1 via API ──
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'User One', email: user1Email, password: 'user123' })
      .expect(201);

    const login1 = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user1Email, password: 'user123' })
      .expect(200);
    user1Token = login1.body.access_token;

    // ── Register user2 via API ──
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'User Two', email: user2Email, password: 'user456' })
      .expect(201);

    const login2 = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user2Email, password: 'user456' })
      .expect(200);
    user2Token = login2.body.access_token;

    // ── Admin login ──
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'admin123' })
      .expect(200);
    adminToken = adminLogin.body.access_token;
  });

  afterAll(async () => {
    // Sale references Garden/Vegetable WITHOUT cascade → delete sales first,
    // otherwise deleting users (cascade gardens/vegetables) violates FK.
    await prisma.sale.deleteMany({
      where: { garden: { owner: { email: { in: allCreatedEmails } } } },
    });
    await prisma.user.deleteMany({ where: { email: { in: allCreatedEmails } } });
    await app.close();
  });

  // ───────────────────────────────────────────────────────
  // 1.1. Xác thực (Auth)  —  §IV.1.1
  // ───────────────────────────────────────────────────────
  describe('1.1. Xác thực (Auth)', () => {
    it('1. [201] register — tạo tài khoản thành công', async () => {
      const email = `fresh-${Date.now()}@test.com`;
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Fresh', email, password: 'fresh123' })
        .expect(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.role).toBe('USER');
      // cleanup
      await prisma.user.delete({ where: { email } });
    });

    it('2. [400] register — email đã tồn tại', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Dup', email: user1Email, password: 'dup123' })
        .expect(400);
      expect(res.body.message).toContain('Email already in use');
    });

    it('4. [200] login — đúng thông tin, trả về JWT', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user1Email, password: 'user123' })
        .expect(200);
      expect(res.body).toHaveProperty('access_token');
      expect(typeof res.body.access_token).toBe('string');
    });

    it('5. [401] login — sai mật khẩu', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user1Email, password: 'wrongpass' })
        .expect(401);
    });

    it('5. [401] login — email không tồn tại', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: 'any123' })
        .expect(401);
    });
  });

  // ───────────────────────────────────────────────────────
  // 1.2. Khu vườn (Garden)  —  §IV.1.2
  // ───────────────────────────────────────────────────────
  describe('1.2. Khu vườn (Garden)', () => {
    it('1. [201] USER tạo garden', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/gardens')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Garden User1' })
        .expect(201);
      user1GardenId = res.body.id;
      expect(res.body.ownerId).toBeDefined();
    });

    it('2. [200] USER — GET chỉ thấy garden của mình', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/gardens')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      // user1 has just 1 garden, user2 hasn't created any yet
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(user1GardenId);
    });

    it('3. [200] ADMIN — GET thấy tất cả garden', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/gardens')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Admin sees all gardens in the system (including others created outside this test)
      // At least user1's garden is visible
      const found = res.body.some((g: any) => g.id === user1GardenId);
      expect(found).toBe(true);
    });

    it('4. [200] USER (owner) — GET /gardens/:id chi tiết garden của mình', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/gardens/${user1GardenId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      expect(res.body.id).toBe(user1GardenId);
      expect(res.body).toHaveProperty('vegetables');
      expect(res.body).toHaveProperty('sensorData');
    });

    it('5. [403] USER (khác) — GET /gardens/:id không phải của mình', async () => {
      // user2 hasn't created a garden yet, but cannot access user1's garden
      await request(app.getHttpServer())
        .get(`/api/gardens/${user1GardenId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });

    it('6. [200] ADMIN — GET /gardens/:id bất kỳ', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/gardens/${user1GardenId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.id).toBe(user1GardenId);
    });

    it('7. [200] USER (owner) — PUT update garden', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/gardens/${user1GardenId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Garden User1 Renamed' })
        .expect(200);
      expect(res.body.name).toBe('Garden User1 Renamed');
    });

    it('8. [403] USER (khác) — PUT garden của người khác', async () => {
      await request(app.getHttpServer())
        .put(`/api/gardens/${user1GardenId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ name: 'Hacked' })
        .expect(403);
    });

    // Create user2's garden for later tests
    it('setup — user2 tạo garden riêng', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/gardens')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ name: 'Garden User2' })
        .expect(201);
      user2GardenId = res.body.id;
    });

    it('2b. [200] USER — GET chỉ thấy garden của chính mình (phân lập dữ liệu)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/gardens')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(user2GardenId);
    });

    it('10. [403] USER (khác) — DELETE garden của người khác', async () => {
      await request(app.getHttpServer())
        .delete(`/api/gardens/${user1GardenId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });

    it('11. [200] ADMIN — DELETE garden của user khác (quản trị hệ thống)', async () => {
      // Create a temp garden owned by user1 for admin to delete
      const tempGarden = await request(app.getHttpServer())
        .post('/api/gardens')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Temp for Admin Delete' })
        .expect(201);
      const tempId = tempGarden.body.id;

      await request(app.getHttpServer())
        .delete(`/api/gardens/${tempId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  // ───────────────────────────────────────────────────────
  // 1.3. Nông sản (Vegetable)  —  §IV.1.3
  // ───────────────────────────────────────────────────────
  describe('1.3. Nông sản (Vegetable)', () => {
    it('1. [201] USER (owner) — POST tạo nông sản trong vườn của mình', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/gardens/${user1GardenId}/vegetables`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Cà chua', importQty: 100 })
        .expect(201);
      vegetableId = res.body.id;
      expect(res.body.soldQty).toBe(0);
    });

    it('2. [403] USER (khác) — POST tạo nông sản trong vườn người khác', async () => {
      await request(app.getHttpServer())
        .post(`/api/gardens/${user1GardenId}/vegetables`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ name: 'Rau muống', importQty: 50 })
        .expect(403);
    });

    it('3. [403] ADMIN — POST tạo nông sản trong vườn của user khác (nghiệp vụ sở hữu)', async () => {
      await request(app.getHttpServer())
        .post(`/api/gardens/${user1GardenId}/vegetables`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Xà lách', importQty: 30 })
        .expect(403);
    });

    it('4. [200] USER (owner) — GET danh sách nông sản trong vườn', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/gardens/${user1GardenId}/vegetables`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('5. [200] ADMIN — GET danh sách nông sản (giám sát)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/gardens/${user1GardenId}/vegetables`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('6. [200] USER (owner) — PUT cập nhật nông sản', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/gardens/${user1GardenId}/vegetables/${vegetableId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ importQty: 150, soldQty: 10 })
        .expect(200);
      expect(res.body.importQty).toBe(150);
      expect(res.body.soldQty).toBe(10);
    });

    it('7. [400] USER (owner) — PUT soldQty > importQty', async () => {
      await request(app.getHttpServer())
        .put(`/api/gardens/${user1GardenId}/vegetables/${vegetableId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ importQty: 20, soldQty: 99 })
        .expect(400);
    });

    it('8. [403] USER (khác) — PUT nông sản của người khác', async () => {
      await request(app.getHttpServer())
        .put(`/api/gardens/${user1GardenId}/vegetables/${vegetableId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ importQty: 200 })
        .expect(403);
    });
  });

  // ───────────────────────────────────────────────────────
  // 1.4. Giá rau (Vegetable Price)  —  §IV.1.4
  // ───────────────────────────────────────────────────────
  describe('1.4. Giá rau (Vegetable Price)', () => {
    it('1. [201] USER (owner) — POST tạo giá mới', async () => {
      await request(app.getHttpServer())
        .post(`/api/gardens/${user1GardenId}/vegetables/${vegetableId}/price`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ price: 25000 })
        .expect(201);
    });

    it('2. [403] USER (khác) — POST tạo giá cho nông sản của người khác', async () => {
      await request(app.getHttpServer())
        .post(`/api/gardens/${user1GardenId}/vegetables/${vegetableId}/price`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ price: 30000 })
        .expect(403);
    });

    it('3. [403] ADMIN — POST tạo giá cho nông sản của user khác', async () => {
      await request(app.getHttpServer())
        .post(`/api/gardens/${user1GardenId}/vegetables/${vegetableId}/price`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 35000 })
        .expect(403);
    });

    it('4. [200] USER (owner) — PUT cập nhật giá mới nhất', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/gardens/${user1GardenId}/vegetables/${vegetableId}/price`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ price: 28000 })
        .expect(200);
      expect(res.body.price).toBe(28000);
    });

    it('5. [200] USER (owner) — GET lịch sử giá (giá mới nhất = 28000)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/gardens/${user1GardenId}/vegetables/${vegetableId}/price`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      // PUT cập nhật bản ghi giá mới nhất tại chỗ → giá hiện hành là 28000
      expect(res.body[0].price).toBe(28000);
    });
  });

  // ───────────────────────────────────────────────────────
  // 1.5. Bán hàng (Sale)  —  §IV.1.5
  // ───────────────────────────────────────────────────────
  describe('1.5. Bán hàng (Sale)', () => {
    let saleId: number;

    it('1. [201] USER (owner) — POST bán hàng thành công (trừ tồn kho + lưu hóa đơn)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/sales')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ gardenId: user1GardenId, vegetableId, quantity: 5 })
        .expect(201);
      saleId = res.body.id;
      expect(res.body).toHaveProperty('totalAmount');
      expect(res.body.totalAmount).toBe(5 * 28000); // 5 * giá hiện tại 28000
    });

    it('2. [400] USER (owner) — POST bán vượt kho', async () => {
      // Còn lại: importQty=150, soldQty đã bán 10 + 5 = 15, tồn = 135
      await request(app.getHttpServer())
        .post('/api/sales')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ gardenId: user1GardenId, vegetableId, quantity: 9999 })
        .expect(400);
    });

    it('5. [403] USER (khác) — POST bán hàng trong vườn người khác', async () => {
      await request(app.getHttpServer())
        .post('/api/sales')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ gardenId: user1GardenId, vegetableId, quantity: 1 })
        .expect(403);
    });

    it('6. [403] ADMIN — POST bán hàng trong vườn của user khác (nghiệp vụ sở hữu)', async () => {
      await request(app.getHttpServer())
        .post('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ gardenId: user1GardenId, vegetableId, quantity: 1 })
        .expect(403);
    });

    it('7. [200] USER — GET danh sách giao dịch (chỉ vườn của mình)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/sales')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      // user2 hasn't made any sales, should have 0
      const res2 = await request(app.getHttpServer())
        .get('/api/sales')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);
      expect(res2.body.length).toBe(0);
    });

    it('8. [200] ADMIN — GET tất cả giao dịch toàn hệ thống', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('9. [200] USER (owner) — GET /sales/:id chi tiết hóa đơn', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/sales/${saleId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      expect(res.body.id).toBe(saleId);
    });

    it('10. [403] USER (khác) — GET /sales/:id hóa đơn của người khác', async () => {
      await request(app.getHttpServer())
        .get(`/api/sales/${saleId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });
  });

  // ───────────────────────────────────────────────────────
  // 1.6. Doanh thu (Price & Revenue)  —  §IV.1.6
  // ───────────────────────────────────────────────────────
  describe('1.6. Doanh thu (Price & Revenue)', () => {
    it('2. [200] USER — GET /api/all/price (chỉ doanh thu vườn mình)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/all/price?period=day')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      expect(res.body).toHaveProperty('period', 'day');
      expect(res.body).toHaveProperty('totalRevenue');
      expect(res.body.totalRevenue).toBeGreaterThan(0);
    });

    it('1. [200] ADMIN — GET /api/all/price (doanh thu toàn hệ thống)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/all/price?period=day')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('period', 'day');
    });

    it('3. [200] USER — GET /api/price (lịch sử giá)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/price?period=day')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('4. [400] USER — GET /api/all/price với period không hợp lệ', async () => {
      await request(app.getHttpServer())
        .get('/api/all/price?period=invalid')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);
    });
  });

  // ───────────────────────────────────────────────────────
  // 1.7. Điều khiển Thiết bị IoT  —  §IV.1.7
  // ───────────────────────────────────────────────────────
  describe('1.7. Điều khiển Thiết bị IoT (Device Command)', () => {
    it('1. [200] USER (owner) — POST /device/command với userId đúng', async () => {
      // Get the actual user1 id from DB
      const user1Record = await prisma.user.findUnique({ where: { email: user1Email } });
      const res = await request(app.getHttpServer())
        .post('/api/device/command')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ gardenId: user1GardenId, userId: user1Record!.id, led1State: 'Off' })
        .expect(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Command successfully published');
    });

    it('2. [403] USER — userId mismatch (giả mạo userId)', async () => {
      const user1Record = await prisma.user.findUnique({ where: { email: user1Email } });
      await request(app.getHttpServer())
        .post('/api/device/command')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ gardenId: user1GardenId, userId: user1Record!.id + 999, led1State: 'On' })
        .expect(403);
    });

    it('3. [403] USER (khác) — POST /device/command vào garden của người khác', async () => {
      const user2Record = await prisma.user.findUnique({ where: { email: user2Email } });
      await request(app.getHttpServer())
        .post('/api/device/command')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ gardenId: user1GardenId, userId: user2Record!.id, led1State: 'On' })
        .expect(403);
    });

    it('4. [404] POST /device/command — garden không tồn tại', async () => {
      const user1Record = await prisma.user.findUnique({ where: { email: user1Email } });
      await request(app.getHttpServer())
        .post('/api/device/command')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ gardenId: 99999, userId: user1Record!.id, led1State: 'On' })
        .expect(404);
    });

    it('5. [200] ADMIN — POST /device/command vào garden bất kỳ (quản trị)', async () => {
      const adminRecord = await prisma.user.findUnique({ where: { email: adminEmail } });
      const res = await request(app.getHttpServer())
        .post('/api/device/command')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ gardenId: user1GardenId, userId: adminRecord!.id, led1State: 'On' })
        .expect(200);
      expect(res.body).toHaveProperty('message');
    });

    it('6. [200] USER (owner) — lệnh 3 LED (đỏ/vàng/xanh) được đẩy xuống MQTT', async () => {
      const user1Record = await prisma.user.findUnique({ where: { email: user1Email } });
      const res = await request(app.getHttpServer())
        .post('/api/device/command')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          gardenId: user1GardenId,
          userId: user1Record!.id,
          ledRedState: 'On',
          ledYellowState: 'Off',
          ledGreenState: 'On',
        })
        .expect(200);
      expect(res.body.data.ledRedState).toBe('On');
      expect(res.body.data.ledYellowState).toBe('Off');
      expect(res.body.data.ledGreenState).toBe('On');
    });

    it('7. [400] lệnh 3 LED — giá trị ledRedState không hợp lệ', async () => {
      const user1Record = await prisma.user.findUnique({ where: { email: user1Email } });
      await request(app.getHttpServer())
        .post('/api/device/command')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          gardenId: user1GardenId,
          userId: user1Record!.id,
          ledRedState: 'Flash', // không thuộc ['On','Off']
        })
        .expect(400);
    });
  });
});