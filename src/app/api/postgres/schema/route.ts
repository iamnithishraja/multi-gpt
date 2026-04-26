import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const connectionString = searchParams.get('connectionString');
    
    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }
    // Get all tables in the public schema
    const tablesResult = await query(`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `, [], connectionString);

    const tables = await Promise.all(
      tablesResult.rows.map(async (table) => {
        // Get columns for each table
        const columnsResult = await query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns
          WHERE table_schema = 'public' 
            AND table_name = $1
          ORDER BY ordinal_position;
        `, [table.table_name], connectionString);

        // Get row count
        const countResult = await query(`
          SELECT COUNT(*) as count FROM "${table.table_name}";
        `, [], connectionString);

        return {
          name: table.table_name,
          type: table.table_type,
          columns: columnsResult.rows,
          rowCount: parseInt(countResult.rows[0].count),
        };
      })
    );

    return NextResponse.json({ tables });
  } catch (error: any) {
    console.error('Error fetching schema:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database schema', details: error.message },
      { status: 500 }
    );
  }
}
