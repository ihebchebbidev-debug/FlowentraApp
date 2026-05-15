/**
 * Skills API Tests
 * CRUD operations for skill management
 */

import { TestDefinition } from '../types/testTypes';
import { apiCall, testDataIds, randomId } from '../utils/testUtils';

export const skillsTests: TestDefinition[] = [
  {
    id: 'skills-create-1',
    name: 'Create Skill #1 (Electrical)',
    category: 'Skills',
    description: 'Create Electrical skill',
    dependsOn: ['setup-cleanup-old-data'],
    test: async () => {
      const id = randomId();
      const skillName = `Electrical_${id}`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Skills', {
        method: 'POST',
        body: JSON.stringify({
          name: skillName,
          description: 'Electrical wiring, panel installation, and troubleshooting',
          category: 'Technical',
          isActive: true,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-skill-1'] = data.data?.id || data.id || data.skill?.id;
        return { success: true, details: `✓ Skill: "${skillName}" | Category: Technical (ID: ${testDataIds['test-skill-1']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'skills-create-2',
    name: 'Create Skill #2 (HVAC)',
    category: 'Skills',
    description: 'Create HVAC skill',
    dependsOn: ['skills-create-1'],
    test: async () => {
      const id = randomId();
      const skillName = `HVAC_${id}`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Skills', {
        method: 'POST',
        body: JSON.stringify({
          name: skillName,
          description: 'Heating, ventilation, and air conditioning systems',
          category: 'Technical',
          isActive: true,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-skill-2'] = data.data?.id || data.id || data.skill?.id;
        return { success: true, details: `✓ Skill: "${skillName}" | Category: Technical (ID: ${testDataIds['test-skill-2']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'skills-create-3',
    name: 'Create Skill #3 (Communication)',
    category: 'Skills',
    description: 'Create Communication skill',
    dependsOn: ['skills-create-2'],
    test: async () => {
      const id = randomId();
      const skillName = `Communication_${id}`;
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Skills', {
        method: 'POST',
        body: JSON.stringify({
          name: skillName,
          description: 'Customer communication and interpersonal skills',
          category: 'Soft Skills',
          isActive: true,
        }),
      });
      if ((status === 200 || status === 201) && data) {
        testDataIds['test-skill-3'] = data.data?.id || data.id || data.skill?.id;
        return { success: true, details: `✓ Skill: "${skillName}" | Category: Soft Skills (ID: ${testDataIds['test-skill-3']})`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'skills-list',
    name: 'List All Skills',
    category: 'Skills',
    description: 'Fetch all skills from the system',
    dependsOn: ['skills-create-3'],
    test: async () => {
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>('/api/Skills');
      if (status === 200 && data) {
        let skills: any[] = [];
        if (Array.isArray(data)) skills = data;
        else if (Array.isArray(data.skills)) skills = data.skills;
        else if (Array.isArray(data.data)) skills = data.data;
        else if (data.items) skills = data.items;
        
        const count = skills.length || data.totalCount || 0;
        const names = skills.length > 0 ? skills.slice(0, 3).map((s: any) => s.name).join(', ') : 'none';
        return { success: true, details: `✓ Found ${count} skills: [${names}${count > 3 ? '...' : ''}]`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'skills-get-by-id',
    name: 'Get Skill by ID',
    category: 'Skills',
    description: 'Retrieve a specific skill',
    dependsOn: ['skills-list'],
    test: async () => {
      if (!testDataIds['test-skill-1']) {
        return { success: false, error: 'No test skill ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Skills/${testDataIds['test-skill-1']}`);
      if (status === 200 && data) {
        const skill = data.data || data;
        const skillName = skill.name || 'Unknown';
        const skillCategory = skill.category || 'N/A';
        return { success: true, details: `✓ Retrieved: "${skillName}" | Category: ${skillCategory}`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'skills-update',
    name: 'Update Skill',
    category: 'Skills',
    description: 'Update the first test skill',
    dependsOn: ['skills-get-by-id'],
    test: async () => {
      if (!testDataIds['test-skill-1']) {
        return { success: false, error: 'No test skill ID available' };
      }
      const newName = `AdvancedElectrical_${Date.now()}`;
      const { status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Skills/${testDataIds['test-skill-1']}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: newName,
          description: 'Updated: Advanced electrical certifications and high-voltage work',
          category: 'Technical - Advanced',
        }),
      });
      if (status === 200) {
        return { success: true, details: `✓ Updated skill to: "${newName}"`, httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'skills-delete',
    name: 'Delete One Skill',
    category: 'Skills',
    description: 'Delete skill #1 (keep others)',
    dependsOn: ['skills-update'],
    test: async () => {
      if (!testDataIds['test-skill-1']) {
        return { success: false, error: 'No test skill to delete' };
      }
      const { status, error, requestData, responseData } = await apiCall<any>(`/api/Skills/${testDataIds['test-skill-1']}`, {
        method: 'DELETE',
      });
      if (status === 200 || status === 204) {
        const deletedId = testDataIds['test-skill-1'];
        delete testDataIds['test-skill-1'];
        return { success: true, details: `✓ Deleted skill ID: ${deletedId} (kept skills #2, #3)`, httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'skills-cleanup',
    name: 'Cleanup Remaining Skills',
    category: 'Skills',
    description: 'Delete remaining test skills',
    dependsOn: ['skills-delete'],
    test: async () => {
      let cleaned = 0;
      let lastRequestData: any, lastResponseData: any;
      for (const key of ['test-skill-2', 'test-skill-3']) {
        if (testDataIds[key]) {
          const { status, requestData, responseData } = await apiCall<any>(`/api/Skills/${testDataIds[key]}`, { method: 'DELETE' });
          lastRequestData = requestData;
          lastResponseData = responseData;
          if (status === 200 || status === 204) cleaned++;
          delete testDataIds[key];
        }
      }
      return { success: true, details: `✓ Cleaned up ${cleaned} remaining skills`, httpStatus: 200, requestData: lastRequestData, responseData: lastResponseData };
    },
  },
];
