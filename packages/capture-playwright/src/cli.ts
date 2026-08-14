#!/usr/bin/env node
import { cac } from 'cac';
import { resolve } from 'node:path';
import { loadScenarioFile } from './scenario/parser';
import { executeScenario } from './scenario/executor';
import { launchFocalSession } from './runner/session';

const cli = cac('focaldom');

cli
  .command('capture <scenario>', 'Capture deterministic video frames and DOM event logs from a scenario file')
  .option('-o, --output <dir>', 'Output directory for captured artifacts', { default: './recordings/session' })
  .option('--fps <fps>', 'Frames per second', { default: 60 })
  .option('--headless <headless>', 'Run browser in headless mode', { default: true })
  .option('--width <width>', 'Viewport width', { default: 1920 })
  .option('--height <height>', 'Viewport height', { default: 1080 })
  .action(async (scenarioPath: string, options: { output: string; fps: number; headless: boolean; width: number; height: number }) => {
    try {
      console.log(`\n🎯 FocalDOM Capture CLI v0.1.0`);
      console.log(`📖 Loading scenario: ${scenarioPath}`);

      const absoluteScenarioPath = resolve(process.cwd(), scenarioPath);
      const scenario = loadScenarioFile(absoluteScenarioPath);

      console.log(`🎬 Running scenario: "${scenario.name}" (${scenario.steps.length} steps)`);

      const outputDir = resolve(process.cwd(), options.output);
      const fps = Number(options.fps) || scenario.fps || 60;
      const viewport = {
        width: Number(options.width) || scenario.viewport?.width || 1920,
        height: Number(options.height) || scenario.viewport?.height || 1080,
      };

      const session = await launchFocalSession({
        fps,
        viewport,
        headless: Boolean(options.headless) && scenario.headless !== false,
      });

      console.log(`⚡ Executing scenario steps at ${fps} FPS...`);
      await executeScenario(scenario, session);

      console.log(`💾 Finalizing artifacts into: ${outputDir}`);
      const result = await session.finalize(outputDir);

      console.log(`\n✅ Capture completed successfully!`);
      console.log(`   • Frames captured: ${result.frameCount}`);
      console.log(`   • Events log:      ${result.eventsPath}`);
      console.log(`   • Manifest:        ${result.manifestPath}\n`);
    } catch (err: unknown) {
      console.error(`\n❌ Capture failed: ${(err as Error).message}\n`);
      process.exit(1);
    }
  });

cli.help();
cli.version('0.1.0');
cli.parse();
