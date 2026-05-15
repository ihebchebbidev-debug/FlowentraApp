/**
 * Test Module Index
 * Exports all test definitions from individual modules
 * 
 * To add a new API module:
 * 1. Create a new file in tests/ folder (e.g., newModuleTests.ts)
 * 2. Export your tests array from that file
 * 3. Import and add to the allTests array below
 */

import { TestDefinition } from '../types/testTypes';

// Core tests
import { setupTests, systemHealthTests, authTests } from './setupTests';

// Entity tests
import { usersTests } from './usersTests';
import { rolesTests } from './rolesTests';
import { skillsTests } from './skillsTests';
import { contactsTests, contactTagsTests, contactNotesTests } from './contactsTests';
import { articlesTests } from './articlesTests';
import { lookupsTests } from './lookupsTests';
import { preferencesTests } from './preferencesTests';
import { projectsTests } from './projectsTests';
import { tasksTests } from './tasksTests';
import { taskCommentsTests } from './taskCommentsTests';
import { installationsTests } from './installationsTests';
import { uploadTests } from './uploadTests';

// Workflow tests (Offers → Sales → ServiceOrders → Dispatches)
import { offersTests } from './offersTests';
import { salesTests } from './salesTests';
import { serviceOrdersTests } from './serviceOrdersTests';
import { dispatchesTests } from './dispatchesTests';
import { serviceOrderFullInfoTests } from './serviceOrderFullInfoTests';

// Combine all tests in execution order
export const allTests: TestDefinition[] = [
  // Setup must run first
  ...setupTests,
  ...systemHealthTests,
  ...authTests,
  
  // Core entity tests
  ...usersTests,
  ...rolesTests,
  ...skillsTests,
  
  // Contacts and related
  ...contactsTests,
  ...contactTagsTests,
  ...contactNotesTests,
  
  // Articles/Inventory
  ...articlesTests,
  
  // Lookups (comprehensive CRUD for all lookup types)
  ...lookupsTests,
  
  // User preferences
  ...preferencesTests,
  
  // Projects and tasks
  ...projectsTests,
  ...tasksTests,
  ...taskCommentsTests,
  
  // Installations
  ...installationsTests,
  
  // Workflow: Offers → Sales → ServiceOrders → Dispatches
  ...offersTests,
  ...salesTests,
  ...serviceOrdersTests,
  ...dispatchesTests,
  
  // Service Order Full Information (aggregation tests)
  ...serviceOrderFullInfoTests,
  
  // Uploads (UploadThing integration) - Run last as they require user interaction
  ...uploadTests,
];

// Export individual test modules for selective testing
export {
  setupTests,
  systemHealthTests,
  authTests,
  usersTests,
  rolesTests,
  skillsTests,
  contactsTests,
  contactTagsTests,
  contactNotesTests,
  articlesTests,
  lookupsTests,
  preferencesTests,
  projectsTests,
  tasksTests,
  taskCommentsTests,
  installationsTests,
  uploadTests,
  offersTests,
  salesTests,
  serviceOrdersTests,
  dispatchesTests,
  serviceOrderFullInfoTests,
};

// Get tests by category
export const getTestsByCategory = (category: string): TestDefinition[] => {
  return allTests.filter(t => t.category === category);
};

// Get all unique categories
export const getTestCategories = (): string[] => {
  return [...new Set(allTests.map(t => t.category))];
};
