import * as DiffParser from './diff-parser';
import { FileListRenderer } from './file-list-renderer';
import LineByLineRenderer, { LineByLineRendererConfig, defaultLineByLineRendererConfig } from './line-by-line-renderer';
import SideBySideRenderer, { SideBySideRendererConfig, defaultSideBySideRendererConfig } from './side-by-side-renderer';
import { DiffFile, OutputFormatType } from './types';
import HoganJsUtils, { HoganJsUtilsConfig } from './hoganjs-utils';

export interface Diff2HtmlConfig
  extends DiffParser.DiffParserConfig, LineByLineRendererConfig, SideBySideRendererConfig, HoganJsUtilsConfig {
  outputFormat?: OutputFormatType;
  drawFileList?: boolean;
}

export const defaultDiff2HtmlConfig = {
  ...defaultLineByLineRendererConfig,
  ...defaultSideBySideRendererConfig,
  outputFormat: OutputFormatType.LINE_BY_LINE,
  drawFileList: true,
};

export function parse(diffInput: string, configuration: Diff2HtmlConfig = {}): DiffFile[] {
  return DiffParser.parse(diffInput, { ...defaultDiff2HtmlConfig, ...configuration });
}

export function html(diffInput: string | DiffFile[], configuration: Diff2HtmlConfig = {}): string {
  const config = { ...defaultDiff2HtmlConfig, ...configuration };

  const diffJson = typeof diffInput === 'string' ? DiffParser.parse(diffInput, config) : diffInput;

  const hoganUtils = new HoganJsUtils(config);

  const { colorScheme } = config;
  const fileListRendererConfig = { colorScheme };

  const fileList = config.drawFileList ? new FileListRenderer(hoganUtils, fileListRendererConfig).render(diffJson) : '';

  const renderer =
    config.outputFormat === 'side-by-side'
      ? new SideBySideRenderer(hoganUtils, config)
      : new LineByLineRenderer(hoganUtils, config);

  // render each file independently
  const filesHtml = diffJson.map(file => renderer.render([file]));

  const placeholders = diffJson
    .map((_, i) => `<div class="d2h-virtual-item" data-d2h-index="${i}" style="min-height:32px"></div>`)
    .join('');

  const data = `
<script type="application/json" id="d2h-virtual-data">
${JSON.stringify(filesHtml)}
</script>`;

  return fileList + `<div class="d2h-virtual-container">${placeholders}</div>` + data;
}
