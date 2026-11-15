// /api/profiles/[id]/lab/experiments/[xid]
import { crudHandler } from '../../../../_lib/crud';
export default crudHandler('lab_experiment', { idParam: 'xid' });
