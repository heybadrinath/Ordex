import React from 'react';
import { Activity, Clock, ShieldCheck } from 'lucide-react';
import { when } from './SupportCase.js';

export default function AgentHealth({ overview }) {
  const { health, heartbeat, limits } = overview;
  if (!health) return null;
  const online = !!heartbeat && Date.now() - new Date(heartbeat).getTime() < 90000;
  const last = health.lastCall;
  const modelState = !health.modelConfigured
    ? 'Not configured'
    : !last
    ? 'Not tested yet'
    : last.state === 'completed'
    ? 'Last call succeeded'
    : last.state === 'failed'
    ? 'Last call failed'
    : 'Call in progress';
  return (
    <section className="agent-health" aria-label="Agent health">
      <header className="support-section-heading">
        <div>
          <h2>Agent health</h2>
          <p>Current runtime signals and saved work. No model calls are made by this view.</p>
        </div>
      </header>
      <div className="agent-health-grid">
        <section>
          <h3><Activity size={17} aria-hidden="true" /> Runtime</h3>
          <dl>
            <div><dt>Worker</dt><dd>{online ? 'Heartbeat received' : 'No recent heartbeat'}</dd></div>
            <div><dt>Last heartbeat</dt><dd>{heartbeat ? when(heartbeat) : 'Not observed'}</dd></div>
            <div><dt>Automation</dt><dd>{overview.policy.paused ? 'Paused by seller' : 'Enabled'}</dd></div>
            <div><dt>Model connection</dt><dd>{modelState}</dd></div>
            <div><dt>Last model call</dt><dd>{last ? when(last.created_at) : 'Not observed'}</dd></div>
          </dl>
          <p className="agent-health-note">A heartbeat confirms the worker is running. Model access is verified separately by an actual request.</p>
        </section>
        <section>
          <h3><Clock size={17} aria-hidden="true" /> Allowance &amp; waiting work</h3>
          <dl>
            <div><dt>Model</dt><dd>{health.model}</dd></div>
            <div><dt>Calls today</dt><dd>{health.usage.requests} / {limits.daily}</dd></div>
            <div><dt>Failed calls today</dt><dd>{health.usage.failures}</dd></div>
            <div><dt>Queued cases</dt><dd>{health.queue.queued}</dd></div>
            <div><dt>Overdue queued cases</dt><dd>{health.queue.overdue}</dd></div>
            <div><dt>Need seller attention</dt><dd>{health.queue.needs_seller}</dd></div>
          </dl>
          <p className="agent-health-note">Daily limits reset at midnight Pacific. Counts cover this app and model; the provider may count other project use.</p>
        </section>
        <section>
          <h3><ShieldCheck size={17} aria-hidden="true" /> Verified agent actions</h3>
          <dl>
            <div><dt>Returns created</dt><dd>{health.outcomes.returns}</dd></div>
            <div><dt>Item refunds verified</dt><dd>{health.outcomes.refunds}</dd></div>
            <div><dt>Cancellations verified</dt><dd>{health.outcomes.cancellations}</dd></div>
          </dl>
          <p className="agent-health-note">Saved successful actions, excluding marked test cases. Demo payments are simulated. Open the audit log to inspect each receipt.</p>
        </section>
      </div>
    </section>
  );
}
