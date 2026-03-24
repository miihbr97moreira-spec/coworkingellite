import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGallery() {
  try {
    const { data, error } = await supabase.storage.from('gallery').list('');
    if (error) {
      console.log('Erro ao listar galeria:', error);
    } else {
      console.log('Arquivos na galeria:', data);
    }
  } catch (e) {
    console.log('Erro:', e.message);
  }
}

testGallery();
