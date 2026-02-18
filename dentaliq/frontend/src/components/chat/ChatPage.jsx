// src/components/chat/ChatPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { chatApi, patientsApi } from '../../services/api';
import { format, parseISO, isToday, isYesterday } from 'date-fns';

const fmtTime = (d) => {
  try {
    const date = parseISO(d);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
    return format(date, 'dd MMM, HH:mm');
  } catch { return ''; }
};

// ─── Typing indicator ────────────────────────────────────────
const TypingDots = () => (
  <div style={{ display: 'flex', gap: 4, padding: '14px 16px', alignItems: 'center' }}>
    <div className="typing-dot" />
    <div className="typing-dot" />
    <div className="typing-dot" />
  </div>
);

// ─── Message bubble ───────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: 'var(--ink)',
          color: 'var(--teal-light)', fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginRight: 8, alignSelf: 'flex-end',
        }}>✦</div>
      )}
      <div style={{ maxWidth: '72%' }}>
        <div style={{
          padding: '11px 16px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
          background: isUser ? 'var(--ink)' : 'var(--white)',
          color: isUser ? '#fff' : 'var(--ink)',
          fontSize: 14, lineHeight: 1.65,
          border: isUser ? 'none' : '1px solid var(--gray-200)',
          boxShadow: isUser ? 'none' : 'var(--shadow-sm)',
          whiteSpace: 'pre-wrap',
        }}>
          {msg.content}
        </div>
        <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4, textAlign: isUser ? 'right' : 'left', paddingLeft: 4, paddingRight: 4 }}>
          {fmtTime(msg.created_at)}
        </div>
      </div>
    </div>
  );
};

// ─── Patient selector sidebar ─────────────────────────────────
const PatientSelector = ({ selectedId, onSelect }) => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    patientsApi.list({ search: debounced, limit: 20 })
      .then(res => setPatients(res.data))
      .catch(() => {});
  }, [debounced]);

  return (
    <div style={{
      width: 250, background: 'var(--white)', borderRight: '1px solid var(--gray-200)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid var(--gray-100)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 10, color: 'var(--ink)' }}>
          Patients
        </div>
        <input className="input" style={{ fontSize: 13, padding: '8px 12px' }}
          placeholder="Search…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {patients.length === 0 && (
          <div style={{ padding: 20, color: 'var(--gray-400)', fontSize: 13, textAlign: 'center' }}>
            No patients found
          </div>
        )}
        {patients.map(p => (
          <button key={p.id} onClick={() => onSelect(p)}
            style={{
              width: '100%', padding: '12px 16px', textAlign: 'left', border: 'none',
              background: selectedId === p.id ? 'var(--teal-faint)' : 'transparent',
              borderLeft: `3px solid ${selectedId === p.id ? 'var(--teal)' : 'transparent'}`,
              cursor: 'pointer', transition: 'all var(--transition)',
              borderBottom: '1px solid var(--gray-100)',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, color: selectedId === p.id ? 'var(--teal)' : 'var(--ink)' }}>
              {p.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{p.email || p.phone || 'No contact info'}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Main Chat Page ───────────────────────────────────────────
export default function ChatPage() {
  const { patientId: routePatientId } = useParams();
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load patient from route param
  useEffect(() => {
    if (routePatientId) {
      patientsApi.get(routePatientId)
        .then(p => setSelectedPatient(p))
        .catch(() => navigate('/chat'));
    }
  }, [routePatientId, navigate]);

  // Load chat history when patient changes
  useEffect(() => {
    if (!selectedPatient) { setMessages([]); return; }
    setLoadingHistory(true);
    chatApi.history(selectedPatient.id)
      .then(res => setMessages(res.messages || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoadingHistory(false));
  }, [selectedPatient]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSelectPatient = useCallback((patient) => {
    setSelectedPatient(patient);
    navigate(`/chat/${patient.id}`, { replace: true });
  }, [navigate]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !selectedPatient || sending) return;
    setInput('');

    // Optimistic UI
    const tempUserMsg = { id: 'temp-user', role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const { userMessage, aiMessage } = await chatApi.send(selectedPatient.id, text);
      setMessages(prev => [
        ...prev.filter(m => m.id !== 'temp-user'),
        userMessage, aiMessage,
      ]);
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== 'temp-user'));
      toast.error(err.message);
      setInput(text); // restore input
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, selectedPatient, sending]);

  return (
    <div style={{ display: 'flex', height: '100vh', marginLeft: 240, overflow: 'hidden' }}>
      <PatientSelector selectedId={selectedPatient?.id} onSelect={handleSelectPatient} />

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--mist)' }}>
        {!selectedPatient ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--gray-500)', marginBottom: 8 }}>
              DentalIQ Assistant
            </p>
            <p style={{ fontSize: 14 }}>Select a patient from the left to start a chat</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{
              background: 'var(--white)', borderBottom: '1px solid var(--gray-200)',
              padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--ink)',
                color: 'var(--teal-light)', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {selectedPatient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>
                  {selectedPatient.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                  AI Assistant Active
                </div>
              </div>
              {selectedPatient.medical_notes && (
                <div style={{
                  marginLeft: 'auto', maxWidth: 300, fontSize: 12, color: 'var(--gray-500)',
                  background: 'var(--gray-100)', borderRadius: 8, padding: '6px 12px',
                }}>
                  <strong>Notes:</strong> {selectedPatient.medical_notes.slice(0, 80)}{selectedPatient.medical_notes.length > 80 ? '…' : ''}
                </div>
              )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
              {loadingHistory ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <div className="spinner spinner-lg" />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray-400)' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>✦</div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 6, color: 'var(--gray-500)' }}>
                    Start a conversation
                  </p>
                  <p style={{ fontSize: 13 }}>Ask about {selectedPatient.name}'s dental health, treatments, or general advice.</p>
                </div>
              ) : (
                messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
              )}
              {sending && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: 'var(--ink)',
                    color: 'var(--teal-light)', fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>✦</div>
                  <div style={{
                    background: 'var(--white)', border: '1px solid var(--gray-200)',
                    borderRadius: '4px 16px 16px 16px', boxShadow: 'var(--shadow-sm)',
                  }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
              background: 'var(--white)', borderTop: '1px solid var(--gray-200)',
              padding: '14px 20px', display: 'flex', gap: 10,
            }}>
              <textarea ref={inputRef}
                className="input"
                style={{ flex: 1, resize: 'none', minHeight: 44, maxHeight: 120, overflow: 'auto', fontSize: 14, lineHeight: 1.5 }}
                placeholder={`Message about ${selectedPatient.name}…`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                rows={1}
              />
              <button className="btn btn-primary"
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                style={{ alignSelf: 'flex-end', padding: '10px 20px' }}
              >
                {sending ? <><span className="spinner" style={{ width: 14, height: 14 }} /></> : 'Send ↑'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
