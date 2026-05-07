const express = require('express');
const router = express.Router();
const { intPool } = require('../db');

const TESTE = `LOWER(COALESCE(lead_name, '')) NOT LIKE '%teste%'`;
const INBOUND_LEADS = `canal IN ('inbound', 'inbound (Not Use)', 'Inbound Marketing', 'Alliances/Inbound')`;
const INBOUND_SALES = `channel IN ('inbound', 'inbound (Not Use)', 'Inbound Marketing', 'Alliances/Inbound')`;
const SALES_INT_BASE = `${INBOUND_SALES} AND (stage_group IS NULL OR stage_group != 'P')`;

const OPERACAO_CASE = `CASE
  WHEN LOWER(lead_operation_ops_correto) LIKE '%europa%'       OR LOWER(lead_operation_ops_correto) LIKE '%europe%'        THEN 'Europa'
  WHEN LOWER(lead_operation_ops_correto) LIKE '%latam%'        OR LOWER(lead_operation_ops_correto) LIKE '%latin%'
    OR LOWER(lead_operation_ops_correto) LIKE '%latina%'       OR LOWER(lead_operation_ops_correto) LIKE '%south america%' THEN 'Latam'
  WHEN LOWER(lead_operation_ops_correto) LIKE '%north america%' OR LOWER(lead_operation_ops_correto) LIKE '%norte%'
    OR LOWER(lead_operation_ops_correto) LIKE '%nord%'         OR LOWER(lead_operation_ops_correto) LIKE '%united states%'
    OR LOWER(lead_operation_ops_correto) LIKE '%usa%'          OR LOWER(lead_operation_ops_correto) LIKE '%del norte%'
    OR LOWER(lead_operation_ops_correto) LIKE '%do norte%'                                                                  THEN 'North America'
  WHEN LOWER(lead_operation_ops_correto) LIKE '%asia%'                                                                     THEN 'Asia'
  WHEN LOWER(lead_operation_ops_correto) LIKE '%brazil%'       OR LOWER(lead_operation_ops_correto) LIKE '%brasil%'        THEN 'Brasil (ignorar)'
  ELSE 'Others'
END`;

function groupBy(rows, key) {
  const map = {};
  for (const row of rows) {
    const val = (row[key] != null && row[key] !== '') ? String(row[key]) : 'Não informado';
    map[val] = (map[val] || 0) + 1;
  }
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function groupByWithPct(rows, key) {
  const map = {};
  for (const row of rows) {
    const val = (row[key] != null && row[key] !== '') ? String(row[key]) : 'Não informado';
    map[val] = (map[val] || 0) + 1;
  }
  const total = Object.values(map).reduce((s, n) => s + n, 0);
  return Object.entries(map)
    .map(([motivo, count]) => ({
      motivo,
      count,
      percentual: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function addFilter(conds, params, col, val) {
  if (val) { conds.push(`${col} = ?`); params.push(val); }
}

function extractPais(row) {
  for (const f of [row.conversion_identifier, row.ad_campaign_utm]) {
    if (f) {
      const m = String(f).match(/\[([^\]]+)\]/);
      if (m) return m[1];
    }
  }
  return 'Não informado';
}

router.get('/meses', async (_req, res) => {
  try {
    const [rows] = await intPool.query(
      `SELECT DISTINCT DATE_FORMAT(created_on, '%Y-%m') AS mes
       FROM view_leadsIntCloude
       WHERE ${TESTE} AND ${INBOUND_LEADS} AND created_on IS NOT NULL
       ORDER BY mes DESC`
    );
    res.json(rows.map(r => r.mes).filter(Boolean));
  } catch (err) {
    console.error('[INT meses]', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/historico', async (_req, res) => {
  try {
    const [[mqlRows], [sqlRows]] = await Promise.all([
      intPool.query(
        `SELECT DATE_FORMAT(created_on, '%Y-%m') AS mes, COUNT(*) AS total
         FROM view_leadsIntCloude
         WHERE ${TESTE} AND ${INBOUND_LEADS} AND created_on IS NOT NULL
         GROUP BY mes ORDER BY mes ASC`
      ),
      intPool.query(
        `SELECT DATE_FORMAT(completed_on, '%Y-%m') AS mes, COUNT(*) AS total
         FROM view_leadsIntCloude
         WHERE status_details = 'S' AND completed_on IS NOT NULL AND ${TESTE} AND ${INBOUND_LEADS}
         GROUP BY mes ORDER BY mes ASC`
      ),
    ]);
    const mqlMap = Object.fromEntries(mqlRows.map(r => [r.mes, Number(r.total)]));
    const sqlMap = Object.fromEntries(sqlRows.map(r => [r.mes, Number(r.total)]));
    const allMeses = [...new Set([...mqlRows.map(r => r.mes), ...sqlRows.map(r => r.mes)])].sort();
    res.json(allMeses.map(mes => ({ mes, mqls: mqlMap[mes] || 0, sqls: sqlMap[mes] || 0 })));
  } catch (err) {
    console.error('[INT historico]', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const { mes, operacao, pais, canal, stage } = req.query;

  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return res.status(400).json({ error: 'Parâmetro mes obrigatório (YYYY-MM)' });
  }

  try {
    const mqlC = [`DATE_FORMAT(created_on, '%Y-%m') = ?`, TESTE, INBOUND_LEADS];
    const mqlP = [mes];
    addFilter(mqlC, mqlP, 'canal', canal);
    addFilter(mqlC, mqlP, 'stage', stage);
    if (operacao) { mqlC.push(`${OPERACAO_CASE} = ?`); mqlP.push(operacao); }

    const sqlC = [`DATE_FORMAT(completed_on, '%Y-%m') = ?`, `status_details = 'S'`, `completed_on IS NOT NULL`, TESTE, INBOUND_LEADS];
    const sqlP = [mes];
    addFilter(sqlC, sqlP, 'canal', canal);
    addFilter(sqlC, sqlP, 'stage', stage);
    if (operacao) { sqlC.push(`${OPERACAO_CASE} = ?`); sqlP.push(operacao); }

    const perdC = [`DATE_FORMAT(created_on, '%Y-%m') = ?`, `status_details = 'F'`, TESTE, INBOUND_LEADS];
    const perdP = [mes];
    addFilter(perdC, perdP, 'canal', canal);
    if (operacao) { perdC.push(`${OPERACAO_CASE} = ?`); perdP.push(operacao); }

    const salesC = [`${SALES_INT_BASE}`, `stage_group = 'S'`, `DATE_FORMAT(created_on, '%Y-%m') = ?`];
    const salesP = [mes];

    const perdSalesC = [`${SALES_INT_BASE}`, `stage_group = 'F'`, `DATE_FORMAT(end_date, '%Y-%m') = ?`];
    const perdSalesP = [mes];

    const [mqlRows, sqlRows, perdRows, mqlOpRows, sqlOpRows, salesRows, perdSalesRows] = await Promise.all([
      intPool.query(`SELECT * FROM view_leadsIntCloude WHERE ${mqlC.join(' AND ')}`, mqlP).then(([r]) => r),
      intPool.query(`SELECT * FROM view_leadsIntCloude WHERE ${sqlC.join(' AND ')}`, sqlP).then(([r]) => r),
      intPool.query(`SELECT * FROM view_leadsIntCloude WHERE ${perdC.join(' AND ')}`, perdP).then(([r]) => r),

      intPool.query(
        `SELECT ${OPERACAO_CASE} AS operacao_normalizada, COUNT(*) AS count
         FROM view_leadsIntCloude
         WHERE ${mqlC.join(' AND ')}
         GROUP BY operacao_normalizada
         HAVING operacao_normalizada != 'Brasil (ignorar)'
         ORDER BY count DESC`,
        mqlP
      ).then(([r]) => r),

      intPool.query(
        `SELECT ${OPERACAO_CASE} AS operacao_normalizada, COUNT(*) AS count
         FROM view_leadsIntCloude
         WHERE ${sqlC.join(' AND ')}
         GROUP BY operacao_normalizada
         HAVING operacao_normalizada != 'Brasil (ignorar)'
         ORDER BY count DESC`,
        sqlP
      ).then(([r]) => r),

      intPool.query(`SELECT * FROM sales_deals WHERE ${salesC.join(' AND ')}`, salesP).then(([r]) => r),
      intPool.query(`SELECT * FROM sales_deals WHERE ${perdSalesC.join(' AND ')}`, perdSalesP).then(([r]) => r),
    ]);

    const mqlWithPais = mqlRows.map(r => ({ ...r, _pais: extractPais(r) }));
    const sqlWithPais = sqlRows.map(r => ({ ...r, _pais: extractPais(r) }));
    const filteredMql = pais ? mqlWithPais.filter(r => r._pais === pais) : mqlWithPais;
    const filteredSql = pais ? sqlWithPais.filter(r => r._pais === pais) : sqlWithPais;

    // Vendas por país (top 8, campo country_oficial de sales_deals)
    const paisVendasMap = {};
    for (const row of salesRows) {
      const p = (row.country_oficial != null && row.country_oficial !== '') ? String(row.country_oficial) : 'Não informado';
      paisVendasMap[p] = (paisVendasMap[p] || 0) + 1;
    }
    const vendas_por_pais = Object.entries(paisVendasMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    res.json({
      mqls:    filteredMql.length,
      sqls:    filteredSql.length,
      perdidos: perdRows.length,
      taxa: filteredMql.length > 0 ? parseFloat(((filteredSql.length / filteredMql.length) * 100).toFixed(1)) : 0,

      vendas_mes:    salesRows.length,
      perdidos_mes:  perdSalesRows.length,
      motivos_perda: groupByWithPct(perdSalesRows, 'deal_stage'),
      vendas_por_pais,
      source_vendas: groupBy(salesRows, 'ad_campaign_utm'),
      camp_vendas:   groupBy(salesRows, 'ad_campaign_utm').slice(0, 5),

      canal_leads:  groupBy(filteredMql, 'canal'),
      canal_sqls:   groupBy(filteredSql, 'canal'),
      source_leads: groupBy(filteredMql, 'ad_system'),
      source_sqls:  groupBy(filteredSql, 'ad_system'),
      medium_leads: groupBy(filteredMql, 'campaign_search_term'),
      medium_sqls:  groupBy(filteredSql, 'campaign_search_term'),
      stage_breakdown: groupBy(filteredMql, 'stage'),
      operacao_leads: mqlOpRows.map(r => ({ name: r.operacao_normalizada, count: Number(r.count) })),
      operacao_sqls:  sqlOpRows.map(r => ({ name: r.operacao_normalizada, count: Number(r.count) })),
      pais_leads: groupBy(mqlWithPais, '_pais'),
      pais_sqls:  groupBy(sqlWithPais, '_pais'),
      top_campanhas_leads: groupBy(filteredMql, 'ad_campaign_utm').slice(0, 10),
      top_campanhas_sqls:  groupBy(filteredSql, 'ad_campaign_utm').slice(0, 10),
    });
  } catch (err) {
    console.error('[INT]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
