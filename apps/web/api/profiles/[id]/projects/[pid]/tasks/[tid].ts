// /api/profiles/[id]/projects/[pid]/tasks/[tid]
import { crudHandler } from '../../../../../_lib/crud';
export default crudHandler('project_task', { idParam: 'tid' });
