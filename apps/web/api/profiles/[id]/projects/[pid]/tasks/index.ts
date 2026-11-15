// /api/profiles/[id]/projects/[pid]/tasks — CRUD de subtarefas do projeto
import { crudHandler } from '../../../../../_lib/crud';
export default crudHandler('project_task');
