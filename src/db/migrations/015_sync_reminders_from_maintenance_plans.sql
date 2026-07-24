delete from reminders reminder
using reminders duplicate
where reminder.id < duplicate.id
  and reminder.user_id = duplicate.user_id
  and reminder.vehicle_id = duplicate.vehicle_id
  and reminder.procedure_id = duplicate.procedure_id;

create unique index if not exists idx_reminders_user_vehicle_procedure
  on reminders(user_id, vehicle_id, procedure_id);