// /api/profiles/[id]/projects/[pid]
import { crudHandler } from '../../../_lib/crud';
export default crudHandler('project', { idParam: 'pid' });
