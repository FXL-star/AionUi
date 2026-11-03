import type { AssistantEditorViewModel, AssistantListItem } from '@renderer/pages/settings/AssistantSettings/types';
import AssistantEditorSections from '@renderer/pages/settings/AssistantSettings/AssistantEditorSections';
import { Button } from '@arco-design/web-react';
import { ArrowLeft } from '@icon-park/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

type TsAssistantEditorPageProps = {
  editor: AssistantEditorViewModel;
  activeAssistant: AssistantListItem | null;
  onBack: () => void;
};

const TsAssistantEditorPage: React.FC<TsAssistantEditorPageProps> = ({ editor, activeAssistant, onBack }) => {
  const { t } = useTranslation();
  const canEdit = editor.isCreating || (activeAssistant !== null && activeAssistant.source !== 'builtin');
  if (!canEdit) return null;

  return (
    <div data-testid='ts-assistant-editor-page' className='flex h-full min-h-0 flex-col overflow-hidden bg-bg-0'>
      <div className='flex flex-wrap items-center gap-12px border-b border-border-2 px-18px py-12px'>
        <Button type='text' icon={<ArrowLeft size={16} />} onClick={onBack}>
          {t('settings.assistantBackToList')}
        </Button>
        <div className='min-w-0 flex-1 truncate text-14px font-600 text-t-primary'>
          {editor.profile.name.trim() || t('settings.createAssistant')}
        </div>
        {!editor.isCreating && activeAssistant?.source === 'user' && (
          <Button status='danger' onClick={editor.actions.requestDelete}>
            {t('common.delete')}
          </Button>
        )}
        <Button onClick={onBack}>{t('common.cancel')}</Button>
        <Button type='primary' onClick={editor.actions.save} data-testid='ts-save-assistant'>
          {t(editor.isCreating ? 'common.create' : 'common.save')}
        </Button>
      </div>
      <div data-editor-popup-root className='relative min-h-0 flex-1 overflow-auto px-18px py-18px pb-24px'>
        <div className='mx-auto w-full max-w-760px'>
          <AssistantEditorSections editor={editor} activeAssistant={activeAssistant} />
        </div>
      </div>
    </div>
  );
};

export default TsAssistantEditorPage;
