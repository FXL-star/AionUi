import { Message } from '@arco-design/web-react';
import { useAssistantEditor, useAssistantList } from '@renderer/hooks/assistant';
import { useManagedAgentRuntimeCatalog } from '@renderer/hooks/agent/useManagedAgents';
import {
  buildAssistantEditorBackends,
  resolveAvatarImageSrc,
} from '@renderer/pages/settings/AssistantSettings/assistantUtils';
import DeleteAssistantModal from '@renderer/pages/settings/AssistantSettings/DeleteAssistantModal';
import SkillConfirmModals from '@renderer/pages/settings/AssistantSettings/SkillConfirmModals';
import type { AssistantEditorViewModel, AssistantListItem } from '@renderer/pages/settings/AssistantSettings/types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TsAssistantList from './TsAssistantList';
import TsAssistantEditorPage from './TsAssistantEditorPage';
import TsAssistantDetailPage from './TsAssistantDetailPage';

type TsAssistantNavigationState = {
  openAssistantId?: string;
  openAssistantEditor?: boolean;
};
const OPEN_ASSISTANT_EDITOR_INTENT_KEY = 'guid.openAssistantEditorIntent';

const TsAssistantSettings: React.FC = () => {
  const [message, messageContext] = Message.useMessage({ maxCount: 10 });
  const location = useLocation();
  const navigationState = location.state as TsAssistantNavigationState | null;
  const [searchQuery, setSearchQuery] = useState('');
  const [viewedAssistantId, setViewedAssistantId] = useState<string | null>(null);
  const consumedLocationRef = useRef<string | null>(null);
  const {
    assistants,
    activeAssistant,
    setActiveAssistantId,
    loadAssistants,
    assistantOrder,
    setAssistantOrder,
    localeKey,
  } = useAssistantList();
  const managedAgentRuntimeCatalog = useManagedAgentRuntimeCatalog();
  const editor = useAssistantEditor({
    localeKey,
    activeAssistant,
    setActiveAssistantId,
    loadAssistants,
    assistants,
    assistantOrder,
    setAssistantOrder,
    message,
  });
  const builtinAvatarOptions = useMemo(
    () =>
      assistants
        .filter((assistant) => assistant.source === 'builtin' && assistant.avatar?.startsWith('/api/assistants/'))
        .flatMap((assistant) => {
          const src = resolveAvatarImageSrc(assistant.avatar);
          return src ? [{ id: assistant.id, label: assistant.name_i18n?.[localeKey] || assistant.name, src }] : [];
        }),
    [assistants, localeKey]
  );
  const availableBackends = useMemo(
    () => buildAssistantEditorBackends(managedAgentRuntimeCatalog, localeKey, editor.editAgent),
    [managedAgentRuntimeCatalog, localeKey, editor.editAgent]
  );
  const editAvatarImage = editor.editAvatarPreview || resolveAvatarImageSrc(editor.editAvatar);
  const viewedAssistant = assistants.find(
    (assistant) => assistant.id === viewedAssistantId && assistant.source === 'builtin' && assistant.enabled
  );
  const showEditor =
    editor.editVisible && (editor.isCreating || (activeAssistant !== null && activeAssistant.source !== 'builtin'));
  const handleOpen = useCallback(
    (assistant: AssistantListItem) => {
      if (assistant.source === 'builtin') {
        if (!assistant.enabled) return;
        editor.setEditVisible(false);
        setViewedAssistantId(assistant.id);
        return;
      }
      setViewedAssistantId(null);
      void editor.handleEdit(assistant);
    },
    [editor]
  );
  const editorViewModel: AssistantEditorViewModel = {
    isCreating: editor.isCreating,
    profile: {
      name: editor.editName,
      setName: editor.setEditName,
      description: editor.editDescription,
      setDescription: editor.setEditDescription,
      avatar: editor.editAvatar,
      setAvatar: editor.setEditAvatar,
      setAvatarPreview: editor.setEditAvatarPreview,
      avatarImage: editAvatarImage,
      builtinAvatarOptions,
    },
    agent: {
      value: editor.editAgent,
      setValue: editor.setEditAgent,
      availableBackends,
    },
    prompts: {
      text: editor.editRecommendedPromptsText,
      setText: editor.setEditRecommendedPromptsText,
    },
    defaults: {
      model: {
        mode: editor.defaultModelMode,
        setMode: editor.setDefaultModelMode,
        value: editor.defaultModelValue,
        setValue: editor.setDefaultModelValue,
      },
      permission: {
        mode: editor.defaultPermissionMode,
        setMode: editor.setDefaultPermissionMode,
        value: editor.defaultPermissionValue,
        setValue: editor.setDefaultPermissionValue,
      },
      thoughtLevel: {
        mode: editor.defaultThoughtLevelMode,
        setMode: editor.setDefaultThoughtLevelMode,
        value: editor.defaultThoughtLevelValue,
        setValue: editor.setDefaultThoughtLevelValue,
      },
      skills: {
        mode: editor.defaultSkillsMode,
        setMode: editor.setDefaultSkillsMode,
      },
      mcps: {
        mode: editor.defaultMcpMode,
        setMode: editor.setDefaultMcpMode,
        availableServers: editor.availableMcpServers,
        selectedIds: editor.selectedMcpIds,
        setSelectedIds: editor.setSelectedMcpIds,
      },
    },
    rules: {
      content: editor.editContext,
      setContent: editor.setEditContext,
      viewMode: editor.promptViewMode,
      setViewMode: editor.setPromptViewMode,
    },
    skills: {
      availableSkills: editor.availableSkills,
      selectedSkills: editor.selectedSkills,
      setSelectedSkills: editor.setSelectedSkills,
      pendingSkills: editor.pendingSkills,
      setDeletePendingSkillName: editor.setDeletePendingSkillName,
      setDeleteCustomSkillName: editor.setDeleteCustomSkillName,
      builtinAutoSkills: editor.builtinAutoSkills,
      disabledBuiltinSkills: editor.disabledBuiltinSkills,
      setDisabledBuiltinSkills: editor.setDisabledBuiltinSkills,
    },
    actions: {
      save: () => {
        if (editor.isCreating || (activeAssistant && activeAssistant.source !== 'builtin')) void editor.handleSave();
      },
      requestDelete: () => {
        if (activeAssistant?.source === 'user') editor.handleDeleteClick();
      },
      duplicate: (assistant) => void editor.handleDuplicate(assistant),
    },
  };

  useEffect(() => {
    if (consumedLocationRef.current === location.key) return;
    let targetId = navigationState?.openAssistantEditor ? navigationState.openAssistantId : null;
    targetId ||= new URLSearchParams(location.search).get('highlight');
    try {
      const rawIntent = sessionStorage.getItem(OPEN_ASSISTANT_EDITOR_INTENT_KEY);
      if (!targetId && rawIntent) {
        const intent: unknown = JSON.parse(rawIntent);
        if (
          intent &&
          typeof intent === 'object' &&
          'openAssistantEditor' in intent &&
          intent.openAssistantEditor &&
          'assistantId' in intent &&
          typeof intent.assistantId === 'string'
        ) {
          targetId = intent.assistantId;
        }
      }
    } catch (error) {
      console.error('[TsAssistantSettings] Failed to parse assistant open intent:', error);
    }
    if (!targetId || assistants.length === 0) return;
    const target = assistants.find((assistant) => assistant.id === targetId);
    if (!target) return;
    consumedLocationRef.current = location.key;
    try {
      sessionStorage.removeItem(OPEN_ASSISTANT_EDITOR_INTENT_KEY);
    } catch (error) {
      console.error('[TsAssistantSettings] Failed to clear assistant open intent:', error);
    }
    handleOpen(target);
  }, [assistants, handleOpen, location.key, location.search, navigationState]);

  return (
    <div className='h-full w-full overflow-hidden bg-bg-0'>
      {messageContext}
      {viewedAssistant ? (
        <TsAssistantDetailPage
          key={`${viewedAssistant.id}-${localeKey}`}
          assistant={viewedAssistant}
          localeKey={localeKey}
          onBack={() => setViewedAssistantId(null)}
        />
      ) : showEditor ? (
        <TsAssistantEditorPage
          editor={editorViewModel}
          activeAssistant={activeAssistant}
          onBack={() => editor.setEditVisible(false)}
        />
      ) : (
        <TsAssistantList
          assistants={assistants}
          assistantOrder={assistantOrder}
          localeKey={localeKey}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onOpen={handleOpen}
          onCreate={() => {
            setViewedAssistantId(null);
            void editor.handleCreate();
          }}
          onDelete={(assistant) => {
            if (assistant.source === 'user') editor.handleDeleteRequest(assistant);
          }}
          onToggleEnabled={(assistant, enabled) => {
            if (assistant.source !== 'builtin') void editor.handleToggleEnabled(assistant, enabled);
          }}
        />
      )}
      <DeleteAssistantModal
        visible={editor.deleteConfirmVisible && activeAssistant?.source === 'user'}
        onCancel={() => editor.setDeleteConfirmVisible(false)}
        onConfirm={() => {
          if (activeAssistant?.source === 'user') void editor.handleDeleteConfirm();
        }}
        activeAssistant={activeAssistant}
      />
      <SkillConfirmModals
        deletePendingSkillName={editor.deletePendingSkillName}
        setDeletePendingSkillName={editor.setDeletePendingSkillName}
        pendingSkills={editor.pendingSkills}
        setPendingSkills={editor.setPendingSkills}
        deleteCustomSkillName={editor.deleteCustomSkillName}
        setDeleteCustomSkillName={editor.setDeleteCustomSkillName}
        customSkills={editor.customSkills}
        setCustomSkills={editor.setCustomSkills}
        selectedSkills={editor.selectedSkills}
        setSelectedSkills={editor.setSelectedSkills}
        message={message}
      />
    </div>
  );
};

export default TsAssistantSettings;
