import type { Assistant } from '@/common/types/agent/assistantTypes';
import AionSearchInput from '@renderer/components/base/AionSearchInput';
import { useAssistantOrder } from '@renderer/hooks/assistant/useAssistantOrder';
import AssistantAvatar from '@renderer/pages/settings/AssistantSettings/AssistantAvatar';
import { Button, Empty, Modal, Tag } from '@arco-design/web-react';
import { Check, Switch } from '@icon-park/react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tsSelectableAssistants } from './tsAssistantSelection';
import styles from './TsAssistantSelector.module.css';

type TsAssistantSelectorProps = {
  assistants: Assistant[];
  selectedAssistantId: string | null;
  localeKey: string;
  onSelectAssistant: (assistantId: string) => void;
  disabled?: boolean;
};

const TsAssistantSelector: React.FC<TsAssistantSelectorProps> = ({
  assistants,
  selectedAssistantId,
  localeKey,
  onSelectAssistant,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const { assistantOrder } = useAssistantOrder();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const availableAssistants = useMemo(
    () => tsSelectableAssistants(assistants, assistantOrder),
    [assistants, assistantOrder]
  );
  const selectedAssistant = availableAssistants.find((assistant) => assistant.id === selectedAssistantId);
  const nameOf = (assistant: Assistant) => assistant.name_i18n?.[localeKey] || assistant.name;
  const query = search.trim().toLocaleLowerCase();
  const matchingAssistants = availableAssistants.filter((assistant) =>
    [
      assistant.name,
      assistant.name_i18n?.[localeKey],
      assistant.name_i18n?.['en-US'],
      assistant.description,
      assistant.description_i18n?.[localeKey],
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase()
      .includes(query)
  );

  return (
    <>
      <div className={styles.header}>
        {selectedAssistant && <AssistantAvatar assistant={selectedAssistant} size={36} />}
        <h1 className={styles.name} data-testid='ts-selected-assistant'>
          {selectedAssistant ? nameOf(selectedAssistant) : t('guid.selectAssistantHint')}
        </h1>
        <Button
          type='text'
          className={styles.switchButton}
          icon={<Switch size={18} />}
          disabled={disabled}
          onClick={() => {
            setSearch('');
            setVisible(true);
          }}
        >
          {t('guid.tsSwitchAssistant')}
        </Button>
      </div>
      <Modal
        title={t('guid.tsSwitchAssistant')}
        visible={visible}
        footer={null}
        onCancel={() => setVisible(false)}
        autoFocus
        focusLock
        unmountOnExit
        className={styles.modal}
      >
        <AionSearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('settings.searchAssistants')}
          inputProps={{ 'aria-label': t('settings.searchAssistants') }}
          className='mb-16px w-full'
        />
        <div className={styles.list}>
          {matchingAssistants.length === 0 ? (
            <Empty description={t(query ? 'settings.assistantNoMatch' : 'settings.assistantsEmpty')} />
          ) : (
            matchingAssistants.map((assistant) => {
              const selected = assistant.id === selectedAssistantId;
              const description = assistant.description_i18n?.[localeKey] || assistant.description;
              return (
                <Button
                  key={assistant.id}
                  type='text'
                  className={`${styles.option} ${selected ? styles.selected : ''}`}
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => {
                    onSelectAssistant(assistant.id);
                    setVisible(false);
                  }}
                >
                  <AssistantAvatar assistant={assistant} size={36} />
                  <span className={styles.meta}>
                    <span className={styles.optionName}>{nameOf(assistant)}</span>
                    {description && <span className={styles.description}>{description}</span>}
                  </span>
                  <Tag size='small'>
                    {t(
                      assistant.source === 'builtin'
                        ? 'settings.assistantSourceOfficial'
                        : 'settings.assistantSourceCustom'
                    )}
                  </Tag>
                  {selected && <Check size={18} className='shrink-0' />}
                </Button>
              );
            })
          )}
        </div>
      </Modal>
    </>
  );
};

export default TsAssistantSelector;
