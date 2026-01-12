import { Action, ActionPanel, Form, showToast, Toast, useNavigation } from "@raycast/api";
import { useState } from "react";
import { sanitizeTags, updateFileTags } from "./metadata";

interface TagEditFormProps {
  filename: string;
  currentTags: string[];
  onSave: (tags: string[]) => Promise<void>;
}

export default function TagEditForm({ filename, currentTags, onSave }: TagEditFormProps) {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values: { tags: string }) => {
    setIsLoading(true);

    try {
      const newTags = sanitizeTags(values.tags);

      await updateFileTags(filename, newTags);
      await onSave(newTags);

      await showToast({
        style: Toast.Style.Success,
        title: "Tags updated",
        message: `${newTags.length} tag${newTags.length === 1 ? "" : "s"} saved for ${filename}`,
      });

      pop();
    } catch (error) {
      console.error("Failed to update tags:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to update tags",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Tags" onSubmit={handleSubmit} />
          <Action title="Cancel" onAction={() => pop()} />
        </ActionPanel>
      }
    >
      <Form.Description title="File" text={filename} />
      <Form.Description title="Current Tags" text={currentTags.length > 0 ? currentTags.join(", ") : "No tags"} />
      <Form.TextField
        id="tags"
        title="Tags"
        placeholder="funny, reaction, animals"
        defaultValue={currentTags.join(", ")}
        info="Enter comma-separated tags. Tags will be converted to lowercase and duplicates removed."
      />
    </Form>
  );
}
