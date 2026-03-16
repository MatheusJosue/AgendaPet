-- Migrar dados de appointments para clients e pets
-- Este script deve ser executado uma vez após as tabelas existirem

-- 1. Criar clientes únicos por telefone (ignora duplicados)
INSERT INTO clients (company_id, name, phone)
SELECT DISTINCT company_id,
       COALESCE(tutor_name, 'Sem nome'),
       phone
FROM appointments
WHERE tutor_name IS NOT NULL
  AND phone IS NOT NULL
  AND phone != ''
ON CONFLICT DO NOTHING;

-- 2. Criar pets a partir de appointments (espécie padrão: cachorro)
INSERT INTO pets (client_id, name, species, breed)
SELECT c.id, a.pet_name, 'cachorro', a.pet_breed
FROM appointments a
JOIN clients c ON a.phone = c.phone AND a.company_id = c.company_id
WHERE a.pet_name IS NOT NULL AND a.pet_name != ''
ON CONFLICT DO NOTHING;

-- 3. Vincular appointments aos clientes (via phone)
UPDATE appointments a
SET client_id = c.id
FROM clients c
WHERE a.phone = c.phone
  AND a.company_id = c.company_id
  AND a.client_id IS NULL;

-- 4. Vincular appointments aos pets (via pet_name + client)
UPDATE appointments a
SET pet_id = p.id
FROM pets p
JOIN clients c ON p.client_id = c.id
WHERE a.client_id = c.id
  AND a.pet_name = p.name
  AND a.pet_id IS NULL;
