import { TimeExpenseEntry, User, TimeExpenseFilters, DateRange } from '../types';

class TimeExpenseService {
  private baseUrl = '/api/time-expenses';

  async getUsers(): Promise<User[]> {
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`${this.baseUrl}/users`);
      // return response.json();
      
      // Mock implementation
      return [
        {
          id: '1',
          name: 'Jean Dupont',
          email: 'jean.dupont@company.com',
          role: 'Senior Technician',
          hourlyRate: 45
        },
        {
          id: '2',
          name: 'Marie Tremblay', 
          email: 'marie.tremblay@company.com',
          role: 'Lead Technician',
          hourlyRate: 50
        },
        {
          id: '3',
          name: 'Pierre Leblanc',
          email: 'pierre.leblanc@company.com', 
          role: 'Technician',
          hourlyRate: 35
        }
      ];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  async getTimeExpenseEntries(filters: TimeExpenseFilters): Promise<TimeExpenseEntry[]> {
    try {
      // In a real app, this would be an API call with query parameters
      // const queryParams = new URLSearchParams({
      //   from: filters.dateRange.from.toISOString(),
      //   to: filters.dateRange.to.toISOString(),
      //   users: filters.users.join(','),
      //   types: filters.types.join(','),
      //   status: filters.status.join(',')
      // });
      // const response = await fetch(`${this.baseUrl}/entries?${queryParams}`);
      // return response.json();

      // Mock implementation
      return this.generateMockEntries(filters);
    } catch (error) {
      console.error('Error fetching time expense entries:', error);
      throw new Error('Failed to fetch time expense entries');
    }
  }

  async createTimeExpenseEntry(entry: Omit<TimeExpenseEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimeExpenseEntry> {
    try {
      // In a real app, this would be a POST request
      // const response = await fetch(`${this.baseUrl}/entries`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });
      // return response.json();

      // Mock implementation
      const now = new Date();
      return {
        ...entry,
        id: `entry-${Date.now()}`,
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      console.error('Error creating time expense entry:', error);
      throw new Error('Failed to create time expense entry');
    }
  }

  async updateTimeExpenseEntry(id: string, updates: Partial<TimeExpenseEntry>): Promise<TimeExpenseEntry> {
    try {
      // In a real app, this would be a PUT request
      // const response = await fetch(`${this.baseUrl}/entries/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updates)
      // });
      // return response.json();

      // Mock implementation
      return {
        ...updates,
        id,
        updatedAt: new Date()
      } as TimeExpenseEntry;
    } catch (error) {
      console.error('Error updating time expense entry:', error);
      throw new Error('Failed to update time expense entry');
    }
  }

  async deleteTimeExpenseEntry(id: string): Promise<void> {
    try {
      // In a real app, this would be a DELETE request
      // await fetch(`${this.baseUrl}/entries/${id}`, { method: 'DELETE' });

      // Mock implementation
      console.log(`Deleted entry ${id}`);
    } catch (error) {
      console.error('Error deleting time expense entry:', error);
      throw new Error('Failed to delete time expense entry');
    }
  }

  async exportTimeExpenseData(filters: TimeExpenseFilters, format: 'csv' | 'pdf' | 'excel'): Promise<Blob> {
    try {
      // In a real app, this would be an API call to generate the export
      // const queryParams = new URLSearchParams({
      //   from: filters.dateRange.from.toISOString(),
      //   to: filters.dateRange.to.toISOString(),
      //   users: filters.users.join(','),
      //   types: filters.types.join(','),
      //   status: filters.status.join(','),
      //   format
      // });
      // const response = await fetch(`${this.baseUrl}/export?${queryParams}`);
      // return response.blob();

      // Mock implementation
      const mockData = `Time & Expense Report - ${format.toUpperCase()}\nGenerated on: ${new Date().toLocaleString()}\n\n`;
      return new Blob([mockData], { 
        type: format === 'csv' ? 'text/csv' : 'application/octet-stream' 
      });
    } catch (error) {
      console.error('Error exporting time expense data:', error);
      throw new Error('Failed to export time expense data');
    }
  }

  private generateMockEntries(filters: TimeExpenseFilters): TimeExpenseEntry[] {
    // Mock data generation logic would go here
    // This is a simplified version for demonstration
    const mockEntries: TimeExpenseEntry[] = [];
    
    const users = [
      { id: '1', name: 'Jean Dupont', hourlyRate: 45 },
      { id: '2', name: 'Marie Tremblay', hourlyRate: 50 },
      { id: '3', name: 'Pierre Leblanc', hourlyRate: 35 }
    ];

    for (let i = 0; i < 10; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const date = new Date(filters.dateRange.from.getTime() + Math.random() * (filters.dateRange.to.getTime() - filters.dateRange.from.getTime()));
      
      mockEntries.push({
        id: `mock-${i}`,
        userId: user.id,
        userName: user.name,
        date,
        timeBooked: Math.floor(Math.random() * 480) + 60,
        expenses: Math.floor(Math.random() * 500) + 50,
        hourlyRate: user.hourlyRate,
        description: `Mock entry ${i + 1}`,
        type: ['time', 'expense', 'both'][Math.floor(Math.random() * 3)] as any,
        status: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)] as any,
        createdAt: date,
        updatedAt: date
      });
    }

    return mockEntries;
  }
}

export const timeExpenseService = new TimeExpenseService();