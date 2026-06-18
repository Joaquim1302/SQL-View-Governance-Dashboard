-- View temporaria (violacao de regras de governanca)
SELECT * FROM ps_connections WHERE date_add > NOW() - INTERVAL 1 DAY;
