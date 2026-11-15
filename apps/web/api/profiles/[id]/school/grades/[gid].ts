// /api/profiles/[id]/school/grades/[gid]
import { crudHandler } from '../../../../_lib/crud';
export default crudHandler('school_grade', { idParam: 'gid' });
