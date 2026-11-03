import { ipcBridge } from '@/common';
import type { AssistantDetail } from '@/common/types/agent/assistantTypes';
import type { AssistantListItem } from '@renderer/pages/settings/AssistantSettings/types';
import AssistantAvatar from '@renderer/pages/settings/AssistantSettings/AssistantAvatar';
import MarkdownView from '@renderer/components/Markdown';
import { Alert, Button, Descriptions, Spin, Tag } from '@arco-design/web-react';
import { ArrowLeft } from '@icon-park/react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type TsAssistantDetailPageProps = {
  assistant: AssistantListItem;
  localeKey: string;
  onBack: () => void;
};

const TsAssistantDetailPage: React.FC<TsAssistantDetailPageProps> = ({ assistant, localeKey, onBack }) => {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<AssistantDetail | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setFailed(false);
    void ipcBridge.assistants.get.invoke({ id: assistant.id, locale: localeKey }).then(
      (result) => {
        if (cancelled) return;
        if (result.source !== 'builtin' || !result.state.enabled) {
          setFailed(true);
          return;
        }
        setDetail(result);
      },
      () => {
        if (!cancelled) setFailed(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [assistant.id, localeKey, attempt]);

  const unset = t('settings.assistantSelectDefaultUnset');
  const scalarDefault = (value: AssistantDetail['defaults']['model']) =>
    value.mode === 'auto' ? t('settings.assistantRememberLastUsed') : value.value || unset;
  const listDefault = (value: AssistantDetail['defaults']['skills']) =>
    value.mode === 'auto' ? t('settings.assistantRememberLastUsed') : value.value.join(', ') || unset;
  const prompts =
    detail?.prompts.recommended_i18n?.[localeKey] ??
    detail?.prompts.recommended_i18n?.['en-US'] ??
    detail?.prompts.recommended ??
    [];

  return (
    <div data-testid='ts-assistant-detail-page' className='flex h-full min-h-0 flex-col overflow-hidden bg-bg-0'>
      <div className='flex flex-wrap items-center gap-12px border-b border-border-2 px-18px py-12px'>
        <Button type='text' icon={<ArrowLeft size={16} />} onClick={onBack}>
          {t('settings.assistantBackToList')}
        </Button>
        <span className='text-14px font-600 text-t-primary'>{t('settings.editAssistant')}</span>
        <Tag>{t('common.readOnly')}</Tag>
      </div>
      <div className='min-h-0 flex-1 overflow-auto px-18px py-24px'>
        <div className='mx-auto flex w-full max-w-760px flex-col gap-24px'>
          {failed ? (
            <Alert
              type='error'
              content={t('common.failed')}
              action={<Button onClick={() => setAttempt((value) => value + 1)}>{t('common.retry')}</Button>}
            />
          ) : !detail ? (
            <div className='flex justify-center py-32px' role='status' aria-label={t('common.loading')}>
              <Spin />
            </div>
          ) : (
            <>
              <section className='flex items-start gap-16px'>
                <AssistantAvatar assistant={{ ...assistant, avatar: detail.profile.avatar }} size={48} />
                <div className='min-w-0'>
                  <h1 className='m-0 break-words text-22px font-600 text-t-primary'>
                    {detail.profile.name_i18n?.[localeKey] || detail.profile.name}
                  </h1>
                  <p className='mb-0 mt-8px whitespace-pre-wrap text-13px leading-relaxed text-t-secondary'>
                    {detail.profile.description_i18n?.[localeKey] || detail.profile.description}
                  </p>
                </div>
              </section>
              <Descriptions
                title={t('settings.assistantDefaultConfigSection')}
                column={1}
                data={[
                  { label: t('settings.assistantMainAgent'), value: detail.engine.agent_id || unset },
                  { label: t('settings.assistantDefaultModelLabel'), value: scalarDefault(detail.defaults.model) },
                  {
                    label: t('settings.assistantDefaultPermissionLabel'),
                    value: scalarDefault(detail.defaults.permission),
                  },
                  {
                    label: t('settings.assistantDefaultThoughtLevelLabel'),
                    value: scalarDefault(detail.defaults.thought_level),
                  },
                  { label: t('settings.assistantDefaultSkillsLabel'), value: listDefault(detail.defaults.skills) },
                  { label: t('settings.assistantDefaultMcpLabel'), value: listDefault(detail.defaults.mcps) },
                ]}
              />
              <section>
                <h2 className='mb-12px mt-0 text-16px font-600 text-t-primary'>
                  {t('settings.assistantRecommendedPromptsLabel')}
                </h2>
                {prompts.length ? (
                  <ul className='m-0 ps-20px text-13px leading-relaxed text-t-secondary'>
                    {prompts.map((prompt, index) => (
                      <li key={`${index}-${prompt}`}>{prompt}</li>
                    ))}
                  </ul>
                ) : (
                  <p className='text-t-tertiary'>{unset}</p>
                )}
              </section>
              <section>
                <h2 className='mb-12px mt-0 text-16px font-600 text-t-primary'>{t('settings.assistantRules')}</h2>
                <div className='break-words text-13px leading-relaxed text-t-secondary'>
                  {detail.rules.content ? <MarkdownView>{detail.rules.content}</MarkdownView> : unset}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TsAssistantDetailPage;
