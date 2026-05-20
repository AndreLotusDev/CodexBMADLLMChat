import { FC } from 'react'
import ProfileList from '@/components/settings/ProfileList'

const SettingsScreen: FC = () => {
  return (
    <div className="bg-background text-foreground p-6">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <section className="mt-4">
        <h2 className="text-lg font-semibold mb-3">Saved Connection Profiles</h2>
        <ProfileList />
      </section>
    </div>
  )
}

export default SettingsScreen
