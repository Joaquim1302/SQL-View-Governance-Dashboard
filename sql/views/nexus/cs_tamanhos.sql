SELECT
    cs_attribute_br.name,
    nx_ps_attribute.*
FROM
    cs_attribute_br
    INNER JOIN nx_ps_attribute ON cs_attribute_br.id_attribute = nx_ps_attribute.id_attribute
WHERE
    (((nx_ps_attribute.id_attribute_group) = 4));
