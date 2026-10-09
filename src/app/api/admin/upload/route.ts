import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_BUCKETS = new Set(["ads", "sponsors", "events", "djs", "merch", "blog-media"]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    let bucket = (formData.get("bucket") as string) || "ads";

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo." }, { status: 400 });
    }

    if (!ALLOWED_BUCKETS.has(bucket)) {
      bucket = "ads";
    }

    const adminDb = getAdminClient();

    // Extraer extensión y generar nombre único
    const originalName = file.name || "upload.jpg";
    const fileExt = originalName.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${Math.random().toString(36).substring(2, 12)}_${Date.now()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = file.type || "image/jpeg";

    // Subir con privilegios de administrador (bypasea RLS)
    const { error: uploadError } = await adminDb.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`Error uploading to bucket ${bucket}:`, uploadError);
      return NextResponse.json(
        { error: `Error en almacenamiento: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const { data: { publicUrl } } = adminDb.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      bucket,
      fileName,
    });
  } catch (error: any) {
    console.error("Error en API de subida de imágenes:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno del servidor al procesar el archivo." },
      { status: 500 }
    );
  }
}
