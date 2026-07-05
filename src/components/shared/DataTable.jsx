import React, { useState } from 'react';
import { Search, ArrowUp, ArrowDown, FileQuestion } from 'lucide-react';
import EmptyState from './EmptyState';

const DataTable = ({ columns, data, loading, onRowClick, searchable, actions, checkboxes, selectedRows = [], onSelectionChange, emptyIcon, emptyTitle, emptyDescription, emptyActionLabel, emptyOnAction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // Filtering
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return sortedData;
    return sortedData.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedData, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = paginatedData.map(r => r._id || r.id);
      onSelectionChange([...new Set([...selectedRows, ...allIds])]);
    } else {
      const pageIds = paginatedData.map(r => r._id || r.id);
      onSelectionChange(selectedRows.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectRow = (e, rowId) => {
    e.stopPropagation();
    if (e.target.checked) {
      onSelectionChange([...selectedRows, rowId]);
    } else {
      onSelectionChange(selectedRows.filter(id => id !== rowId));
    }
  };

  const isAllPageSelected = paginatedData.length > 0 && paginatedData.every(r => selectedRows.includes(r._id || r.id));

  return (
    <div className="bg-cz-card-bg rounded-xl border border-cz-border overflow-hidden flex flex-col">
      {/* Toolbar */}
      {(searchable || actions) && (
        <div className="p-4 border-b border-cz-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex-1">
            {searchable && (
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cz-text-secondary" size={18} />
                <input 
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-cz-dark-bg text-white border border-cz-border rounded-lg pl-10 pr-4 py-2 focus:border-cz-accent-orange focus:ring-1 focus:ring-cz-accent-orange outline-none transition-all"
                />
              </div>
            )}
          </div>
          <div>{actions}</div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cz-nav-bg border-b border-cz-border text-cz-text-secondary text-sm">
              {checkboxes && (
                <th className="p-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={isAllPageSelected}
                    onChange={handleSelectAll}
                    className="accent-cz-accent-orange rounded bg-cz-dark-bg border-cz-border w-4 h-4 cursor-pointer" 
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={`p-4 font-semibold ${col.sortable ? 'cursor-pointer select-none hover:text-white' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.label}</span>
                    {sortConfig.key === col.key && (
                      sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-cz-border animate-pulse">
                  {checkboxes && <td className="p-4"><div className="w-4 h-4 bg-cz-border rounded"></div></td>}
                  {columns.map((col, j) => (
                    <td key={j} className="p-4"><div className="h-4 bg-cz-border rounded w-3/4"></div></td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (checkboxes ? 1 : 0)}>
                  <EmptyState 
                    icon={emptyIcon || FileQuestion} 
                    title={emptyTitle || "No data found"} 
                    description={emptyDescription || (searchTerm ? "Try adjusting your search criteria." : "There is no data available to display.")} 
                    actionLabel={emptyActionLabel}
                    onAction={emptyOnAction}
                  />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => (
                <tr 
                  key={row.id || i} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`border-b border-cz-border hover:bg-white/5 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${i % 2 === 0 ? 'bg-cz-card-bg' : 'bg-[#0f172a]'}`}
                >
                  {checkboxes && (
                    <td className="p-4 w-12 text-center" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedRows.includes(row._id || row.id)}
                        onChange={(e) => handleSelectRow(e, row._id || row.id)}
                        className="accent-cz-accent-orange rounded bg-cz-dark-bg border-cz-border w-4 h-4 cursor-pointer" 
                      />
                    </td>
                  )}
                  {columns.map((col, j) => (
                    <td key={j} className="p-4 text-cz-text-primary text-sm">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="p-4 border-t border-cz-border flex items-center justify-between text-sm text-cz-text-secondary bg-cz-card-bg mt-auto">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
          </div>
          <div className="flex space-x-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-cz-border disabled:opacity-50 hover:bg-cz-nav-bg transition-colors"
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded flex items-center justify-center border transition-colors ${currentPage === i + 1 ? 'bg-cz-accent-orange border-cz-accent-orange text-white' : 'border-cz-border hover:bg-cz-nav-bg'}`}
              >
                {i + 1}
              </button>
            ))}

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-cz-border disabled:opacity-50 hover:bg-cz-nav-bg transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
