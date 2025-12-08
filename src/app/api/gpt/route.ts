import OpenAI from "openai";
import { NextResponse } from "next/server";
import materials from "../../assets/materials.json";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { text, type, model = "gpt-4o-mini" } = await req.json();

    console.log("Received text:", text);

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: 'Request body must include a `text` string.' }, { status: 400 });
    }

    if (!type || (type !== "body" && type !== "hand")) {
      return NextResponse.json({ error: 'Request body must include a valid `type` ("body" or "hand").' }, { status: 400 });
    }

    const systemPrompt = `You are an assistant that converts a short piano posture analysis summary into a structured overall analysis.
    Given an input summary describing percentages and issues, produce a JSON object with the exact keys:

    - "classification": one of "Excellent", "Good", or "Needs Improvement";
    - "feedbacks": an array of concise actionable feedback strings (3-6 items) tailored to the identified issues;
    - "materials": an array of recommended materials drawn only from the provided materials list. Each material item must include the fields: 'type', 'title', 'description', 'link', 'thumbnail'.

    You are classifying and providing feedback specifically for ${type} posture, every class that is not Correct is bad.
    Disconsider any % where no pose is detected, it means that the system failed to detect that pose so don't mention it.
    For Excellent classification, provide at least 1 positive feedback, but you dont need to provide materials.
    Classify as Excellent if issues are under 15%, Good if between 15%-40%, and Needs Improvement if over 40%.
    Select 1 to 6 relevant materials from the provided list. Do not invent materials. Keep feedback direct and actionable. ONLY output valid JSON and nothing else.`;

    const userPrompt = `Input summary:\n${text}\n\nAvailable materials (JSON):\n${JSON.stringify(materials)}`;

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 800,
    });

    const content = completion.choices?.[0]?.message?.content ?? "";

    let parsed: any = null;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      // try to extract first JSON object from the output
      const match = String(content).match(/(\{[\s\S]*\})/);
      if (match) {
        try {
          parsed = JSON.parse(match[1]);
        } catch (e) {
          return NextResponse.json({ error: "Failed to parse model JSON output", raw: content }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: "Model did not return JSON", raw: content }, { status: 500 });
      }
    }

    // Basic schema validation
    if (
      !parsed ||
      (parsed.classification !== "Excellent" && parsed.classification !== "Good" && parsed.classification !== "Needs Improvement") ||
      !Array.isArray(parsed.feedbacks) ||
      !Array.isArray(parsed.materials)
    ) {
      return NextResponse.json({ error: "Model returned invalid schema", parsed }, { status: 500 });
    }

    // Ensure materials returned are from the provided list (by title match). If model returned full objects, trust them but prefer filtering.
    const availableTitles = new Set((materials as any[]).map((m) => m.title));
    parsed.materials = (parsed.materials || []).filter((m: any) => {
      return m && typeof m.title === "string" && availableTitles.has(m.title);
    });

    console.log("Parsed overall analysis:", parsed);

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
  }
}