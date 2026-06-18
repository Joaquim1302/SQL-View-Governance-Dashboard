-- staging das combinacoes e variantes de produtos
SELECT 
    pa.id_product_attribute AS id_variacao,
    pa.id_product AS id_produto,
    pa.reference AS referencia_variacao,
    pa.price AS acrescimo_preco,
    stock.quantity AS quantidade_estoque
FROM ps_product_attribute pa
LEFT JOIN ps_stock_available stock ON (pa.id_product_attribute = stock.id_product_attribute);
