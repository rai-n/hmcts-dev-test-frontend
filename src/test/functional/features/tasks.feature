Feature: Tasks Management

  Scenario: View tasks list
    When I go to '/tasks'
    Then the page should include 'Case Worker Dashboard'
    Then the page should include 'Create a new task'

  Scenario: Navigate to create task page
    When I go to '/tasks/new'
    Then the page should include 'Create new task'
    Then the page should include 'Title'
    Then the page should include 'Description'
    Then the page should include 'Due Date'

  Scenario: Create task form has required fields
    When I go to '/tasks/new'
    Then the page should include 'Save task'

  Scenario: Edit task page shows not found for non-existent task
    When I go to '/tasks/99999/edit'
    Then the page should include 'Page Not Found'

  Scenario: Task list has pagination when many tasks
    When I go to '/tasks?page=0&size=10'
    Then the page should include 'Case Worker Dashboard'
