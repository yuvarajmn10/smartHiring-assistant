import { useToast } from '../components/Toast';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useIsMobile from '../hooks/useIsMobile';
const VERDICT_CONFIG = {
    shortlist: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.25)', label: 'Shortlisted ✓', msg: 'Strong match — recruiter will likely review you.' },
    maybe: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)', label: 'Under Review', msg: 'Partial match — consider tailoring your resume.' },
    reject: { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.2)', label: 'Low Match', msg: 'Weak match for this role. Try other positions.' },
};
const ApplyPage = () => {
    const isMobile = useIsMobile();
    const { id: jobId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const fileInputRef = useRef();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stage, setStage] = useState('form');
    // 'form' | 'processing' | 'success'
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [error, setError] = useState('');
    const [processingStep, setProcessingStep] = useState(0);
    const [result, setResult] = useState(null);
    useEffect(() => {
        api.get(`/jobs/${jobId}`)
            .then(res => setJob(res.data.job))
            .catch(() => navigate('/jobs'))
            .finally(() => setLoading(false)); // ➕ Add this
    }, [jobId]);

    // Drag and drop handlers
    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped?.type === 'application/pdf') {
            setFile(dropped); setError('');
        } else {
            setError('Please upload a PDF file only.');
            showToast('Please select a PDF file.', 'error');
        }
    };
    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected?.type === 'application/pdf') {
            setFile(selected); setError('');
        } else {
            setError('Please select a PDF file.');
            showToast('Please select a PDF file.', 'error');
        }
    };
    // Main submit handler
    const handleSubmit = async () => {
        if (!file) { setError('Please upload your resume PDF.'); return; }
        setError('');
        setStage('processing');
        setProcessingStep(0);
        try {
            // Step 1 — Parse PDF
            setProcessingStep(1);
            const formData = new FormData();
            formData.append('resume', file);
            const parseRes = await api.post('/resume/parse', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const resumeText = parseRes.data.resumeText;
            // Step 2 — AI analysis (visual delay so user sees the step)
            setProcessingStep(2);
            await new Promise(r => setTimeout(r, 600));
            // Step 3 — Submit application
            setProcessingStep(3);
            const appRes = await api.post('/applications', {
                jobId,
                resumeText,
                coverLetter,
            });
            setResult(appRes.data.application);
            setStage('success');
            showToast('Application submitted successfully!', 'success');
        } catch (err) {
            setStage('form');
            setError(err.response?.data?.message || 'Submission failed. Try again.');
            showToast(err.response?.data?.message || 'Submission failed. Try again.', 'error');
        }
    };
    const pageWrap = {
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.1) 0%, transparent 55%), var(--bg-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem',
    };
    if (!job && loading) return null;
    // ── Stage: processing ────────────────────────────────
    if (stage === 'processing') {
        const steps = ['Uploading resume', 'Parsing PDF content', 'Running AI analysis', 'Submitting application'];
        return (
            <div style={pageWrap}>
                <div className="fade-up" style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}>
                    {/* Spinner */}
                    <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 2rem' }}>
                        <div style={{ width: '72px', height: '72px', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>✦</div>
                    </div>
                    <h2 className="font-display" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        Processing your application
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Our AI is reading your resume and computing your fit score
                    </p>
                    {/* Processing steps */}
                    <div className="glass" style={{ borderRadius: '14px', padding: '1.25rem', textAlign: 'left' }}>
                        {steps.map((step, i) => {
                            const done = processingStep > i + 1;
                            const active = processingStep === i + 1;
                            return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <div style={{
                                        width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '11px', fontWeight: 700,
                                        background: done ? 'rgba(16,185,129,0.15)' : active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${done ? 'rgba(16,185,129,0.3)' : active ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                                        color: done ? '#34d399' : active ? '#a5b4fc' : 'var(--text-muted)',
                                    }}>
                                        {done ? '✓' : i + 1}
                                    </div>
                                    <span style={{ fontSize: '13px', color: done ? 'var(--text-secondary)' : active ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: active ? 500 : 400 }}>
                                        {step}
                                        {active && <span style={{ color: 'var(--accent)', marginLeft: '6px' }}>...</span>}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }
    // ── Stage: success ───────────────────────────────────
    if (stage === 'success' && result) {
        const vc = VERDICT_CONFIG[result.aiVerdict] || VERDICT_CONFIG.maybe;
        return (
            <div style={pageWrap}>
                <div className="fade-up" style={{ width: '100%', maxWidth: '500px' }}>
                    {/* Success icon */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 1rem',
                            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                        }}>✓</div>
                        <h1 className="font-display" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                            Application submitted!
                        </h1>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Here is your AI fit analysis</p>
                    </div>
                    {/* Score card */}
                    <div className="glass" style={{ borderRadius: '16px', padding: '2rem', marginBottom: '1rem', textAlign: 'center' }}>
                        {/* Score ring */}
                        <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1.25rem' }}>
                            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                                <circle cx="60" cy="60" r="50" fill="none" stroke={vc.color} strokeWidth="8"
                                    strokeDasharray={`${(result.aiScore / 100) * 314} 314`}
                                    strokeLinecap="round"
                                    style={{ filter: `drop-shadow(0 0 6px ${vc.color})`, transition: 'stroke-dasharray 1s ease' }}
                                />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '28px', fontWeight: 800, color: vc.color, fontFamily: 'Syne,sans-serif', lineHeight: 1 }}>
                                    {result.aiScore ?? '—'}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 100</span>
                            </div>
                        </div>
                        {/* Verdict badge */}
                        <span style={{ fontSize: '13px', fontWeight: 600, padding: '5px 16px', borderRadius: '999px', background: vc.bg, color: vc.color, border: `1px solid ${vc.border}`, display: 'inline-block', marginBottom: '10px' }}>
                            {vc.label}
                        </span>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{vc.msg}</p>
                    </div>
                    {/* Strengths + Weaknesses */}
                    {(result.aiStrengths?.length > 0 || result.aiWeaknesses?.length > 0) && (
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', padding: '1rem' }}>
                                <p style={{ fontSize: '11px', fontWeight: 600, color: '#34d399', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '8px' }}>✓ Strengths</p>
                                {result.aiStrengths?.map((s, i) => (
                                    <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                        <span style={{ color: '#34d399', flexShrink: 0 }}>·</span> {s}
                                    </div>
                                ))}
                            </div>
                            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '1rem' }}>
                                <p style={{ fontSize: '11px', fontWeight: 600, color: '#f87171', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '8px' }}>✗ Gaps</p>
                                {result.aiWeaknesses?.map((w, i) => (
                                    <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                        <span style={{ color: '#f87171', flexShrink: 0 }}>·</span> {w}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
                        <button onClick={() => navigate('/dashboard')} style={{
                            flex: 1, background: 'var(--accent)', color: 'white', border: 'none',
                            borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 500,
                            cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
                            boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                        }}>View Dashboard</button>
                        <button onClick={() => navigate('/jobs')} style={{
                            flex: 1, background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)',
                            border: '1px solid var(--border)', borderRadius: '10px', padding: '12px',
                            fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
                        }}>Browse More Jobs</button>
                    </div>
                </div>
            </div>
        );
    }
    // ── Stage: form ──────────────────────────────────────
    return (
        <div style={pageWrap}>
            <div className="fade-up" style={{ width: '100%', maxWidth: '560px' }}>
                {/* Back */}
                <button onClick={() => navigate('/jobs')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', marginBottom: '1.5rem', padding: 0, fontFamily: 'DM Sans,sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ← Back to Jobs
                </button>
                {/* Job context */}
                {job && (
                    <div className="glass" style={{ borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#a5b4fc', fontFamily: 'Syne,sans-serif', flexShrink: 0 }}>
                            {job.title?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 500 }}>APPLYING FOR</p>
                            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Syne,sans-serif' }}>{job.title}</h2>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{job.location} · {job.salary}</p>
                        </div>
                    </div>
                )}
                {/* Main form card */}
                <div className="glass" style={{ borderRadius: '16px', padding: '2rem' }}>
                    <h1 className="font-display" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Submit Application</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>Upload your resume — our AI will score your fit in seconds</p>
                    {/* Error */}
                    {error && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '1.25rem' }}>
                            {error}
                        </div>
                    )}
                    {/* PDF Drop zone */}
                    <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            border: `2px dashed ${dragOver ? 'var(--accent)' : file ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: '14px',
                            padding: '2rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: dragOver ? 'rgba(99,102,241,0.06)' : file ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
                            transition: 'all .2s',
                            marginBottom: '1.25rem',
                        }}
                    >
                        <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                        {file ? (
                            <>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                                <p style={{ fontSize: '14px', fontWeight: 500, color: '#34d399', marginBottom: '4px' }}>{file.name}</p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB · Click to replace</p>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: '32px', marginBottom: '10px' }}>{dragOver ? '⬇️' : '📎'}</div>
                                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    {dragOver ? 'Drop your PDF here' : 'Drag & drop your resume'}
                                </p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>or click to browse · PDF only · max 5MB</p>
                            </>
                        )}
                    </div>
                    {/* Cover letter */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                            Cover Letter <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                        </label>
                        <textarea
                            className="input-dark"
                            rows={4}
                            value={coverLetter}
                            onChange={e => setCoverLetter(e.target.value)}
                            placeholder="Briefly explain why you're a great fit for this role..."
                            style={{ resize: 'none' }}
                        />
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                            {coverLetter.length} / 500 characters
                        </p>
                    </div>
                    {/* AI info banner */}
                    <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', padding: '10px 14px', marginBottom: '1.5rem', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '16px', flexShrink: 0 }}>✦</span>
                        <p style={{ fontSize: '12px', color: '#a5b4fc', lineHeight: 1.5 }}>
                            Your resume will be analysed by AI and scored 0–100 for fit against this role. You'll see your score and feedback immediately after submitting.
                        </p>
                    </div>
                    {/* Submit */}
                    <button onClick={handleSubmit} style={{
                        width: '100%', background: 'var(--accent)', color: 'white', border: 'none',
                        borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'DM Sans,sans-serif',
                        boxShadow: '0 0 24px rgba(99,102,241,0.35)',
                        transition: 'all .2s',
                    }}>
                        Submit Application →
                    </button>
                </div>
            </div>
        </div>
    );
};
export default ApplyPage;