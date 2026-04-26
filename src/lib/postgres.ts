import { Pool } from 'pg';

let pool: Pool | null = null;

export function createPool(connectionString: string) {
  // Close existing pool if any
  if (pool) {
    pool.end();
  }
  
  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Accept self-signed certificates
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased to 10 seconds
  });
  
  return pool;
}

export async function query(text: string, params?: any[], connectionString?: string) {
  if (connectionString) {
    const tempPool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Accept self-signed certificates
      },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000, // Increased to 15 seconds
      statement_timeout: 30000, // Query timeout
    });
    
    try {
      const start = Date.now();
      const res = await tempPool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error: any) {
      console.error('Query error:', error.message);
      throw error;
    } finally {
      await tempPool.end();
    }
  }
  
  if (!pool) {
    throw new Error('Database pool not initialized. Please provide a connection string.');
  }
  
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}

export async function getClient(connectionString?: string) {
  if (connectionString) {
    const tempPool = new Pool({ 
      connectionString, 
      ssl: {
        rejectUnauthorized: false,
      }
    });
    return await tempPool.connect();
  }
  
  if (!pool) {
    throw new Error('Database pool not initialized. Please provide a connection string.');
  }
  
  const client = await pool.connect();
  return client;
}

export default pool;
