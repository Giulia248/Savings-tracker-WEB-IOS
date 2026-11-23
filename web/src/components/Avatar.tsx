import type { Profile } from "../db/db";

export function Avatar({ profile, size = 40 }: { profile: Profile; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.42 };
  if (profile.avatar) {
    return <img className="avatar" src={profile.avatar} alt="" style={style} />;
  }
  return (
    <span className="avatar avatar--initial" style={style} aria-hidden="true">
      {profile.displayName.charAt(0).toUpperCase()}
    </span>
  );
}
