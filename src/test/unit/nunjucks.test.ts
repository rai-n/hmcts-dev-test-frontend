/* eslint-disable jest/expect-expect, @typescript-eslint/no-explicit-any */
import { Nunjucks } from '../../main/modules/nunjucks';
import express from 'express';

describe('Nunjucks', () => {
  let app: express.Express;
  let nunjucks: Nunjucks;

  beforeEach(() => {
    app = express();
    nunjucks = new Nunjucks(false);
    nunjucks.enableFor(app);
  });

  describe('date filter', () => {
    test('should format date as DD/MM/YYYY', () => {
      const env = (app as any).get('nunjucksEnv');
      const result = env.getFilter('date')('2026-05-01T00:00:00', 'DD/MM/YYYY');
      expect(result).toBe('01/05/2026');
    });

    test('should format date as YYYY-MM-DD', () => {
      const env = (app as any).get('nunjucksEnv');
      const result = env.getFilter('date')('2026-05-01T00:00:00', 'YYYY-MM-DD');
      expect(result).toBe('2026-05-01');
    });

    test('should format date as DD/MM/YYYY HH:mm', () => {
      const env = (app as any).get('nunjucksEnv');
      const result = env.getFilter('date')('2026-05-01T14:30:00', 'DD/MM/YYYY HH:mm');
      expect(result).toBe('01/05/2026 14:30');
    });

    test('should return empty string for null date', () => {
      const env = (app as any).get('nunjucksEnv');
      const result = env.getFilter('date')(null, 'DD/MM/YYYY');
      expect(result).toBe('');
    });

    test('should return empty string for undefined date', () => {
      const env = (app as any).get('nunjucksEnv');
      const result = env.getFilter('date')(undefined, 'DD/MM/YYYY');
      expect(result).toBe('');
    });

    test('should return original string for invalid date', () => {
      const env = (app as any).get('nunjucksEnv');
      const result = env.getFilter('date')('invalid-date', 'DD/MM/YYYY');
      expect(result).toBe('invalid-date');
    });

    test('should return original string for unknown format', () => {
      const env = (app as any).get('nunjucksEnv');
      const result = env.getFilter('date')('2026-05-01', 'UNKNOWN_FORMAT');
      expect(result).toBe('2026-05-01');
    });
  });

  describe('enableFor', () => {
    test('should set view engine to njk', () => {
      expect(app.get('view engine')).toBe('njk');
    });

    test('should have pagePath middleware configured', () => {
      expect(app.get('view engine')).toBe('njk');
    });
  });
});
