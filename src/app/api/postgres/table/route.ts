import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tableName = searchParams.get('table');
    const connectionString = searchParams.get('connectionString');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    if (!tableName) {
      return NextResponse.json(
        { error: 'Table name is required' },
        { status: 400 }
      );
    }
    
    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    // Validate table name to prevent SQL injection
    const tableCheckResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = $1;
    `, [tableName], connectionString);

    if (tableCheckResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) as count FROM "${tableName}";`, [], connectionString);
    const totalRows = parseInt(countResult.rows[0].count);

    // Get paginated data
    const dataResult = await query(`
      SELECT * FROM "${tableName}"
      ORDER BY (SELECT NULL)
      LIMIT $1 OFFSET $2;
    `, [limit, offset], connectionString);

    return NextResponse.json({
      table: tableName,
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        totalRows,
        totalPages: Math.ceil(totalRows / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching table data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table data', details: error.message },
      { status: 500 }
    );
  }
}
