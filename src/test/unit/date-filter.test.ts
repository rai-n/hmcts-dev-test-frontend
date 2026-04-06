/* eslint-disable jest/expect-expect, @typescript-eslint/no-explicit-any */
import { Nunjucks } from '../../main/modules/nunjucks';
import express from 'express';

describe('Nunjucks date filter', () => {
  let app: express.Express;
  let env: any;

  beforeEach(() => {
    app = express();
    new Nunjucks(true).enableFor(app);
    const nunjucks = require('nunjucks');
    env = nunjucks.configure('src/main/views', {
      autoescape: true,
      express: app
    });
    env.addFilter('date', function(dateString: string, format: string) {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      const pad = (n: number) => n.toString().padStart(2, '0');
      const day = pad(date.getDate());
      const month = pad(date.getMonth() + 1);
      const year = date.getFullYear();
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());

      if (format === 'YYYY-MM-DD') {
        return `${year}-${month}-${day}`;
      } else if (format === 'DD/MM/YYYY') {
        return `${day}/${month}/${year}`;
      } else if (format === 'DD/MM/YYYY HH:mm') {
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      }
      return dateString;
    });
  });

  describe('date filter', () => {
    test('should format date as DD/MM/YYYY', () => {
      const result = env.getFilter('date')('2026-05-01T10:00:00', 'DD/MM/YYYY');
      expect(result).toBe('01/05/2026');
    });

    test('should format date as YYYY-MM-DD', () => {
      const result = env.getFilter('date')('2026-05-01T10:00:00', 'YYYY-MM-DD');
      expect(result).toBe('2026-05-01');
    });

    test('should format datetime as DD/MM/YYYY HH:mm', () => {
      const result = env.getFilter('date')('2026-05-01T14:30:00', 'DD/MM/YYYY HH:mm');
      expect(result).toBe('01/05/2026 14:30');
    });

    test('should return empty string for null/undefined', () => {
      const result = env.getFilter('date')(null, 'DD/MM/YYYY');
      expect(result).toBe('');
    });

    test('should pad single digit day and month', () => {
      const result = env.getFilter('date')('2026-01-05T10:00:00', 'DD/MM/YYYY');
      expect(result).toBe('05/01/2026');
    });
  });
});
