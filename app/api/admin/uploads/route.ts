import { adminRoute } from "@/lib/server/admin/http";
import { AdminError } from "@/lib/server/admin/validate";
import { IMAGE_FOLDERS, uploadImage, type ImageFolder } from "@/lib/server/storage";

/**
 * POST /api/admin/uploads, multipart form { file, folder }: stores the image in Supabase Storage
 * and returns { url }. Saving the product, department or offer is what puts the URL in the store.
 */
export const POST = adminRoute(
  async (request) => {
    const form = await request.formData().catch(() => {
      throw new AdminError("Send the image as multipart form data.");
    });
    const file = form.get("file");
    const folder = form.get("folder");
    if (!(file instanceof File)) throw new AdminError("Choose an image to upload.");
    if (!IMAGE_FOLDERS.includes(folder as ImageFolder)) throw new AdminError(`Folder must be one of: ${IMAGE_FOLDERS.join(", ")}.`);
    return { url: await uploadImage(file, folder as ImageFolder) };
  },
  { writes: false },
);
