import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

const ConversionResult = z.object({
    template: z.string(),
    warnings: z.array(z.string()),
    changes: z.array(z.string())
});

export async function POST(request: Request) {
    if (!process.env.OPENAI_API_KEY) {
        return Response.json(
          { error: "OpenAI API configuration is missing." },
          { status: 500 }
        );
      }
    
    const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    });

    const body = await request.json();

    if (!body.template?.trim()) {
        return Response.json(
            { error: "Template is required." },
            { status: 400 }
        );
    }

    const response = await openai.responses.parse({
        model: process.env.OPENAI_MODEL ?? "gpt-5.6-luna",
        input: [
            {
                role: "system",
                content: `You convert complete HTML email templates containing Liquid into HTML email templates containing Handlebars. 
                Rules: 
                -Preserve the complete HTML document. 
                -Preserve HTML structure, CSS, text, URLs, attributes, and comments unless a change is required for the conversion. 
                -Convert Liquid template syntax to equivalent Handlebars syntax. 
                -Do not invent variables, values, or content. 
                -If a construct cannot be converted safely, preserve it and add a warning. 
                -Record meaningful conversions in changes.
                -Remove all Liquid content blocks from the converted template. Do not convert or preserve them. For every removed Liquid content block, add an entry to the changes array describing what was removed.
                -Identify all data variables and attributes referenced in the source template. Do not include content blocks. Add each unique data variable or attribute to the warnings array with the message: "Verify data variable: [variable name]". This warning is a manual verification reminder and does not indicate that the variable is incorrect.
                -Convert Liquid compound conditions using "and" and "or" to the Handlebars "and" and "or" helper respectively. Preserve compound conditions rather than converting them into nested Handlebars "if" blocks.
                Example: {% if customer and customer.first_name %} becomes {{#if (and customer customer.first_name)}}.
                {% if customer or customer.first_name %} becomes {{#if (or customer customer.first_name)}}.
                -There is no native {{else if}} helper. You can achieve this behavior by chaing a standard {{else}} block with a nested {{#if}} helper.
                `,
            },
            {
                role: "user",
                content: body.template,
            },
        ],
        text: {
            format: zodTextFormat(ConversionResult, "conversion_result"),
        },
    });

    const result = response.output_parsed;

    if (!result) {
        return Response.json(
            { error: "Conversion failed." },
            { status: 500 }
        )
    }
    return Response.json({
        template: result.template,
        warnings: result.warnings,
        changes: result.changes,
    });
}