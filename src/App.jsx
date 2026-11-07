import React, { Fragment, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  Plus,
  Search,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';
import {
  createAccount,
  isFirebaseConfigured,
  observeAuth,
  saveLearnerRecord,
  signIn,
  signInWithGoogle,
  signOutAccount,
  subscribeLearners,
} from './firebase.js';

const starterLearners = [
  { id: 'l1', name: 'Anaya Sharma', grade: 'Grade 7', school: 'Riverdale Public School', attendance: 94, progress: 82, updated: 'Today', goal: 'Build confidence with fractions', scores: { Reading: 84, Maths: 76, Science: 88 } },
  { id: 'l2', name: 'Kabir Patel', grade: 'Grade 5', school: 'Greenfield Academy', attendance: 88, progress: 68, updated: 'Yesterday', goal: 'Practice reading comprehension', scores: { Reading: 61, Maths: 72, Science: 70 } },
  { id: 'l3', name: 'Meera Das', grade: 'Grade 8', school: 'Riverdale Public School', attendance: 97, progress: 91, updated: 'Today', goal: 'Explore introductory algebra', scores: { Reading: 93, Maths: 89, Science: 91 } },
  { id: 'l4', name: 'Arjun Nair', grade: 'Grade 6', school: 'Sunrise Middle School', attendance: 79, progress: 57, updated: 'Oct 28', goal: 'Strengthen multiplication fluency', scores: { Reading: 68, Maths: 52, Science: 58 } },
  { id: 'l5', name: 'Tara Joseph', grade: 'Grade 4', school: 'Greenfield Academy', attendance: 91, progress: 76, updated: 'Oct 27', goal: 'Keep a weekly reading journal', scores: { Reading: 81, Maths: 73, Science: 74 } },
];

const storageKey = 'udaan-learning-records';
const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'learners', label: 'Learners', icon: UsersRound },
  { id: 'reports', label: 'Reports', icon: ClipboardList },
];

function readDemoLearners() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(saved) ? saved : starterLearners;
  } catch {
    return starterLearners;
  }
}

function initials(name) {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

function average(items, field) {
  if (!items.length) return 0;
  return Math.round(items.reduce((total, item) => total + item[field], 0) / items.length);
}

function App() {
  const [learners, setLearners] = useState(() => isFirebaseConfigured ? [] : readDemoLearners());
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [databaseStatus, setDatabaseStatus] = useState(isFirebaseConfigured ? 'connecting' : 'demo');
  const [activePage, setActivePage] = useState('overview');
  const [query, setQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All grades');
  const [expandedId, setExpandedId] = useState(null);
  const [editingLearner, setEditingLearner] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    return observeAuth((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user) {
        setLearners([]);
        setDatabaseStatus('signed-out');
      }
    });
  }, []);

  useEffect(() => {
    if (!currentUser) return undefined;
    setDatabaseStatus('connecting');
    return subscribeLearners(currentUser.uid, (records) => {
      setLearners(records);
      setDatabaseStatus('connected');
    }, () => setDatabaseStatus('error'));
  }, [currentUser]);

  const saveLearners = (nextLearners) => {
    setLearners(nextLearners);
    localStorage.setItem(storageKey, JSON.stringify(nextLearners));
  };

  const filteredLearners = useMemo(() => learners.filter((learner) => {
    const matchesQuery = `${learner.name} ${learner.school} ${learner.grade}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (gradeFilter === 'All grades' || learner.grade === gradeFilter);
  }), [learners, query, gradeFilter]);

  const gradeOptions = [...new Set(learners.map((learner) => learner.grade))].sort();
  const needsSupport = learners.filter((learner) => learner.progress < 70 || learner.attendance < 85);
  const subjectAverages = ['Reading', 'Maths', 'Science'].map((subject) => ({
    subject,
    score: learners.length ? Math.round(learners.reduce((total, learner) => total + (learner.scores?.[subject] ?? 0), 0) / learners.length) : 0,
  }));

  const openNewLearner = () => {
    setEditingLearner(null);
    setDialogOpen(true);
  };

  const saveLearner = async (learner) => {
    const savedLearner = currentUser
      ? await saveLearnerRecord(currentUser.uid, learner)
      : { ...learner, id: learner.id ?? crypto.randomUUID() };
    const nextLearners = editingLearner
      ? learners.map((item) => item.id === savedLearner.id ? savedLearner : item)
      : [savedLearner, ...learners];
    if (currentUser) setLearners(nextLearners);
    else saveLearners(nextLearners);
    setDialogOpen(false);
    setEditingLearner(null);
  };

  if (isFirebaseConfigured && authLoading) return <AuthLoading />;
  if (isFirebaseConfigured && !currentUser) return <AuthScreen />;

  const title = navigation.find((item) => item.id === activePage)?.label ?? 'Overview';
  const privacyNotice = isFirebaseConfigured
    ? 'Synced to your Firebase account. Review your database rules before storing real student information.'
    : 'Demo records are stored in this browser only. Avoid entering sensitive personal information.';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setActivePage('overview')} aria-label="Udaan home">
          <span className="brand-mark"><BookOpen size={20} strokeWidth={2.2} /></span>
          <span>udaan<span className="brand-period">.</span></span>
        </a>
        <div className="workspace-label">LEARNING SPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${activePage === id ? 'active' : ''}`} onClick={() => setActivePage(id)}>
              <Icon size={18} strokeWidth={1.9} />
              <span>{label}</span>
              {id === 'learners' && <span className="nav-count">{learners.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="support-note"><Sparkles size={16} /><span>Every small step<br />makes a difference.</span></div>
          <div className="profile-row">
            <div className="profile-avatar">{currentUser ? initials(currentUser.email ?? 'User') : 'DM'}</div>
            <div><strong>{currentUser?.email ?? 'Demo coordinator'}</strong><span>{currentUser ? 'Signed in' : 'Browser demo'}</span></div>
            {currentUser && <button className="profile-signout" onClick={() => signOutAccount()} aria-label="Sign out" title="Sign out"><ChevronDown size={16} /></button>}
          </div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb"><span>Learning space</span><ChevronRight size={14} /><strong>{title}</strong></div>
          <div className="topbar-right">
            <span className={`connection-status ${databaseStatus}`} title={databaseStatus === 'error' ? 'Check your Firebase Database Rules and connection.' : undefined}><i />{databaseStatus === 'connected' ? 'Firebase synced' : databaseStatus === 'connecting' ? 'Connecting' : databaseStatus === 'error' ? 'Connection issue' : 'Demo mode'}</span>
            <span className="today-label">Friday, November 6</span>
            {currentUser && <button className="topbar-signout" onClick={() => signOutAccount()}>Sign out</button>}
            <div className="topbar-avatar">{currentUser ? initials(currentUser.email ?? 'User') : 'DM'}</div>
          </div>
        </header>

        <main className="page-content">
          {activePage === 'overview' && (
            <>
              <section className="page-heading">
                <div><p className="overline">YOUR LEARNING SPACE</p><h1>A little progress, every day.</h1><p className="heading-copy">Here’s how your learners are doing this week.</p></div>
                <button className="button button-primary" onClick={openNewLearner}><Plus size={17} /> Add learner</button>
              </section>
              <section className="stats-grid" aria-label="Program summary">
                <StatCard label="Learners" value={learners.length} note="In your learning space" icon={UsersRound} tone="mint" />
                <StatCard label="Average progress" value={`${average(learners, 'progress')}%`} note="Across all learning plans" icon={ArrowUpRight} tone="yellow" trend="up" />
                <StatCard label="Attendance" value={`${average(learners, 'attendance')}%`} note="Average this term" icon={Check} tone="blue" />
                <StatCard label="Needs a check-in" value={needsSupport.length} note="Attendance or progress support" icon={CircleHelp} tone="coral" />
              </section>
              <section className="overview-grid">
                <div className="content-panel progress-panel">
                  <div className="panel-heading"><div><p className="overline">TERM SNAPSHOT</p><h2>Learning progress</h2></div><span className="period-select">This term <ChevronDown size={14} /></span></div>
                  <div className="progress-summary"><strong>{average(learners, 'progress')}%</strong><span>average learner progress</span><span className="positive-change"><ArrowUpRight size={15} /> 8% <small>from last term</small></span></div>
                  <div className="chart" aria-label="Weekly learning activity chart">
                    {[['Mon', 45], ['Tue', 68], ['Wed', 55], ['Thu', 82], ['Fri', 64], ['Sat', 30], ['Sun', 20]].map(([day, height]) => (
                      <div className="chart-column" key={day}><div className="chart-track"><div className={`chart-bar ${day === 'Thu' ? 'highlight' : ''}`} style={{ height: `${height}%` }} /></div><span>{day}</span></div>
                    ))}
                  </div>
                  <div className="chart-caption"><span><i className="legend-dot" />Learning sessions completed</span><span>More sessions this week <ArrowUpRight size={14} /></span></div>
                </div>
                <div className="content-panel support-panel">
                  <div className="panel-heading"><div><p className="overline">HERE TO HELP</p><h2>Check in with</h2></div><span className="support-count">{needsSupport.length}</span></div>
                  {needsSupport.length ? <div className="support-list">
                    {needsSupport.slice(0, 3).map((learner) => <button className="support-person" key={learner.id} onClick={() => { setActivePage('learners'); setExpandedId(learner.id); }}>
                      <Avatar name={learner.name} /><span className="support-person-copy"><strong>{learner.name}</strong><small>{learner.attendance < 85 ? 'Attendance check-in' : 'Learning plan support'}</small></span><ChevronRight size={17} />
                    </button>)}
                  </div> : <div className="empty-support"><span className="success-mark"><Check size={18} /></span><p>Everyone is on track.<br /><span>Keep up the steady support.</span></p></div>}
                  <button className="text-link" onClick={() => setActivePage('learners')}>View all learners <ChevronRight size={15} /></button>
                </div>
              </section>
              <section className="content-panel recent-panel">
                <div className="panel-heading"><div><p className="overline">RECENT RECORDS</p><h2>Learner check-ins</h2></div><button className="text-link" onClick={() => setActivePage('learners')}>See all <ChevronRight size={15} /></button></div>
                <LearnerTable learners={learners.slice(0, 4)} expandedId={expandedId} setExpandedId={setExpandedId} onEdit={(learner) => { setEditingLearner(learner); setDialogOpen(true); }} compact />
              </section>
              <p className="privacy-note"><span className="privacy-dot" />{privacyNotice}</p>
            </>
          )}

          {activePage === 'learners' && (
            <>
              <section className="page-heading">
                <div><p className="overline">YOUR LEARNING SPACE</p><h1>Learner records</h1><p className="heading-copy">Keep academic progress and learning goals in one place.</p></div>
                <button className="button button-primary" onClick={openNewLearner}><Plus size={17} /> Add learner</button>
              </section>
              <section className="content-panel learner-list-panel">
                <div className="list-toolbar"><div><h2>All learners <span className="total-count">{learners.length}</span></h2><p>Academic records and current learning plans</p></div>
                  <div className="list-controls"><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search learners" aria-label="Search learners" />{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}</label>
                    <label className="select-wrap"><select value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)} aria-label="Filter by grade"><option>All grades</option>{gradeOptions.map((grade) => <option key={grade}>{grade}</option>)}</select><ChevronDown size={14} /></label>
                  </div>
                </div>
                {filteredLearners.length ? <LearnerTable learners={filteredLearners} expandedId={expandedId} setExpandedId={setExpandedId} onEdit={(learner) => { setEditingLearner(learner); setDialogOpen(true); }} /> : <div className="empty-state"><Search size={23} /><strong>No learners found</strong><span>Try a different name or grade.</span></div>}
              </section>
              <p className="privacy-note"><span className="privacy-dot" />{privacyNotice}</p>
            </>
          )}

          {activePage === 'reports' && (
            <>
              <section className="page-heading"><div><p className="overline">YOUR LEARNING SPACE</p><h1>Progress reports</h1><p className="heading-copy">A quick view of academic strengths and next steps.</p></div><span className="report-period">Current term <ChevronDown size={14} /></span></section>
              <section className="report-summary-grid">
                {subjectAverages.map(({ subject, score }) => <article className="report-subject" key={subject}><div className={`subject-symbol ${subject.toLowerCase()}`}><BookOpen size={18} /></div><span className="subject-label">{subject}</span><strong>{score}%</strong><div className="meter"><span style={{ width: `${score}%` }} /></div><small>Average assessment score</small></article>)}
              </section>
              <section className="content-panel report-table-panel"><div className="panel-heading"><div><p className="overline">ACADEMIC RECORDS</p><h2>Progress by learner</h2></div><span className="report-period">{learners.length} learners</span></div><LearnerTable learners={learners} expandedId={expandedId} setExpandedId={setExpandedId} onEdit={(learner) => { setEditingLearner(learner); setDialogOpen(true); }} /></section>
              <p className="privacy-note"><span className="privacy-dot" />{privacyNotice}</p>
            </>
          )}
        </main>
      </div>
      {dialogOpen && <LearnerDialog learner={editingLearner} remoteStorage={isFirebaseConfigured} onClose={() => setDialogOpen(false)} onSave={saveLearner} />}
    </div>
  );
}

function StatCard({ label, value, note, icon: Icon, tone, trend }) {
  return <article className="stat-card"><span className={`stat-icon ${tone}`}><Icon size={18} strokeWidth={2} /></span><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-note">{trend && <ArrowUpRight size={13} />} {note}</span></article>;
}

function Avatar({ name }) {
  const tones = ['sage', 'peach', 'blue', 'gold', 'rose'];
  const tone = tones[name.charCodeAt(0) % tones.length];
  return <span className={`learner-avatar ${tone}`}>{initials(name)}</span>;
}

function LearnerTable({ learners, expandedId, setExpandedId, onEdit, compact = false }) {
  return <div className="table-scroll"><table className="learner-table"><thead><tr><th>Learner</th><th>Grade & school</th><th>Progress</th><th>Attendance</th><th>Updated</th><th aria-label="Actions"></th></tr></thead><tbody>
    {learners.map((learner) => <Fragment key={learner.id}>
      <tr className={`learner-row ${expandedId === learner.id ? 'selected' : ''}`} key={learner.id}>
        <td><button className="learner-name" onClick={() => setExpandedId(expandedId === learner.id ? null : learner.id)}><Avatar name={learner.name} /><strong>{learner.name}</strong></button></td>
        <td><span className="grade-name">{learner.grade}</span><span className="school-name">{learner.school}</span></td>
        <td><div className="progress-cell"><div className="mini-meter"><span style={{ width: `${learner.progress}%` }} /></div><strong>{learner.progress}%</strong></div></td>
        <td><span className={`attendance-pill ${learner.attendance < 85 ? 'attention' : ''}`}>{learner.attendance}%</span></td>
        <td className="updated-cell">{learner.updated}</td>
        <td><button className="icon-button" aria-label={`View ${learner.name}'s record`} title="View record" onClick={() => setExpandedId(expandedId === learner.id ? null : learner.id)}><ChevronDown size={16} className={expandedId === learner.id ? 'rotate-icon' : ''} /></button></td>
      </tr>
      {expandedId === learner.id && <tr className="detail-row" key={`${learner.id}-detail`}><td colSpan="6"><div className="learner-detail"><div className="detail-goal"><span className="detail-overline">CURRENT LEARNING GOAL</span><strong>{learner.goal || 'Add a learning goal'}</strong></div><div className="subject-scores">{Object.entries(learner.scores ?? {}).map(([subject, score]) => <div className="subject-score" key={subject}><span>{subject}</span><strong>{score}%</strong></div>)}</div><button className="button button-subtle" onClick={() => onEdit(learner)}>Edit record <ChevronRight size={15} /></button></div></td></tr>}
    </Fragment>)}
  </tbody></table></div>;
}

function LearnerDialog({ learner, remoteStorage, onClose, onSave }) {
  const [form, setForm] = useState(() => learner ? { ...learner, scores: { ...learner.scores } } : {
    name: '', grade: 'Grade 4', school: '', attendance: 90, progress: 50, goal: '', scores: { Reading: 0, Maths: 0, Science: 0 }, updated: 'Today',
  });
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateScore = (subject, value) => setForm((current) => ({ ...current, scores: { ...current.scores, [subject]: Number(value) } }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      await onSave({ ...form, attendance: Number(form.attendance), progress: Number(form.progress), updated: 'Today' });
    } catch {
      setSaveError('Could not save this record. Check your connection and Firebase Database Rules, then try again.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="dialog-heading"><div><p className="overline">LEARNER RECORD</p><h2 id="dialog-title">{learner ? 'Update record' : 'Add a learner'}</h2></div><button className="icon-button close-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div>
      <form onSubmit={submit}>
        <div className="form-grid"><label className="form-field full"><span>Learner name</span><input required maxLength="70" autoFocus value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Enter learner name" /></label>
          <label className="form-field"><span>Grade</span><select value={form.grade} onChange={(event) => update('grade', event.target.value)}>{Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`).map((grade) => <option key={grade}>{grade}</option>)}</select></label>
          <label className="form-field"><span>School</span><input required maxLength="100" value={form.school} onChange={(event) => update('school', event.target.value)} placeholder="School name" /></label>
          <label className="form-field"><span>Progress <b>{form.progress}%</b></span><input type="range" min="0" max="100" value={form.progress} onChange={(event) => update('progress', event.target.value)} /></label>
          <label className="form-field"><span>Attendance <b>{form.attendance}%</b></span><input type="range" min="0" max="100" value={form.attendance} onChange={(event) => update('attendance', event.target.value)} /></label>
          <label className="form-field full"><span>Current learning goal</span><input maxLength="120" value={form.goal} onChange={(event) => update('goal', event.target.value)} placeholder="What is the learner working towards?" /></label>
        </div>
        <fieldset className="score-fields"><legend>Latest subject scores</legend>{Object.keys(form.scores).map((subject) => <label className="form-field" key={subject}><span>{subject}</span><div className="score-input"><input type="number" min="0" max="100" value={form.scores[subject]} onChange={(event) => updateScore(subject, event.target.value)} /><span>%</span></div></label>)}</fieldset>
        <p className="form-privacy">Only add academic information needed to support learning. {remoteStorage ? 'Records sync to your Firebase account.' : 'Records are saved in this browser.'}</p>
        {saveError && <p className="form-error" role="alert">{saveError}</p>}
        <div className="dialog-actions"><button type="button" className="button button-subtle" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}><Check size={16} /> {saving ? 'Saving...' : 'Save record'}</button></div>
      </form>
    </section>
  </div>;
}

function AuthLoading() {
  return <main className="auth-screen"><div className="auth-card auth-loading"><div className="brand-mark"><BookOpen size={20} /></div><p>Connecting to your learning space...</p></div></main>;
}

function AuthScreen() {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'signup') await createAccount(email, password);
      else await signIn(email, password);
    } catch (authError) {
      setError(authError.code === 'auth/email-already-in-use'
        ? 'An account already uses this email. Sign in instead.'
        : authError.code === 'auth/invalid-credential'
          ? 'Email or password is incorrect.'
          : authError.message || 'Could not authenticate. Check your Firebase setup.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitGoogle = async () => {
    setError('');
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (authError) {
      setError(authError.code === 'auth/unauthorized-domain'
        ? 'This domain is not authorized. Add it in Firebase Authentication settings.'
        : authError.code === 'auth/operation-not-allowed'
          ? 'Google sign-in is not enabled for this Firebase project yet.'
          : authError.code === 'auth/popup-blocked'
            ? 'Your browser blocked the sign-in popup. Allow popups and try again.'
            : authError.code === 'auth/popup-closed-by-user'
              ? 'The Google sign-in window was closed before completion.'
              : authError.message || 'Google sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="auth-screen">
    <section className="auth-card">
      <a className="brand auth-brand" href="#home"><span className="brand-mark"><BookOpen size={20} /></span><span>udaan<span className="brand-period">.</span></span></a>
      <p className="overline">LEARNING SPACE</p>
      <h1>{mode === 'signin' ? 'Welcome back.' : 'Create your account.'}</h1>
      <p className="auth-copy">Sign in to access your learner records, securely synced to Firebase.</p>
      <form className="auth-form" onSubmit={submit}>
        <label className="form-field"><span>Email address</span><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.org" /></label>
        <label className="form-field"><span>Password</span><input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength="6" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary auth-submit" type="submit" disabled={submitting}>{submitting ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
      </form>
      <div className="auth-divider"><span>or</span></div>
      <button className="button google-button" type="button" onClick={submitGoogle} disabled={submitting}><span className="google-g" aria-hidden="true">G</span>{submitting ? 'Please wait...' : 'Continue with Google'}</button>
      <p className="auth-switch">{mode === 'signin' ? 'New to Udaan?' : 'Already have an account?'} <button onClick={() => { setError(''); setMode(mode === 'signin' ? 'signup' : 'signin'); }}>{mode === 'signin' ? 'Create account' : 'Sign in'}</button></p>
      <p className="auth-privacy">Your records are stored under your Firebase account. Access depends on your database security rules.</p>
    </section>
  </main>;
}

export default App;