"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { uploadParishMedia, type ParishMediaUploadState } from "@/features/parish/media/actions";

const initialState: ParishMediaUploadState = { error: null };

async function compressImage(file: File) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new window.Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Could not read the selected image."));
      nextImage.src = imageUrl;
    });

    const maxDimension = 1440;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not prepare image compression.");
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => {
          if (value) {
            resolve(value);
            return;
          }

          reject(new Error("Could not compress the selected image."));
        },
        "image/webp",
        0.58
      );
    });

    const nextName = `${file.name.replace(/\.[^.]+$/, "")}.webp`;
    return new File([blob], nextName, { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function MediaUploadForm() {
  const [state, action, pending] = useActionState(uploadParishMedia, initialState);

  return (
    <form
      action={async (formData) => {
        const files = formData
          .getAll("file")
          .filter((file): file is File => file instanceof File && file.size > 0);

        if (files.length > 0) {
          formData.delete("file");
          for (const file of files) {
            formData.append("file", await compressImage(file));
          }
        }

        action(formData);
      }}
      className="space-y-6"
    >
      {state.error ? (
        <div className="rounded-md bg-error-container p-3 text-sm text-on-error-container">{state.error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Image title</span>
          <input
            name="title"
            placeholder="Youth outreach, parish hall, food distribution"
            className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          />
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-on-surface">Capture date</span>
          <input
            name="capturedOn"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
          />
        </label>
      </div>

      <label className="space-y-2">
        <span className="block text-sm font-medium text-on-surface">Image file</span>
        <input
          name="file"
          type="file"
          accept="image/*"
          multiple
          className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
        />
      </label>

      <Button type="submit" disabled={pending}>
        {pending ? "Uploading..." : "Upload image(s)"}
      </Button>
    </form>
  );
}
