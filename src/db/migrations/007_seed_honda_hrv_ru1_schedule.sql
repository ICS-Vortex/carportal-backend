insert into maintenance_procedures (code, title_uk, description_uk, default_interval_km, default_interval_months, category)
values
  ('hrv-ru1-engine-oil-normal', 'Заміна моторної оливи', 'Звичайні умови експлуатації. За важких умов скоротити інтервал удвічі.', 15000, 12, 'Двигун'),
  ('hrv-ru1-engine-oil-severe', 'Заміна моторної оливи при важких умовах', 'Важкі умови експлуатації: короткі поїздки, пил, часті пуски, міський режим.', 7500, 6, 'Двигун'),
  ('hrv-ru1-oil-filter', 'Заміна фільтра оливи двигуна', 'Виконується разом із заміною моторної оливи.', 15000, 12, 'Двигун'),
  ('hrv-ru1-air-filter', 'Заміна фільтруючого елемента повітряного фільтра двигуна', 'Замінюється раніше за значного забруднення або важких умов експлуатації.', 30000, 24, 'Двигун'),
  ('hrv-ru1-cabin-filter', 'Перевірка або заміна елемента повітряного фільтра салону', 'Перевірка на кожному ТО, заміна за забрудненням.', 15000, 12, 'Комфорт'),
  ('hrv-ru1-valve-clearance', 'Перевірка зазорів клапанів', 'Перевірка за наявності шумів або нерівної роботи двигуна.', null, null, 'Двигун'),
  ('hrv-ru1-fuel-filter', 'Заміна паливного фільтра', 'Для важких умов експлуатації потрібна частіша заміна.', 90000, 72, 'Паливна система'),
  ('hrv-ru1-spark-plugs', 'Заміна свічок запалювання', 'Базовий інтервал згідно з регламентом виробника.', 120000, 96, 'Двигун'),
  ('hrv-ru1-drive-belt', 'Перевірка приводного ременя', 'Заміна за потреби при тріщинах, шумі або прослизанні.', 15000, 12, 'Двигун'),
  ('hrv-ru1-coolant', 'Заміна охолоджувальної рідини двигуна', 'Перша заміна після 200 000 км або 10 років, далі за станом системи.', 200000, 120, 'Охолодження'),
  ('hrv-ru1-cvt-fluid', 'Заміна трансмісійної рідини CVT', 'Для безступеневої трансмісії рекомендовано регулярне оновлення рідини.', 60000, 48, 'Трансмісія'),
  ('hrv-ru1-rear-diff-fluid', 'Заміна рідини заднього диференціала', 'Тільки для версій 4WD.', 30000, 24, 'Трансмісія'),
  ('hrv-ru1-brake-pad-disc-check', 'Перевірка передніх та задніх гальм', 'Оцінка зносу колодок, дисків, наявності підтікань і тріщин.', 15000, 12, 'Гальма'),
  ('hrv-ru1-brake-fluid', 'Заміна гальмівної рідини', 'Замінюється кожні 3 роки незалежно від пробігу.', null, 36, 'Гальма'),
  ('hrv-ru1-battery-check', 'Перевірка акумулятора', 'Стан, кріплення, клеми і пускова здатність.', 15000, 12, 'Електрика'),
  ('hrv-ru1-lighting-check', 'Перевірка освітлення та сигналізації', 'Перевіряються лампи, індикатори, склоочисники та омивачі.', 15000, 12, 'Електрика'),
  ('hrv-ru1-suspension-check', 'Візуальна перевірка підвіски і рульового керування', 'Перевірка люфтів, пильовиків, сайлентблоків та шарнірів.', 15000, 12, 'Ходова частина'),
  ('hrv-ru1-brake-hoses-check', 'Огляд гальмівних шлангів і трубопроводів', 'Включно з лініями ABS/VSA.', 15000, 12, 'Гальма'),
  ('hrv-ru1-fluid-leaks-check', 'Перевірка відсутності підтікань всіх експлуатаційних рідин', 'Охолодження, моторна олива, трансмісія, гальма, зчеплення, омивач.', 15000, 12, 'Інспекція'),
  ('hrv-ru1-exhaust-check', 'Огляд вихлопної системи', 'Перевірка теплозахисту, кріплень, корозії і прогару.', 15000, 12, 'Інспекція'),
  ('hrv-ru1-fuel-lines-check', 'Огляд паливопроводів та з’єднань', 'Контроль підтікань, потертостей і старіння.', 15000, 12, 'Паливна система'),
  ('hrv-ru1-wheel-nuts-check', 'Перевірка моменту затягування колісних гайок', 'Контрольний дотяг після обслуговування або сезонної заміни.', 15000, 12, 'Контрольні роботи'),
  ('hrv-ru1-road-test', 'Тест-драйв', 'Перевірка шумів, роботи вузлів і систем, реакції керма і гальм.', 15000, 12, 'Контрольні роботи'),
  ('hrv-ru1-wheel-alignment', 'Перевірка геометричних параметрів підвіски', 'Рекомендується за бажанням клієнта або при нерівномірному зносі шин.', null, null, 'Додаткові операції'),
  ('hrv-ru1-seals-lubrication', 'Змащування гумових ущільнень дверей, багажника, капота', 'Рекомендовано перед зимовим періодом експлуатації.', 30000, 24, 'Додаткові операції')
on conflict (code) do update set
  title_uk = excluded.title_uk,
  description_uk = excluded.description_uk,
  default_interval_km = excluded.default_interval_km,
  default_interval_months = excluded.default_interval_months,
  category = excluded.category,
  deleted = false,
  deleted_at = null,
  updated_at = now();

with existing_template as (
  select id
  from maintenance_schedule_templates
  where name_uk = 'Honda HR-V RU1 регламент з сервісної таблиці' and deleted = false
  limit 1
), target_generation as (
  select vg.id
  from vehicle_generations vg
  inner join vehicle_models vm on vm.id = vg.model_id
  inner join vehicle_brands vb on vb.id = vm.brand_id
  where vb.slug = 'honda'
    and vm.slug = 'hr-v'
    and vg.slug = 'ru1'
  limit 1
), inserted_template as (
  insert into maintenance_schedule_templates (
    name_uk,
    generation_id,
    notes_uk
  )
  select
    'Honda HR-V RU1 регламент з сервісної таблиці',
    (select id from target_generation),
    'Seed на основі наданого регламенту ТО Honda HR-V (RU1) зі скріншоту. Для окремих робіт у notes збережено винятки: важкі умови, 4WD, заміна за потреби та рекомендації по роках.'
  where not exists(select 1 from existing_template)
    and exists(select 1 from target_generation)
  returning id
), template_ref as (
  select id from inserted_template
  union all
  select id from existing_template
), schedule_seed(code, interval_km, interval_months, notes_uk) as (
  values
    ('hrv-ru1-engine-oil-normal', 15000, 12, 'Звичайні умови експлуатації. У важких умовах використовувати окремий короткий цикл 7 500 км / 6 міс.'),
    ('hrv-ru1-engine-oil-severe', 7500, 6, 'Важкі умови: пил, часті короткі поїздки, затори, буксирування, низькі температури.'),
    ('hrv-ru1-oil-filter', 15000, 12, 'Разом із заміною моторної оливи.'),
    ('hrv-ru1-air-filter', 30000, 24, 'Замінювати раніше за значного забруднення.'),
    ('hrv-ru1-cabin-filter', 15000, 12, 'Перевірка на кожному ТО, заміна за станом і забрудненням.'),
    ('hrv-ru1-valve-clearance', null, null, 'Перевірка / регулювання лише за необхідності.'),
    ('hrv-ru1-fuel-filter', 90000, 72, 'Базовий цикл. За важких умов перевіряти раніше.'),
    ('hrv-ru1-spark-plugs', 120000, 96, 'Заміна свічок запалювання згідно регламенту.'),
    ('hrv-ru1-drive-belt', 15000, 12, 'Огляд на кожному ТО, заміна за потреби.'),
    ('hrv-ru1-coolant', 200000, 120, 'Перша заміна після 200 000 км або 10 років експлуатації.'),
    ('hrv-ru1-cvt-fluid', 60000, 48, 'Для CVT. При важких умовах скоротити інтервал.'),
    ('hrv-ru1-rear-diff-fluid', 30000, 24, 'Тільки для автомобілів із системою 4WD.'),
    ('hrv-ru1-brake-pad-disc-check', 15000, 12, 'Огляд колодок, дисків, супортів і стоянкового гальма.'),
    ('hrv-ru1-brake-fluid', null, 36, 'Заміна кожні 3 роки незалежно від пробігу.'),
    ('hrv-ru1-battery-check', 15000, 12, 'Стан АКБ, клем та заряджання.'),
    ('hrv-ru1-lighting-check', 15000, 12, 'Світло, індикатори, склоочисники, омивачі.'),
    ('hrv-ru1-suspension-check', 15000, 12, 'Огляд елементів підвіски, рульового, пильовиків і шарнірів.'),
    ('hrv-ru1-brake-hoses-check', 15000, 12, 'Включно з лініями ABS/VSA.'),
    ('hrv-ru1-fluid-leaks-check', 15000, 12, 'Перевірка всіх ключових систем на підтікання.'),
    ('hrv-ru1-exhaust-check', 15000, 12, 'Система випуску, кріплення, теплозахист.'),
    ('hrv-ru1-fuel-lines-check', 15000, 12, 'Паливопроводи та з’єднання.'),
    ('hrv-ru1-wheel-nuts-check', 15000, 12, 'Контроль моменту затягування.'),
    ('hrv-ru1-road-test', 15000, 12, 'Тест-драйв після сервісу.'),
    ('hrv-ru1-wheel-alignment', null, null, 'Рекомендовано за бажанням клієнта або за нерівномірного зносу шин.'),
    ('hrv-ru1-seals-lubrication', 30000, 24, 'Особливо актуально перед зимою.')
)
insert into maintenance_schedule_items (template_id, procedure_id, interval_km, interval_months, notes_uk)
select
  (select id from template_ref limit 1),
  mp.id,
  schedule_seed.interval_km,
  schedule_seed.interval_months,
  schedule_seed.notes_uk
from schedule_seed
inner join maintenance_procedures mp on mp.code = schedule_seed.code
on conflict (template_id, procedure_id) do update set
  interval_km = excluded.interval_km,
  interval_months = excluded.interval_months,
  notes_uk = excluded.notes_uk,
  deleted = false,
  deleted_at = null,
  updated_at = now();