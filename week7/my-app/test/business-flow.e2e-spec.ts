import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { of } from 'rxjs';
import { PrismaClientExceptionFilter } from './../src/common/filter/prisma-client-exception.filter';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { Role } from '@prisma/client';

describe('Smart Garden — Business Flow E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const ts = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
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

  beforeAll(async () => {
    const mockMqttClient = {
      connect: jest.fn().mockReturnValue(Promise.resolve()),
      close: jest.fn().mockReturnValue(Promise.resolve()),
      emit: jest.fn().mockReturnValue(of({})),
      send: jest.fn().mockReturnValue(of({})),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('MQTT_SERVICE')
      .useValue(mockMqttClient)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new PrismaClientExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);

    // 1. Tạo tài khoản Admin qua Register API, sau đó cập nhật Role = ADMIN
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'E2E Admin', email: adminEmail, password: 'adminpassword123' })
      .expect(201);

    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: Role.ADMIN },
    });

    const adminLoginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'adminpassword123' })
      .expect(200);
    adminToken = adminLoginRes.body.access_token;

    // 2. Tạo tài khoản User 1
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'User One', email: user1Email, password: 'userpassword123' })
      .expect(201);

    const login1Res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user1Email, password: 'userpassword123' })
      .expect(200);
    user1Token = login1Res.body.access_token;

    // 3. Tạo tài khoản User 2
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'User Two', email: user2Email, password: 'userpassword456' })
      .expect(201);

    const login2Res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user2Email, password: 'userpassword456' })
      .expect(200);
    user2Token = login2Res.body.access_token;
  });

  afterAll(async () => {
    try {
      const users = await prisma.user.findMany({
        where: { email: { in: allCreatedEmails } },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);

      if (userIds.length > 0) {
        const gardens = await prisma.garden.findMany({
          where: { ownerId: { in: userIds } },
          select: { id: true },
        });
        const gardenIds = gardens.map((g) => g.id);

        if (gardenIds.length > 0) {
          await prisma.sale.deleteMany({
            where: { gardenId: { in: gardenIds } },
          });
        }

        await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }
    } catch {
      // Bỏ qua lỗi trong quá trình dọn dẹp kết thúc test
    } finally {
      await prisma.$disconnect();
      await app.close();
    }
  });

  // ───────────────────────────────────────────────────────
  // 1.1. Auth
  // ───────────────────────────────────────────────────────
  describe('1.1. Auth', () => {
    it('1. [201] register user successfully', async () => {
      const email = `fresh-${Date.now()}@test.com`;
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Fresh', email, password: 'freshpassword123' })
        .expect(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.role).toBe(Role.USER);
      await prisma.user.delete({ where: { email } });
    });

    it('2. [400] register duplicate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Dup', email: user1Email, password: 'userpassword123' })
        .expect(400);
      expect(res.body.message).toContain('Email already in use');
    });

    it('3. [200] login valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user1Email, password: 'userpassword123' })
        .expect(200);
      expect(res.body).toHaveProperty('access_token');
    });

    it('4. [401] login wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user1Email, password: 'wrongpassword' })
        .expect(401);
    });

    it('5. [401] login nonexistent email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'anypassword123' })
        .expect(401);
    });
  });

  // ───────────────────────────────────────────────────────
  // 1.2. Garden
  // ───────────────────────────────────────────────────────
  describe('1.2. Garden', () => {
    it('1. [201] USER creates garden', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/gardens')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Garden User1' })
        .expect(201);
      user1GardenId = res.body.id;
      expect(res.body.ownerId).toBeDefined();
    });

    it('2. [200] USER sees only owned gardens', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/gardens')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(user1GardenId);
    });

    it('3. [200] ADMIN sees all gardens', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/gardens')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      const found = res.body.some((g: any) => g.id === user1GardenId);
      expect(found).toBe(true);
    });

    it('4. [200] USER (owner) gets garden details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/gardens/${user1GardenId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      expect(res.body.id).toBe(user1GardenId);
    });

    it('5. [403] USER cannot get other user garden', async () => {
      await request(app.getHttpServer())
        .get(`/api/gardens/${user1GardenId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });

    it('6. [200] ADMIN gets any garden details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/gardens/${user1GardenId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.id).toBe(user1GardenId);
    });

    it('7. [200] USER updates owned garden', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/gardens/${user1GardenId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Garden User1 Renamed' })
        .expect(200);
      expect(res.body.name).toBe('Garden User1 Renamed');
    });

    it('8. [403] USER cannot update other user garden', async () => {
      await request(app.getHttpServer())
        .put(`/api/gardens/${user1GardenId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ name: 'Hacked' })
        .expect(403);
    });

    it('setup user2 garden', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/gardens')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ name: 'Garden User2' })
        .expect(201);
      user2GardenId = res.body.id;
    });

    it('9. [403] USER cannot delete other user garden', async () => {
      await request(app.getHttpServer())
        .delete(`/api/gardens/${user1GardenId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });

    it('10. [200] ADMIN deletes garden', async () => {
      const tempGarden = await request(app.getHttpServer())
        .post('/api/gardens')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Temp Garden' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/gardens/${tempGarden.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  // ───────────────────────────────────────────────────────
  // 1.3. Vegetable
  // ───────────────────────────────────────────────────────
  describe('1.3. Vegetable', () => {
    it('1. [201] USER (owner) adds vegetable', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/gardens/${user1GardenId}/vegetables`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Cà chua', importQty: 100 })
        .expect(201);
      vegetableId = res.body.id;
      expect(res.body.soldQty).toBe(0);
    });

    it('2. [403] USER cannot add vegetable to other user garden', async () => {
      await request(app.getHttpServer())
        .post(`/api/gardens/${user1GardenId}/vegetables`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ name: 'Rau muống', importQty: 50 })
        .expect(403);
    });

    it('3. [403] ADMIN cannot add vegetable to non-owned garden', async () => {
      await request(app.getHttpServer())
        .post(`/api/gardens/${user1GardenId}/vegetables`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Xà lách', importQty: 30 })
        .expect(403);
    });

    it('4. [200] USER lists vegetables in owned garden', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/gardens/${user1GardenId}/vegetables`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('5. [200] ADMIN monitors vegetables in any garden', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/gardens/${user1GardenId}/vegetables`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('6. [200] USER updates vegetable stock', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/gardens/${user1GardenId}/vegetables/${vegetableId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ importQty: 150, soldQty: 10 })
        .expect(200);
      expect(res.body.importQty).toBe(150);
      expect(res.body.soldQty).toBe(10);
    });

    it('7. [400] rejects when soldQty > importQty', async () => {
      await request(app.getHttpServer())
        .put(`/api/gardens/${user1GardenId}/vegetables/${vegetableId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ importQty: 20, soldQty: 99 })
        .expect(400);
    });

    it('8. [403] rejects updating other user vegetable', async () => {
      await request(app.getHttpServer())
        .put(`/api/gardens/${user1GardenId}/vegetables/${vegetableId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ importQty: 200 })
        .expect(403);
    });
  });

  // ───────────────────────────────────────────────────────
  // 1.4. Vegetable Price
  // ───────────────────────────────────────────────────────
  describe('1.4. Vegetable Price', () => {
    it('1. [201] USER sets new price', async () => {
      await request(app.getHttpServer())
        .post(`/api/gardens/${user1GardenId}/vegetables/${vegetableId}/price`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ price: 25000 })
        .expect(201);
    });

    it('2. [403] rejects setting price in other user garden', async () => {
      await request(app.getHttpServer())
        .post(`/api/gardens/${user1GardenId}/vegetables/${vegetableId}/price`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ price: 30000 })
        .expect(403);
    });

    it('3. [200] USER updates latest price', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/gardens/${user1GardenId}/vegetables/${vegetableId}/price`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ price: 28000 })
        .expect(200);
      expect(res.body.price).toBe(28000);
    });

    it('4. [200] USER gets price history', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/gardens/${user1GardenId}/vegetables/${vegetableId}/price`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].price).toBe(28000);
    });
  });

  // ───────────────────────────────────────────────────────
  // 1.5. Sale
  // ───────────────────────────────────────────────────────
  describe('1.5. Sale', () => {
    let saleId: number;

    it('1. [201] USER creates sale transaction', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/sales')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ gardenId: user1GardenId, vegetableId, quantity: 5 })
        .expect(201);
      saleId = res.body.id;
      expect(res.body.totalAmount).toBe(5 * 28000);
    });

    it('2. [400] rejects sale when quantity exceeds stock', async () => {
      await request(app.getHttpServer())
        .post('/api/sales')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ gardenId: user1GardenId, vegetableId, quantity: 9999 })
        .expect(400);
    });

    it('3. [403] rejects sale in other user garden', async () => {
      await request(app.getHttpServer())
        .post('/api/sales')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ gardenId: user1GardenId, vegetableId, quantity: 1 })
        .expect(403);
    });

    it('4. [200] USER gets own sales history', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/sales')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('5. [200] USER gets single sale record', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/sales/${saleId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      expect(res.body.id).toBe(saleId);
    });

    it('6. [403] rejects unauthorized access to sale details', async () => {
      await request(app.getHttpServer())
        .get(`/api/sales/${saleId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });
  });

  // ───────────────────────────────────────────────────────
  // 1.6. Price & Revenue
  // ───────────────────────────────────────────────────────
  describe('1.6. Price & Revenue', () => {
    it('1. [200] USER gets own garden total revenue', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/all/price?period=day')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
      expect(res.body.period).toBe('day');
      expect(res.body.totalRevenue).toBeGreaterThan(0);
    });

    it('2. [200] ADMIN gets system-wide revenue', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/all/price?period=day')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.period).toBe('day');
    });

    it('3. [400] rejects invalid period query param', async () => {
      await request(app.getHttpServer())
        .get('/api/all/price?period=yearly')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);
    });
  });

  // ───────────────────────────────────────────────────────
  // 1.7. Device Command (IoT)
  // ───────────────────────────────────────────────────────
  describe('1.7. Device Command', () => {
    it('1. [200] USER issues device command with matching userId', async () => {
      const user1Record = await prisma.user.findUnique({ where: { email: user1Email } });
      const res = await request(app.getHttpServer())
        .post('/api/device/command')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ gardenId: user1GardenId, userId: user1Record!.id, led1State: 'Off' })
        .expect(200);
      expect(res.body.message).toContain('Command successfully published');
    });

    it('2. [403] rejects command when userId is spoofed', async () => {
      const user1Record = await prisma.user.findUnique({ where: { email: user1Email } });
      await request(app.getHttpServer())
        .post('/api/device/command')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ gardenId: user1GardenId, userId: user1Record!.id + 999, led1State: 'On' })
        .expect(403);
    });

    it('3. [403] rejects command for other user garden', async () => {
      const user2Record = await prisma.user.findUnique({ where: { email: user2Email } });
      await request(app.getHttpServer())
        .post('/api/device/command')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ gardenId: user1GardenId, userId: user2Record!.id, led1State: 'On' })
        .expect(403);
    });

    it('4. [200] publishes 3-LED states to MQTT', async () => {
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

    it('5. [400] rejects invalid LED state value', async () => {
      const user1Record = await prisma.user.findUnique({ where: { email: user1Email } });
      await request(app.getHttpServer())
        .post('/api/device/command')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          gardenId: user1GardenId,
          userId: user1Record!.id,
          ledRedState: 'Blink',
        })
        .expect(400);
    });
  });
});