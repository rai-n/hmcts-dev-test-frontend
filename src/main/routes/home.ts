import { Application } from 'express';
import axios from 'axios';

export default function (app: Application): void {
  app.get('/', async (req, res) => {
    try {
      const response = await axios.get('http://localhost:4000/v1/tasks?page=0&size=10');
      res.render('home', {
        tasks: response.data.data,
        pageDetails: response.data.pageDetails,
        links: response.data.links
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.render('home', { error: 'Failed to load tasks' });
    }
  });
}
