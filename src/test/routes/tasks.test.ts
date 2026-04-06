/* eslint-disable jest/expect-expect, @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
import { app } from '../../main/app';
import { expect } from 'chai';
import request from 'supertest';
import axios from 'axios';
import sinon from 'sinon';

describe('Tasks routes', () => {
  let axiosGetStub: sinon.SinonStub;
  let axiosPostStub: sinon.SinonStub;
  let axiosPatchStub: sinon.SinonStub;
  let axiosDeleteStub: sinon.SinonStub;

  const mockTask = {
    id: 1,
    type: 'tasks',
    title: 'AAAA - Task to do',
    description: 'Test Description',
    status: 'DRAFT',
    dueDate: '2026-05-01T10:00:00',
    createdAt: '2026-04-06T10:00:00',
    updatedAt: '2026-04-06T10:00:00',
    version: 0,
    links: {
      self: '/v1/tasks/1',
      update: '/v1/tasks/1',
      delete: '/v1/tasks/1'
    }
  };

  const mockTasksResponse = {
    data: [mockTask],
    links: {
      self: '/v1/tasks?page=0&size=10',
      first: '/v1/tasks?page=0&size=10',
      next: '/v1/tasks?page=1&size=10',
      last: '/v1/tasks?page=5&size=10'
    },
    pageDetails: {
      totalElements: 55,
      totalPages: 6,
      currentPage: 0,
      pageSize: 10
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
    test('should render tasks list page with tasks data', async () => {
      axiosGetStub.resolves({ data: mockTasksResponse });

      const response = await request(app)
        .get('/tasks')
        .expect(200);

      expect(response.text).to.contain('Case Worker Dashboard');
      expect(response.text).to.contain('Active Tasks');
      expect(response.text).to.contain(mockTask.title);
      expect(axiosGetStub.calledWith('http://localhost:4000/v1/tasks?page=0&size=10')).to.be.true;
    });

    test('should handle pagination parameters', async () => {
      axiosGetStub.resolves({ data: mockTasksResponse });

      await request(app)
        .get('/tasks?page=1&size=20')
        .expect(200);

      expect(axiosGetStub.calledWith('http://localhost:4000/v1/tasks?page=1&size=20')).to.be.true;
    });

    test('should render error message when API fails', async () => {
      axiosGetStub.rejects(new Error('API Error'));

      const response = await request(app)
        .get('/tasks')
        .expect(200);

      expect(response.text).to.contain('Failed to load tasks');
    });
  });

  describe('GET /tasks/new', () => {
    test('should render create task form', async () => {
      const response = await request(app)
        .get('/tasks/new')
        .expect(200);

      expect(response.text).to.contain('Create new task');
      expect(response.text).to.contain('Title');
      expect(response.text).to.contain('Description');
      expect(response.text).to.contain('Due Date');
    });
  });

  describe('POST /tasks', () => {
    test('should create task and redirect to tasks list', async () => {
      axiosPostStub.resolves({ 
        status: 201,
        data: { id: 1 },
        headers: { location: '/v1/tasks/1' }
      });

      await request(app)
        .post('/tasks')
        .send({
          title: 'New Task',
          description: 'New Description',
          dueDate: '2026-05-01'
        })
        .expect(302)
        .expect('Location', '/tasks');

      expect(axiosPostStub.calledOnce).to.be.true;
      const postData = axiosPostStub.firstCall.args[1];
      expect(postData.title).to.equal('New Task');
      expect(postData.status).to.equal('DRAFT');
      expect(postData.dueDate).to.equal('2026-05-01T23:59:59');
    });

    test('should render form with error when creation fails', async () => {
      axiosPostStub.rejects({
        response: {
          data: { message: 'Invalid due date' }
        }
      });

      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'New Task',
          description: 'New Description',
          dueDate: '2026-05-01'
        })
        .expect(200);

      expect(response.text).to.contain('Invalid due date');
      expect(response.text).to.contain('Create new task');
    });
  });

  describe('GET /tasks/:id/edit', () => {
    test('should render edit form for existing task', async () => {
      axiosGetStub.resolves({ data: mockTasksResponse });

      const response = await request(app)
        .get('/tasks/1/edit')
        .expect(200);

      expect(response.text).to.contain('Edit task');
      expect(response.text).to.contain(mockTask.title);
      expect(response.text).to.contain(mockTask.description);
    });

    test('should return 404 for non-existent task', async () => {
      axiosGetStub.resolves({ 
        data: { 
          data: [],
          links: {},
          pageDetails: { totalElements: 0, totalPages: 0, currentPage: 0, pageSize: 10 }
        } 
      });

      await request(app)
        .get('/tasks/999/edit')
        .expect(404);
    });
  });

  describe('POST /tasks/:id', () => {
    test('should update task status and redirect to tasks list', async () => {
      axiosGetStub.resolves({ data: mockTasksResponse });
      axiosPatchStub.resolves({ status: 200 });

      await request(app)
        .post('/tasks/1')
        .send({ status: 'SUBMITTED' })
        .expect(302)
        .expect('Location', '/tasks');

      expect(axiosPatchStub.calledOnce).to.be.true;
      const patchData = axiosPatchStub.firstCall.args[1];
      expect(patchData).to.deep.equal({ status: 'SUBMITTED' });
    });

    test('should use HATEOAS update link', async () => {
      axiosGetStub.resolves({ data: mockTasksResponse });
      axiosPatchStub.resolves({ status: 200 });

      await request(app)
        .post('/tasks/1')
        .send({ status: 'SUBMITTED' })
        .expect(302);

      const patchUrl = axiosPatchStub.firstCall.args[0];
      expect(patchUrl).to.equal('http://localhost:4000/v1/tasks/1');
    });

    test('should render form with error when update fails', async () => {
      axiosGetStub.onFirstCall().resolves({ data: mockTasksResponse });
      axiosGetStub.onSecondCall().resolves({ data: mockTasksResponse });
      axiosPatchStub.rejects({
        response: {
          data: { message: 'Invalid status transition' }
        }
      });

      const response = await request(app)
        .post('/tasks/1')
        .send({ status: 'DISPOSED' })
        .expect(200);

      expect(response.text).to.contain('Invalid status transition');
      expect(response.text).to.contain('Edit task');
    });
  });

  describe('POST /tasks/:id/delete', () => {
    test('should delete task and redirect to tasks list', async () => {
      axiosGetStub.resolves({ data: mockTasksResponse });
      axiosDeleteStub.resolves({ status: 204 });

      await request(app)
        .post('/tasks/1/delete')
        .expect(302)
        .expect('Location', '/tasks');

      expect(axiosDeleteStub.calledOnce).to.be.true;
    });

    test('should use HATEOAS delete', async () => {
      axiosGetStub.resolves({ data: mockTasksResponse });
      axiosDeleteStub.resolves({ status: 204 });

      await request(app)
        .post('/tasks/1/delete')
        .expect(302);

      const deleteUrl = axiosDeleteStub.firstCall.args[0];
      expect(deleteUrl).to.equal('http://localhost:4000/v1/tasks/1');
    });

    test('should redirect with error when deletion fails', async () => {
      axiosGetStub.resolves({ data: mockTasksResponse });
      axiosDeleteStub.rejects(new Error('Delete failed'));

      await request(app)
        .post('/tasks/1/delete')
        .expect(302)
        .expect('Location', '/tasks?error=Failed%20to%20delete%20task');
    });
  });
});
