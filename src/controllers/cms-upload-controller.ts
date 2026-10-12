import { z } from "zod";

import {
  deleteManagedImageUrl,
  saveServiceStationImageDataUrl
} from "../services/image-upload";
import type { HandlerContext } from "../utils/http";
import { sendJson } from "../utils/http";
import { sendImageUploadError } from "./auth-controller";

const dataUrlSchema = z.object({
  dataUrl: z.string().min(32)
});

const deleteImageSchema = z.object({
  url: z.string().url()
});

export async function uploadServiceStationImageForCms(context: HandlerContext): Promise<void> {
  const input = dataUrlSchema.parse(context.body);

  try {
    const url = await saveServiceStationImageDataUrl(input.dataUrl);
    sendJson(context.res, 201, { url });
  } catch (error) {
    if (sendImageUploadError(context, error)) {
      return;
    }

    throw error;
  }
}

export async function deleteManagedImageForCms(context: HandlerContext): Promise<void> {
  const input = deleteImageSchema.parse(context.body);
  await deleteManagedImageUrl(input.url);
  sendJson(context.res, 200, { ok: true });
}
