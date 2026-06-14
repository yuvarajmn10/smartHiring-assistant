import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useIsMobile from '../hooks/useIsMobile';
const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useIsMobile();
    const [menuOpen, setMenuOpen] = useState(false);
    const handleLogout = () => { logout(); navigate('/login'); setMenuOpen(false); };
    const isActive = (path) => location.pathname === path;
    const navLink = (path) => ({
        fontSize: '13px', fontWeight: 500, textDecoration: 'none', transition: 'color .2s',
        color: isActive(path) ? 'var(--text-primary)' : 'var(--text-secondary)',
        paddingBottom: '2px',
        borderBottom: isActive(path) ? '1px solid var(--accent)' : '1px solid transparent',
    });
    return (
        <>
            <nav style={{ background: 'rgba(8,8,15,0.85)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '0 1.25rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
                {/* Logo */}
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'var(--accent)', borderRadius: '7px', padding: '4px 10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'white', fontFamily: 'Syne,sans-serif' }}>HireAI</span>
                    </div>
                </Link>
                {/* Desktop nav */}
                {!isMobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <Link to="/jobs" style={navLink('/jobs')}>Browse Jobs</Link>
                        {user ? (
                            <>
                                <Link to="/dashboard" style={navLink('/dashboard')}>Dashboard</Link>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '999px', padding: '4px 12px 4px 8px' }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: user.role === 'recruiter' ? 'rgba(139,92,246,0.3)' : 'rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, color: user.role === 'recruiter' ? '#a78bfa' : '#34d399' }}>
                                        {user.name?.[0]?.toUpperCase()}
                                    </div>
                                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{user.name}</span>
                                    <span style={{ fontSize: '11px', fontWeight: 500, padding: '1px 7px', borderRadius: '999px', background: user.role === 'recruiter' ? 'rgba(139,92,246,0.2)' : 'rgba(16,185,129,0.2)', color: user.role === 'recruiter' ? '#a78bfa' : '#34d399' }}>{user.role}</span>
                                </div>
                                <button onClick={handleLogout} style={{ fontSize: '13px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}>Login</Link>
                                <Link to="/register" style={{ fontSize: '13px', fontWeight: 500, color: 'white', textDecoration: 'none', background: 'var(--accent)', padding: '6px 14px', borderRadius: '8px' }}>Get Started</Link>
                            </>
                        )}
                    </div>
                )}
                {/* Mobile hamburger */}
                {isMobile && (
                    <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {[0, 1, 2].map(i => (
                            <div key={i} style={{
                                width: '22px', height: '2px', background: 'var(--text-secondary)', borderRadius: '2px', transition: 'all .2s',
                                transform: menuOpen ? (i === 0 ? 'rotate(45deg) translate(5px,5px)' : i === 2 ? 'rotate(-45deg) translate(5px,-5px)' : 'scale(0)') : 'none',
                                opacity: menuOpen && i === 1 ? 0 : 1,
                            }} />
                        ))}
                    </button>
                )}
            </nav>
            {/* Mobile dropdown menu */}
            {isMobile && menuOpen && (
                <div style={{ position: 'fixed', top: '56px', left: 0, right: 0, background: 'rgba(8,8,15,0.97)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(20px)', zIndex: 99, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeUp .2s ease' }}>
                    <Link to="/jobs" onClick={() => setMenuOpen(false)} style={{ fontSize: '15px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>Browse Jobs</Link>
                    {user ? (
                        <>
                            <Link to="/dashboard" onClick={() => setMenuOpen(false)} style={{ fontSize: '15px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>Dashboard</Link>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                                <div>
                                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{user.name}</span>
                                    <span style={{ fontSize: '11px', marginLeft: '8px', padding: '2px 8px', borderRadius: '999px', background: user.role === 'recruiter' ? 'rgba(139,92,246,0.2)' : 'rgba(16,185,129,0.2)', color: user.role === 'recruiter' ? '#a78bfa' : '#34d399', fontWeight: 500 }}>{user.role}</span>
                                </div>
                                <button onClick={handleLogout} style={{ fontSize: '13px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif', fontWeight: 500 }}>Logout</button>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link to="/login" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}>Login</Link>
                            <Link to="/register" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: 'center', fontSize: '14px', color: 'white', textDecoration: 'none', fontWeight: 500, padding: '10px', borderRadius: '10px', background: 'var(--accent)' }}>Register</Link>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};
export default Navbar;