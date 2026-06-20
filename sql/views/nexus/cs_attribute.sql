SELECT
    cs_attribute_lang_br.name,
    ps_attribute.*
FROM
    cs_attribute_lang_br
    INNER JOIN ps_attribute ON cs_attribute_lang_br.id_attribute = ps_attribute.id_attribute;