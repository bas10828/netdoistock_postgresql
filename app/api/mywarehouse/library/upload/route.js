import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const model = formData.get("model");
    const file = formData.get("file");

    if (!model || !file) {
      return NextResponse.json({ error: "Missing model or file" }, { status: 400 });
    }

    // sanitize model name for use as filename
    const safeName = model.replace(/[/\\?%*:|"<>]/g, "_");
    const filename = `${safeName}.png`;
    const dir = path.join(process.cwd(), "public", "devicepic");

    await mkdir(dir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(path.join(dir, filename), Buffer.from(bytes));

    return NextResponse.json({ path: `/devicepic/${filename}` }, { status: 200 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
