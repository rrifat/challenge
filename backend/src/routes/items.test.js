const request = require('supertest');
const app = require('../app');

describe('Items API', () => {
  it('should return a list of items', async () => {
    const response = await request(app).get('/api/items');
    expect(response.status).toBe(200);
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