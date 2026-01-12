import { useState, useEffect } from "react";
import { ActionPanel, Action, Grid, getPreferenceValues, Clipboard } from "@raycast/api";
import fs from "fs";
import path from "node:path";
import { useFrecencySorting } from "@raycast/utils";
import { GifMetadata, loadMetadata, cleanupMetadata } from "./metadata";
import TagEditForm from "./TagEditForm";

interface GifItem {
  id: string;
  tags: string[];
  filePath: string;
}

export default function Command() {
  const { gifFolder } = getPreferenceValues<Preferences>();

  const files =
    gifFolder && fs.existsSync(gifFolder)
      ? fs.readdirSync(gifFolder).filter((f) => f.toLowerCase().endsWith(".gif"))
      : [];

  const [metadata, setMetadata] = useState<GifMetadata>({});

  // Load and cleanup metadata on mount
  useEffect(() => {
    const initMetadata = async () => {
      const cleaned = await cleanupMetadata(files);
      setMetadata(cleaned);
    };
    initMetadata();
  }, [gifFolder]);

  // Transform files into GifItem objects with tags
  const gifItems: GifItem[] = files.map((f) => ({
    id: f,
    tags: metadata[f]?.tags || [],
    filePath: path.join(gifFolder, f),
  }));

  const { data: sortedGifs } = useFrecencySorting(gifItems, {
    key: (item) => item.id,
  });

  const [columns, setColumns] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Grid
      columns={columns}
      inset={Grid.Inset.Large}
      isLoading={isLoading}
      searchBarAccessory={
        <Grid.Dropdown
          tooltip="Grid Item Size"
          storeValue
          onChange={(newValue) => {
            setColumns(parseInt(newValue));
            setIsLoading(false);
          }}
        >
          <Grid.Dropdown.Item title="Large" value={"3"} />
          <Grid.Dropdown.Item title="Medium" value={"5"} />
          <Grid.Dropdown.Item title="Small" value={"8"} />
        </Grid.Dropdown>
      }
    >
      {!isLoading &&
        sortedGifs.map(({ id: file, tags, filePath }) => {
          return (
            <Grid.Item
              key={filePath}
              title={file}
              keywords={tags}
              content={{ value: { source: filePath }, tooltip: file }}
              quickLook={{ path: filePath, name: file }}
              actions={
                <ActionPanel>
                  <Action
                    title="Copy GIF"
                    onAction={async () => {
                      await Clipboard.copy({ file: filePath });
                    }}
                  />
                  <Action.Push
                    title="Edit Tags"
                    shortcut={{ modifiers: ["cmd"], key: "t" }}
                    target={
                      <TagEditForm
                        filename={file}
                        currentTags={tags}
                        onSave={async () => {
                          const updated = await loadMetadata();
                          setMetadata(updated);
                        }}
                      />
                    }
                  />
                </ActionPanel>
              }
            />
          );
        })}
    </Grid>
  );
}
