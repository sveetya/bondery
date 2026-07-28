import { File, Files, Folder } from "fumadocs-ui/components/files";

/** Monorepo tree for architecture docs. */
export function RepoStructureFiles() {
  return (
    <Files>
      <Folder defaultOpen name="bondery">
        <Folder defaultOpen name="apps">
          <File name="webapp/" />
          <File name="mobile/" />
          <File name="api/" />
          <File name="website/" />
          <File name="chrome-extension/" />
        </Folder>
        <Folder defaultOpen name="packages">
          <File name="db/" />
          <File name="schemas/" />
          <File name="translations/" />
          <File name="helpers/" />
          <File name="emails/" />
          <File name="mantine-next/" />
          <File name="branding/" />
          <File name="vcard/" />
        </Folder>
        <File name="docs/" />
      </Folder>
    </Files>
  );
}
