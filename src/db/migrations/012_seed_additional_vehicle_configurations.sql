with config_seed(brand_slug, model_slug, generation_slug, config_slug, engine_label, transmission_label, drivetrain_label, fuel_type, notes_uk) as (
  values
    ('honda', 'accord', 'g10', '15t-cvt-fwd', '1.5 VTEC Turbo', 'CVT', 'FWD', 'Бензин', 'Турбоверсія Accord для щоденної міської та трасової експлуатації.'),
    ('honda', 'accord', 'g10', '20-hybrid-ecvt-fwd', '2.0 e:HEV', 'e-CVT', 'FWD', 'Гібрид', 'Гібридна силова установка зі зниженим споживанням пального.'),
    ('honda', 'civic', 'g11', '15t-cvt-fwd', '1.5 VTEC Turbo', 'CVT', 'FWD', 'Бензин', 'Турбомотор Civic одинадцятого покоління.'),
    ('honda', 'civic', 'g11', '20-hybrid-ecvt-fwd', '2.0 e:HEV', 'e-CVT', 'FWD', 'Гібрид', 'Гібридна конфігурація Civic e:HEV.'),
    ('toyota', 'camry', 'xv70', '25-at-fwd', '2.5 Dynamic Force', '8AT', 'FWD', 'Бензин', 'Базова бензинова Camry із класичним автоматом.'),
    ('toyota', 'camry', 'xv70', '25-hybrid-ecvt-fwd', '2.5 Hybrid', 'e-CVT', 'FWD', 'Гібрид', 'Гібридна Camry з e-CVT.'),
    ('toyota', 'c-hr', 'ax10', '12t-cvt-fwd', '1.2 Turbo', 'CVT', 'FWD', 'Бензин', 'Турбобензинова передньопривідна версія C-HR.'),
    ('toyota', 'c-hr', 'ax10', '18-hybrid-ecvt-fwd', '1.8 Hybrid', 'e-CVT', 'FWD', 'Гібрид', 'Гібридна міська конфігурація C-HR.'),
    ('mazda', 'mazda3', 'bp', '20-at-fwd', '2.0 Skyactiv-G', '6AT', 'FWD', 'Бензин', 'Атмосферна бензинова Mazda3 з автоматом.'),
    ('mazda', 'mazda3', 'bp', '25-at-awd', '2.5 Skyactiv-G', '6AT', 'AWD', 'Бензин', 'Потужніша AWD-конфігурація Mazda3.'),
    ('mazda', 'mazda6', 'gl', '20-at-fwd', '2.0 Skyactiv-G', '6AT', 'FWD', 'Бензин', 'Базова бензинова Mazda6.'),
    ('mazda', 'mazda6', 'gl', '22d-at-fwd', '2.2 Skyactiv-D', '6AT', 'FWD', 'Дизель', 'Дизельна конфігурація Mazda6 для великих пробігів.'),
    ('nissan', 'x-trail', 't33', '15-e-power-fwd', '1.5 VC-T e-Power', 'e-CVT', 'FWD', 'Гібрид', 'Серійний гібрид e-Power у передньопривідному виконанні.'),
    ('nissan', 'x-trail', 't33', '15-e-power-awd', '1.5 VC-T e-4ORCE', 'e-CVT', 'AWD', 'Гібрид', 'Повнопривідна гібридна версія e-4ORCE.'),
    ('hyundai', 'elantra', 'cn7', '16-6at-fwd', '1.6 MPI', '6AT', 'FWD', 'Бензин', 'Базова бензинова Elantra з автоматом.'),
    ('hyundai', 'elantra', 'cn7', '16-hybrid-6dct-fwd', '1.6 Hybrid', '6DCT', 'FWD', 'Гібрид', 'Гібридна Elantra з двозчепленням.'),
    ('hyundai', 'santa-fe', 'tm', '25-8at-fwd', '2.5 GDi', '8AT', 'FWD', 'Бензин', 'Бензинова Santa Fe з переднім приводом.'),
    ('hyundai', 'santa-fe', 'tm', '16t-hybrid-6at-awd', '1.6 T-GDi Hybrid', '6AT', 'AWD', 'Гібрид', 'Гібридна AWD-конфігурація Santa Fe.'),
    ('kia', 'sorento', 'mq4', '25-8at-awd', '2.5 GDi', '8AT', 'AWD', 'Бензин', 'Бензинова AWD-версія Sorento.'),
    ('kia', 'sorento', 'mq4', '16t-hybrid-6at-awd', '1.6 T-GDi Hybrid', '6AT', 'AWD', 'Гібрид', 'Гібридна AWD-конфігурація Sorento.'),
    ('volkswagen', 'tiguan', 'ad1', '14-tsi-dsg-fwd', '1.4 TSI', 'DSG', 'FWD', 'Бензин', 'Базова бензинова конфігурація Tiguan.'),
    ('volkswagen', 'tiguan', 'ad1', '20-tdi-dsg-awd', '2.0 TDI', 'DSG', 'AWD', 'Дизель', 'Дизельний Tiguan з повним приводом.'),
    ('skoda', 'kodiaq', 'ns', '15-tsi-dsg-fwd', '1.5 TSI', 'DSG', 'FWD', 'Бензин', 'Бензинова передньопривідна конфігурація Kodiaq.'),
    ('skoda', 'kodiaq', 'ns', '20-tdi-dsg-awd', '2.0 TDI', 'DSG', 'AWD', 'Дизель', 'Дизельний AWD Kodiaq для дальніх маршрутів.'),
    ('ford', 'kuga', 'mk3', '15-ecoboost-8at-fwd', '1.5 EcoBoost', '8AT', 'FWD', 'Бензин', 'Бензинова версія Kuga з автоматом.'),
    ('ford', 'kuga', 'mk3', '25-phev-ecvt-fwd', '2.5 PHEV', 'e-CVT', 'FWD', 'PHEV', 'Плагін-гібридна конфігурація Kuga.'),
    ('subaru', 'outback', 'bt', '25-cvt-awd', '2.5 Boxer', 'Lineartronic CVT', 'AWD', 'Бензин', 'Атмосферна AWD-конфігурація Outback.'),
    ('subaru', 'outback', 'bt', '24t-cvt-awd', '2.4 Turbo Boxer', 'Lineartronic CVT', 'AWD', 'Бензин', 'Турбована конфігурація Outback для вищого навантаження.'),
    ('audi', 'q5', 'fy', '20-tfsi-s-tronic-quattro', '2.0 TFSI', 'S tronic', 'quattro', 'Бензин', 'Бензинова quattro-конфігурація Q5.'),
    ('audi', 'q5', 'fy', '20-tdi-s-tronic-quattro', '2.0 TDI', 'S tronic', 'quattro', 'Дизель', 'Дизельна quattro-конфігурація Q5.'),
    ('bmw', 'x3', 'g01', '20i-xdrive-8at', '2.0 xDrive20i', '8AT', 'AWD', 'Бензин', 'Бензинова AWD-конфігурація X3.'),
    ('bmw', 'x3', 'g01', '20d-xdrive-8at', '2.0 xDrive20d', '8AT', 'AWD', 'Дизель', 'Дизельна AWD-конфігурація X3.'),
    ('mercedes-benz', 'glc', 'x254', '200-9g-tronic-4matic', '2.0 GLC 200', '9G-Tronic', '4MATIC', 'Бензин', 'Базова бензинова 4MATIC-конфігурація GLC.'),
    ('mercedes-benz', 'glc', 'x254', '300e-9g-tronic-4matic', '2.0 GLC 300e', '9G-Tronic', '4MATIC', 'PHEV', 'Плагін-гібридна конфігурація GLC 300e.')
)
insert into vehicle_configurations (generation_id, slug, engine_label, transmission_label, drivetrain_label, fuel_type, notes_uk)
select
  vg.id,
  config_seed.config_slug,
  config_seed.engine_label,
  config_seed.transmission_label,
  config_seed.drivetrain_label,
  config_seed.fuel_type,
  config_seed.notes_uk
from config_seed
inner join vehicle_brands vb on vb.slug = config_seed.brand_slug
inner join vehicle_models vm on vm.brand_id = vb.id and vm.slug = config_seed.model_slug
inner join vehicle_generations vg on vg.model_id = vm.id and vg.slug = config_seed.generation_slug
on conflict (generation_id, slug) do update set
  engine_label = excluded.engine_label,
  transmission_label = excluded.transmission_label,
  drivetrain_label = excluded.drivetrain_label,
  fuel_type = excluded.fuel_type,
  notes_uk = excluded.notes_uk,
  updated_at = now();