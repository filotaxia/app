-- ============================================
--    Supabase — TR01 a TR05
--    ============================================

-- Los terrarios que tenía la app en src/content/terrarios.js, como punto de
-- partida: conservan su nombre (TR01–TR05) y el resto se edita desde el panel.
-- TR06 no se carga. El qr_code lo pone la base (no va acá).
-- Las fotos siguen siendo las de src/assets/ hasta que el panel suba las nuevas.

insert into public.terrarios
  (id, model, status, recorded, duration, story, photo, specs, plants, waves, care)
values
  ('01', 'TR01', 'publicado', '2026-06-14', 251,
   'Este terrario reúne tres suculentas con formas triangulares y sinusoidales. La combinación de estas ondas genera una pieza musical marcada por contrastes: sonidos definidos y rítmicos de las ondas triangulares junto a matices suaves y continuos de las ondas sinusoidales.',
   'src/assets/images/terrarios/tr01.jpg',
   '{"ecosistema": "Abierto", "recipiente": "Vidrio", "medidas": "25 × 20 × 17 cm"}',
   array['Haworthia Attenuata', 'Haworthia Fasciata', 'Haworthia Venosa'],
   array['triangle', 'sine'],
   '{"riego_days": 30, "ventilacion_days": null, "humidity": [35, 60], "temp": [15, 26], "light": "Indirecta", "light_hours": [5, 8]}'),

  ('02', 'TR02', 'publicado', '2026-07-22', 198,
   'La condensación del vidrio vuelve a la tierra en gotas. Cada una dejó una nota corta y brillante.',
   'src/assets/images/terrarios/tr02.jpg', null, null, null,
   '{"riego_days": 30, "ventilacion_days": 2, "humidity": [80, 95], "temp": [18, 24], "light": "Indirecta", "light_hours": [4, 7]}'),

  ('03', 'TR03', 'publicado', '2026-08-30', 236,
   'Cuatro piedras y un helecho que crece entre ellas. Un ritmo quieto, con silencios largos.',
   'src/assets/images/terrarios/tr03.jpg', null, null, null,
   '{"riego_days": 30, "ventilacion_days": 3, "humidity": [70, 90], "temp": [18, 24], "light": "Indirecta", "light_hours": [4, 8]}'),

  ('04', 'TR04', 'publicado', '2026-10-09', 222,
   'Cada microfluctuación de esta planta se convirtió en una pieza sonora única.',
   'src/assets/images/terrarios/tr04.jpg', null, null, null,
   '{"riego_days": 30, "ventilacion_days": 3, "humidity": [70, 90], "temp": [18, 25], "light": "Indirecta", "light_hours": [5, 8]}'),

  ('05', 'TR05', 'publicado', '2026-09-12', 264,
   'Una suculenta que casi no se mueve. Su pieza avanza como sus raíces: de a poco y hacia abajo.',
   'src/assets/images/terrarios/tr05.jpg', null, null, null,
   '{"riego_days": 30, "ventilacion_days": 7, "humidity": [40, 60], "temp": [18, 28], "light": "Sol suave", "light_hours": [6, 10]}');
