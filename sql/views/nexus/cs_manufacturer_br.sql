SELECT
    nx_ps_manufacturer.*
FROM
    nx_ps_manufacturer_lang
    INNER JOIN nx_ps_manufacturer ON nx_ps_manufacturer_lang.id_manufacturer = nx_ps_manufacturer.id_manufacturer
WHERE
    (((nx_ps_manufacturer_lang.id_lang) = 2));
