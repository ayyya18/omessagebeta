import React, { useState, useEffect } from 'react';
import { FiPlay, FiPause, FiClock } from 'react-icons/fi';
import { useTimeTracking } from '../../context/TimeTrackingContext';

const TimeTracker = ({ workspaceId, projectId, taskId, taskTitle }) => {
    const { activeTimer, startTimer, stopTimer, formatDuration } = useTimeTracking();
    const [elapsed, setElapsed] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    // Check if timer is running for this task
    useEffect(() => {
        if (activeTimer && activeTimer.taskId === taskId) {
            setIsRunning(true);
            // Calculate elapsed time
            const interval = setInterval(() => {
                const now = new Date();
                const start = new Date(activeTimer.startTime);
                const diff = Math.floor((now - start) / 1000);
                setElapsed(diff);
            }, 1000);

            return () => clearInterval(interval);
        } else {
            setIsRunning(false);
            setElapsed(0);
        }
    }, [activeTimer, taskId]);

    const handleToggle = async () => {
        if (isRunning) {
            await stopTimer(workspaceId, projectId);
        } else {
            await startTimer(workspaceId, projectId, taskId, taskTitle);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            background: isRunning ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isRunning ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 8,
            fontSize: '0.9rem'
        }}>
            <button
                onClick={handleToggle}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: isRunning ? '#10B981' : 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4
                }}
                title={isRunning ? 'Stop timer' : 'Start timer'}
            >
                {isRunning ? <FiPause size={18} /> : <FiPlay size={18} />}
            </button>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: isRunning ? '#10B981' : 'var(--text-primary)'
            }}>
                <FiClock size={16} />
                <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>
                    {formatDuration(elapsed)}
                </span>
            </div>
        </div>
    );
};

export default TimeTracker;
