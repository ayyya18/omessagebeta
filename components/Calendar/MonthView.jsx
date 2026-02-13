import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import './MonthView.css';

const MonthView = ({ tasks, currentDate, onDateClick, onTaskClick }) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday

    const days = [];

    // Fill empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="month-day empty"></div>);
    }

    // Fill days
    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        // Find tasks for this day
        const dailyTasks = tasks.filter(t => t.start.startsWith(dateStr));
        const isToday = new Date().toDateString() === new Date(year, month, i).toDateString();

        days.push(
            <div key={i} className={`month-day ${isToday ? 'today' : ''}`} onClick={() => onDateClick(dateStr)}>
                <div className="day-header">
                    <span className="day-number">{i}</span>
                    {dailyTasks.length > 0 && <span className="task-count-dot"></span>}
                </div>
                <div className="day-content">
                    {dailyTasks.slice(0, 3).map(task => (
                        <div
                            key={task.id}
                            className="month-task-pill"
                            style={{ backgroundColor: task.color, color: '#fff' }}
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering onDateClick
                                onTaskClick(task);
                            }}
                        >
                            <span className="time">{new Date(task.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="title">{task.title}</span>
                        </div>
                    ))}
                    {dailyTasks.length > 3 && (
                        <div className="more-tasks">+{dailyTasks.length - 3} more</div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="month-view-container">
            <div className="month-grid-header">
                <div>SUN</div>
                <div>MON</div>
                <div>TUE</div>
                <div>WED</div>
                <div>THU</div>
                <div>FRI</div>
                <div>SAT</div>
            </div>
            <div className="month-grid-body">
                {days}
            </div>
        </div>
    );
};

export default MonthView;
