// /api/profiles/[id]/planner/tasks/[tid]
import { crudHandler } from '../../../../_lib/crud';
export default crudHandler('planner_task', { idParam: 'tid' });
