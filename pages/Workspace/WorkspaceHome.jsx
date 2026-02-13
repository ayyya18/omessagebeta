import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import CreateWorkspaceModal from '../../components/Workspace/CreateWorkspaceModal';
import CreateProjectModal from '../../components/Workspace/CreateProjectModal';
import ProjectDetailModal from '../../components/Workspace/ProjectDetailModal';
import InviteWorkspaceMemberModal from '../../components/Workspace/InviteWorkspaceMemberModal';
import WorkspaceStream from '../../components/Workspace/WorkspaceStream';
import AnnouncementBanner from '../../components/Workspace/AnnouncementBanner';
import WorkspaceFiles from '../../components/Workspace/WorkspaceFiles';
import WorkspaceWhiteboard from '../../components/Workspace/WorkspaceWhiteboard';
import WorkspaceSettings from '../../components/Workspace/WorkspaceSettings';
import ExternalLinksModal from '../../components/Workspace/ExternalLinksModal';
import WorkloadOverview from '../../components/Workspace/WorkloadOverview';
import { FiSearch, FiBell, FiBox, FiLayers, FiGlobe, FiPenTool, FiClipboard, FiMessageSquare, FiVideo, FiPlus, FiGrid, FiMessageCircle, FiFile, FiLayout, FiSettings } from 'react-icons/fi';
import './Workspace.css';

import WorkspaceProjectView from '../../components/Workspace/WorkspaceProjectView';

const WorkspaceHome = () => {
    const { currentUser } = useAuth();
    const { workspaces, currentWorkspace, switchWorkspace, createWorkspace, projects, createProject, externalLinks, saveExternalLinks } = useWorkspace();

    // UI State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [showExternalLinksModal, setShowExternalLinksModal] = useState(false);
    const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);

    // Tab Components (Placeholders for now) - REMOVED

    return (
        <DashboardLayout
            sidebar={
                <div className="chat-sidebar-column dashboard-sidebar">
                    <div className="sidebar-header">
                        <h3>My Workspaces</h3>
                    </div>

                    <div className="filter-list" style={{ padding: '0 10px' }}>
                        {workspaces.map(ws => (
                            <div
                                key={ws.id}
                                className="filter-item"
                                style={{
                                    background: currentWorkspace?.id === ws.id ? 'var(--input-bg)' : 'transparent',
                                    border: currentWorkspace?.id === ws.id ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                                    borderRadius: 12,
                                    margin: '4px 0',
                                    padding: '12px',
                                    backdropFilter: currentWorkspace?.id === ws.id ? 'blur(10px)' : 'none'
                                }}
                                onClick={() => {
                                    switchWorkspace(ws.id);
                                    setSelectedProject(null); // Reset project view on switch
                                }}
                            >
                                <div className="user-avatar" style={{ width: 36, height: 36, fontSize: '0.9rem', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                                    {ws.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, marginLeft: 12 }}>
                                    <strong style={{ fontWeight: 600, fontSize: '0.95rem' }}>{ws.name}</strong>
                                    <br /><span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{ws.members?.length || 1} members</span>
                                </div>
                            </div>
                        ))}
                        {workspaces.length === 0 && (
                            <div style={{ padding: 30, textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>
                                <FiBox size={24} style={{ marginBottom: 10 }} /> <br />
                                No workspaces yet.
                            </div>
                        )}
                    </div>
                </div>
            }

            content={
                <div className="workspace-container" style={{ maxWidth: 1600, margin: '0 auto', width: '100%', height: 'calc(100vh - 40px)' }}>
                    {selectedProject ? (
                        // Render Title Board View
                        <div style={{ padding: 32, height: '100%' }}>
                            <WorkspaceProjectView
                                project={selectedProject}
                                workspace={currentWorkspace}
                                onBack={() => setSelectedProject(null)}
                            />
                        </div>
                    ) : (
                        // Render Default Dashboard
                        <>
                            {/* Minimal Header */}
                            <div className="workspace-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 24, padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <div>
                                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
                                            {currentWorkspace ? currentWorkspace.name : `Hello, ${currentUser?.displayName || 'Creator'}`}
                                        </h1>
                                        <p style={{ opacity: 0.7, fontSize: '0.95rem' }}>{currentWorkspace ? `Managed by ${workspaces.find(w => w.id === currentWorkspace.id)?.members?.find(m => m.role === 'admin')?.email || 'Admin'}` : 'Select a workspace to get started'}</p>
                                    </div>
                                    <div className="header-actions" style={{ gap: 12 }}>
                                        {currentWorkspace?.generalChatId && (
                                            <>
                                                <button
                                                    className="glass-btn primary"
                                                    onClick={() => window.location.href = `/chat`}
                                                    style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 20 }}
                                                >
                                                    <FiMessageSquare /> Team Chat
                                                </button>
                                                <button
                                                    className="glass-btn primary"
                                                    onClick={() => setShowInviteMemberModal(true)}
                                                    style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 20 }}
                                                    title="Invite Member"
                                                >
                                                    <FiPlus /> Invite
                                                </button>
                                            </>
                                        )}
                                        <div style={{ width: 1, height: 24, background: 'var(--glass-border)', margin: '0 8px' }}></div>
                                        <button className="glass-btn icon-only rounded"><FiSearch /></button>
                                        <button className="glass-btn icon-only rounded"><FiBell /></button>
                                    </div>
                                </div>

                                {/* Premium Tab Navigation */}
                                {currentWorkspace && (
                                    <div className="workspace-tabs" style={{ display: 'flex', gap: 8, width: '100%', paddingBottom: 0, justifyContent: 'flex-start' }}>
                                        {['overview', 'stream', 'files', 'whiteboard', 'settings'].map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => setActiveTab(tab)}
                                                style={{
                                                    padding: '10px 20px',
                                                    background: activeTab === tab ? 'var(--text-primary)' : 'transparent',
                                                    color: activeTab === tab ? 'var(--bg-primary)' : 'var(--text-secondary)',
                                                    border: 'none',
                                                    borderRadius: 24,
                                                    cursor: 'pointer',
                                                    fontWeight: activeTab === tab ? 600 : 500,
                                                    fontSize: '0.9rem',
                                                    textTransform: 'capitalize',
                                                    display: 'flex', alignItems: 'center', gap: 8,
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                {tab === 'overview' && <FiGrid />}
                                                {tab === 'stream' && <FiMessageCircle />}
                                                {tab === 'files' && <FiFile />}
                                                {tab === 'whiteboard' && <FiLayout />}
                                                {tab === 'settings' && <FiSettings />}
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Main Content Area */}
                            {currentWorkspace ? (
                                <div className="workspace-content-area" style={{ padding: 32 }}>

                                    {(activeTab === 'overview' || activeTab === 'stream') && (
                                        <AnnouncementBanner />
                                    )}

                                    {activeTab === 'overview' && (
                                        <div className="workspace-grid-layout" style={{ display: 'grid', gap: 40 }}>
                                            {/* Main Dashboard */}
                                            <div className="workspace-main">

                                                {/* Project Section Header */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>Active Projects</h3>
                                                    <button className="glass-btn small" onClick={() => setShowCreateProject(true)}><FiPlus /> New Project</button>
                                                </div>

                                                <div className="projects-grid" style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                                    gap: 20
                                                }}>
                                                    {projects.map(project => (
                                                        <div key={project.id} className="project-card glass-card hover-lift" onClick={() => setSelectedProject(project)} style={{ cursor: 'pointer', padding: 20, borderRadius: 16 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                                                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                                                    <FiBox />
                                                                </div>
                                                                <span className={`status-badge ${project.status}`}>{project.status || 'Active'}</span>
                                                            </div>

                                                            <h4 style={{ fontSize: '1.1rem', marginBottom: 6 }}>{project.name}</h4>
                                                            <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: 20 }}>
                                                                {project.category} • {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No Deadline'}
                                                            </p>

                                                            <div className="progress-bar-container" style={{ background: 'rgba(0,0,0,0.05)', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
                                                                <div className="progress-fill" style={{ width: `${project.progress || 0}%`, background: '#10B981', height: '100%' }}></div>
                                                            </div>

                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', opacity: 0.8 }}>
                                                                <div className="member-stack" style={{ display: 'flex' }}>
                                                                    {/* Mock Avatars */}
                                                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#ddd', border: '2px solid var(--bg-primary)' }}></div>
                                                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#bbb', border: '2px solid var(--bg-primary)', marginLeft: -8 }}></div>
                                                                </div>
                                                                <span>{project.progress || 0}% Complete</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="glass-card hover-lift" onClick={() => setShowCreateProject(true)} style={{ border: '2px dashed var(--glass-border)', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, cursor: 'pointer', borderRadius: 16, opacity: 0.7 }}>
                                                        <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                                            <FiPlus size={24} />
                                                        </div>
                                                        <span style={{ fontWeight: 500 }}>Create New Project</span>
                                                    </div>
                                                </div>

                                                {/* Recent Activity Section */}
                                                <div style={{ marginTop: 40 }}>
                                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 20 }}>Recent Activity</h3>
                                                    <div className="glass-card" style={{ padding: 24, borderRadius: 16, opacity: 0.8, textAlign: 'center' }}>
                                                        <FiLayers size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                                                        <p>Activity feed coming soon...</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Sidebar */}
                                            <div className="workspace-right-column">
                                                <div className="glass-card" style={{ padding: 20, borderRadius: 16, marginBottom: 24 }}>
                                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Team Workload</h3>
                                                    <WorkloadOverview />
                                                </div>

                                                {/* Feature 10: External Links Gallery */}
                                                <div className="links-widget">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Quick Links</h3>
                                                        {currentWorkspace?.members?.find(m => m.uid === currentUser?.uid)?.role === 'admin' && (
                                                            <button
                                                                className="glass-btn icon-only small"
                                                                style={{ width: 24, height: 24 }}
                                                                onClick={() => setShowExternalLinksModal(true)}
                                                            >
                                                                <FiPlus size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                        {externalLinks.length === 0 ? (
                                                            <div style={{ textAlign: 'center', opacity: 0.5, padding: 20 }}>
                                                                <FiGlobe size={24} style={{ marginBottom: 8 }} />
                                                                <p style={{ fontSize: '0.85rem' }}>No links yet</p>
                                                            </div>
                                                        ) : (
                                                            externalLinks.map((link) => (
                                                                <a
                                                                    key={link.id}
                                                                    href={link.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="link-item glass-card hover-lift"
                                                                    style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'var(--text-primary)', borderRadius: 12 }}
                                                                >
                                                                    <div style={{ fontSize: '1.5rem' }}>{link.icon}</div>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{link.name}</div>
                                                                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                                                                            {new URL(link.url).hostname}
                                                                        </div>
                                                                    </div>
                                                                    <FiGlobe style={{ opacity: 0.4 }} />
                                                                </a>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'stream' && <WorkspaceStream />}
                                    {activeTab === 'files' && <WorkspaceFiles />}
                                    {activeTab === 'whiteboard' && <WorkspaceWhiteboard />}
                                    {activeTab === 'settings' && <WorkspaceSettings />}

                                </div>
                            ) : (
                                <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                                    <div style={{ marginBottom: 24, width: 80, height: 80, background: 'var(--hover-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FiGrid size={36} style={{ opacity: 0.7 }} />
                                    </div>
                                    <h2 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Welcome to Workspaces</h2>
                                    <p style={{ marginBottom: 32, color: 'var(--text-secondary)', maxWidth: 400, textAlign: 'center' }}>
                                        Create a dedicated space for your team to collaborate on projects, share files, and chat.
                                    </p>
                                    <button className="glass-btn primary large" onClick={() => setShowCreateModal(true)}>
                                        <FiPlus style={{ marginRight: 8 }} /> Create New Workspace
                                    </button>
                                </div>
                            )}

                            {/* Modals */}
                            <CreateWorkspaceModal show={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={createWorkspace} />
                            <CreateProjectModal show={showCreateProject} onClose={() => setShowCreateProject(false)} onCreate={(details) => createProject(currentWorkspace?.id, details)} />
                            <InviteWorkspaceMemberModal show={showInviteMemberModal} onClose={() => setShowInviteMemberModal(false)} />
                            <ExternalLinksModal
                                show={showExternalLinksModal}
                                onClose={() => setShowExternalLinksModal(false)}
                                workspaceId={currentWorkspace?.id}
                                existingLinks={externalLinks}
                                onSave={(links) => {
                                    if (currentWorkspace) {
                                        saveExternalLinks(currentWorkspace.id, links);
                                    }
                                }}
                            />
                            {/* ProjectDetailModal removed in favor of WorkspaceProjectView */}
                        </>
                    )}
                </div>
            }
        />
    );
};

export default WorkspaceHome;
