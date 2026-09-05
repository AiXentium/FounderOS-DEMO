import { OpenPageBuilder } from '@/components/OpenPageBuilder';

export const dynamic = 'force-dynamic';

export default function OpenPageSettingsPage() {
  return <div className="w-full px-4 py-5 md:px-6"><OpenPageBuilder initialView="settings" /></div>;
}
