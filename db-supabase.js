require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan las variables de entorno de Supabase');
  console.log('💡 Asegúrate de configurar en tu archivo .env:');
  console.log('   SUPABASE_URL=tu_url_de_supabase');
  console.log('   SUPABASE_ANON_KEY=tu_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔗 Conectado a Supabase');
console.log('📊 URL:', supabaseUrl);


const insert = async (table, data) => {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();
    
    if (error) throw error;
    
    return { rows: result, rowCount: result.length };
  } catch (error) {
    console.error('Error en insert:', error);
    throw error;
  }
};


const update = async (table, data, conditions) => {
  try {
    let query = supabase.from(table).update(data);
    

    Object.keys(conditions).forEach(key => {
      query = query.eq(key, conditions[key]);
    });
    
    const { data: result, error } = await query.select();
    
    if (error) throw error;
    
    return { rows: result, rowCount: result.length };
  } catch (error) {
    console.error('Error en update:', error);
    throw error;
  }
};


const remove = async (table, conditions) => {
  try {
    let query = supabase.from(table).delete();
    

    Object.keys(conditions).forEach(key => {
      query = query.eq(key, conditions[key]);
    });
    
    const { data: result, error } = await query.select();
    
    if (error) throw error;
    
    return { rows: result, rowCount: result.length };
  } catch (error) {
    console.error('Error en delete:', error);
    throw error;
  }
};


const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    console.log('✅ Conexión a Supabase exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con Supabase:', error.message);
    return false;
  }
};

const select = async (table, columns = '*', conditions = {}) => {
  try {
    let query = supabase.from(table).select(columns);
    

    Object.keys(conditions).forEach(key => {
      query = query.eq(key, conditions[key]);
    });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { rows: data || [] };
  } catch (error) {
    console.error('Error en select:', error);
    throw error;
  }
};


const getEvents = async (filters = {}) => {
  try {
   
    let query = supabase
      .from('events')
      .select(`
        *,
        event_categories(name)
      `);
    

    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }
    if (filters.location) {
      query = query.eq('location_id', filters.location);
    }
    if (filters.creator) {
      query = query.eq('creator_id', filters.creator);
    }
    if (filters.enabled !== undefined) {
      query = query.eq('enabled_for_enrollment', filters.enabled);
    }
    if (filters.name) {
      query = query.ilike('name', `%${filters.name}%`);
    }

    const { data, error } = await query;
    if (error) {

      let simpleQuery = supabase
        .from('events')
        .select('*');
      

      if (filters.category) {
        simpleQuery = simpleQuery.eq('category_id', filters.category);
      }
      if (filters.location) {
        simpleQuery = simpleQuery.eq('location_id', filters.location);
      }
      if (filters.creator) {
        simpleQuery = simpleQuery.eq('creator_id', filters.creator);
      }
      if (filters.enabled !== undefined) {
        simpleQuery = simpleQuery.eq('enabled_for_enrollment', filters.enabled);
      }
      
      const { data: simpleData, error: simpleError } = await simpleQuery;
      if (simpleError) throw simpleError;
      return { rows: simpleData || [] };
    }
    
    return { rows: data || [] };
  } catch (error) {
    console.error('Error getting events:', error);
    throw error;
  }
};


const getUserCreatedEvents = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_categories(name)
      `)
      .eq('creator_id', userId);
    
    if (error) {
      const { data: simpleData, error: simpleError } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', userId);
      
      if (simpleError) throw simpleError;
      return { rows: simpleData || [] };
    }
    
    return { rows: data || [] };
  } catch (error) {
    console.error('Error getting user created events:', error);
    throw error;
  }
};


const getUserJoinedEvents = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('event_enrollments')
      .select(`
        *,
        events(
          *,
          event_categories(name)
        )
      `)
      .eq('id_user', userId);
    
    if (error) {
      const { data: simpleData, error: simpleError } = await supabase
        .from('event_enrollments')
        .select(`
          *,
          events(*)
        `)
        .eq('id_user', userId);
      
      if (simpleError) throw simpleError;
      return { rows: simpleData || [] };
    }
    
    return { rows: data || [] };
  } catch (error) {
    console.error('Error getting user joined events:', error);
    throw error;
  }
};


const getEventById = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        event_categories(name)
      `)
      .eq('id', eventId)
      .single();
    
    if (error) {
      const { data: simpleData, error: simpleError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (simpleError) throw simpleError;
      return { rows: [simpleData] };
    }
    
    return { rows: [data] };
  } catch (error) {
    console.error('Error getting event by id:', error);
    throw error;
  }
};


const checkUserEnrollment = async (userId, eventId) => {
  try {
    const { data, error } = await supabase
      .from('event_enrollments')
      .select('*')
      .eq('id_user', userId)
      .eq('id_event', eventId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    return { rows: data ? [data] : [] };
  } catch (error) {
    console.error('Error checking user enrollment:', error);
    throw error;
  }
};


const getEventEnrollmentCount = async (eventId) => {
  try {
    const { count, error } = await supabase
      .from('event_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('id_event', eventId);
    
    if (error) throw error;
    
    return { rows: [{ count: count || 0 }] };
  } catch (error) {
    console.error('Error getting event enrollment count:', error);
    throw error;
  }
};

module.exports = {
  supabase,
  insert,
  update,
  remove,
  select,
  testConnection,
  getEvents,
  getUserCreatedEvents,
  getUserJoinedEvents,
  getEventById,
  checkUserEnrollment,
  getEventEnrollmentCount
}; 