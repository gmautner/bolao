-- 002_seed_copa2026.sql
-- Copa do Mundo FIFA 2026 — Tabela oficial completa (fonte: Fox Sports / FIFA)
-- Horários em UTC. Fase de Grupos: 11/jun–27/jun. Final: 19/jul.

-- ============================================================
-- PESOS POR DIA DE JOGO (peso inicial 10, +1 por dia de jogo)
-- ============================================================
INSERT INTO match_day_weights (day_number, match_date, weight) VALUES
-- Fase de Grupos (17 dias: 11 jun – 27 jun)
(1,  '2026-06-11', 10),
(2,  '2026-06-12', 11),
(3,  '2026-06-13', 12),
(4,  '2026-06-14', 13),
(5,  '2026-06-15', 14),
(6,  '2026-06-16', 15),
(7,  '2026-06-17', 16),
(8,  '2026-06-18', 17),
(9,  '2026-06-19', 18),
(10, '2026-06-20', 19),
(11, '2026-06-21', 20),
(12, '2026-06-22', 21),
(13, '2026-06-23', 22),
(14, '2026-06-24', 23),
(15, '2026-06-25', 24),
(16, '2026-06-26', 25),
(17, '2026-06-27', 26),
-- Round de 32 (6 dias: 28 jun – 3 jul)
(18, '2026-06-28', 27),
(19, '2026-06-29', 28),
(20, '2026-06-30', 29),
(21, '2026-07-01', 30),
(22, '2026-07-02', 31),
(23, '2026-07-03', 32),
-- Oitavas de Final (4 dias: 4 jul – 7 jul)
(24, '2026-07-04', 33),
(25, '2026-07-05', 34),
(26, '2026-07-06', 35),
(27, '2026-07-07', 36),
-- Quartas de Final (3 dias: 9 jul, 10 jul, 11 jul)
(28, '2026-07-09', 37),
(29, '2026-07-10', 38),
(30, '2026-07-11', 39),
-- Semifinal (2 dias: 14 jul, 15 jul)
(31, '2026-07-14', 40),
(32, '2026-07-15', 41),
-- Disputa de 3º Lugar e Final
(33, '2026-07-18', 42),
(34, '2026-07-19', 43)
ON CONFLICT (day_number) DO NOTHING;

-- ============================================================
-- FASE DE GRUPOS — 72 PARTIDAS
-- Grupos: A=México, B=Canadá, C=Brasil, D=EUA,
--         E=Alemanha, F=Holanda, G=Bélgica, H=Espanha,
--         I=França, J=Argentina, K=Portugal, L=Inglaterra
-- TBD Playoff UEFA A/B/C/D = vagas de playoffs europeus
-- TBD Playoff IC 1/2 = vagas de playoffs intercontinentais
-- ============================================================

-- DIA 1 — 11 jun (peso 10)
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('group', 1, 'A', 'México',      'África do Sul',   '2026-06-11 23:00:00+00', 'Estadio Azteca',  'Cidade do México', 1),
('group', 2, 'A', 'Coreia do Sul','TBD Playoff UEFA','2026-06-12 06:00:00+00', 'Estadio Akron',   'Guadalajara',      1);

-- DIA 2 — 12 jun (peso 11)
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('group', 3, 'B', 'Canadá',         'TBD Playoff UEFA','2026-06-12 23:00:00+00', 'BMO Field',    'Toronto',     2),
('group', 4, 'D', 'Estados Unidos',  'Paraguai',        '2026-06-13 05:00:00+00', 'SoFi Stadium', 'Los Angeles', 2);

-- DIA 3 — 13 jun (peso 12)
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('group', 5,  'B', 'Catar',     'Suíça',          '2026-06-13 23:00:00+00', 'Levi''s Stadium',         'San Francisco', 3),
('group', 6,  'C', 'Brasil',    'Marrocos',        '2026-06-14 02:00:00+00', 'MetLife Stadium',         'Nova York/NJ',  3),
('group', 7,  'C', 'Haiti',     'Escócia',         '2026-06-14 05:00:00+00', 'Gillette Stadium',        'Boston',        3);

-- DIA 4 — 14 jun (peso 13)
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('group', 8,  'D', 'Austrália',         'TBD Playoff UEFA', '2026-06-14 08:00:00+00', 'BC Place',                'Vancouver',    4),
('group', 9,  'E', 'Alemanha',           'Curaçao',           '2026-06-14 21:00:00+00', 'NRG Stadium',             'Houston',      4),
('group', 10, 'F', 'Holanda',            'Japão',              '2026-06-15 00:00:00+00', 'AT&T Stadium',            'Dallas',       4),
('group', 11, 'E', 'Costa do Marfim',   'Equador',            '2026-06-15 03:00:00+00', 'Lincoln Financial Field', 'Philadelphia', 4),
('group', 12, 'F', 'TBD Playoff UEFA', 'Tunísia',             '2026-06-15 06:00:00+00', 'Estadio BBVA',            'Monterrey',    4);

-- DIA 5 — 15 jun (peso 14)
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('group', 13, 'H', 'Espanha',       'Cabo Verde',    '2026-06-15 20:00:00+00', 'Mercedes-Benz Stadium', 'Atlanta',    5),
('group', 14, 'G', 'Bélgica',       'Egito',          '2026-06-15 23:00:00+00', 'Lumen Field',           'Seattle',    5),
('group', 15, 'H', 'Arábia Saudita','Uruguai',        '2026-06-16 02:00:00+00', 'Hard Rock Stadium',     'Miami',      5),
('group', 16, 'G', 'Irã',           'Nova Zelândia',  '2026-06-16 05:00:00+00', 'SoFi Stadium',          'Los Angeles',5);

-- DIA 6 — 16 jun (peso 15)
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('group', 17, 'I', 'França',        'Senegal',        '2026-06-16 23:00:00+00', 'MetLife Stadium',   'Nova York/NJ',  6),
('group', 18, 'I', 'TBD Playoff IC','Noruega',         '2026-06-17 02:00:00+00', 'Gillette Stadium',  'Boston',        6),
('group', 19, 'J', 'Argentina',     'Argélia',         '2026-06-17 05:00:00+00', 'Arrowhead Stadium', 'Kansas City',   6);

-- DIA 7 — 17 jun (peso 16)
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('group', 20, 'J', 'Áustria',    'Jordânia',         '2026-06-17 08:00:00+00', 'Levi''s Stadium', 'San Francisco',    7),
('group', 21, 'K', 'Portugal',   'TBD Playoff IC',   '2026-06-17 21:00:00+00', 'NRG Stadium',     'Houston',          7),
('group', 22, 'L', 'Inglaterra', 'Croácia',            '2026-06-18 00:00:00+00', 'AT&T Stadium',    'Dallas',           7),
('group', 23, 'L', 'Gana',       'Panamá',             '2026-06-18 03:00:00+00', 'BMO Field',       'Toronto',          7),
('group', 24, 'K', 'Uzbequistão','Colômbia',           '2026-06-18 06:00:00+00', 'Estadio Azteca',  'Cidade do México', 7);

-- DIA 8 — 18 jun (peso 17)
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('group', 25, 'A', 'TBD Playoff UEFA','África do Sul', '2026-06-18 20:00:00+00', 'Mercedes-Benz Stadium','Atlanta',    8),
('group', 26, 'B', 'Suíça',           'TBD Playoff UEFA','2026-06-18 23:00:00+00','SoFi Stadium',        'Los Angeles',8),
('group', 27, 'B', 'Canadá',          'Catar',           '2026-06-19 02:00:00+00', 'BC Place',            'Vancouver',  8),
('group', 28, 'A', 'México',          'Coreia do Sul',   '2026-06-19 05:00:00+00', 'Estadio Akron',       'Guadalajara',8);

-- DIA 9 — 19 jun (peso 18)
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('group', 29, 'D', 'Estados Unidos',  'Austrália',       '2026-06-19 23:00:00+00', 'Lumen Field',             'Seattle',       9),
('group', 30, 'C', 'Escócia',         'Marrocos',         '2026-06-20 02:00:00+00', 'Gillette Stadium',        'Boston',        9),
('group', 31, 'C', 'Brasil',          'Haiti',             '2026-06-20 05:00:00+00', 'Lincoln Financial Field', 'Philadelphia',  9);

-- DIA 10 — 20 jun (peso 19)
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('group', 32, 'D', 'TBD Playoff UEFA','Paraguai',        '2026-06-20 08:00:00+00', 'Levi''s Stadium', 'San Francisco', 10),
('group', 33, 'F', 'Holanda',         'TBD Playoff UEFA','2026-06-20 21:00:00+00', 'NRG Stadium',     'Houston',       10),
('group', 34, 'E', 'Alemanha',        'Costa do Marfim', '2026-06-21 00:00:00+00', 'BMO Field',       'Toronto',       10),
('group', 35, 'E', 'Equador',         'Curaçao',          '2026-06-21 04:00:00+00', 'Arrowhead Stadium','Kansas City',  10);

-- DIA 11 — 21 jun (peso 20)
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('group', 36, 'F', 'Tunísia',       'Japão',           '2026-06-21 08:00:00+00', 'Estadio BBVA',          'Monterrey',  11),
('group', 37, 'H', 'Espanha',       'Arábia Saudita',  '2026-06-21 20:00:00+00', 'Mercedes-Benz Stadium', 'Atlanta',    11),
('group', 38, 'G', 'Bélgica',       'Irã',              '2026-06-21 23:00:00+00', 'SoFi Stadium',          'Los Angeles',11),
('group', 39, 'H', 'Uruguai',       'Cabo Verde',       '2026-06-22 02:00:00+00', 'Hard Rock Stadium',     'Miami',      11),
('group', 40, 'G', 'Nova Zelândia', 'Egito',             '2026-06-22 05:00:00+00', 'BC Place',              'Vancouver',  11);

-- DIA 12 — 22 jun (peso 21)
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('group', 41, 'J', 'Argentina', 'Áustria',          '2026-06-22 21:00:00+00', 'AT&T Stadium',           'Dallas',        12),
('group', 42, 'I', 'França',    'TBD Playoff IC',   '2026-06-23 01:00:00+00', 'Lincoln Financial Field','Philadelphia',  12),
('group', 43, 'I', 'Noruega',   'Senegal',           '2026-06-23 04:00:00+00', 'MetLife Stadium',        'Nova York/NJ',  12),
('group', 44, 'J', 'Jordânia',  'Argélia',           '2026-06-23 07:00:00+00', 'Levi''s Stadium',        'San Francisco', 12);

-- DIA 13 — 23 jun (peso 22)
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('group', 45, 'K', 'Portugal',   'Uzbequistão',  '2026-06-23 21:00:00+00', 'NRG Stadium',     'Houston',     13),
('group', 46, 'L', 'Inglaterra', 'Gana',          '2026-06-24 00:00:00+00', 'Gillette Stadium','Boston',      13),
('group', 47, 'L', 'Panamá',     'Croácia',       '2026-06-24 03:00:00+00', 'BMO Field',       'Toronto',     13),
('group', 48, 'K', 'Colômbia',   'TBD Playoff IC','2026-06-24 06:00:00+00', 'Estadio Akron',   'Guadalajara', 13);

-- DIA 14 — 24 jun — 3ª rodada simultânea Grupos A, B, C (peso 23)
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('group', 49, 'B', 'Suíça',            'Canadá',           '2026-06-24 23:00:00+00', 'BC Place',             'Vancouver',       14),
('group', 50, 'B', 'TBD Playoff UEFA', 'Catar',            '2026-06-24 23:00:00+00', 'Lumen Field',          'Seattle',         14),
('group', 51, 'C', 'Escócia',          'Brasil',            '2026-06-25 02:00:00+00', 'Hard Rock Stadium',    'Miami',           14),
('group', 52, 'C', 'Marrocos',         'Haiti',             '2026-06-25 02:00:00+00', 'Mercedes-Benz Stadium','Atlanta',         14),
('group', 53, 'A', 'TBD Playoff UEFA', 'México',           '2026-06-25 05:00:00+00', 'Estadio Azteca',       'Cidade do México',14),
('group', 54, 'A', 'África do Sul',    'Coreia do Sul',     '2026-06-25 05:00:00+00', 'Estadio BBVA',         'Monterrey',       14);

-- DIA 15 — 25 jun — 3ª rodada simultânea Grupos D, E, F (peso 24)
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('group', 55, 'E', 'Equador',          'Alemanha',          '2026-06-26 00:00:00+00', 'MetLife Stadium',        'Nova York/NJ',  15),
('group', 56, 'E', 'Curaçao',          'Costa do Marfim',   '2026-06-26 00:00:00+00', 'Lincoln Financial Field','Philadelphia',  15),
('group', 57, 'F', 'Tunísia',          'Holanda',            '2026-06-26 03:00:00+00', 'Arrowhead Stadium',      'Kansas City',   15),
('group', 58, 'F', 'Japão',            'TBD Playoff UEFA',  '2026-06-26 03:00:00+00', 'AT&T Stadium',           'Dallas',        15),
('group', 59, 'D', 'TBD Playoff UEFA', 'Estados Unidos',    '2026-06-26 06:00:00+00', 'SoFi Stadium',           'Los Angeles',   15),
('group', 60, 'D', 'Paraguai',         'Austrália',          '2026-06-26 06:00:00+00', 'Levi''s Stadium',        'San Francisco', 15);

-- DIA 16 — 26 jun — 3ª rodada simultânea Grupos G, H, I (peso 25)
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('group', 61, 'I', 'Noruega',   'França',          '2026-06-26 23:00:00+00', 'Gillette Stadium','Boston',      16),
('group', 62, 'I', 'Senegal',   'TBD Playoff IC',  '2026-06-26 23:00:00+00', 'BMO Field',       'Toronto',     16),
('group', 63, 'H', 'Uruguai',   'Espanha',          '2026-06-27 04:00:00+00', 'Estadio Akron',   'Guadalajara', 16),
('group', 64, 'H', 'Cabo Verde','Arábia Saudita',   '2026-06-27 04:00:00+00', 'NRG Stadium',     'Houston',     16),
('group', 65, 'G', 'Nova Zelândia','Bélgica',       '2026-06-27 07:00:00+00', 'BC Place',        'Vancouver',   16),
('group', 66, 'G', 'Egito',     'Irã',              '2026-06-27 07:00:00+00', 'Lumen Field',     'Seattle',     16);

-- DIA 17 — 27 jun — 3ª rodada simultânea Grupos J, K, L (peso 26)
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('group', 67, 'L', 'Panamá',          'Inglaterra',     '2026-06-28 01:00:00+00', 'MetLife Stadium',        'Nova York/NJ',   17),
('group', 68, 'L', 'Croácia',         'Gana',           '2026-06-28 01:00:00+00', 'Lincoln Financial Field','Philadelphia',   17),
('group', 69, 'K', 'Colômbia',        'Portugal',       '2026-06-28 03:30:00+00', 'Hard Rock Stadium',      'Miami',          17),
('group', 70, 'K', 'TBD Playoff IC',  'Uzbequistão',   '2026-06-28 03:30:00+00', 'Mercedes-Benz Stadium',  'Atlanta',        17),
('group', 71, 'J', 'Jordânia',        'Argentina',      '2026-06-28 06:00:00+00', 'AT&T Stadium',           'Dallas',         17),
('group', 72, 'J', 'Argélia',         'Áustria',        '2026-06-28 06:00:00+00', 'Arrowhead Stadium',      'Kansas City',    17);

-- ============================================================
-- ROUND DE 32 — 16 PARTIDAS (times a definir pelo superadmin)
-- ============================================================
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
-- Jun 28 (Day 18, peso 27)
('round_of_32', 73, '', '', '', '2026-06-28 23:00:00+00', 'SoFi Stadium',            'Los Angeles',     18),
-- Jun 29 (Day 19, peso 28)
('round_of_32', 74, '', '', '', '2026-06-29 21:00:00+00', 'NRG Stadium',             'Houston',         19),
('round_of_32', 75, '', '', '', '2026-06-30 00:30:00+00', 'Gillette Stadium',        'Boston',          19),
('round_of_32', 76, '', '', '', '2026-06-30 05:00:00+00', 'Estadio BBVA',            'Monterrey',       19),
-- Jun 30 (Day 20, peso 29)
('round_of_32', 77, '', '', '', '2026-06-30 21:00:00+00', 'AT&T Stadium',            'Dallas',          20),
('round_of_32', 78, '', '', '', '2026-07-01 01:00:00+00', 'MetLife Stadium',         'Nova York/NJ',    20),
('round_of_32', 79, '', '', '', '2026-07-01 05:00:00+00', 'Estadio Azteca',          'Cidade do México',20),
-- Jul 1 (Day 21, peso 30)
('round_of_32', 80, '', '', '', '2026-07-01 20:00:00+00', 'Mercedes-Benz Stadium',   'Atlanta',         21),
('round_of_32', 81, '', '', '', '2026-07-02 00:00:00+00', 'Lumen Field',             'Seattle',         21),
('round_of_32', 82, '', '', '', '2026-07-02 04:00:00+00', 'Levi''s Stadium',         'San Francisco',   21),
-- Jul 2 (Day 22, peso 31)
('round_of_32', 83, '', '', '', '2026-07-02 23:00:00+00', 'SoFi Stadium',            'Los Angeles',     22),
('round_of_32', 84, '', '', '', '2026-07-03 03:00:00+00', 'BMO Field',               'Toronto',         22),
('round_of_32', 85, '', '', '', '2026-07-03 07:00:00+00', 'BC Place',                'Vancouver',       22),
-- Jul 3 (Day 23, peso 32)
('round_of_32', 86, '', '', '', '2026-07-03 22:00:00+00', 'AT&T Stadium',            'Dallas',          23),
('round_of_32', 87, '', '', '', '2026-07-04 02:00:00+00', 'Hard Rock Stadium',       'Miami',           23),
('round_of_32', 88, '', '', '', '2026-07-04 05:30:00+00', 'Arrowhead Stadium',       'Kansas City',     23);

-- ============================================================
-- OITAVAS DE FINAL — 8 PARTIDAS
-- ============================================================
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
-- Jul 4 (Day 24, peso 33)
('round_of_16', 89, '', '', '', '2026-07-04 21:00:00+00', 'NRG Stadium',             'Houston',         24),
('round_of_16', 90, '', '', '', '2026-07-05 01:00:00+00', 'Lincoln Financial Field', 'Philadelphia',    24),
-- Jul 5 (Day 25, peso 34)
('round_of_16', 91, '', '', '', '2026-07-06 00:00:00+00', 'MetLife Stadium',         'Nova York/NJ',    25),
('round_of_16', 92, '', '', '', '2026-07-06 04:00:00+00', 'Estadio Azteca',          'Cidade do México',25),
-- Jul 6 (Day 26, peso 35)
('round_of_16', 93, '', '', '', '2026-07-06 23:00:00+00', 'AT&T Stadium',            'Dallas',          26),
('round_of_16', 94, '', '', '', '2026-07-07 04:00:00+00', 'Lumen Field',             'Seattle',         26),
-- Jul 7 (Day 27, peso 36)
('round_of_16', 95, '', '', '', '2026-07-07 20:00:00+00', 'Mercedes-Benz Stadium',   'Atlanta',         27),
('round_of_16', 96, '', '', '', '2026-07-08 00:00:00+00', 'BC Place',                'Vancouver',       27);

-- ============================================================
-- QUARTAS DE FINAL — 4 PARTIDAS
-- ============================================================
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
-- Jul 9 (Day 28, peso 37)
('quarterfinal', 97, '', '', '', '2026-07-10 00:00:00+00', 'Gillette Stadium',   'Boston',       28),
-- Jul 10 (Day 29, peso 38)
('quarterfinal', 98, '', '', '', '2026-07-10 23:00:00+00', 'SoFi Stadium',       'Los Angeles',  29),
-- Jul 11 (Day 30, peso 39)
('quarterfinal', 99, '', '', '', '2026-07-12 01:00:00+00', 'Hard Rock Stadium',  'Miami',        30),
('quarterfinal',100, '', '', '', '2026-07-12 05:00:00+00', 'Arrowhead Stadium',  'Kansas City',  30);

-- ============================================================
-- SEMIFINAIS — 2 PARTIDAS
-- ============================================================
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('semifinal', 101, '', '', '', '2026-07-14 23:00:00+00', 'AT&T Stadium',            'Dallas',       31),
('semifinal', 102, '', '', '', '2026-07-15 23:00:00+00', 'Mercedes-Benz Stadium',   'Atlanta',      32);

-- ============================================================
-- DISPUTA DE 3º LUGAR E FINAL
-- ============================================================
INSERT INTO matches (phase, match_number, group_name, home_team, away_team, match_time, stadium, city, day_number) VALUES
('third_place', 103, '', '', '', '2026-07-19 01:00:00+00', 'Hard Rock Stadium',  'Miami',          33),
('final',       104, '', '', '', '2026-07-19 23:00:00+00', 'MetLife Stadium',    'Nova York/NJ',   34);
