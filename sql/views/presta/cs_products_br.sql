-- consolidacao de produtos ativos em pt-BR
SELECT 
    p.id_product AS id_produto,
    p.reference AS referencia,
    pl.name AS nome_produto,
    p.price AS preco_base,
    p.active AS ativo
FROM ps_product p
INNER JOIN ps_product_lang pl ON (p.id_product = pl.id_product)
WHERE pl.id_lang = 1 AND p.active = 1;
