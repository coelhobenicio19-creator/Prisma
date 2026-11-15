// /api/profiles/[id]/knowledge/entries/[eid]
import { crudHandler } from '../../../../_lib/crud';
export default crudHandler('knowledge_entry', { idParam: 'eid' });
