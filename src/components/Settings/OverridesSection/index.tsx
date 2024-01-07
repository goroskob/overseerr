import Button from '@app/components/Common/Button';
import LanguageSelector from '@app/components/LanguageSelector';
import { GenreSelector, KeywordSelector } from '@app/components/Selector';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import type { OverrideSetting } from '@server/lib/settings';
import { defineMessages, useIntl } from 'react-intl';
import type { OnChangeValue } from 'react-select';
import Select from 'react-select';

type OptionType = {
  value: number;
  label: string;
};

const messages = defineMessages({
  defaultRootFolder: 'Default',
  genres: 'Genres',
  keywords: 'Keywords',
  loadingTags: 'Loading tags…',
  loadingrootfolders: 'Loading root folders…',
  originalLanguage: 'Original Language',
  rootfolder: 'Root Folder',
  rule: 'Rule',
  ruleSettings: 'Settings',
  tags: 'Tags',
  testFirstRootFolders: 'Test connection to load root folders',
  testFirstTags: 'Test connection to load tags',
  selecttags: 'Select tags',
  notagoptions: 'No tags.',
  qualityprofile: 'Quality Profile',
  selectQualityProfile: 'Select quality profile',
  testFirstQualityProfiles: 'Test connection to load quality profiles',
  ruleOverrides: 'Override Rules',
  newOverride: 'New Override Rule',
});

interface AvailableValues {
  profiles: {
    id: number;
    name: string;
  }[];
  rootFolders: {
    id: number;
    path: string;
  }[];
  tags: {
    id: number;
    label: string;
  }[];
}

interface RuleEntryProps {
  setting: OverrideSetting;
  isTesting: boolean;
  isValidated: boolean;
  testResponse: AvailableValues;
  onUpdateRule: (rule: Partial<OverrideSetting['rule']>) => void;
  onUpdateOverride: (override: Partial<OverrideSetting['override']>) => void;
  onDelete: () => void;
}

const RuleEntry = ({
  setting,
  isTesting,
  isValidated,
  testResponse,
  onUpdateOverride,
  onUpdateRule,
  onDelete,
}: RuleEntryProps) => {
  const intl = useIntl();

  const profileOptions = testResponse.profiles.map((value) => ({
    value: value.id,
    label: value.name,
  }));
  const rootFolderOptions = testResponse.rootFolders.map((folder) => ({
    value: folder.id,
    label: folder.path,
  }));
  const tagOptions = testResponse.tags.map((tag) => ({
    label: tag.label,
    value: tag.id,
  }));

  function getValue(
    values: (string | number | undefined)[],
    options: OptionType[],
    optionKey: keyof OptionType
  ): OptionType[] {
    return isTesting
      ? []
      : options.filter((option) =>
          values.some((value) => option[optionKey] === value)
        );
  }

  return (
    <div className="col-span-1 rounded-lg bg-gray-800 px-4 py-2 shadow-md ring-1 ring-gray-700 ">
      <div className="flex justify-between">
        <div className="pt-2 text-lg">{intl.formatMessage(messages.rule)}</div>
        <Button buttonType="ghost" onClick={() => onDelete()}>
          <TrashIcon />
        </Button>
      </div>

      <div className="form-row">
        <label htmlFor="port" className="text-label">
          {intl.formatMessage(messages.genres)}
        </label>
        <div className="form-input-area">
          <GenreSelector
            type="tv"
            defaultValue={setting.rule.genres?.join(',')}
            isMulti
            onChange={(value) => {
              onUpdateRule({
                genres: value?.map((v) => v.value),
              });
            }}
          />
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="port" className="text-label">
          {intl.formatMessage(messages.originalLanguage)}
        </label>
        <div className="form-input-area">
          <LanguageSelector
            value={setting.rule.languages?.join('|')}
            setFieldValue={(_key, value) => {
              onUpdateRule({
                languages: value.split('|'),
              });
            }}
          />
        </div>
      </div>
      <div className="form-row">
        <label htmlFor="port" className="text-label">
          {intl.formatMessage(messages.keywords)}
        </label>
        <div className="form-input-area">
          <KeywordSelector
            defaultValue={setting.rule.keywords?.join(',')}
            isMulti
            onChange={(value) => {
              onUpdateRule({
                keywords: value?.map((v) => v.value),
              });
            }}
          />
        </div>
      </div>

      <div className="form-row text-lg">
        {intl.formatMessage(messages.ruleSettings)}
      </div>
      <div className="form-row">
        <label htmlFor="rootFolder" className="text-label">
          {intl.formatMessage(messages.rootfolder)}
        </label>
        <div className="form-input-area">
          <Select<OptionType, false>
            className="react-select-container"
            classNamePrefix="react-select"
            isDisabled={!isValidated || isTesting}
            isLoading={isTesting}
            isClearable
            options={rootFolderOptions}
            value={getValue(
              [setting.override.activeDirectory],
              rootFolderOptions,
              'label'
            )}
            placeholder={
              isTesting
                ? intl.formatMessage(messages.loadingrootfolders)
                : !isValidated
                ? intl.formatMessage(messages.testFirstRootFolders)
                : intl.formatMessage(messages.defaultRootFolder)
            }
            onChange={(value: OnChangeValue<OptionType, false>) => {
              onUpdateOverride({
                ...setting.override,
                activeDirectory: value?.label,
              });
            }}
            noOptionsMessage={() =>
              intl.formatMessage(messages.testFirstRootFolders)
            }
          />
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="tags" className="text-label">
          {intl.formatMessage(messages.tags)}
        </label>
        <div className="form-input-area">
          <Select<OptionType, true>
            className="react-select-container"
            classNamePrefix="react-select"
            options={tagOptions}
            isMulti
            isDisabled={!isValidated || isTesting}
            placeholder={
              !isValidated
                ? intl.formatMessage(messages.testFirstTags)
                : isTesting
                ? intl.formatMessage(messages.loadingTags)
                : intl.formatMessage(messages.selecttags)
            }
            isLoading={isTesting}
            value={getValue(setting.override.tags ?? [], tagOptions, 'value')}
            onChange={(value: OnChangeValue<OptionType, true>) => {
              const tags = value.map(({ value }) => value);
              onUpdateOverride({
                tags: tags.length > 0 ? tags : undefined,
              });
            }}
            noOptionsMessage={() => intl.formatMessage(messages.notagoptions)}
          />
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="activeProfileId" className="text-label">
          {intl.formatMessage(messages.qualityprofile)}
        </label>
        <div className="form-input-area">
          <div className="form-input-field">
            <Select<OptionType, false>
              className="react-select-container"
              classNamePrefix="react-select"
              isDisabled={!isValidated || isTesting}
              isLoading={isTesting}
              isClearable
              options={profileOptions}
              value={getValue(
                [setting.override.activeProfileId],
                profileOptions,
                'value'
              )}
              placeholder={
                !isValidated
                  ? intl.formatMessage(messages.testFirstQualityProfiles)
                  : intl.formatMessage(messages.selectQualityProfile)
              }
              onChange={(value: OnChangeValue<OptionType, false>) => {
                onUpdateOverride({
                  ...setting.override,
                  activeProfileId: value?.value,
                });
              }}
              noOptionsMessage={() =>
                intl.formatMessage(messages.testFirstQualityProfiles)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface OverridesSectionProps {
  isTesting: boolean;
  isValidated: boolean;
  testResponse: AvailableValues;

  overrides: OverrideSetting[];
  onOverridesChange: (rules: OverrideSetting[]) => void;
}

const OverridesSection = ({
  overrides,
  isTesting,
  isValidated,
  testResponse,
  onOverridesChange,
}: OverridesSectionProps) => {
  const intl = useIntl();

  return (
    <div className="section space-y-3">
      <div className="text-lg">
        {intl.formatMessage(messages.ruleOverrides)}
      </div>
      {overrides.map((rule, i) => (
        <RuleEntry
          key={i}
          setting={rule}
          isTesting={isTesting}
          isValidated={isValidated}
          testResponse={testResponse}
          onUpdateOverride={(override) => {
            const newOverrides = [...overrides];
            const oldOverride = newOverrides[i];
            newOverrides[i] = {
              ...oldOverride,
              override: {
                ...oldOverride.override,
                ...override,
              },
            };
            onOverridesChange(newOverrides);
          }}
          onUpdateRule={(rule) => {
            const newOverrides = [...overrides];
            const oldOverride = newOverrides[i];
            newOverrides[i] = {
              ...newOverrides[i],
              rule: {
                ...oldOverride.rule,
                ...rule,
              },
            };
            onOverridesChange(newOverrides);
          }}
          onDelete={() =>
            onOverridesChange(overrides.filter((r) => rule !== r))
          }
        />
      ))}

      <div className="col-span-1 h-24 rounded-lg border-2 border-dashed border-gray-400 shadow sm:h-24">
        <div className="flex h-full w-full items-center justify-center">
          <Button
            buttonType="ghost"
            className="mt-3 mb-3"
            onClick={() => {
              onOverridesChange([
                ...overrides,
                {
                  rule: {},
                  override: {},
                },
              ]);
            }}
          >
            <PlusIcon />
            <span>{intl.formatMessage(messages.newOverride)}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OverridesSection;
