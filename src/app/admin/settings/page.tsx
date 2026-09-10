import { getPlatformSettings } from "./actions";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsAdminPage() {
  const settings = await getPlatformSettings();

  return <SettingsClient initialSettings={settings} />;
}
