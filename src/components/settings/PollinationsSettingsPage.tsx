import { BasicPage, FormRow, NotUsingAlert } from './common';
import { TextInput } from '@/components/textInput';
import { config, updateConfig } from "@/utils/config";

export function PollinationsSettings({
  pollinationsApiKey,
  setPollinationsApiKey,
  pollinationsUrl,
  setPollinationsUrl,
  pollinationsModel,
  setPollinationsModel,
  setSettingsUpdated,
}: {
  pollinationsApiKey: string;
  setPollinationsApiKey: (key: string) => void;
  pollinationsUrl: string;
  setPollinationsUrl: (url: string) => void;
  pollinationsModel: string;
  setPollinationsModel: (model: string) => void;
  setSettingsUpdated: (updated: boolean) => void;
}) {
  const description = <>Configure Pollinations.AI settings. You can get an API key from <a href="https://pollinations.ai">https://pollinations.ai</a></>;

  return (
    <BasicPage
      title="Pollinations.AI Settings"
      description={description}
    >
      { config("chatbot_backend") !== "pollinations" && (
        <NotUsingAlert>
          You are not currently using Pollinations.AI as your ChatBot backend. These settings will not be used.
        </NotUsingAlert>
      ) }
      <ul role="list" className="divide-y divide-gray-100 max-w-xs">
        <li className="py-4">
          <FormRow label="Pollinations.AI API Key">
            <TextInput
              value={pollinationsApiKey}
              onChange={(event: React.ChangeEvent<any>) => {
                setPollinationsApiKey(event.target.value);
                updateConfig("pollinations_apikey", event.target.value);
                setSettingsUpdated(true);
              }}
            />
          </FormRow>
        </li>
        <li className="py-4">
          <FormRow label="Pollinations.AI URL">
            <TextInput
              value={pollinationsUrl}
              onChange={(event: React.ChangeEvent<any>) => {
                setPollinationsUrl(event.target.value);
                updateConfig("pollinations_url", event.target.value);
                setSettingsUpdated(true);
              }}
            />
          </FormRow>
        </li>
        <li className="py-4">
          <FormRow label="Pollinations.AI Model">
            <TextInput
              value={pollinationsModel}
              onChange={(event: React.ChangeEvent<any>) => {
                setPollinationsModel(event.target.value);
                updateConfig("pollinations_model", event.target.value);
                setSettingsUpdated(true);
              }}
            />
          </FormRow>
        </li>
      </ul>
    </BasicPage>
  );
}