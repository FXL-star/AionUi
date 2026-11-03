import type { AssistantListItem } from '@renderer/pages/settings/AssistantSettings/types';
import AssistantAvatar from '@renderer/pages/settings/AssistantSettings/AssistantAvatar';
import RuntimeBadge from '@renderer/pages/settings/AssistantSettings/home/RuntimeBadge';
import SettingsPageHeader from '@renderer/pages/settings/components/SettingsPageHeader';
import AionSearchInput from '@renderer/components/base/AionSearchInput';
import { selectableAssistants } from '@renderer/utils/model/assistantSelection';
import { Button, Empty, Switch, Tag } from '@arco-design/web-react';
import { Plus } from '@icon-park/react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type TsAssistantListProps = {
  assistants: AssistantListItem[];
  assistantOrder: readonly string[];
  localeKey: string;
  searchQuery: string;
  onSearch: (value: string) => void;
  onCreate: () => void;
  onOpen: (assistant: AssistantListItem) => void;
  onDelete: (assistant: AssistantListItem) => void;
  onToggleEnabled: (assistant: AssistantListItem, enabled: boolean) => void;
};

const TsAssistantList: React.FC<TsAssistantListProps> = ({
  assistants,
  assistantOrder,
  localeKey,
  searchQuery,
  onSearch,
  onCreate,
  onOpen,
  onDelete,
  onToggleEnabled,
}) => {
  const { t } = useTranslation();
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleAssistants = useMemo(() => {
    const available = assistants.filter(
      (assistant) => assistant.source !== 'generated' && (assistant.source !== 'builtin' || assistant.enabled)
    );
    const ordered = [
      ...selectableAssistants(available, assistantOrder),
      ...available.filter((assistant) => !assistant.enabled),
    ];
    if (!normalizedSearch) return ordered;
    return ordered.filter((assistant) =>
      [
        assistant.name,
        assistant.name_i18n?.[localeKey],
        assistant.name_i18n?.['en-US'],
        assistant.description,
        assistant.description_i18n?.[localeKey],
        assistant.description_i18n?.['en-US'],
        assistant.agent?.type,
        assistant.agent?.acp_backend,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [assistants, assistantOrder, localeKey, normalizedSearch]);

  return (
    <div data-testid='ts-assistant-list-page' className='flex h-full min-h-0 flex-col overflow-hidden bg-bg-0'>
      <div className='border-b border-border-2 px-16px py-20px md:px-40px md:py-32px'>
        <div className='mx-auto w-full max-w-800px'>
          <SettingsPageHeader
            sticky={false}
            title={t('settings.assistants')}
            actions={
              <Button type='primary' icon={<Plus size={16} />} onClick={onCreate} data-testid='ts-create-assistant'>
                {t('settings.createAssistant')}
              </Button>
            }
          />
          <AionSearchInput
            className='mt-16px w-full'
            data-testid='ts-search-assistants'
            inputProps={{ 'aria-label': t('settings.searchAssistants') }}
            placeholder={t('settings.searchAssistants')}
            value={searchQuery}
            onChange={onSearch}
          />
        </div>
      </div>
      <div className='min-h-0 flex-1 overflow-auto px-16px py-18px md:px-40px'>
        <div className='mx-auto flex w-full max-w-800px flex-col gap-12px'>
          {visibleAssistants.length === 0 ? (
            <Empty description={t(normalizedSearch ? 'settings.assistantNoMatch' : 'settings.assistantsEmpty')} />
          ) : (
            visibleAssistants.map((assistant) => {
              const readOnly = assistant.source === 'builtin';
              const name = assistant.name_i18n?.[localeKey] || assistant.name;
              return (
                <article
                  key={assistant.id}
                  data-testid={`ts-assistant-${assistant.id}`}
                  className='flex flex-wrap items-center gap-16px rounded-14px border border-solid border-border-2 bg-base p-16px'
                >
                  <AssistantAvatar assistant={assistant} size={42} />
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-8px'>
                      <h2 className='m-0 break-words text-14px font-600 text-t-primary'>{name}</h2>
                      <Tag size='small'>
                        {t(
                          readOnly
                            ? 'settings.assistantSourceOfficial'
                            : assistant.source === 'generated'
                              ? 'settings.assistantSourceCli'
                              : 'settings.assistantSourceCustom'
                        )}
                      </Tag>
                      {readOnly && <span className='text-12px text-t-tertiary'>{t('common.readOnly')}</span>}
                    </div>
                    <p className='my-6px line-clamp-2 text-12px leading-relaxed text-t-secondary'>
                      {assistant.description_i18n?.[localeKey] || assistant.description}
                    </p>
                    <RuntimeBadge assistant={assistant} />
                  </div>
                  <div className='flex w-full flex-wrap items-center justify-end gap-8px sm:w-auto'>
                    {!readOnly && (
                      <Switch
                        size='small'
                        checked={assistant.enabled}
                        aria-label={`${name}: ${t('settings.assistantSectionEnabled')}`}
                        data-testid={`ts-toggle-${assistant.id}`}
                        onChange={(enabled) => onToggleEnabled(assistant, enabled)}
                      />
                    )}
                    <Button size='small' onClick={() => onOpen(assistant)} data-testid={`ts-open-${assistant.id}`}>
                      {t(readOnly ? 'settings.editAssistant' : 'common.edit')}
                    </Button>
                    {assistant.source === 'user' && (
                      <Button
                        size='small'
                        status='danger'
                        onClick={() => onDelete(assistant)}
                        data-testid={`ts-delete-${assistant.id}`}
                      >
                        {t('common.delete')}
                      </Button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TsAssistantList;
