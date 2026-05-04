import request from 'supertest';
import express from 'express';
import routes from '../routes';
import { errorMiddleware } from '../middlewares/error.middleware';

const app = express();
app.use(express.json());
app.use('/api', routes);
app.use(errorMiddleware);

let authToken: string;

const validPayload = {
  toolName: 'Slack',
  vendor: 'Salesforce',
  plan: 'Pro',
  expiryDate: '2027-01-01',
  paymentCycle: 'annual',
  status: 'active',
  licenses: 50,
  departments: ['Engineering'],
  teams: ['Backend'],
  owner: { name: 'Alice', email: 'alice@nebulaworks.com' },
  renewalReminderDays: [30, 7, 1],
};

beforeAll(async () => {
  const res = await request(app).post('/api/auth/signup').send({
    name: 'Test Admin',
    email: `admin-${Date.now()}@test.com`,
    password: 'password123',
    orgName: 'Test Org',
  });
  expect(res.status).toBe(201);
  authToken = res.body.data.token;
});

function authReq(req: request.Test) {
  return req.set('Authorization', `Bearer ${authToken}`);
}

describe('POST /api/subscriptions', () => {
  it('creates a subscription and returns 201', async () => {
    const res = await authReq(request(app).post('/api/subscriptions').send(validPayload));
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.toolName).toBe('Slack');
  });

  it('returns 409 for duplicate toolName+vendor', async () => {
    await authReq(request(app).post('/api/subscriptions').send(validPayload));
    const res = await authReq(request(app).post('/api/subscriptions').send(validPayload));
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await authReq(request(app).post('/api/subscriptions').send({ toolName: 'OnlyName' }));
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid owner email', async () => {
    const res = await authReq(
      request(app)
        .post('/api/subscriptions')
        .send({ ...validPayload, vendor: 'NewVendor', owner: { name: 'Bob', email: 'not-an-email' } })
    );
    expect(res.status).toBe(400);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).post('/api/subscriptions').send(validPayload);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/subscriptions', () => {
  beforeEach(async () => {
    await authReq(request(app).post('/api/subscriptions').send(validPayload));
    await authReq(request(app).post('/api/subscriptions').send({ ...validPayload, toolName: 'Figma', vendor: 'Figma Inc.', status: 'expired' }));
  });

  it('returns all subscriptions', async () => {
    const res = await authReq(request(app).get('/api/subscriptions'));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });

  it('filters by status=active', async () => {
    const res = await authReq(request(app).get('/api/subscriptions?status=active'));
    expect(res.status).toBe(200);
    expect(res.body.data.every((s: { status: string }) => s.status === 'active')).toBe(true);
  });

  it('supports pagination', async () => {
    const res = await authReq(request(app).get('/api/subscriptions?page=1&limit=1'));
    expect(res.body.data).toHaveLength(1);
  });
});

describe('GET /api/subscriptions/:id', () => {
  it('returns a specific subscription', async () => {
    const create = await authReq(request(app).post('/api/subscriptions').send({ ...validPayload, vendor: 'UniqueVendor' }));
    const id = create.body.data._id;
    const res = await authReq(request(app).get(`/api/subscriptions/${id}`));
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(id);
  });

  it('returns 404 for unknown id', async () => {
    const res = await authReq(request(app).get('/api/subscriptions/000000000000000000000000'));
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/subscriptions/:id', () => {
  it('updates a subscription', async () => {
    const create = await authReq(request(app).post('/api/subscriptions').send({ ...validPayload, vendor: 'PatchVendor' }));
    const id = create.body.data._id;
    const res = await authReq(request(app).patch(`/api/subscriptions/${id}`).send({ plan: 'Enterprise' }));
    expect(res.status).toBe(200);
    expect(res.body.data.plan).toBe('Enterprise');
  });

  it('returns 404 for unknown id', async () => {
    const res = await authReq(request(app).patch('/api/subscriptions/000000000000000000000000').send({ plan: 'x' }));
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/subscriptions/:id', () => {
  it('soft-deletes a subscription', async () => {
    const create = await authReq(request(app).post('/api/subscriptions').send({ ...validPayload, vendor: 'DeleteVendor' }));
    const id = create.body.data._id;
    const del = await authReq(request(app).delete(`/api/subscriptions/${id}`));
    expect(del.status).toBe(200);

    const get = await authReq(request(app).get(`/api/subscriptions/${id}`));
    expect(get.status).toBe(404);
  });
});

describe('GET /api/audit/:subscriptionId', () => {
  it('returns audit logs for a subscription', async () => {
    const create = await authReq(request(app).post('/api/subscriptions').send({ ...validPayload, vendor: 'AuditVendor' }));
    const id = create.body.data._id;
    const res = await authReq(request(app).get(`/api/audit/${id}`));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].action).toBe('created');
  });
});

describe('POST /api/auth/signup', () => {
  it('returns 400 for missing fields', async () => {
    const res = await request(app).post('/api/auth/signup').send({ email: 'x@x.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 401 for wrong credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });
});
