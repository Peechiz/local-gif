import { useState } from "react";
import { ActionPanel, Action, Grid, getPreferenceValues } from "@raycast/api";
import fs from 'fs'
import path from "node:path";
import { useFrecencySorting } from "@raycast/utils";

export default function Command() {
  const { gifFolder } = getPreferenceValues<Preferences>();

  const files =
    gifFolder && fs.existsSync(gifFolder)
      ? fs.readdirSync(gifFolder).filter((f) => f.toLowerCase().endsWith(".gif"))
      : [];

  const { data: sortedGifs } = useFrecencySorting(files.map(f => ({ id: f})))

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
      {!isLoading && sortedGifs.map(({ id: file }) => {
        const filePath = path.join(gifFolder, file);
        return (
          <Grid.Item
            key={filePath}
            title={file}
            content={{ value: { source: filePath }, tooltip: file}}
            quickLook={{ path: filePath, name: file }} // lets user Quick Look (play) the GIF
            actions={
              <ActionPanel>
                <Action.CopyToClipboard content={filePath} />
              </ActionPanel>
            }
          />
        );
      })}
    </Grid>
  );
}
