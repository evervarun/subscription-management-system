import request from 'supertest';
import express from 'express';
import routes from '../routes';
import { errorMiddleware } from '../middlewares/error.middleware';

// Build a minimal express app for testing (no DB connect needed — setup.ts handles it)
const app = express();
app.use(express.json());
app.use('/api', routes);
app.use(errorMiddleware);

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

describe('POST /api/subscriptions', () => {
  it('creates a subscription and returns 201', async () => {
    const res = await request(app).post('/api/subscriptions').send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.toolName).toBe('Slack');
  });

  it('returns 409 for duplicate toolName+vendor', async () => {
    await request(app).post('/api/subscriptions').send(validPayload);
    const res = await request(app).post('/api/subscriptions').send(validPayload);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/subscriptions').send({ toolName: 'OnlyName' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid owner email', async () => {
    const res = await request(app)
      .post('/api/subscriptions')
      .send({ ...validPayload, vendor: 'NewVendor', owner: { name: 'Bob', email: 'not-an-email' } });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/subscriptions', () => {
  beforeEach(async () => {
    await request(app).post('/api/subscriptions').send(validPayload);
    await request(app).post('/api/subscriptions').send({ ...validPayload, toolName: 'Figma', vendor: 'Figma Inc.', status: 'expired' });
  });

  it('returns all subscriptions', async () => {
    const res = await request(app).get('/api/subscriptions');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(2);
  });

  it('filters by status=active', async () => {
    const res = await request(app).get('/api/subscriptions?status=active');
    expect(res.status).toBe(200);
    expect(res.body.data.every((s: { status: string }) => s.status === 'active')).toBe(true);
  });

  it('supports pagination', async () => {
    const res = await request(app).get('/api/subscriptions?page=1&limit=1');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(2);
  });
});

describe('GET /api/subscriptions/:id', () => {
  it('returns a specific subscription', async () => {
    const create = await request(app).post('/api/subscriptions').send(validPayload);
    const id = create.body.data._id;
    const res = await request(app).get(`/api/subscriptions/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(id);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/subscriptions/000000000000000000000000');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/subscriptions/:id', () => {
  it('updates a subscription', async () => {
    const create = await request(app).post('/api/subscriptions').send(validPayload);
    const id = create.body.data._id;
    const res = await request(app).patch(`/api/subscriptions/${id}`).send({ plan: 'Enterprise' });
    expect(res.status).toBe(200);
    expect(res.body.data.plan).toBe('Enterprise');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).patch('/api/subscriptions/000000000000000000000000').send({ plan: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/subscriptions/:id', () => {
  it('soft-deletes a subscription', async () => {
    const create = await request(app).post('/api/subscriptions').send(validPayload);
    const id = create.body.data._id;
    const del = await request(app).delete(`/api/subscriptions/${id}`);
    expect(del.status).toBe(200);

    // Should no longer appear in list
    const list = await request(app).get('/api/subscriptions');
    expect(list.body.total).toBe(0);
  });
});

describe('GET /api/audit/:subscriptionId', () => {
  it('returns audit logs for a subscription', async () => {
    const create = await request(app).post('/api/subscriptions').send(validPayload);
    const id = create.body.data._id;
    const res = await request(app).get(`/api/audit/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].action).toBe('created');
  });
});
