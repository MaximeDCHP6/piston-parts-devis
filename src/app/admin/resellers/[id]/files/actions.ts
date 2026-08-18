"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ResellerFileType } from "@/lib/types/database";

export interface UploadFileState {
  error: string | null;
}

export async function uploadResellerFile(
  resellerId: string,
  _prevState: UploadFileState,
  formData: FormData,
): Promise<UploadFileState> {
  const file = formData.get("file");
  const label = String(formData.get("label") ?? "").trim();
  const type = (String(formData.get("type") ?? "other")) as ResellerFileType;

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Sélectionnez un fichier." };
  }

  const supabase = await createClient();
  const path = `${resellerId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage.from("reseller-files").upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("reseller_files").insert({
    reseller_id: resellerId,
    type,
    file_url: path,
    label: label || file.name,
  });
  if (error) return { error: error.message };

  revalidatePath(`/admin/resellers/${resellerId}/files`);
  redirect(`/admin/resellers/${resellerId}/files`);
}

export async function deleteResellerFile(formData: FormData) {
  const id = String(formData.get("id"));
  const resellerId = String(formData.get("resellerId"));
  const path = String(formData.get("path"));

  const supabase = await createClient();
  await supabase.storage.from("reseller-files").remove([path]);
  await supabase.from("reseller_files").delete().eq("id", id);

  revalidatePath(`/admin/resellers/${resellerId}/files`);
}
