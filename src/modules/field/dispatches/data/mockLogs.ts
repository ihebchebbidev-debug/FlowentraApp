export const mockLogs = [
  {
    id: 'log_1',
    type: 'attachment',
    action: 'added',
    actor: 'Mike Rodriguez',
    when: '2024-01-20T18:00:00Z',
    details: 'photo_1234.png'
  },
  {
    id: 'log_2',
    type: 'note',
    action: 'added',
    actor: 'Sara Lee',
    when: '2024-01-20T18:10:00Z',
    details: 'Left a note about required parts.'
  },
  {
    id: 'log_3',
    type: 'expense',
    action: 'added',
    actor: 'Mike Rodriguez',
    when: '2024-01-20T18:20:00Z',
    details: '45.80 USD — Engine parts and consumables'
  },
  {
    id: 'log_4',
    type: 'technician',
    action: 'assigned',
    actor: 'System',
    when: '2024-01-20T18:30:00Z',
    details: 'Assigned technician: John Doe'
  },
  {
    id: 'log_5',
    type: 'attachment',
    action: 'removed',
    actor: 'Sara Lee',
    when: '2024-01-21T08:12:00Z',
    details: 'photo_1234.png'
  }
];
