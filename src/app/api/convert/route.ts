import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";

const ConversionResult = z.object({
    template: z.string(),
    warnings: z.array(z.string()),
    errors: z.array(z.string()),
    changes: z.array(z.string()),
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
                content: `
                You convert complete HTML email templates containing Liquid into HTML email templates containing Handlebars.

                Rules:
                GENERAL RULES
                -Preserve the complete HTML document.
                -Preserve HTML structure, CSS, text, URLs, attributes, and comments unless a change is required for the conversion.
                -Assume Liquid syntax is convertible to Handlebars unless a rule below explicitly says otherwise.
                -Convert Liquid template syntax to the closest semantically equivalent Handlebars syntax.
                -Use standard Handlebars syntax and supported helpers as needed.
                -Do not treat a construct as unsupported simply because an example for it is not included in these rules.
                -Do not add an error for normal Liquid syntax that can reasonably be represented in Handlebars.
                -Do not invent variables, values, content, or behavior.
                -Only preserve the original Liquid syntax and add an entry to the errors array when:
                    1. a rule below explicitly says the construct is unsupported, or
                    2. converting it would require inventing behavior that cannot be represented reliably in Handlebars.
                -Record meaningful conversions in the changes array.

                SPECIFIC RULES
                -Remove all Liquid content blocks from the converted template. Do not convert or preserve them. For every removed Liquid content block, add an entry to the changes array describing what was removed.
                -Identify all data variables and attributes referenced in the source template. Do not include content blocks. 
                Some data will look like below:
                custom_attribute.$ {TEST_VARIABLE}.product_access
                if it does then always remove the "custom_attribute." string and make sure to also remove the double brackets if it is inside the code already like so: 
                Example: 
                {% if {{custom_attribute.$ {TEST_VARIABLE}.product_access}} == "EM + DP" %}
                becomes
                {{#ifEq TEST_VARIABLE.product_access "EM + DP"}}
                Add each unique data variable or attribute to the warnings array with the message: "Verify data variable: [variable name]". 
                This warning is a manual verification reminder and does not indicate that the variable is incorrect.
                -Convert Liquid compound conditions using "and" and "or" to the Handlebars "and" and "or" helpers respectively. Preserve compound conditions rather than converting them into nested Handlebars "if" blocks.
                Example:
                {% if customer or customer.first_name %}
                becomes
                {{#if (or customer customer.first_name)}}
                -There is no native {{else if}} helper. You can achieve this behavior by a standard {{else}} block with a nested {{#if}} helper.
                -Convert Liquid assign statements using the Handlebars assign block helper.
                Example:
                {% assign test = "value" %}
                becomes
                {{#assign "test"}}value{{/assign}}
                Example:
                {% assign firstName = customer.first_name %}
                becomes
                {{#assign "firstName"}}{{customer.first_name}}{{/assign}}
                -For every Handlebars block opened with {{#helperName ...}}, close it with {{/helperName}}.
                -Do not use the helper or subexpression "notEq".
                Use "neq" for not-equal comparisons.
                Example:
                Incorrect:
                {{#if (notEq customer.status "active")}}
                Correct:
                {{#if (neq customer.status "active")}}
                -Do not compare values directly against null using eq or neq.
                In this Handlebars environment, null may be interpreted as a literal string rather than a null value.
                -For checking whether a value is missing or empty, prefer a truthiness check or supported empty-value helper such as defaultIfEmpty, depending on the source logic.
                Example:
                Instead of:
                {{#if (neq customer.value null)}}
                Prefer:
                {{#if customer.value}}

                ERROR RULES
                -If the assigned value contains a Liquid expression or filter that cannot be safely converted, preserve the original Liquid assign statement and add an error instead of guessing.
                Add an entry to the errors array identifying the unsupported construct.
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
        errors: result.errors,
        changes: result.changes,
    });
}