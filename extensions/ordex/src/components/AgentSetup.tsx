import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@components/common/ui/Button.js';
import { LoadingState } from '@components/common/LoadingState.js';
import {
  BookOpen,
  FileText,
  Upload,
  ShieldCheck,
  FlaskConical,
  Search,
  Activity
} from 'lucide-react';
import { api } from './SupportWorkspace.js';
import { money, when } from './SupportCase.js';
import AgentHealth from './AgentHealth.js';

const reasons = [
  'Arrived damaged',
  'Wrong item',
  'Not as expected',
  'Changed my mind',
  'Other'
];
export default function AgentSetup({ overview, reload }) {
  const [tab, setTab] = useState('knowledge'),
    [docs, setDocs] = useState<any[]>([]),
    [chosen, setChosen] = useState('');
  const [docsLoaded, setDocsLoaded] = useState(false),
    [sourceFilter, setSourceFilter] = useState('active'),
    [sourceQuery, setSourceQuery] = useState(''),
    [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(''),
    [body, setBody] = useState(''),
    [audience, setAudience] = useState('public'),
    [file, setFile] = useState<File | null>(null);
  const [settings, setSettings] = useState({ ...overview.policy.settings }),
    [answer, setAnswer] = useState('');
  const [settingsVersion, setSettingsVersion] = useState(
    overview.policy.policy_id
  );
  const [answerRevision, setAnswerRevision] = useState<number | null>(null);
  const [busy, setBusy] = useState(''),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [question, setQuestion] = useState('How do returns work?'),
    [amount, setAmount] = useState('590'),
    [reason, setReason] = useState('Arrived damaged'),
    [preview, setPreview] = useState<any>(null);
  const lock = useRef(false);
  const openedInitialSource = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  async function refreshDocs() {
    setDocs(await api('/api/support/admin?view=knowledge'));
    setDocsLoaded(true);
  }
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tab') === 'health')
      setTab('health');
    refreshDocs().catch((e) => setError(e.message));
  }, []);
  const pending = docs.some(
    (d) => d.state === 'queued' || d.state === 'analyzing'
  );
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(
      () => refreshDocs().catch((e) => setError(e.message)),
      5000
    );
    return () => clearInterval(timer);
  }, [pending]);
  async function act(command, fn) {
    if (lock.current) return;
    lock.current = true;
    setBusy(command);
    setError('');
    setNotice('');
    try {
      await fn();
      await refreshDocs();
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
      lock.current = false;
    }
  }
  const doc = docs.find((d) => d.document_id === chosen);
  const settingsChanged =
    JSON.stringify(settings) !== JSON.stringify(overview.policy.settings);
  const settingsStale = settingsVersion !== overview.policy.policy_id;
  const sourceChanged =
    !!doc &&
    (title !== doc.title ||
      body !== doc.body ||
      audience !== doc.audience ||
      !!file);
  const shownDocs = docs.filter(
    (d) =>
      (sourceFilter === 'archived'
        ? d.state === 'archived'
        : d.state !== 'archived') &&
      d.title.toLowerCase().includes(sourceQuery.toLowerCase())
  );
  function selectSource(d?) {
    setChosen(d?.document_id || '');
    setTitle(d?.title || '');
    setBody(d?.body || '');
    setAudience(d?.audience || 'public');
    setFile(null);
    if (fileInput.current) fileInput.current.value = '';
    setAnswer('');
    setAnswerRevision(null);
    setNotice('');
    setEditing(!d);
  }
  useEffect(() => {
    if (!docsLoaded || openedInitialSource.current) return;
    openedInitialSource.current = true;
    if (!chosen && !title && !body) {
      const first = docs.find((source) => source.state !== 'archived');
      if (first) selectSource(first);
    }
  }, [docs, docsLoaded]);
  async function save(e) {
    e.preventDefault();
    await act('save', async () => {
      let base64;
      if (file) {
        if (file.size > 3000000) throw new Error('Choose a file under 3 MB.');
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(',')[1]);
          reader.onerror = () =>
            reject(new Error('The file could not be read.'));
          reader.readAsDataURL(file);
        });
      }
      const result = await api('/api/support/admin', {
        area: 'knowledge',
        command: 'save',
        title,
        body,
        audience,
        parentId: doc?.document_id,
        base64,
        filename: file?.name
      });
      setChosen(result.document_id);
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      setNotice('Draft saved. The worker is reviewing it.');
    });
  }
  const field = (key, value) => setSettings({ ...settings, [key]: value });
  return (
    <div className="agent-setup">
      <nav
        className="support-tabs support-tabs-secondary"
        aria-label="Agent setup sections"
      >
        {[
          ['knowledge', 'Knowledge', BookOpen],
          ['permissions', 'Permissions', ShieldCheck],
          ['test', 'Test a request', FlaskConical],
          ['health', 'Health', Activity]
        ].map(([key, label, Icon]: any) => (
          <button
            key={key}
            aria-current={tab === key ? 'page' : undefined}
            onClick={() => setTab(key)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
      <div className="agent-setup-content">
        {error && (
          <p className="support-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="support-notice" role="status">
            {notice}
          </p>
        )}
        {tab === 'health' ? (
          <AgentHealth overview={overview} />
        ) : tab === 'knowledge' ? (
          <div className="knowledge-layout">
            <aside className="knowledge-sources">
              <div className="support-section-heading">
                <h2>Store knowledge</h2>
                <Button
                  variant="outline"
                  disabled={!!busy}
                  onClick={() => selectSource()}
                >
                  New source
                </Button>
              </div>
              <p>Only reviewed, published sources reach the agent.</p>
              <div className="support-filters">
                <button
                  aria-pressed={sourceFilter === 'active'}
                  onClick={() => setSourceFilter('active')}
                >
                  Active{' '}
                  <span>
                    {docs.filter((d) => d.state !== 'archived').length}
                  </span>
                </button>
                <button
                  aria-pressed={sourceFilter === 'archived'}
                  onClick={() => setSourceFilter('archived')}
                >
                  Archived{' '}
                  <span>
                    {docs.filter((d) => d.state === 'archived').length}
                  </span>
                </button>
              </div>
              <div className="support-search">
                <Search size={16} />
                <input
                  aria-label="Search knowledge sources"
                  placeholder="Find a source"
                  value={sourceQuery}
                  onChange={(e) => setSourceQuery(e.target.value)}
                />
              </div>
              <div className="knowledge-source-list">
                {!docsLoaded ? (
                  <LoadingState label="Loading sources" />
                ) : (
                  shownDocs.map((d) => (
                    <button
                      className={d.document_id === chosen ? 'selected' : ''}
                      key={d.document_id}
                      aria-pressed={d.document_id === chosen}
                      disabled={!!busy}
                      onClick={() => selectSource(d)}
                    >
                      <FileText size={18} />
                      <span>
                        <strong>{d.title}</strong>
                        <small>
                          v{d.revision} · {d.audience} ·{' '}
                          {d.state.replaceAll('_', ' ')}
                        </small>
                      </span>
                    </button>
                  ))
                )}
                {docsLoaded && !shownDocs.length && (
                  <p className="knowledge-no-sources">
                    {sourceQuery
                      ? 'No sources match this search.'
                      : sourceFilter === 'archived'
                      ? 'No archived sources.'
                      : 'Add your return instructions, policies or FAQ.'}
                  </p>
                )}
              </div>
              <label className="knowledge-mobile-picker">
                Open a source
                <select
                  aria-label="Choose a knowledge source"
                  value={chosen}
                  disabled={!!busy}
                  onChange={(e) =>
                    selectSource(
                      docs.find(
                        (source) => source.document_id === e.target.value
                      )
                    )
                  }
                >
                  <option value="">New source</option>
                  <optgroup label="Active sources">
                    {docs
                      .filter((source) => source.state !== 'archived')
                      .map((source) => (
                        <option
                          value={source.document_id}
                          key={source.document_id}
                        >
                          {source.title}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Archived sources">
                    {docs
                      .filter((source) => source.state === 'archived')
                      .map((source) => (
                        <option
                          value={source.document_id}
                          key={source.document_id}
                        >
                          {source.title}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </label>
            </aside>
            <section className="knowledge-editor">
              {doc && !editing ? (
                <section className="knowledge-document">
                  <header className="support-section-heading">
                    <div>
                      <h2>{doc.title}</h2>
                      <p>
                        Version {doc.revision} ·{' '}
                        {doc.state.replaceAll('_', ' ')} ·{' '}
                        {doc.policyConflicts?.length
                          ? 'Withheld from answers'
                          : doc.audience === 'public'
                          ? 'Customer-safe guidance'
                          : 'Seller only'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      disabled={!!busy}
                      onClick={() => setEditing(true)}
                    >
                      Edit source
                    </Button>
                  </header>
                  {doc.policyConflicts?.length > 0 && (
                    <div className="support-error" role="status">
                      <strong>
                        Withheld from answers: permissions conflict
                      </strong>
                      {doc.policyConflicts.map((issue, i) => (
                        <p key={i}>{issue}</p>
                      ))}
                    </div>
                  )}
                  <div className="knowledge-document-caption">
                    {doc.state === 'published'
                      ? 'Published guidance'
                      : 'Source guidance'}
                  </div>
                  <div className="knowledge-document-body">
                    {doc.analysis?.effectiveText || doc.body}
                  </div>
                </section>
              ) : (
                <form onSubmit={save}>
                  <div className="support-section-heading">
                    <h2>{doc ? doc.title : 'Add store knowledge'}</h2>
                    {doc && (
                      <span className="support-status">
                        v{doc.revision} · {doc.state.replaceAll('_', ' ')}
                      </span>
                    )}
                  </div>
                  <p>
                    Paste store guidance in your own words. The agent will ask
                    about unclear rules before you publish.
                  </p>
                  <div className="support-field-pair knowledge-source-fields">
                    <label>
                      Source title
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        maxLength={100}
                        placeholder="Returns policy and store FAQ"
                      />
                    </label>
                    <label>
                      Audience
                      <select
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                      >
                        <option value="public">Customer-safe guidance</option>
                        <option value="internal">Internal · seller only</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    Policies, procedures or FAQ
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      maxLength={24000}
                      required={!file}
                      rows={9}
                      placeholder="We accept returns within seven days of delivery…"
                    />
                  </label>
                  <label className="support-upload">
                    <Upload size={17} />
                    <span>
                      Or upload TXT, Markdown, text PDF or DOCX
                      <input
                        ref={fileInput}
                        type="file"
                        accept=".txt,.md,.pdf,.docx"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                    </span>
                  </label>
                  <small>
                    3 MB · 30 PDF pages · 24,000 text characters. Scans and
                    protected documents are unsupported.
                  </small>
                  <div className="support-action-buttons">
                    <Button
                      type="submit"
                      disabled={!!busy || (!!doc && !sourceChanged)}
                      isLoading={busy === 'save'}
                      loadingText="Saving draft"
                    >
                      {doc ? 'Save a new revision' : 'Save & review'}
                    </Button>
                    {doc && doc.state !== 'archived' && (
                      <Button
                        variant="ghost"
                        disabled={!!busy}
                        onClick={() =>
                          act('archive', () =>
                            api('/api/support/admin', {
                              area: 'knowledge',
                              command: 'archive',
                              documentId: doc.document_id,
                              revision: doc.revision
                            })
                          )
                        }
                      >
                        Archive source
                      </Button>
                    )}
                    {doc && (
                      <Button
                        variant="ghost"
                        disabled={!!busy}
                        onClick={() => selectSource(doc)}
                      >
                        Cancel editing
                      </Button>
                    )}
                  </div>
                  {sourceChanged && (
                    <p className="knowledge-draft-note" role="status">
                      You have unsaved changes. Save a new revision to review
                      and publish them.
                    </p>
                  )}
                </form>
              )}
              {doc && (
                <details
                  className="knowledge-review"
                  key={doc.document_id}
                  open={doc.state !== 'published'}
                >
                  <summary className="support-section-heading">
                    <h3>What the agent understood</h3>
                    <span className="support-status">
                      {doc.state.replaceAll('_', ' ')}
                    </span>
                  </summary>
                  {['queued', 'analyzing'].includes(doc.state) && (
                    <LoadingState label="Reviewing this source" />
                  )}
                  <p>
                    {doc.analysis?.summary ||
                      (doc.state === 'queued' || doc.state === 'analyzing'
                        ? 'Review in progress. You can leave this page; the draft is saved.'
                        : 'This source has not been reviewed yet.')}
                  </p>
                  {doc.analysis?.facts?.map((f, i) => (
                    <div className="knowledge-fact" key={i}>
                      <strong>{f.fact}</strong>
                      {f.quote !== f.fact && <blockquote>{f.quote}</blockquote>}
                    </div>
                  ))}
                  {doc.policyConflicts?.length > 0 && (
                    <div className="support-error" role="status">
                      <strong>
                        Withheld from answers: permissions conflict
                      </strong>
                      {doc.policyConflicts.map((issue, i) => (
                        <p key={i}>{issue}</p>
                      ))}
                    </div>
                  )}
                  {doc.analysis?.questions?.length > 0 && (
                    <div className="knowledge-questions">
                      <h4>A few things to clarify</h4>
                      <ul>
                        {doc.analysis.questions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {['needs_clarification', 'failed', 'ready'].includes(
                    doc.state
                  ) && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        act('clarify', async () => {
                          await api('/api/support/admin', {
                            area: 'knowledge',
                            command: 'clarify',
                            documentId: doc.document_id,
                            revision: answerRevision ?? doc.revision,
                            answer
                          });
                          setAnswer('');
                          setAnswerRevision(null);
                        });
                      }}
                    >
                      <label>
                        Clarification for this revision
                        <textarea
                          rows={3}
                          value={answer}
                          onChange={(e) => {
                            if (answerRevision === null)
                              setAnswerRevision(doc.revision);
                            setAnswer(e.target.value);
                          }}
                          required
                          maxLength={3000}
                        />
                      </label>
                      <Button
                        type="submit"
                        disabled={!!busy || sourceChanged}
                        isLoading={busy === 'clarify'}
                      >
                        Save clarification & review
                      </Button>
                    </form>
                  )}
                  {doc.analysis?.effectiveText && (
                    <details>
                      <summary>
                        {doc.state === 'published'
                          ? 'View published text'
                          : 'Review the exact text that will be published'}
                      </summary>
                      <pre>{doc.analysis.effectiveText}</pre>
                    </details>
                  )}
                  {doc.state === 'ready' && (
                    <div className="support-publish">
                      <p>
                        Publishing makes this revision available to the agent.
                        Financial permissions stay separate.
                      </p>
                      <Button
                        disabled={!!busy || sourceChanged}
                        isLoading={busy === 'publish'}
                        onClick={() =>
                          act('publish', async () => {
                            await api('/api/support/admin', {
                              area: 'knowledge',
                              command: 'publish',
                              documentId: doc.document_id,
                              revision: doc.revision
                            });
                            setNotice('This source is published.');
                          })
                        }
                      >
                        Publish reviewed source
                      </Button>
                    </div>
                  )}
                </details>
              )}
            </section>
          </div>
        ) : tab === 'permissions' ? (
          <form
            className="support-permissions"
            onSubmit={(e) => {
              e.preventDefault();
              act('policy', async () => {
                const published = await api('/api/support/admin', {
                  command: 'policy',
                  version: settingsVersion,
                  settings
                });
                setSettingsVersion(published.policy_id);
                setNotice(
                  'New permissions published. Pending actions will be revalidated.'
                );
              });
            }}
          >
            <div className="support-form-heading">
              <h2>Agent permissions</h2>
              <p>
                Current version {overview.policy.policy_id}, published{' '}
                {when(overview.policy.created_at)} by {overview.policy.actor}.
                Documents cannot change these settings.
              </p>
            </div>
            {settingsStale && (
              <div className="support-error" role="alert">
                Permissions changed while this page was open. Reload them before
                editing or publishing.
                <Button
                  variant="outline"
                  onClick={() => {
                    setSettings({ ...overview.policy.settings });
                    setSettingsVersion(overview.policy.policy_id);
                  }}
                >
                  Reload current permissions
                </Button>
              </div>
            )}
            <div className="support-permission-grid">
              <section className="support-permission-section">
                <div className="support-permission-heading">
                  <h3>Return requests</h3>
                  <p>Choose when the agent can authorize a return.</p>
                </div>
                <div className="support-permission-fields">
                  <label className="support-switch">
                    <input
                      type="checkbox"
                      checked={settings.autoAuthorize}
                      onChange={(e) => field('autoAuthorize', e.target.checked)}
                    />
                    <span>
                      <strong>Authorize eligible returns automatically</strong>
                      <small>Other reasons need a seller decision.</small>
                    </span>
                  </label>
                  <fieldset>
                    <legend>Reasons allowed for automatic authorization</legend>
                    {reasons.map((r) => (
                      <label className="support-check" key={r}>
                        <input
                          type="checkbox"
                          checked={settings.autoReasons.includes(r)}
                          onChange={(e) =>
                            field(
                              'autoReasons',
                              e.target.checked
                                ? [...settings.autoReasons, r]
                                : settings.autoReasons.filter((v) => v !== r)
                            )
                          }
                        />
                        {r}
                      </label>
                    ))}
                  </fieldset>
                  <label>
                    Return request window · days
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={settings.returnWindowDays}
                      onChange={(e) =>
                        field('returnWindowDays', Number(e.target.value))
                      }
                      required
                    />
                  </label>
                  <label>
                    Approved return instructions
                    <textarea
                      rows={4}
                      value={settings.returnInstructions}
                      onChange={(e) =>
                        field('returnInstructions', e.target.value)
                      }
                      maxLength={1500}
                      required
                    />
                  </label>
                </div>
              </section>
              <section className="support-permission-section">
                <div className="support-permission-heading">
                  <h3>Item refunds</h3>
                  <p>Set the amount and reasons the agent can approve.</p>
                </div>
                <div className="support-permission-fields">
                  <label className="support-switch">
                    <input
                      type="checkbox"
                      checked={settings.autoRefund}
                      onChange={(e) => field('autoRefund', e.target.checked)}
                    />
                    <span>
                      <strong>Allow automatic item refunds</strong>
                      <small>
                        Only after exact consent, physical receipt and
                        inspection.
                      </small>
                    </span>
                  </label>
                  <label>
                    Cumulative automatic refund limit · INR
                    <input
                      type="number"
                      min="0"
                      max="1000000"
                      step="0.01"
                      value={settings.autoRefundMinor / 100}
                      onChange={(e) =>
                        field(
                          'autoRefundMinor',
                          Math.round(Number(e.target.value) * 100)
                        )
                      }
                      required
                    />
                  </label>
                  <fieldset>
                    <legend>Supported refund reasons</legend>
                    {reasons.map((r) => (
                      <label className="support-check" key={r}>
                        <input
                          type="checkbox"
                          checked={settings.refundReasons.includes(r)}
                          onChange={(e) =>
                            field(
                              'refundReasons',
                              e.target.checked
                                ? [...settings.refundReasons, r]
                                : settings.refundReasons.filter((v) => v !== r)
                            )
                          }
                        />
                        {r}
                      </label>
                    ))}
                  </fieldset>
                </div>
              </section>
            </div>
            <div className="support-policy-preview">
              <h3>Before you publish</h3>
              <p>
                Automatic refund cap:{' '}
                {money(overview.policy.settings.autoRefundMinor)} →{' '}
                {money(settings.autoRefundMinor)}
              </p>
              <p>
                Return window: {overview.policy.settings.returnWindowDays} →{' '}
                {settings.returnWindowDays} days
              </p>
              <p>
                Pending decisions are invalidated. Completed refunds and
                per-order commitments remain. Approvals last 15 minutes. Refunds
                never restock inventory.
              </p>
            </div>
            <Button
              type="submit"
              disabled={!!busy || !settingsChanged || settingsStale}
              isLoading={busy === 'policy'}
              loadingText="Publishing"
            >
              Publish permissions
            </Button>
          </form>
        ) : (
          <form
            className="support-preview"
            onSubmit={(e) => {
              e.preventDefault();
              act('preview', async () =>
                setPreview(
                  await api('/api/support/admin', {
                    command: 'preview',
                    documentId:
                      doc?.state === 'ready' ? doc.document_id : undefined,
                    question,
                    amountMinor: Math.round(Number(amount) * 100),
                    reason,
                    settings
                  })
                )
              );
            }}
          >
            <div className="support-form-heading">
              <h2>Test a support request</h2>
              <p>
                See which guidance and permissions apply. No orders or refunds
                are changed.
              </p>
            </div>
            <div className="support-preview-layout">
              <div className="support-preview-fields">
                {doc?.state === 'ready' && (
                  <p>
                    Testing selected draft: <strong>{doc.title}</strong>
                  </p>
                )}
                <label>
                  Customer question
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    maxLength={1500}
                  />
                </label>
                <div className="support-field-pair">
                  <label>
                    Sample item refund · INR
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </label>
                  <label>
                    Reason
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    >
                      {reasons.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <Button
                  type="submit"
                  disabled={!!busy}
                  isLoading={busy === 'preview'}
                >
                  Run read-only check
                </Button>
              </div>
              <section className="support-preview-result" aria-live="polite">
                {preview ? (
                  <>
                    <h3>Decision preview</h3>
                    <p>
                      <strong>Return authorization:</strong>{' '}
                      {preview.authorization}
                    </p>
                    <p>
                      <strong>Refund:</strong> {preview.refund}
                    </p>
                    <small>{preview.note}</small>
                    {preview.warnings?.map((warning, i) => (
                      <p key={i} className="support-error">
                        {warning}
                      </p>
                    ))}
                    <h3>Published public sources</h3>
                    {preview.sources.length ? (
                      preview.sources.map((s) => (
                        <blockquote key={s.chunk_id}>
                          <strong>
                            {s.title} · v{s.revision} · {s.location}
                          </strong>
                          <p>{s.body}</p>
                        </blockquote>
                      ))
                    ) : (
                      <p>No published customer-safe source was found.</p>
                    )}
                  </>
                ) : (
                  <div className="support-preview-empty">
                    <FlaskConical size={24} strokeWidth={1.4} />
                    <h3>Your result appears here</h3>
                    <p>
                      Run a check to review the permission decision and the
                      sources the agent can use.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
