// /api/profiles/[id]/exams/[eid] — GET/PATCH/DELETE de uma prova
import { crudHandler } from '../../../_lib/crud';
export default crudHandler('exam', { idParam: 'eid' });
