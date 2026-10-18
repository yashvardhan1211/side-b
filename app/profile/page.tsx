import type { Metadata } from "next";
import ProfileView from "./ProfileView";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your SIDE B stats and recent results.",
};

export default function ProfilePage() {
  return (
    <div className="flex-1">
      <div className="max-w-wide mx-auto px-5 md:px-8 py-10">
        <span className="label-caps block mb-2">SIDE B Profile</span>
        <div className="rule-heavy mb-6" />
        <ProfileView />
      </div>
    </div>
  );
}
