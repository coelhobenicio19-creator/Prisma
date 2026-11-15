// /api/profiles/[id]/oral/sessions/[sid]
import { crudHandler } from '../../../../_lib/crud';
export default crudHandler('oral_session', { idParam: 'sid' });
