// /api/profiles/[id]/studio/documents/[did]
import { crudHandler } from '../../../../_lib/crud';
export default crudHandler('studio_document', { idParam: 'did' });
