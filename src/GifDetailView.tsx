import { Detail, ActionPanel, Action, Clipboard } from "@raycast/api";
import TagEditForm from "./TagEditForm";

interface GifDetailViewProps {
  filename: string;
  filePath: string;
  tags: string[];
  onTagsUpdated: () => void;
}

export default function GifDetailView({ filename, filePath, tags, onTagsUpdated }: GifDetailViewProps) {
  const markdown = `# ${filename}\n\n<img src="${filePath}" alt="GIF" width="400" />`;

  return (
    <Detail
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Filename" text={filename} />
          {tags.length > 0 && (
            <Detail.Metadata.TagList title="Tags">
              {tags.map((tag) => (
                <Detail.Metadata.TagList.Item key={tag} text={tag} />
              ))}
            </Detail.Metadata.TagList>
          )}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action
            title="Copy GIF"
            onAction={async () => {
              await Clipboard.copy({ file: filePath });
            }}
          />
          <Action.CopyToClipboard title="Copy File Path" content={filePath} />
          <Action.Push
            title="Edit Tags"
            shortcut={{ modifiers: ["cmd"], key: "t" }}
            target={<TagEditForm filename={filename} currentTags={tags} onSave={onTagsUpdated} />}
          />
        </ActionPanel>
      }
    />
  );
}
