insert into vehicle_brands (slug, name)
values
  ('subaru', 'Subaru'),
  ('mitsubishi', 'Mitsubishi'),
  ('suzuki', 'Suzuki'),
  ('peugeot', 'Peugeot'),
  ('citroen', 'Citroen'),
  ('opel', 'Opel'),
  ('volvo', 'Volvo'),
  ('lexus', 'Lexus'),
  ('seat', 'SEAT'),
  ('jeep', 'Jeep'),
  ('porsche', 'Porsche'),
  ('tesla', 'Tesla'),
  ('mini', 'MINI'),
  ('chevrolet', 'Chevrolet'),
  ('fiat', 'Fiat')
on conflict (slug) do update set
  name = excluded.name,
  updated_at = now();

insert into vehicle_models (brand_id, slug, name)
select brand.id, item.slug, item.name
from (values
  ('subaru', 'forester', 'Forester'),
  ('subaru', 'outback', 'Outback'),
  ('subaru', 'xv', 'XV'),
  ('subaru', 'impreza', 'Impreza'),
  ('subaru', 'legacy', 'Legacy'),
  ('mitsubishi', 'outlander', 'Outlander'),
  ('mitsubishi', 'asx', 'ASX'),
  ('mitsubishi', 'pajero-sport', 'Pajero Sport'),
  ('mitsubishi', 'eclipse-cross', 'Eclipse Cross'),
  ('mitsubishi', 'l200', 'L200'),
  ('suzuki', 'vitara', 'Vitara'),
  ('suzuki', 'sx4-s-cross', 'SX4 S-Cross'),
  ('suzuki', 'swift', 'Swift'),
  ('suzuki', 'jimny', 'Jimny'),
  ('suzuki', 'grand-vitara', 'Grand Vitara'),
  ('peugeot', '208', '208'),
  ('peugeot', '308', '308'),
  ('peugeot', '3008', '3008'),
  ('peugeot', '5008', '5008'),
  ('peugeot', 'partner', 'Partner'),
  ('citroen', 'c3', 'C3'),
  ('citroen', 'c4', 'C4'),
  ('citroen', 'c5-aircross', 'C5 Aircross'),
  ('citroen', 'berlingo', 'Berlingo'),
  ('citroen', 'c-elysee', 'C-Elysee'),
  ('opel', 'astra', 'Astra'),
  ('opel', 'corsa', 'Corsa'),
  ('opel', 'grandland', 'Grandland'),
  ('opel', 'crossland', 'Crossland'),
  ('opel', 'insignia', 'Insignia'),
  ('volvo', 'xc40', 'XC40'),
  ('volvo', 'xc60', 'XC60'),
  ('volvo', 'xc90', 'XC90'),
  ('volvo', 's60', 'S60'),
  ('volvo', 'v60', 'V60'),
  ('lexus', 'nx', 'NX'),
  ('lexus', 'rx', 'RX'),
  ('lexus', 'ux', 'UX'),
  ('lexus', 'es', 'ES'),
  ('lexus', 'lx', 'LX'),
  ('seat', 'leon', 'Leon'),
  ('seat', 'ateca', 'Ateca'),
  ('seat', 'ibiza', 'Ibiza'),
  ('seat', 'arona', 'Arona'),
  ('seat', 'tarraco', 'Tarraco'),
  ('jeep', 'compass', 'Compass'),
  ('jeep', 'renegade', 'Renegade'),
  ('jeep', 'grand-cherokee', 'Grand Cherokee'),
  ('jeep', 'wrangler', 'Wrangler'),
  ('jeep', 'cherokee', 'Cherokee'),
  ('porsche', 'macan', 'Macan'),
  ('porsche', 'cayenne', 'Cayenne'),
  ('porsche', 'panamera', 'Panamera'),
  ('porsche', 'taycan', 'Taycan'),
  ('porsche', '911', '911'),
  ('tesla', 'model-3', 'Model 3'),
  ('tesla', 'model-y', 'Model Y'),
  ('tesla', 'model-s', 'Model S'),
  ('tesla', 'model-x', 'Model X'),
  ('tesla', 'cybertruck', 'Cybertruck'),
  ('mini', 'cooper', 'Cooper'),
  ('mini', 'countryman', 'Countryman'),
  ('mini', 'clubman', 'Clubman'),
  ('mini', 'paceman', 'Paceman'),
  ('mini', 'convertible', 'Convertible'),
  ('chevrolet', 'malibu', 'Malibu'),
  ('chevrolet', 'equinox', 'Equinox'),
  ('chevrolet', 'traverse', 'Traverse'),
  ('chevrolet', 'trailblazer', 'Trailblazer'),
  ('chevrolet', 'bolt', 'Bolt'),
  ('fiat', '500', '500'),
  ('fiat', 'tipo', 'Tipo'),
  ('fiat', 'doblo', 'Doblo'),
  ('fiat', 'panda', 'Panda'),
  ('fiat', '500x', '500X')
) as item(brand_slug, slug, name)
inner join vehicle_brands brand on brand.slug = item.brand_slug
on conflict (brand_id, slug) do update set
  name = excluded.name,
  updated_at = now();

insert into vehicle_generations (model_id, slug, name, year_from, year_to, notes_uk)
select model.id, item.slug, item.name, item.year_from, item.year_to, item.notes_uk
from (values
  ('subaru', 'forester', 'sk', 'SK', 2018, 2030, 'П’яте покоління Forester.'),
  ('subaru', 'outback', 'bt', 'BT', 2020, 2030, 'Шосте покоління Outback.'),
  ('subaru', 'xv', 'gt', 'GT', 2017, 2023, 'Subaru XV другого покоління.'),
  ('subaru', 'impreza', 'gu', 'GU', 2023, 2030, 'Subaru Impreza шостого покоління.'),
  ('subaru', 'legacy', 'bw', 'BW', 2020, 2030, 'Актуальне покоління Legacy.'),
  ('mitsubishi', 'outlander', 'gn', 'GN', 2021, 2030, 'Outlander четвертого покоління.'),
  ('mitsubishi', 'asx', 'ga', 'GA', 2019, 2025, 'Рестайлінговий ASX.'),
  ('mitsubishi', 'pajero-sport', 'qf', 'QF', 2019, 2030, 'Поточне покоління Pajero Sport.'),
  ('mitsubishi', 'eclipse-cross', 'ya', 'YA', 2017, 2030, 'Mitsubishi Eclipse Cross.'),
  ('mitsubishi', 'l200', 'mv', 'MV', 2019, 2030, 'Пікап L200 шостого покоління.'),
  ('suzuki', 'vitara', 'ly', 'LY', 2015, 2030, 'Сучасна Suzuki Vitara.'),
  ('suzuki', 'sx4-s-cross', 'jy', 'JY', 2021, 2030, 'Оновлений S-Cross.'),
  ('suzuki', 'swift', 'a2l', 'A2L', 2017, 2024, 'Swift четвертого покоління.'),
  ('suzuki', 'jimny', 'jb74', 'JB74', 2018, 2030, 'Jimny актуального покоління.'),
  ('suzuki', 'grand-vitara', 'ytb', 'YTB', 2022, 2030, 'Grand Vitara нового покоління.'),
  ('peugeot', '208', 'p21', 'P21', 2019, 2030, 'Peugeot 208 другого покоління.'),
  ('peugeot', '308', 'p51', 'P51', 2021, 2030, 'Peugeot 308 третього покоління.'),
  ('peugeot', '3008', 'p84', 'P84', 2016, 2030, 'Peugeot 3008 другого покоління.'),
  ('peugeot', '5008', 'p87', 'P87', 2017, 2030, 'Peugeot 5008 другого покоління.'),
  ('peugeot', 'partner', 'k9', 'K9', 2018, 2030, 'Peugeot Partner K9.'),
  ('citroen', 'c3', 'cc21', 'CC21', 2016, 2024, 'Citroen C3 третього покоління.'),
  ('citroen', 'c4', 'c41', 'C41', 2020, 2030, 'Citroen C4 нового покоління.'),
  ('citroen', 'c5-aircross', 'c84', 'C84', 2018, 2030, 'Citroen C5 Aircross.'),
  ('citroen', 'berlingo', 'k9', 'K9', 2018, 2030, 'Citroen Berlingo K9.'),
  ('citroen', 'c-elysee', 'facelift', 'Facelift', 2017, 2024, 'Оновлений C-Elysee.'),
  ('opel', 'astra', 'l', 'L', 2021, 2030, 'Opel Astra L.'),
  ('opel', 'corsa', 'f', 'F', 2019, 2030, 'Opel Corsa F.'),
  ('opel', 'grandland', 'hybrid', 'Hybrid', 2021, 2030, 'Оновлений Opel Grandland.'),
  ('opel', 'crossland', 'facelift', 'Facelift', 2021, 2030, 'Opel Crossland після оновлення.'),
  ('opel', 'insignia', 'b', 'B', 2017, 2024, 'Opel Insignia B.'),
  ('volvo', 'xc40', '536', '536', 2018, 2030, 'Volvo XC40 актуальної генерації.'),
  ('volvo', 'xc60', '246', '246', 2017, 2030, 'Volvo XC60 другого покоління.'),
  ('volvo', 'xc90', '256', '256', 2015, 2030, 'Volvo XC90 другого покоління.'),
  ('volvo', 's60', '224', '224', 2018, 2030, 'Volvo S60 третього покоління.'),
  ('volvo', 'v60', '225', '225', 2018, 2030, 'Volvo V60 другого покоління.'),
  ('lexus', 'nx', 'az20', 'AZ20', 2021, 2030, 'Lexus NX другого покоління.'),
  ('lexus', 'rx', 'al20', 'AL20', 2022, 2030, 'Lexus RX п’ятого покоління.'),
  ('lexus', 'ux', 'za10', 'ZA10', 2018, 2030, 'Lexus UX.'),
  ('lexus', 'es', 'xz10', 'XZ10', 2018, 2030, 'Lexus ES сьомого покоління.'),
  ('lexus', 'lx', 'j300', 'J300', 2021, 2030, 'Lexus LX нового покоління.'),
  ('seat', 'leon', 'kl', 'KL', 2020, 2030, 'SEAT Leon четвертого покоління.'),
  ('seat', 'ateca', 'kh7', 'KH7', 2016, 2030, 'SEAT Ateca.'),
  ('seat', 'ibiza', 'kJ', 'KJ', 2017, 2030, 'SEAT Ibiza п’ятого покоління.'),
  ('seat', 'arona', 'kJ7', 'KJ7', 2017, 2030, 'SEAT Arona.'),
  ('seat', 'tarraco', 'kn2', 'KN2', 2018, 2030, 'SEAT Tarraco.'),
  ('jeep', 'compass', 'mp', 'MP', 2017, 2030, 'Jeep Compass другого покоління.'),
  ('jeep', 'renegade', 'bu', 'BU', 2018, 2030, 'Jeep Renegade після оновлення.'),
  ('jeep', 'grand-cherokee', 'wl', 'WL', 2021, 2030, 'Jeep Grand Cherokee WL.'),
  ('jeep', 'wrangler', 'jl', 'JL', 2018, 2030, 'Jeep Wrangler JL.'),
  ('jeep', 'cherokee', 'kl', 'KL', 2018, 2024, 'Jeep Cherokee KL рестайлінг.'),
  ('porsche', 'macan', '95b', '95B', 2019, 2030, 'Оновлений Porsche Macan.'),
  ('porsche', 'cayenne', '9ya', '9YA', 2018, 2030, 'Porsche Cayenne третього покоління.'),
  ('porsche', 'panamera', '971', '971', 2016, 2030, 'Porsche Panamera другого покоління.'),
  ('porsche', 'taycan', 'y1a', 'Y1A', 2019, 2030, 'Porsche Taycan.'),
  ('porsche', '911', '992', '992', 2019, 2030, 'Porsche 911 покоління 992.'),
  ('tesla', 'model-3', 'highland', 'Highland', 2023, 2030, 'Оновлена Tesla Model 3.'),
  ('tesla', 'model-y', 'juniper', 'Juniper', 2025, 2030, 'Оновлена Tesla Model Y.'),
  ('tesla', 'model-s', 'refresh', 'Refresh', 2021, 2030, 'Tesla Model S після великого оновлення.'),
  ('tesla', 'model-x', 'refresh', 'Refresh', 2021, 2030, 'Tesla Model X після великого оновлення.'),
  ('tesla', 'cybertruck', 'ct1', 'CT1', 2023, 2030, 'Tesla Cybertruck.'),
  ('mini', 'cooper', 'f56', 'F56', 2018, 2024, 'MINI Cooper F56 рестайлінг.'),
  ('mini', 'countryman', 'u25', 'U25', 2023, 2030, 'MINI Countryman нового покоління.'),
  ('mini', 'clubman', 'f54', 'F54', 2019, 2024, 'MINI Clubman F54.'),
  ('mini', 'paceman', 'r61', 'R61', 2014, 2017, 'MINI Paceman.'),
  ('mini', 'convertible', 'f57', 'F57', 2018, 2024, 'MINI Convertible F57.'),
  ('chevrolet', 'malibu', 'facelift', 'Facelift', 2019, 2025, 'Chevrolet Malibu після оновлення.'),
  ('chevrolet', 'equinox', 'eq4', 'EQ4', 2021, 2030, 'Chevrolet Equinox поточної генерації.'),
  ('chevrolet', 'traverse', 'cuv', 'CUV', 2023, 2030, 'Chevrolet Traverse нового покоління.'),
  ('chevrolet', 'trailblazer', '9b', '9B', 2020, 2030, 'Chevrolet Trailblazer поточної генерації.'),
  ('chevrolet', 'bolt', 'ev', 'EV', 2020, 2024, 'Chevrolet Bolt EV.'),
  ('fiat', '500', '312', '312', 2015, 2024, 'Fiat 500 актуального циклу.'),
  ('fiat', 'tipo', '356', '356', 2016, 2024, 'Fiat Tipo.'),
  ('fiat', 'doblo', 'k9', 'K9', 2022, 2030, 'Fiat Doblo нового покоління.'),
  ('fiat', 'panda', '319', '319', 2018, 2030, 'Fiat Panda третього покоління.'),
  ('fiat', '500x', '334', '334', 2018, 2028, 'Fiat 500X.'),
  ('honda', 'cr-v', 'rs', 'RS', 2022, 2030, 'Honda CR-V шостого покоління.'),
  ('toyota', 'camry', 'xv80', 'XV80', 2023, 2030, 'Toyota Camry нового покоління.'),
  ('toyota', 'corolla', 'e170', 'E170', 2013, 2019, 'Toyota Corolla попереднього покоління.'),
  ('toyota', 'rav4', 'xa40', 'XA40', 2013, 2018, 'Toyota RAV4 четвертого покоління.'),
  ('mazda', 'cx-5', 'ke', 'KE', 2012, 2017, 'Mazda CX-5 першого покоління.'),
  ('nissan', 'qashqai', 'j11', 'J11', 2013, 2021, 'Nissan Qashqai другого покоління.'),
  ('hyundai', 'tucson', 'tl', 'TL', 2015, 2020, 'Hyundai Tucson TL.'),
  ('kia', 'sportage', 'ql', 'QL', 2015, 2021, 'Kia Sportage QL.'),
  ('volkswagen', 'golf', 'mk7', 'Mk7', 2012, 2019, 'Volkswagen Golf сьомого покоління.'),
  ('skoda', 'octavia', 'a7', 'A7', 2013, 2020, 'Skoda Octavia A7.'),
  ('ford', 'focus', 'mk3', 'Mk3', 2011, 2018, 'Ford Focus Mk3.'),
  ('audi', 'q5', 'gu', 'GU', 2024, 2030, 'Audi Q5 нового покоління.')
) as item(brand_slug, model_slug, slug, name, year_from, year_to, notes_uk)
inner join vehicle_brands brand on brand.slug = item.brand_slug
inner join vehicle_models model on model.brand_id = brand.id and model.slug = item.model_slug
on conflict (model_id, slug) do update set
  name = excluded.name,
  year_from = excluded.year_from,
  year_to = excluded.year_to,
  notes_uk = excluded.notes_uk,
  updated_at = now();

insert into maintenance_procedures (code, title_uk, description_uk, default_interval_km, default_interval_months, category)
values
  ('brake-pad-disc-check', 'Огляд гальмівних колодок і дисків', 'Контроль зносу колодок, дисків і стану супортів.', 15000, 12, 'Гальма'),
  ('battery-check', 'Перевірка акумулятора', 'Стан АКБ, клем, заряджання і тест пускового струму.', 15000, 12, 'Електрика'),
  ('suspension-check', 'Огляд підвіски і рульового керування', 'Перевірка люфтів, сайлентблоків, шарнірів та амортизаторів.', 15000, 12, 'Ходова частина'),
  ('tire-rotation', 'Ротація коліс', 'Перестановка коліс для рівномірного зносу шин.', 10000, 12, 'Шини'),
  ('fuel-system-check', 'Перевірка паливної системи', 'Огляд паливних магістралей, з’єднань і стану подачі пального.', 30000, 24, 'Паливна система'),
  ('accessory-belt-check', 'Огляд допоміжного ременя', 'Перевірка стану ременя допоміжних агрегатів і натягу.', 30000, 24, 'Двигун')
on conflict (code) do update set
  title_uk = excluded.title_uk,
  description_uk = excluded.description_uk,
  default_interval_km = excluded.default_interval_km,
  default_interval_months = excluded.default_interval_months,
  category = excluded.category,
  deleted = false,
  deleted_at = null,
  updated_at = now();

with template_seed(template_key, brand_slug, model_slug, generation_slug, name_uk, notes_uk) as (
  values
    ('honda-crv-rw', 'honda', 'cr-v', 'rw', 'Honda CR-V RW базовий регламент', 'Щорічний регламент для бензинових версій CR-V RW з акцентом на рідини, фільтри і стандартні інспекції.'),
    ('toyota-corolla-e210', 'toyota', 'corolla', 'e210', 'Toyota Corolla E210 регламент', 'Компактний щорічний цикл для Corolla E210 з короткими контрольними інтервалами.'),
    ('toyota-rav4-xa50', 'toyota', 'rav4', 'xa50', 'Toyota RAV4 XA50 регламент', 'Регламент для сучасного RAV4 з базовим циклом 15 000 км / 12 міс.'),
    ('mazda-cx5-kf', 'mazda', 'cx-5', 'kf', 'Mazda CX-5 KF регламент', 'Сітка робіт для CX-5 KF з регулярною увагою до трансмісії і ходової.'),
    ('nissan-qashqai-j12', 'nissan', 'qashqai', 'j12', 'Nissan Qashqai J12 регламент', 'Базовий сервісний цикл для Qashqai J12 у звичайних умовах.'),
    ('hyundai-tucson-nx4', 'hyundai', 'tucson', 'nx4', 'Hyundai Tucson NX4 регламент', 'Актуальний план ТО для Tucson NX4.'),
    ('kia-sportage-nq5', 'kia', 'sportage', 'nq5', 'Kia Sportage NQ5 регламент', 'Щорічний план для Sportage NQ5 з типовим набором рідин і перевірок.'),
    ('volkswagen-golf-mk8', 'volkswagen', 'golf', 'mk8', 'Volkswagen Golf Mk8 регламент', 'Компактний цикл для Golf Mk8 з регулярною ротацією коліс.'),
    ('skoda-octavia-nx', 'skoda', 'octavia', 'nx', 'Skoda Octavia NX регламент', 'План обслуговування для Octavia NX з коротким щорічним кроком.'),
    ('ford-focus-mk4', 'ford', 'focus', 'mk4', 'Ford Focus Mk4 регламент', 'Базовий щорічний план для Focus Mk4.'),
    ('subaru-forester-sk', 'subaru', 'forester', 'sk', 'Subaru Forester SK регламент', 'План ТО для Forester SK з регулярною увагою до трансмісійних рідин та підвіски.'),
    ('mitsubishi-outlander-gn', 'mitsubishi', 'outlander', 'gn', 'Mitsubishi Outlander GN регламент', 'Регламент для Outlander GN з широким набором базових інспекцій.')
), resolved_generations as (
  select
    template_seed.template_key,
    template_seed.name_uk,
    template_seed.notes_uk,
    vg.id as generation_id
  from template_seed
  inner join vehicle_brands vb on vb.slug = template_seed.brand_slug
  inner join vehicle_models vm on vm.brand_id = vb.id and vm.slug = template_seed.model_slug
  inner join vehicle_generations vg on vg.model_id = vm.id and vg.slug = template_seed.generation_slug
), updated_templates as (
  update maintenance_schedule_templates mst
  set name_uk = resolved_generations.name_uk,
      notes_uk = resolved_generations.notes_uk,
      deleted = false,
      deleted_at = null,
      updated_at = now()
  from resolved_generations
  where mst.generation_id = resolved_generations.generation_id and mst.deleted = false
  returning mst.id, mst.generation_id
)
insert into maintenance_schedule_templates (name_uk, generation_id, notes_uk)
select resolved_generations.name_uk, resolved_generations.generation_id, resolved_generations.notes_uk
from resolved_generations
where not exists (
  select 1
  from maintenance_schedule_templates mst
  where mst.generation_id = resolved_generations.generation_id and mst.deleted = false
);

with template_seed(template_key, brand_slug, model_slug, generation_slug) as (
  values
    ('honda-crv-rw', 'honda', 'cr-v', 'rw'),
    ('toyota-corolla-e210', 'toyota', 'corolla', 'e210'),
    ('toyota-rav4-xa50', 'toyota', 'rav4', 'xa50'),
    ('mazda-cx5-kf', 'mazda', 'cx-5', 'kf'),
    ('nissan-qashqai-j12', 'nissan', 'qashqai', 'j12'),
    ('hyundai-tucson-nx4', 'hyundai', 'tucson', 'nx4'),
    ('kia-sportage-nq5', 'kia', 'sportage', 'nq5'),
    ('volkswagen-golf-mk8', 'volkswagen', 'golf', 'mk8'),
    ('skoda-octavia-nx', 'skoda', 'octavia', 'nx'),
    ('ford-focus-mk4', 'ford', 'focus', 'mk4'),
    ('subaru-forester-sk', 'subaru', 'forester', 'sk'),
    ('mitsubishi-outlander-gn', 'mitsubishi', 'outlander', 'gn')
), template_ref as (
  select
    template_seed.template_key,
    mst.id as template_id
  from template_seed
  inner join vehicle_brands vb on vb.slug = template_seed.brand_slug
  inner join vehicle_models vm on vm.brand_id = vb.id and vm.slug = template_seed.model_slug
  inner join vehicle_generations vg on vg.model_id = vm.id and vg.slug = template_seed.generation_slug
  inner join maintenance_schedule_templates mst on mst.generation_id = vg.id and mst.deleted = false
), schedule_seed(template_key, procedure_code, interval_km, interval_months, notes_uk) as (
  values
    ('honda-crv-rw', 'engine-oil', 15000, 12, 'Базова заміна моторної оливи раз на рік або 15 000 км.'),
    ('honda-crv-rw', 'oil-filter', 15000, 12, 'Разом із моторною оливою.'),
    ('honda-crv-rw', 'air-filter', 30000, 24, 'Раніше у пилових умовах.'),
    ('honda-crv-rw', 'cabin-filter', 15000, 12, 'Щорічна заміна салонного фільтра.'),
    ('honda-crv-rw', 'brake-fluid', null, 36, 'Оновлення кожні 3 роки.'),
    ('honda-crv-rw', 'coolant', 100000, 72, 'Планова заміна антифризу.'),
    ('honda-crv-rw', 'transmission-fluid', 60000, 48, 'Регулярний сервіс трансмісії.'),
    ('honda-crv-rw', 'spark-plugs', 100000, 72, 'Заміна свічок за пробігом.'),
    ('honda-crv-rw', 'inspection', 15000, 12, 'Комплексна щорічна перевірка.'),
    ('honda-crv-rw', 'brake-pad-disc-check', 15000, 12, 'Огляд гальмівної системи.'),
    ('honda-crv-rw', 'battery-check', 15000, 12, 'Сезонна перевірка АКБ.'),
    ('honda-crv-rw', 'suspension-check', 15000, 12, 'Огляд підвіски і рульового.'),

    ('toyota-corolla-e210', 'engine-oil', 15000, 12, 'Основний щорічний сервіс.'),
    ('toyota-corolla-e210', 'oil-filter', 15000, 12, 'Разом із заміною оливи.'),
    ('toyota-corolla-e210', 'air-filter', 30000, 24, 'Контроль і заміна за забрудненням.'),
    ('toyota-corolla-e210', 'cabin-filter', 15000, 12, 'Салонний фільтр раз на рік.'),
    ('toyota-corolla-e210', 'brake-fluid', null, 36, 'Кожні 3 роки.'),
    ('toyota-corolla-e210', 'transmission-fluid', 90000, 72, 'Для автоматичних трансмісій та e-CVT.'),
    ('toyota-corolla-e210', 'spark-plugs', 120000, 96, 'Іридієві свічки із збільшеним інтервалом.'),
    ('toyota-corolla-e210', 'inspection', 15000, 12, 'Щорічний огляд.'),
    ('toyota-corolla-e210', 'tire-rotation', 10000, 12, 'Ротація коліс для рівномірного зносу.'),
    ('toyota-corolla-e210', 'battery-check', 15000, 12, 'Контроль АКБ і заряджання.'),

    ('toyota-rav4-xa50', 'engine-oil', 15000, 12, 'Базова заміна оливи.'),
    ('toyota-rav4-xa50', 'oil-filter', 15000, 12, 'Разом із оливою.'),
    ('toyota-rav4-xa50', 'air-filter', 30000, 24, 'Замінювати раніше у важких умовах.'),
    ('toyota-rav4-xa50', 'cabin-filter', 15000, 12, 'Щорічний сервіс фільтра салону.'),
    ('toyota-rav4-xa50', 'brake-fluid', null, 36, 'Кожні 3 роки.'),
    ('toyota-rav4-xa50', 'coolant', 100000, 72, 'Планова заміна охолоджувальної рідини.'),
    ('toyota-rav4-xa50', 'transmission-fluid', 90000, 72, 'Профілактика трансмісії.'),
    ('toyota-rav4-xa50', 'inspection', 15000, 12, 'Комплексний огляд вузлів.'),
    ('toyota-rav4-xa50', 'brake-pad-disc-check', 15000, 12, 'Огляд гальм.'),
    ('toyota-rav4-xa50', 'suspension-check', 15000, 12, 'Огляд підвіски.'),
    ('toyota-rav4-xa50', 'battery-check', 15000, 12, 'Контроль АКБ.'),

    ('mazda-cx5-kf', 'engine-oil', 15000, 12, 'Щорічний сервіс двигуна.'),
    ('mazda-cx5-kf', 'oil-filter', 15000, 12, 'Разом із моторною оливою.'),
    ('mazda-cx5-kf', 'air-filter', 30000, 24, 'Стандартний цикл заміни.'),
    ('mazda-cx5-kf', 'cabin-filter', 15000, 12, 'Щорічна заміна салонного фільтра.'),
    ('mazda-cx5-kf', 'brake-fluid', null, 36, 'Оновлення раз на 3 роки.'),
    ('mazda-cx5-kf', 'coolant', 100000, 72, 'Планова заміна антифризу.'),
    ('mazda-cx5-kf', 'transmission-fluid', 60000, 48, 'Оновлення рідини АКПП.'),
    ('mazda-cx5-kf', 'spark-plugs', 120000, 96, 'Свічки зі збільшеним ресурсом.'),
    ('mazda-cx5-kf', 'inspection', 15000, 12, 'Щорічний контроль авто.'),
    ('mazda-cx5-kf', 'brake-pad-disc-check', 15000, 12, 'Огляд гальмівних механізмів.'),
    ('mazda-cx5-kf', 'suspension-check', 15000, 12, 'Діагностика підвіски.'),
    ('mazda-cx5-kf', 'accessory-belt-check', 30000, 24, 'Огляд ременя допоміжних агрегатів.'),

    ('nissan-qashqai-j12', 'engine-oil', 15000, 12, 'Базова заміна оливи.'),
    ('nissan-qashqai-j12', 'oil-filter', 15000, 12, 'Разом із заміною оливи.'),
    ('nissan-qashqai-j12', 'air-filter', 30000, 24, 'Заміна за стандартним циклом.'),
    ('nissan-qashqai-j12', 'cabin-filter', 15000, 12, 'Щорічний сервіс салонного фільтра.'),
    ('nissan-qashqai-j12', 'brake-fluid', null, 36, 'Кожні 3 роки.'),
    ('nissan-qashqai-j12', 'transmission-fluid', 60000, 48, 'Профілактика CVT або АКПП.'),
    ('nissan-qashqai-j12', 'spark-plugs', 90000, 72, 'Регламент для бензинових моторів.'),
    ('nissan-qashqai-j12', 'inspection', 15000, 12, 'Комплексний огляд.'),
    ('nissan-qashqai-j12', 'brake-pad-disc-check', 15000, 12, 'Огляд гальм.'),
    ('nissan-qashqai-j12', 'battery-check', 15000, 12, 'Перевірка АКБ.'),
    ('nissan-qashqai-j12', 'fuel-system-check', 30000, 24, 'Огляд паливної системи.'),

    ('hyundai-tucson-nx4', 'engine-oil', 15000, 12, 'Базовий цикл заміни оливи.'),
    ('hyundai-tucson-nx4', 'oil-filter', 15000, 12, 'Разом із оливою.'),
    ('hyundai-tucson-nx4', 'air-filter', 30000, 24, 'Стандартний сервіс.'),
    ('hyundai-tucson-nx4', 'cabin-filter', 15000, 12, 'Щорічний салонний фільтр.'),
    ('hyundai-tucson-nx4', 'brake-fluid', null, 36, 'Кожні 3 роки.'),
    ('hyundai-tucson-nx4', 'coolant', 90000, 72, 'Планова заміна антифризу.'),
    ('hyundai-tucson-nx4', 'transmission-fluid', 60000, 48, 'Сервіс АКПП / DCT.'),
    ('hyundai-tucson-nx4', 'spark-plugs', 90000, 72, 'Регламентована заміна свічок.'),
    ('hyundai-tucson-nx4', 'inspection', 15000, 12, 'Комплексний огляд.'),
    ('hyundai-tucson-nx4', 'brake-pad-disc-check', 15000, 12, 'Контроль зносу гальм.'),
    ('hyundai-tucson-nx4', 'battery-check', 15000, 12, 'Перевірка батареї.'),
    ('hyundai-tucson-nx4', 'suspension-check', 15000, 12, 'Огляд підвіски.'),

    ('kia-sportage-nq5', 'engine-oil', 15000, 12, 'Базовий річний сервіс.'),
    ('kia-sportage-nq5', 'oil-filter', 15000, 12, 'Разом із заміною оливи.'),
    ('kia-sportage-nq5', 'air-filter', 30000, 24, 'Стандартний інтервал.'),
    ('kia-sportage-nq5', 'cabin-filter', 15000, 12, 'Щорічний сервіс салону.'),
    ('kia-sportage-nq5', 'brake-fluid', null, 36, 'Раз на 3 роки.'),
    ('kia-sportage-nq5', 'coolant', 90000, 72, 'Планова заміна охолоджувальної рідини.'),
    ('kia-sportage-nq5', 'transmission-fluid', 60000, 48, 'Профілактика трансмісії.'),
    ('kia-sportage-nq5', 'spark-plugs', 90000, 72, 'Сервіс свічок.'),
    ('kia-sportage-nq5', 'inspection', 15000, 12, 'Щорічний огляд.'),
    ('kia-sportage-nq5', 'brake-pad-disc-check', 15000, 12, 'Огляд гальм.'),
    ('kia-sportage-nq5', 'battery-check', 15000, 12, 'Перевірка АКБ.'),
    ('kia-sportage-nq5', 'suspension-check', 15000, 12, 'Підвіска і кермове.'),

    ('volkswagen-golf-mk8', 'engine-oil', 15000, 12, 'Щорічна заміна оливи.'),
    ('volkswagen-golf-mk8', 'oil-filter', 15000, 12, 'Разом із оливою.'),
    ('volkswagen-golf-mk8', 'air-filter', 30000, 24, 'Планова заміна фільтра.'),
    ('volkswagen-golf-mk8', 'cabin-filter', 15000, 12, 'Щорічний салонний фільтр.'),
    ('volkswagen-golf-mk8', 'brake-fluid', null, 24, 'Оновлення раз на 2 роки.'),
    ('volkswagen-golf-mk8', 'transmission-fluid', 60000, 48, 'Сервіс DSG або АКПП.'),
    ('volkswagen-golf-mk8', 'spark-plugs', 60000, 48, 'Заміна свічок за пробігом.'),
    ('volkswagen-golf-mk8', 'inspection', 15000, 12, 'Огляд за щорічним циклом.'),
    ('volkswagen-golf-mk8', 'tire-rotation', 10000, 12, 'Ротація коліс.'),
    ('volkswagen-golf-mk8', 'battery-check', 15000, 12, 'Контроль АКБ.'),

    ('skoda-octavia-nx', 'engine-oil', 15000, 12, 'Базова заміна оливи.'),
    ('skoda-octavia-nx', 'oil-filter', 15000, 12, 'Разом із моторною оливою.'),
    ('skoda-octavia-nx', 'air-filter', 30000, 24, 'Стандартний цикл заміни.'),
    ('skoda-octavia-nx', 'cabin-filter', 15000, 12, 'Салонний фільтр раз на рік.'),
    ('skoda-octavia-nx', 'brake-fluid', null, 24, 'Оновлення кожні 2 роки.'),
    ('skoda-octavia-nx', 'transmission-fluid', 60000, 48, 'Профілактичний сервіс DSG/АКПП.'),
    ('skoda-octavia-nx', 'spark-plugs', 60000, 48, 'Інтервал для бензинових TSI.'),
    ('skoda-octavia-nx', 'inspection', 15000, 12, 'Щорічний огляд.'),
    ('skoda-octavia-nx', 'tire-rotation', 10000, 12, 'Перестановка коліс.'),
    ('skoda-octavia-nx', 'battery-check', 15000, 12, 'Перевірка батареї.'),

    ('ford-focus-mk4', 'engine-oil', 15000, 12, 'Щорічна заміна моторної оливи.'),
    ('ford-focus-mk4', 'oil-filter', 15000, 12, 'Разом із оливою.'),
    ('ford-focus-mk4', 'air-filter', 30000, 24, 'Планова заміна фільтра повітря.'),
    ('ford-focus-mk4', 'cabin-filter', 15000, 12, 'Сервіс салонного фільтра.'),
    ('ford-focus-mk4', 'brake-fluid', null, 24, 'Рекомендовано раз на 2 роки.'),
    ('ford-focus-mk4', 'transmission-fluid', 60000, 48, 'Оновлення рідини АКПП.'),
    ('ford-focus-mk4', 'spark-plugs', 60000, 48, 'Інтервал для бензинових EcoBoost.'),
    ('ford-focus-mk4', 'inspection', 15000, 12, 'Щорічний комплексний огляд.'),
    ('ford-focus-mk4', 'battery-check', 15000, 12, 'Перевірка АКБ.'),
    ('ford-focus-mk4', 'brake-pad-disc-check', 15000, 12, 'Огляд гальмівної системи.'),

    ('subaru-forester-sk', 'engine-oil', 15000, 12, 'Базова заміна моторної оливи.'),
    ('subaru-forester-sk', 'oil-filter', 15000, 12, 'Разом із оливою.'),
    ('subaru-forester-sk', 'air-filter', 30000, 24, 'Стандартний цикл повітряного фільтра.'),
    ('subaru-forester-sk', 'cabin-filter', 15000, 12, 'Салонний фільтр щороку.'),
    ('subaru-forester-sk', 'brake-fluid', null, 24, 'Оновлення раз на 2 роки.'),
    ('subaru-forester-sk', 'coolant', 100000, 72, 'Планова заміна антифризу.'),
    ('subaru-forester-sk', 'transmission-fluid', 60000, 48, 'Сервіс CVT.'),
    ('subaru-forester-sk', 'spark-plugs', 100000, 72, 'Регламент свічок для опозитного двигуна.'),
    ('subaru-forester-sk', 'inspection', 15000, 12, 'Щорічний огляд.'),
    ('subaru-forester-sk', 'brake-pad-disc-check', 15000, 12, 'Гальмівні механізми.'),
    ('subaru-forester-sk', 'battery-check', 15000, 12, 'Сезонна перевірка АКБ.'),
    ('subaru-forester-sk', 'suspension-check', 15000, 12, 'Підвіска, кермове, шарніри.'),

    ('mitsubishi-outlander-gn', 'engine-oil', 15000, 12, 'Базова заміна моторної оливи.'),
    ('mitsubishi-outlander-gn', 'oil-filter', 15000, 12, 'Разом із оливою.'),
    ('mitsubishi-outlander-gn', 'air-filter', 30000, 24, 'Стандартний повітряний фільтр.'),
    ('mitsubishi-outlander-gn', 'cabin-filter', 15000, 12, 'Щорічний салонний фільтр.'),
    ('mitsubishi-outlander-gn', 'brake-fluid', null, 24, 'Оновлення раз на 2 роки.'),
    ('mitsubishi-outlander-gn', 'coolant', 100000, 72, 'Планова заміна антифризу.'),
    ('mitsubishi-outlander-gn', 'transmission-fluid', 60000, 48, 'Сервіс CVT або АКПП.'),
    ('mitsubishi-outlander-gn', 'spark-plugs', 90000, 72, 'Заміна свічок за пробігом.'),
    ('mitsubishi-outlander-gn', 'inspection', 15000, 12, 'Комплексний щорічний огляд.'),
    ('mitsubishi-outlander-gn', 'brake-pad-disc-check', 15000, 12, 'Огляд гальм.'),
    ('mitsubishi-outlander-gn', 'battery-check', 15000, 12, 'Контроль батареї.'),
    ('mitsubishi-outlander-gn', 'suspension-check', 15000, 12, 'Огляд підвіски і кермового.'),
    ('mitsubishi-outlander-gn', 'fuel-system-check', 30000, 24, 'Паливна система і магістралі.')
)
insert into maintenance_schedule_items (template_id, procedure_id, interval_km, interval_months, notes_uk)
select
  template_ref.template_id,
  mp.id,
  schedule_seed.interval_km,
  schedule_seed.interval_months,
  schedule_seed.notes_uk
from schedule_seed
inner join template_ref on template_ref.template_key = schedule_seed.template_key
inner join maintenance_procedures mp on mp.code = schedule_seed.procedure_code
on conflict (template_id, procedure_id) do update set
  interval_km = excluded.interval_km,
  interval_months = excluded.interval_months,
  notes_uk = excluded.notes_uk,
  deleted = false,
  deleted_at = null,
  updated_at = now();