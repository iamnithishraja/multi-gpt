"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Column = {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
};

type Table = {
  name: string;
  type: string;
  columns: Column[];
  rowCount: number;
};

type TableData = {
  table: string;
  data: any[];
  pagination: {
    page: number;
    limit: number;
    totalRows: number;
    totalPages: number;
  };
};

export default function PostgresViewer() {
  const [connectionString, setConnectionString] = useState("postgres://lea_user:q6vOk5ulW0g7WpwgVcfiggCqDoJ5TBpj@173.208.248.34:5432/lea_portal");
  const [isConnected, setIsConnected] = useState(false);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const handleConnect = async () => {
    if (!connectionString.trim()) {
      setError("Please enter a connection string");
      return;
    }
    await fetchSchema();
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setTables([]);
    setSelectedTable(null);
    setTableData(null);
    setError(null);
  };

  useEffect(() => {
    if (selectedTable && isConnected) {
      fetchTableData(selectedTable, currentPage);
    }
  }, [selectedTable, currentPage]);

  const fetchSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/postgres/schema?connectionString=${encodeURIComponent(connectionString)}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || errorData.error || "Failed to fetch schema");
      }
      const data = await res.json();
      setTables(data.tables);
      setIsConnected(true);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName: string, page: number) => {
    try {
      setDataLoading(true);
      const res = await fetch(`/api/postgres/table?table=${tableName}&page=${page}&limit=50&connectionString=${encodeURIComponent(connectionString)}`);
      if (!res.ok) throw new Error("Failed to fetch table data");
      const data = await res.json();
      setTableData(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDataLoading(false);
    }
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setCurrentPage(1);
  };

  const filteredTables = tables.filter((table) =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTableInfo = tables.find((t) => t.name === selectedTable);

  // Connection Form
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#f0e8d0] flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#1a1500] to-[#2a2000] border border-[rgba(201,168,76,0.3)] flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-[#f0e8d0] mb-2">PostgreSQL Viewer</h1>
            <p className="text-[rgba(240,232,208,0.5)]">Connect to your PostgreSQL database to explore tables and data</p>
          </div>

          <div className="bg-[#0e0e0e] border border-[rgba(201,168,76,0.15)] rounded-2xl p-8">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#f0e8d0] mb-2">
                Database Connection String
              </label>
              <input
                type="text"
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                placeholder="postgres://user:password@host:port/database"
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-lg text-[#f0e8d0] placeholder-[rgba(240,232,208,0.3)] outline-none focus:border-[rgba(201,168,76,0.4)] focus:ring-2 focus:ring-[rgba(201,168,76,0.1)] transition-all font-mono text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleConnect();
                  }
                }}
              />
              <p className="mt-2 text-xs text-[rgba(240,232,208,0.4)]">
                Example: postgres://username:password@localhost:5432/mydb
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)]">
                <div className="flex items-start gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth="2" className="shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-[#fca5a5] mb-1">Connection Failed</p>
                    <p className="text-xs text-[rgba(239,68,68,0.8)]">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={loading || !connectionString.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#E8D08A] text-[#0a0a0a] font-bold hover:shadow-[0_4px_20px_rgba(201,168,76,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin"/>
                  Connecting...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  Connect to Database
                </>
              )}
            </button>

            <div className="mt-6 pt-6 border-t border-[rgba(201,168,76,0.1)]">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 text-sm text-[rgba(240,232,208,0.5)] hover:text-[rgba(240,232,208,0.9)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0e8d0]">
      {/* Header */}
      <header className="border-b border-[rgba(201,168,76,0.1)] bg-[#0e0e0e] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[rgba(240,232,208,0.5)] hover:text-[rgba(240,232,208,0.9)] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1a1500] to-[#2a2000] border border-[rgba(201,168,76,0.3)] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#f0e8d0]">PostgreSQL Viewer</h1>
                <p className="text-xs text-[rgba(240,232,208,0.4)]">Connected</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSchema}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.3)] text-[#C9A84C] hover:bg-[rgba(201,168,76,0.15)] transition-colors text-sm font-medium"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Refresh
            </button>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#fca5a5] hover:bg-[rgba(239,68,68,0.15)] transition-colors text-sm font-medium"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Disconnect
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar - Tables List */}
        <aside className="w-80 border-r border-[rgba(201,168,76,0.1)] bg-[#0e0e0e] flex flex-col">
          <div className="p-4 border-b border-[rgba(201,168,76,0.08)]">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(240,232,208,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-lg text-sm text-[#f0e8d0] placeholder-[rgba(240,232,208,0.3)] outline-none focus:border-[rgba(201,168,76,0.3)] transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[rgba(201,168,76,0.2)] border-t-[#C9A84C] rounded-full animate-spin"/>
              </div>
            ) : error ? (
              <div className="p-4 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[#fca5a5] text-sm">
                {error}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => handleTableSelect(table.name)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                      selectedTable === table.name
                        ? "bg-[rgba(201,168,76,0.15)] text-[#f0e8d0] border border-[rgba(201,168,76,0.3)]"
                        : "text-[rgba(240,232,208,0.6)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[rgba(240,232,208,0.9)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                          <path d="M3 3h18v18H3z"/>
                          <path d="M3 9h18M9 3v18"/>
                        </svg>
                        <span className="text-sm font-medium truncate">{table.name}</span>
                      </div>
                      <span className="text-xs text-[rgba(240,232,208,0.4)] shrink-0 ml-2">
                        {table.rowCount.toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-[rgba(201,168,76,0.08)]">
            <div className="text-xs text-[rgba(240,232,208,0.4)]">
              <div className="flex justify-between mb-1">
                <span>Total Tables:</span>
                <span className="font-semibold text-[#C9A84C]">{tables.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Rows:</span>
                <span className="font-semibold text-[#C9A84C]">
                  {tables.reduce((sum, t) => sum + t.rowCount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content - Table Data */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {!selectedTable ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#1a1500] to-[#2a2000] border border-[rgba(201,168,76,0.3)] flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/>
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[#f0e8d0] mb-2">Select a Table</h2>
                <p className="text-sm text-[rgba(240,232,208,0.4)]">
                  Choose a table from the sidebar to view its data
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Table Info Header */}
              <div className="px-6 py-4 border-b border-[rgba(201,168,76,0.08)] bg-[#0e0e0e]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#f0e8d0]">{selectedTable}</h2>
                    <p className="text-xs text-[rgba(240,232,208,0.4)] mt-1">
                      {selectedTableInfo?.columns.length} columns • {selectedTableInfo?.rowCount.toLocaleString()} rows
                    </p>
                  </div>
                </div>
              </div>

              {/* Table Data */}
              <div className="flex-1 overflow-auto p-6">
                {dataLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-[rgba(201,168,76,0.2)] border-t-[#C9A84C] rounded-full animate-spin"/>
                  </div>
                ) : tableData && tableData.data.length > 0 ? (
                  <div className="border border-[rgba(201,168,76,0.15)] rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-[rgba(201,168,76,0.08)] border-b border-[rgba(201,168,76,0.15)]">
                          <tr>
                            {Object.keys(tableData.data[0]).map((column) => (
                              <th
                                key={column}
                                className="px-4 py-3 text-left text-xs font-semibold text-[#C9A84C] uppercase tracking-wider whitespace-nowrap"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(201,168,76,0.08)]">
                          {tableData.data.map((row, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                            >
                              {Object.values(row).map((value: any, cellIdx) => (
                                <td
                                  key={cellIdx}
                                  className="px-4 py-3 text-[rgba(240,232,208,0.7)] whitespace-nowrap"
                                >
                                  {value === null ? (
                                    <span className="text-[rgba(240,232,208,0.3)] italic">null</span>
                                  ) : typeof value === "object" ? (
                                    <span className="text-[rgba(201,168,76,0.6)] font-mono text-xs">
                                      {JSON.stringify(value)}
                                    </span>
                                  ) : typeof value === "boolean" ? (
                                    <span className={value ? "text-green-400" : "text-red-400"}>
                                      {value.toString()}
                                    </span>
                                  ) : (
                                    <span className="max-w-md truncate inline-block">
                                      {String(value)}
                                    </span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-[rgba(240,232,208,0.4)]">No data available</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {tableData && tableData.pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-[rgba(201,168,76,0.08)] bg-[#0e0e0e]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[rgba(240,232,208,0.4)]">
                      Showing {((currentPage - 1) * tableData.pagination.limit) + 1} to{" "}
                      {Math.min(currentPage * tableData.pagination.limit, tableData.pagination.totalRows)} of{" "}
                      {tableData.pagination.totalRows} rows
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.3)] text-[#C9A84C] hover:bg-[rgba(201,168,76,0.15)] transition-colors text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-[rgba(240,232,208,0.6)]">
                        Page {currentPage} of {tableData.pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(tableData.pagination.totalPages, p + 1))}
                        disabled={currentPage === tableData.pagination.totalPages}
                        className="px-3 py-1.5 rounded-lg bg-[rgba(201,168,76,0.1)] border border-[rgba(201,168,76,0.3)] text-[#C9A84C] hover:bg-[rgba(201,168,76,0.15)] transition-colors text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
