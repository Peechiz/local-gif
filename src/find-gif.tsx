import { useState, useEffect, useMemo } from "react";
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
  const [metadataLoaded, setMetadataLoaded] = useState(false);

  // Load and cleanup metadata on mount
  useEffect(() => {
    const initMetadata = async () => {
      const cleaned = await cleanupMetadata(files);
      setMetadata(cleaned);
      setMetadataLoaded(true);
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

  // Derive all unique tags for the filter dropdown
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    gifItems.forEach((item) => item.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [metadata]);

  const [columns, setColumns] = useState(5);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Filter GIFs based on selected tag
  const filteredGifs = useMemo(() => {
    if (!selectedTag) return sortedGifs;
    return sortedGifs.filter((gif) => gif.tags.includes(selectedTag));
  }, [sortedGifs, selectedTag]);

  return (
    <Grid
      columns={columns}
      inset={Grid.Inset.Large}
      isLoading={!metadataLoaded}
      searchBarAccessory={
        <>
          <Grid.Dropdown
            tooltip="Grid Item Size"
            storeValue
            onChange={(newValue) => {
              setColumns(parseInt(newValue));
            }}
          >
            <Grid.Dropdown.Item title="Large" value={"3"} />
            <Grid.Dropdown.Item title="Medium" value={"5"} />
            <Grid.Dropdown.Item title="Small" value={"8"} />
          </Grid.Dropdown>
          <Grid.Dropdown
            tooltip="Filter by Tag"
            storeValue
            value={selectedTag || "all"}
            onChange={(newValue) => {
              setSelectedTag(newValue === "all" ? null : newValue);
            }}
          >
            <Grid.Dropdown.Item title="All GIFs" value="all" />
            {allTags.length > 0 && <Grid.Dropdown.Section title="Tags" />}
            {allTags.map((tag) => (
              <Grid.Dropdown.Item key={tag} title={`#${tag}`} value={tag} />
            ))}
          </Grid.Dropdown>
        </>
      }
    >
      {metadataLoaded &&
        (selectedTag ? (
          <Grid.Section title={`GIFs tagged with #${selectedTag}`} subtitle={`${filteredGifs.length} items`}>
            {filteredGifs.map(({ id: file, tags, filePath }) => {
              return (
                <Grid.Item
                  key={filePath}
                  title={file}
                  subtitle={tags.length > 0 ? tags.map((t) => `#${t}`).join(" ") : undefined}
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
          </Grid.Section>
        ) : (
          filteredGifs.map(({ id: file, tags, filePath }) => {
            return (
              <Grid.Item
                key={filePath}
                title={file}
                subtitle={tags.length > 0 ? tags.map((t) => `#${t}`).join(" ") : undefined}
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
          })
        ))}
    </Grid>
  );
}
