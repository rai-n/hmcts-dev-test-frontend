import * as path from 'path';

import * as express from 'express';
import * as nunjucks from 'nunjucks';

export class Nunjucks {
  constructor(public developmentMode: boolean) {
    this.developmentMode = developmentMode;
  }

  enableFor(app: express.Express): void {
    app.set('view engine', 'njk');
    const env = nunjucks.configure(path.join(__dirname, '..', '..', 'views'), {
      autoescape: true,
      watch: this.developmentMode,
      express: app,
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

    app.use((req, res, next) => {
      res.locals.pagePath = req.path;
      next();
    });
  }
}
