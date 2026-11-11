import React from 'react';
import {
  Activity,
  Check,
  ChevronDown,
  FileText,
  ShieldCheck
} from 'lucide-react';
import {
  auditCheckLabels,
  auditMoney,
  describeAuditEvent
} from './auditPresentation.js';
import { when } from './SupportCase.js';

export default function AuditLog({ rows }: { rows: any[] }) {
  if (!rows.length)
    return (
      <div className="support-empty">
        <Activity size={26} />
        <h3>No matching activity</h3>
        <p>Choose another event type or load earlier activity.</p>
      </div>
    );
  return (
    <div className="audit-log">
      {rows.map((event) => {
        const view = describeAuditEvent(event);
        const items = Array.isArray(view.payload.items)
          ? view.payload.items
          : [];
        return (
          <details
            className={`audit-event tone-${view.tone}`}
            key={event.audit_id}
          >
            <summary>
              <div className="audit-event-header">
                <span className="audit-event-icon">
                  {view.tone === 'success' ? (
                    <Check size={18} />
                  ) : view.tone === 'attention' ? (
                    <ShieldCheck size={18} />
                  ) : (
                    <Activity size={18} />
                  )}
                </span>
                <span className="audit-event-title">
                  <strong>{view.title}</strong>
                  <span>
                    {event.order_number ? (
                      <a
                        href={`/admin/support?case=${event.case_id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Order #{event.order_number}
                      </a>
                    ) : (
                      'Store activity'
                    )}
                    {event.customer_full_name &&
                      ` · ${event.customer_full_name}`}{' '}
                    ·{' '}
                    {event.actor === 'agent'
                      ? 'Agent'
                      : event.actor === 'customer'
                      ? 'Customer'
                      : event.actor}
                  </span>
                </span>
                <time>{when(event.created_at)}</time>
                <ChevronDown className="audit-expand" size={16} />
              </div>
              <div className="audit-event-preview">
                {view.message.body ? (
                  <blockquote>
                    <span>
                      {view.message.internal
                        ? 'Private note'
                        : view.message.actor === 'customer'
                        ? 'Customer said'
                        : 'Message'}
                    </span>
                    {view.message.body}
                  </blockquote>
                ) : (
                  view.description && <p>{view.description}</p>
                )}
                {!!view.facts.length && (
                  <dl className="audit-facts">
                    {view.facts.map((fact) => (
                      <div key={fact.label}>
                        <dt>{fact.label}</dt>
                        <dd>{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {!!view.sources.length && (
                  <div className="audit-source-tags">
                    {view.sources.map((source, i) => (
                      <span key={i}>
                        <FileText size={12} />
                        {source.title} · v{source.revision}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </summary>
            <div className="audit-event-details">
              {view.message.body && (
                <section>
                  <h4>
                    {view.message.internal
                      ? 'Full private note'
                      : 'Full message'}
                  </h4>
                  <p className="audit-full-message">{view.message.body}</p>
                </section>
              )}
              {items.length > 0 && (
                <section>
                  <h4>Items in this action</h4>
                  <div className="audit-items">
                    {items.map((item, i) => (
                      <div key={item.id || i}>
                        <span>
                          {item.name || `Order item ${item.id}`}{' '}
                          <small>× {item.qty}</small>
                        </span>
                        {item.amountMinor != null && (
                          <strong>
                            {auditMoney(
                              item.amountMinor,
                              view.payload.currency
                            )}
                          </strong>
                        )}
                      </div>
                    ))}
                  </div>
                  {view.payload.reason && <p>Reason: {view.payload.reason}</p>}
                </section>
              )}
              {Object.keys(view.checks).length > 0 && (
                <section>
                  <h4>Checks at this step</h4>
                  <dl className="audit-checks">
                    {Object.entries(view.checks).map(([name, result]) => (
                      <div key={name}>
                        <dt>{auditCheckLabels[name] || name}</dt>
                        <dd className={result ? 'check-yes' : 'check-no'}>
                          {result ? 'Yes' : 'No'}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
              {view.policy.version && (
                <section>
                  <h4>Policy v{view.policy.version}</h4>
                  <p>
                    Return window: {view.policy.returnWindowDays} days ·
                    Automatic item refund limit:{' '}
                    {auditMoney(view.policy.autoRefundMinor)}
                  </p>
                </section>
              )}
              {view.sources.map((source, i) => (
                <section key={i}>
                  <h4>
                    {source.title} · v{source.revision}
                  </h4>
                  <small>{source.location}</small>
                  <blockquote>{source.excerpt}</blockquote>
                </section>
              ))}
              {event.action && (
                <p className="audit-linked-state">
                  Linked action now:{' '}
                  <strong>
                    {event.action.currentState?.replaceAll('_', ' ')}
                  </strong>
                  . This reflects the current record; the event above keeps its
                  original decision.
                </p>
              )}
              <details className="audit-technical">
                <summary>Technical record</summary>
                <pre>
                  {JSON.stringify(
                    {
                      event: event.event,
                      eventId: event.audit_id,
                      runId: event.run_id,
                      data: event.data
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            </div>
          </details>
        );
      })}
    </div>
  );
}
