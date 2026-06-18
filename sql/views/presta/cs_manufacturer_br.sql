-- normalizacao de fabricantes para idioma pt-BR
SELECT 
    m.id_manufacturer AS id_fabricante,
    m.name AS nome,
    m.date_add AS data_cadastro,
    m.active AS ativo,
    'pt-BR' AS idioma_operacao
FROM ps_manufacturer m
INNER JOIN ps_manufacturer_lang ml ON (m.id_manufacturer = ml.id_manufacturer)
WHERE m.active = 1;
