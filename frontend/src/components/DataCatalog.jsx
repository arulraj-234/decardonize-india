import React, { useState, useEffect } from 'react';

export default function DataCatalog() {
  const [catalog, setCatalog] = useState({});
  const [loading, setLoading] = useState(true);
  const [catalogSearch, setCatalogSearch] = useState('');

  useEffect(() => {
    fetch('/api/tables')
      .then(res => res.json())
      .then(d => { setCatalog(d); setLoading(false); })
      .catch(err => { console.error('Failed to load SQL catalog:', err); setLoading(false); });
  }, []);

  const tableKeys = Object.keys(catalog);
  const tablesOnlyCount = tableKeys.filter(k => (catalog[k]?.type || '').toLowerCase() !== 'view').length;
  const viewsOnlyCount = tableKeys.filter(k => (catalog[k]?.type || '').toLowerCase() === 'view').length;

  const filteredKeys = tableKeys.filter(name => {
    if (!catalogSearch.trim()) return true;
    const q = catalogSearch.toLowerCase().trim();
    const item = catalog[name] || {};
    return (
      name.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.type && item.type.toLowerCase().includes(q))
    );
  });

  return (
    <div className="clean-card">
      <div className="clean-card-header">
        <div>
          <h2 className="clean-card-title">Relational Database Catalog & CSV Exports</h2>
          <p className="clean-card-desc">{tablesOnlyCount || 22} standalone relational tables and {viewsOnlyCount || 5} analytical SQL views dynamically synced from official government sources</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--pine-700)' }}>
            {filteredKeys.length} items
          </div>
          <a 
            href="/data/csv/electricity_generation_utilities.csv" 
            className="badge-tag-clean badge-growth" 
            download 
            style={{ textDecoration: 'none' }}
          >
            Download Primary Datasets
          </a>
        </div>
      </div>

      <div style={{ padding: '0 0 16px 0' }}>
        <input 
          id="catalog-search-input"
          type="text" 
          className="search-input" 
          placeholder="Filter catalog tables & views (e.g. generation, renewable, view)..." 
          value={catalogSearch}
          onChange={(e) => setCatalogSearch(e.target.value)}
          style={{ maxWidth: '450px' }}
        />
      </div>

      <div className="clean-table-responsive">
        <table className="clean-table" id="sql-catalog-table">
          <thead>
            <tr>
              <th>Table / View Name</th>
              <th>Category</th>
              <th>Rows</th>
              <th>Description</th>
              <th>Primary Key</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Loading relational catalog...</td></tr>
            ) : filteredKeys.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>No matching tables or views found</td></tr>
            ) : (
              filteredKeys.map(name => {
                const item = catalog[name];
                const isView = (item.type || '').toLowerCase() === 'view';
                const pkey = item.primary_key ? item.primary_key.join(', ') : 'None';
                const csvLink = `/data/csv/${name}.csv`;

                return (
                  <tr key={name}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--pine-800)', fontSize: '13px' }}>
                      {name}
                    </td>
                    <td>
                      {isView ? (
                        <span className="badge-tag-clean" style={{ background: '#e0f2fe', color: '#0369a1' }}>SQL VIEW</span>
                      ) : (
                        <span className="badge-tag-clean badge-honest-clean">TABLE</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.row_count !== undefined ? Number(item.row_count).toLocaleString('en-IN') : '--'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-light-secondary)', maxWidth: '380px' }}>
                      {item.category || 'Official Energy Statistics'}
                    </td>
                    <td style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-light-muted)' }}>
                      {pkey}
                    </td>
                    <td>
                      <a href={csvLink} className="badge-tag-clean badge-growth" download style={{ textDecoration: 'none' }}>
                        Download CSV
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
