# Independent avatar actions

Updated user requirements: the owner's avatar opens exactly two options, View avatar and Change photo. Change opens the native file chooser and saves independently. The image viewer offers an owner-only Remove avatar action that clears avatarUrl and restores the existing initial-letter fallback. Other members' avatars directly open the viewer. Profile editing has no avatar controls, and personal links have no icons.

Implement separate ProfileAvatar and profile editing components. Preserve the shared FilePicker for the system chooser. Upload and removal actions derive their target from the active session and modify only avatarUrl. Profile updates must never overwrite an independently changed avatar, including stale requests. Refresh profile, directory and homepage after avatar mutations.

Validation: targeted tests cover authorization, avatar-only persistence, failed uploads, inactive accounts, removal and stale profile saves. Browser inspection covers the two-option menu, system file chooser, invalid file handling, visitor viewing, removal visibility, no file control in profile editing, and text-only personal links.
