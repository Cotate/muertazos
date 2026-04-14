-- Players INSERT script
-- Assumes country_id: 1=spain, 2=brazil, 3=mexico
-- Adjust country_id values if your mapping differs
-- Run in Supabase SQL editor

-- ============================================================
-- ESPAÑA (country_id = 1)
-- ============================================================

-- 1K FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 1, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Achraf Laiti'),('Cristian Faura'),('Eric Jiménez'),('Erik Beattie'),('Gerard Verge'),
  ('Guelmi Pons'),('Isma Reguia'),('Iván Rivera'),('Joel Navas'),('Joel Paredes'),
  ('Karim Moya'),('Michel Owono'),('Pau ''ZZ'' Ruiz'),('Pol Lechuga')
) AS v(name)
WHERE t.name = '1K FC' AND t.competition_key = 'kings';

-- El Barrio
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 1, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Carlos Val'),('Cristian Ubón'),('Gerard Puigvert'),('Haitam Babia'),('Hugo Eyre'),
  ('Joel Bañuls'),('Ñito Martín'),('Pablo Saborido'),('Pau Fernández'),('Pol Molés'),
  ('Robert Vallribera'),('Sergio Fernández'),('Sergio Herrero')
) AS v(name)
WHERE t.name = 'El Barrio' AND t.competition_key = 'kings';

-- Jijantes FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 1, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Álex Cañero'),('Cristian Gómez'),('Cristian Lobato'),('Dani Martí'),('Daniel Plaza'),
  ('David Toro'),('Iker Hernández'),('Ion Vázquez'),('José Segovia'),('Juanpe Nzo'),
  ('Marc Montejo'),('Mario León'),('Michel Herrero'),('Pau Fer'),('Sergi Torres'),
  ('Víctor Pérez Bello')
) AS v(name)
WHERE t.name = 'Jijantes FC' AND t.competition_key = 'kings';

-- La Capital CF
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 1, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Antoni Hernández'),('Daniel Pérez'),('Daouda Bamma'),('Iñaki Villalba'),('Julen Álvarez'),
  ('Manel Jiménez'),('Manuel Martín'),('Mario Victorio'),('Omar Dambelleh'),('Pablo Beguer'),
  ('Sergi Vives'),('Sohaib Rektout')
) AS v(name)
WHERE t.name = 'La Capital CF' AND t.competition_key = 'kings';

-- Los Troncos FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 1, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Aleix Semur'),('Alex Cubedo'),('Álvaro Arché'),('Carles Planas'),('Carlos Contreras'),
  ('Daniel Tamayo'),('David Reyes'),('Eloy Amoedo'),('Joan Oriol'),('Mark Sorroche'),
  ('Masi Dabo'),('Sagar Escoto'),('Victor Oribe'),('Yaroslav Toporkov')
) AS v(name)
WHERE t.name = 'Los Troncos FC' AND t.competition_key = 'kings';

-- PIO FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 1, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Adri Espinar'),('Adrián Frutos'),('Álex Sánchez'),('Fernando Velillas'),('Iker Bartolomé'),
  ('Izan Grande'),('Joan Luque'),('Luis García'),('Marc Briones'),('Marc Grifell'),
  ('Marcos Ibañez'),('Pol Benito'),('Sergio Mulero'),('Yeray Muñoz')
) AS v(name)
WHERE t.name = 'PIO FC' AND t.competition_key = 'kings';

-- Porcinos FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 1, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Aitor Vives'),('Dani Pérez'),('David Soriano'),('Edgar Alvaro'),('Fouad El Amrani'),
  ('Gerard Gómez'),('Marc Pelaz'),('Nadir Louah'),('Nico Santos'),('Oscar Coll'),
  ('Ricard Pujol'),('Roger Carbó'),('Tomeu Nadal'),('Victor Nofuentes')
) AS v(name)
WHERE t.name = 'Porcinos FC' AND t.competition_key = 'kings';

-- Rayo de Barcelona
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 1, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Abde Bakkali'),('Adrià Escribano'),('Alhagi Marie Touray'),('Carlos Heredia'),('Carlos Omabegho'),
  ('David Moreno'),('Gerard Oliva'),('Guillem ''ZZ'' Ruiz'),('Ismael González'),('Iván Torres'),
  ('Jordi Gómez'),('Jorge Ibáñez'),('Roc Bancells')
) AS v(name)
WHERE t.name = 'Rayo de Barcelona' AND t.competition_key = 'kings';

-- Saiyans FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 1, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Albert Garcia'),('Borja Montejo'),('Dani Santiago'),('Diego Jiménez'),('Feliu Torrus'),
  ('Gerard Vacas'),('Gio Ferinu'),('Isaac Maldonado'),('Iván Fajardo'),('Juanan Gallego'),
  ('Pablo Fernández'),('Sergi Gestí')
) AS v(name)
WHERE t.name = 'Saiyans FC' AND t.competition_key = 'kings';

-- Skull FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 1, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Alberto Arnalot'),('Álex Salas'),('Dani Santos'),('David Asensio'),('David ''Burrito'' Ruiz'),
  ('Jorge Escobar'),('José Hermosa'),('Kevin Zárate'),('Koke Navares'),('Manu García'),
  ('Nano Modrego'),('Pablo de Castro'),('Raúl Escobar'),('Roberto Tobe'),('Samuel Aparicio'),
  ('Víctor Mongil')
) AS v(name)
WHERE t.name = 'Skull FC' AND t.competition_key = 'kings';

-- Ultimate Móstoles
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 1, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Aleix Hernando'),('Aleix Lage'),('Aleix Martí'),('Alex ''Capi'' Domingo'),('David Grifell'),
  ('Eloy Pizarro'),('Ferran Corominas'),('Javi Espinosa'),('Josep Riart'),('Juan Lorente'),
  ('Marc Granero'),('Mikhail Prokopev'),('Víctor Vidal')
) AS v(name)
WHERE t.name = 'Ultimate Móstoles' AND t.competition_key = 'kings';

-- xBuyer Team
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 1, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Aleix Ruiz'),('Álex Romero'),('Eric Pérez'),('Eric Sánchez'),('Galde Hugue'),
  ('Jacobo Liencres'),('Javier Comas'),('Joel Espinosa'),('Juanma González'),('Mario Reyes'),
  ('Sergio Campos'),('Sergio ''Chechi'' Costa'),('Víctor Vargas'),('Xavier Cabezas'),('Zaid Saban')
) AS v(name)
WHERE t.name = 'xBuyer Team' AND t.competition_key = 'kings';

-- ============================================================
-- BRASIL (country_id = 2)
-- ============================================================

-- Capim FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 2, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Álex Guti'),('Breno Arantes'),('Dani Liñares'),('Gabriel ''Dudu'''),('Gerard Nolla'),
  ('Igo Canindé'),('Jeferson Titon'),('Lucas ''Caroço'''),('Lucas Hector'),('Marcos ''Bolivia'''),
  ('Murillo Donato'),('Rafa Sousa'),('Thiago Santos'),('Wallace Rafael')
) AS v(name)
WHERE t.name = 'Capim FC' AND t.competition_key = 'kings';

-- Dendele FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 2, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Bruninho Mandarino'),('Cristhian ''Canhoto'''),('Gabriel Repulho'),('Gui Carvalho'),('Gustavo Húngaro'),
  ('Leonardo ''Belletti'''),('Lucas ''L7'''),('Luís Henrique ''Boolt'''),('Lyncoln Oliveira'),('Maikon Santos'),
  ('Marquinhos Samora'),('Nicollas Nascimento'),('Ryan Soares')
) AS v(name)
WHERE t.name = 'Dendele FC' AND t.competition_key = 'kings';

-- DesimpaiN
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 2, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Andrey Profeta'),('Christian Santos'),('Danilo Alemão'),('Davi Ilario'),('Douglinha Melo'),
  ('Gabriel Lopes'),('Gui Nascimento'),('Juvenal Oliveira'),('Kaiky Souza'),('Luisinho Alves'),
  ('Victor ''Bolt'''),('Victor ''VB'' Bueno'),('Wellinton ''Gigante'''),('William Costa')
) AS v(name)
WHERE t.name = 'DesimpaiN' AND t.competition_key = 'kings';

-- Dibrados FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 2, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Bruno Mota'),('Chay Medeiros'),('Daniel Ferreira'),('Edda Marcelino'),('Etinho Lima'),
  ('Fael Magalhães'),('Gabriel Costa'),('Henrique Wruck'),('Jonatas ''Batman'''),('Luan Teles'),
  ('Lucas ''Pulguinha'''),('Luiggi Longo'),('Marcello ''Marcelinho'' Junior'),('Matheus Bueno'),
  ('Matheus ''Índio'''),('Raphael Augusto'),('Ricardinho Braga'),('Ruan Major'),('Sidney Pages')
) AS v(name)
WHERE t.name = 'Dibrados FC' AND t.competition_key = 'kings';

-- Fluxo FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 2, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Bruno Ferreira'),('Douglas ''Doth'''),('Gustavinho Henrique'),('Helber Júnior'),('Jheferson Falcão'),
  ('João Pedro'),('Marcos ''MV'''),('Matheus ''Chaveirinho'''),('Murillo Pulino'),('Paulo ''Pinguinho'''),
  ('Renan Augusto'),('Tuco Magalhães'),('Well Andrade')
) AS v(name)
WHERE t.name = 'Fluxo FC' AND t.competition_key = 'kings';

-- Furia FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 2, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Jeffinho Honorato'),('Jhow Love'),('João Pelegrini'),('Kenu Leandro'),('Leleti Garcia'),
  ('Lipão Pinheiro'),('Lucas Nascimento'),('Luiz Camilo'),('Matheus ''Dedo'''),('Rafael ''Tambinha'''),
  ('Thiago ''Major'''),('Tiago Marinho'),('Victor Hugo'),('Vitor ''Barba''')
) AS v(name)
WHERE t.name = 'Furia FC' AND t.competition_key = 'kings';

-- G3X FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 2, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Andreas Vaz'),('Everton Felipe'),('Gabriel Braga'),('Gabriel Medeiros'),('Gabriel Messias'),
  ('João Guimarães'),('Josildo Barata'),('Kelvin Oliveira'),('Marinho Filho'),('Matheus Rufino'),
  ('Ryan Lima'),('Thiago ''TH'' Brito'),('Wembley Luiz')
) AS v(name)
WHERE t.name = 'G3X FC' AND t.competition_key = 'kings';

-- LOUD SC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 2, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Arthur Facas'),('Caio Felipe'),('Daniel Shiraishi'),('Esaú Nascimento'),('Felipe Cassiano'),
  ('Felipe Viana'),('Maicon ''Barata'''),('Matheus ''Biro'''),('Paulo ''Pulão'''),('Rafinha Cunha'),
  ('Sam Silva'),('Walid Jaadi')
) AS v(name)
WHERE t.name = 'LOUD SC' AND t.competition_key = 'kings';

-- Nyvelados FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 2, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Ailton José'),('Bruno ''Gan'''),('Carlos ''Ferrão'''),('Daniel Coringa'),('Danilo Belém'),
  ('Dieguinho Assis'),('Everton ''Chiclete'' Araújo'),('Igor ''BB'''),('Léo ''Gol'''),('Luandrio ''Pé Fino'''),
  ('Lucas ''Japa'''),('Luisinho Barreiros'),('Maicon Macabeu'),('Matheus Klynsmann'),('Vanderson ''Neguiim Jr''')
) AS v(name)
WHERE t.name = 'Nyvelados FC' AND t.competition_key = 'kings';

-- Podpah Funkbol Clube
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 2, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Caio Miranda'),('Gustavo Silva'),('Igor Campos'),('João ''Choco'''),('Juninho Antunes'),
  ('Leléo Moura'),('Luan ''Mestre'''),('Martín Lara'),('Rafão ''Portuga'''),('Ronaldinho Reis'),
  ('Vini Alexandre'),('William Jesus'),('Yan ''Coringa''')
) AS v(name)
WHERE t.name = 'Podpah Funkbol Clube' AND t.competition_key = 'kings';

-- ============================================================
-- MÉXICO (country_id = 3)
-- ============================================================

-- Aniquiladores FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 3, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Axur Quintero'),('Brayan González'),('Brayan Hernández'),('Brihan Gutiérrez'),('Daviz Junco'),
  ('Denilson Lobón'),('Diego Martínez'),('Erik Fraire'),('Jacob ''Lobo'' Morales'),('Martín ''Cani'' Rodríguez'),
  ('Nelson Velandia'),('Patricio ''Pato'' Arias')
) AS v(name)
WHERE t.name = 'Aniquiladores FC' AND t.competition_key = 'kings';

-- Atlético Parceros FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 3, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Alexis Gómez'),('Andrés Osorno'),('Angellot Caro'),('Cristian Hernández'),('David Loaiza'),
  ('Felipe Urán'),('Juan Tilano'),('Julio Perea'),('Kevin Mejía'),('Maicol Hernández'),
  ('Marlon Ramírez'),('Simón Duque')
) AS v(name)
WHERE t.name = 'Atlético Parceros FC' AND t.competition_key = 'kings';

-- Club de Cuervos
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 3, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Adriano Nunes'),('Ángel Ayala'),('Armando Chávez'),('Baruc Ochoa'),('Brandon Magaña'),
  ('César Romo'),('Diego Velázquez'),('Edder Vargas'),('Edson González'),('Fausto Alemán'),
  ('Hugo Murga'),('Jorge Escamilla'),('José Askenazi'),('Luis Valdés'),('Roberto Uribe')
) AS v(name)
WHERE t.name = 'Club de Cuervos' AND t.competition_key = 'kings';

-- Galácticos del Caribe
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 3, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Alejandro ''Maro'' Ortega'),('Daniel Mendoza'),('Diego Franco'),('Erick Guzmán'),('Erick Madrigal'),
  ('Iván Muñoz'),('Jairo Tapie'),('Jesús Carbajal'),('José Hernández'),('Kevin Cardona'),
  ('Pabel Montes'),('Pablo Gómez')
) AS v(name)
WHERE t.name = 'Galácticos del Caribe' AND t.competition_key = 'kings';

-- Guerrilla FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 3, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Abraham Morales'),('Adrián Mora'),('Alain Villanueva'),('Albano Rodríguez'),('Eduardo Velarde'),
  ('Gerardo Ramírez'),('Gustavo ''Furby'' Guillén'),('Isaac Zepeda'),('Jair Peláez'),('Juan Carlos Silva'),
  ('Miguel Lizardo'),('Morrison Palma'),('Omar Láscari'),('Rafael Cid'),('Said Zamora'),('Yudier Prado')
) AS v(name)
WHERE t.name = 'Guerrilla FC' AND t.competition_key = 'kings';

-- KRÜ FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 3, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Aaron Martínez'),('Alberto García'),('Christopher Pedraza'),('Dago Campari'),('Edson Trejo'),
  ('Erik Lugo'),('Facu Romero'),('Gonzalo Lescano'),('Jeancob Ramírez'),('Mauricio Reyna'),
  ('Santiago Rotemberg'),('Tomás Sandoval')
) AS v(name)
WHERE t.name = 'KRÜ FC' AND t.competition_key = 'kings';

-- Los Aliens FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 3, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Alan Mendoza'),('Brayam Nazarit'),('Daniel Ríos'),('David Ortiz'),('Diego Abella'),
  ('Erik Vera'),('James Hernández'),('Jesús ''Chuy'' Pérez'),('Jorge Meléndez'),('Juan Ramírez'),
  ('Julio Torres'),('Ricardo Valencia')
) AS v(name)
WHERE t.name = 'Los Aliens FC' AND t.competition_key = 'kings';

-- Los Chamos FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 3, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Alexis López'),('Álvaro Bocanegra'),('Carlos Escalona'),('Christian Lagunas'),('Cristian Hernández'),
  ('Genaro Castillo'),('Gustavo Miranda'),('Irvin Mojica'),('Jesús López'),('Juan Cisneros'),
  ('Román Ramírez'),('Salvador Navarro'),('Tonatiuh Mejía'),('Uriel Zuart')
) AS v(name)
WHERE t.name = 'Los Chamos FC' AND t.competition_key = 'kings';

-- Peluche Caligari
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 3, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Aarón Del Real'),('Aldair Giorgana'),('Ángel ''Curry'' Castro'),('Carlos ''Camello'' Valdez'),('César Vallejo'),
  ('Christian Gimenez'),('Daniel Quiroz'),('Eddie Sánchez'),('Eder Giorgana'),('Fernando Morales'),
  ('Hugo Rodríguez'),('Josecarlos Van Rankin'),('Mauricio Huitrón'),('Michelle ''Chucky'' Castro'),
  ('Moisés Dabbah'),('Pablo Barrera'),('Santiago Lagarde')
) AS v(name)
WHERE t.name = 'Peluche Caligari' AND t.competition_key = 'kings';

-- Persas FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 3, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Antonio Monterde'),('Diego Rodríguez'),('Doido Santos'),('Gustavo Ramos'),('Iván Monroy'),
  ('José Rochín'),('Kevin Valdez'),('Luis Amador'),('Marco Granados'),('Obed Martínez'),
  ('Óscar Gómez'),('Rodrigo González'),('Yair Arias')
) AS v(name)
WHERE t.name = 'Persas FC' AND t.competition_key = 'kings';

-- Raniza FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 3, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Alexis Silva'),('Alfonso Nieto'),('Donovan Martínez'),('Eder López'),('Ezequiel Luna'),
  ('Héctor de la Fuente'),('Jonathan Sánchez'),('Juan Araya'),('Juande Martínez'),('Lautaro Martínez'),
  ('Mathías Vidangossy'),('Matias Herrera')
) AS v(name)
WHERE t.name = 'Raniza FC' AND t.competition_key = 'kings';

-- Simios FC
INSERT INTO players (team_id, competition_key, country_id, name, image_file, lesion, tarjeta, wildcard, convocado)
SELECT t.id, 'kings', 3, v.name, v.name || '.webp', false, false, false, true
FROM teams t, (VALUES
  ('Andrés Suárez'),('Cristian González'),('Erick Sámano'),('George Corral'),('Gerson García'),
  ('Hatzel Roque'),('Jorge Lima'),('José ''Shaggy'' Martínez'),('Luis Olascoaga'),('Miguel Rebollo'),
  ('Óscar Medina'),('Roberto Pérez'),('Sebastián Sáez')
) AS v(name)
WHERE t.name = 'Simios FC' AND t.competition_key = 'kings';
