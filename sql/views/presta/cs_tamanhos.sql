SELECT
    cs_attribute_br.name,
    ps_attribute.*
FROM
    cs_attribute_br
    INNER JOIN ps_attribute ON cs_attribute_br.id_attribute = ps_attribute.id_attribute
WHERE
    (((ps_attribute.id_attribute_group) = 4));