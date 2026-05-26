const supabase = require('./supabase');

async function queryAll(table, options = {}) {
  let query = supabase.from(table).select(options.select || '*', { count: 'exact' });

  if (options.where) {
    for (const w of options.where) {
      if (w.op === 'in') {
        query = query.in(w.field, w.value);
      } else if (w.op === 'neq') {
        query = query.neq(w.field, w.value);
      } else if (w.op === 'gte') {
        query = query.gte(w.field, w.value);
      } else if (w.op === 'lte') {
        query = query.lte(w.field, w.value);
      } else if (w.op === 'like') {
        query = query.like(w.field, w.value);
      } else if (w.op === 'ilike') {
        query = query.ilike(w.field, w.value);
      } else if (w.op === 'is') {
        query = query.is(w.field, w.value);
      } else if (w.op === 'gt') {
        query = query.gt(w.field, w.value);
      } else if (w.op === 'lt') {
        query = query.lt(w.field, w.value);
      } else if (w.op === 'or') {
        query = query.or(w.value);
      } else {
        query = query.eq(w.field, w.value);
      }
    }
  }

  if (options.order) {
    const orders = Array.isArray(options.order) ? options.order : [options.order];
    for (const o of orders) {
      query = query.order(o.field, { ascending: o.ascending !== false, nullsFirst: o.nullsFirst || false });
    }
  }

  if (options.range) {
    query = query.range(options.range.from, options.range.to);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function queryOne(table, options = {}) {
  const results = await queryAll(table, { ...options, limit: 1 });
  return results[0] || null;
}

async function insert(table, values) {
  const { data, error } = await supabase.from(table).insert(values).select();
  if (error) throw error;
  return data;
}

async function update(table, values, field, id) {
  const { data, error } = await supabase.from(table).update(values).eq(field, id).select();
  if (error) throw error;
  return data;
}

async function remove(table, field, id) {
  const { data, error } = await supabase.from(table).delete().eq(field, id);
  if (error) throw error;
  return data;
}

async function rawQuery(sql, params = []) {
  const { data, error } = await supabase.rpc('exec_sql', { query_text: sql, query_params: params });
  if (error) throw error;
  return data;
}

module.exports = { supabase, queryAll, queryOne, insert, update, remove, rawQuery };
