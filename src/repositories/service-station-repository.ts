import { pool } from "../db/pool";

export type ServiceStationRecord = {
  id: string;
  slug: string;
  name_uk: string;
  city_uk: string | null;
  address_uk: string | null;
  image_url: string | null;
  sort_order: number;
};

export async function listActiveServiceStations(): Promise<ServiceStationRecord[]> {
  const result = await pool.query<ServiceStationRecord>(
    `
      select id, slug, name_uk, city_uk, address_uk, image_url, sort_order
      from service_stations
      where is_active = true
      order by sort_order asc, name_uk asc
    `
  );

  return result.rows;
}

export async function findServiceStationById(stationId: string): Promise<ServiceStationRecord | null> {
  const result = await pool.query<ServiceStationRecord>(
    `
      select id, slug, name_uk, city_uk, address_uk, image_url, sort_order
      from service_stations
      where id = $1 and is_active = true
      limit 1
    `,
    [stationId]
  );

  return result.rows[0] ?? null;
}
