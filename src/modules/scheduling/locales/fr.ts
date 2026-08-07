export default {
  // Page titles
  manage_scheduler: 'Gérer le planificateur',
  manage_scheduler_description: 'Gérer les horaires, les congés et la capacité des techniciens',
  edit_schedule_for: 'Modifier le planning de {{name}}',
  edit_schedule_description: 'Modifier les heures de travail, les congés et le statut du technicien',
  technician_not_found: 'Technicien non trouvé',
  
  // Technicians list
  technicians_list: 'Techniciens',
  search_placeholder: 'Rechercher techniciens...',
  
  // Status
  status: 'Statut',
  status_available: 'Disponible',
  status_busy: 'Occupé',
  status_offline: 'Hors ligne',
  status_on_leave: 'En congé',
  status_not_working: 'Ne travaille pas',
  status_over_capacity: 'Surchargé',
  
  // Working hours
  working_hours: 'Heures de travail',
  working_time: 'Temps de travail',
  working_hours_start: 'Début',
  working_hours_end: 'Fin',
  lunch_break: 'Pause déjeuner',
  full_day_off: 'Jour de congé complet',
  
  // Days
  day_mon: 'Lundi',
  day_tue: 'Mardi',
  day_wed: 'Mercredi',
  day_thu: 'Jeudi',
  day_fri: 'Vendredi',
  day_sat: 'Samedi',
  day_sun: 'Dimanche',
  
  // Recurrence
  recurrence: 'Récurrence',
  everyday: 'Tous les jours',
  weekdays: 'Jours ouvrables',
  custom: 'Personnalisé',
  
  // Schedule notes
  schedule_note: 'Note de planning',
  schedule_note_help: 'Utilisez ceci pour marquer les jours spéciaux, congés ou exceptions',
  edit_schedule: 'Modifier',
  
  // Leaves section
  leaves: 'Congés',
  leaves_description: 'Gérer les vacances, congés maladie et absences',
  add_new_leave: 'Ajouter un congé',
  add_leave: 'Ajouter un congé',
  scheduled_leaves: 'Congés planifiés',
  no_leaves: 'Aucun congé planifié',
  no_leaves_hint: 'Utilisez le formulaire ci-dessus pour ajouter une absence',
  leaves_count: 'congé(s)',
  cancel_leave: 'Annuler le congé',
  cancel_leave_title: 'Annuler le congé ?',
  cancel_leave_description: 'Êtes-vous sûr de vouloir annuler ce congé ? Cette action est irréversible.',
  yes_cancel_leave: 'Oui, annuler le congé',
  manage_types: 'Gérer les types',
  
  // Leave form
  leave_select_range: 'Sélectionner une plage de dates',
  select_dates: 'Sélectionner les dates',
  pick_date_summary: 'Cliquez pour choisir une plage de dates',
  leave_type: 'Type de congé',
  select_type: 'Sélectionner le type',
  leave_reason: 'Raison (Facultatif)',
  enter_reason: 'Saisir la raison...',
  leave_start: 'Début',
  leave_end: 'Fin',
  add: 'Ajouter',
  days: 'jours',
  
  // Leave types
  leave_type_vacation: 'Vacances',
  leave_type_travel: 'Déplacement',
  leave_type_sick: 'Congé maladie',
  leave_type_family: 'Problème familial',
  leave_type_bereavement: 'Décès',
  paid: 'Payé',
  unpaid: 'Non payé',
  
  // Leave messages
  leave_added: 'Congé ajouté',
  leave_deleted: 'Congé annulé avec succès',
  leave_error_missing: 'Veuillez sélectionner une date de début et de fin',
  leave_error_invalid: 'La date de fin doit être après la date de début',
  leave_overlap_error: 'Ceci chevauche un congé existant : "{{type}}" ({{start}} → {{end}}). Veuillez choisir des dates différentes ou supprimer le congé existant.',
  leave_create_error: 'Échec de la création du congé. Veuillez réessayer.',
  leave_delete_error: 'Échec de l\'annulation du congé',
  
  // API messages
  load_error: 'Échec du chargement du planning. Utilisation des valeurs par défaut.',
  save_error: 'Échec de l\'enregistrement du planning',
  schedule_saved: 'Planning enregistré avec succès',
  
  // Calendar availability
  unavailable: 'Indisponible',
  day_off: 'Jour de repos',
  outside_working_hours: 'En dehors des heures de travail',
  not_plannable: 'Non planifiable'
};
