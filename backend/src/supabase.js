const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Prueba de conexión
supabase.from('usuarios').select('count').then(({ data, error }) => {
  if (error) console.log('❌ Error Supabase:', error.message);
  else console.log('✅ Supabase conectado correctamente');
});

module.exports = supabase;