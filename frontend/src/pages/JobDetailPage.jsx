import { useToast } from '../components/Toast';
import Spinner from '../components/Spinner';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import useIsMobile from '../hooks/useIsMobile';
// Verdict config — reused across cards
const VERDICT = {
    shortlist: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)', label: 'Shortlisted', score: [80, 100] },
    maybe: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)', label: 'Under Review', score: [50, 79] },
    reject: { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.2)', label: 'Not Selected', score: [0, 49] },
};
const JobDetailPage = () => {
    const isMobile = useIsMobile();
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    if (!user || user.role !== 'recruiter') {
        return <Navigate to="/jobs" replace />;
    }
    const [job, setJob] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [questions, setQuestions] = useState({});
    const [loadingQ, setLoadingQ] = useState({});
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [jobRes, candRes] = await Promise.all([
                    api.get(`/jobs/${id}`),
                    api.get(`/applications/ranked?jobId=${id}&k=20`),
                ]);
                setJob(jobRes.data.job);
                setCandidates(candRes.data.topCandidates || []);
            } catch (err) {
                console.error(err);
                showToast('Failed to load job details', 'error');
            } finally { setLoading(false); }
        };
        fetchData();
    }, [id]);
    // Toggle expand/collapse a candidate card
    const toggleExpand = (appId) => {
        setExpanded(expanded === appId ? null : appId);
    };
    // Generate interview questions for a candidate
    const generateQuestions = async (appId) => {
        if (questions[appId]) return;
        setLoadingQ(prev => ({ ...prev, [appId]: true }));
        try {
            const res = await api.get(`/interview/${appId}`);
            setQuestions(prev => ({ ...prev, [appId]: res.data }));
        } catch (err) {
            console.error(err);
            showToast('Failed to generate interview questions', 'error');
        } finally {
            setLoadingQ(prev => ({ ...prev, [appId]: false }));
        }
    };
    if (loading) return <Spinner text="Loading applicants..." />;
    return (
        <div className="fade-up" style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
            {/* Back button */}
            <button onClick={() => navigate('/dashboard')} style={{
                background: 'none', border: 'none', color: 'var(--text-secondary)',
                fontSize: '13px', cursor: 'pointer', marginBottom: '1.5rem',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontFamily: 'DM Sans,sans-serif', padding: 0,
            }}>
                ← Back to Dashboard
            </button>
            {/* Job header card */}
            <div className="glass" style={{ borderRadius: '16px', padding: '1.75rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>Job Posting</p>
                        <h1 className="font-display" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                            {job?.title}
                        </h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {job?.location} · {job?.salary || 'Salary not disclosed'}
                        </p>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'Syne,sans-serif', lineHeight: 1 }}>
                            {candidates.length}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Total Applicants</div>
                    </div>
                </div>
                {/* Requirements */}
                {job?.requirements?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        {job.requirements.map((r, i) => (
                            <span key={i} style={{ fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '6px', background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>{r}</span>
                        ))}
                    </div>
                )}
            </div>
            {/* Candidates header */}
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: '1.25rem', gap: isMobile ? '1rem' : '0' }}>

                <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>Ranked Applicants</h2>

                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['All', 'Shortlisted', 'Maybe', 'Rejected'].map(f => (
                        <span key={f} style={{
                            fontSize: '11px', fontWeight: 500, padding: '4px 10px',
                            borderRadius: '999px', cursor: 'pointer',
                            background: 'rgba(255,255,255,0.04)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                        }}>{f}</span>
                    ))}
                </div>
            </div>
            {/* Empty */}
            {candidates.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No applications yet for this job</p>
                </div>
            )}
            {/* Candidate cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {candidates.map((app, i) => {
                    const vc = VERDICT[app.aiVerdict] || VERDICT.maybe;
                    const isOpen = expanded === app._id;
                    const qData = questions[app._id];
                    const isLoadingQ = loadingQ[app._id];
                    return (
                        <div key={app._id} className="glass" style={{
                            borderRadius: '16px', overflow: 'hidden',
                            animation: `fadeUp .35s ease ${i * 0.06}s both`,
                            borderColor: isOpen ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)',
                        }}>
                            {/* Card header */}
                            <div style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: isMobile ? '10px 12px' : '1.25rem' }}>
                                {/* Rank badge */}
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                                    background: i === 0 ? 'rgba(251,191,36,0.15)' : i === 1 ? 'rgba(156,163,175,0.1)' : i === 2 ? 'rgba(180,120,60,0.1)' : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${i === 0 ? 'rgba(251,191,36,0.3)' : i === 1 ? 'rgba(156,163,175,0.2)' : i === 2 ? 'rgba(180,120,60,0.2)' : 'var(--border)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '14px', fontWeight: 700, fontFamily: 'Syne,sans-serif',
                                    color: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#b47a3c' : 'var(--text-muted)',
                                }}>
                                    #{i + 1}
                                </div>
                                {/* Avatar */}
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                                    background: `linear-gradient(135deg, ${vc.color}33, rgba(99,102,241,0.2))`,
                                    border: `1px solid ${vc.border}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '15px', fontWeight: 700, fontFamily: 'Syne,sans-serif', color: vc.color,
                                }}>
                                    {app.candidate?.name?.[0]?.toUpperCase()}
                                </div>
                                {/* Name + email */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Syne,sans-serif', marginBottom: '2px' }}>
                                        {app.candidate?.name}
                                    </div>
                                    {!isMobile && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{app.candidate?.email}</div>}
                                </div>
                                {/* Score */}
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: 700, color: vc.color, fontFamily: 'Syne,sans-serif', lineHeight: 1, marginBottom: '6px' }}>
                                        {app.aiScore ?? '—'}
                                        {app.aiScore && <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>}
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: vc.bg, color: vc.color, border: `1px solid ${vc.border}` }}>
                                        {vc.label}
                                    </span>
                                </div>
                                {/* Expand toggle */}
                                <button onClick={() => toggleExpand(app._id)} style={{
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                                    borderRadius: '8px', width: '32px', height: '32px', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '14px',
                                    transition: 'all .2s', transform: isOpen ? 'rotate(180deg)' : 'none',
                                }}>▾</button>
                            </div>
                            {/* Score bar */}
                            {app.aiScore && (
                                <div style={{ height: '2px', background: 'rgba(255,255,255,0.04)', margin: '0 1.5rem' }}>
                                    <div style={{ height: '100%', width: `${app.aiScore}%`, background: `linear-gradient(90deg, ${vc.color}, var(--accent))`, borderRadius: '2px', transition: 'width 1s ease' }} />
                                </div>
                            )}
                            {/* Expanded section */}
                            {isOpen && (
                                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', animation: 'fadeUp .25s ease' }}>
                                    {/* Strengths + Weaknesses */}
                                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', padding: '1rem' }}>
                                            <p style={{ fontSize: '11px', fontWeight: 600, color: '#34d399', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '10px' }}>✓ Strengths</p>
                                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {app.aiStrengths?.map((s, i) => (
                                                    <li key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                                        <span style={{ color: '#34d399', flexShrink: 0, marginTop: '1px' }}>·</span> {s}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '1rem' }}>
                                            <p style={{ fontSize: '11px', fontWeight: 600, color: '#f87171', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '10px' }}>✗ Gaps</p>
                                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {app.aiWeaknesses?.map((w, i) => (
                                                    <li key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                                        <span style={{ color: '#f87171', flexShrink: 0, marginTop: '1px' }}>·</span> {w}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    {/* Interview questions button */}
                                    {!qData && (
                                        <button
                                            onClick={() => generateQuestions(app._id)}
                                            disabled={isLoadingQ}
                                            style={{
                                                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                                                color: '#a5b4fc', borderRadius: '10px', padding: '10px 18px',
                                                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                                                transition: 'all .2s', fontFamily: 'DM Sans,sans-serif',
                                                opacity: isLoadingQ ? .6 : 1,
                                            }}
                                        >
                                            {isLoadingQ ? '⏳ Generating questions...' : '✦ Generate Interview Questions'}
                                        </button>
                                    )}
                                    {/* Interview questions output */}
                                    {qData && (
                                        <div style={{ marginTop: '1rem', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <p style={{ fontSize: '11px', fontWeight: 600, color: '#a5b4fc', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                                                    ✦ Interview Questions for {qData.candidate}
                                                </p>
                                                <button onClick={() => {
                                                    const text = qData.questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n');
                                                    navigator.clipboard.writeText(text);
                                                    showToast('Questions copied to clipboard!', 'success');
                                                }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                                                    Copy all
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {qData.questions?.map((q, qi) => (
                                                    <div key={qi} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0, marginTop: '1px', fontFamily: 'Syne,sans-serif' }}>Q{qi + 1}</span>
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '3px', lineHeight: 1.5 }}>{q.question}</p>
                                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                                <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                                                                    {q.type}
                                                                </span>
                                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>→ {q.targetedAt}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
export default JobDetailPage;