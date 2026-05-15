export const fr = {
  dispatcher: {
    title: "Répartiteur",
    description: "Gérer et assigner les tâches aux techniciens",
    dispatch_jobs: "Répartir les Tâches",
    dispatching_interface: "Interface de Répartition",
    back_to_list: "Retour à la Liste",
    drag_drop_jobs: "Glissez et déposez les tâches pour les assigner aux techniciens",
    dispatch_placeholder: "Calendrier interactif et carte, glisser-déposer des affectations, disponibilité des techniciens",
    open_service_orders: "Ordres de Service",
    
    // Navigation
    today: "Aujourd'hui",
    day_view: "Vue Jour",
    week_view: "Vue Semaine",
    manage_planning: "Gérer la Planification",
    day_short: "j",
    overview_mode: "Mode Aperçu",
    overview_select_time: "Choisir l'Heure",
    overview_hour: "Heure",
    overview_minute: "Minute",
    overview_calendar_hint: "Sélectionnez plus de 7 jours pour le mode aperçu",
    
    // Status
    status: "Statut",
    status_available: "Disponible",
    status_busy: "Occupé",
    status_offline: "Hors ligne",
    status_on_leave: "En congé",
    status_unassigned: "Non assigné",
    status_assigned: "Assigné",
    status_in_progress: "En cours",
    status_completed: "Terminé",
    status_cancelled: "Annulé",
    status_pending: "En attente",
    status_scheduled: "Programmé",
    status_not_working: "Ne Travaille Pas",
    status_over_capacity: "Surchargé",
    
    // Priority
    priority: "Priorité",
    priority_low: "Faible",
    priority_medium: "Moyenne",
    priority_high: "Élevée",
    priority_urgent: "Urgente",
    dispatch_priority: "Priorité de l'Intervention",
    
    // Tables
    job: "Tâche",
    customer: "Client",
    location: "Localisation",
    duration: "Durée",
    total_duration: "Durée Totale",
    required_skills: "Compétences Requises",
    skills: "Compétences",
    service_order: "Ordre de Service",
    jobs: "tâches",
    
    // Lists
    technicians: "Techniciens",
    unassigned_jobs: "Tâches Non Assignées",
    unassigned_work: "Travail Non Assigné",
    individual_jobs: "Tâches Individuelles",
    service_orders: "Ordres de Service",
    
    // Search and filters
    search_placeholder: "Rechercher tâches, clients ou localisations...",
    filter: "Filtrer",
    filters: "Filtres",
    all_statuses: "Tous les Statuts",
    all_priorities: "Toutes les Priorités",
    filter_by_status: "Filtrer par Statut",
    
    // Empty states
    no_unassigned_jobs: "Aucune tâche non assignée",
    no_unassigned_jobs_description: "Toutes les tâches sont actuellement assignées aux techniciens",
    no_service_orders: "Aucun ordre de service",
    no_service_orders_description: "Aucun ordre de service en attente d'assignation",
    
    // Actions
    assign: "Assigner",
    unassign: "Désassigner",
    reschedule: "Reprogrammer",
    view_details: "Voir Détails",
    clear: "Effacer",
    confirm: "Confirmer",
    creating: "Création...",
    
    // Filters
    by_status: "Par Statut",
    by_priority: "Par Priorité",
    
    // View modes
    table_view: "Vue Tableau",
    list_view: "Vue Liste",
    view_mode: "Mode d'Affichage",
    
    // Mobile warning
    mobile_warning: "Mieux vaut ouvrir ceci sur ordinateur",
    
    // Stats and misc
    total: "Total",
    assigned: "Assigné",
    in_progress: "En cours",
    pending: "En attente",
    not_scheduled: "Non planifié",
    
    // Dispatches empty state
    no_dispatches: "Aucune intervention trouvée",
    no_dispatches_description: "Créez de nouvelles interventions depuis l'interface de planification",
    create_from_planner: "Créez de nouvelles interventions depuis l'interface de planification",
    
    // Dispatch modal
    dispatch_details: "Détails de l'Intervention",
    dispatch: "Intervention",
    view_dispatch: "Voir l'intervention",
    locked_dispatch: "Intervention Verrouillée",
    locked: "Verrouillé",
    service_order_info: "Ordre de Service",
    job_info: "Informations de la Tâche",
    schedule_info: "Planification",
    assignment_info: "Assignation",
    assigned_technician: "Technicien",
    dispatched_by: "Créé par",
    dispatched_at: "Créé le",
    scheduled_date: "Date",
    scheduled_time: "Heure",
    estimated_duration: "Durée",
    contact_info: "Informations de Contact",
    phone: "Téléphone",
    email: "Email",
    company: "Entreprise",
    address: "Adresse",
    dispatch_confirmed_locked: "Cette intervention est confirmée et verrouillée",
    locked_by: "Verrouillé par",
    locked_dispatches_info: "Les interventions verrouillées ne peuvent pas être supprimées ou modifiées.",
    confirm_lock_info: "Confirmez et verrouillez pour éviter les modifications, ou supprimez pour réaffecter.",
    delete_dispatch: "Supprimer",
    confirm_lock: "Confirmer & Verrouiller",
    close: "Fermer",
    delete_dispatch_title: "Supprimer l'Intervention ?",
    delete_dispatch_description: "Cela supprimera l'intervention et rendra la tâche disponible pour réaffectation.",
    cancel: "Annuler",
    hours_short: "h",
    minutes_short: "m",
    not_specified: "Non spécifié",
    installation: "Installation",
    
    // Calendar Controls
    settings: "Paramètres",
    include_weekends: "Inclure les weekends",
    zoom_in: "Zoom avant",
    zoom_out: "Zoom arrière",
    
    // Assignment Confirmation
    confirm_assignment: "Confirmer l'Assignation",
    confirm_job_assignment: "Confirmer l'Assignation de Tâche",
    assignment_details: "Détails de l'Assignation",
    this_will_create_dispatch: "Cela créera une intervention et assignera la tâche au technicien sélectionné à l'heure spécifiée.",
    confirm_assignment_btn: "Confirmer l'Assignation",
    priority_standard: "Priorité standard",
    priority_normal: "Priorité normale",
    priority_important: "Important",
    priority_immediate: "Attention immédiate",
    
    // Reschedule
    confirm_reschedule: "Confirmer la Reprogrammation",
    schedule_change: "Changement de Planification",
    original: "Original",
    new: "Nouveau",
    assigned_to: "Assigné à",
    this_will_update_dispatch: "Cela mettra à jour le planning de l'intervention.",
    confirm_reschedule_btn: "Confirmer la Reprogrammation",
    rescheduling: "Reprogrammation...",
    
    // Batch Assignment
    batch_assignment_title: "Assignation Groupée de Tâches",
    jobs_to_assign: "Tâches à assigner",
    total_suffix: "total",
    assignment_details_title: "Détails de l'Assignation",
    technician_label: "Technicien",
    date_label: "Date",
    time_range: "Plage Horaire",
    location_label: "Localisation",
    this_will_create_dispatches: "Cela créera {count} interventions et assignera toutes les tâches séquentiellement.",
    confirm_batch_btn: "Assigner Toutes les Tâches",
    assigning: "Assignation...",
    
    // Technician Details
    technician_details: "Détails du Technicien",
    working_hours: "Heures de Travail",
    working_hours_today: "Horaires du jour",
    schedule_status: "Statut du Planning",
    on_leave: "En congé",
    leave_type: "Type de congé",
    available_until: "Disponible jusqu'à {{time}}",
    starts_at: "Commence à {{time}}",
    send_email: "Envoyer un Email",
    call: "Appeler",
    unknown: "Inconnu",
    no_email_account: "Aucun compte email connecté",
    no_email_account_desc: "Veuillez connecter un compte email dans Paramètres > Intégrations pour envoyer des emails.",
    email_sent_success: "Email envoyé avec succès !",
    email_sent_error: "Échec de l'envoi de l'email",
    
    // Planning mode
    planning_mode_job: "Tâches Individuelles",
    planning_mode_installation: "Par Installation",
    planning_mode_service_order: "Ordres de Service",
    
    // Contact info in modals
    contact: "Contact",
    
    // Calendar grid
    drop_here: "Déposez ici",
    day_off: "Jour de Repos",
    unavailable: "Indisponible",
    loading_installation: "Chargement installation...",
    not_working_today: "Ne travaille pas aujourd'hui",
    
    // Duration formatting
    hours_total: "h total",
    job_count: "{count} tâche",
    jobs_count: "{count} tâches",
    
    // Toast messages
    job_assigned_success: "Tâche assignée avec succès !",
    dispatch_rescheduled_success: "Intervention reprogrammée avec succès !",
    jobs_assigned_success: "{count} tâches assignées avec succès !",
    job_duration_updated: "Durée de la tâche mise à jour !",
    failed_to_assign_job: "Échec de l'assignation de la tâche",
    failed_to_reschedule: "Échec de la reprogrammation",
    failed_to_assign_jobs: "Échec de l'assignation des tâches",
    failed_to_resize_job: "Échec de la modification de durée",
    failed_to_process_drop: "Échec du traitement du dépôt",
    dispatch_confirmed_locked_success: "Intervention confirmée et verrouillée ! Elle ne peut plus être supprimée.",
    failed_to_confirm_job: "Échec de la confirmation de la tâche",
    dispatch_locked_error: "Cette intervention est verrouillée et ne peut pas être supprimée.",
    dispatch_unlocked_success: "Intervention déverrouillée avec succès ! Vous pouvez maintenant la modifier.",
    failed_to_unlock_job: "Échec du déverrouillage de l'intervention",
    unlock: "Déverrouiller",
    dispatch_deleted_success: "Intervention supprimée ! La tâche est maintenant disponible pour réaffectation.",
    failed_to_delete_dispatch: "Échec de la suppression de l'intervention",
    
    // Loading overlay
    preparing_dispatch_board: "Préparation du Tableau de Répartition",
    loading_resources: "Chargement des ressources pour des performances optimales",
    loading_technicians: "Chargement des techniciens",
    loading_calendar_data: "Chargement des données du calendrier",
    loading_service_orders: "Chargement des ordres de service",
    progress_complete: "{progress}% terminé",
    edit_schedule: "Modifier",
    edit_schedule_inline: "Modifier le Planning",
    editing_date: "Date",
    editing_time_start: "Heure de début",
    editing_time_end: "Heure de fin",
    save_schedule: "Enregistrer",
    cancel_edit: "Annuler",
    schedule_updated: "Planning mis à jour avec succès",
    schedule_update_failed: "Échec de la mise à jour du planning",
    
    // Duration tracking
    expected_duration: "Durée Prévue",
    planned_duration: "Durée Planifiée",
    duration_exceeds_expected: "La durée dépasse le temps prévu",
    duration_matches_expected: "La durée correspond au temps prévu",
    duration_within_expected: "La durée est dans le temps prévu",
    duration_slightly_over: "La durée dépasse légèrement le temps prévu",
    exceeds_by: "Dépasse de",
    original_from_article: "Originale de l'article",
    edit_duration: "Modifier la Durée",
    duration_updated: "Durée mise à jour avec succès",
    drag_to_resize: "Glisser pour redimensionner",
    
    // Dispatch statuses for badges
    statuses: {
      pending: "En attente",
      planned: "Planifié",
      confirmed: "Confirmé",
      rejected: "Rejeté",
      assigned: "Assigné",
      acknowledged: "Acquitté",
      en_route: "En route",
      on_site: "Sur site",
      in_progress: "En cours",
      technically_completed: "Techniquement Terminé",
      completed: "Terminé",
      cancelled: "Annulé",
      not_scheduled: "Non planifié",
      scheduled: "Planifié"
    },
    
    // Bulk actions
    selected_count: "{{count}} intervention(s) sélectionnée(s)",
    deselect_all: "Tout Désélectionner",
    bulk_delete: "Supprimer la Sélection",
    bulk_delete_confirm_title: "Supprimer {{count}} intervention(s) ?",
    bulk_delete_confirm_description: "Cela supprimera définitivement {{count}} intervention(s) et toutes les données associées. Les travaux associés seront réinitialisés au statut non planifié.",
    bulk_deleting: "Suppression...",
    confirm_delete: "Supprimer"
  }
};