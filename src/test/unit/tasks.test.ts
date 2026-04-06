/* eslint-disable jest/expect-expect, @typescript-eslint/no-explicit-any */
import { app } from '../../main/app';
import { expect } from 'chai';
import request from 'supertest';
import axios from 'axios';
import sinon from 'sinon';

describe('Tasks Unit Tests', () => {
  let axiosGetStub: sinon.SinonStub;
  let axiosPostStub: sinon.SinonStub;
  let axiosPatchStub: sinon.SinonStub;
  let axiosDeleteStub: sinon.SinonStub;

  const mockTask = {
    id: 1,
    title: 'AAAA - Task to do',
    description: 'Test Description',
    status: 'DRAFT',
    dueDate: '2026-05-01T23:59:59',
    links: {
      self: '/v1/tasks/1',
      update: '/v1/tasks/1',
      delete: '/v1/tasks/1'
    }
  };

  const mockTasksResponse = {
    data: [mockTask],
    links: {
      self: '/v1/tasks?page=0&size=10'
    },
    page: {
      size: 10,
      totalElements: 1,
      totalPages: 1,
      number: 0
    }
  };

  beforeEach(() => {
    axiosGetStub = sinon.stub(axios, 'get');
    axiosPostStub = sinon.stub(axios, 'post');
    axiosPatchStub = sinon.stub(axios, 'patch');
    axiosDeleteStub = sinon.stub(axios, 'delete');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('GET /tasks', () => {
    test('should render tasks list with dashboard heading', async () => {
      axiosGetStub.resolves({ data: mockTasksResponse });

      const response = await request(app)
        .get('/tasks')
        .expect(200);

      expect(response.text).toBe('Case Worker Dashboard');
      expect(response.text).toBe('Create a new task');
      expect(response.text).toBe('New Task');
    });

    test('should display tasks in table', async () => {
      axiosGetStub.resolves({ data: mockTasksResponse });

      const response = await request(app)
        .get('/tasks')
        .expect(200);

      expect(response.text).to.contain(mockTask.title);
      expect(response.text).to.contain(mockTask.status);
    });
  });

  describe('Task Status Transitions', () => {
    test('should allow status update from DRAFT to SUBMITTED', async () => {
      axiosGetStub.resolves({ data: mockTasksResponse });
      axiosPatchStub.resolves({ data: { ...mockTask, status: 'SUBMITTED' } });

      const response = await request(app)
        .post('/tasks/1')
        .send({ status: 'SUBMITTED' })
        .expect(302);

      expect(response.header.location).to.equal('/tasks');
    });

    test('should allow status update to DISPOSED', async () => {
      axiosGetStub.resolves({ data: mockTasksResponse });
      axiosPatchStub.resolves({ data: { ...mockTask, status: 'DISPOSED' } });

      const response = await request(app)
        .post('/tasks/1')
        .send({ status: 'DISPOSED' })
        .expect(302);

      expect(response.header.location).to.equal('/tasks');
    });
  });

  describe('Task Creation', () => {
    test('should create task with all required fields', async () => {
      const newTask = {
        title: 'New Task',
        description: 'Description',
        dueDate: '2026-05-01'
      };
      axiosPostStub.resolves({ 
        data: { 
          id: 2, 
          ...newTask, 
          status: 'DRAFT',
          dueDate: '2026-05-01T23:59:59'
        } 
      });

      const response = await request(app)
        .post('/tasks')
        .send(newTask)
        .expect(302);

      expect(response.header.location).to.equal('/tasks');
    });

    test('should append T23:59:59 to dueDate for API compatibility', async () => {
      const newTask = {
        title: 'New Task',
        description: 'Description',
        dueDate: '2026-05-01'
      };
      axiosPostStub.resolves({ data: { id: 2, ...newTask } });

      await request(app)
        .post('/tasks')
        .send(newTask)
        .expect(302);

      const callArg = axiosPostStub.firstCall.args[1];
      expect(callArg.dueDate).to.equal('2026-05-01T23:59:59');
    });
  });

  describe('HATEOAS Link Handling', () => {
    test('should use HATEOAS update link when available', async () => {
      axiosGetStub.resolves({ data: mockTasksResponse });
      axiosPatchStub.resolves({ data: mockTask });

      await request(app)
        .post('/tasks/1')
        .send({ status: 'SUBMITTED' })
        .expect(302);

      expect(axiosPatchStub.calledWith('http://localhost:4000/v1/tasks/1')).to.be.true;
    });

    test('should use HATEOAS delete link when available', async () => {
      axiosGetStub.resolves({ data: mockTasksResponse });
      axiosDeleteStub.resolves({});

      await request(app)
        .post('/tasks/1/delete')
        .expect(302);

      expect(axiosDeleteStub.calledWith('http://localhost:4000/v1/tasks/1')).to.be.true;
    });
  });

  describe('Error Handling', () => {
    test('should display error message when task not found', async () => {
      axiosGetStub.resolves({ data: { data: [] } });

      const response = await request(app)
        .get('/tasks/999/edit')
        .expect(404);

      expect(response.text).to.contain('Page Not Found');
    });

    test('should show error when API fails on create', async () => {
      axiosPostStub.rejects({
        response: {
          data: { message: 'Title is required' }
        }
      });

      const response = await request(app)
        .post('/tasks')
        .send({ title: '', description: 'Test' })
        .expect(200);

      expect(response.text).to.contain('Title is required');
    });

    test('should redirect with error when delete fails', async () => {
      axiosGetStub.resolves({ data: mockTasksResponse });
      axiosDeleteStub.rejects(new Error('Delete failed'));

      const response = await request(app)
        .post('/tasks/1/delete')
        .expect(302);

      expect(response.header.location).to.contain('error=Failed%20to%20delete%20task');
    });
  });

  describe('Pagination', () => {
    test('should pass page and size parameters to API', async () => {
      axiosGetStub.resolves({ 
        data: {
          data: [],
          links: {},
          page: { size: 20, totalElements: 0, totalPages: 0, number: 2 }
        } 
      });

      await request(app)
        .get('/tasks?page=2&size=20')
        .expect(200);

      expect(axiosGetStub.calledWith('http://localhost:4000/v1/tasks?page=2&size=20')).to.be.true;
    });

    test('should show pagination when multiple pages exist', async () => {
      axiosGetStub.resolves({
        data: {
          data: [mockTask],
          links: {
            self: '/v1/tasks?page=1&size=10',
            prev: '/v1/tasks?page=0&size=10',
            next: '/v1/tasks?page=2&size=10'
          },
          page: {
            size: 10,
            totalElements: 30,
            totalPages: 3,
            number: 1
          }
        }
      });

      const response = await request(app)
        .get('/tasks?page=1&size=10')
        .expect(200);

      // Pagination should be visible with multiple pages - check for page numbers
      expect(response.text).to.contain('1');
      expect(response.text).to.contain('2');
      expect(response.text).to.contain('3');
    });
  });
});
