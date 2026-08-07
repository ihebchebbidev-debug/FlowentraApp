export const en = {
  scheduling: {
    // Page titles
    manage_scheduler: 'Manage scheduler',
    manage_scheduler_description: 'Manage technician schedules, leaves and capacity',
    edit_schedule_for: 'Edit schedule for {{name}}',
    edit_schedule_description: 'Edit technician working hours, leaves and status',
    technician_not_found: 'Technician not found',
    
    // Technicians list
    technicians_list: 'Technicians',
    search_placeholder: 'Search technicians...',
    
    // Status
    status: 'Status',
    status_available: 'Available',
    status_busy: 'Busy',
    status_offline: 'Offline',
    status_on_leave: 'On Leave',
    status_not_working: 'Not Working',
    status_over_capacity: 'Over Capacity',
    
    // Real-time availability
    loading_availability: 'Loading availability...',
    today_status: 'Today\'s status',
    available_now: 'Available now',
    available_today: 'Available today',
    not_working_today: 'Not working today',
    not_working_now: 'Not working now',
    on_leave_today: 'On leave today',
    outside_hours: 'Outside working hours',
    current_leave: 'Current leave',
    until: 'until',
    no_schedule: 'No schedule configured',
    
    // Working hours
    working_hours: 'Working hours',
    working_time: 'Working time',
    working_hours_start: 'Start',
    working_hours_end: 'End',
    lunch_break: 'Lunch break',
    full_day_off: 'Full day off',
    
    // Days
    day_mon: 'Monday',
    day_tue: 'Tuesday',
    day_wed: 'Wednesday',
    day_thu: 'Thursday',
    day_fri: 'Friday',
    day_sat: 'Saturday',
    day_sun: 'Sunday',
    
    // Recurrence
    recurrence: 'Recurrence',
    everyday: 'Every day',
    weekdays: 'Weekdays',
    custom: 'Custom',
    
    // Schedule notes
    schedule_note: 'Schedule note',
    schedule_note_help: 'Use this to mark special days, leaves or exceptions',
    edit_schedule: 'Edit',
    
    // Leaves section
    leaves: 'Leaves',
    leaves_description: 'Manage vacation, sick leave, and time off',
    add_new_leave: 'Add New Leave',
    add_leave: 'Add Leave',
    full_day: 'Full Day',
    partial_day: 'Partial Day',
    scheduled_leaves: 'Scheduled Leaves',
    no_leaves: 'No leaves scheduled',
    no_leaves_hint: 'Use the form above to add time off',
    leaves_count: 'leave(s)',
    cancel_leave: 'Cancel Leave',
    cancel_leave_title: 'Cancel Leave?',
    cancel_leave_description: 'Are you sure you want to cancel this leave? This action cannot be undone.',
    yes_cancel_leave: 'Yes, Cancel Leave',
    manage_types: 'Manage Types',
    
    // Leave form
    leave_select_range: 'Select date range',
    select_dates: 'Select dates',
    pick_date_summary: 'Click to pick a date range',
    leave_type: 'Leave Type',
    select_type: 'Select type',
    leave_reason: 'Reason (Optional)',
    enter_reason: 'Enter reason...',
    leave_start: 'Start',
    leave_end: 'End',
    add: 'Add',
    days: 'days',
    
    // Leave types
    leave_type_vacation: 'Vacation',
    leave_type_travel: 'Travel',
    leave_type_sick: 'Sick leave',
    leave_type_family: 'Family problem',
    leave_type_bereavement: 'Bereavement',
    paid: 'Paid',
    unpaid: 'Unpaid',
    
    // Leave messages
    leave_added: 'Leave added',
    leave_deleted: 'Leave cancelled successfully',
    leave_error_missing: 'Please select a start and end date',
    leave_error_invalid: 'End date must be after start date',
    leave_overlap_error: 'This overlaps with existing leave: "{{type}}" ({{start}} → {{end}}). Please choose different dates or delete the existing leave first.',
    leave_create_error: 'Failed to create leave. Please try again.',
    leave_delete_error: 'Failed to cancel leave',
    
    // API messages
    load_error: 'Failed to load schedule. Using defaults.',
    save_error: 'Failed to save schedule',
    schedule_saved: 'Schedule saved successfully'
  }
};
