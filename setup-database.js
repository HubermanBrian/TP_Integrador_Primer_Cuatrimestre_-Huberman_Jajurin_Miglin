#!/usr/bin/env node

/**
 * Script para configurar la base de datos
 * Uso: node setup-database.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'eventos_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'tu_password',
};

async function setupDatabase() {
  console.log('🚀 Configurando base de datos...\n');
  
  // Conectar a PostgreSQL sin especificar base de datos para crearla
  const adminPool = new Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: 'postgres', // Conectar a la base de datos por defecto
  });

  try {
    // 1. Crear la base de datos si no existe
    console.log('📋 Paso 1: Creando base de datos...');
    await adminPool.query(`CREATE DATABASE ${config.database}`);
    console.log(`✅ Base de datos "${config.database}" creada exitosamente`);
  } catch (error) {
    if (error.code === '42P04') {
      console.log(`ℹ️  La base de datos "${config.database}" ya existe`);
    } else {
      console.error('❌ Error al crear la base de datos:', error.message);
      return;
    }
  } finally {
    await adminPool.end();
  }

  // 2. Conectar a la nueva base de datos
  const pool = new Pool(config);

  try {
    // 3. Verificar si las tablas ya existen
    console.log('\n📋 Paso 2: Verificando estructura de tablas...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    if (existingTables.length > 0) {
      console.log('ℹ️  Las siguientes tablas ya existen:');
      existingTables.forEach(table => console.log(`   - ${table}`));
      console.log('\n💡 Si quieres recrear las tablas, elimina la base de datos y vuelve a ejecutar este script');
    } else {
      // 4. Ejecutar el script SQL
      console.log('\n📋 Paso 3: Creando tablas y datos...');
      const sqlFile = path.join(__dirname, 'database.sql');
      
      if (fs.existsSync(sqlFile)) {
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        // Dividir el SQL en comandos individuales
        const commands = sqlContent
          .split(';')
          .map(cmd => cmd.trim())
          .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        for (const command of commands) {
          if (command.trim()) {
            try {
              await pool.query(command);
            } catch (error) {
              // Ignorar errores de comandos que ya existen
              if (!error.message.includes('already exists')) {
                console.error('❌ Error ejecutando comando SQL:', error.message);
              }
            }
          }
        }
        
        console.log('✅ Estructura de base de datos creada exitosamente');
      } else {
        console.error('❌ No se encontró el archivo database.sql');
        return;
      }
    }

    // 5. Verificar datos
    console.log('\n📋 Paso 4: Verificando datos...');
    const eventsCount = await pool.query('SELECT COUNT(*) FROM events');
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const categoriesCount = await pool.query('SELECT COUNT(*) FROM event_categories');
    
    console.log(`✅ Eventos: ${eventsCount.rows[0].count}`);
    console.log(`✅ Usuarios: ${usersCount.rows[0].count}`);
    console.log(`✅ Categorías: ${categoriesCount.rows[0].count}`);

    console.log('\n🎉 ¡Base de datos configurada exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Configura las variables de entorno en .env');
    console.log('   2. Ejecuta: npm run server');
    console.log('   3. Prueba: curl http://localhost:3000/api/health');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
  } finally {
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = setupDatabase; 