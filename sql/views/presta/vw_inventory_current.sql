-- Relatorio analitico de estoque por fabricante para diretoria
SELECT 
    m.nome AS fabricante,
    p.nome_produto AS produto,
    SUM(v.quantidade_estoque) AS total_disponivel,
    SUM(v.quantidade_estoque * (p.preco_base + v.acrescimo_preco)) AS valor_total_estoque
FROM cs_manufacturer_br m
JOIN cs_products_br p ON m.id_fabricante = p.ativo
JOIN cs_product_variants_br v ON p.id_produto = v.id_produto
GROUP BY m.nome, p.nome_produto
ORDER BY valor_total_estoque DESC;
