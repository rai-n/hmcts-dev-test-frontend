import { Application } from 'express';
import tasksRoutes from '../routes/';

describe('Tasks routes', () => {
  let app: Application;

  beforeEach(() => {
    // Mock express app
    app = {
      get: jest.fn(),
      post: jest.fn()
    } as any;
  });

  test('should register routes', () => {
    tasksRoutes(app);

    expect(app.get).toHaveBeenCalledWith('/tasks', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/tasks/new', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/tasks', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/tasks/:id', expect.any(Function));
    expect(app.get).toHaveBeenCalledWith('/tasks/:id/edit', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/tasks/:id', expect.any(Function));
    expect(app.post).toHaveBeenCalledWith('/tasks/:id/delete', expect.any(Function));
  });
});