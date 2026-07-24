import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { runResearchLeg } from '../lib/youcom';
import { buildMemo } from '../lib/scoring';
import type { CompanyInput, LegResult, ThesisConfig } from '../lib/types';

const company: CompanyInput = {
  name: 'Anthropic',
  website: 'https://www.anthropic.com',
  founders: ['Dario Amodei', 'Daniela Amodei'],
};

const thesis: ThesisConfig = {
  stage: 'Series A',
  sector: 'AI-Dev-Tools',
  checkSize: 2_000_000,
  riskAppetite: 'Balanced',
};

async function main() {
  console.log(`Running all 3 legs for ${company.name}...`);

  const legOrder: LegResult['leg'][] = ['market', 'founders', 'competitive'];
  const legs: LegResult[] = [];

  for (const leg of legOrder) {
    console.log(`  -> ${leg} leg...`);
    const start = Date.now();
    const result = await runResearchLeg(leg, company, thesis);
    const seconds = ((Date.now() - start) / 1000).toFixed(1);
    if (result.error) {
      console.log(`     FAILED after ${seconds}s: ${result.error}`);
    } else {
      console.log(`     done in ${seconds}s, score=${result.score}, sources=${result.sources.length}`);
    }
    legs.push(result);
  }

  const memo = buildMemo(company, thesis, legs);

  console.log('\nComposite score:', memo.compositeScore);
  console.log('Recommendation:', memo.recommendation);

  const outPath = new URL('../fixtures/demo-stub.json', import.meta.url);
  writeFileSync(outPath, JSON.stringify(memo, null, 2) + '\n');
  console.log(`\nWrote ${outPath.pathname}`);
}

main().catch((err) => {
  console.error('build-demo-stub failed:', err);
  process.exit(1);
});
