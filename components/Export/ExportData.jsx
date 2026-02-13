import React, { useState } from 'react';
import { FiDownload, FiFileText, FiTable } from 'react-icons/fi';

const ExportData = ({ workspaceId, projectId, tasks }) => {
    const [exporting, setExporting] = useState(false);

    // Export to CSV
    const exportToCSV = () => {
        setExporting(true);

        try {
            const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'Assignees', 'Start Date', 'End Date', 'Progress', 'Created At'];
            const rows = tasks.map(task => [
                task.id,
                task.title || '',
                task.description || '',
                task.status || '',
                task.priority || '',
                Array.isArray(task.assignees) ? task.assignees.join(', ') : '',
                task.start || '',
                task.end || '',
                task.progress || 0,
                task.createdAt || ''
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `tasks_export_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } catch (err) {
            console.error('Error exporting to CSV:', err);
            alert('Failed to export CSV');
        }

        setExporting(false);
    };

    // Export to JSON
    const exportToJSON = () => {
        setExporting(true);

        try {
            const jsonContent = JSON.stringify(tasks, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `tasks_export_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
        } catch (err) {
            console.error('Error exporting to JSON:', err);
            alert('Failed to export JSON');
        }

        setExporting(false);
    };

    // Print report
    const printReport = () => {
        window.print();
    };

    return (
        <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 20, fontSize: '1.2rem', fontWeight: 600 }}>
                Export & Reports
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                    onClick={exportToCSV}
                    disabled={exporting || tasks.length === 0}
                    style={{
                        padding: '12px 20px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: 8,
                        color: '#10B981',
                        cursor: tasks.length === 0 ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        opacity: tasks.length === 0 ? 0.5 : 1
                    }}
                >
                    <FiTable size={20} />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <div>Export to CSV</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 400 }}>
                            Download tasks as spreadsheet
                        </div>
                    </div>
                </button>

                <button
                    onClick={exportToJSON}
                    disabled={exporting || tasks.length === 0}
                    style={{
                        padding: '12px 20px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: 8,
                        color: '#3B82F6',
                        cursor: tasks.length === 0 ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        opacity: tasks.length === 0 ? 0.5 : 1
                    }}
                >
                    <FiFileText size={20} />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <div>Export to JSON</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 400 }}>
                            Download tasks as JSON data
                        </div>
                    </div>
                </button>

                <button
                    onClick={printReport}
                    disabled={tasks.length === 0}
                    style={{
                        padding: '12px 20px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: 8,
                        color: '#F59E0B',
                        cursor: tasks.length === 0 ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        opacity: tasks.length === 0 ? 0.5 : 1
                    }}
                >
                    <FiDownload size={20} />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <div>Print Report</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 400 }}>
                            Generate printable report
                        </div>
                    </div>
                </button>
            </div>

            {tasks.length === 0 && (
                <div style={{
                    marginTop: 16,
                    padding: 12,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 8,
                    color: '#EF4444',
                    fontSize: '0.85rem',
                    textAlign: 'center'
                }}>
                    No tasks available to export
                </div>
            )}
        </div>
    );
};

export default ExportData;
