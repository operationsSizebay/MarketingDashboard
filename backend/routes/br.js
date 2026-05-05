const express = require('express');
const router = express.Router();
const { brPool } = require('../db');

const TESTE = `LOWER(COALESCE(nome_do_lead, '')) NOT LIKE '%teste%'`;

const MEETIME_OWNERS = `owner_name IN ('Vitoria', 'Sabrina', 'Marcela')`;

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

function taxa(sqls, mqls) {
  return mqls > 0 ? parseFloat(((sqls / mqls) * 100).toFixed(1)) : 0;
}

router.get('/meses', async (_req, res) => {
  try {
    const [rows] = await brPool.query(
      `SELECT DISTINCT DATE_FORMAT(criado_em, '%Y-%m') AS mes
       FROM view_leadsBrCloude
       WHERE ${TESTE} AND criado_em IS NOT NULL
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
         WHERE ${TESTE} AND criado_em IS NOT NULL
         GROUP BY mes ORDER BY mes ASC`
      ),
      brPool.query(
        `SELECT DATE_FORMAT(concluido_em, '%Y-%m') AS mes, COUNT(*) AS total
         FROM view_leadsBrCloude
         WHERE detalhes_de_status = 'S' AND concluido_em IS NOT NULL AND ${TESTE}
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

// Rota dedicada para dados do Meetime (Outbound)
router.get('/meetime', async (req, res) => {
  const { mes } = req.query;
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return res.status(400).json({ error: 'Parâmetro mes obrigatório (YYYY-MM)' });
  }
  try {
    const [[row]] = await brPool.query(
      `SELECT COUNT(id_lead) AS count FROM view_meetimeClaude
       WHERE ${MEETIME_OWNERS} AND DATE_FORMAT(end_date, '%Y-%m') = ?`,
      [mes]
    );
    res.json({ mqls_outbound: Number(row.count) });
  } catch (err) {
    console.error('[BR meetime]', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const { mes, tipo_de_lead, canal, fonte, status, informacoes_da_fonte } = req.query;

  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return res.status(400).json({ error: 'Parâmetro mes obrigatório (YYYY-MM)' });
  }

  try {
    // MQL — leads criados no mês
    const mqlC = [`DATE_FORMAT(criado_em, '%Y-%m') = ?`, TESTE];
    const mqlP = [mes];
    addFilter(mqlC, mqlP, 'tipo_de_lead', tipo_de_lead);
    addFilter(mqlC, mqlP, 'canal', canal);
    addFilter(mqlC, mqlP, 'sistema_de_anuncios', fonte);
    addFilter(mqlC, mqlP, 'status', status);
    addFilter(mqlC, mqlP, 'informacoes_da_fonte', informacoes_da_fonte);

    // SQL — leads concluídos no mês com status S
    const sqlC = [`DATE_FORMAT(concluido_em, '%Y-%m') = ?`, `detalhes_de_status = 'S'`, `concluido_em IS NOT NULL`, TESTE];
    const sqlP = [mes];
    addFilter(sqlC, sqlP, 'tipo_de_lead', tipo_de_lead);
    addFilter(sqlC, sqlP, 'canal', canal);
    addFilter(sqlC, sqlP, 'sistema_de_anuncios', fonte);
    addFilter(sqlC, sqlP, 'informacoes_da_fonte', informacoes_da_fonte);

    // Perdidos — leads criados no mês com status F
    const perdC = [`DATE_FORMAT(criado_em, '%Y-%m') = ?`, `detalhes_de_status = 'F'`, TESTE];
    const perdP = [mes];
    addFilter(perdC, perdP, 'tipo_de_lead', tipo_de_lead);
    addFilter(perdC, perdP, 'canal', canal);
    addFilter(perdC, perdP, 'sistema_de_anuncios', fonte);

    const [mqlRows, sqlRows, perdRows, meetimeRow] = await Promise.all([
      brPool.query(`SELECT * FROM view_leadsBrCloude WHERE ${mqlC.join(' AND ')}`, mqlP).then(([r]) => r),
      brPool.query(`SELECT * FROM view_leadsBrCloude WHERE ${sqlC.join(' AND ')}`, sqlP).then(([r]) => r),
      brPool.query(`SELECT * FROM view_leadsBrCloude WHERE ${perdC.join(' AND ')}`, perdP).then(([r]) => r),
      brPool.query(
        `SELECT COUNT(id_lead) AS count FROM view_meetimeClaude
         WHERE ${MEETIME_OWNERS} AND DATE_FORMAT(end_date, '%Y-%m') = ?`,
        [mes]
      ).then(([[r]]) => r),
    ]);

    const mqls    = mqlRows.length;
    const sqls    = sqlRows.length;
    const perdidos = perdRows.length;

    // Breakdown Inbound / Outbound
    const mqls_inbound  = mqlRows.filter(r => r.tipo_de_lead === 'Inbound').length;
    const mqls_outbound = Number(meetimeRow.count);
    const mqls_total    = mqls_inbound + mqls_outbound;

    const sqls_inbound  = sqlRows.filter(r => r.tipo_de_lead === 'Inbound').length;
    const sqls_outbound = sqlRows.filter(r => r.tipo_de_lead === 'Outbound').length;
    const sqls_total    = sqls_inbound + sqls_outbound;

    res.json({
      // Totais legados (respeitam filtro tipo_de_lead)
      mqls,
      sqls,
      perdidos,
      taxa: taxa(sqls, mqls),

      // Breakdown combinado
      mqls_inbound,
      mqls_outbound,
      mqls_total,
      sqls_inbound,
      sqls_outbound,
      sqls_total,
      taxa_total:    taxa(sqls_total, mqls_total),
      taxa_inbound:  taxa(sqls_inbound, mqls_inbound),
      taxa_outbound: taxa(sqls_outbound, mqls_outbound),

      // Gráficos
      canal_leads:   groupBy(mqlRows, 'canal'),
      canal_sqls:    groupBy(sqlRows, 'canal'),
      source_leads:  groupBy(mqlRows, 'sistema_de_anuncios'),
      source_sqls:   groupBy(sqlRows, 'sistema_de_anuncios'),
      medium_leads:  groupBy(mqlRows, 'midia'),
      medium_sqls:   groupBy(sqlRows, 'midia'),
      status_breakdown:          groupBy(mqlRows, 'status'),
      tipo_de_lead_leads:        groupBy(mqlRows, 'tipo_de_lead'),
      informacoes_da_fonte_leads: groupBy(mqlRows, 'informacoes_da_fonte'),
      top_campanhas_leads: groupBy(mqlRows, 'utm_da_campanha_publicitaria').slice(0, 10),
      top_campanhas_sqls:  groupBy(sqlRows,  'utm_da_campanha_publicitaria').slice(0, 10),
    });
  } catch (err) {
    console.error('[BR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
