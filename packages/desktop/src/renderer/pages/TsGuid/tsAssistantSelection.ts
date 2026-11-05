import type { Assistant } from '@/common/types/agent/assistantTypes';
import { selectableAssistants } from '@renderer/utils/model/assistantSelection';

/** Keep the Ts new-conversation catalog limited to enabled custom and official assistants. */
export const tsSelectableAssistants = (assistants: Assistant[], preferredOrder?: readonly string[]): Assistant[] =>
  selectableAssistants(
    assistants.filter((assistant) => assistant.source === 'user' || assistant.source === 'builtin'),
    preferredOrder
  );
