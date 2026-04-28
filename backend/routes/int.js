const express = require('express');
const router = express.Router();
const { intPool } = require('../db');

const TESTE = `LOWER(COALESCE(lead_name, '')) NOT LIKE '%teste%'`;

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
       WHERE ${TESTE} AND created_on IS NOT NULL
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
         WHERE ${TESTE} AND created_on IS NOT NULL
         GROUP BY mes ORDER BY mes ASC`
      ),
      intPool.query(
        `SELECT DATE_FORMAT(completed_on, '%Y-%m') AS mes, COUNT(*) AS total
         FROM view_leadsIntCloude
         WHERE status_details = 'S' AND completed_on IS NOT NULL AND ${TESTE}
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
    // MQL — leads criados no mês
    const mqlC = [`DATE_FORMAT(created_on, '%Y-%m') = ?`, TESTE];
    const mqlP = [mes];
    addFilter(mqlC, mqlP, 'canal', canal);
    addFilter(mqlC, mqlP, 'stage', stage);
    if (operacao) { mqlC.push(`${OPERACAO_CASE} = ?`); mqlP.push(operacao); }

    // SQL — leads concluídos no mês com status_details S
    const sqlC = [`DATE_FORMAT(completed_on, '%Y-%m') = ?`, `status_details = 'S'`, `completed_on IS NOT NULL`, TESTE];
    const sqlP = [mes];
    addFilter(sqlC, sqlP, 'canal', canal);
    addFilter(sqlC, sqlP, 'stage', stage);
    if (operacao) { sqlC.push(`${OPERACAO_CASE} = ?`); sqlP.push(operacao); }

    // Perdidos
    const perdC = [`DATE_FORMAT(created_on, '%Y-%m') = ?`, `status_details = 'F'`, TESTE];
    const perdP = [mes];
    addFilter(perdC, perdP, 'canal', canal);
    if (operacao) { perdC.push(`${OPERACAO_CASE} = ?`); perdP.push(operacao); }

    const [mqlRows, sqlRows, perdRows, mqlOpRows, sqlOpRows] = await Promise.all([
      intPool.query(`SELECT * FROM view_leadsIntCloude WHERE ${mqlC.join(' AND ')}`, mqlP).then(([r]) => r),
      intPool.query(`SELECT * FROM view_leadsIntCloude WHERE ${sqlC.join(' AND ')}`, sqlP).then(([r]) => r),
      intPool.query(`SELECT * FROM view_leadsIntCloude WHERE ${perdC.join(' AND ')}`, perdP).then(([r]) => r),

      // Operação — MQLs: GROUP BY com CASE WHEN, filtrando Brasil
      intPool.query(
        `SELECT ${OPERACAO_CASE} AS operacao_normalizada, COUNT(*) AS count
         FROM view_leadsIntCloude
         WHERE ${mqlC.join(' AND ')}
         GROUP BY operacao_normalizada
         HAVING operacao_normalizada != 'Brasil (ignorar)'
         ORDER BY count DESC`,
        mqlP
      ).then(([r]) => r),

      // Operação — SQLs: GROUP BY com CASE WHEN, filtrando Brasil
      intPool.query(
        `SELECT ${OPERACAO_CASE} AS operacao_normalizada, COUNT(*) AS count
         FROM view_leadsIntCloude
         WHERE ${sqlC.join(' AND ')}
         GROUP BY operacao_normalizada
         HAVING operacao_normalizada != 'Brasil (ignorar)'
         ORDER BY count DESC`,
        sqlP
      ).then(([r]) => r),
    ]);

    const mqlWithPais = mqlRows.map(r => ({ ...r, _pais: extractPais(r) }));
    const sqlWithPais = sqlRows.map(r => ({ ...r, _pais: extractPais(r) }));
    const filteredMql = pais ? mqlWithPais.filter(r => r._pais === pais) : mqlWithPais;
    const filteredSql = pais ? sqlWithPais.filter(r => r._pais === pais) : sqlWithPais;

    const mqls = filteredMql.length;
    const sqls = filteredSql.length;
    const perdidos = perdRows.length;

    res.json({
      mqls,
      sqls,
      perdidos,
      taxa: mqls > 0 ? parseFloat(((sqls / mqls) * 100).toFixed(1)) : 0,
      canal_leads: groupBy(filteredMql, 'canal'),
      canal_sqls: groupBy(filteredSql, 'canal'),
      source_leads: groupBy(filteredMql, 'ad_system'),
      source_sqls: groupBy(filteredSql, 'ad_system'),
      medium_leads: groupBy(filteredMql, 'campaign_search_term'),
      medium_sqls: groupBy(filteredSql, 'campaign_search_term'),
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
