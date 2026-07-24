import { pool } from "../db/pool";

type TemplateInput = {
  nameUk: string;
  generationId?: string;
  configurationId: string;
  notesUk?: string | null;
};

type TemplateItemInput = {
  templateId: string;
  procedureId: string;
  intervalKm?: number | null;
  intervalMonths?: number | null;
  notesUk?: string | null;
};

type ProcedureInput = {
  code: string;
  titleUk: string;
  descriptionUk?: string | null;
  defaultIntervalKm?: number | null;
  defaultIntervalMonths?: number | null;
  category: string;
};

export async function createProcedure(input: ProcedureInput) {
  const result = await pool.query(
    `
      insert into maintenance_procedures (
        code,
        title_uk,
        description_uk,
        default_interval_km,
        default_interval_months,
        category
      )
      values ($1, $2, $3, $4, $5, $6)
      on conflict (code)
      do update set
        title_uk = excluded.title_uk,
        description_uk = excluded.description_uk,
        default_interval_km = excluded.default_interval_km,
        default_interval_months = excluded.default_interval_months,
        category = excluded.category,
        deleted = false,
        deleted_at = null,
        updated_at = now()
      returning *
    `,
    [
      input.code,
      input.titleUk,
      input.descriptionUk ?? null,
      input.defaultIntervalKm ?? null,
      input.defaultIntervalMonths ?? null,
      input.category
    ]
  );

  return result.rows[0];
}

export async function updateProcedure(procedureId: string, input: ProcedureInput) {
  const result = await pool.query(
    `
      update maintenance_procedures
      set code = $2,
          title_uk = $3,
          description_uk = $4,
          default_interval_km = $5,
          default_interval_months = $6,
          category = $7,
          updated_at = now()
        where id = $1 and deleted = false
      returning *
    `,
    [
      procedureId,
      input.code,
      input.titleUk,
      input.descriptionUk ?? null,
      input.defaultIntervalKm ?? null,
      input.defaultIntervalMonths ?? null,
      input.category
    ]
  );

  return result.rows[0] ?? null;
}

export async function deleteProcedure(procedureId: string) {
  const client = await pool.connect();

  try {
    await client.query("begin");

    const result = await client.query(
      `
        update maintenance_procedures
        set deleted = true,
            deleted_at = now(),
            updated_at = now()
        where id = $1 and deleted = false
        returning *
      `,
      [procedureId]
    );

    await client.query(
      `
        update maintenance_schedule_items
        set deleted = true,
            deleted_at = now(),
            updated_at = now()
        where procedure_id = $1 and deleted = false
      `,
      [procedureId]
    );

    await client.query("commit");
    return result.rows[0] ?? null;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function createScheduleTemplate(input: TemplateInput) {
  const result = await pool.query(
    `
      insert into maintenance_schedule_templates (
        name_uk,
        generation_id,
        configuration_id,
        notes_uk
      )
      values ($1, $2, $3, $4)
      returning *
    `,
    [
      input.nameUk,
      input.generationId,
      input.configurationId,
      input.notesUk ?? null
    ]
  );

  return result.rows[0];
}

export async function updateScheduleTemplate(templateId: string, input: TemplateInput) {
  const result = await pool.query(
    `
      update maintenance_schedule_templates
      set name_uk = $2,
          generation_id = $3,
          configuration_id = $4,
          notes_uk = $5,
          updated_at = now()
      where id = $1 and deleted = false
      returning *
    `,
    [
      templateId,
      input.nameUk,
      input.generationId,
      input.configurationId,
      input.notesUk ?? null
    ]
  );

  return result.rows[0] ?? null;
}

export async function deleteScheduleTemplate(templateId: string) {
  const client = await pool.connect();

  try {
    await client.query("begin");

    const result = await client.query(
      `
        update maintenance_schedule_templates
        set deleted = true,
            deleted_at = now(),
            updated_at = now()
        where id = $1 and deleted = false
        returning *
      `,
      [templateId]
    );

    await client.query(
      `
        update maintenance_schedule_items
        set deleted = true,
            deleted_at = now(),
            updated_at = now()
        where template_id = $1 and deleted = false
      `,
      [templateId]
    );

    await client.query("commit");
    return result.rows[0] ?? null;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function createScheduleTemplateItem(input: TemplateItemInput) {
  const result = await pool.query(
    `
      insert into maintenance_schedule_items (
        template_id,
        procedure_id,
        interval_km,
        interval_months,
        notes_uk
      )
      values ($1, $2, $3, $4, $5)
      on conflict (template_id, procedure_id)
      do update set
        interval_km = excluded.interval_km,
        interval_months = excluded.interval_months,
        notes_uk = excluded.notes_uk,
        deleted = false,
        deleted_at = null,
        updated_at = now()
      returning *
    `,
    [
      input.templateId,
      input.procedureId,
      input.intervalKm ?? null,
      input.intervalMonths ?? null,
      input.notesUk ?? null
    ]
  );

  return result.rows[0];
}

export async function updateScheduleTemplateItem(scheduleItemId: string, input: TemplateItemInput) {
  const result = await pool.query(
    `
      update maintenance_schedule_items
      set template_id = $2,
          procedure_id = $3,
          interval_km = $4,
          interval_months = $5,
          notes_uk = $6,
          updated_at = now()
        where id = $1 and deleted = false
      returning *
    `,
    [
      scheduleItemId,
      input.templateId,
      input.procedureId,
      input.intervalKm ?? null,
      input.intervalMonths ?? null,
      input.notesUk ?? null
    ]
  );

  return result.rows[0] ?? null;
}

export async function deleteScheduleTemplateItem(scheduleItemId: string) {
  const result = await pool.query(
    `
      update maintenance_schedule_items
      set deleted = true,
          deleted_at = now(),
          updated_at = now()
      where id = $1 and deleted = false
      returning *
    `,
    [scheduleItemId]
  );

  return result.rows[0] ?? null;
}

export async function getAdminOverview() {
  const [statsResult, usersResult, requestsResult] = await Promise.all([
    pool.query<{
      users_count: string;
      blocked_users_count: string;
      deleted_users_count: string;
      vehicles_count: string;
      service_logs_count: string;
      reminders_count: string;
      templates_count: string;
      procedures_count: string;
      missing_plan_requests_count: string;
    }>(
      `
        select
          (select count(*)::text from users where deleted = false) as users_count,
          (select count(*)::text from users where deleted = false and is_blocked = true) as blocked_users_count,
          (select count(*)::text from users where deleted = true) as deleted_users_count,
          (select count(*)::text from vehicles) as vehicles_count,
          (select count(*)::text from service_logs) as service_logs_count,
          (select count(*)::text from reminders) as reminders_count,
          (select count(*)::text from maintenance_schedule_templates where deleted = false) as templates_count,
          (select count(*)::text from maintenance_procedures where deleted = false) as procedures_count,
          (select count(*)::text from maintenance_plan_requests where status = 'open') as missing_plan_requests_count
      `
    ),
    pool.query<{
      id: string;
      email: string;
      full_name: string;
      role: "user" | "admin";
      avatar_url: string | null;
      is_blocked: boolean;
      deleted: boolean;
      created_at: Date;
      vehicles_count: string;
    }>(
      `
        select
          users.id,
          users.email,
          users.full_name,
          users.role,
          users.avatar_url,
          users.is_blocked,
          users.deleted,
          users.created_at,
          count(vehicles.id)::text as vehicles_count
        from users
        left join vehicles on vehicles.user_id = users.id
        group by users.id
        order by users.created_at desc
        limit 12
      `
    ),
    pool.query<{
      id: string;
      status: "open" | "resolved";
      request_note: string | null;
      created_at: Date;
      user_id: string;
      user_full_name: string;
      user_email: string;
      vehicle_id: string;
      vehicle_name: string;
      vehicle_year: number;
      generation_name: string | null;
      configuration_label: string | null;
    }>(
      `
        select
          req.id,
          req.status,
          req.request_note,
          req.created_at,
          users.id as user_id,
          users.full_name as user_full_name,
          users.email as user_email,
          vehicles.id as vehicle_id,
          concat(vehicles.make, ' ', vehicles.model) as vehicle_name,
          vehicles.year as vehicle_year,
          vehicles.generation as generation_name,
          concat(vehicles.engine_name, ' / ', vehicles.transmission_name, coalesce(concat(' / ', vehicles.drivetrain_label), '')) as configuration_label
        from maintenance_plan_requests req
        inner join users on users.id = req.user_id
        inner join vehicles on vehicles.id = req.vehicle_id
        where req.status = 'open'
        order by req.created_at desc
        limit 12
      `
    )
  ]);

  return {
    stats: statsResult.rows[0],
    users: usersResult.rows,
    missingPlanRequests: requestsResult.rows
  };
}

export async function resolveMissingPlanRequest(requestId: string) {
  const result = await pool.query(
    `
      update maintenance_plan_requests
      set status = 'resolved',
          handled_at = now(),
          updated_at = now()
      where id = $1
        and status = 'open'
      returning *
    `,
    [requestId]
  );

  return result.rows[0] ?? null;
}
