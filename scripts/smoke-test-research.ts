import 'dotenv/config';

const API_KEY = process.env.YDC_API_KEY;
if (!API_KEY) {
  throw new Error('YDC_API_KEY not set in .env');
}

const outputSchema = {
  type: 'object',
  properties: {
    narrative: {
      type: 'string',
      description: 'Markdown narrative with inline [[n]] citation markers referencing sources.',
    },
    key_points: {
      type: 'array',
      items: { type: 'string' },
    },
    risks: {
      type: 'array',
      items: { type: 'string' },
    },
    market_fit_score: {
      type: 'integer',
      description: 'Score 0-100 for how well the market opportunity fits the given investment thesis.',
    },
  },
  required: ['narrative', 'key_points', 'risks', 'market_fit_score'],
  additionalProperties: false,
};

const body = {
  input:
    'Research the market size, growth trends, and tailwinds/headwinds for Anthropic, ' +
    'an AI safety and foundation model company (anthropic.com). ' +
    'Evaluate relative to a Series A investment thesis in the AI-Dev-Tools sector, ' +
    '$2M check size, Balanced risk appetite. Score the market fit relative to this thesis only, ' +
    'never as an absolute/universal verdict.',
  research_effort: 'standard',
  output_schema: outputSchema,
};

async function main() {
  console.log('POST https://api.you.com/v1/research');
  console.log('Request body:', JSON.stringify(body, null, 2));

  const res = await fetch('https://api.you.com/v1/research', {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  console.log('\nStatus:', res.status, res.statusText);

  const text = await res.text();
  console.log('\nRaw response body:');
  console.log(text);

  try {
    const json = JSON.parse(text);
    console.log('\nParsed response (util.inspect deep):');
    console.dir(json, { depth: null });

    if (json.output?.content) {
      console.log('\ntypeof output.content:', typeof json.output.content);
      if (typeof json.output.content === 'string') {
        console.log('\nAttempting to JSON.parse output.content...');
        try {
          const parsedContent = JSON.parse(json.output.content);
          console.log('output.content parses as JSON:');
          console.dir(parsedContent, { depth: null });
        } catch (e) {
          console.log('output.content is NOT valid JSON on its own (likely markdown):', (e as Error).message);
        }
      }
    }
    if (json.output?.sources) {
      console.log('\noutput.sources count:', json.output.sources.length);
    }
  } catch (e) {
    console.log('\nResponse body is not valid JSON:', (e as Error).message);
  }
}

main().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
