import {
  deliveryCommand,
  deliveryOverview
} from '../../services/support/delivery.js';
import {
  adminCommand,
  adminOverview,
  auditPage,
  detail,
  validateSettings
} from '../../services/support/cases.js';
import {
  knowledgeCommand,
  knowledgeList,
  retrieve,
  chunks,
  conflicts
} from '../../services/support/knowledge.js';
import { policy, pool, uuid } from '../../services/support/db.js';
import { supportError, protect } from '../../services/support/http.js';
export default async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    protect(req);
    const actor = req.getCurrentUser().full_name;
    let data;
    if (req.method === 'GET')
      data =
        req.query.view === 'delivery'
          ? await deliveryOverview()
          : req.query.view === 'knowledge'
          ? await knowledgeList()
          : req.query.view === 'audit'
          ? await auditPage(
              req.query.caseId,
              req.query.before,
              req.query.includeTests === 'true'
            )
          : req.query.caseId
          ? await detail(req.query.caseId, undefined, req.query.before)
          : await adminOverview();
    else if (req.body.area === 'delivery')
      data = await deliveryCommand(actor, req.body);
    else if (req.body.area === 'knowledge')
      data = await knowledgeCommand(actor, req.body);
    else if (req.body.command === 'preview') {
      const p = await policy();
      const settings = req.body.settings
        ? validateSettings(req.body.settings)
        : p.settings;
      const amount = Number(req.body.amountMinor);
      if (!Number.isSafeInteger(amount) || amount < 0)
        throw Object.assign(new Error('Enter a valid sample amount.'), {
          status: 400
        });
      let sources = await retrieve(String(req.body.question || ''));
      let warnings: string[] = [];
      const published = await knowledgeList();
      warnings = published
        .filter((d) => d.state === 'published')
        .flatMap((d) =>
          d.policyConflicts.map((issue) => `${d.title}: ${issue}`)
        );
      if (req.body.documentId) {
        const doc = (
          await pool.query(
            "SELECT * FROM support_knowledge WHERE document_id=$1 AND state IN ('ready','published')",
            [uuid(req.body.documentId)]
          )
        ).rows[0];
        if (
          doc?.audience === 'public' &&
          !conflicts(doc.analysis.effectiveText, settings).length
        )
          sources = chunks(doc.analysis.effectiveText)
            .slice(0, 6)
            .map((c, index) => ({
              ...c,
              chunk_id: `preview-${index}`,
              title: doc.title,
              revision: doc.revision
            }));
      }
      data = {
        sources,
        warnings,
        authorization:
          settings.autoAuthorize &&
          settings.autoReasons.includes(req.body.reason)
            ? 'Allowed after customer confirmation'
            : 'Needs seller approval',
        refund: !settings.refundReasons.includes(req.body.reason)
          ? 'Blocked by permitted reasons'
          : settings.autoRefund && amount <= settings.autoRefundMinor
          ? 'Allowed after receipt, inspection and exact consent'
          : 'Needs exact seller approval after inspection',
        note: 'Read-only policy check. Existing commitments, ownership, quantities and balances are rechecked during execution. No order was changed.'
      };
    } else data = await adminCommand(actor, req.body);
    res.json({ data });
  } catch (error) {
    supportError(res, error);
  }
};
