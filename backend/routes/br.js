const express = require('express');
const router = express.Router();
const { brPool } = require('../db');

const TESTE   = `LOWER(COALESCE(nome_do_lead, '')) NOT LIKE '%teste%'`;
const INBOUND = `tipo_de_lead = 'Inbound' AND canal IN ('inbound (não usar)', 'Inbound Marketing')`;
const SALES_BR_BASE = `fonte = 'Marketing' AND canal IN ('inbound (não usar)', 'Inbound Marketing') AND (stage_group IS NULL OR stage_group != 'P')`;
const NAO_IMPL = [`nome NOT LIKE '%IMPLANTAÇÃO%'`, `nome NOT LIKE '%IMPLANTACAO%'`];

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

function taxa(num, den) {
  return den > 0 ? parseFloat(((num / den) * 100).toFixed(1)) : 0;
}

router.get('/meses', async (_req, res) => {
  try {
    const [rows] = await brPool.query(
      `SELECT DISTINCT DATE_FORMAT(criado_em, '%Y-%m') AS mes
       FROM view_leadsBrCloude
       WHERE ${TESTE} AND ${INBOUND} AND criado_em IS NOT NULL
       ORDER BY mes DESC`
    );
    res.json(rows.map(r => r.mes).filter(Boolean));
  } catch (err) {
    console.error('[BR meses]', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/historico', async (_req, res) => {
  try {
    const [[mqlRows], [sqlRows]] = await Promise.all([
      brPool.query(
        `SELECT DATE_FORMAT(criado_em, '%Y-%m') AS mes, COUNT(*) AS total
         FROM view_leadsBrCloude
         WHERE ${TESTE} AND ${INBOUND} AND criado_em IS NOT NULL
         GROUP BY mes ORDER BY mes ASC`
      ),
      brPool.query(
        `SELECT DATE_FORMAT(concluido_em, '%Y-%m') AS mes, COUNT(*) AS total
         FROM view_leadsBrCloude
         WHERE detalhes_de_status = 'S' AND concluido_em IS NOT NULL AND ${TESTE} AND ${INBOUND}
         GROUP BY mes ORDER BY mes ASC`
      ),
    ]);
    const mqlMap = Object.fromEntries(mqlRows.map(r => [r.mes, Number(r.total)]));
    const sqlMap = Object.fromEntries(sqlRows.map(r => [r.mes, Number(r.total)]));
    const allMeses = [...new Set([...mqlRows.map(r => r.mes), ...sqlRows.map(r => r.mes)])].sort();
    res.json(allMeses.map(mes => ({ mes, mqls: mqlMap[mes] || 0, sqls: sqlMap[mes] || 0 })));
  } catch (err) {
    console.error('[BR historico]', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const { mes, fonte, status, informacoes_da_fonte } = req.query;

  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return res.status(400).json({ error: 'Parâmetro mes obrigatório (YYYY-MM)' });
  }

  try {
    const mqlC = [`DATE_FORMAT(criado_em, '%Y-%m') = ?`, TESTE, INBOUND];
    const mqlP = [mes];
    addFilter(mqlC, mqlP, 'sistema_de_anuncios', fonte);
    addFilter(mqlC, mqlP, 'status', status);
    addFilter(mqlC, mqlP, 'informacoes_da_fonte', informacoes_da_fonte);

    const sqlC = [`DATE_FORMAT(concluido_em, '%Y-%m') = ?`, `detalhes_de_status = 'S'`, `concluido_em IS NOT NULL`, TESTE, INBOUND];
    const sqlP = [mes];
    addFilter(sqlC, sqlP, 'sistema_de_anuncios', fonte);
    addFilter(sqlC, sqlP, 'informacoes_da_fonte', informacoes_da_fonte);

    const perdC = [`DATE_FORMAT(criado_em, '%Y-%m') = ?`, `detalhes_de_status = 'F'`, TESTE, INBOUND];
    const perdP = [mes];
    addFilter(perdC, perdP, 'sistema_de_anuncios', fonte);

    const salesC = [`${SALES_BR_BASE}`, `stage_group = 'S'`, `DATE_FORMAT(data_de_inicio, '%Y-%m') = ?`, ...NAO_IMPL];
    const salesP = [mes];

    const perdSalesC = [`${SALES_BR_BASE}`, `stage_group = 'F'`, `DATE_FORMAT(data_de_termino, '%Y-%m') = ?`, ...NAO_IMPL];
    const perdSalesP = [mes];

    const [mqlRows, sqlRows, perdRows, salesRows, perdSalesRows] = await Promise.all([
      brPool.query(`SELECT * FROM view_leadsBrCloude WHERE ${mqlC.join(' AND ')}`, mqlP).then(([r]) => r),
      brPool.query(`SELECT * FROM view_leadsBrCloude WHERE ${sqlC.join(' AND ')}`, sqlP).then(([r]) => r),
      brPool.query(`SELECT * FROM view_leadsBrCloude WHERE ${perdC.join(' AND ')}`, perdP).then(([r]) => r),
      brPool.query(`SELECT * FROM sales_br WHERE ${salesC.join(' AND ')}`, salesP).then(([r]) => r),
      brPool.query(`SELECT * FROM sales_br WHERE ${perdSalesC.join(' AND ')}`, perdSalesP).then(([r]) => r),
    ]);

    res.json({
      mqls:    mqlRows.length,
      sqls:    sqlRows.length,
      perdidos: perdRows.length,
      taxa:    taxa(sqlRows.length, mqlRows.length),

      vendas_mes:   salesRows.length,
      perdidos_mes: perdSalesRows.length,
      motivos_perda: groupByWithPct(perdSalesRows, 'fase_do_negocio'),
      source_vendas: groupBy(salesRows, 'sistemas_de_anuncios'),
      medium_vendas: groupBy(salesRows, 'campaign_search_term'),
      camp_vendas:   groupBy(salesRows, 'ad_campaign_utm').slice(0, 5),

      source_leads:             groupBy(mqlRows, 'sistema_de_anuncios'),
      source_sqls:              groupBy(sqlRows, 'sistema_de_anuncios'),
      medium_leads:             groupBy(mqlRows, 'midia'),
      medium_sqls:              groupBy(sqlRows, 'midia'),
      status_breakdown:         groupBy(mqlRows, 'status'),
      informacoes_da_fonte_leads: groupBy(mqlRows, 'informacoes_da_fonte'),
      top_campanhas_leads:      groupBy(mqlRows, 'utm_da_campanha_publicitaria').slice(0, 10),
      top_campanhas_sqls:       groupBy(sqlRows,  'utm_da_campanha_publicitaria').slice(0, 10),
    });
  } catch (err) {
    console.error('[BR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
