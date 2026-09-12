# Liquid to Handlebars AI Converter

An AI-assisted tool for converting complete HTML email templates containing Liquid syntax into Handlebars while preserving the surrounding HTML structure.

## What It Does

- Converts Liquid template syntax to Handlebars
- Preserves HTML structure, CSS, copy, URLs, attributes, and comments
- Removes unsupported Liquid content blocks based on defined conversion rules
- Surfaces meaningful conversion changes for review
- Flags referenced data variables for manual verification
- Handles compound conditions such as `and` and `or`
- Includes loading and error states for a cleaner review workflow

## Tech Stack

- Next.js
- React
- TypeScript
- OpenAI API
- Zod
- Tailwind CSS

## Why I Built It

Template migrations often involve repetitive syntax conversion alongside manual review of data variables, logic, and content structure.

I built this project to explore how AI can assist with that workflow while keeping human verification in the loop. Rather than returning only converted code, the tool also surfaces changes and warnings so the output can be reviewed more easily.

## How It Works

1. Paste a complete HTML template containing Liquid.
2. The application sends the template to a server-side conversion endpoint.
3. The AI converts the Liquid syntax according to defined transformation rules.
4. The response is validated with Zod and returned as:
   - converted template
   - changes
   - warnings
5. The user reviews and copies the resulting Handlebars template.

## Example

Liquid:

```HTML with liquid
<!DOCTYPE html>
<html>
  <body>
    <table>
      <tr>
        <td>
          {{content_blocks.${your_content_block}}}
          {% if (and customer customer.first_name) %}
            Hello {{ customer.first_name }}!
          {% else %}
            Hello there!
          {% endif %}
        </td>
      </tr>
    </table>
  </body>
</html>
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


