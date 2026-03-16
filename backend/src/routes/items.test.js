const request = require('supertest');
const app = require('../app');

describe('Items API', () => {
  it('should return a paginated list of items', async () => {
    const response = await request(app).get('/api/items');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        items: expect.any(Array),
        page: 1,
        limit: 20,
        total: expect.any(Number),
        totalPages: expect.any(Number),
        q: "",
      }),
    );
  });

  it('should apply page and limit query params', async () => {
    const response = await request(app).get('/api/items?page=2&limit=2');

    expect(response.status).toBe(200);
    expect(response.body.page).toBe(2);
    expect(response.body.limit).toBe(2);
    expect(response.body.items.map((item) => item.id)).toEqual([3, 4]);
  });

  it('should filter items using the q query param', async () => {
    const response = await request(app)
      .get('/api/items')
      .query({ q: 'standing desk' });

    expect(response.status).toBe(200);
    expect(response.body.q).toBe('standing desk');
    expect(response.body.total).toBeGreaterThanOrEqual(1);
    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 5,
          name: 'Standing Desk',
        }),
      ]),
    );
  });

  it('should return an item by id', async () => {
    const response = await request(app).get('/api/items/1');
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
  });

  it('should return a 404 for a non-existent item', async () => {
    const response = await request(app).get('/api/items/999');
    expect(response.status).toBe(404);
  });

  it('should return a 400 for a invalid item id', async () => {
    const response = await request(app).get('/api/items/invalid');
    expect(response.status).toBe(400);
  });

  it('should return a 201 for a new item', async () => {
    const response = await request(app).post('/api/items').send({
      name: 'New Item Test',
      category: 'Test Category',
      price: 100
    });
    expect(response.status).toBe(201);
    expect(response.body.name).toBe('New Item Test');
  });

  it('should return a 400 for a invalid item payload', async () => {
    const response = await request(app).post('/api/items').send({
      name: '',
      category: '',
      price: 'invalid' 
    });
    expect(response.status).toBe(400);
  });

  it('should return a 400 for a invalid item price', async () => {
    const response = await request(app).post('/api/items').send({
      name: 'New Item Test',
      category: 'Test Category',
      price: -1
    });
    expect(response.status).toBe(400);
  });

});
