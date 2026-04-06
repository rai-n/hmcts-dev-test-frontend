import { Application, Request, Response } from 'express';
import axios from 'axios';

export default function (app: Application): void {
  // List tasks with pagination
  app.get('/tasks', async (req: Request, res: Response) => {
    try {
      const page = req.query.page || 0;
      const size = req.query.size || 10;
      const response = await axios.get(`http://localhost:4000/v1/tasks?page=${page}&size=${size}`);
      res.render('tasks', {
        tasks: response.data.data,
        pageDetails: response.data.pageDetails,
        links: response.data.links,
        error: req.query.error
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.render('tasks', { error: 'Failed to load tasks' });
    }
  });

  // Show create task form
  app.get('/tasks/new', (req: Request, res: Response) => {
    res.render('task-form', { task: {}, isEdit: false });
  });

  // Create task
  app.post('/tasks', async (req: Request, res: Response) => {
    try {
      const { title, description, dueDate } = req.body;
      // Convert date to ISO datetime format (append time to date)
      const formattedDueDate = dueDate ? `${dueDate}T23:59:59` : '';
      await axios.post('http://localhost:4000/v1/tasks', {
        title,
        description,
        status: 'DRAFT',
        dueDate: formattedDueDate
      });
      // Redirect back to tasks list after successful creation
      res.redirect('/tasks');
    } catch (error) {
      console.error('Error creating task:', error);
      res.render('task-form', {
        task: req.body,
        isEdit: false,
        error: error.response?.data?.message || 'Failed to create task'
      });
    }
  });

  // Edit task status -- could be extended to update other
  app.get('/tasks/:id/edit', async (req: Request, res: Response) => {
    try {
      // Since there's no GET /v1/tasks/{id}, we need to fetch from the list and find the task
      const response = await axios.get(`http://localhost:4000/v1/tasks?page=0&size=1000`);
      const tasks = response.data.data || [];
      const task = tasks.find((t: any) => t.id === parseInt(req.params.id));
      if (!task) {
        return res.status(404).render('not-found');
      }
      res.render('task-form', { task, isEdit: true });
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(404).render('not-found');
    }
  });

  // Update task
  app.post('/tasks/:id', async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      // Fetch task to get the HATEOAS update link
      const listResponse = await axios.get(`http://localhost:4000/v1/tasks?page=0&size=1000`);
      const tasks = listResponse.data.data || [];
      const task = tasks.find((t: any) => t.id === parseInt(req.params.id));
      
      if (!task) {
        return res.status(404).render('not-found');
      }
      
      const updateUrl = `http://localhost:4000${task.links.update}`;
      
      // PATCH only sends status per API spec
      await axios.patch(updateUrl, { status });
      
      // Redirect back to tasks list after successful update
      res.redirect('/tasks');
    } catch (error) {
      console.error('Error updating task:', error);
      // Fetch task from list for error display
      const listResponse = await axios.get(`http://localhost:4000/v1/tasks?page=0&size=1000`);
      const tasks = listResponse.data.data || [];
      const existingTask = tasks.find((t: any) => t.id === parseInt(req.params.id)) || {};
      res.render('task-form', {
        task: { ...existingTask, ...req.body },
        isEdit: true,
        error: error.response?.data?.message || 'Failed to update task'
      });
    }
  });

  // Delete task 
  app.post('/tasks/:id/delete', async (req: Request, res: Response) => {
    try {
      // Fetch task to get the HATEOAS delete link
      const listResponse = await axios.get(`http://localhost:4000/v1/tasks?page=0&size=1000`);
      const tasks = listResponse.data.data || [];
      const task = tasks.find((t: any) => t.id === parseInt(req.params.id));
      
      if (!task) {
        return res.status(404).render('not-found');
      }
      
      // Check if task has a delete link (HATEOAS)
      if (!task.links || !task.links.delete) {
        console.error('Task does not have a delete link:', task);
        return res.redirect(`/tasks?error=Cannot delete this task`);
      }
      
      const deleteUrl = `http://localhost:4000${task.links.delete}`;
      
      await axios.delete(deleteUrl);
      res.redirect('/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
      res.redirect(`/tasks?error=Failed to delete task`);
    }
  });
}