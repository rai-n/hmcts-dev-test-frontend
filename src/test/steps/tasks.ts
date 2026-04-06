/// <reference types='../functional/steps.d.ts' />
import { config as testConfig } from '../config';

const { I } = inject();

Given('I am on the tasks page', () => {
  const url = new URL('/tasks', testConfig.TEST_URL);
  url.searchParams.set('lng', 'en');
  I.amOnPage(url.toString());
});

Given('I am on the create task page', () => {
  const url = new URL('/tasks/new', testConfig.TEST_URL);
  url.searchParams.set('lng', 'en');
  I.amOnPage(url.toString());
});

When('I click on {string} link', (text: string) => {
  I.click(text);
});

When('I fill in the task form with:', (table: any) => {
  const fields = table.rowsHash();
  if (fields.Title) {
    I.fillField('title', fields.Title);
  }
  if (fields.Description) {
    I.fillField('description', fields.Description);
  }
  if (fields['Due Date']) {
    I.fillField('dueDate', fields['Due Date']);
  }
  if (fields.Status) {
    I.selectOption('status', fields.Status);
  }
});

When('I submit the form', () => {
  I.click('Save task');
});

When('I select {string} from the status dropdown', (status: string) => {
  I.selectOption('status', status);
});

Then('I should see the tasks list', () => {
  I.see('Case Worker Dashboard');
  I.see('Active tasks');
});

Then('I should see the create task form', () => {
  I.see('Create a new task');
  I.see('Title');
  I.see('Description');
  I.see('Due Date');
});

Then('I should see the edit task form', () => {
  I.see('Edit task');
  I.see('Status');
});

Then('I should see {string} in the task list', (text: string) => {
  I.see(text);
});

Then('I should see an error message {string}', (message: string) => {
  I.see(message);
});

Then('I should be redirected to the tasks page', () => {
  I.waitInUrl('/tasks');
});

Then('the task should have status {string}', (status: string) => {
  I.see(status);
});
