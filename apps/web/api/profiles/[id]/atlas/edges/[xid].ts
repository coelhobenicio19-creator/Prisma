// /api/profiles/[id]/atlas/edges/[xid]
import { crudHandler } from '../../../../_lib/crud';
export default crudHandler('atlas_edge', { idParam: 'xid' });
