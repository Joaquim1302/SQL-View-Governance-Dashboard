SELECT
    ps_manufacturer.*
FROM
    ps_manufacturer_lang
    INNER JOIN ps_manufacturer ON ps_manufacturer_lang.id_manufacturer = ps_manufacturer.id_manufacturer
WHERE
    (((ps_manufacturer_lang.id_lang) = 2));