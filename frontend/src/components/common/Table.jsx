import React from 'react';
import { Loader2, Database } from 'lucide-react';

export const Table = ({
  headers = [], // Array of strings or objects { label, className }
  data = [],
  renderRow,
  isLoading = false,
  loadingText = 'Loading records...',
  emptyText = 'No items found matching your filters.',
  emptyIcon: EmptyIcon = Database,
  className = '',
  containerClassName = '',
  ...props
}) => {
  return (
    <div className={`bg-white rounded-[16px] overflow-hidden border border-neutral-200 w-full shadow-xs ${containerClassName}`}>
      <div className="overflow-x-auto">
        <table className={`w-full text-left text-sm border-collapse ${className}`} {...props}>
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50/50 text-neutral-500 text-[11px] font-semibold uppercase tracking-wider">
              {headers.map((header, idx) => {
                const isObj = typeof header === 'object' && header !== null;
                const label = isObj ? header.label : header;
                const headerClass = isObj ? header.className : '';
                return (
                  <th key={idx} className={`py-3.5 px-6 font-semibold ${headerClass}`}>
                    {label}
                  </th>
                );
              })}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-neutral-100 text-neutral-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse border-b border-neutral-100">
                  {headers.map((_, hIdx) => (
                    <td key={hIdx} className="py-4 px-6">
                      <div className="h-3.5 bg-neutral-100 rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="py-12 text-center text-neutral-400">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <EmptyIcon className="w-8 h-8 text-neutral-300 stroke-[1.5]" />
                    <h4 className="text-xs font-semibold text-neutral-500">{emptyText}</h4>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => renderRow(item, idx))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
