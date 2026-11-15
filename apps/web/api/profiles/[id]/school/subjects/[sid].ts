// /api/profiles/[id]/school/subjects/[sid]
import { crudHandler } from '../../../../_lib/crud';
export default crudHandler('school_subject', { idParam: 'sid' });
