import React, { useState, useEffect } from 'react';

export default function ForensicAudit() {
  const [auditData, setAuditData] = useState([]);
  const [finetuneData, setFinetuneData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit/models')
      .then(res => res.json())
      .then(d => {
        setAuditData(d.leakage_audit || []);
        setFinetuneData(d.fine_tuning_comparison || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load audit models:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="audit-view">
      {/* Leakage Audit Table */}
      <div className="clean-card">
        <div className="clean-card-header">
          <div>
            <h2 className="clean-card-title">Forensic Audit: Exposing Lookahead Leakage</h2>
            <p className="clean-card-desc">Audited benchmark verifying why 99.9% accuracy models were deceptive oracle cheats versus realistic leak-free models</p>
          </div>
          <span className="badge-tag-clean badge-growth">Audited & Verified</span>
        </div>
        
        <div className="clean-table-responsive">
          <table className="clean-table">
            <thead>
              <tr>
                <th>Forecasting Paradigm</th>
                <th>Model Architecture</th>
                <th>Features Used</th>
                <th>Audit Status</th>
                <th>Test Accuracy (%)</th>
                <th>Test MAPE (%)</th>
                <th>Holdout Error (GWh)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>Loading audit benchmark...</td></tr>
              ) : (
                auditData.map((row, idx) => {
                  const isLeaked = (row.Status || '').includes('[LEAKED]');
                  const acc = parseFloat(row['Reported_Accuracy(%)'] || 0);
                  const accColor = isLeaked ? '#b91c1c' : '#15803d';
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--text-light-muted)', fontSize: '12px' }}>{row.Paradigm}</td>
                      <td style={{ fontWeight: 600, color: 'var(--pine-950)' }}>{row.Model}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-light-secondary)' }}>{row.Features_Used}</td>
                      <td>
                        {isLeaked ? (
                          <span className="badge-tag-clean badge-leak-clean">Lookahead Leakage</span>
                        ) : (
                          <span className="badge-tag-clean badge-honest-clean">Verified Leak-Free</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: accColor, fontSize: '14px' }}>{acc.toFixed(2)}%</td>
                      <td>{parseFloat(row['Test_MAPE(%)'] || 0).toFixed(2)}%</td>
                      <td>{Number(row.Absolute_Error_GWh || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fine-Tuning Benchmarks */}
      <div className="clean-card">
        <div className="clean-card-header">
          <div>
            <h2 className="clean-card-title">Hyperparameter Optimization & Fine-Tuning Performance</h2>
            <p className="clean-card-desc">Before-vs-after accuracy benchmarks across time-series state-space orders and regularization penalties</p>
          </div>
        </div>
        <div className="clean-table-responsive">
          <table className="clean-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Baseline Configuration</th>
                <th>Fine-Tuned Configuration</th>
                <th>Val Accuracy Before</th>
                <th>Val Accuracy After</th>
                <th>Test Accuracy Before</th>
                <th>Test Accuracy After</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>Loading fine-tuning benchmarks...</td></tr>
              ) : (
                finetuneData.map((row, idx) => {
                  const testBefore = parseFloat(row['Test_Accuracy_Before(%)'] || 0);
                  const testAfter = parseFloat(row['Test_Accuracy_After(%)'] || 0);
                  const gain = testAfter - testBefore;
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: 'var(--pine-950)' }}>{row.Model}</td>
                      <td style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-light-muted)' }}>{row.Baseline_Config}</td>
                      <td style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--pine-700)', fontWeight: 600 }}>{row.FineTuned_Config}</td>
                      <td>{parseFloat(row['Val_Accuracy_Before(%)'] || 0).toFixed(2)}%</td>
                      <td style={{ fontWeight: 600, color: 'var(--pine-700)' }}>{parseFloat(row['Val_Accuracy_After(%)'] || 0).toFixed(2)}%</td>
                      <td>{testBefore.toFixed(2)}%</td>
                      <td style={{ fontWeight: 700, color: 'var(--pine-800)' }}>
                        {testAfter.toFixed(2)}%{' '}
                        {gain >= 0 ? (
                          <span className="badge-tag-clean badge-growth">+{gain.toFixed(2)}%</span>
                        ) : (
                          <span style={{ color: 'var(--text-light-muted)' }}>{gain.toFixed(2)}%</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
